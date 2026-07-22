class UpdateRoleRequest {
  constructor({ name, description, permissionIds }) {
    this.name = name || null;
    this.description = description || null;
    this.permissionIds = permissionIds || null;
  }
}
module.exports = UpdateRoleRequest;
