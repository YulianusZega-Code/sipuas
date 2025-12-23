<?php
// backend/api/auth/change_password.php - Ganti password siswa

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

// Validasi input
if (empty($data->user_id) || empty($data->current_password) || empty($data->new_password)) {
    echo json_encode([
        "success" => false,
        "message" => "Data tidak lengkap"
    ]);
    exit();
}

// Validasi panjang password baru
if (strlen($data->new_password) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "Password baru minimal 6 karakter"
    ]);
    exit();
}

// Ambil data user
$query = "SELECT id, username, password FROM users WHERE id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $data->user_id);
$stmt->execute();

if ($stmt->rowCount() == 0) {
    echo json_encode([
        "success" => false,
        "message" => "User tidak ditemukan"
    ]);
    exit();
}

$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Verifikasi password lama
$password_valid = false;

// Check if password is hashed (starts with $2y$)
if (substr($user['password'], 0, 4) === '$2y$') {
    // Hashed password - use password_verify
    $password_valid = password_verify($data->current_password, $user['password']);
} else {
    // Plain text password - direct comparison
    $password_valid = ($data->current_password === $user['password']);
}

if (!$password_valid) {
    echo json_encode([
        "success" => false,
        "message" => "Password lama salah"
    ]);
    exit();
}

// Hash password baru
$new_password_hash = password_hash($data->new_password, PASSWORD_DEFAULT);

// Update password
$update_query = "UPDATE users SET password = :password, must_change_password = 0 WHERE id = :user_id";
$update_stmt = $db->prepare($update_query);
$update_stmt->bindParam(":password", $new_password_hash);
$update_stmt->bindParam(":user_id", $data->user_id);

if ($update_stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Password berhasil diubah"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Gagal mengubah password"
    ]);
}
?>
