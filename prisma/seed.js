require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHttp } = require('@prisma/adapter-neon');
const bcrypt = require('bcryptjs');

const adapter = new PrismaNeonHttp({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function uuid(val) {
  return String(val);
}

async function main() {
  const email = 'admin@test.com';
  const username = 'admin';
  const password = 'Admin@123';

  const [existing] = await prisma.$queryRawUnsafe(
    'SELECT user_id FROM users WHERE email = $1 LIMIT 1', email
  );
  if (existing) {
    console.log('Seed user already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await prisma.$queryRawUnsafe(
    `INSERT INTO users (user_id, username, email, password_hash, first_name, last_name, city, state, pin_code, country, status, email_verified, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'Test', 'Admin', 'Mumbai', 'Maharashtra', '400001', 'India', 'ACTIVE', true, NOW(), NOW())
     RETURNING user_id`, username, email, passwordHash
  );
  const userId = String(user.user_id);
  console.log('Inserted user:', userId);

  const [sar] = await prisma.$queryRawUnsafe(
    `INSERT INTO roles (role_id, name, description, is_system, created_by, updated_by, created_at, updated_at)
     VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Full system access across all companies', true, $1::uuid, $1::uuid, NOW(), NOW())
     RETURNING role_id`, userId
  );
  const superAdminRoleId = String(sar.role_id);

  const [ar] = await prisma.$queryRawUnsafe(
    `INSERT INTO roles (role_id, name, description, is_system, created_by, updated_by, created_at, updated_at)
     VALUES (gen_random_uuid(), 'ADMIN', 'Company administrator', true, $1::uuid, $1::uuid, NOW(), NOW())
     RETURNING role_id`, userId
  );
  const adminRoleId = String(ar.role_id);

  const [ur] = await prisma.$queryRawUnsafe(
    `INSERT INTO roles (role_id, name, description, is_system, created_by, updated_by, created_at, updated_at)
     VALUES (gen_random_uuid(), 'USER', 'Standard user with read access', true, $1::uuid, $1::uuid, NOW(), NOW())
     RETURNING role_id`, userId
  );
  const userRoleId = String(ur.role_id);

  // INSERT permissions
  const permDefs = [
    ['companies', 'read', 'View company details'],
    ['companies', 'create', 'Create companies'],
    ['companies', 'update', 'Edit company details'],
    ['companies', 'delete', 'Delete companies'],
    ['users', 'read', 'View users in company'],
    ['users', 'create', 'Add users to company'],
    ['users', 'update', 'Update user roles'],
    ['users', 'delete', 'Remove users from company'],
    ['roles', 'read', 'View roles and permissions'],
    ['roles', 'create', 'Create custom roles'],
    ['roles', 'update', 'Update custom roles'],
    ['roles', 'delete', 'Delete custom roles'],
    ['documents', 'read', 'View document types'],
    ['documents', 'create', 'Create document types'],
    ['documents', 'update', 'Update document types'],
    ['documents', 'delete', 'Delete document types'],
    ['materials', 'read', 'View materials'],
    ['materials', 'create', 'Create materials'],
    ['materials', 'update', 'Update materials'],
    ['materials', 'delete', 'Delete materials'],
    ['invoices', 'read', 'View invoices'],
    ['invoices', 'create', 'Create invoices'],
    ['invoices', 'update', 'Update invoices'],
    ['invoices', 'delete', 'Delete invoices'],
  ];

  const permIds = [];
  for (const [resource, action, description] of permDefs) {
    const [perm] = await prisma.$queryRawUnsafe(
      `INSERT INTO permissions (permission_id, resource, action, description)
       VALUES (gen_random_uuid(), $1, $2, $3)
       RETURNING permission_id, resource, action`, resource, action, description
    );
    permIds.push({ id: String(perm.permission_id), resource, action });
  }

  // SUPER_ADMIN gets all
  for (const p of permIds) {
    await prisma.$executeRawUnsafe(
      'INSERT INTO role_permissions (id, role_id, permission_id) VALUES (gen_random_uuid(), $1::uuid, $2::uuid)',
      superAdminRoleId, p.id
    );
  }

  // ADMIN gets all except roles:create, roles:update, roles:delete
  for (const p of permIds) {
    if (!(p.resource === 'roles' && (p.action === 'create' || p.action === 'update' || p.action === 'delete'))) {
      await prisma.$executeRawUnsafe(
        'INSERT INTO role_permissions (id, role_id, permission_id) VALUES (gen_random_uuid(), $1::uuid, $2::uuid)',
        adminRoleId, p.id
      );
    }
  }

  // USER gets read-only
  for (const p of permIds) {
    if (p.action === 'read') {
      await prisma.$executeRawUnsafe(
        'INSERT INTO role_permissions (id, role_id, permission_id) VALUES (gen_random_uuid(), $1::uuid, $2::uuid)',
        userRoleId, p.id
      );
    }
  }

  // INSERT companies
  const [c1] = await prisma.$queryRawUnsafe(
    `INSERT INTO companies (company_id, name, url_slug, description, address_line1, city, state, country, pin_code, contact_number, created_by, created_at, updated_at)
     VALUES (gen_random_uuid(), 'Rabbit Systems', 'rabbit-systems', 'Default company for testing', '123 Tech Park', 'Mumbai', 'Maharashtra', 'India', '400001', '9876543210', $1::uuid, NOW(), NOW())
     RETURNING company_id, name`, userId
  );
  const company1Id = String(c1.company_id);
  const company1Name = c1.name;

  const [c2] = await prisma.$queryRawUnsafe(
    `INSERT INTO companies (company_id, name, url_slug, description, address_line1, city, state, country, pin_code, contact_number, created_by, created_at, updated_at)
     VALUES (gen_random_uuid(), 'Neon Labs', 'neon-labs', 'Second company for multi-tenant testing', '456 Innovation Hub', 'Bangalore', 'Karnataka', 'India', '560001', '9123456780', $1::uuid, NOW(), NOW())
     RETURNING company_id, name`, userId
  );
  const company2Id = String(c2.company_id);
  const company2Name = c2.name;

  // INSERT company_users
  await prisma.$executeRawUnsafe(
    'INSERT INTO company_users (user_id, company_id, role_id, created_at) VALUES ($1::uuid, $2::uuid, $3::uuid, NOW())',
    userId, company1Id, superAdminRoleId
  );
  await prisma.$executeRawUnsafe(
    'INSERT INTO company_users (user_id, company_id, role_id, created_at) VALUES ($1::uuid, $2::uuid, $3::uuid, NOW())',
    userId, company2Id, superAdminRoleId
  );

  // INSERT feature_mgt
  await prisma.$executeRawUnsafe(
    'INSERT INTO feature_mgt (id, company_id, user_feature, is_invoice_management, created_at, updated_at) VALUES (gen_random_uuid(), $1::uuid, true, true, NOW(), NOW())',
    company1Id
  );
  await prisma.$executeRawUnsafe(
    'INSERT INTO feature_mgt (id, company_id, user_feature, is_invoice_management, created_at, updated_at) VALUES (gen_random_uuid(), $1::uuid, true, true, NOW(), NOW())',
    company2Id
  );

  // INSERT materials
  const [m1] = await prisma.$queryRawUnsafe(
    `INSERT INTO materials (material_id, material_name, created_by, updated_by, created_at, updated_at)
     VALUES (gen_random_uuid(), 'Cement', $1::uuid, $1::uuid, NOW(), NOW())
     RETURNING material_id, material_name`, userId
  );
  const mat1Id = String(m1.material_id);

  const [m2] = await prisma.$queryRawUnsafe(
    `INSERT INTO materials (material_id, material_name, created_by, updated_by, created_at, updated_at)
     VALUES (gen_random_uuid(), 'Steel', $1::uuid, $1::uuid, NOW(), NOW())
     RETURNING material_id, material_name`, userId
  );
  const mat2Id = String(m2.material_id);

  // INSERT material_companies
  for (const matId of [mat1Id, mat2Id]) {
    for (const compId of [company1Id, company2Id]) {
      await prisma.$executeRawUnsafe(
        'INSERT INTO material_companies (id, material_id, company_id, created_at) VALUES (gen_random_uuid(), $1::uuid, $2::uuid, NOW())',
        matId, compId
      );
    }
  }

  // INSERT material_identifiers
  for (const name of ['Bag', 'KG']) {
    await prisma.$executeRawUnsafe(
      'INSERT INTO material_identifiers (identifier_id, material_id, identifier_name, created_at, updated_at) VALUES (gen_random_uuid(), $1::uuid, $2, NOW(), NOW())',
      mat1Id, name
    );
  }
  for (const name of ['KG', 'Mt']) {
    await prisma.$executeRawUnsafe(
      'INSERT INTO material_identifiers (identifier_id, material_id, identifier_name, created_at, updated_at) VALUES (gen_random_uuid(), $1::uuid, $2, NOW(), NOW())',
      mat2Id, name
    );
  }

  // INSERT document_types
  for (const compId of [company1Id, company2Id]) {
    for (const [name, docNum] of [['Purchase Order', 'PO'], ['Delivery Challan', 'DC']]) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO document_types (document_type_id, company_id, name, document_number, created_by, updated_by, created_at, updated_at)
         VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4::uuid, $4::uuid, NOW(), NOW())`,
        compId, name, docNum, userId
      );
    }
  }

  // INSERT invoices
  const invoices = [
    { docNum: 'PO-001', docName: 'Purchase Order', compId: company1Id, compName: company1Name, items: [['Cement', 'Bag'], ['Steel', 'KG']] },
    { docNum: 'DC-001', docName: 'Delivery Challan', compId: company1Id, compName: company1Name, items: [['Cement', 'KG']] },
    { docNum: 'PO-101', docName: 'Purchase Order', compId: company2Id, compName: company2Name, items: [['Steel', 'Mt'], ['Cement', 'Bag']] },
    { docNum: 'DC-101', docName: 'Delivery Challan', compId: company2Id, compName: company2Name, items: [['Steel', 'KG']] },
  ];

  for (const inv of invoices) {
    const [invRow] = await prisma.$queryRawUnsafe(
      `INSERT INTO invoices (invoice_id, document_number, document_name, company_name, created_by, created_at)
       VALUES (DEFAULT, $1, $2, $3, $4::uuid, NOW())
       RETURNING invoice_id`, inv.docNum, inv.docName, inv.compName, userId
    );

    for (const [matName, idName] of inv.items) {
      await prisma.$executeRawUnsafe(
        'INSERT INTO invoice_items (item_id, invoice_id, material_name, identifier_name) VALUES (DEFAULT, $1, $2, $3)',
        invRow.invoice_id, matName, idName
      );
    }
  }

  console.log('--- Seed Complete (Raw SQL) ---');
  console.log('User:', email, '| Password:', password);
  console.log('Companies:', company1Name, '|', company2Name);
  console.log('Materials: Cement, Steel (assigned to both companies)');
  console.log('Documents: Purchase Order, Delivery Challan (2 per company)');
  console.log('Invoices: 2 per company (with multi-material items)');
  console.log('Feature flags enabled for both companies');
}

main()
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
