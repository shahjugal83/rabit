class VerifyTokenRequest {
  constructor({ token }) {
    if (!token) throw new Error('token is required');

    this.token = token;
  }
}
module.exports = VerifyTokenRequest;
