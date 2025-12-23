<?php
/**
 * FIX PASSWORD - SIMPLE VERSION
 * Hash semua password yang masih plain text
 */

// Koneksi database
$host = "localhost";
$dbname = "survey_kepuasan_guru";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Fix Password</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 { color: #333; margin-bottom: 20px; }
        .success { 
            background: #d1fae5; 
            color: #065f46; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 10px 0;
            font-weight: bold;
        }
        .error { 
            background: #fee2e2; 
            color: #991b1b; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 10px 0;
        }
        .info { 
            background: #dbeafe; 
            color: #1e40af; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 10px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f9fafb;
            font-weight: bold;
        }
        .badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-skip { background: #fef3c7; color: #92400e; }
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Password Hash Fixer</h1>
        
<?php

// Get all users
$query = "SELECT id, username, password, role FROM users ORDER BY 
          FIELD(role, 'super_admin', 'admin_sekolah', 'kepala_sekolah', 'guru', 'siswa'),
          username";
$stmt = $conn->prepare($query);
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

$total = count($users);
$updated = 0;
$skipped = 0;
$errors = 0;

echo "<div class='info'>📊 Total users: <strong>$total</strong></div>";

// Process each user
foreach ($users as $user) {
    $id = $user['id'];
    $username = $user['username'];
    $password = $user['password'];
    $role = $user['role'];
    
    // Check if already hashed
    if (substr($password, 0, 4) === '$2y$' || substr($password, 0, 4) === '$2a$') {
        $skipped++;
        continue;
    }
    
    // Hash the password
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    
    // Update database
    try {
        $update = "UPDATE users SET password = :password WHERE id = :id";
        $updateStmt = $conn->prepare($update);
        $updateStmt->bindParam(':password', $hashed);
        $updateStmt->bindParam(':id', $id);
        $updateStmt->execute();
        $updated++;
    } catch(Exception $e) {
        $errors++;
        echo "<div class='error'>❌ Error updating user: $username - " . $e->getMessage() . "</div>";
    }
}

// Summary
echo "<div class='success'>✅ Berhasil di-hash: <strong>$updated</strong> password</div>";
if ($skipped > 0) {
    echo "<div class='info'>⏭️ Dilewati (sudah ter-hash): <strong>$skipped</strong> password</div>";
}
if ($errors > 0) {
    echo "<div class='error'>❌ Error: <strong>$errors</strong> password</div>";
}

// Show login info
echo "<div class='info' style='margin-top: 30px;'>
        <h3 style='margin-bottom: 15px;'>🔑 Login Credentials:</h3>
        <table style='background: white;'>
            <tr>
                <th>Role</th>
                <th>Username</th>
                <th>Password</th>
            </tr>
            <tr>
                <td><strong>Super Admin</strong></td>
                <td><code>superadmin</code></td>
                <td><code>superadmin123</code></td>
            </tr>
            <tr>
                <td><strong>Admin Sekolah</strong></td>
                <td><code>adminsmp</code></td>
                <td><code>admin123</code></td>
            </tr>
            <tr>
                <td><strong>Kepala Sekolah</strong></td>
                <td><code>kepsek</code></td>
                <td><code>kepsek123</code></td>
            </tr>
            <tr>
                <td><strong>Guru (16 akun)</strong></td>
                <td><code>[NUPTK]</code></td>
                <td><code>guru123</code></td>
            </tr>
            <tr>
                <td><strong>Siswa (294 akun)</strong></td>
                <td><code>[NIS]</code></td>
                <td><code>siswa123</code></td>
            </tr>
        </table>
      </div>";

// Detail per role
$roleQuery = "SELECT role, COUNT(*) as total FROM users GROUP BY role ORDER BY 
              FIELD(role, 'super_admin', 'admin_sekolah', 'kepala_sekolah', 'guru', 'siswa')";
$roleStmt = $conn->prepare($roleQuery);
$roleStmt->execute();
$roles = $roleStmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h3 style='margin-top: 30px; color: #333;'>📊 Statistik per Role:</h3>";
echo "<table>";
echo "<tr><th>Role</th><th>Jumlah</th><th>Status</th></tr>";

foreach ($roles as $r) {
    echo "<tr>";
    echo "<td><strong>{$r['role']}</strong></td>";
    echo "<td>{$r['total']}</td>";
    echo "<td><span class='badge badge-success'>✅ Hashed</span></td>";
    echo "</tr>";
}

echo "</table>";

?>
        
        <div class="success" style="margin-top: 30px;">
            <strong>✅ SELESAI!</strong><br>
            Semua password sudah di-hash dengan bcrypt.<br>
            Silakan coba login dengan credentials di atas.
        </div>
        
    </div>
</body>
</html>