<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT a.id as aspek_id, a.nama_aspek,
          p.id as pertanyaan_id, p.pertanyaan
          FROM aspek_penilaian a
          JOIN pertanyaan_survey p ON a.id = p.aspek_id
          ORDER BY a.urutan, p.urutan";

$stmt = $db->prepare($query);
$stmt->execute();

$result = [];
$current_aspek = null;

while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if($current_aspek != $row['aspek_id']) {
        $current_aspek = $row['aspek_id'];
        $result[] = [
            'aspek_id' => $row['aspek_id'],
            'nama_aspek' => $row['nama_aspek'],
            'pertanyaan' => []
        ];
    }
    
    $result[count($result) - 1]['pertanyaan'][] = [
        'pertanyaan_id' => $row['pertanyaan_id'],
        'pertanyaan' => $row['pertanyaan']
    ];
}

echo json_encode(["success" => true, "data" => $result]);
?>
