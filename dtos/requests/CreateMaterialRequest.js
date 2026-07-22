class CreateMaterialRequest {
  constructor({ name, companyIds, identifiers }) {
    if (!name || !name.trim()) throw new Error('Material name is required');
    if (!Array.isArray(companyIds) || companyIds.length === 0) throw new Error('At least one company is required');
    if (identifiers !== undefined && !Array.isArray(identifiers)) throw new Error('identifiers must be an array');

    this.name = name.trim();
    this.companyIds = companyIds;
    this.identifiers = (identifiers || []).filter(s => s && s.trim()).map(s => s.trim());
  }
}
module.exports = CreateMaterialRequest;
