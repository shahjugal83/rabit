const prisma = require('../utils/prisma');

function featureGuard(featureKey) {
  return async (req, res, next) => {
    try {
      const companyId = req.headers['x-company-id'];

      if (companyId) {
        const record = await prisma.featureMgt.findUnique({ where: { companyId } });
        if (!record || !record[featureKey]) {
          const body = { error: 'This feature is not enabled for this company' };
          res.locals.errorBody = body;
          return res.status(403).json(body);
        }
        return next();
      }

      const companyUsers = await prisma.companyUser.findMany({
        where: { userId: req.userId },
        select: { companyId: true },
      });

      if (companyUsers.length === 0) {
        const body = { error: 'No company access' };
        res.locals.errorBody = body;
        return res.status(403).json(body);
      }

      const companyIds = companyUsers.map(cu => cu.companyId);
      const record = await prisma.featureMgt.findFirst({
        where: { companyId: { in: companyIds }, [featureKey]: true },
      });

      if (!record) {
        const body = { error: 'This feature is not enabled for any of your companies' };
        res.locals.errorBody = body;
        return res.status(403).json(body);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { featureGuard };
