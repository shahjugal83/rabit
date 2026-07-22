const prisma = require('../utils/prisma');
const { ResourceNotFound, BadRequest, Forbidden } = require('../middleware/errorHandler');
const CreateRoleRequest = require('../dtos/requests/CreateRoleRequest');
const UpdateRoleRequest = require('../dtos/requests/UpdateRoleRequest');
const AssignPermissionsRequest = require('../dtos/requests/AssignPermissionsRequest');
const RoleResponse = require('../dtos/responses/RoleResponse');
const PermissionResponse = require('../dtos/responses/PermissionResponse');
const DeletedResponse = require('../dtos/responses/DeletedResponse');

class RoleService {
  async listByCompany(companyId) {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { companyId },
          { companyId: null },
        ],
      },
      include: {
        company: { select: { companyId: true, name: true } },
        creator: { select: { firstName: true, lastName: true, username: true } },
        updater: { select: { firstName: true, lastName: true, username: true } },
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return roles.map(role => new RoleResponse(role));
  }

  async create(companyId, userId, rawData) {
    const { name, description, permissionIds } = new CreateRoleRequest(rawData);

    const existing = await prisma.role.findFirst({
      where: { companyId, name },
    });
    if (existing) throw new BadRequest('Role with this name already exists in this company');

    const role = await prisma.role.create({
      data: {
        name,
        description,
        companyId,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    if (permissionIds && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({ roleId: role.roleId, permissionId })),
      });
    }

    return this.getById(role.roleId);
  }

  async update(roleId, userId, rawData) {
    const { name, description, permissionIds } = new UpdateRoleRequest(rawData);

    const role = await prisma.role.findUnique({ where: { roleId } });
    if (!role) throw new ResourceNotFound('Role not found');
    if (role.isSystem) throw new Forbidden('Cannot modify system roles');

    const updateData = { updatedBy: userId };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await prisma.role.update({ where: { roleId }, data: updateData });

    if (permissionIds !== undefined) {
      await prisma.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({ roleId, permissionId })),
        });
      }
    }

    return this.getById(roleId);
  }

  async delete(roleId, userId) {
    const role = await prisma.role.findUnique({ where: { roleId } });
    if (!role) throw new ResourceNotFound('Role not found');
    if (role.isSystem) throw new Forbidden('Cannot delete system roles');

    const userCount = await prisma.companyUser.count({
      where: { roleId },
    });
    if (userCount > 0) {
      throw new BadRequest('Cannot delete role that is assigned to users');
    }

    await prisma.role.delete({ where: { roleId } });
    return new DeletedResponse();
  }

  async assignPermissions(roleId, userId, rawData) {
    const { permissionIds } = new AssignPermissionsRequest({ permissionIds: rawData });
    const role = await prisma.role.findUnique({ where: { roleId } });
    if (!role) throw new ResourceNotFound('Role not found');
    if (role.isSystem) throw new Forbidden('Cannot modify permissions of system roles');

    await prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({ roleId, permissionId })),
      });
    }

    return this.getById(roleId);
  }

  async listPermissions() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    return permissions.map(p => new PermissionResponse(p));
  }

  async getById(roleId) {
    const role = await prisma.role.findUnique({
      where: { roleId },
      include: {
        company: true,
        creator: { select: { firstName: true, lastName: true, username: true } },
        updater: { select: { firstName: true, lastName: true, username: true } },
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
    if (!role) throw new ResourceNotFound('Role not found');

    return new RoleResponse(role);
  }
}

module.exports = { RoleService: new RoleService() };
