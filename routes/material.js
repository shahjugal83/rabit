const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { featureGuard } = require('../middleware/featureGuard');
const { MaterialService } = require('../services/MaterialService');

/**
 * @swagger
 * /materials:
 *   get:
 *     tags: [Materials]
 *     summary: List all materials
 *     description: Returns all materials across all companies. Requires `materials:read` permission.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of materials
 */
router.get('/', authenticate, authorize('materials', 'read'), featureGuard('isInvoiceManagement'), async (req, res, next) => {
  try {
    const result = await MaterialService.listAll();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /materials/{materialId}:
 *   get:
 *     tags: [Materials]
 *     summary: Get material by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material details
 *       404:
 *         description: Material not found
 */
router.get('/:materialId', authenticate, authorize('materials', 'read'), featureGuard('isInvoiceManagement'), async (req, res, next) => {
  try {
    const result = await MaterialService.getById(req.params.materialId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /materials:
 *   post:
 *     tags: [Materials]
 *     summary: Create a material
 *     description: Creates a material with company assignments and identifiers. Requires `materials:write` permission.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, companyIds]
 *             properties:
 *               name:
 *                 type: string
 *               companyIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               identifiers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Material created
 */
router.post('/', authenticate, authorize('materials', 'create'), featureGuard('isInvoiceManagement'), async (req, res, next) => {
  try {
    const result = await MaterialService.create(req.body, req.userId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /materials/{materialId}:
 *   put:
 *     tags: [Materials]
 *     summary: Update a material
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material updated
 */
router.put('/:materialId', authenticate, authorize('materials', 'update'), featureGuard('isInvoiceManagement'), async (req, res, next) => {
  try {
    const result = await MaterialService.update(req.params.materialId, req.body, req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /materials/{materialId}:
 *   delete:
 *     tags: [Materials]
 *     summary: Delete a material
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material deleted
 */
router.delete('/:materialId', authenticate, authorize('materials', 'delete'), featureGuard('isInvoiceManagement'), async (req, res, next) => {
  try {
    await MaterialService.delete(req.params.materialId);
    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
