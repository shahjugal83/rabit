const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION, 10) || 86400000;

function generateToken(userId, email, fingerprint) {
  const expiresInSec = Math.floor(JWT_EXPIRATION / 1000);
  return jwt.sign(
    { email, fp: fingerprint },
    JWT_SECRET,
    { expiresIn: expiresInSec, subject: userId }
  );
}

function validateToken(token, fingerprint) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (fingerprint && payload.fp !== fingerprint) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getFingerprint(req) {
  const ua = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  return crypto.createHash('sha256').update(ua + ip).digest('hex');
}

module.exports = { generateToken, validateToken, getFingerprint };
