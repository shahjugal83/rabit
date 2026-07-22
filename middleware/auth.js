const { validateToken, getFingerprint } = require('../utils/jwt');
const prisma = require('../utils/prisma');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  const fp = getFingerprint(req);
  const payload = validateToken(token, fp);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({ where: { userId: payload.sub } });
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  req.userId = user.userId;

  const companyId = req.headers['x-company-id'];
  if (companyId) {
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.userId, companyId } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'User does not have access to this company' });
    }
    req.companyId = companyId;
    req.companyRole = membership.role;
  }

  next();
}

module.exports = { authenticate };
