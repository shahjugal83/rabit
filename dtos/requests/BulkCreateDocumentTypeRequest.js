class BulkCreateDocumentTypeRequest {
  constructor({ names }) {
    if (!names) throw new Error('names is required');
    if (!Array.isArray(names)) throw new Error('names must be an array');
    if (names.length === 0) throw new Error('names must not be empty');

    this.names = names;
  }
}
module.exports = BulkCreateDocumentTypeRequest;
