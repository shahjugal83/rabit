<?php require_once 'config.php'; redirectIfLoggedIn(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Rabbit Invoice</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Rabbit</h1>
            <p class="text-gray-500 mt-1">SaaS Multi Tenant Platform</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h2>

            <div id="global-error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm"></div>

            <form id="loginForm" onsubmit="handleLogin(event)">
                <div class="mb-4">
                    <label for="identifier" class="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
                    <input type="text" id="identifier" name="identifier" required
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                           placeholder="john@example.com">
                    <p id="identifier-error" class="hidden text-red-600 text-sm mt-1"></p>
                </div>

                <div class="mb-6">
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" id="password" name="password" required
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                           placeholder="Enter your password">
                    <p id="password-error" class="hidden text-red-600 text-sm mt-1"></p>
                </div>

                <button type="submit" id="loginBtn"
                        class="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition font-medium">
                    Login
                </button>
            </form>

            <p class="text-center text-sm mt-4">
                <a href="forgot-password.php" class="text-blue-600 hover:underline">Forgot password?</a>
            </p>

            <p class="text-center text-gray-500 text-sm mt-6">
                Don't have an account?
                <a href="register.php" class="text-blue-600 hover:underline font-medium">Register</a>
            </p>
        </div>
    </div>

    <script src="js/api.js"></script>
    <script>
        async function handleLogin(e) {
            e.preventDefault();
            clearFieldErrors();
            hideGlobalError();

            const btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.textContent = 'Logging in...';

            const identifier = document.getElementById('identifier').value.trim();
            const password = document.getElementById('password').value;

            const result = await apiCall('POST', '/auth/login', { identifier, password });

            btn.disabled = false;
            btn.textContent = 'Login';

            if (!result) return;

            if (result.status === 200 && result.data) {
                setToken(result.data.token, result.data.userId);
                window.location.href = 'dashboard.php';
            } else if (result.status === 400) {
                showGlobalError(result.data?.message || 'Invalid credentials. Please try again.');
            } else if (result.status === 403) {
                showGlobalError('Email not verified. Please check your inbox for the verification link.');
            } else {
                showGlobalError(result.data?.message || 'Something went wrong. Please try again.');
            }
        }
    </script>
</body>
</html>
