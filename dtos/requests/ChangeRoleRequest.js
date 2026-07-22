class ChangeRoleRequest {
  constructor({ roleId }) {
    if (!roleId) throw new Error('roleId is required');

    this.roleId = roleId;
  }
}
module.exports = ChangeRoleRequest;
