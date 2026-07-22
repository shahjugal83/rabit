class LoginResponse {
  constructor(user, token, expiresIn) {
    this.userId = user.userId;
    this.username = user.username;
    this.email = user.email;
    this.firstName = user.firstName || null;
    this.lastName = user.lastName || null;
    this.token = token;
    this.expiresIn = expiresIn;
  }
}
module.exports = LoginResponse;
