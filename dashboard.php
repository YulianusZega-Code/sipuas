<?php
/**
 * GURU DASHBOARD API - FINAL FIX
 * File: backend/api/guru/dashboard.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$guru_id = isset($_GET['guru_id']) ? $_GET['guru_id'] : null;
$semester = isset($_GET['semester']) ? $_GET['semester'] : null;

if (!$guru_id || !$semester) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Parameter guru_id dan semester diperlukan"
    ]);
    exit;
}

try {
    // ===== 1. SUMMARY DATA =====
    $query = "SELECT 
        COUNT(DISTINCT sr.id) as total_responden,
        COUNT(DISTINCT sr.siswa_id) as total_siswa,
        AVG(sd.nilai) as rata_rata_keseluruhan,
        
        AVG(CASE WHEN ps.aspek_id = 1 THEN sd.nilai END) as aspek_1,
        AVG(CASE WHEN ps.aspek_id = 2 THEN sd.nilai END) as aspek_2,
        AVG(CASE WHEN ps.aspek_id = 3 THEN sd.nilai END) as aspek_3,
        AVG(CASE WHEN ps.aspek_id = 4 THEN sd.nilai END) as aspek_4,
        AVG(CASE WHEN ps.aspek_id = 5 THEN sd.nilai END) as aspek_5
        
        FROM survey_response sr
        JOIN survey_detail sd ON sr.id = sd.survey_response_id
        JOIN pertanyaan_survey ps ON sd.pertanyaan_id = ps.id
        WHERE sr.guru_id = :guru_id AND sr.semester = :semester";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':guru_id', $guru_id);
    $stmt->bindParam(':semester', $semester);
    $stmt->execute();
    
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Format numbers
    if ($summary) {
        $summary['rata_rata_keseluruhan'] = $summary['rata_rata_keseluruhan'] ? 
            number_format((float)$summary['rata_rata_keseluruhan'], 2) : '0.00';
        $summary['aspek_1'] = $summary['aspek_1'] ? number_format((float)$summary['aspek_1'], 2) : '0.00';
        $summary['aspek_2'] = $summary['aspek_2'] ? number_format((float)$summary['aspek_2'], 2) : '0.00';
        $summary['aspek_3'] = $summary['aspek_3'] ? number_format((float)$summary['aspek_3'], 2) : '0.00';
        $summary['aspek_4'] = $summary['aspek_4'] ? number_format((float)$summary['aspek_4'], 2) : '0.00';
        $summary['aspek_5'] = $summary['aspek_5'] ? number_format((float)$summary['aspek_5'], 2) : '0.00';
        
        // TAMBAHAN: Hitung skor tertinggi
        $aspek_scores = [
            'aspek_1' => (float)$summary['aspek_1'],
            'aspek_2' => (float)$summary['aspek_2'],
            'aspek_3' => (float)$summary['aspek_3'],
            'aspek_4' => (float)$summary['aspek_4'],
            'aspek_5' => (float)$summary['aspek_5']
        ];
        
        $aspek_names = [
            'aspek_1' => 'Penguasaan Materi',
            'aspek_2' => 'Metode Pembelajaran',
            'aspek_3' => 'Kedisiplinan',
            'aspek_4' => 'Komunikasi',
            'aspek_5' => 'Motivasi & Inspirasi'
        ];
        
        $max_score = max($aspek_scores);
        $max_key = array_search($max_score, $aspek_scores);
        
        $summary['skor_tertinggi'] = number_format($max_score, 2);
        $summary['aspek_tertinggi'] = $aspek_names[$max_key];
    }
    
    // Get nama aspek
    $query = "SELECT id, nama_aspek FROM aspek_penilaian ORDER BY urutan";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $aspek_list = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // ===== 2. DETAIL PER KELAS (FIXED - Filter per kelas siswa) =====
    $query = "SELECT 
        k.nama_kelas,
        mp.nama_mapel,
        COUNT(DISTINCT sr.id) as jumlah_responden,
        AVG(sd.nilai) as rata_rata,
        
        AVG(CASE WHEN ps.aspek_id = 1 THEN sd.nilai END) as aspek_1,
        AVG(CASE WHEN ps.aspek_id = 2 THEN sd.nilai END) as aspek_2,
        AVG(CASE WHEN ps.aspek_id = 3 THEN sd.nilai END) as aspek_3,
        AVG(CASE WHEN ps.aspek_id = 4 THEN sd.nilai END) as aspek_4,
        AVG(CASE WHEN ps.aspek_id = 5 THEN sd.nilai END) as aspek_5
        
        FROM penugasan p
        JOIN kelas k ON p.kelas_id = k.id
        JOIN mata_pelajaran mp ON p.mata_pelajaran_id = mp.id
        
        -- PERBAIKAN: Join ke siswa untuk filter kelas yang benar
        LEFT JOIN siswa s ON s.kelas_id = k.id
        LEFT JOIN survey_response sr ON sr.siswa_id = s.id 
            AND sr.guru_id = p.guru_id 
            AND sr.semester = p.semester
        LEFT JOIN survey_detail sd ON sr.id = sd.survey_response_id
        LEFT JOIN pertanyaan_survey ps ON sd.pertanyaan_id = ps.id
        
        WHERE p.guru_id = :guru_id AND p.semester = :semester
        GROUP BY k.id, k.nama_kelas, mp.nama_mapel
        ORDER BY k.nama_kelas";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':guru_id', $guru_id);
    $stmt->bindParam(':semester', $semester);
    $stmt->execute();
    
    $detail_per_kelas = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['rata_rata'] = $row['rata_rata'] ? number_format((float)$row['rata_rata'], 2) : '0.00';
        $row['aspek_1'] = $row['aspek_1'] ? number_format((float)$row['aspek_1'], 2) : '0.00';
        $row['aspek_2'] = $row['aspek_2'] ? number_format((float)$row['aspek_2'], 2) : '0.00';
        $row['aspek_3'] = $row['aspek_3'] ? number_format((float)$row['aspek_3'], 2) : '0.00';
        $row['aspek_4'] = $row['aspek_4'] ? number_format((float)$row['aspek_4'], 2) : '0.00';
        $row['aspek_5'] = $row['aspek_5'] ? number_format((float)$row['aspek_5'], 2) : '0.00';
        $detail_per_kelas[] = $row;
    }
    
    // ===== 3. RESUME SISWA / FEEDBACK (Sample 10 terakhir) =====
    $query = "SELECT 
        s.nama_lengkap,
        k.nama_kelas,
        AVG(sd.nilai) as rata_rata,
        sr.resume_siswa,
        sr.created_at
        
        FROM survey_response sr
        JOIN siswa s ON sr.siswa_id = s.id
        JOIN kelas k ON s.kelas_id = k.id
        JOIN survey_detail sd ON sr.id = sd.survey_response_id
        
        WHERE sr.guru_id = :guru_id AND sr.semester = :semester
        GROUP BY sr.id, s.nama_lengkap, k.nama_kelas, sr.resume_siswa, sr.created_at
        ORDER BY sr.created_at DESC
        LIMIT 10";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':guru_id', $guru_id);
    $stmt->bindParam(':semester', $semester);
    $stmt->execute();
    
    $resume_siswa = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['rata_rata'] = number_format((float)$row['rata_rata'], 2);
        // Rename resume_siswa ke komentar untuk compatibility dengan frontend
        $row['komentar'] = $row['resume_siswa'];
        unset($row['resume_siswa']);
        $resume_siswa[] = $row;
    }
    
    // ===== 4. TREND DATA (jika ada multiple semester) =====
    $trend = [];
    
    // ===== RESPONSE =====
    echo json_encode([
        "success" => true,
        "data" => [
            "summary" => $summary,
            "aspek_list" => $aspek_list,
            "detail_per_kelas" => $detail_per_kelas,
            "resume_siswa" => $resume_siswa,
            "trend" => $trend
        ]
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>