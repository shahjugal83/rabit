class CreateInvoiceItemRequest {
  constructor({ materialName, identifierName }) {
    if (!materialName || !materialName.trim()) throw new Error('Each item must have a material name');
    if (!identifierName || !identifierName.trim()) throw new Error('Each item must have an identifier name');
    this.materialName = materialName.trim();
    this.identifierName = identifierName.trim();
  }
}

class CreateInvoiceRequest {
  constructor({ documentNumber, documentName, companyName, items }) {
    if (!documentNumber || !documentNumber.trim()) throw new Error('Document number is required');
    if (!documentName || !documentName.trim()) throw new Error('Document name is required');
    if (!companyName || !companyName.trim()) throw new Error('Company name is required');
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('At least one material item is required');
    }

    this.documentNumber = documentNumber.trim();
    this.documentName = documentName.trim();
    this.companyName = companyName.trim();
    this.items = items.map(i => new CreateInvoiceItemRequest(i));
  }
}
module.exports = CreateInvoiceRequest;
