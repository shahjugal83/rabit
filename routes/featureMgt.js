const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { FeatureMgtService } = require('../services/FeatureMgtService');

/**
 * @swagger
 * /feature-mgt/{companyId}:
 *   get:
 *     tags: [Feature Management]
 *     summary: Get feature flags for a company
 *     description: Returns the feature toggle flags for the specified company.
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
 *         description: Feature flags
 *         content:
 *           application/json:
 *             example:
 *               companyId: "660e8400-e29b-41d4-a716-446655440001"
 *               userFeature: true
 *               isInvoiceManagement: true
 */
router.get('/:companyId', authenticate, async (req, res, next) => {
  try {
    const result = await FeatureMgtService.getByCompanyId(req.params.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /feature-mgt/batch:
 *   post:
 *     tags: [Feature Management]
 *     summary: Get feature flags for multiple companies
 *     description: Returns feature toggle flags for all specified company IDs.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             companyIds: ["660e8400-e29b-41d4-a716-446655440001"]
 *     responses:
 *       200:
 *         description: Feature flags per company
 */
router.post('/batch', authenticate, async (req, res, next) => {
  try {
    const result = await FeatureMgtService.getByCompanyIds(req.body.companyIds || []);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /feature-mgt/{companyId}:
 *   put:
 *     tags: [Feature Management]
 *     summary: Update feature flags for a company
 *     description: Updates the feature toggle flags for the specified company.
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
 *             userFeature: true
 *             isInvoiceManagement: true
 *     responses:
 *       200:
 *         description: Updated feature flags
 */
router.put('/:companyId', authenticate, async (req, res, next) => {
  try {
    const result = await FeatureMgtService.update(req.params.companyId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
