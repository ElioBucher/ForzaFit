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

$set_id = intval($data['set_id'] ?? 0);
$completed = intval($data['completed'] ?? 0);
$weight = floatval($data['weight'] ?? null);
$reps = intval($data['reps'] ?? null);

if (!$set_id) {
    echo json_encode(['status' => 'error', 'message' => 'Set-ID erforderlich']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE workout_sets SET completed = ?, weight = ?, reps = ?, completed_at = ? WHERE id = ?");
    $stmt->execute([$completed, $weight, $reps, $completed ? date('Y-m-d H:i:s') : null, $set_id]);

    echo json_encode(['status' => 'success', 'message' => 'Set aktualisiert']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Fehler: ' . $e->getMessage()]);
}
