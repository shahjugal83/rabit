const express = require('express');
const { authenticate } = require('../middleware/auth');
const { AuthService } = require('../services/AuthService');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     description: Creates a new user and sends a verification email. User status is INACTIVE until email is verified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             user:
 *               username: johndoe
 *               email: john@example.com
 *               password: Secret123!
 *               firstName: John
 *               lastName: Doe
 *               city: Mumbai
 *               state: Maharashtra
 *               country: India
 *               pinCode: "400001"
 *           schema:
 *             type: object
 *             required: [user]
 *             properties:
 *               user:
 *                 type: object
 *                 required: [username, email, password]
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: johndoe
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: john@example.com
 *                   password:
 *                     type: string
 *                     minLength: 8
 *                     example: Secret123!
 *                   firstName:
 *                     type: string
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *                   addressLine1:
 *                     type: string
 *                   addressLine2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pinCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: User registered, verification email sent
 *         content:
 *           application/json:
 *             example:
 *               userId: "550e8400-e29b-41d4-a716-446655440000"
 *               username: johndoe
 *               email: john@example.com
 *               firstName: John
 *               lastName: Doe
 *               status: INACTIVE
 *               message: "Verification email sent. Please verify your email."
 *       409:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             example:
 *               timestamp: "2026-07-21T10:30:00.000Z"
 *               requestId: "a1b2c3d4"
 *               status: 409
 *               error: "User Already Exists"
 *               message: "Email already exists: john@example.com"
 *               path: "/api/v1/auth/register"
 */
router.post('/register', async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body.user, req);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with token
 *     description: Activates the user account by consuming the verification token sent to their email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             token: "550e8400-e29b-41d4-a716-446655440000"
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: The verification token from the email link
 *     responses:
 *       200:
 *         description: Email verified, user activated
 *         content:
 *           application/json:
 *             example:
 *               message: "Email verified successfully"
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             example:
 *               timestamp: "2026-07-21T10:30:00.000Z"
 *               status: 401
 *               error: "Invalid Token"
 *               message: "Token has expired"
 */
router.post('/verify', async (req, res, next) => {
  try {
    const result = await AuthService.verifyEmail(req.body.token);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email or username
 *     description: Returns a JWT token bound to the client's fingerprint (user-agent + IP). Account must be email-verified first.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             identifier: john@example.com
 *             password: Secret123!
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or username
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Secret123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               userId: "550e8400-e29b-41d4-a716-446655440000"
 *               username: johndoe
 *               email: john@example.com
 *               firstName: John
 *               lastName: Doe
 *               token: "eyJhbGciOiJIUzI1NiIs..."
 *               expiresIn: 86400000
 *       400:
 *         description: Invalid credentials or account locked
 *         content:
 *           application/json:
 *             example:
 *               timestamp: "2026-07-21T10:30:00.000Z"
 *               status: 400
 *               error: "Bad Request"
 *               message: "Log in failed, please provide correct username or password"
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             example:
 *               timestamp: "2026-07-21T10:30:00.000Z"
 *               status: 403
 *               error: "Email Not Verified"
 *               message: "Email verification pending. Please verify your email first."
 */
router.post('/login', async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body.identifier, req.body.password, req);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile including all company memberships and roles.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile with company memberships
 *         content:
 *           application/json:
 *             example:
 *               userId: "550e8400-e29b-41d4-a716-446655440000"
 *               username: johndoe
 *               email: john@example.com
 *               firstName: John
 *               lastName: Doe
 *               city: Mumbai
 *               state: Maharashtra
 *               country: India
 *               status: ACTIVE
 *               companies:
 *                 - companyId: "660e8400-e29b-41d4-a716-446655440001"
 *                   name: "Acme Corp"
 *                   role:
 *                     roleId: "770e8400-e29b-41d4-a716-446655440002"
 *                     name: SUPER_ADMIN
 *       401:
 *         description: Missing or invalid token
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await AuthService.getMe(req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend email verification
 *     description: Invalidates previous tokens and sends a new verification email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: john@example.com
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email resent
 *         content:
 *           application/json:
 *             example:
 *               message: "Verification email sent"
 *       404:
 *         description: User not found
 */
router.post('/resend-verification', async (req, res, next) => {
  try {
    const result = await AuthService.resendVerification(req.body.email, req);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset email
 *     description: If an account exists with the given email, sends a password reset link. Always returns the same message to prevent email enumeration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: john@example.com
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Always returns success (prevents email enumeration)
 *         content:
 *           application/json:
 *             example:
 *               message: "If an account exists with that email, a password reset link has been sent."
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email, req);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     description: Sets a new password using the token from the reset email. If the user's email was unverified, it will be verified as a side effect.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             token: "550e8400-e29b-41d4-a716-446655440000"
 *             newPassword: NewSecret456!
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Password reset successfully"
 *       400:
 *         description: Invalid or expired reset token
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const result = await AuthService.resetPassword(req.body.token, req.body.newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: Update current user profile
 *     description: Updates the authenticated user's profile fields (name, address, etc.)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             firstName: John
 *             lastName: Smith
 *             city: Mumbai
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pinCode:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: No fields to update
 *       401:
 *         description: Missing or invalid token
 */
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const result = await AuthService.updateProfile(req.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change current user's password
 *     description: Requires the current password for verification before setting the new one.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             currentPassword: Secret123!
 *             newPassword: NewSecret456!
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Incorrect current password or weak new password
 *       401:
 *         description: Missing or invalid token
 */
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const result = await AuthService.changePassword(req.userId, req.body.currentPassword, req.body.newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /auth/test/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Test-only - instantly verify a user by email
 *     description: Development helper - immediately marks the user as verified without requiring the email token. Should not be exposed in production.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: john@example.com
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: User verified
 *         content:
 *           application/json:
 *             example:
 *               message: "User john@example.com verified"
 *       404:
 *         description: User not found
 */
router.post('/test/verify-email', async (req, res, next) => {
  try {
    const result = await AuthService.testVerifyEmail(req.body.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
