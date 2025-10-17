import { describe, it, expect } from 'vitest';
import { useRoleHelpers, ROLE_HIERARCHY } from '../useRoleHelpers';

describe('useRoleHelpers', () => {
  const { getRoleLevel, hasRoleAccess, getRoleLabel, getRoleBadgeVariant } = useRoleHelpers();

  describe('ROLE_HIERARCHY', () => {
    it('should have correct hierarchy levels', () => {
      expect(ROLE_HIERARCHY.super_admin).toBe(3);
      expect(ROLE_HIERARCHY.admin).toBe(2);
      expect(ROLE_HIERARCHY.moderator).toBe(1);
    });
  });

  describe('getRoleLevel', () => {
    it('should return 3 for super_admin', () => {
      expect(getRoleLevel('super_admin')).toBe(3);
    });

    it('should return 2 for admin', () => {
      expect(getRoleLevel('admin')).toBe(2);
    });

    it('should return 1 for moderator', () => {
      expect(getRoleLevel('moderator')).toBe(1);
    });

    it('should return 0 for null', () => {
      expect(getRoleLevel(null)).toBe(0);
    });

    it('should return 0 for unknown role', () => {
      expect(getRoleLevel('unknown' as any)).toBe(0);
    });
  });

  describe('hasRoleAccess', () => {
    it('should allow super_admin access to moderator actions', () => {
      expect(hasRoleAccess('super_admin', 'moderator')).toBe(true);
    });

    it('should allow super_admin access to admin actions', () => {
      expect(hasRoleAccess('super_admin', 'admin')).toBe(true);
    });

    it('should allow super_admin access to super_admin actions', () => {
      expect(hasRoleAccess('super_admin', 'super_admin')).toBe(true);
    });

    it('should allow admin access to moderator actions', () => {
      expect(hasRoleAccess('admin', 'moderator')).toBe(true);
    });

    it('should allow admin access to admin actions', () => {
      expect(hasRoleAccess('admin', 'admin')).toBe(true);
    });

    it('should deny admin access to super_admin actions', () => {
      expect(hasRoleAccess('admin', 'super_admin')).toBe(false);
    });

    it('should allow moderator access to moderator actions', () => {
      expect(hasRoleAccess('moderator', 'moderator')).toBe(true);
    });

    it('should deny moderator access to admin actions', () => {
      expect(hasRoleAccess('moderator', 'admin')).toBe(false);
    });

    it('should deny moderator access to super_admin actions', () => {
      expect(hasRoleAccess('moderator', 'super_admin')).toBe(false);
    });

    it('should deny null role access', () => {
      expect(hasRoleAccess(null, 'moderator')).toBe(false);
    });
  });

  describe('getRoleLabel', () => {
    it('should return Super Admin for super_admin', () => {
      expect(getRoleLabel('super_admin')).toBe('Super Admin');
    });

    it('should return Admin for admin', () => {
      expect(getRoleLabel('admin')).toBe('Admin');
    });

    it('should return Moderator for moderator', () => {
      expect(getRoleLabel('moderator')).toBe('Moderator');
    });

    it('should return Unknown for unknown role', () => {
      expect(getRoleLabel('unknown' as any)).toBe('Unknown');
    });
  });

  describe('getRoleBadgeVariant', () => {
    it('should return danger for super_admin', () => {
      expect(getRoleBadgeVariant('super_admin')).toBe('danger');
    });

    it('should return warning for admin', () => {
      expect(getRoleBadgeVariant('admin')).toBe('warning');
    });

    it('should return info for moderator', () => {
      expect(getRoleBadgeVariant('moderator')).toBe('info');
    });

    it('should return info for unknown role', () => {
      expect(getRoleBadgeVariant('unknown' as any)).toBe('info');
    });
  });
});
