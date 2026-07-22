function toUserSummary(user) {
  if (!user) return null;
  return { firstName: user.firstName || null, lastName: user.lastName || null, username: user.username };
}
module.exports = { toUserSummary };
