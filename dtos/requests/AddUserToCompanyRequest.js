class AddUserToCompanyRequest {
  constructor({ email, roleId, firstName, lastName, username, password }) {
    if (!email) throw new Error('email is required');
    if (!roleId) throw new Error('roleId is required');

    this.email = email;
    this.roleId = roleId;
    this.firstName = firstName || null;
    this.lastName = lastName || null;
    this.username = username || null;
    this.password = password || null;
  }
}
module.exports = AddUserToCompanyRequest;
