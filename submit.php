<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(empty($data->siswa_id) || empty($data->guru_id) || empty($data->semester) || 
   empty($data->resume_siswa) || empty($data->jawaban)) {
    echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
    exit;
}

// Validasi resume
$word_count = str_word_count($data->resume_siswa);
if($word_count < 40 || $word_count > 300) {
    echo json_encode(["success" => false, "message" => "Resume harus 40-300 kata (saat ini: $word_count kata)"]);
    exit;
}

try {
    $db->beginTransaction();
    
    // Check sudah survey
    $query = "SELECT id FROM survey_response WHERE siswa_id = :siswa_id AND guru_id = :guru_id AND semester = :semester";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':siswa_id', $data->siswa_id);
    $stmt->bindParam(':guru_id', $data->guru_id);
    $stmt->bindParam(':semester', $data->semester);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Anda sudah mengisi survey untuk guru ini"]);
        exit;
    }
    
    // Insert survey response
    $query = "INSERT INTO survey_response (siswa_id, guru_id, semester, resume_siswa) 
              VALUES (:siswa_id, :guru_id, :semester, :resume_siswa)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':siswa_id', $data->siswa_id);
    $stmt->bindParam(':guru_id', $data->guru_id);
    $stmt->bindParam(':semester', $data->semester);
    $stmt->bindParam(':resume_siswa', $data->resume_siswa);
    $stmt->execute();
    
    $survey_response_id = $db->lastInsertId();
    
    // Insert survey details
    foreach($data->jawaban as $jawaban) {
        $query = "INSERT INTO survey_detail (survey_response_id, pertanyaan_id, nilai) 
                  VALUES (:survey_response_id, :pertanyaan_id, :nilai)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':survey_response_id', $survey_response_id);
        $stmt->bindParam(':pertanyaan_id', $jawaban->pertanyaan_id);
        $stmt->bindParam(':nilai', $jawaban->nilai);
        $stmt->execute();
    }
    
    $db->commit();
    echo json_encode(["success" => true, "message" => "Survey berhasil disimpan"]);
    
} catch(Exception $e) {
    $db->rollBack();
    echo json_encode(["success" => false, "message" => "Gagal menyimpan survey: " . $e->getMessage()]);
}
?>
