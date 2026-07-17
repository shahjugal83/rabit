<?php require_once 'config.php';
$token = $_GET['token'] ?? '';
if (empty($token)) { header('Location: login.php'); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Rabbit Invoice</title>
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
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p class="text-gray-500 text-sm mb-6">Enter your new password below.</p>

            <div id="global-error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm"></div>
            <div id="success-msg" class="hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm"></div>

            <form id="resetForm" onsubmit="handleReset(event)">
                <div class="mb-4">
                    <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" required
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                           placeholder="Enter new password">
                    <p class="text-gray-400 text-xs mt-1">Min 8 chars, uppercase, lowercase, digit, special char</p>
                    <p id="newPassword-error" class="hidden text-red-600 text-sm mt-1"></p>
                </div>

                <div class="mb-6">
                    <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                           placeholder="Confirm new password">
                    <p id="confirmPassword-error" class="hidden text-red-600 text-sm mt-1"></p>
                </div>

                <button type="submit" id="submitBtn"
                        class="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition font-medium">
                    Reset Password
                </button>
            </form>

            <p class="text-center text-gray-500 text-sm mt-6">
                <a href="login.php" class="text-blue-600 hover:underline font-medium">Back to Login</a>
            </p>
        </div>
    </div>

    <script src="js/api.js"></script>
    <script>
        const TOKEN = <?php echo json_encode($token); ?>;

        async function handleReset(e) {
            e.preventDefault();
            clearFieldErrors();
            hideGlobalError();
            document.getElementById('success-msg').classList.add('hidden');

            const password = document.getElementById('newPassword').value;
            const confirm = document.getElementById('confirmPassword').value;

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
            if (!passwordRegex.test(password)) {
                showFieldError('newPassword', 'Password must be min 8 chars with uppercase, lowercase, digit, and special character');
                return;
            }

            if (password !== confirm) {
                showFieldError('confirmPassword', 'Passwords do not match');
                return;
            }

            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.textContent = 'Resetting...';

            const result = await apiCall('POST', '/auth/reset-password', {
                token: TOKEN,
                newPassword: password
            });

            btn.disabled = false;
            btn.textContent = 'Reset Password';

            if (!result) return;

            if (result.status === 200) {
                document.getElementById('success-msg').textContent = 'Password reset successfully! Redirecting to login...';
                document.getElementById('success-msg').classList.remove('hidden');
                document.getElementById('resetForm').reset();
                setTimeout(() => { window.location.href = 'login.php'; }, 2000);
            } else if (result.status === 400) {
                showGlobalError(result.data?.message || result.data?.error || 'Invalid or expired token. Please request a new reset link.');
            } else {
                showGlobalError(result.data?.message || result.data?.error || 'Something went wrong. Please try again.');
            }
        }
    </script>
</body>
</html>
