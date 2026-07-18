const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /auth/dashboard
router.get('/', authenticate, async (req, res, next) => {
  try {
    const companyUsers = await prisma.companyUser.findMany({
      where: { userId: req.userId },
      include: { company: true },
    });

    res.json({
      companies: companyUsers.map(cu => ({
        companyId: cu.company.companyId,
        name: cu.company.name,
        description: cu.company.description,
        city: cu.company.city,
        state: cu.company.state,
        country: cu.company.country,
        createdAt: cu.company.createdAt,
        userRole: cu.role,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
