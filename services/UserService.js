const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { sendVerificationEmail } = require('../utils/email');
const { UserAlreadyExists, ResourceNotFound, BadRequest } = require('../middleware/errorHandler');
const AddUserToCompanyRequest = require('../dtos/requests/AddUserToCompanyRequest');
const ChangeRoleRequest = require('../dtos/requests/ChangeRoleRequest');
const CompanyUserResponse = require('../dtos/responses/CompanyUserResponse');
const DeletedResponse = require('../dtos/responses/DeletedResponse');
const MessageResponse = require('../dtos/responses/MessageResponse');

const VERIFICATION_EXPIRATION = parseInt(process.env.VERIFICATION_EXPIRATION, 10) || 3600000;

class UserService {
  async listByCompany(companyId) {
    const companyUsers = await prisma.companyUser.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return companyUsers.map(cu => new CompanyUserResponse(cu));
  }

  async addToCompany(companyId, rawData) {
    const { email, firstName, lastName, username, password, roleId } = new AddUserToCompanyRequest(rawData);
    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new ResourceNotFound('Company not found');

    const role = await prisma.role.findUnique({ where: { roleId } });
    if (!role) throw new ResourceNotFound('Role not found');
    if (role.companyId !== null && role.companyId !== companyId) {
      throw new BadRequest('Role does not belong to this company');
    }

    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      if (!username) throw new BadRequest('Username is required for new users');
      if (!password) throw new BadRequest('Password is required for new users');

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
      try {
        await sendVerificationEmail(user.email, tokenString, null);
      } catch (emailErr) {
        console.error('AddUserToCompany failed: could not send verification email', emailErr);
        throw new BadRequest('Failed to send verification email. Please try again.');
      }
    }

    const alreadyMember = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.userId, companyId } },
    });
    if (alreadyMember) throw new UserAlreadyExists('User is already a member of this company');

    const companyUser = await prisma.companyUser.create({
      data: { userId: user.userId, companyId, roleId, active: true },
    });

    const message = isNewUser
      ? 'New user created and added to company. Verification email sent.'
      : 'User added to company';

    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId,
      active: true,
      createdAt: companyUser.createdAt,
      message,
    };
  }

  async changeRole(companyId, targetUserId, rawData, changedByUserId) {
    if (targetUserId === changedByUserId) {
      throw new BadRequest('Cannot change your own role');
    }
    const { roleId: newRoleId } = new ChangeRoleRequest(rawData);
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: targetUserId, companyId } },
    });
    if (!membership) throw new ResourceNotFound('User is not a member of this company');

    const newRole = await prisma.role.findUnique({ where: { roleId: newRoleId } });
    if (!newRole) throw new ResourceNotFound('Role not found');

    const updated = await prisma.companyUser.update({
      where: { userId_companyId: { userId: targetUserId, companyId } },
      data: { roleId: newRoleId },
      include: { role: true },
    });

    return new CompanyUserResponse(updated);
  }

  async removeFromCompany(companyId, targetUserId, requestingUserId) {
    if (targetUserId === requestingUserId) {
      throw new BadRequest('Cannot remove yourself from company');
    }
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: targetUserId, companyId } },
    });
    if (!membership) throw new ResourceNotFound('User is not a member of this company');

    await prisma.companyUser.update({
      where: { userId_companyId: { userId: targetUserId, companyId } },
      data: { active: false },
    });

    return new DeletedResponse();
  }
}

module.exports = { UserService: new UserService() };
