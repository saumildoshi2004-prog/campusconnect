<?php
/**
 * CampusConnect - Events API (CESA Events, Seminars, University Events)
 */
require_once __DIR__ . '/db_connect.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $type = $_GET['type'] ?? 'all';
    $category = $_GET['category'] ?? 'all';
    $status = $_GET['status'] ?? 'all';
    $search = $_GET['q'] ?? '';

    if ($pdo) {
        $sql = "SELECT * FROM `events` WHERE 1=1";
        $params = [];

        if ($type !== 'all') {
            $sql .= " AND `event_type` = ?";
            $params[] = $type;
        }

        if ($category !== 'all') {
            $sql .= " AND `category` = ?";
            $params[] = $category;
        }

        if ($status !== 'all') {
            $sql .= " AND `status` = ?";
            $params[] = $status;
        }

        if (!empty($search)) {
            $sql .= " AND (`title` LIKE ? OR `description` LIKE ? OR `organizer` LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $sql .= " ORDER BY `date` ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $events = $stmt->fetchAll();

        // Convert field types to match frontend conventions
        foreach ($events as &$e) {
            $e['registrationOpen'] = (bool)$e['registration_open'];
            $e['seatsLeft'] = max(0, (int)$e['max_seats'] - (int)$e['seats_booked']);
        }

        jsonResponse(["success" => true, "count" => count($events), "data" => $events]);
    }

    // Fallback if DB not ready
    jsonResponse(["success" => false, "message" => "Database not connected. Using client-side store."]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    if (!$pdo) {
        jsonResponse(["success" => false, "message" => "Database not available"], 500);
    }

    $id = $data['id'] ?? ('ev_' . time());
    $title = $data['title'] ?? '';
    $category = $data['category'] ?? 'Technical';
    $event_type = $data['event_type'] ?? 'cesa';
    $organizer = $data['organizer'] ?? 'CESA';
    $speaker = $data['speaker'] ?? null;
    $speaker_title = $data['speaker_title'] ?? null;
    $date = $data['date'] ?? date('Y-m-d');
    $time = $data['time'] ?? '10:00 AM';
    $venue = $data['venue'] ?? 'Campus';
    $description = $data['description'] ?? '';
    $poster_image = $data['poster_image'] ?? 'posters/codesprint.jpg';
    $poster_text = $data['poster_text'] ?? $title;
    $status = $data['status'] ?? 'upcoming';
    $registration_open = isset($data['registration_open']) ? (int)$data['registration_open'] : 1;
    $max_seats = (int)($data['max_seats'] ?? 100);

    $stmt = $pdo->prepare("INSERT INTO `events` (`id`, `title`, `category`, `event_type`, `organizer`, `speaker`, `speaker_title`, `date`, `time`, `venue`, `description`, `poster_image`, `poster_text`, `status`, `registration_open`, `max_seats`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $title, $category, $event_type, $organizer, $speaker, $speaker_title, $date, $time, $venue, $description, $poster_image, $poster_text, $status, $registration_open, $max_seats]);

    jsonResponse(["success" => true, "message" => "Event added successfully", "id" => $id]);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$pdo || empty($id)) {
        jsonResponse(["success" => false, "message" => "Invalid parameters"], 400);
    }
    $stmt = $pdo->prepare("DELETE FROM `events` WHERE `id` = ?");
    $stmt->execute([$id]);
    jsonResponse(["success" => true, "message" => "Event deleted successfully"]);
}
?>
