<?php
// backend/api/guru/upload_foto.php - Upload foto guru

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
    
    // Get guru_id from POST
    $guru_id = isset($_POST['guru_id']) ? $_POST['guru_id'] : null;
    
    if (!$guru_id) {
        echo json_encode(["success" => false, "message" => "Guru ID diperlukan"]);
        exit();
    }
    
    // Check if file was uploaded
    if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["success" => false, "message" => "File tidak ditemukan atau error upload"]);
        exit();
    }
    
    $file = $_FILES['foto'];
    
    // Validate file type
    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png'];
    $file_type = $file['type'];
    
    if (!in_array($file_type, $allowed_types)) {
        echo json_encode(["success" => false, "message" => "Format file harus JPG atau PNG"]);
        exit();
    }
    
    // Validate file size (max 2MB)
    $max_size = 2 * 1024 * 1024; // 2MB in bytes
    if ($file['size'] > $max_size) {
        echo json_encode(["success" => false, "message" => "Ukuran file maksimal 2MB"]);
        exit();
    }
    
    // Get guru info
    $query = "SELECT nip FROM guru WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $guru_id);
    $stmt->execute();
    $guru = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$guru) {
        echo json_encode(["success" => false, "message" => "Guru tidak ditemukan"]);
        exit();
    }
    
    // Create upload directory if not exists
    $upload_dir = __DIR__ . '/../../uploads/guru/';

    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    // Generate filename: NUPTK_timestamp.extension
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $guru['nip'] . '_' . time() . '.' . $extension;
    $filepath = $upload_dir . $filename;
    
    // Delete old photo if exists
    $query = "SELECT foto FROM guru WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $guru_id);
    $stmt->execute();
    $old_foto = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($old_foto && $old_foto['foto'] && file_exists($upload_dir . $old_foto['foto'])) {
        unlink($upload_dir . $old_foto['foto']);
    }
    
    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        // Update database
        $query = "UPDATE guru SET foto = :foto WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':foto', $filename);
        $stmt->bindParam(':id', $guru_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true, 
                "message" => "Foto berhasil diupload",
                "filename" => $filename
            ]);
        } else {
            // Delete uploaded file if database update fails
            unlink($filepath);
            echo json_encode(["success" => false, "message" => "Gagal update database"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Gagal upload file"]);
    }
    
} else {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
