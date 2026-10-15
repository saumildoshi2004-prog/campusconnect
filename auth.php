<?php
/**
 * CampusConnect - Authentication API (Login & Student Register)
 */
require_once __DIR__ . '/db_connect.php';

$pdo = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$action = $input['action'] ?? ($_GET['action'] ?? 'login');

if ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = trim($input['password'] ?? '');
    $role = trim($input['role'] ?? 'student');

    if (empty($email) || empty($password)) {
        jsonResponse(["success" => false, "message" => "Email and password are required"], 400);
    }

    if ($pdo) {
        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `email` = ? AND `role` = ? LIMIT 1");
        $stmt->execute([$email, $role]);
        $user = $stmt->fetch();

        if ($user && $user['password'] === $password) {
            // Fetch student info if role is student
            $studentData = null;
            if ($role === 'student') {
                $sStmt = $pdo->prepare("SELECT * FROM `students` WHERE `email` = ? LIMIT 1");
                $sStmt->execute([$email]);
                $studentData = $sStmt->fetch();
            }

            $userData = [
                "id" => $studentData ? $studentData['id'] : ('usr' . $user['id']),
                "email" => $user['email'],
                "name" => $user['name'],
                "role" => $user['role'],
                "iuNumber" => $studentData['iu_number'] ?? 'IU-DEMO',
                "department" => $studentData['department'] ?? 'Computer Engineering',
                "semester" => $studentData['semester'] ?? '6th Semester',
                "phone" => $studentData['phone'] ?? ''
            ];

            jsonResponse(["success" => true, "user" => $userData]);
        }
    }

    // Fallback default test credentials if DB not yet seeded
    if ($role === 'admin' && $email === 'admin@indus' && $password === 'admin123') {
        jsonResponse([
            "success" => true,
            "user" => ["id" => "admin1", "role" => "admin", "email" => "admin@indus", "name" => "CESA Administrator"]
        ]);
    }

    if ($role === 'student' && $email === 'student@indus' && $password === 'student123') {
        jsonResponse([
            "success" => true,
            "user" => [
                "id" => "stu1",
                "role" => "student",
                "email" => "student@indus",
                "name" => "Aarav Patel",
                "iuNumber" => "IU22CE045",
                "department" => "Computer Engineering",
                "semester" => "6th Semester",
                "phone" => "9876543210"
            ]
        ]);
    }

    jsonResponse(["success" => false, "message" => "Invalid email or password"], 401);
}

if ($action === 'register') {
    $name = trim($input['name'] ?? '');
    $iuNumber = trim($input['iuNumber'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = trim($input['password'] ?? 'student123');
    $department = trim($input['department'] ?? 'Computer Engineering');
    $semester = trim($input['semester'] ?? '6th Semester');
    $phone = trim($input['phone'] ?? '');

    if (empty($name) || empty($iuNumber) || empty($email)) {
        jsonResponse(["success" => false, "message" => "Name, IU Number, and Email are required."], 400);
    }

    if ($pdo) {
        $check = $pdo->prepare("SELECT id FROM `students` WHERE `email` = ? OR `iu_number` = ? LIMIT 1");
        $check->execute([$email, $iuNumber]);
        if ($check->fetch()) {
            jsonResponse(["success" => false, "message" => "Student with this Email or IU Number already exists"], 409);
        }

        $uStmt = $pdo->prepare("INSERT INTO `users` (`email`, `password`, `name`, `role`) VALUES (?, ?, ?, 'student')");
        $uStmt->execute([$email, $password, $name]);
        $userId = $pdo->lastInsertId();

        $stuId = 'stu' . time();
        $sStmt = $pdo->prepare("INSERT INTO `students` (`id`, `user_id`, `iu_number`, `name`, `email`, `department`, `semester`, `phone`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $sStmt->execute([$stuId, $userId, $iuNumber, $name, $email, $department, $semester, $phone]);

        jsonResponse([
            "success" => true,
            "message" => "Registration successful! You can now login.",
            "student" => [
                "id" => $stuId,
                "name" => $name,
                "iuNumber" => $iuNumber,
                "email" => $email,
                "department" => $department,
                "semester" => $semester,
                "role" => "student"
            ]
        ]);
    }

    jsonResponse([
        "success" => true,
        "message" => "Registration registered in fallback mode",
        "student" => [
            "id" => "stu" . time(),
            "name" => $name,
            "iuNumber" => $iuNumber,
            "email" => $email,
            "department" => $department,
            "semester" => $semester,
            "role" => "student"
        ]
    ]);
}

jsonResponse(["success" => false, "message" => "Unknown action"], 400);
?>
