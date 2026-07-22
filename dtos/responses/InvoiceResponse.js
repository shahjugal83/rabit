class InvoiceItemResponse {
  constructor(item) {
    this.itemId = item.itemId;
    this.materialName = item.materialName;
    this.identifierName = item.identifierName;
  }
}

class InvoiceResponse {
  constructor(invoice) {
    this.invoiceId = invoice.invoiceId;
    this.documentNumber = invoice.documentNumber;
    this.documentName = invoice.documentName;
    this.companyName = invoice.companyName;
    this.items = (invoice.items || []).map(i => new InvoiceItemResponse(i));
    this.createdBy = invoice.createdBy || null;
    this.createdAt = invoice.createdAt;
  }
}
module.exports = InvoiceResponse;
