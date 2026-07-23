const { BadRequest } = require('../../middleware/errorHandler');

class LoginRequest {
  constructor({ identifier, password }) {
    if (!identifier) throw new BadRequest('identifier is required');
    if (!password) throw new BadRequest('password is required');

    this.identifier = identifier;
    this.password = password;
  }
}
module.exports = LoginRequest;
