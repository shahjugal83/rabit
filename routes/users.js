const express = require('express');
const router = express.Router();
const { UserService } = require('../services/UserService');
const { authorize } = require('../middleware/authorize');
const { authenticate } = require('../middleware/auth');
const { featureGuard } = require('../middleware/featureGuard');

/**
 * @swagger
 * /companies/{companyId}/users:
 *   get:
 *     tags: [Users]
 *     summary: List users in a company
 *     description: Returns all users who are members of the company, including their role and user details. Requires `users:read` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of company users with roles
 *         content:
 *           application/json:
 *             example:
 *               - id: "cu-001"
 *                 userId: "550e8400-e29b-41d4-a716-446655440000"
 *                 companyId: "660e8400-e29b-41d4-a716-446655440001"
 *                 active: true
 *                 createdAt: "2026-07-21T10:00:00.000Z"
 *                 user:
 *                   userId: "550e8400-e29b-41d4-a716-446655440000"
 *                   username: "johndoe"
 *                   email: "john@example.com"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   status: "ACTIVE"
 *                 role:
 *                   roleId: "770e8400-e29b-41d4-a716-446655440002"
 *                   name: "SUPER_ADMIN"
 *       403:
 *         description: Missing users:read permission
 */
router.get('/companies/:companyId/users', authenticate, authorize('users', 'read'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const result = await UserService.listByCompany(req.params.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}/users:
 *   post:
 *     tags: [Users]
 *     summary: Add a user to a company
 *     description: |
 *       Adds an existing user to the company, or creates a new user account and adds them.
 *       If the email matches an existing user, only `email` and `roleId` are required.
 *       For new users, `username` and `password` are also required — a verification email is sent automatically.
 *       Requires `users:write` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             existingUser:
 *               summary: Add an existing user
 *               value:
 *                 email: jane@example.com
 *                 roleId: "880e8400-e29b-41d4-a716-446655440003"
 *             newUser:
 *               summary: Create and add a new user
 *               value:
 *                 email: bob@example.com
 *                 username: bobsmith
 *                 password: Secret789!
 *                 firstName: Bob
 *                 lastName: Smith
 *                 roleId: "880e8400-e29b-41d4-a716-446655440003"
 *           schema:
 *             type: object
 *             required: [email, roleId]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               roleId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               username:
 *                 type: string
 *                 description: Required when creating a new user
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Required when creating a new user
 *     responses:
 *       201:
 *         description: User added (or created and added)
 *         content:
 *           application/json:
 *             example:
 *               userId: "990e8400-e29b-41d4-a716-446655440004"
 *               email: "bob@example.com"
 *               firstName: "Bob"
 *               lastName: "Smith"
 *               roleId: "880e8400-e29b-41d4-a716-446655440003"
 *               active: true
 *               createdAt: "2026-07-21T10:30:00.000Z"
 *               message: "New user created and added to company. Verification email sent."
 *       400:
 *         description: User already a member / role does not belong to this company
 *       403:
 *         description: Missing users:write permission
 *       409:
 *         description: Username or email already exists
 */
router.post('/companies/:companyId/users', authenticate, authorize('users', 'create'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const { email, firstName, lastName, username, password, roleId } = req.body;
    const result = await UserService.addToCompany(req.params.companyId, { email, firstName, lastName, username, password, roleId });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}/users/{userId}/role:
 *   put:
 *     tags: [Users]
 *     summary: Change a user's role
 *     description: |
 *       Updates the role assigned to a user within the company.
 *       **Self-protection:** A user cannot change their own role — the request will be rejected with 400.
 *       Requires `users:write` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The target user's ID (not your own)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             roleId: "880e8400-e29b-41d4-a716-446655440003"
 *           schema:
 *             type: object
 *             required: [roleId]
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: The new role ID to assign
 *     responses:
 *       200:
 *         description: Role updated
 *         content:
 *           application/json:
 *             example:
 *               id: "cu-002"
 *               userId: "990e8400-e29b-41d4-a716-446655440004"
 *               companyId: "660e8400-e29b-41d4-a716-446655440001"
 *               active: true
 *               createdAt: "2026-07-21T10:30:00.000Z"
 *               user:
 *                 userId: "990e8400-e29b-41d4-a716-446655440004"
 *                 username: "bobsmith"
 *                 email: "bob@example.com"
 *                 firstName: "Bob"
 *                 lastName: "Smith"
 *                 status: "INACTIVE"
 *               role:
 *                 roleId: "880e8400-e29b-41d4-a716-446655440003"
 *                 name: "ADMIN"
 *       400:
 *         description: Cannot change your own role
 *         content:
 *           application/json:
 *             example:
 *               timestamp: "2026-07-21T10:30:00.000Z"
 *               status: 400
 *               error: "Bad Request"
 *               message: "Cannot change your own role"
 *       403:
 *         description: Missing users:write permission
 *       404:
 *         description: User is not a member of this company / role not found
 */
router.put('/companies/:companyId/users/:userId/role', authenticate, authorize('users', 'update'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const result = await UserService.changeRole(req.params.companyId, req.params.userId, req.body, req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}/users/{userId}:
 *   delete:
 *     tags: [Users]
 *     summary: Remove a user from a company
 *     description: |
 *       Soft-removes a user from the company by setting `active` to false. The user record is not deleted.
 *       **Self-protection:** A user cannot remove themselves from the company — the request will be rejected with 400.
 *       Requires `users:write` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The target user's ID (not your own)
 *     responses:
 *       200:
 *         description: User removed from company
 *         content:
 *           application/json:
 *             example:
 *               deleted: true
 *       400:
 *         description: Cannot remove yourself from company
 *         content:
 *           application/json:
 *             example:
 *               timestamp: "2026-07-21T10:30:00.000Z"
 *               status: 400
 *               error: "Bad Request"
 *               message: "Cannot remove yourself from company"
 *       403:
 *         description: Missing users:write permission
 *       404:
 *         description: User is not a member of this company
 */
router.delete('/companies/:companyId/users/:userId', authenticate, authorize('users', 'delete'), featureGuard('userFeature'), async (req, res, next) => {
  try {
    const result = await UserService.removeFromCompany(req.params.companyId, req.params.userId, req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
