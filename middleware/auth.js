const { validateToken, getFingerprint } = require('../utils/jwt');
const prisma = require('../utils/prisma');
const log = require('../utils/logger');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    log.authFail('Missing or invalid Authorization header');
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  const fp = getFingerprint(req);
  const payload = validateToken(token, fp);
  if (!payload) {
    log.authFail('Invalid or expired token (fingerprint mismatch or jwt expired)');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({ where: { userId: payload.sub } });
  if (!user) {
    log.authFail('User not found for token sub=' + payload.sub);
    return res.status(401).json({ error: 'User not found' });
  }

  log.authOk(user.userId);
  req.user = user;
  req.userId = user.userId;

  const companyId = req.headers['x-company-id'];
  if (companyId) {
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.userId, companyId } },
      include: { role: true },
    });
    if (!membership) {
      log.authFail('User ' + user.userId + ' does not have access to company ' + companyId);
      return res.status(403).json({ error: 'User does not have access to this company' });
    }
    log.info('Company ' + companyId + ' resolved for user ' + user.userId);
    req.companyId = companyId;
    req.companyRole = membership.role;
  }

  next();
}

module.exports = { authenticate };
