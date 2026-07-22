const { toUserSummary } = require('../helpers/UserSummary');
const { toPermissionDto } = require('../helpers/PermissionDto');

class RoleResponse {
  constructor(role) {
    this.roleId = role.roleId;
    this.name = role.name;
    this.description = role.description || null;
    this.isSystem = role.isSystem;
    this.companyId = role.companyId || null;
    this.company = role.company ? { companyId: role.company.companyId, name: role.company.name } : null;
    this.createdBy = role.createdBy || null;
    this.updatedBy = role.updatedBy || null;
    this.createdAt = role.createdAt;
    this.updatedAt = role.updatedAt;
    this.creator = toUserSummary(role.creator);
    this.updater = toUserSummary(role.updater);
    this.permissions = (role.rolePermissions || []).map(rp => toPermissionDto(rp.permission));
  }
}
module.exports = RoleResponse;
