class CompanyResponse {
  constructor(company, userRole) {
    this.companyId = company.companyId;
    this.name = company.name;
    this.urlSlug = company.urlSlug;
    this.description = company.description || null;
    this.addressLine1 = company.addressLine1;
    this.addressLine2 = company.addressLine2 || null;
    this.city = company.city;
    this.state = company.state;
    this.country = company.country;
    this.pinCode = company.pinCode;
    this.contactNumber = company.contactNumber;
    this.hasLogo = company.logo !== null && company.logo !== undefined;
    this.createdBy = company.createdBy || null;
    this.createdAt = company.createdAt;
    this.updatedAt = company.updatedAt;
    this.active = company.active;
    this.userRole = userRole ? { roleId: userRole.roleId, name: userRole.name } : null;
  }
}
module.exports = CompanyResponse;
