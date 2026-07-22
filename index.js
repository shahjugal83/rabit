require('dotenv').config();
const crypto = require('crypto');

const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { errorHandler } = require('./middleware/errorHandler');
const prisma = require('./utils/prisma');

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/company');
const documentTypeRoutes = require('./routes/documentType');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

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

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  prisma.$connect().then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
