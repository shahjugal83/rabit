const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE invoice_items, invoices, document_types, material_identifiers, material_companies, materials, feature_mgt, company_users, companies, role_permissions, permissions, roles, users CASCADE'
  );
  console.log('All tables truncated');
  await prisma.$disconnect();
})();
