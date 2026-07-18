const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { ResourceNotFound, UserAlreadyExists, BadRequest } = require('../middleware/errorHandler');

const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

async function requireSuperAdmin(userId, companyId) {
  const cu = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });
  if (!cu || cu.role !== 'SUPER_ADMIN') {
    throw new BadRequest('Only SUPER_ADMIN can perform this action');
  }
}

async function requireSuperAdminOrAdmin(userId, companyId) {
  const cu = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });
  if (!cu || (cu.role !== 'SUPER_ADMIN' && cu.role !== 'ADMIN')) {
    throw new BadRequest('Insufficient permissions');
  }
}

// POST /companies/:companyId/document-types
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Document type name is required' });

    await requireSuperAdmin(req.userId, companyId);

    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new ResourceNotFound('Company not found');

    const existing = await prisma.documentType.findFirst({
      where: { companyId, name },
    });
    if (existing) throw new UserAlreadyExists('Document type already exists: ' + name);

    const docType = await prisma.documentType.create({
      data: { companyId, name },
    });
    console.log(`Document type created: ${docType.name} for company: ${company.name}`);

    res.status(201).json({ documentTypeId: docType.documentTypeId, name: docType.name });
  } catch (err) {
    next(err);
  }
});

// POST /companies/:companyId/document-types/bulk
router.post('/bulk', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { names } = req.body;

    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'At least one document type name is required' });
    }

    await requireSuperAdmin(req.userId, companyId);

    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new ResourceNotFound('Company not found');

    const existingNames = await prisma.documentType.findMany({
      where: { companyId, name: { in: names } },
      select: { name: true },
    });
    const existingSet = new Set(existingNames.map(e => e.name));

    const toCreate = names.filter(name => !existingSet.has(name));
    const created = await prisma.documentType.createMany({
      data: toCreate.map(name => ({ companyId, name })),
    });

    console.log(`Bulk document types created: ${created.count} for company: ${company.name}`);

    const allDocs = await prisma.documentType.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });

    res.status(201).json(
      allDocs.filter(d => toCreate.includes(d.name)).map(d => ({
        documentTypeId: d.documentTypeId,
        name: d.name,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// GET /companies/:companyId/document-types
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;

    await requireSuperAdminOrAdmin(req.userId, companyId);

    const docTypes = await prisma.documentType.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(docTypes.map(d => ({ documentTypeId: d.documentTypeId, name: d.name })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
