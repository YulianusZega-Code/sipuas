<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$survey_id = $_GET['survey_id'] ?? null;

if (!$survey_id) {
    echo json_encode([
        "success" => false,
        "message" => "survey_id wajib diisi"
    ]);
    exit();
}

try {
    // Ambil resume
    $stmt = $db->prepare("
        SELECT resume_siswa
        FROM survey_response
        WHERE id = :survey_id
    ");
    $stmt->bindParam(':survey_id', $survey_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Survey tidak ditemukan"
        ]);
        exit();
    }

    $resume = $stmt->fetch(PDO::FETCH_ASSOC)['resume_siswa'];

    // Ambil jawaban
    $stmt = $db->prepare("
        SELECT pertanyaan_id, nilai
        FROM survey_detail
        WHERE survey_response_id = :survey_id
    ");
    $stmt->bindParam(':survey_id', $survey_id, PDO::PARAM_INT);
    $stmt->execute();

    $jawaban = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $jawaban[$row['pertanyaan_id']] = (int)$row['nilai'];
    }

    echo json_encode([
        "success" => true,
        "data" => [
            "resume" => $resume,
            "jawaban" => $jawaban
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
