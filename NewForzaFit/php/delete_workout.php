<?php
session_start();
require 'connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Nicht angemeldet'
    ]);
    exit;
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Nur POST erlaubt'
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$workoutId = isset($data['workout_id']) ? (int)$data['workout_id'] : 0;

if (!$workoutId) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Workout-ID erforderlich'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id FROM workouts WHERE id = ? AND user_id = ?');
    $stmt->execute([$workoutId, $_SESSION['user_id']]);
    $workout = $stmt->fetch();

    if (!$workout) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'Workout nicht gefunden'
        ]);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM workout_sets WHERE workout_id = ?');
    $stmt->execute([$workoutId]);

    $stmt = $pdo->prepare('DELETE FROM workouts WHERE id = ?');
    $stmt->execute([$workoutId]);

    echo json_encode([
        'status'  => 'success',
        'message' => 'Workout gelöscht'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Fehler: ' . $e->getMessage()
    ]);
}
