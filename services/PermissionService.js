const prisma = require('../utils/prisma');

class PermissionService {
  async getUnifiedPermissions(userId) {
    const companyUsers = await prisma.companyUser.findMany({
      where: { userId },
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

    const permissions = [];
    const seen = new Set();

    for (const cu of companyUsers) {
      if (!cu.role || !cu.active) continue;
      for (const rp of cu.role.rolePermissions) {
        const key = rp.permission.resource + ':' + rp.permission.action;
        if (!seen.has(key)) {
          seen.add(key);
          permissions.push({
            resource: rp.permission.resource,
            action: rp.permission.action,
            description: rp.permission.description || null,
          });
        }
      }
    }

    return permissions;
  }

  async getPermissionsByCompany(userId) {
    const companyUsers = await prisma.companyUser.findMany({
      where: { userId },
      include: {
        company: { select: { companyId: true, name: true } },
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    return companyUsers
      .filter(cu => cu.role && cu.active)
      .map(cu => ({
        companyId: cu.company.companyId,
        companyName: cu.company.name,
        role: { roleId: cu.role.roleId, name: cu.role.name },
        permissions: cu.role.rolePermissions.map(rp => ({
          resource: rp.permission.resource,
          action: rp.permission.action,
          description: rp.permission.description || null,
        })),
      }));
  }

  async hasPermission(userId, resource, action) {
    const permissions = await this.getUnifiedPermissions(userId);
    return permissions.some(p => p.resource === resource && p.action === action);
  }

  async isSuperAdmin(userId) {
    const companyUsers = await prisma.companyUser.findMany({
      where: { userId },
      include: {
        role: { select: { name: true } },
      },
    });
    return companyUsers.some(cu => cu.role && cu.role.name === 'SUPER_ADMIN');
  }

  async isSuperAdminForCompany(userId, companyId) {
    const companyUser = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: { role: { select: { name: true } } },
    });
    return companyUser && companyUser.role && companyUser.role.name === 'SUPER_ADMIN';
  }
}

module.exports = { PermissionService: new PermissionService() };
