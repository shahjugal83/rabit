const { toRoleSummary } = require('../helpers/RoleSummary');

class CompanyUserResponse {
  constructor(companyUser) {
    this.id = companyUser.id;
    this.userId = companyUser.userId;
    this.companyId = companyUser.companyId;
    this.active = companyUser.active;
    this.createdAt = companyUser.createdAt;
    this.user = companyUser.user ? {
      userId: companyUser.user.userId,
      username: companyUser.user.username,
      email: companyUser.user.email,
      firstName: companyUser.user.firstName || null,
      lastName: companyUser.user.lastName || null,
      status: companyUser.user.status,
    } : null;
    this.role = toRoleSummary(companyUser.role);
  }
}
module.exports = CompanyUserResponse;
