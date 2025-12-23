<?php
// backend/api/master/data.php - Complete CRUD for all master data

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

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($action) {
    // ===== UNIT SEKOLAH =====
    case 'unit':
        $query = "SELECT * FROM unit_sekolah ORDER BY jenjang, nama_unit";
        $stmt = $db->prepare($query);
        $stmt->execute();
        echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;
        
    case 'add_unit':
        $data = json_decode(file_get_contents("php://input"));
        $query = "INSERT INTO unit_sekolah (nama_unit, jenjang) VALUES (:nama_unit, :jenjang)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nama_unit', $data->nama_unit);
        $stmt->bindParam(':jenjang', $data->jenjang);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Unit sekolah berhasil ditambahkan"]);
        break;
        
    case 'update_unit':
        $data = json_decode(file_get_contents("php://input"));
        $query = "UPDATE unit_sekolah SET nama_unit = :nama_unit, jenjang = :jenjang WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':nama_unit', $data->nama_unit);
        $stmt->bindParam(':jenjang', $data->jenjang);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Unit sekolah berhasil diupdate"]);
        break;
        
    case 'delete_unit':
        $data = json_decode(file_get_contents("php://input"));
        $query = "DELETE FROM unit_sekolah WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Unit sekolah berhasil dihapus"]);
        break;
        
    // ===== KELAS =====
    case 'kelas':
        $query = "SELECT k.*, u.nama_unit, u.jenjang 
                  FROM kelas k 
                  JOIN unit_sekolah u ON k.unit_sekolah_id = u.id 
                  ORDER BY u.jenjang, k.tingkat";
        $stmt = $db->prepare($query);
        $stmt->execute();
        echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;
        
    case 'add_kelas':
        $data = json_decode(file_get_contents("php://input"));
        $query = "INSERT INTO kelas (nama_kelas, unit_sekolah_id, tingkat) VALUES (:nama_kelas, :unit_sekolah_id, :tingkat)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nama_kelas', $data->nama_kelas);
        $stmt->bindParam(':unit_sekolah_id', $data->unit_sekolah_id);
        $stmt->bindParam(':tingkat', $data->tingkat);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Kelas berhasil ditambahkan"]);
        break;
        
    case 'update_kelas':
        $data = json_decode(file_get_contents("php://input"));
        $query = "UPDATE kelas SET nama_kelas = :nama_kelas, unit_sekolah_id = :unit_sekolah_id, tingkat = :tingkat WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':nama_kelas', $data->nama_kelas);
        $stmt->bindParam(':unit_sekolah_id', $data->unit_sekolah_id);
        $stmt->bindParam(':tingkat', $data->tingkat);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Kelas berhasil diupdate"]);
        break;
        
    case 'delete_kelas':
        $data = json_decode(file_get_contents("php://input"));
        $query = "DELETE FROM kelas WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Kelas berhasil dihapus"]);
        break;
        
    // ===== MATA PELAJARAN =====
    case 'mapel':
        $query = "SELECT * FROM mata_pelajaran ORDER BY nama_mapel";
        $stmt = $db->prepare($query);
        $stmt->execute();
        echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;
        
    case 'add_mapel':
        $data = json_decode(file_get_contents("php://input"));
        $query = "INSERT INTO mata_pelajaran (nama_mapel) VALUES (:nama_mapel)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nama_mapel', $data->nama_mapel);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Mata pelajaran berhasil ditambahkan"]);
        break;
        
    case 'update_mapel':
        $data = json_decode(file_get_contents("php://input"));
        $query = "UPDATE mata_pelajaran SET nama_mapel = :nama_mapel WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':nama_mapel', $data->nama_mapel);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Mata pelajaran berhasil diupdate"]);
        break;
        
    case 'delete_mapel':
        $data = json_decode(file_get_contents("php://input"));
        $query = "DELETE FROM mata_pelajaran WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Mata pelajaran berhasil dihapus"]);
        break;
        
    // ===== PENUGASAN =====
    case 'penugasan':
        $query = "SELECT p.*, g.nama_lengkap as nama_guru, k.nama_kelas, 
                  u.nama_unit, m.nama_mapel
                  FROM penugasan p
                  JOIN guru g ON p.guru_id = g.id
                  JOIN kelas k ON p.kelas_id = k.id
                  JOIN unit_sekolah u ON k.unit_sekolah_id = u.id
                  JOIN mata_pelajaran m ON p.mata_pelajaran_id = m.id
                  ORDER BY p.semester DESC, g.nama_lengkap";
        $stmt = $db->prepare($query);
        $stmt->execute();
        echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;
        
    case 'add_penugasan':
        $data = json_decode(file_get_contents("php://input"));
        $query = "INSERT INTO penugasan (guru_id, kelas_id, mata_pelajaran_id, semester) 
                  VALUES (:guru_id, :kelas_id, :mata_pelajaran_id, :semester)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':guru_id', $data->guru_id);
        $stmt->bindParam(':kelas_id', $data->kelas_id);
        $stmt->bindParam(':mata_pelajaran_id', $data->mata_pelajaran_id);
        $stmt->bindParam(':semester', $data->semester);
        try {
            $stmt->execute();
            echo json_encode(["success" => true, "message" => "Penugasan berhasil ditambahkan"]);
        } catch(PDOException $e) {
            echo json_encode(["success" => false, "message" => "Penugasan sudah ada"]);
        }
        break;
        
    case 'delete_penugasan':
        $data = json_decode(file_get_contents("php://input"));
        $query = "DELETE FROM penugasan WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->execute();
        echo json_encode(["success" => true, "message" => "Penugasan berhasil dihapus"]);
        break;
        
    default:
        echo json_encode(["success" => false, "message" => "Action tidak valid"]);
}
?>
