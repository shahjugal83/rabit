require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@test.com';
  const username = 'admin';
  const password = 'Admin@123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Seed user already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      firstName: 'Test',
      lastName: 'Admin',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      country: 'India',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('Seed user created:', user.email, user.userId);
}

main()
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
