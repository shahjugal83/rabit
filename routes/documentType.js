const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { DocumentTypeService } = require('../services/DocumentTypeService');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /companies/{companyId}/document-types:
 *   post:
 *     tags: [Document Types]
 *     summary: Create a document type
 *     description: Creates a single document type for the given company. Requires `documents:write` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Company-Id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID for permission scope
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
 *             name: "Tax Invoice"
 *             documentNumber: "INV-001"
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique document type name within the company
 *               documentNumber:
 *                 type: string
 *                 description: Free-text document number
 *     responses:
 *       201:
 *         description: Document type created
 *         content:
 *           application/json:
 *             example:
 *               documentTypeId: "aa0e8400-e29b-41d4-a716-446655440005"
 *               companyId: "660e8400-e29b-41d4-a716-446655440001"
 *               name: "Tax Invoice"
 *               documentNumber: "INV-001"
 *               createdBy: "550e8400-e29b-41d4-a716-446655440000"
 *               updatedBy: "550e8400-e29b-41d4-a716-446655440000"
 *               createdAt: "2026-07-21T10:30:00.000Z"
 *               creator:
 *                 firstName: John
 *                 lastName: Doe
 *                 username: johndoe
 *               updater:
 *                 firstName: John
 *                 lastName: Doe
 *                 username: johndoe
 *       400:
 *         description: Duplicate document type name
 *       403:
 *         description: Missing documents:write permission
 */
router.post('/', authenticate, authorize('documents', 'create'), async (req, res, next) => {
  try {
    const result = await DocumentTypeService.create(req.params.companyId, req.body, req.userId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}/document-types/bulk:
 *   post:
 *     tags: [Document Types]
 *     summary: Bulk-create document types
 *     description: Creates multiple document types at once. Duplicate names within the same company are silently skipped.
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
 *           example:
 *             names: ["Tax Invoice", "Proforma Invoice", "Credit Note", "Debit Note"]
 *           schema:
 *             type: object
 *             required: [names]
 *             properties:
 *               names:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Array of document type names to create
 *     responses:
 *       201:
 *         description: Newly created document types
 *         content:
 *           application/json:
 *             example:
 *               - documentTypeId: "aa0e8400-e29b-41d4-a716-446655440005"
 *                 companyId: "660e8400-e29b-41d4-a716-446655440001"
 *                 name: "Tax Invoice"
 *                 documentNumber: "INV-001"
 *                 createdBy: "550e8400-e29b-41d4-a716-446655440000"
 *                 updatedBy: "550e8400-e29b-41d4-a716-446655440000"
 *                 createdAt: "2026-07-21T10:30:00.000Z"
 *                 creator:
 *                   firstName: John
 *                   lastName: Doe
 *                   username: johndoe
 *                 updater:
 *                   firstName: John
 *                   lastName: Doe
 *                   username: johndoe
 *       400:
 *         description: names array is empty or missing
 *       403:
 *         description: Missing documents:write permission
 */
router.post('/bulk', authenticate, authorize('documents', 'create'), async (req, res, next) => {
  try {
    const result = await DocumentTypeService.bulkCreate(req.params.companyId, req.body.names, req.userId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}/document-types:
 *   get:
 *     tags: [Document Types]
 *     summary: List document types for a company
 *     description: Returns all document types belonging to the company. Requires `documents:read` permission.
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
 *         description: List of document types
 *         content:
 *           application/json:
 *             example:
 *               - documentTypeId: "aa0e8400-e29b-41d4-a716-446655440005"
 *                 companyId: "660e8400-e29b-41d4-a716-446655440001"
 *                 name: "Tax Invoice"
 *                 documentNumber: "INV-001"
 *                 createdBy: "550e8400-e29b-41d4-a716-446655440000"
 *                 updatedBy: "550e8400-e29b-41d4-a716-446655440000"
 *                 createdAt: "2026-07-21T10:30:00.000Z"
 *                 creator:
 *                   firstName: John
 *                   lastName: Doe
 *                   username: johndoe
 *                 updater:
 *                   firstName: John
 *                   lastName: Doe
 *                   username: johndoe
 *       403:
 *         description: Missing documents:read permission
 */
router.get('/', authenticate, authorize('documents', 'read'), async (req, res, next) => {
  try {
    const result = await DocumentTypeService.listByCompany(req.params.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /companies/{companyId}/document-types/{documentTypeId}:
 *   delete:
 *     tags: [Document Types]
 *     summary: Delete a document type
 *     description: Deletes a document type by ID. Requires `documents:write` permission.
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
 *         name: documentTypeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document type deleted
 *         content:
 *           application/json:
 *             example:
 *               message: "Document type deleted successfully"
 *       404:
 *         description: Document type not found
 *       403:
 *         description: Missing documents:write permission
 */
router.delete('/:documentTypeId', authenticate, authorize('documents', 'delete'), async (req, res, next) => {
  try {
    await DocumentTypeService.delete(req.params.documentTypeId);
    res.json({ message: 'Document type deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
