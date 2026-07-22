const { toRoleSummary } = require('../helpers/RoleSummary');
const { toPermissionDto } = require('../helpers/PermissionDto');

class MeResponse {
  constructor(user, companyMemberships, featureMap) {
    this.userId = user.userId;
    this.username = user.username;
    this.email = user.email;
    this.firstName = user.firstName || null;
    this.lastName = user.lastName || null;
    this.city = user.city || null;
    this.state = user.state || null;
    this.country = user.country || null;
    this.status = user.status;
    this.companies = (companyMemberships || []).map(membership => {
      const features = featureMap ? featureMap[membership.company.companyId] || {} : {};
      const roleSummary = toRoleSummary(membership.role);
      if (roleSummary && membership.role && membership.role.rolePermissions) {
        roleSummary.permissions = membership.role.rolePermissions.map(rp => toPermissionDto(rp.permission));
      } else if (roleSummary) {
        roleSummary.permissions = [];
      }
      return {
        companyId: membership.company.companyId,
        name: membership.company.name,
        role: roleSummary,
        features: {
          userFeature: !!features.userFeature,
          invoiceManagement: !!features.isInvoiceManagement,
        },
      };
    });
  }
}
module.exports = MeResponse;
