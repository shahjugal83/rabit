class ForgotPasswordRequest {
  constructor({ email }) {
    if (!email) throw new Error('email is required');

    this.email = email;
  }
}
module.exports = ForgotPasswordRequest;
