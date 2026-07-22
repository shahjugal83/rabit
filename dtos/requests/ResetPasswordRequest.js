class ResetPasswordRequest {
  constructor({ token, newPassword }) {
    if (!token) throw new Error('token is required');
    if (!newPassword) throw new Error('newPassword is required');

    this.token = token;
    this.newPassword = newPassword;
  }
}
module.exports = ResetPasswordRequest;
