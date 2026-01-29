<?php
session_start();
header('Content-Type: application/json');

require 'connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Nicht angemeldet']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM workouts WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $total_workouts = $stmt->fetch()['count'];

    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_duration_minutes), 0) as total FROM workouts WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $total_minutes = $stmt->fetch()['total'];

    $stmt = $pdo->prepare("
        SELECT e.name, COUNT(ws.id) as count
        FROM workout_sets ws
        JOIN exercises e ON ws.exercise_id = e.id
        JOIN workouts w ON ws.workout_id = w.id
        WHERE w.user_id = ? AND ws.completed = 1
        GROUP BY e.id
        ORDER BY count DESC
        LIMIT 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $top_exercise = $stmt->fetch();

    $stmt = $pdo->prepare("
        SELECT e.muscle_group, COUNT(ws.id) as sets_count, COUNT(DISTINCT w.id) as workouts_count
        FROM workout_sets ws
        JOIN exercises e ON ws.exercise_id = e.id
        JOIN workouts w ON ws.workout_id = w.id
        WHERE w.user_id = ? AND ws.completed = 1
        GROUP BY e.muscle_group
        ORDER BY sets_count DESC
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $muscle_groups = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'total_workouts' => $total_workouts,
        'total_minutes' => intval($total_minutes),
        'top_exercise' => $top_exercise['name'] ?? 'Keine',
        'muscle_groups' => $muscle_groups
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Fehler: ' . $e->getMessage()]);
}
