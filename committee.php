<?php
/**
 * CampusConnect - CESA Committee API
 */
require_once __DIR__ . '/db_connect.php';

$pdo = getDBConnection();

if ($pdo) {
    $stmt = $pdo->query("SELECT * FROM `committee` ORDER BY `display_order` ASC, `id` ASC");
    $members = $stmt->fetchAll();
    jsonResponse(["success" => true, "count" => count($members), "data" => $members]);
}

jsonResponse(["success" => false, "message" => "Database not available"]);
?>
