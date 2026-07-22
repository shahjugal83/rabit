class UpdateCompanyRequest {
  constructor({ description, addressLine1, addressLine2, city, state, country, pinCode, contactNumber }) {
    this.description = description || null;
    this.addressLine1 = addressLine1 || null;
    this.addressLine2 = addressLine2 || null;
    this.city = city || null;
    this.state = state || null;
    this.country = country || null;
    this.pinCode = pinCode || null;
    this.contactNumber = contactNumber || null;
  }
}
module.exports = UpdateCompanyRequest;
