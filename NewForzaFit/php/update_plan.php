<?php
session_start();
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
    echo json_encode(['status' => 'error', 'message' => 'Plan-ID fehlt']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, user_id, name FROM plans WHERE id = ?');
    $stmt->execute([$plan_id]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$plan || $plan['user_id'] != $_SESSION['user_id']) {
        echo json_encode(['status' => 'error', 'message' => 'Plan nicht gefunden oder nicht berechtigt']);
        exit;
    }

    if (!isset($data['exercises'])) {
        $stmt = $pdo->prepare('SELECT id, name, muscle_group FROM exercises WHERE plan_id = ?');
        $stmt->execute([$plan_id]);
        $exercises = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($exercises as &$ex) {
            $stmt2 = $pdo->prepare('SELECT id, set_number, weight, reps FROM plan_sets WHERE exercise_id = ? ORDER BY set_number');
            $stmt2->execute([$ex['id']]);
            $ex['sets'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode([
            'status' => 'success',
            'plan' => [
                'id' => $plan['id'],
                'name' => $plan['name'],
                'exercises' => $exercises
            ]
        ]);
        exit;
    }

    $exercises = $data['exercises'];

    $stmt = $pdo->prepare('DELETE FROM plan_sets WHERE exercise_id IN (SELECT id FROM exercises WHERE plan_id = ?)');
    $stmt->execute([$plan_id]);

    $stmt = $pdo->prepare('DELETE FROM exercises WHERE plan_id = ?');
    $stmt->execute([$plan_id]);

    foreach ($exercises as $ex) {
        $name = $ex['name'] ?? '';
        if (!$name) continue;

        $muscle = $ex['muscle_group'] ?? '';
        $exWeight = floatval($ex['weight'] ?? 0);
        $exReps = intval($ex['reps'] ?? 8);
        $exSets = intval($ex['sets'] ?? 3);

        $stmt = $pdo->prepare('INSERT INTO exercises (plan_id, name, muscle_group) VALUES (?, ?, ?)');
        $stmt->execute([$plan_id, $name, $muscle]);
        $exercise_id = $pdo->lastInsertId();

        for ($i = 1; $i <= $exSets; $i++) {
            $stmt2 = $pdo->prepare('INSERT INTO plan_sets (exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?)');
            $stmt2->execute([$exercise_id, $i, $exWeight, $exReps]);
        }
    }

    echo json_encode(['status' => 'success', 'message' => 'Plan aktualisiert']);
} catch (Exception $e) {
    error_log('update_plan.php Fehler: ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Fehler beim Speichern/Laden des Plans']);
}
