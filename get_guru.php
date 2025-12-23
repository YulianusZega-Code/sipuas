<?php
/**
 * GET GURU UNTUK SURVEY SISWA (FINAL - BERBASIS GURU)
 * backend/api/survey/get_guru.php
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$db = (new Database())->getConnection();

$siswa_id = $_GET['siswa_id'] ?? null;
$semester = $_GET['semester'] ?? null;

if (!$siswa_id || !$semester) {
    echo json_encode([
        "success" => false,
        "message" => "siswa_id dan semester wajib diisi"
    ]);
    exit;
}

try {

    $sql = "
        SELECT
            g.id,
            g.nama_lengkap,
            g.nip,
            g.foto,

            GROUP_CONCAT(DISTINCT mp.nama_mapel ORDER BY mp.nama_mapel SEPARATOR ', ') AS mata_pelajaran,

            sr.id AS survey_id,
            IF(sr.id IS NULL, 0, 1) AS sudah_survey,
            sr.created_at AS survey_date

        FROM siswa s
        JOIN penugasan p ON p.kelas_id = s.kelas_id
        JOIN guru g ON g.id = p.guru_id
        JOIN mata_pelajaran mp ON mp.id = p.mata_pelajaran_id

        LEFT JOIN survey_response sr
            ON sr.siswa_id = s.id
            AND sr.guru_id = g.id
            AND sr.semester = :semester

        WHERE s.id = :siswa_id
          AND p.semester = :semester

        GROUP BY g.id
        ORDER BY g.nama_lengkap ASC
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':siswa_id' => $siswa_id,
        ':semester' => $semester
    ]);

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $baseFoto = "http://localhost/survey-guru/backend/uploads/guru/";

    foreach ($data as &$row) {
        $row['foto_url'] = $row['foto']
            ? $baseFoto . $row['foto']
            : null;
    }

    echo json_encode([
        "success" => true,
        "total" => count($data),
        "data" => $data
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
