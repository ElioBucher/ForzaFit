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

if (!isset($_SESSION['login_attempts'])) {
    $_SESSION['login_attempts'] = 0;
    $_SESSION['last_login_attempt'] = time();
}

if ($_SESSION['login_attempts'] >= 10 && (time() - $_SESSION['last_login_attempt']) < 900) 
    {
        echo json_encode(['status' => 'error', 'message' => 'Zu viele fehlgeschlagene Versuche. Bitte in 15 Minuten erneut versuchen.']);
        exit;
    }
   

if (!$username || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'Alle Felder ausfüllen']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['login_attempts'] = 0;
    $_SESSION['last_login_attempt'] = time();
    echo json_encode(['status' => 'success', 'message' => 'Erfolgreich angemeldet']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Ungültiger Benutzername oder Passwort']);
}
