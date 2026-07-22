require('./setup');
const bcrypt = require('bcryptjs');
const { mockPrisma } = require('./setup');

const AuthService = require('../services/AuthService').AuthService;

describe('AuthService', () => {
  describe('register', () => {
    it('should create user and send verification email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        userId: 'u1', username: 'testuser', email: 'test@example.com',
        firstName: 'Test', lastName: 'User', status: 'INACTIVE', emailVerified: false,
      });
      mockPrisma.verificationToken.create.mockResolvedValue({});

      const result = await AuthService.register({
        username: 'testuser', email: 'test@example.com', password: 'Secret123!',
        firstName: 'Test', lastName: 'User',
      }, { protocol: 'http', get: () => 'localhost:3001' });

      expect(result.username).toBe('testuser');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.verificationToken.create).toHaveBeenCalledTimes(1);
    });

    it('should reject duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'test@example.com' });

      await expect(AuthService.register({
        username: 'testuser', email: 'test@example.com', password: 'Secret123!',
      }, {})).rejects.toThrow('Email already exists');
    });

    it('should reject duplicate username', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ username: 'testuser' });

      await expect(AuthService.register({
        username: 'testuser', email: 'test@example.com', password: 'Secret123!',
      }, {})).rejects.toThrow('Username already exists');
    });
  });

  describe('verifyEmail', () => {
    it('should activate user on valid token', async () => {
      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        tokenId: 't1', userId: 'u1', token: 'valid-token',
        status: 'ACTIVE', expiryAt: new Date(Date.now() + 3600000),
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.verificationToken.update.mockResolvedValue({});

      const result = await AuthService.verifyEmail('valid-token');
      expect(result.message).toBe('Email verified successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { status: 'ACTIVE', emailVerified: true },
      });
    });

    it('should reject expired token', async () => {
      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        tokenId: 't1', userId: 'u1', token: 'expired',
        status: 'ACTIVE', expiryAt: new Date(Date.now() - 1000),
      });

      await expect(AuthService.verifyEmail('expired')).rejects.toThrow('Token has expired');
    });

    it('should reject used token', async () => {
      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        tokenId: 't1', userId: 'u1', token: 'used',
        status: 'USED', expiryAt: new Date(Date.now() + 3600000),
      });

      await expect(AuthService.verifyEmail('used')).rejects.toThrow('Token has already been used');
    });

    it('should reject invalid token', async () => {
      mockPrisma.verificationToken.findUnique.mockResolvedValue(null);
      await expect(AuthService.verifyEmail('invalid')).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const hash = await bcrypt.hash('Secret123!', 12);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ userId: 'u1', email: 'test@example.com', username: 'testuser', passwordHash: hash, status: 'ACTIVE', emailVerified: true })
        .mockResolvedValueOnce(null);

      const result = await AuthService.login('test@example.com', 'Secret123!', {
        headers: { 'user-agent': 'test' },
        connection: { remoteAddress: '127.0.0.1' },
      });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.userId).toBe('u1');
    });

    it('should reject unverified email', async () => {
      const hash = await bcrypt.hash('Secret123!', 12);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ userId: 'u1', email: 'test@example.com', username: 'testuser', passwordHash: hash, status: 'INACTIVE', emailVerified: false })
        .mockResolvedValueOnce(null);

      await expect(AuthService.login('test@example.com', 'Secret123!', {
        headers: { 'user-agent': 'test' },
        connection: { remoteAddress: '127.0.0.1' },
      })).rejects.toThrow('Email verification pending');
    });

    it('should reject wrong password', async () => {
      const hash = await bcrypt.hash('Secret123!', 12);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ userId: 'u1', email: 'test@example.com', username: 'testuser', passwordHash: hash, status: 'ACTIVE', emailVerified: true })
        .mockResolvedValueOnce(null);

      await expect(AuthService.login('test@example.com', 'WrongPassword!', {
        headers: { 'user-agent': 'test' },
        connection: { remoteAddress: '127.0.0.1' },
      })).rejects.toThrow('Log in failed');
    });

    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(AuthService.login('nobody@example.com', 'pass', {
        headers: { 'user-agent': 'test' },
        connection: { remoteAddress: '127.0.0.1' },
      })).rejects.toThrow('Log in failed');
    });
  });

  describe('forgotPassword', () => {
    it('should return success message even if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await AuthService.forgotPassword('nobody@example.com', {});
      expect(result.message).toContain('If an account exists');
    });

    it('should create reset token for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ userId: 'u1', email: 'test@example.com' });
      mockPrisma.verificationToken.deleteMany.mockResolvedValue({});
      mockPrisma.verificationToken.create.mockResolvedValue({});

      const result = await AuthService.forgotPassword('test@example.com', { protocol: 'http', get: () => 'localhost:3001' });
      expect(result.message).toContain('If an account exists');
      expect(mockPrisma.verificationToken.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        tokenId: 't1', userId: 'u1', token: 'reset-token',
        tokenType: 'PASSWORD_RESET', status: 'ACTIVE',
        expiryAt: new Date(Date.now() + 3600000),
      });
      mockPrisma.user.findUnique.mockResolvedValue({ userId: 'u1', emailVerified: true });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.verificationToken.update.mockResolvedValue({});

      const result = await AuthService.resetPassword('reset-token', 'NewPass123!');
      expect(result.message).toBe('Password reset successfully');
    });

    it('should reject wrong token type', async () => {
      mockPrisma.verificationToken.findUnique.mockResolvedValue({
        tokenId: 't1', userId: 'u1', token: 'wrong-type',
        tokenType: 'EMAIL_VERIFICATION', status: 'ACTIVE',
        expiryAt: new Date(Date.now() + 3600000),
      });

      await expect(AuthService.resetPassword('wrong-type', 'NewPass123!')).rejects.toThrow('Invalid token type');
    });
  });

  describe('changePassword', () => {
    it('should change password with correct current password', async () => {
      const hash = await bcrypt.hash('OldPass123!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ userId: 'u1', passwordHash: hash });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await AuthService.changePassword('u1', 'OldPass123!', 'NewPass123!');
      expect(result.message).toBe('Password changed successfully');
    });

    it('should reject incorrect current password', async () => {
      const hash = await bcrypt.hash('OldPass123!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ userId: 'u1', passwordHash: hash });

      await expect(AuthService.changePassword('u1', 'WrongPass!', 'NewPass123!')).rejects.toThrow('Current password is incorrect');
    });

    it('should reject short new password', async () => {
      await expect(AuthService.changePassword('u1', 'OldPass123!', 'short')).rejects.toThrow('at least 8 characters');
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ userId: 'u1' });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await AuthService.updateProfile('u1', { firstName: 'Jane', city: 'Mumbai' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { firstName: 'Jane', city: 'Mumbai' },
      });
    });

    it('should reject when no fields provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ userId: 'u1' });
      await expect(AuthService.updateProfile('u1', {})).rejects.toThrow('No fields to update');
    });

    it('should reject for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(AuthService.updateProfile('nobody', { firstName: 'Jane' })).rejects.toThrow('User not found');
    });
  });
});
