<?php
/**
 * AUTH LOGIN API - OPSI A1
 * File: backend/api/auth/login.php
 */

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/* ===============================
 * START SESSION (A1)
 * =============================== */
session_start();

include_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {

    $query = "SELECT 
                u.id, 
                u.username, 
                u.password, 
                u.role, 
                u.ref_id, 
                u.unit_sekolah_id,
                u.must_change_password,
                CASE 
                    WHEN u.role = 'siswa' THEN s.nama_lengkap
                    WHEN u.role = 'guru' THEN g.nama_lengkap
                    WHEN u.role IN ('admin_sekolah','kepala_sekolah') THEN us.nama_unit
                    ELSE 'Super Administrator'
                END AS nama_lengkap,
                CASE 
                    WHEN u.role = 'siswa' THEN s.kelas_id
                    ELSE NULL
                END AS kelas_id
            FROM users u
            LEFT JOIN siswa s ON u.role = 'siswa' AND u.ref_id = s.id
            LEFT JOIN guru g ON u.role = 'guru' AND u.ref_id = g.id
            LEFT JOIN unit_sekolah us ON u.unit_sekolah_id = us.id
            WHERE u.username = :username
            LIMIT 1";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $data->username);
    $stmt->execute();

    if ($stmt->rowCount() === 1) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // ===== VALIDASI PASSWORD =====
        $password_valid = false;

        if (substr($row['password'], 0, 4) === '$2y$') {
            $password_valid = password_verify($data->password, $row['password']);
        } else {
            $password_valid = ($data->password === $row['password']);
        }

        if ($password_valid) {
            unset($row['password']);

            // Default must_change_password
            if (!isset($row['must_change_password'])) {
                $row['must_change_password'] = ($row['role'] === 'siswa') ? 1 : 0;
            }

            /* ===============================
             * BUAT SESSION (A1)
             * =============================== */
            session_regenerate_id(true);

            $_SESSION['user_id']          = $row['id'];
            $_SESSION['role']             = $row['role'];
            $_SESSION['ref_id']           = $row['ref_id'];
            $_SESSION['unit_sekolah_id']  = $row['unit_sekolah_id'];
            $_SESSION['nama_lengkap']     = $row['nama_lengkap'];
            $_SESSION['kelas_id']         = $row['kelas_id'];
            $_SESSION['login_time']       = time();

            echo json_encode([
                "success" => true,
                "message" => "Login berhasil",
                "data"    => $row
            ]);
            exit();

        } else {
            echo json_encode([
                "success" => false,
                "message" => "Password salah"
            ]);
            exit();
        }

    } else {
        echo json_encode([
            "success" => false,
            "message" => "Username tidak ditemukan"
        ]);
        exit();
    }

} else {
    echo json_encode([
        "success" => false,
        "message" => "Username dan password harus diisi"
    ]);
    exit();
}
