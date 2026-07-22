function toRoleSummary(role) {
  if (!role) return null;
  return { roleId: role.roleId, name: role.name };
}
module.exports = { toRoleSummary };
