class CreateCompanyRequest {
  constructor({ name, description, addressLine1, addressLine2, city, state, country, pinCode, contactNumber }) {
    if (!name) throw new Error('name is required');
    if (!addressLine1) throw new Error('addressLine1 is required');
    if (!city) throw new Error('city is required');
    if (!state) throw new Error('state is required');
    if (!country) throw new Error('country is required');
    if (!pinCode) throw new Error('pinCode is required');
    if (!contactNumber) throw new Error('contactNumber is required');

    this.name = name;
    this.description = description || null;
    this.addressLine1 = addressLine1;
    this.addressLine2 = addressLine2 || null;
    this.city = city;
    this.state = state;
    this.country = country;
    this.pinCode = pinCode;
    this.contactNumber = contactNumber;
  }
}
module.exports = CreateCompanyRequest;
