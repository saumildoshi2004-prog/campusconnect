<?php
/**
 * CampusConnect - API Status & Database Healthcheck
 */
require_once __DIR__ . '/db_connect.php';

$pdo = getDBConnection();

if (!$pdo) {
    jsonResponse([
        "status" => "disconnected",
        "database_connected" => false,
        "message" => "Could not connect to MySQL database 'campusconnect'. Verify that MySQL service is running in XAMPP.",
        "mode" => "fallback_localstorage"
    ], 200);
}

try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'events'");
    $hasTables = $stmt->rowCount() > 0;

    $counts = [];
    if ($hasTables) {
        $tables = ['events', 'students', 'registrations', 'committee', 'announcements'];
        foreach ($tables as $t) {
            $s = $pdo->query("SELECT COUNT(*) as c FROM `$t`");
            $counts[$t] = (int)$s->fetch()['c'];
        }
    }

    jsonResponse([
        "status" => "connected",
        "database_connected" => true,
        "database_name" => "campusconnect",
        "has_tables" => $hasTables,
        "counts" => $counts,
        "message" => "MySQL Database is connected and active!"
    ]);
} catch (Exception $e) {
    jsonResponse([
        "status" => "error",
        "database_connected" => false,
        "error" => $e->getMessage()
    ], 500);
}
?>
