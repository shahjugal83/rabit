const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { generateToken, getFingerprint } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { UserAlreadyExists, ResourceNotFound, BadRequest, InvalidToken, EmailNotVerified } = require('../middleware/errorHandler');
const RegisterRequest = require('../dtos/requests/RegisterRequest');
const LoginRequest = require('../dtos/requests/LoginRequest');
const VerifyTokenRequest = require('../dtos/requests/VerifyTokenRequest');
const ForgotPasswordRequest = require('../dtos/requests/ForgotPasswordRequest');
const ResetPasswordRequest = require('../dtos/requests/ResetPasswordRequest');
const UserResponse = require('../dtos/responses/UserResponse');
const LoginResponse = require('../dtos/responses/LoginResponse');
const MeResponse = require('../dtos/responses/MeResponse');
const MessageResponse = require('../dtos/responses/MessageResponse');

const VERIFICATION_EXPIRATION = parseInt(process.env.VERIFICATION_EXPIRATION, 10) || 3600000;
const JWT_EXPIRATION = parseInt(process.env.JWT_EXPIRATION, 10) || 86400000;

class AuthService {
  async register(rawData, req) {
    const dto = new RegisterRequest(rawData);

    const existingEmail = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new UserAlreadyExists('Email already exists: ' + dto.email);

    const existingUsername = await prisma.user.findUnique({ where: { username: dto.username } });
    if (existingUsername) throw new UserAlreadyExists('Username already exists: ' + dto.username);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        pinCode: dto.pinCode,
        country: dto.country,
        status: 'INACTIVE',
        emailVerified: false,
      },
    });

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

    sendVerificationEmail(user.email, tokenString, req);

    const response = new UserResponse(user);
    response.message = 'Verification email sent. Please verify your email.';
    return response;
  }

  async verifyEmail(token) {
    const dto = new VerifyTokenRequest({ token });

    const record = await prisma.verificationToken.findUnique({ where: { token: dto.token } });
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

    return new MessageResponse('Email verified successfully');
  }

  async login(identifier, password, req) {
    const dto = new LoginRequest({ identifier, password });
    const genericError = 'Log in failed, please provide correct username or password';

    let user = await prisma.user.findUnique({ where: { email: dto.identifier } });
    if (!user) user = await prisma.user.findUnique({ where: { username: dto.identifier } });
    if (!user) throw new BadRequest(genericError);

    if (!user.emailVerified) {
      throw new EmailNotVerified('Email verification pending. Please verify your email first.');
    }

    if (user.status === 'LOCKED' || user.status === 'DISABLED') {
      throw new BadRequest('User account is ' + user.status.toLowerCase() + '. Please contact support.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new BadRequest(genericError);

    const fp = getFingerprint(req);
    const token = generateToken(user.userId, user.email, fp);

    return new LoginResponse(user, token, JWT_EXPIRATION);
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) throw new ResourceNotFound('User not found');

    const companyUsers = await prisma.companyUser.findMany({
      where: { userId },
      include: {
        company: true,
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const companyIds = companyUsers.map(cu => cu.company.companyId);
    const featureRecords = await prisma.featureMgt.findMany({
      where: { companyId: { in: companyIds } },
    });

    const featureMap = {};
    for (const f of featureRecords) {
      featureMap[f.companyId] = f;
    }

    return new MeResponse(user, companyUsers, featureMap);
  }

  async resendVerification(email, req) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ResourceNotFound('User not found with email: ' + email);
    if (user.emailVerified) return new MessageResponse('Verification email sent');

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

    sendVerificationEmail(user.email, tokenString, req);
    return new MessageResponse('Verification email sent');
  }

  async forgotPassword(email, req) {
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

      sendPasswordResetEmail(user.email, resetToken, req);
    }

    return new MessageResponse('If an account exists with that email, a password reset link has been sent.');
  }

  async resetPassword(token, newPassword) {
    const dto = new ResetPasswordRequest({ token, newPassword });

    const record = await prisma.verificationToken.findUnique({ where: { token: dto.token } });
    if (!record) throw new ResourceNotFound('Invalid or expired reset token');
    if (record.tokenType !== 'PASSWORD_RESET') throw new BadRequest('Invalid token type');
    if (record.status !== 'ACTIVE') throw new BadRequest('Token is no longer active');
    if (new Date(record.expiryAt) < new Date()) throw new BadRequest('Reset token has expired');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    const updateData = { passwordHash };
    const user = await prisma.user.findUnique({ where: { userId: record.userId } });
    if (user && !user.emailVerified) {
      updateData.emailVerified = true;
      updateData.status = 'ACTIVE';
    }

    await prisma.user.update({ where: { userId: record.userId }, data: updateData });
    await prisma.verificationToken.update({ where: { tokenId: record.tokenId }, data: { status: 'USED' } });

    return new MessageResponse('Password reset successfully');
  }

  async updateProfile(userId, rawData) {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) throw new ResourceNotFound('User not found');

    const allowed = {};
    if (rawData.firstName !== undefined) allowed.firstName = rawData.firstName || null;
    if (rawData.lastName !== undefined) allowed.lastName = rawData.lastName || null;
    if (rawData.addressLine1 !== undefined) allowed.addressLine1 = rawData.addressLine1 || null;
    if (rawData.addressLine2 !== undefined) allowed.addressLine2 = rawData.addressLine2 || null;
    if (rawData.city !== undefined) allowed.city = rawData.city || null;
    if (rawData.state !== undefined) allowed.state = rawData.state || null;
    if (rawData.pinCode !== undefined) allowed.pinCode = rawData.pinCode || null;
    if (rawData.country !== undefined) allowed.country = rawData.country || null;

    if (Object.keys(allowed).length === 0) throw new BadRequest('No fields to update');

    const updated = await prisma.user.update({ where: { userId }, data: allowed });
    return new UserResponse(updated);
  }

  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) throw new BadRequest('Current password and new password are required');
    if (newPassword.length < 8) throw new BadRequest('New password must be at least 8 characters');

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) throw new ResourceNotFound('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequest('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { userId }, data: { passwordHash } });

    return new MessageResponse('Password changed successfully');
  }

  async testVerifyEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ResourceNotFound('User not found with email: ' + email);

    await prisma.user.update({
      where: { userId: user.userId },
      data: { status: 'ACTIVE', emailVerified: true },
    });
    await prisma.verificationToken.deleteMany({ where: { userId: user.userId } });

    return new MessageResponse('User ' + email + ' verified');
  }
}

module.exports = { AuthService: new AuthService() };
