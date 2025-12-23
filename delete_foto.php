<?php
// backend/api/guru/delete_foto.php - Delete foto guru

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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $data = json_decode(file_get_contents("php://input"));
    $guru_id = isset($data->guru_id) ? $data->guru_id : null;
    
    if (!$guru_id) {
        echo json_encode(["success" => false, "message" => "Guru ID diperlukan"]);
        exit();
    }
    
    // Get foto filename
    $query = "SELECT foto FROM guru WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $guru_id);
    $stmt->execute();
    $guru = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$guru) {
        echo json_encode(["success" => false, "message" => "Guru tidak ditemukan"]);
        exit();
    }
    
    $upload_dir = '../../uploads/guru/';
    
    // Delete file if exists
    if ($guru['foto'] && file_exists($upload_dir . $guru['foto'])) {
        unlink($upload_dir . $guru['foto']);
    }
    
    // Update database
    $query = "UPDATE guru SET foto = NULL WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $guru_id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Foto berhasil dihapus"]);
    } else {
        echo json_encode(["success" => false, "message" => "Gagal hapus foto"]);
    }
    
} else {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
