class LoginRequest {
  constructor({ identifier, password }) {
    if (!identifier) throw new Error('identifier is required');
    if (!password) throw new Error('password is required');

    this.identifier = identifier;
    this.password = password;
  }
}
module.exports = LoginRequest;
