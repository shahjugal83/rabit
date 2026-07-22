const log = require('./logger');

const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
const missing = requiredVars.filter(v => !process.env[v]);

log.config('──────────────────────────');
log.config('NODE_ENV', process.env.NODE_ENV || 'development');
log.config('PORT', process.env.PORT || '3001');
log.config('DATABASE_URL', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0, 30)}...` : '❌ MISSING');
log.config('JWT_SECRET', process.env.JWT_SECRET ? `${process.env.JWT_SECRET.slice(0, 8)}... (${process.env.JWT_SECRET.length} chars)` : '❌ MISSING');
log.config('CORS_ORIGINS', process.env.CORS_ORIGINS || 'http://localhost:3001, http://localhost:3000');
log.config('JWT_EXPIRATION', process.env.JWT_EXPIRATION ? `${Number(process.env.JWT_EXPIRATION) / 1000 / 60}m` : '86400000 (24h)');
log.config('VERIFICATION_EXPIRATION', process.env.VERIFICATION_EXPIRATION ? `${Number(process.env.VERIFICATION_EXPIRATION) / 1000 / 60}m` : '3600000 (1h)');
log.config('SMTP_HOST', process.env.SMTP_HOST || '(not set)');

if (missing.length > 0) {
  log.configError('Missing required environment variables: ' + missing.join(', '));
  process.exit(1);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
  log.configError('JWT_SECRET must be at least 16 characters');
  process.exit(1);
}

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
  log.configError('DATABASE_URL must start with postgresql://');
  process.exit(1);
}

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
if (!process.env.PORT) process.env.PORT = '3001';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '86400000';
if (!process.env.VERIFICATION_EXPIRATION) process.env.VERIFICATION_EXPIRATION = '3600000';

log.configOk();
