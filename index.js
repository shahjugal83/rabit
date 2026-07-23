require('dotenv').config();
require('./utils/env');
const crypto = require('crypto');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { errorHandler } = require('./middleware/errorHandler');
const prisma = require('./utils/prisma');

const log = require('./utils/logger');

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const documentTypeRoutes = require('./routes/documentType');
const dashboardRoutes = require('./routes/dashboard');
const roleRoutes = require('./routes/roles');
const userRoutes = require('./routes/users');
const featureMgtRoutes = require('./routes/featureMgt');
const materialRoutes = require('./routes/material');
const invoiceRoutes = require('./routes/invoice');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  permissionsPolicy: {
    camera: false,
    microphone: false,
    geolocation: false,
    interestCohort: false,
  },
}));

app.use(express.static('public'));

app.use(express.json({ limit: '1mb' }));

const configuredOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3001', 'http://localhost:3000'];

if (process.env.VERCEL_URL) {
  configuredOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.VERCEL_BRANCH_URL) {
  configuredOrigins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (configuredOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
  const companyId = req.headers['x-company-id'] || '-';

  if (req.originalUrl.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store');
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    log.req(req.method, req.originalUrl, res.statusCode, duration, ip, companyId);
    if (res.statusCode >= 400 && res.locals.errorBody) {
      log.error(req.method + ' ' + req.originalUrl + ' -> ' + JSON.stringify(res.locals.errorBody));
    }
  });

  next();
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/companies/:companyId/document-types', documentTypeRoutes);
app.use('/api/v1/auth/dashboard', dashboardRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/feature-mgt', featureMgtRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1', userRoutes);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'SaaS Invoice API', version: '1.0.0' },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      parameters: {
        CompanyIdHeader: {
          in: 'header',
          name: 'X-Company-Id',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID for scoped requests',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string', nullable: true },
            status: { type: 'integer' },
            error: { type: 'string', description: 'Error label' },
            message: { type: 'string' },
            path: { type: 'string' },
          },
          example: {
            timestamp: '2026-07-21T10:30:00.000Z',
            requestId: 'a1b2c3d4',
            status: 400,
            error: 'Bad Request',
            message: 'Cannot change your own role',
            path: '/api/v1/companies/660e8400/users/550e8400/role',
          },
        },
        MessageResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
          example: { message: 'Email verified successfully' },
        },
        DeletedResponse: {
          type: 'object',
          properties: {
            deleted: { type: 'boolean', example: true },
          },
          example: { deleted: true },
        },
        Permission: {
          type: 'object',
          properties: {
            permissionId: { type: 'string' },
            resource: { type: 'string', enum: ['companies', 'users', 'roles', 'documents', 'materials', 'invoices'] },
            action: { type: 'string', enum: ['read', 'create', 'update', 'delete'] },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        RoleSummary: {
          type: 'object',
          properties: {
            roleId: { type: 'string' },
            name: { type: 'string' },
          },
        },
        UserSummary: {
          type: 'object',
          properties: {
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            username: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger-ui.html', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/v3/api-docs', (req, res) => res.json(swaggerSpec));

app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
    prisma.$connect().then(() => {
    log.dbConnected();
    app.listen(PORT, () => {
      log.serverStarted(PORT, process.env.NODE_ENV || 'development');
    });
  }).catch(err => {
    log.dbError(err.message);
    process.exit(1);
  });
}
