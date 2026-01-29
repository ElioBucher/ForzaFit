<?php
session_start();
header('Content-Type: application/json');

require 'connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Nicht angemeldet']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Nur POST erlaubt']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$plan_id = intval($data['plan_id'] ?? 0);

if (!$plan_id) {
    echo json_encode(['status' => 'error', 'message' => 'Plan-ID erforderlich']);
    exit;
}

$stmt = $pdo->prepare("SELECT user_id FROM plans WHERE id = ?");
$stmt->execute([$plan_id]);
$plan = $stmt->fetch();

if (!$plan || $plan['user_id'] != $_SESSION['user_id']) {
    echo json_encode(['status' => 'error', 'message' => 'Nicht berechtigt']);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM plans WHERE id = ?");
$stmt->execute([$plan_id]);

echo json_encode(['status' => 'success', 'message' => 'Plan gelöscht']);
