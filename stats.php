<?php
/**
 * CampusConnect - Statistics API
 */
require_once __DIR__ . '/db_connect.php';

$pdo = getDBConnection();

if ($pdo) {
    $cesaCount = (int)$pdo->query("SELECT COUNT(*) FROM `events` WHERE `event_type` = 'cesa'")->fetchColumn();
    $seminarCount = (int)$pdo->query("SELECT COUNT(*) FROM `events` WHERE `event_type` = 'seminar'")->fetchColumn();
    $generalCount = (int)$pdo->query("SELECT COUNT(*) FROM `events` WHERE `event_type` = 'general'")->fetchColumn();
    $upcomingCount = (int)$pdo->query("SELECT COUNT(*) FROM `events` WHERE `status` = 'upcoming'")->fetchColumn();
    $studentCount = (int)$pdo->query("SELECT COUNT(*) FROM `students`")->fetchColumn();
    $regCount = (int)$pdo->query("SELECT COUNT(*) FROM `registrations`")->fetchColumn();

    jsonResponse([
        "success" => true,
        "stats" => [
            "cesaEvents" => $cesaCount,
            "seminars" => $seminarCount,
            "universityEvents" => $generalCount,
            "upcomingTotal" => $upcomingCount,
            "students" => $studentCount,
            "registrations" => $regCount
        ]
    ]);
}

jsonResponse(["success" => false, "message" => "Database not available"]);
?>
