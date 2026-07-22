class RegisterRequest {
  constructor({ username, email, password, firstName, lastName, addressLine1, addressLine2, city, state, pinCode, country }) {
    if (!username) throw new Error('username is required');
    if (!email) throw new Error('email is required');
    if (!password) throw new Error('password is required');

    this.username = username;
    this.email = email;
    this.password = password;
    this.firstName = firstName || null;
    this.lastName = lastName || null;
    this.addressLine1 = addressLine1 || null;
    this.addressLine2 = addressLine2 || null;
    this.city = city || null;
    this.state = state || null;
    this.pinCode = pinCode || null;
    this.country = country || null;
  }
}
module.exports = RegisterRequest;
