<?php
session_start();
header('Content-Type: application/json');

$authenticated = isset($_SESSION['user_id']) && !empty($_SESSION['username']);
echo json_encode([
    'authenticated' => $authenticated,
    'username' => $_SESSION['username'] ?? null
]);
