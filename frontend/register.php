<?php require_once 'config.php'; redirectIfLoggedIn(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - Rabbit Invoice</title>
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
<body class="bg-gray-50 min-h-screen flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-lg">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Rabbit</h1>
            <p class="text-gray-500 mt-1">SaaS Multi Tenant Platform</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Create Your Account</h2>

            <div id="global-error" class="hidden global-error"></div>
            <div id="global-success" class="hidden global-success"></div>

            <form id="registerForm" onsubmit="handleRegister(event)">
                <div class="mb-4">
                    <label for="username" class="label">Username *</label>
                    <input type="text" id="username" name="username" required
                           class="form-input" placeholder="johndoe">
                    <p id="username-error" class="hidden field-error"></p>
                </div>

                <div class="mb-4">
                    <label for="email" class="label">Email *</label>
                    <input type="email" id="email" name="email" required
                           class="form-input" placeholder="john@example.com">
                    <p id="email-error" class="hidden field-error"></p>
                </div>

                <div class="mb-4">
                    <label for="password" class="label">Password *</label>
                    <input type="password" id="password" name="password" required
                           class="form-input" placeholder="Create a strong password">
                    <p class="text-xs text-gray-400 mt-1">Min 8 chars with uppercase, lowercase, digit, and special character</p>
                    <p id="password-error" class="hidden field-error"></p>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label for="firstName" class="label">First Name</label>
                        <input type="text" id="firstName" name="firstName"
                               class="form-input" placeholder="John">
                        <p id="firstName-error" class="hidden field-error"></p>
                    </div>
                    <div>
                        <label for="lastName" class="label">Last Name</label>
                        <input type="text" id="lastName" name="lastName"
                               class="form-input" placeholder="Doe">
                        <p id="lastName-error" class="hidden field-error"></p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label for="city" class="label">City *</label>
                        <input type="text" id="city" name="city" required
                               class="form-input" placeholder="Mumbai">
                        <p id="city-error" class="hidden field-error"></p>
                    </div>
                    <div>
                        <label for="state" class="label">State *</label>
                        <input type="text" id="state" name="state" required
                               class="form-input" placeholder="Maharashtra">
                        <p id="state-error" class="hidden field-error"></p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label for="country" class="label">Country *</label>
                        <input type="text" id="country" name="country" required
                               class="form-input" placeholder="India">
                        <p id="country-error" class="hidden field-error"></p>
                    </div>
                    <div>
                        <label for="pinCode" class="label">PIN Code *</label>
                        <input type="text" id="pinCode" name="pinCode" required
                               class="form-input" placeholder="400001" maxlength="6" pattern="[0-9]{6}">
                        <p id="pinCode-error" class="hidden field-error"></p>
                    </div>
                </div>

                <button type="submit" id="registerBtn" class="btn-primary">
                    Register
                </button>
            </form>

            <p class="text-center text-gray-500 text-sm mt-6">
                Already have an account?
                <a href="login.php" class="text-blue-600 hover:underline font-medium">Login</a>
            </p>
        </div>
    </div>

    <script src="js/api.js"></script>
    <script>
        async function handleRegister(e) {
            e.preventDefault();
            clearFieldErrors();
            hideGlobalError();

            const btn = document.getElementById('registerBtn');
            btn.disabled = true;
            btn.textContent = 'Creating account...';

            const body = {
                user: {
                    username: document.getElementById('username').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    password: document.getElementById('password').value,
                    firstName: document.getElementById('firstName').value.trim(),
                    lastName: document.getElementById('lastName').value.trim(),
                    city: document.getElementById('city').value.trim(),
                    state: document.getElementById('state').value.trim(),
                    country: document.getElementById('country').value.trim(),
                    pinCode: document.getElementById('pinCode').value.trim()
                }
            };

            const result = await apiCall('POST', '/auth/register', body);

            btn.disabled = false;
            btn.textContent = 'Register';

            if (!result) return;

            if (result.status === 201 && result.data) {
                document.getElementById('registerForm').style.display = 'none';
                const successEl = document.getElementById('global-success');
                successEl.textContent = 'Verification email sent. Please check your inbox and verify your email before logging in.';
                successEl.classList.remove('hidden');
            } else if (result.status === 409) {
                showGlobalError(result.data?.message || 'Email or username already exists.');
            } else if (result.status === 400 && result.data?.validationErrors) {
                const errors = result.data.validationErrors;
                for (const [field, msg] of Object.entries(errors)) {
                    showFieldError(field, msg);
                }
            } else {
                showGlobalError(result.data?.message || 'Something went wrong. Please try again.');
            }
        }
    </script>
</body>
</html>
