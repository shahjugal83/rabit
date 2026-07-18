const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { authenticate } = require('../middleware/auth');
const { UserAlreadyExists, ResourceNotFound, InvalidToken, EmailNotVerified, BadRequest } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

const VERIFICATION_EXPIRATION = parseInt(process.env.VERIFICATION_EXPIRATION, 10) || 3600000;
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION, 10) || 86400000;

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: 'User details are required' });

    const { username, email, password, firstName, lastName, addressLine1, addressLine2, city, state, pinCode, country } = user;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new UserAlreadyExists('Email already exists: ' + email);

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) throw new UserAlreadyExists('Username already exists: ' + username);

    const passwordHash = await bcrypt.hash(password, 12);

    const created = await prisma.user.create({
      data: { username, email, passwordHash, firstName, lastName, addressLine1, addressLine2, city, state, pinCode, country, status: 'INACTIVE', emailVerified: false },
    });
    console.log('User created during registration:', created.email);

    const tokenString = crypto.randomUUID();
    await prisma.verificationToken.create({
      data: {
        userId: created.userId,
        token: tokenString,
        tokenType: 'EMAIL_VERIFICATION',
        status: 'ACTIVE',
        expiryAt: new Date(Date.now() + VERIFICATION_EXPIRATION),
      },
    });
    console.log('Verification token created for user:', created.email);

    sendVerificationEmail(created.email, tokenString);
    console.log('Registration completed for user:', created.email);

    res.status(201).json({
      userId: created.userId,
      username: created.username,
      email: created.email,
      firstName: created.firstName,
      lastName: created.lastName,
      status: created.status,
      message: 'Verification email sent. Please verify your email.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/verify
router.post('/verify', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record) throw new InvalidToken('Invalid or expired token');
    if (new Date(record.expiryAt) < new Date()) throw new InvalidToken('Token has expired');
    if (record.status !== 'ACTIVE') throw new InvalidToken('Token has already been used');

    await prisma.user.update({
      where: { userId: record.userId },
      data: { status: 'ACTIVE', emailVerified: true },
    });

    await prisma.verificationToken.update({
      where: { tokenId: record.tokenId },
      data: { status: 'USED' },
    });

    console.log('Email verified successfully');
    res.json({ status: 'VERIFIED', message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    const genericError = 'Log in failed, please provide correct username or password';

    let user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) user = await prisma.user.findUnique({ where: { username: identifier } });
    if (!user) {
      console.warn('Login attempt with non-existent identifier:', identifier);
      throw new BadRequest(genericError);
    }

    if (!user.emailVerified) {
      console.warn('Login attempt for unverified email:', identifier);
      throw new EmailNotVerified('Email verification pending. Please verify your email first.');
    }

    if (user.status === 'LOCKED' || user.status === 'DISABLED') {
      console.warn(`Login attempt for ${user.status} account:`, identifier);
      throw new BadRequest('User account is ' + user.status.toLowerCase() + '. Please contact support.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      console.warn('Login attempt with wrong password for existing user:', identifier);
      throw new BadRequest(genericError);
    }

    const token = generateToken(user.userId, user.email);
    console.log(`User logged in successfully: ${user.email} (via ${identifier})`);

    res.json({
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      token,
      expiresIn: JWT_EXPIRATION,
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const companyUsers = await prisma.companyUser.findMany({
      where: { userId: user.userId },
      include: { company: true },
    });

    res.json({
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      city: user.city,
      state: user.state,
      country: user.country,
      status: user.status,
      companies: companyUsers.map(cu => ({
        companyId: cu.company.companyId,
        name: cu.company.name,
        role: cu.role,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/resend-verification
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ResourceNotFound('User not found with email: ' + email);
    if (user.emailVerified) return res.json({ message: 'Verification email sent' });

    await prisma.verificationToken.deleteMany({ where: { userId: user.userId } });

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

    sendVerificationEmail(user.email, tokenString);
    console.log('Verification email resent to:', user.email);
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.verificationToken.deleteMany({ where: { userId: user.userId } });

      const resetToken = crypto.randomUUID();
      await prisma.verificationToken.create({
        data: {
          userId: user.userId,
          token: resetToken,
          tokenType: 'PASSWORD_RESET',
          status: 'ACTIVE',
          expiryAt: new Date(Date.now() + VERIFICATION_EXPIRATION),
        },
      });

      sendPasswordResetEmail(user.email, resetToken);
      console.log('Password reset email sent to:', user.email);
    } else {
      console.log('Password reset requested for non-existent email:', email);
    }

    res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token) return res.status(400).json({ error: 'token required' });
    if (!newPassword) return res.status(400).json({ error: 'newPassword required' });

    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record) throw new ResourceNotFound('Invalid or expired reset token');
    if (record.tokenType !== 'PASSWORD_RESET') throw new BadRequest('Invalid token type');
    if (record.status !== 'ACTIVE') throw new BadRequest('Token is no longer active');
    if (new Date(record.expiryAt) < new Date()) throw new BadRequest('Reset token has expired');

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updateData = { passwordHash };
    const user = await prisma.user.findUnique({ where: { userId: record.userId } });
    if (user && !user.emailVerified) {
      updateData.emailVerified = true;
      updateData.status = 'ACTIVE';
    }

    await prisma.user.update({ where: { userId: record.userId }, data: updateData });
    await prisma.verificationToken.update({ where: { tokenId: record.tokenId }, data: { status: 'USED' } });

    console.log('Password reset for user:', user.email);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /auth/test/verify-email (local only)
router.post('/test/verify-email', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ResourceNotFound('User not found with email: ' + email);

    await prisma.user.update({
      where: { userId: user.userId },
      data: { status: 'ACTIVE', emailVerified: true },
    });
    await prisma.verificationToken.deleteMany({ where: { userId: user.userId } });

    res.json({ message: 'User ' + email + ' verified' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
