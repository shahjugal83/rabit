const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /auth/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard data for the current user
 *     description: |
 *       Returns all companies the user belongs to, along with their role in each. This is the main data source for the dashboard page, which shows a card for each company.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard companies with role info
 *         content:
 *           application/json:
 *             example:
 *               companies:
 *                 - companyId: "660e8400-e29b-41d4-a716-446655440001"
 *                   name: "Acme Corp"
 *                   description: "A leading tech company"
 *                   city: "Mumbai"
 *                   state: "Maharashtra"
 *                   country: "India"
 *                   createdAt: "2026-07-21T10:00:00.000Z"
 *                   userRole:
 *                     roleId: "770e8400-e29b-41d4-a716-446655440002"
 *                     name: "SUPER_ADMIN"
 *                 - companyId: "660e8400-e29b-41d4-a716-446655440010"
 *                   name: "Beta Industries"
 *                   description: "Manufacturing partner"
 *                   city: "Pune"
 *                   state: "Maharashtra"
 *                   country: "India"
 *                   createdAt: "2026-07-20T08:00:00.000Z"
 *                   userRole:
 *                     roleId: "880e8400-e29b-41d4-a716-446655440003"
 *                     name: "USER"
 *       401:
 *         description: Missing or invalid token
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const companyUsers = await prisma.companyUser.findMany({
      where: { userId: req.userId },
      include: { company: true, role: true },
    });

    const companyIds = companyUsers.map(cu => cu.company.companyId);

    const [userCounts, docTypeCounts] = await Promise.all([
      prisma.companyUser.groupBy({
        by: ['companyId'],
        where: { companyId: { in: companyIds }, active: true },
        _count: { id: true },
      }),
      prisma.documentType.groupBy({
        by: ['companyId'],
        where: { companyId: { in: companyIds } },
        _count: { documentTypeId: true },
      }),
    ]);

    const userCountMap = {};
    userCounts.forEach(uc => { userCountMap[uc.companyId] = uc._count.id; });
    const docCountMap = {};
    docTypeCounts.forEach(dc => { docCountMap[dc.companyId] = dc._count.documentTypeId; });

    const isSuperAdmin = companyUsers.some(cu => cu.role && cu.role.name === 'SUPER_ADMIN');
    let totalStats = { companies: companyUsers.length, users: 0, docTypes: 0 };

    if (isSuperAdmin) {
      const allUserCount = await prisma.companyUser.count({ where: { active: true } });
      const allDocCount = await prisma.documentType.count();
      totalStats = { companies: companyUsers.length, users: allUserCount, docTypes: allDocCount };
    }

    res.json({
      companies: companyUsers.map(cu => ({
        companyId: cu.company.companyId,
        name: cu.company.name,
        description: cu.company.description,
        city: cu.company.city,
        state: cu.company.state,
        country: cu.company.country,
        createdAt: cu.company.createdAt,
        userRole: { roleId: cu.role.roleId, name: cu.role.name },
        memberCount: userCountMap[cu.company.companyId] || 0,
        docTypeCount: docCountMap[cu.company.companyId] || 0,
      })),
      stats: totalStats,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
