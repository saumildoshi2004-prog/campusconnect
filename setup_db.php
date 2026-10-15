<?php
/**
 * CampusConnect - 1-Click Database Setup & Migrator
 * Automatically creates the 'campusconnect' database and populates tables from database.sql
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "campusconnect";
$port = 3306;

$is_api = isset($_GET['format']) && $_GET['format'] === 'json';

try {
    // 1. Connect without selecting database
    $pdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 2. Create database if it does not exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");

    // 3. Locate SQL file
    $sql_file = __DIR__ . '/../database.sql';
    if (!file_exists($sql_file)) {
        $sql_file = __DIR__ . '/../data/database.sql';
    }

    if (!file_exists($sql_file)) {
        throw new Exception("database.sql file not found in root or data directory.");
    }

    $sql_content = file_get_contents($sql_file);

    // 4. Split and execute SQL statements
    $pdo->exec($sql_content);

    // 5. Query table row statistics
    $tables = ['users', 'students', 'events', 'committee', 'registrations', 'announcements', 'certificates', 'feedback'];
    $stats = [];
    foreach ($tables as $t) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) AS cnt FROM `$t`");
            $stats[$t] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        } catch (Exception $e) {
            $stats[$t] = 'Error: ' . $e->getMessage();
        }
    }

    if ($is_api) {
        header("Content-Type: application/json");
        echo json_encode([
            "success" => true,
            "message" => "Database campusconnect initialized and populated successfully!",
            "database" => $dbname,
            "stats" => $stats
        ], JSON_PRETTY_PRINT);
        exit();
    }

    // Render HTML confirmation UI
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Database Setup Successful | CampusConnect</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
      <style>
        body { background: #f0f4f8; font-family: system-ui, -apple-system, sans-serif; padding: 40px 15px; }
        .setup-card { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(10,77,140,0.1); border: none; }
        .setup-header { background: linear-gradient(135deg, #0a4d8c, #00a8e8); color: white; border-radius: 16px 16px 0 0; padding: 30px; }
        .table-stat-badge { background: #e8f4fc; color: #0a4d8c; font-weight: 600; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; }
      </style>
    </head>
    <body>
      <div class="card setup-card">
        <div class="setup-header text-center">
          <i class="bi bi-check-circle-fill display-3 mb-2"></i>
          <h2 class="fw-bold mb-1">Database Connected & Initialized!</h2>
          <p class="mb-0 opacity-90">Indus University — CampusConnect SQL Database</p>
        </div>
        <div class="card-body p-4 p-md-5">
          <div class="alert alert-success d-flex align-items-center mb-4">
            <i class="bi bi-database-check fs-3 me-3 text-success"></i>
            <div>
              <strong>Database Name:</strong> <code>campusconnect</code><br>
              <strong>Status:</strong> Tables created & seed data imported successfully.
            </div>
          </div>

          <h5 class="fw-bold mb-3">Database Tables & Records:</h5>
          <div class="table-responsive mb-4">
            <table class="table table-bordered align-middle">
              <thead class="table-light">
                <tr><th>Table Name</th><th>Purpose</th><th class="text-center">Total Records</th></tr>
              </thead>
              <tbody>
                <tr><td><code>users</code></td><td>Student & Admin accounts</td><td class="text-center"><span class="table-stat-badge"><?= $stats['users'] ?> rows</span></td></tr>
                <tr><td><code>students</code></td><td>Indus University student profiles</td><td class="text-center"><span class="table-stat-badge"><?= $stats['students'] ?> rows</span></td></tr>
                <tr><td><code>events</code></td><td>CESA competitions, seminars & fests</td><td class="text-center"><span class="table-stat-badge"><?= $stats['events'] ?> rows</span></td></tr>
                <tr><td><code>committee</code></td><td>CESA Executive committee members</td><td class="text-center"><span class="table-stat-badge"><?= $stats['committee'] ?> rows</span></td></tr>
                <tr><td><code>registrations</code></td><td>Event participation records</td><td class="text-center"><span class="table-stat-badge"><?= $stats['registrations'] ?> rows</span></td></tr>
                <tr><td><code>announcements</code></td><td>Campus notices & deadlines</td><td class="text-center"><span class="table-stat-badge"><?= $stats['announcements'] ?> rows</span></td></tr>
                <tr><td><code>certificates</code></td><td>Event completion credentials</td><td class="text-center"><span class="table-stat-badge"><?= $stats['certificates'] ?> rows</span></td></tr>
              </tbody>
            </table>
          </div>

          <div class="d-grid gap-2">
            <a href="../public/index.html" class="btn btn-primary btn-lg" style="background:#0a4d8c; border-color:#0a4d8c;">
              <i class="bi bi-arrow-right-circle me-2"></i> Open CampusConnect Website
            </a>
            <a href="../public/admin.html" class="btn btn-outline-secondary">
              <i class="bi bi-shield-lock me-2"></i> Open Admin Panel
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
    <?php

} catch (Exception $e) {
    if ($is_api) {
        header("Content-Type: application/json", true, 500);
        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()
        ]);
        exit();
    }
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Database Setup Error | CampusConnect</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light p-5">
      <div class="card max-w-500 mx-auto p-4 border-danger shadow-sm" style="max-width: 600px; margin: auto;">
        <h3 class="text-danger mb-3"><i class="bi bi-exclamation-triangle-fill"></i> Database Setup Error</h3>
        <p class="text-muted">Could not connect to MySQL server.</p>
        <div class="alert alert-danger"><code><?= htmlspecialchars($e->getMessage()) ?></code></div>
        <h5>Quick Troubleshooting:</h5>
        <ul>
          <li>Make sure <strong>XAMPP MySQL</strong> service is started.</li>
          <li>Default configuration is Host: <code>localhost</code>, User: <code>root</code>, Password: <em>(blank)</em>.</li>
        </ul>
        <a href="setup_db.php" class="btn btn-outline-primary">Retry Setup</a>
      </div>
    </body>
    </html>
    <?php
}
?>
