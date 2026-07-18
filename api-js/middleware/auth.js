const { validateToken } = require('../utils/jwt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  const payload = validateToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({ where: { userId: payload.sub } });
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  req.userId = user.userId;
  next();
}

module.exports = { authenticate };
