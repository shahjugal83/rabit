require('./setup');
const { mockPrisma } = require('./setup');

const DocumentTypeService = require('../services/DocumentTypeService').DocumentTypeService;

describe('DocumentTypeService', () => {
  describe('create', () => {
    it('should create a document type', async () => {
      mockPrisma.documentType.findFirst.mockResolvedValue(null);
      mockPrisma.documentType.create.mockResolvedValue({
        documentTypeId: 'd1', companyId: 'c1', name: 'Tax Invoice',
        createdBy: 'u1', updatedBy: 'u1', createdAt: new Date(),
        creator: { firstName: 'Test', lastName: 'User', username: 'test' },
        updater: { firstName: 'Test', lastName: 'User', username: 'test' },
      });

      const result = await DocumentTypeService.create('c1', 'Tax Invoice', 'u1');
      expect(result.name).toBe('Tax Invoice');
      expect(result.documentTypeId).toBe('d1');
    });

    it('should reject duplicate name within company', async () => {
      mockPrisma.documentType.findFirst.mockResolvedValue({
        documentTypeId: 'd1', name: 'Tax Invoice',
      });

      await expect(DocumentTypeService.create('c1', 'Tax Invoice', 'u1'))
        .rejects.toThrow('already exists');
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple document types, skipping duplicates', async () => {
      mockPrisma.documentType.findMany.mockResolvedValue([{ name: 'Existing' }]);
      mockPrisma.documentType.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.documentType.findMany
        .mockResolvedValueOnce([{ name: 'Existing' }])
        .mockResolvedValueOnce([
          { documentTypeId: 'd1', companyId: 'c1', name: 'Credit Note', createdBy: 'u1', updatedBy: 'u1', createdAt: new Date(), creator: { firstName: 'T', lastName: 'U', username: 't' }, updater: { firstName: 'T', lastName: 'U', username: 't' } },
          { documentTypeId: 'd2', companyId: 'c1', name: 'Debit Note', createdBy: 'u1', updatedBy: 'u1', createdAt: new Date(), creator: { firstName: 'T', lastName: 'U', username: 't' }, updater: { firstName: 'T', lastName: 'U', username: 't' } },
        ]);

      const result = await DocumentTypeService.bulkCreate('c1', ['Existing', 'Credit Note', 'Debit Note'], 'u1');
      expect(result.length).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete a document type', async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue({ documentTypeId: 'd1' });
      mockPrisma.documentType.delete.mockResolvedValue({});

      await DocumentTypeService.delete('d1');
      expect(mockPrisma.documentType.delete).toHaveBeenCalledWith({ where: { documentTypeId: 'd1' } });
    });

    it('should reject if not found', async () => {
      mockPrisma.documentType.findUnique.mockResolvedValue(null);
      await expect(DocumentTypeService.delete('nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('listByCompany', () => {
    it('should return document types for a company', async () => {
      mockPrisma.documentType.findMany.mockResolvedValue([
        { documentTypeId: 'd1', companyId: 'c1', name: 'Invoice', createdAt: new Date(), creator: { firstName: 'T', lastName: 'U', username: 't' }, updater: { firstName: 'T', lastName: 'U', username: 't' } },
      ]);

      const result = await DocumentTypeService.listByCompany('c1');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Invoice');
    });
  });
});
