<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$semester = isset($_GET['semester']) ? $_GET['semester'] : null;

if(!$semester) {
    echo json_encode(["success" => false, "message" => "Parameter semester diperlukan"]);
    exit;
}

// Query untuk mendapatkan hasil survey lengkap dengan breakdown per aspek
$query = "SELECT 
    g.id as guru_id,
    g.nip,
    g.nama_lengkap as nama_guru,
    COALESCE(g.foto, NULL) as foto,
    COUNT(DISTINCT sr.id) as jumlah_responden,
    
    -- Rata-rata per aspek (5 aspek)
    AVG(CASE WHEN ps.aspek_id = 1 THEN sd.nilai END) as aspek_1,
    AVG(CASE WHEN ps.aspek_id = 2 THEN sd.nilai END) as aspek_2,
    AVG(CASE WHEN ps.aspek_id = 3 THEN sd.nilai END) as aspek_3,
    AVG(CASE WHEN ps.aspek_id = 4 THEN sd.nilai END) as aspek_4,
    AVG(CASE WHEN ps.aspek_id = 5 THEN sd.nilai END) as aspek_5,
    
    -- Rata-rata keseluruhan
    AVG(sd.nilai) as rata_rata_keseluruhan,
    
    -- Get unit sekolah info (untuk filtering nanti)
    k.unit_sekolah_id,
    us.nama_unit
    
    FROM survey_response sr
    JOIN survey_detail sd ON sr.id = sd.survey_response_id
    JOIN pertanyaan_survey ps ON sd.pertanyaan_id = ps.id
    JOIN guru g ON sr.guru_id = g.id
    
    -- Get unit info via penugasan
    LEFT JOIN penugasan p ON g.id = p.guru_id AND p.semester = :semester
    LEFT JOIN kelas k ON p.kelas_id = k.id
    LEFT JOIN unit_sekolah us ON k.unit_sekolah_id = us.id
    
    WHERE sr.semester = :semester
    GROUP BY g.id, g.nip, g.nama_lengkap, k.unit_sekolah_id, us.nama_unit
    ORDER BY rata_rata_keseluruhan DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(':semester', $semester);
$stmt->execute();

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Add foto URL and format numbers
foreach ($rows as &$row) {
    if ($row['foto']) {
        $row['foto_url'] = 'http://localhost/survey-guru/backend/uploads/guru/' . $row['foto'];
    } else {
        $row['foto_url'] = null;
    }
    
    // Format all scores to 2 decimal places
    $row['aspek_1'] = $row['aspek_1'] ? number_format((float)$row['aspek_1'], 2) : '-';
    $row['aspek_2'] = $row['aspek_2'] ? number_format((float)$row['aspek_2'], 2) : '-';
    $row['aspek_3'] = $row['aspek_3'] ? number_format((float)$row['aspek_3'], 2) : '-';
    $row['aspek_4'] = $row['aspek_4'] ? number_format((float)$row['aspek_4'], 2) : '-';
    $row['aspek_5'] = $row['aspek_5'] ? number_format((float)$row['aspek_5'], 2) : '-';
    $row['rata_rata_keseluruhan'] = number_format((float)$row['rata_rata_keseluruhan'], 2);
}

echo json_encode(["success" => true, "data" => $rows]);
?>