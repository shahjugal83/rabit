<?php
session_start();

define('API_BASE', 'https://saas-invoice-api.onrender.com/api/v1');

function isLoggedIn(): bool {
    return isset($_SESSION['token']) && isset($_SESSION['userId']);
}

function getToken(): ?string {
    return $_SESSION['token'] ?? null;
}

function getUserId(): ?string {
    return $_SESSION['userId'] ?? null;
}

function requireLogin(): void {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

function redirectIfLoggedIn(): void {
    if (isLoggedIn()) {
        header('Location: dashboard.php');
        exit;
    }
}
