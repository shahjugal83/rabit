class AssignPermissionsRequest {
  constructor({ permissionIds }) {
    if (!permissionIds) throw new Error('permissionIds is required');
    if (!Array.isArray(permissionIds)) throw new Error('permissionIds must be an array');

    this.permissionIds = permissionIds;
  }
}
module.exports = AssignPermissionsRequest;
