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
$workout_id = intval($data['workout_id'] ?? 0);

if (!$workout_id) {
    echo json_encode(['status' => 'error', 'message' => 'Workout-ID erforderlich']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT started_at FROM workouts WHERE id = ?");
    $stmt->execute([$workout_id]);
    $workout = $stmt->fetch();

    $start = new DateTime($workout['started_at']);
    $end = new DateTime();
    $duration = $end->diff($start);
    $minutes = ($duration->h * 60) + $duration->i;

    $stmt = $pdo->prepare("UPDATE workouts SET ended_at = NOW(), total_duration_minutes = ? WHERE id = ?");
    $stmt->execute([$minutes, $workout_id]);

    echo json_encode(['status' => 'success', 'message' => 'Workout beendet', 'duration_minutes' => $minutes]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Fehler: ' . $e->getMessage()]);
}
