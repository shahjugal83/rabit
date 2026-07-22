class CreateDocumentTypeRequest {
  constructor({ name, documentNumber }) {
    if (!name) throw new Error('name is required');

    this.name = name;
    this.documentNumber = documentNumber || null;
  }
}
module.exports = CreateDocumentTypeRequest;
