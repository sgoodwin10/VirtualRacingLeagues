import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/vue';
import {
  setSentryAdmin,
  clearSentryUser,
  addSentryBreadcrumb,
  captureSentryException,
  captureSentryMessage,
} from './sentry';

vi.mock('@sentry/vue', () => ({
  setUser: vi.fn(),
  setTag: vi.fn(),
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(() => 'event-id'),
  captureMessage: vi.fn(() => 'event-id'),
}));

describe('Sentry Admin Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setSentryAdmin', () => {
    it('should set admin context with correct data', () => {
      const admin = { id: 1, name: 'Admin User', email: 'admin@example.com' };
      setSentryAdmin(admin);

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: '1',
        email: 'admin@example.com',
        username: 'Admin User',
        segment: 'admin',
      });
      expect(Sentry.setTag).toHaveBeenCalledWith('user_type', 'admin');
      expect(Sentry.setTag).toHaveBeenCalledWith('admin_role', 'administrator');
    });
  });

  describe('clearSentryUser', () => {
    it('should clear user context', () => {
      clearSentryUser();
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addSentryBreadcrumb', () => {
    it('should add breadcrumb with default level', () => {
      addSentryBreadcrumb('admin.action', 'User management action', { userId: 123 });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'admin.action',
          message: 'User management action',
          data: { userId: 123 },
          level: 'info',
        }),
      );
    });

    it('should add breadcrumb with custom level', () => {
      addSentryBreadcrumb('admin.error', 'Critical error occurred', undefined, 'error');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'admin.error',
          message: 'Critical error occurred',
          level: 'error',
        }),
      );
    });
  });

  describe('captureSentryException', () => {
    it('should capture exception without context', () => {
      const error = new Error('Admin error');
      const eventId = captureSentryException(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
      expect(eventId).toBe('event-id');
    });

    it('should capture exception with context', () => {
      const error = new Error('Admin error');
      const context = { adminId: 1, action: 'delete_user' };
      captureSentryException(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: context,
      });
    });
  });

  describe('captureSentryMessage', () => {
    it('should capture message with default level and no context', () => {
      const eventId = captureSentryMessage('Admin action completed');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Admin action completed', {
        level: 'info',
        extra: undefined,
      });
      expect(eventId).toBe('event-id');
    });

    it('should capture message with level and context', () => {
      const eventId = captureSentryMessage('Admin action completed', 'info', {
        action: 'bulk_update',
      });

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Admin action completed', {
        level: 'info',
        extra: { action: 'bulk_update' },
      });
      expect(eventId).toBe('event-id');
    });

    it('should capture message with different severity levels', () => {
      captureSentryMessage('Debug message', 'debug');
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Debug message', {
        level: 'debug',
        extra: undefined,
      });

      captureSentryMessage('Warning message', 'warning');
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Warning message', {
        level: 'warning',
        extra: undefined,
      });

      captureSentryMessage('Error message', 'error');
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Error message', {
        level: 'error',
        extra: undefined,
      });
    });
  });
});
