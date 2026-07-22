const { toUserSummary } = require('../helpers/UserSummary');

class DocumentTypeResponse {
  constructor(docType) {
    this.documentTypeId = docType.documentTypeId;
    this.companyId = docType.companyId;
    this.name = docType.name;
    this.documentNumber = docType.documentNumber || null;
    this.createdBy = docType.createdBy || null;
    this.updatedBy = docType.updatedBy || null;
    this.createdAt = docType.createdAt;
    this.creator = toUserSummary(docType.creator);
    this.updater = toUserSummary(docType.updater);
  }
}
module.exports = DocumentTypeResponse;
