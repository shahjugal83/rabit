const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHttp } = require('@prisma/adapter-neon');

const connectionString = process.env.DATABASE_URL;

let prisma;

if (connectionString) {
  const adapter = new PrismaNeonHttp(connectionString);
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

module.exports = prisma;
