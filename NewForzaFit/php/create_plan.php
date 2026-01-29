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

$name = trim($data['name'] ?? '');
$exercises = $data['exercises'] ?? [];

if (!$name) {
    echo json_encode(['status' => 'error', 'message' => 'Plan-Name erforderlich']);
    exit;
}

if (empty($exercises)) {
    echo json_encode(['status' => 'error', 'message' => 'Mindestens eine Übung erforderlich']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO plans (user_id, name) VALUES (?, ?)");
    $stmt->execute([$_SESSION['user_id'], $name]);
    $plan_id = $pdo->lastInsertId();

    foreach ($exercises as $ex) {
        $ex_name = trim($ex['name'] ?? '');
        $muscle_group = trim($ex['muscle_group'] ?? '');

    if (!$ex_name) {
        echo json_encode(['status' => 'error', 'message' => 'Alle Übungen müssen einen Namen haben']);
        exit;
    }

        $weight = floatval($ex['weight'] ?? 0);
        $reps = intval($ex['reps'] ?? 1);
        $sets = intval($ex['sets'] ?? 1);

        if ($weight < 0) $weight = 0;
        if ($weight > 500) $weight = 500;
        if ($reps < 1) $reps = 1;
        if ($reps > 100) $reps = 100;
        if ($sets < 1) $sets = 1;
        if ($sets > 20) $sets = 20;

        if (!$ex_name) continue;

        $stmt = $pdo->prepare("INSERT INTO exercises (plan_id, name, muscle_group) VALUES (?, ?, ?)");
        $stmt->execute([$plan_id, $ex_name, $muscle_group]);
        $exercise_id = $pdo->lastInsertId();

        for ($i = 1; $i <= $sets; $i++) {
            $stmt = $pdo->prepare("INSERT INTO plan_sets (exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?)");
            $stmt->execute([$exercise_id, $i, $weight, $reps]);
        }
    }

    echo json_encode(['status' => 'success', 'message' => 'Plan gespeichert', 'plan_id' => $plan_id]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Fehler: ' . $e->getMessage()]);
}
