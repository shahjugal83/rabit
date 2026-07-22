const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { sendVerificationEmail } = require('../utils/email');
const { UserAlreadyExists, ResourceNotFound, BadRequest } = require('../middleware/errorHandler');
const CreateCompanyRequest = require('../dtos/requests/CreateCompanyRequest');
const UpdateCompanyRequest = require('../dtos/requests/UpdateCompanyRequest');
const AddUserToCompanyRequest = require('../dtos/requests/AddUserToCompanyRequest');
const CompanyResponse = require('../dtos/responses/CompanyResponse');
const UserResponse = require('../dtos/responses/UserResponse');

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

async function requireSuperAdmin(userId, companyId) {
  const cu = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
    include: { role: true },
  });
  if (!cu || cu.role.name !== 'SUPER_ADMIN') {
    throw new BadRequest('Only SUPER_ADMIN can perform this action');
  }
}

class CompanyService {
  async create(userId, rawData, logoBuffer) {
    const dto = new CreateCompanyRequest(rawData);

    const existing = await prisma.company.findUnique({ where: { name: dto.name } });
    if (existing) throw new UserAlreadyExists('Company name already exists: ' + dto.name);

    let slug = generateUrlSlug(dto.name);
    const baseSlug = slug;
    let counter = 1;
    while (await prisma.company.findUnique({ where: { urlSlug: slug } })) {
      slug = baseSlug + '-' + counter;
      counter++;
    }

    const company = await prisma.company.create({
      data: {
        name: dto.name,
        urlSlug: slug,
        description: dto.description,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        pinCode: dto.pinCode,
        contactNumber: dto.contactNumber,
        logo: logoBuffer || null,
        createdBy: userId,
      },
    });

    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPER_ADMIN', isSystem: true, companyId: null },
    });

    await prisma.companyUser.create({
      data: { userId, companyId: company.companyId, roleId: superAdminRole.roleId },
    });

    return new CompanyResponse(company, superAdminRole);
  }

  async listByUser(userId) {
    const memberships = await prisma.companyUser.findMany({
      where: { userId },
      include: { company: true, role: true },
    });

    return memberships.map(m => new CompanyResponse(m.company, m.role));
  }

  async getById(companyId, userId) {
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: { company: true, role: true },
    });
    if (!membership) throw new ResourceNotFound('User does not have access to this company');

    return new CompanyResponse(membership.company, membership.role);
  }

  async getLogo(companyId, userId) {
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership) throw new ResourceNotFound('User does not have access to this company');

    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new ResourceNotFound('Company not found');

    return company.logo ? Buffer.from(company.logo) : null;
  }

  async update(companyId, userId, rawData, logoBuffer) {
    const dto = new UpdateCompanyRequest(rawData);
    await requireSuperAdmin(userId, companyId);

    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new ResourceNotFound('Company not found');

    const updateData = {};
    if (dto.description !== null) updateData.description = dto.description;
    if (dto.addressLine1 !== null) updateData.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== null) updateData.addressLine2 = dto.addressLine2;
    if (dto.city !== null) updateData.city = dto.city;
    if (dto.state !== null) updateData.state = dto.state;
    if (dto.country !== null) updateData.country = dto.country;
    if (dto.pinCode !== null) updateData.pinCode = dto.pinCode;
    if (dto.contactNumber !== null) updateData.contactNumber = dto.contactNumber;
    if (logoBuffer) {
      if (logoBuffer.length > MAX_FILE_SIZE) {
        throw new BadRequest('Logo size must not exceed 50KB');
      }
      updateData.logo = logoBuffer;
    }

    await prisma.company.update({ where: { companyId }, data: updateData });

    const updated = await prisma.company.findUnique({ where: { companyId } });
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: { role: true },
    });

    return new CompanyResponse(updated, membership.role);
  }

  async addUser(companyId, superAdminUserId, rawData) {
    const dto = new AddUserToCompanyRequest(rawData);

    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new ResourceNotFound('Company not found');

    const superAdminMembership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: superAdminUserId, companyId } },
      include: { role: true },
    });
    if (!superAdminMembership) throw new ResourceNotFound('You are not a member of this company');
    if (superAdminMembership.role.name !== 'SUPER_ADMIN') {
      throw new BadRequest('Only SUPER_ADMIN can add users to the company');
    }

    let user = await prisma.user.findUnique({ where: { email: dto.email } });
    let isNewUser = false;

    if (!user) {
      if (!dto.username) throw new BadRequest('Username is required for new users');
      if (!dto.password) throw new BadRequest('Password is required for new users');

      const existingUsername = await prisma.user.findUnique({ where: { username: dto.username } });
      if (existingUsername) throw new UserAlreadyExists('Username already exists: ' + dto.username);

      const passwordHash = await bcrypt.hash(dto.password, 12);
      user = await prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
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
      sendVerificationEmail(user.email, tokenString, null);
    }

    const alreadyMember = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.userId, companyId } },
    });
    if (alreadyMember) throw new UserAlreadyExists('User is already a member of this company');

    const companyUser = await prisma.companyUser.create({
      data: { userId: user.userId, companyId, roleId: dto.roleId, active: true },
    });

    const message = isNewUser
      ? 'New user created and added to company. Verification email sent.'
      : 'User added to company';

    const userResponse = new UserResponse(user);
    userResponse.roleId = dto.roleId;
    userResponse.active = true;
    userResponse.createdAt = companyUser.createdAt;
    userResponse.message = message;
    return userResponse;
  }
}

module.exports = { CompanyService: new CompanyService() };
