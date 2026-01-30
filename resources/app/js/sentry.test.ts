import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/vue';
import {
  setSentryUser,
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

describe('Sentry Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setSentryUser', () => {
    it('should set user context with correct data', () => {
      const user = { id: 1, name: 'Test User', email: 'test@example.com' };
      setSentryUser(user);

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: '1',
        email: 'test@example.com',
        username: 'Test User',
        segment: 'user',
      });
      expect(Sentry.setTag).toHaveBeenCalledWith('user_type', 'user');
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
      addSentryBreadcrumb('test', 'Test message', { key: 'value' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'test',
          message: 'Test message',
          data: { key: 'value' },
          level: 'info',
        }),
      );
    });

    it('should add breadcrumb with custom level', () => {
      addSentryBreadcrumb('test', 'Error message', undefined, 'error');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'test',
          message: 'Error message',
          level: 'error',
        }),
      );
    });
  });

  describe('captureSentryException', () => {
    it('should capture exception without context', () => {
      const error = new Error('Test error');
      const eventId = captureSentryException(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
      expect(eventId).toBe('event-id');
    });

    it('should capture exception with context', () => {
      const error = new Error('Test error');
      const context = { userId: 123 };
      captureSentryException(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: context,
      });
    });
  });

  describe('captureSentryMessage', () => {
    it('should capture message with level and context', () => {
      const eventId = captureSentryMessage('Test message', 'warning', { key: 'value' });

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', {
        level: 'warning',
        extra: { key: 'value' },
      });
      expect(eventId).toBe('event-id');
    });
  });
});
