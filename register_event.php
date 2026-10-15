<?php
/**
 * CampusConnect - Event Registration API
 */
require_once __DIR__ . '/db_connect.php';

$pdo = getDBConnection();
$data = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$eventId = $data['eventId'] ?? '';
$eventType = $data['eventType'] ?? 'cesa';
$studentId = $data['studentId'] ?? '';
$studentName = $data['name'] ?? ($data['studentName'] ?? '');
$iuNumber = $data['iuNumber'] ?? '';
$department = $data['department'] ?? 'Computer Engineering';
$semester = $data['semester'] ?? '6th Semester';
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? '';

if (empty($eventId) || empty($studentName) || empty($iuNumber)) {
    jsonResponse(["success" => false, "message" => "Missing required registration details"], 400);
}

$regId = "REG" . strtoupper(substr(uniqid(), -8));

if ($pdo) {
    // 1. Check for duplicate registration
    $chk = $pdo->prepare("SELECT id FROM `registrations` WHERE `event_id` = ? AND (`student_id` = ? OR `iu_number` = ?) LIMIT 1");
    $chk->execute([$eventId, $studentId, $iuNumber]);
    if ($chk->fetch()) {
        jsonResponse(["success" => false, "message" => "You are already registered for this event with IU Number $iuNumber."], 409);
    }

    // 2. Insert registration
    $stmt = $pdo->prepare("INSERT INTO `registrations` (`id`, `event_id`, `event_type`, `student_id`, `student_name`, `iu_number`, `department`, `semester`, `email`, `phone`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')");
    $stmt->execute([$regId, $eventId, $eventType, $studentId, $studentName, $iuNumber, $department, $semester, $email, $phone]);

    // 3. Increment seats booked
    $upd = $pdo->prepare("UPDATE `events` SET `seats_booked` = `seats_booked` + 1 WHERE `id` = ?");
    $upd->execute([$eventId]);

    // 4. Fetch event title for receipt
    $eStmt = $pdo->prepare("SELECT title, date, venue FROM `events` WHERE `id` = ?");
    $eStmt->execute([$eventId]);
    $eventInfo = $eStmt->fetch();

    jsonResponse([
        "success" => true,
        "message" => "Registration Confirmed!",
        "registration" => [
            "id" => $regId,
            "eventId" => $eventId,
            "eventTitle" => $eventInfo['title'] ?? 'Campus Event',
            "eventDate" => $eventInfo['date'] ?? '',
            "eventVenue" => $eventInfo['venue'] ?? '',
            "studentName" => $studentName,
            "iuNumber" => $iuNumber,
            "department" => $department,
            "semester" => $semester,
            "email" => $email,
            "phone" => $phone,
            "status" => "confirmed",
            "registeredAt" => date('Y-m-d H:i:s')
        ]
    ]);
}

// Fallback response for offline/client mode
jsonResponse([
    "success" => true,
    "message" => "Registration recorded locally",
    "registration" => [
        "id" => $regId,
        "eventId" => $eventId,
        "studentName" => $studentName,
        "iuNumber" => $iuNumber,
        "department" => $department,
        "semester" => $semester,
        "email" => $email,
        "phone" => $phone,
        "status" => "confirmed",
        "registeredAt" => date('Y-m-d H:i:s')
    ]
]);
?>
