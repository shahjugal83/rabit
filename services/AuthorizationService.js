const prisma = require('../utils/prisma');
const { Forbidden } = require('../middleware/errorHandler');

class AuthorizationService {
  async getUserRoleForCompany(userId, companyId) {
    const companyUser = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!companyUser || !companyUser.active) return null;
    return companyUser.role;
  }

  async hasPermission(userId, companyId, resource, action) {
    const role = await this.getUserRoleForCompany(userId, companyId);
    if (!role) return false;

    return role.rolePermissions.some(
      rp => rp.permission.resource === resource && rp.permission.action === action
    );
  }

  async requirePermission(userId, companyId, resource, action) {
    const has = await this.hasPermission(userId, companyId, resource, action);
    if (!has) throw new Forbidden(`Missing permission: ${resource}:${action}`);
  }
}

module.exports = { AuthorizationService: new AuthorizationService() };
