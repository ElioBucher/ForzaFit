<?php
session_start();
header('Content-Type: application/json');

require 'connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Nicht angemeldet']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT w.id as workout_id, w.plan_id, p.name, w.started_at, w.ended_at, w.total_duration_minutes,
           COUNT(ws.id) as total_sets, SUM(CASE WHEN ws.completed = 1 THEN 1 ELSE 0 END) as completed_sets
    FROM workouts w
    JOIN plans p ON w.plan_id = p.id
    LEFT JOIN workout_sets ws ON w.id = ws.workout_id
    WHERE w.user_id = ?
    GROUP BY w.id
    ORDER BY w.started_at DESC
    LIMIT 50
");
$stmt->execute([$_SESSION['user_id']]);
$history = $stmt->fetchAll();

echo json_encode(['status' => 'success', 'history' => $history]);
