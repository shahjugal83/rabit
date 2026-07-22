const prisma = require('../utils/prisma');
const { ResourceNotFound, UserAlreadyExists } = require('../middleware/errorHandler');
const CreateDocumentTypeRequest = require('../dtos/requests/CreateDocumentTypeRequest');
const BulkCreateDocumentTypeRequest = require('../dtos/requests/BulkCreateDocumentTypeRequest');
const DocumentTypeResponse = require('../dtos/responses/DocumentTypeResponse');

class DocumentTypeService {
  async listByCompany(companyId) {
    const docTypes = await prisma.documentType.findMany({
      where: { companyId },
      include: {
        creator: { select: { firstName: true, lastName: true, username: true } },
        updater: { select: { firstName: true, lastName: true, username: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return docTypes.map(d => new DocumentTypeResponse(d));
  }

  async create(companyId, data, userId) {
    const dto = new CreateDocumentTypeRequest(data);

    const existing = await prisma.documentType.findFirst({
      where: { companyId, name: dto.name },
    });
    if (existing) throw new UserAlreadyExists('Document type already exists: ' + dto.name);

    const docType = await prisma.documentType.create({
      data: { companyId, name: dto.name, documentNumber: dto.documentNumber, createdBy: userId, updatedBy: userId },
      include: {
        creator: { select: { firstName: true, lastName: true, username: true } },
        updater: { select: { firstName: true, lastName: true, username: true } },
      },
    });

    return new DocumentTypeResponse(docType);
  }

  async bulkCreate(companyId, names, userId) {
    const { names: validatedNames } = new BulkCreateDocumentTypeRequest({ names });

    const existingNames = await prisma.documentType.findMany({
      where: { companyId, name: { in: validatedNames } },
      select: { name: true },
    });
    const existingSet = new Set(existingNames.map(e => e.name));

    const toCreate = validatedNames.filter(name => !existingSet.has(name));
    if (toCreate.length > 0) {
      await prisma.documentType.createMany({
        data: toCreate.map(name => ({ companyId, name, createdBy: userId, updatedBy: userId })),
      });
    }

    const allDocs = await prisma.documentType.findMany({
      where: { companyId },
      include: {
        creator: { select: { firstName: true, lastName: true, username: true } },
        updater: { select: { firstName: true, lastName: true, username: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return allDocs.filter(d => toCreate.includes(d.name)).map(d => new DocumentTypeResponse(d));
  }

  async delete(documentTypeId) {
    const docType = await prisma.documentType.findUnique({ where: { documentTypeId } });
    if (!docType) throw new ResourceNotFound('Document type not found');
    await prisma.documentType.delete({ where: { documentTypeId } });
  }

  async getById(documentTypeId) {
    const docType = await prisma.documentType.findUnique({
      where: { documentTypeId },
      include: {
        company: true,
        creator: { select: { firstName: true, lastName: true, username: true } },
        updater: { select: { firstName: true, lastName: true, username: true } },
      },
    });
    if (!docType) throw new ResourceNotFound('Document type not found');

    return new DocumentTypeResponse(docType);
  }
}

module.exports = { DocumentTypeService: new DocumentTypeService() };
