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

try {
    $stmt = $pdo->prepare("INSERT INTO workouts (user_id, plan_id) VALUES (?, ?)");
    $stmt->execute([$_SESSION['user_id'], $plan_id]);
    $workout_id = $pdo->lastInsertId();

    $stmt = $pdo->prepare("SELECT id FROM exercises WHERE plan_id = ?");
    $stmt->execute([$plan_id]);
    $exercises = $stmt->fetchAll();

    foreach ($exercises as $ex) {
        $stmt = $pdo->prepare("SELECT * FROM plan_sets WHERE exercise_id = ? ORDER BY set_number");
        $stmt->execute([$ex['id']]);
        $sets = $stmt->fetchAll();

        foreach ($sets as $set) {
            $stmt = $pdo->prepare("INSERT INTO workout_sets (workout_id, exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$workout_id, $ex['id'], $set['set_number'], $set['weight'], $set['reps']]);
        }
    }

    $stmt = $pdo->prepare("SELECT e.id, e.name, e.muscle_group FROM exercises e WHERE e.plan_id = ?");
    $stmt->execute([$plan_id]);
    $exercises = $stmt->fetchAll();

    foreach ($exercises as &$ex) {
        $stmt = $pdo->prepare("SELECT * FROM workout_sets WHERE workout_id = ? AND exercise_id = ? ORDER BY set_number");
        $stmt->execute([$workout_id, $ex['id']]);
        $ex['sets'] = $stmt->fetchAll();
    }

    echo json_encode([
        'status' => 'success',
        'workout_id' => $workout_id,
        'exercises' => $exercises
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Fehler: ' . $e->getMessage()]);
}
