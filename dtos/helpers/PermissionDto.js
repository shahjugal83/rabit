function toPermissionDto(permission) {
  if (!permission) return null;
  return {
    permissionId: permission.permissionId,
    resource: permission.resource,
    action: permission.action,
    description: permission.description || null,
    createdAt: permission.createdAt,
  };
}
module.exports = { toPermissionDto };
