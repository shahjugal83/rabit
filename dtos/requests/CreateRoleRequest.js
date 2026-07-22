class CreateRoleRequest {
  constructor({ name, description, permissionIds }) {
    if (!name) throw new Error('name is required');

    this.name = name;
    this.description = description || null;
    this.permissionIds = permissionIds || null;
  }
}
module.exports = CreateRoleRequest;
