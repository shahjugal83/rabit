class UpdateMaterialRequest {
  constructor({ name, companyIds, identifiers }) {
    if (name !== undefined && (!name || !name.trim())) throw new Error('Material name cannot be empty');
    if (companyIds !== undefined && (!Array.isArray(companyIds) || companyIds.length === 0)) {
      throw new Error('At least one company is required');
    }
    if (identifiers !== undefined && !Array.isArray(identifiers)) throw new Error('identifiers must be an array');

    this.name = name ? name.trim() : undefined;
    this.companyIds = companyIds;
    this.identifiers = identifiers !== undefined
      ? identifiers.filter(s => s && s.trim()).map(s => s.trim())
      : undefined;
  }
}
module.exports = UpdateMaterialRequest;
