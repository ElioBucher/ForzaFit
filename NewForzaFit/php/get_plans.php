<?php
session_start();
header('Content-Type: application/json');

require 'connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Nicht angemeldet']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$_SESSION['user_id']]);
$plans = $stmt->fetchAll();

foreach ($plans as &$plan) {
    $stmt = $pdo->prepare("SELECT e.id, e.name, e.muscle_group FROM exercises e WHERE e.plan_id = ?");
    $stmt->execute([$plan['id']]);
    $plan['exercises'] = $stmt->fetchAll();

    foreach ($plan['exercises'] as &$ex) {
        $stmt = $pdo->prepare("SELECT * FROM plan_sets WHERE exercise_id = ? ORDER BY set_number");
        $stmt->execute([$ex['id']]);
        $ex['sets'] = $stmt->fetchAll();
    }
}

echo json_encode(['status' => 'success', 'plans' => $plans]);
