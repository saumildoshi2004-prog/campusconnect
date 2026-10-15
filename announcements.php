<?php
/**
 * CampusConnect - Announcements API
 */
require_once __DIR__ . '/db_connect.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if ($pdo) {
        $stmt = $pdo->query("SELECT * FROM `announcements` ORDER BY `is_pinned` DESC, `date` DESC");
        $anns = $stmt->fetchAll();
        foreach ($anns as &$a) {
            $a['labels'] = array_map('trim', explode(',', $a['labels']));
        }
        jsonResponse(["success" => true, "count" => count($anns), "data" => $anns]);
    }
    jsonResponse(["success" => false, "message" => "Database not available"]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    if (!$pdo) jsonResponse(["success" => false, "message" => "Database error"], 500);

    $id = 'ann_' . time();
    $title = $data['title'] ?? '';
    $content = $data['content'] ?? '';
    $date = $data['date'] ?? date('Y-m-d');
    $labels = is_array($data['labels'] ?? null) ? implode(', ', $data['labels']) : ($data['labels'] ?? 'NOTICE');
    $is_pinned = !empty($data['is_pinned']) ? 1 : 0;
    $author = $data['author'] ?? 'CESA Committee';

    $stmt = $pdo->prepare("INSERT INTO `announcements` (`id`, `title`, `content`, `date`, `labels`, `is_pinned`, `author`) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $title, $content, $date, $labels, $is_pinned, $author]);

    jsonResponse(["success" => true, "message" => "Announcement posted successfully", "id" => $id]);
}
?>
