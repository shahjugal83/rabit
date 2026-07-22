class MaterialResponse {
  constructor(material) {
    this.materialId = material.materialId;
    this.name = material.materialName;
    this.companies = (material.companies || []).map(mc => ({
      companyId: mc.company.companyId,
      name: mc.company.name,
    }));
    this.identifiers = (material.identifiers || []).map(i => ({
      identifierId: i.identifierId,
      name: i.identifierName,
    }));
    this.createdBy = material.createdBy || null;
    this.updatedBy = material.updatedBy || null;
    this.createdAt = material.createdAt;
    this.updatedAt = material.updatedAt;
  }
}
module.exports = MaterialResponse;
