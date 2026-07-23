require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHttp } = require('@prisma/adapter-neon');

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
  if (!user) {
    console.log('No user found. Run seed.js first.');
    return;
  }

  const existingCompanies = await prisma.company.findMany();
  console.log('Existing companies:', existingCompanies.map(c => c.name).join(', ') || 'none');

  // --- Add second company if not exists ---
  let company2 = existingCompanies.find(c => c.name === 'Neon Labs');
  if (!company2) {
    company2 = await prisma.company.create({
      data: {
        name: 'Neon Labs',
        urlSlug: 'neon-labs',
        description: 'Second company for multi-tenant testing',
        addressLine1: '456 Innovation Hub',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        pinCode: '560001',
        contactNumber: '9123456780',
        createdBy: user.userId,
      },
    });
    console.log('Created company:', company2.name);
  } else {
    console.log('Company already exists:', company2.name);
  }

  // Ensure user assigned to second company
  const existingCU = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.userId, companyId: company2.companyId } },
  });
  if (!existingCU) {
    const superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    await prisma.companyUser.create({
      data: { userId: user.userId, companyId: company2.companyId, roleId: superAdminRole.roleId },
    });
    console.log('Assigned user to', company2.name);
  }

  // Ensure feature flags for second company
  const existingFm = await prisma.featureMgt.findUnique({ where: { companyId: company2.companyId } });
  if (!existingFm) {
    await prisma.featureMgt.create({
      data: { companyId: company2.companyId, userFeature: true, isInvoiceManagement: true },
    });
    console.log('Enabled features for', company2.name);
  }

  // --- Materials ---
  const allCompanies = await prisma.company.findMany();
  const companyIds = allCompanies.map(c => c.companyId);

  let mat1 = await prisma.material.findFirst({ where: { materialName: 'Cement' } });
  if (!mat1) {
    mat1 = await prisma.material.create({
      data: { materialName: 'Cement', createdBy: user.userId, updatedBy: user.userId },
    });
    console.log('Created material: Cement');
  }

  let mat2 = await prisma.material.findFirst({ where: { materialName: 'Steel' } });
  if (!mat2) {
    mat2 = await prisma.material.create({
      data: { materialName: 'Steel', createdBy: user.userId, updatedBy: user.userId },
    });
    console.log('Created material: Steel');
  }

  // Assign both materials to ALL companies
  for (const mat of [mat1, mat2]) {
    for (const cid of companyIds) {
      const existing = await prisma.materialCompany.findUnique({
        where: { materialId_companyId: { materialId: mat.materialId, companyId: cid } },
      });
      if (!existing) {
        await prisma.materialCompany.create({ data: { materialId: mat.materialId, companyId: cid } });
      }
    }
  }
  console.log('Materials assigned to all companies');

  // Identifiers for Cement
  for (const name of ['Bag', 'KG']) {
    const existing = await prisma.materialIdentifier.findFirst({
      where: { materialId: mat1.materialId, identifierName: name },
    });
    if (!existing) {
      await prisma.materialIdentifier.create({ data: { materialId: mat1.materialId, identifierName: name } });
    }
  }

  // Identifiers for Steel
  for (const name of ['KG', 'Mt']) {
    const existing = await prisma.materialIdentifier.findFirst({
      where: { materialId: mat2.materialId, identifierName: name },
    });
    if (!existing) {
      await prisma.materialIdentifier.create({ data: { materialId: mat2.materialId, identifierName: name } });
    }
  }
  console.log('Material identifiers added');

  // --- Document Types (2 per company) ---
  for (const company of allCompanies) {
    for (const doc of [
      { name: 'Purchase Order', documentNumber: 'PO' },
      { name: 'Delivery Challan', documentNumber: 'DC' },
    ]) {
      const existing = await prisma.documentType.findFirst({
        where: { companyId: company.companyId, name: doc.name },
      });
      if (!existing) {
        await prisma.documentType.create({
          data: { companyId: company.companyId, name: doc.name, documentNumber: doc.documentNumber, createdBy: user.userId, updatedBy: user.userId },
        });
      }
    }
  }
  console.log('Document types ensured for all companies');

  // --- Invoices (2 per company) ---
  for (const company of allCompanies) {
    const existingInvoices = await prisma.invoice.findMany({
      where: { companyName: company.name },
    });
    if (existingInvoices.length >= 2) {
      console.log('Invoices already exist for', company.name, '- skipping');
      continue;
    }

    await prisma.invoice.create({
      data: {
        documentNumber: company.name === 'Rabbit Systems' ? 'PO-001' : 'PO-101',
        documentName: 'Purchase Order',
        companyName: company.name,
        createdBy: user.userId,
        items: {
          create: [
            { materialName: 'Cement', identifierName: 'Bag' },
            { materialName: 'Steel', identifierName: 'KG' },
          ],
        },
      },
    });

    await prisma.invoice.create({
      data: {
        documentNumber: company.name === 'Rabbit Systems' ? 'DC-001' : 'DC-101',
        documentName: 'Delivery Challan',
        companyName: company.name,
        createdBy: user.userId,
        items: {
          create: [
            { materialName: 'Cement', identifierName: 'KG' },
          ],
        },
      },
    });

    console.log('Created 2 invoices for', company.name);
  }

  console.log('--- Migration Complete ---');
}

main()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
