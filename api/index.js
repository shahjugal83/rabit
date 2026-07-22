require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { PrismaClient } = require('@prisma/client');
const { errorHandler } = require('../middleware/errorHandler');

const authRoutes = require('../routes/auth');
const companyRoutes = require('../routes/company');
const documentTypeRoutes = require('../routes/documentType');
const dashboardRoutes = require('../routes/dashboard');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/companies/:companyId/document-types', documentTypeRoutes);
app.use('/api/v1/auth/dashboard', dashboardRoutes);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'SaaS Invoice API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger-ui.html', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/v3/api-docs', (req, res) => res.json(swaggerSpec));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
