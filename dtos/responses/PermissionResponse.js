class PermissionResponse {
  constructor(permission) {
    this.permissionId = permission.permissionId;
    this.resource = permission.resource;
    this.action = permission.action;
    this.description = permission.description || null;
    this.createdAt = permission.createdAt;
  }
}
module.exports = PermissionResponse;
