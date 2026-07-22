const { PermissionService } = require('../services/PermissionService');
const { AuthorizationService } = require('../services/AuthorizationService');

function authorize(resource, action) {
  return async (req, res, next) => {
    try {
      const companyId = req.headers['x-company-id'];

      if (companyId) {
        const allowed = await AuthorizationService.hasPermission(req.userId, companyId, resource, action);
        if (!allowed) {
          const body = { error: `Insufficient permissions: ${resource}:${action} required` };
          res.locals.errorBody = body;
          return res.status(403).json(body);
        }
        req.companyId = companyId;
        return next();
      }

      const allowed = await PermissionService.hasPermission(req.userId, resource, action);
      if (allowed) {
        return next();
      }

      const body = { error: `Insufficient permissions: ${resource}:${action} required` };
      res.locals.errorBody = body;
      return res.status(403).json(body);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { authorize };
