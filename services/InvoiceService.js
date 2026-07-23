const prisma = require('../utils/prisma');
const { ResourceNotFound } = require('../middleware/errorHandler');
const CreateInvoiceRequest = require('../dtos/requests/CreateInvoiceRequest');
const InvoiceResponse = require('../dtos/responses/InvoiceResponse');

class InvoiceService {
  async listAll() {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return invoices.map(i => new InvoiceResponse(i));
  }

  async listByCompany(companyName) {
    const invoices = await prisma.invoice.findMany({
      where: { companyName },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return invoices.map(i => new InvoiceResponse(i));
  }

  async listByUserCompanyNames(companyNames) {
    const invoices = await prisma.invoice.findMany({
      where: { companyName: { in: companyNames } },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return invoices.map(i => new InvoiceResponse(i));
  }

  async getById(invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceId },
      include: { items: true },
    });
    if (!invoice) throw new ResourceNotFound('Invoice not found');
    return new InvoiceResponse(invoice);
  }

  async create(data, userId) {
    const dto = new CreateInvoiceRequest(data);

    const invoice = await prisma.invoice.create({
      data: {
        documentNumber: dto.documentNumber,
        documentName: dto.documentName,
        companyName: dto.companyName,
        createdBy: userId,
        items: {
          create: dto.items.map(item => ({
            materialName: item.materialName,
            identifierName: item.identifierName,
          })),
        },
      },
      include: { items: true },
    });

    return new InvoiceResponse(invoice);
  }

  async delete(invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { invoiceId } });
    if (!invoice) throw new ResourceNotFound('Invoice not found');
    await prisma.invoice.delete({ where: { invoiceId } });
  }
}

module.exports = { InvoiceService: new InvoiceService() };
