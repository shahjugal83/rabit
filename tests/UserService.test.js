require('./setup');
const { mockPrisma } = require('./setup');

const UserService = require('../services/UserService').UserService;

describe('UserService', () => {
  describe('changeRole', () => {
    it('should reject when user tries to change their own role', async () => {
      await expect(UserService.changeRole('c1', 'u1', { roleId: 'r2' }, 'u1'))
        .rejects.toThrow('Cannot change your own role');
      expect(mockPrisma.companyUser.findUnique).not.toHaveBeenCalled();
    });

    it('should update role for another user', async () => {
      mockPrisma.companyUser.findUnique.mockResolvedValue({
        userId: 'u2', companyId: 'c1', roleId: 'r1',
      });
      mockPrisma.role.findUnique.mockResolvedValue({ roleId: 'r2', name: 'ADMIN' });
      mockPrisma.companyUser.update.mockResolvedValue({
        userId: 'u2', companyId: 'c1', roleId: 'r2',
        role: { roleId: 'r2', name: 'ADMIN' },
      });

      const result = await UserService.changeRole('c1', 'u2', { roleId: 'r2' }, 'u1');
      expect(result.role.roleId).toBe('r2');
    });

    it('should reject if user is not a member of the company', async () => {
      mockPrisma.companyUser.findUnique.mockResolvedValue(null);
      await expect(UserService.changeRole('c1', 'u99', { roleId: 'r2' }, 'u1'))
        .rejects.toThrow('User is not a member');
    });
  });

  describe('removeFromCompany', () => {
    it('should reject when user tries to remove themselves', async () => {
      await expect(UserService.removeFromCompany('c1', 'u1', 'u1'))
        .rejects.toThrow('Cannot remove yourself from company');
    });

    it('should remove another user from company', async () => {
      mockPrisma.companyUser.findUnique.mockResolvedValue({
        userId: 'u2', companyId: 'c1',
      });
      mockPrisma.companyUser.update.mockResolvedValue({});

      const result = await UserService.removeFromCompany('c1', 'u2', 'u1');
      expect(result.deleted).toBe(true);
    });
  });

  describe('addToCompany', () => {
    it('should reject if user is already a member', async () => {
      mockPrisma.company.findUnique.mockResolvedValue({ companyId: 'c1', name: 'Acme' });
      mockPrisma.role.findUnique.mockResolvedValue({ roleId: 'r1', companyId: null });
      mockPrisma.user.findUnique.mockResolvedValue({ userId: 'u1', email: 'existing@test.com' });
      mockPrisma.companyUser.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(UserService.addToCompany('c1', {
        email: 'existing@test.com', roleId: 'r1',
      })).rejects.toThrow('already a member');
    });
  });
});
