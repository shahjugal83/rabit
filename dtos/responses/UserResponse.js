class UserResponse {
  constructor(user) {
    this.userId = user.userId;
    this.username = user.username;
    this.email = user.email;
    this.firstName = user.firstName || null;
    this.lastName = user.lastName || null;
    this.status = user.status;
  }
}
module.exports = UserResponse;
