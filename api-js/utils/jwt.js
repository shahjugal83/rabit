const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION, 10) || 86400000;

function generateToken(userId, email) {
  return jwt.sign(
    { email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION, subject: userId }
  );
}

function validateToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function getUserIdFromToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  return payload.sub;
}

function getEmailFromToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  return payload.email;
}

module.exports = { generateToken, validateToken, getUserIdFromToken, getEmailFromToken };
