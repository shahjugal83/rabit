const prisma = require('../utils/prisma');
const { ResourceNotFound, BadRequest } = require('../middleware/errorHandler');

class FeatureMgtService {
  async getByCompanyId(companyId) {
    let record = await prisma.featureMgt.findUnique({ where: { companyId } });
    if (!record) {
      record = await prisma.featureMgt.create({
        data: { companyId, userFeature: false, isInvoiceManagement: false },
      });
    }
    return {
      companyId: record.companyId,
      userFeature: record.userFeature,
      isInvoiceManagement: record.isInvoiceManagement,
    };
  }

  async getByCompanyIds(companyIds) {
    const records = await prisma.featureMgt.findMany({
      where: { companyId: { in: companyIds } },
    });
    const map = {};
    records.forEach(r => {
      map[r.companyId] = { userFeature: r.userFeature, isInvoiceManagement: r.isInvoiceManagement };
    });
    return companyIds.map(id => ({
      companyId: id,
      userFeature: map[id] ? map[id].userFeature : false,
      isInvoiceManagement: map[id] ? map[id].isInvoiceManagement : false,
    }));
  }

  async update(companyId, data) {
    const updateData = {};
    if (typeof data.userFeature === 'boolean') updateData.userFeature = data.userFeature;
    if (typeof data.isInvoiceManagement === 'boolean') updateData.isInvoiceManagement = data.isInvoiceManagement;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequest('At least one feature flag must be provided (userFeature, isInvoiceManagement)');
    }

    const record = await prisma.featureMgt.upsert({
      where: { companyId },
      update: updateData,
      create: { companyId, ...updateData },
    });

    return {
      companyId: record.companyId,
      userFeature: record.userFeature,
      isInvoiceManagement: record.isInvoiceManagement,
    };
  }
}

module.exports = { FeatureMgtService: new FeatureMgtService() };
