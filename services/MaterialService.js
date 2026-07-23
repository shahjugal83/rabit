const prisma = require('../utils/prisma');
const { ResourceNotFound, UserAlreadyExists, BadRequest } = require('../middleware/errorHandler');
const CreateMaterialRequest = require('../dtos/requests/CreateMaterialRequest');
const UpdateMaterialRequest = require('../dtos/requests/UpdateMaterialRequest');
const MaterialResponse = require('../dtos/responses/MaterialResponse');

class MaterialService {
  async listAll() {
    const materials = await prisma.material.findMany({
      include: {
        companies: { include: { company: { select: { companyId: true, name: true } } } },
        identifiers: true,
      },
      orderBy: { materialName: 'asc' },
    });
    return materials.map(m => new MaterialResponse(m));
  }

  async listByCompany(companyId) {
    const materials = await prisma.material.findMany({
      where: { companies: { some: { companyId } } },
      include: {
        companies: { include: { company: { select: { companyId: true, name: true } } } },
        identifiers: true,
      },
      orderBy: { materialName: 'asc' },
    });
    return materials.map(m => new MaterialResponse(m));
  }

  async listByUserCompanies(companyIds) {
    const materials = await prisma.material.findMany({
      where: { companies: { some: { companyId: { in: companyIds } } } },
      include: {
        companies: { include: { company: { select: { companyId: true, name: true } } } },
        identifiers: true,
      },
      orderBy: { materialName: 'asc' },
    });
    return materials.map(m => new MaterialResponse(m));
  }

  async getById(materialId) {
    const material = await prisma.material.findUnique({
      where: { materialId },
      include: {
        companies: { include: { company: { select: { companyId: true, name: true } } } },
        identifiers: true,
      },
    });
    if (!material) throw new ResourceNotFound('Material not found');
    return new MaterialResponse(material);
  }

  async create(data, userId) {
    const dto = new CreateMaterialRequest(data);

    const existing = await prisma.material.findFirst({ where: { materialName: dto.name } });
    if (existing) throw new UserAlreadyExists('Material already exists: ' + dto.name);

    const material = await prisma.material.create({
      data: {
        materialName: dto.name,
        createdBy: userId,
        updatedBy: userId,
        companies: {
          create: dto.companyIds.map(companyId => ({ companyId })),
        },
        identifiers: {
          create: dto.identifiers.map(name => ({ identifierName: name })),
        },
      },
      include: {
        companies: { include: { company: { select: { companyId: true, name: true } } } },
        identifiers: true,
      },
    });

    return new MaterialResponse(material);
  }

  async update(materialId, data, userId) {
    const dto = new UpdateMaterialRequest(data);

    const existing = await prisma.material.findUnique({ where: { materialId } });
    if (!existing) throw new ResourceNotFound('Material not found');

    if (dto.name && dto.name !== existing.materialName) {
      const duplicate = await prisma.material.findFirst({ where: { materialName: dto.name } });
      if (duplicate) throw new UserAlreadyExists('Material already exists: ' + dto.name);
    }

    const updateData = { updatedBy: userId };
    if (dto.name !== undefined) updateData.materialName = dto.name;

    await prisma.material.update({ where: { materialId }, data: updateData });

    if (dto.companyIds !== undefined) {
      await prisma.materialCompany.deleteMany({ where: { materialId } });
      await prisma.materialCompany.createMany({
        data: dto.companyIds.map(companyId => ({ materialId, companyId })),
      });
    }

    if (dto.identifiers !== undefined) {
      await prisma.materialIdentifier.deleteMany({ where: { materialId } });
      if (dto.identifiers.length > 0) {
        await prisma.materialIdentifier.createMany({
          data: dto.identifiers.map(identifierName => ({ materialId, identifierName })),
        });
      }
    }

    return this.getById(materialId);
  }

  async delete(materialId) {
    const material = await prisma.material.findUnique({ where: { materialId } });
    if (!material) throw new ResourceNotFound('Material not found');
    await prisma.material.delete({ where: { materialId } });
  }
}

module.exports = { MaterialService: new MaterialService() };
