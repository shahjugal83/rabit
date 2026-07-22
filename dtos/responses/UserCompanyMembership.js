const { toPermissionDto } = require('../helpers/PermissionDto');

class UserCompanyMembership {
  constructor(company, role) {
    this.companyId = company.companyId;
    this.name = company.name;
    this.role = {
      roleId: role.roleId,
      name: role.name,
      permissions: (role.permissions || []).map(p => toPermissionDto(p)),
    };
  }
}
module.exports = UserCompanyMembership;
