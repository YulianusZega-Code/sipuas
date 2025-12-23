<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $query = "SELECT s.*, k.nama_kelas, u.nama_unit, us.username 
                  FROM siswa s 
                  JOIN kelas k ON s.kelas_id = k.id 
                  JOIN unit_sekolah u ON k.unit_sekolah_id = u.id
                  LEFT JOIN users us ON s.user_id = us.id
                  ORDER BY u.jenjang, k.tingkat, s.nama_lengkap";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $rows]);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        try {
            $db->beginTransaction();
            
            $query = "INSERT INTO siswa (nis, nama_lengkap, kelas_id) VALUES (:nis, :nama_lengkap, :kelas_id)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':nis', $data->nis);
            $stmt->bindParam(':nama_lengkap', $data->nama_lengkap);
            $stmt->bindParam(':kelas_id', $data->kelas_id);
            $stmt->execute();
            $siswa_id = $db->lastInsertId();
            
            if(!empty($data->username) && !empty($data->password)) {
                $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
                $query = "INSERT INTO users (username, password, role, ref_id) VALUES (:username, :password, 'siswa', :ref_id)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':username', $data->username);
                $stmt->bindParam(':password', $hashed_password);
                $stmt->bindParam(':ref_id', $siswa_id);
                $stmt->execute();
                $user_id = $db->lastInsertId();
                
                $query = "UPDATE siswa SET user_id = :user_id WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':id', $siswa_id);
                $stmt->execute();
            }
            
            $db->commit();
            echo json_encode(["success" => true, "message" => "Siswa berhasil ditambahkan"]);
        } catch(Exception $e) {
            $db->rollBack();
            echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        try {
            $db->beginTransaction();
            
            $query = "UPDATE siswa SET nis = :nis, nama_lengkap = :nama_lengkap, kelas_id = :kelas_id WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data->id);
            $stmt->bindParam(':nis', $data->nis);
            $stmt->bindParam(':nama_lengkap', $data->nama_lengkap);
            $stmt->bindParam(':kelas_id', $data->kelas_id);
            $stmt->execute();
            
            if(!empty($data->password)) {
                $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
                $query = "UPDATE users SET password = :password WHERE ref_id = :ref_id AND role = 'siswa'";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':password', $hashed_password);
                $stmt->bindParam(':ref_id', $data->id);
                $stmt->execute();
            }
            
            $db->commit();
            echo json_encode(["success" => true, "message" => "Siswa berhasil diupdate"]);
        } catch(Exception $e) {
            $db->rollBack();
            echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));
        
        try {
            $db->beginTransaction();
            
            $query = "DELETE FROM users WHERE ref_id = :ref_id AND role = 'siswa'";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':ref_id', $data->id);
            $stmt->execute();
            
            $query = "DELETE FROM siswa WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data->id);
            $stmt->execute();
            
            $db->commit();
            echo json_encode(["success" => true, "message" => "Siswa berhasil dihapus"]);
        } catch(Exception $e) {
            $db->rollBack();
            echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
        }
        break;
}
?>
