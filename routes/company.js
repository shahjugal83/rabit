const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { CompanyService } = require('../services/CompanyService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 } });

/**
 * @swagger
 * /companies:
 *   post:
 *     tags: [Companies]
 *     summary: Create a new company
 *     description: Creates a company and automatically assigns the creator as SUPER_ADMIN. Accepts an optional logo image (max 50KB, stored as PNG).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, addressLine1, city, state, country, pinCode, contactNumber]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Acme Corp"
 *               description:
 *                 type: string
 *                 example: "A leading tech company"
 *               addressLine1:
 *                 type: string
 *                 example: "123 Tech Park"
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               country:
 *                 type: string
 *                 example: "India"
 *               pinCode:
 *                 type: string
 *                 example: "400001"
 *               contactNumber:
 *                 type: string
 *                 example: "9876543210"
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Optional company logo (PNG, max 50KB)
 *     responses:
 *       201:
 *         description: Company created, creator assigned as SUPER_ADMIN
 *         content:
 *           application/json:
 *             example:
 *               companyId: "660e8400-e29b-41d4-a716-446655440001"
 *               name: "Acme Corp"
 *               urlSlug: "acme-corp"
 *               description: "A leading tech company"
 *               addressLine1: "123 Tech Park"
 *               addressLine2: null
 *               city: "Mumbai"
 *               state: "Maharashtra"
 *               country: "India"
 *               pinCode: "400001"
 *               contactNumber: "9876543210"
 *               hasLogo: false
 *               createdBy: "550e8400-e29b-41d4-a716-446655440000"
 *               createdAt: "2026-07-21T10:30:00.000Z"
 *               updatedAt: "2026-07-21T10:30:00.000Z"
 *               active: true
 *               userRole:
 *                 roleId: "770e8400-e29b-41d4-a716-446655440002"
 *                 name: "SUPER_ADMIN"
 *       409:
 *         description: Company name already exists
 */
router.post('/', authenticate, upload.single('logo'), async (req, res, next) => {
  try {
    const result = await CompanyService.create(req.userId, req.body, req.file?.buffer);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies:
 *   get:
 *     tags: [Companies]
 *     summary: List all companies for the authenticated user
 *     description: Returns every company the user belongs to, along with their role in each.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of company memberships
 *         content:
 *           application/json:
 *             example:
 *               - companyId: "660e8400-e29b-41d4-a716-446655440001"
 *                 name: "Acme Corp"
 *                 urlSlug: "acme-corp"
 *                 description: "A leading tech company"
 *                 addressLine1: "123 Tech Park"
 *                 city: "Mumbai"
 *                 state: "Maharashtra"
 *                 country: "India"
 *                 pinCode: "400001"
 *                 contactNumber: "9876543210"
 *                 hasLogo: true
 *                 createdBy: "550e8400-e29b-41d4-a716-446655440000"
 *                 createdAt: "2026-07-21T10:30:00.000Z"
 *                 updatedAt: "2026-07-21T10:30:00.000Z"
 *                 active: true
 *                 userRole:
 *                   roleId: "770e8400-e29b-41d4-a716-446655440002"
 *                   name: "SUPER_ADMIN"
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await CompanyService.listByUser(req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}:
 *   get:
 *     tags: [Companies]
 *     summary: Get a single company by ID
 *     description: Returns the company details if the authenticated user is a member.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         example: "660e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             example:
 *               companyId: "660e8400-e29b-41d4-a716-446655440001"
 *               name: "Acme Corp"
 *               urlSlug: "acme-corp"
 *               description: "A leading tech company"
 *               addressLine1: "123 Tech Park"
 *               city: "Mumbai"
 *               state: "Maharashtra"
 *               country: "India"
 *               pinCode: "400001"
 *               contactNumber: "9876543210"
 *               hasLogo: true
 *               createdBy: "550e8400-e29b-41d4-a716-446655440000"
 *               createdAt: "2026-07-21T10:30:00.000Z"
 *               updatedAt: "2026-07-21T10:30:00.000Z"
 *               active: true
 *               userRole:
 *                 roleId: "770e8400-e29b-41d4-a716-446655440002"
 *                 name: "SUPER_ADMIN"
 *       404:
 *         description: User does not have access to this company
 */
router.get('/:companyId', authenticate, async (req, res, next) => {
  try {
    const result = await CompanyService.getById(req.params.companyId, req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}/logo:
 *   get:
 *     tags: [Companies]
 *     summary: Download company logo
 *     description: Returns the company logo as a PNG image. Requires the user to be a member of the company.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logo image (PNG)
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: No logo attached or user not a member
 */
router.get('/:companyId/logo', authenticate, async (req, res, next) => {
  try {
    const logoBuffer = await CompanyService.getLogo(req.params.companyId, req.userId);
    if (!logoBuffer) {
      return res.status(404).json({ error: 'No logo attached to this company' });
    }
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(logoBuffer));
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}:
 *   put:
 *     tags: [Companies]
 *     summary: Update a company
 *     description: Only SUPER_ADMIN of the company can update it. Accepts an optional new logo (max 50KB).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Updated company description"
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               pinCode:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: New logo (PNG, max 50KB). Pass to replace.
 *     responses:
 *       200:
 *         description: Company updated
 *         content:
 *           application/json:
 *             example:
 *               companyId: "660e8400-e29b-41d4-a716-446655440001"
 *               name: "Acme Corp"
 *               urlSlug: "acme-corp"
 *               description: "Updated company description"
 *               addressLine1: "456 New Road"
 *               city: "Mumbai"
 *               state: "Maharashtra"
 *               country: "India"
 *               pinCode: "400001"
 *               contactNumber: "9876543210"
 *               hasLogo: true
 *               active: true
 *               userRole:
 *                 roleId: "770e8400-e29b-41d4-a716-446655440002"
 *                 name: "SUPER_ADMIN"
 *       400:
 *         description: Only SUPER_ADMIN can perform this action / logo too large
 */
router.put('/:companyId', authenticate, upload.single('logo'), async (req, res, next) => {
  try {
    const result = await CompanyService.update(req.params.companyId, req.userId, req.body, req.file?.buffer);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}/users:
 *   post:
 *     tags: [Companies]
 *     summary: Add a user to a company
 *     description: |
 *       Only SUPER_ADMIN can add users. If the email does not match an existing user, a new user account is created and a verification email is sent.
 *       The user must provide `username` and `password` when creating a new user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: jane@example.com
 *             roleId: "880e8400-e29b-41d4-a716-446655440003"
 *             firstName: Jane
 *             lastName: Smith
 *             username: janesmith
 *             password: Secret789!
 *           schema:
 *             type: object
 *             required: [email, roleId]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               roleId:
 *                 type: string
 *                 description: ID of the role to assign
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               username:
 *                 type: string
 *                 description: Required if user does not already exist
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Required if user does not already exist
 *     responses:
 *       201:
 *         description: User added to company (or new user created + added)
 *         content:
 *           application/json:
 *             example:
 *               userId: "990e8400-e29b-41d4-a716-446655440004"
 *               email: jane@example.com
 *               firstName: Jane
 *               lastName: Smith
 *               roleId: "880e8400-e29b-41d4-a716-446655440003"
 *               active: true
 *               createdAt: "2026-07-21T10:30:00.000Z"
 *               message: "New user created and added to company. Verification email sent."
 *       400:
 *         description: User is already a member / role does not belong to this company
 *       409:
 *         description: Email or username already exists
 */
router.post('/:companyId/users', authenticate, async (req, res, next) => {
  try {
    const result = await CompanyService.addUser(req.params.companyId, req.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
