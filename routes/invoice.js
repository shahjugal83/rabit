const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { featureGuard } = require('../middleware/featureGuard');
const { InvoiceService } = require('../services/InvoiceService');
const prisma = require('../utils/prisma');

/**
 * @swagger
 * /invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List invoices for the authenticated user
 *     description: Returns invoices belonging to the user's companies. Requires `invoices:read` permission.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter by company name
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/', authenticate, authorize('invoices', 'read'), featureGuard('isInvoiceManagement'), async (req, res, next) => {
  try {
    const { company } = req.query;
    if (company) {
      const result = await InvoiceService.listByCompany(company);
      return res.json(result);
    }
    const memberships = await prisma.companyUser.findMany({
      where: { userId: req.userId },
      select: { company: { select: { name: true } } },
    });
    const companyNames = memberships.map(m => m.company.name);
    const result = await InvoiceService.listByUserCompanyNames(companyNames);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */
router.get('/:invoiceId', authenticate, authorize('invoices', 'read'), featureGuard('isInvoiceManagement'), async (req, res, next) => {
  try {
    const result = await InvoiceService.getById(parseInt(req.params.invoiceId));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /invoices:
 *   post:
 *     tags: [Invoices]
 *     summary: Create an invoice
 *     description: Creates an invoice record. Requires `invoices:write` permission.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentNumber, documentName, companyName, items]
 *             properties:
 *               documentNumber:
 *                 type: string
 *               documentName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [materialName, identifierName]
 *                   properties:
 *                     materialName:
 *                       type: string
 *                     identifierName:
 *                       type: string
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post('/', authenticate, authorize('invoices', 'create'), featureGuard('isInvoiceManagement'), async (req, res, next) => {
  try {
    const result = await InvoiceService.create(req.body, req.userId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   delete:
 *     tags: [Invoices]
 *     summary: Delete an invoice
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoice deleted
 */
router.delete('/:invoiceId', authenticate, authorize('invoices', 'delete'), featureGuard('isInvoiceManagement'), async (req, res, next) => {
  try {
    await InvoiceService.delete(parseInt(req.params.invoiceId));
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
