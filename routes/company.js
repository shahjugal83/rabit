const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');
const { UserAlreadyExists, ResourceNotFound, BadRequest } = require('../middleware/errorHandler');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 } });
const VERIFICATION_EXPIRATION = parseInt(process.env.VERIFICATION_EXPIRATION, 10) || 3600000;

const MAX_FILE_SIZE = 50 * 1024;

function generateUrlSlug(name) {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug;
}

async function buildCompanyResponse(companyId, role) {
  const company = await prisma.company.findUnique({ where: { companyId } });
  return {
    companyId: company.companyId,
    name: company.name,
    urlSlug: company.urlSlug,
    description: company.description,
    addressLine1: company.addressLine1,
    addressLine2: company.addressLine2,
    city: company.city,
    state: company.state,
    country: company.country,
    pinCode: company.pinCode,
    contactNumber: company.contactNumber,
    hasLogo: company.logo !== null,
    createdBy: company.createdBy,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
    active: company.active,
    userRole: role,
  };
}

async function requireSuperAdmin(userId, companyId) {
  const cu = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });
    if (!cu || cu.role !== 'SUPER_ADMIN') {
      throw new BadRequest('Only SUPER_ADMIN can perform this action');
    }
}

// POST /companies (multipart)
router.post('/', authenticate, upload.single('logo'), async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, aboutCompany, addressLine1, addressLine2, city, state, country, pinCode, contactNumber } = req.body;

    if (!name || !addressLine1 || !city || !state || !country || !pinCode || !contactNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await prisma.company.findUnique({ where: { name } });
    if (existing) throw new UserAlreadyExists('Company name already exists: ' + name);

    let slug = generateUrlSlug(name);
    const baseSlug = slug;
    let counter = 1;
    while (await prisma.company.findUnique({ where: { urlSlug: slug } })) {
      slug = baseSlug + '-' + counter;
      counter++;
    }

    const logoBuffer = req.file ? req.file.buffer : null;

    const company = await prisma.company.create({
      data: {
        name,
        urlSlug: slug,
        description: aboutCompany || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        country,
        pinCode,
        contactNumber,
        logo: logoBuffer,
        createdBy: userId,
      },
    });

    await prisma.companyUser.create({
      data: { userId, companyId: company.companyId, role: 'SUPER_ADMIN' },
    });

    console.log(`Company created successfully: ${company.name} by user: ${req.user.email} with SUPER_ADMIN role`);
    const response = await buildCompanyResponse(company.companyId, 'SUPER_ADMIN');
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// GET /companies
router.get('/', authenticate, async (req, res, next) => {
  try {
    const memberships = await prisma.companyUser.findMany({
      where: { userId: req.userId },
      include: { company: true },
    });

    const results = await Promise.all(
      memberships.map(m => buildCompanyResponse(m.companyId, m.role))
    );
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /companies/:companyId
router.get('/:companyId', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: req.userId, companyId } },
    });
    if (!membership) throw new ResourceNotFound('User does not have access to this company');

    const response = await buildCompanyResponse(companyId, membership.role);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /companies/:companyId/logo
router.get('/:companyId/logo', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: req.userId, companyId } },
    });
    if (!membership) throw new ResourceNotFound('User does not have access to this company');

    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company || !company.logo) {
      return res.status(404).json({ error: 'No logo attached to this company' });
    }

    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(company.logo));
  } catch (err) {
    next(err);
  }
});

// PUT /companies/:companyId (multipart)
router.put('/:companyId', authenticate, upload.single('logo'), async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.userId;

    await requireSuperAdmin(userId, companyId);

    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new ResourceNotFound('Company not found');

    const { description, addressLine1, addressLine2, city, state, country, pinCode, contactNumber } = req.body;

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (pinCode !== undefined) updateData.pinCode = pinCode;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (req.file) {
      if (req.file.size > MAX_FILE_SIZE) {
        throw new BadRequest('Logo size must not exceed 50KB');
      }
      updateData.logo = req.file.buffer;
    }

    await prisma.company.update({ where: { companyId }, data: updateData });
    console.log(`Company updated: ${company.name} by user: ${req.user.email}`);

    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    const response = await buildCompanyResponse(companyId, membership.role);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// POST /companies/:companyId/users
router.post('/:companyId/users', authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const superAdminUserId = req.userId;
    const { email, firstName, lastName, username, password, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new ResourceNotFound('Company not found');

    const superAdminMembership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: superAdminUserId, companyId } },
    });
    if (!superAdminMembership) throw new ResourceNotFound('You are not a member of this company');
    if (superAdminMembership.role !== 'SUPER_ADMIN') {
      throw new BadRequest('Only SUPER_ADMIN can add users to the company');
    }

    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      if (!username) throw new BadRequest('Username is required for new users');
      if (!password) throw new BadRequest('Password is required for new users');

      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) throw new UserAlreadyExists('Email already exists: ' + email);
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) throw new UserAlreadyExists('Username already exists: ' + username);

      const passwordHash = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          firstName: firstName || null,
          lastName: lastName || null,
          status: 'INACTIVE',
          emailVerified: false,
        },
      });
      isNewUser = true;
      console.log('New user created via company invite:', user.email);

      const tokenString = crypto.randomUUID();
      await prisma.verificationToken.create({
        data: {
          userId: user.userId,
          token: tokenString,
          tokenType: 'EMAIL_VERIFICATION',
          status: 'ACTIVE',
          expiryAt: new Date(Date.now() + VERIFICATION_EXPIRATION),
        },
      });
      const { sendVerificationEmail } = require('../utils/email');
      sendVerificationEmail(user.email, tokenString, req);
    }

    const alreadyMember = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.userId, companyId } },
    });
    if (alreadyMember) throw new UserAlreadyExists('User is already a member of this company');

    const companyUser = await prisma.companyUser.create({
      data: { userId: user.userId, companyId, role, active: true },
    });

    const message = isNewUser
      ? 'New user created and added to company. Verification email sent.'
      : 'User added to company';

    console.log(`User ${user.email} added to company ${company.name} with role ${role}`);

    res.status(201).json({
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role,
      active: true,
      createdAt: companyUser.createdAt,
      message,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
