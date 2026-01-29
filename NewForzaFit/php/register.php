<?php
session_start();
header('Content-Type: application/json');

require 'connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Nur POST erlaubt']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');
$passwordConfirm = trim($data['passwordConfirm'] ?? '');

if (strlen($username) < 3 || strlen($username) > 20) {
    echo json_encode(['status' => 'error', 'message' => 'Benutzername muss 3-30 Zeichen lang sein']);
    exit;
}

if (!$username || !$password || !$passwordConfirm) {
    echo json_encode(['status' => 'error', 'message' => 'Alle Felder ausfüllen']);
    exit;
}

if ($password !== $passwordConfirm) {
    echo json_encode(['status' => 'error', 'message' => 'Passwörter stimmen nicht überein']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Passwort muss mindestens 6 Zeichen lang sein']);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    echo json_encode(['status' => 'error', 'message' => 'Benutzername bereits vergeben']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$stmt->execute([$username, $hash]);

$_SESSION['user_id'] = $pdo->lastInsertId();
$_SESSION['username'] = $username;
$_SESSION['role'] = 'user';

echo json_encode(['status' => 'success', 'message' => 'Registrierung erfolgreich']);
