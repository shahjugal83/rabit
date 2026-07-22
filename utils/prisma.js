const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHTTP } = require('@prisma/adapter-neon');

const adapter = new PrismaNeonHTTP({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
