import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVrlConfirm } from './useVrlConfirm';
import { PhWarning } from '@phosphor-icons/vue';

describe('useVrlConfirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('initializes with dialog hidden', () => {
      const { isVisible } = useVrlConfirm();

      expect(isVisible.value).toBe(false);
    });

    it('initializes with no options', () => {
      const { options } = useVrlConfirm();

      expect(options.value).toBeNull();
    });

    it('initializes with loading false', () => {
      const { isLoading } = useVrlConfirm();

      expect(isLoading.value).toBe(false);
    });
  });

  describe('showConfirmation', () => {
    it('sets visibility to true', () => {
      const { isVisible, showConfirmation } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept: vi.fn(),
      });

      expect(isVisible.value).toBe(true);
    });

    it('stores the provided options', () => {
      const { options, showConfirmation } = useVrlConfirm();

      const confirmOptions = {
        header: 'Delete Item',
        message: 'Are you sure?',
        icon: PhWarning,
        iconColor: 'var(--red)',
        onAccept: vi.fn(),
      };

      showConfirmation(confirmOptions);

      expect(options.value).toEqual(confirmOptions);
    });

    it('prevents duplicate dialogs', () => {
      const { isVisible, options, showConfirmation } = useVrlConfirm();

      const firstOptions = {
        header: 'First',
        message: 'First message',
        onAccept: vi.fn(),
      };

      const secondOptions = {
        header: 'Second',
        message: 'Second message',
        onAccept: vi.fn(),
      };

      showConfirmation(firstOptions);
      showConfirmation(secondOptions);

      expect(isVisible.value).toBe(true);
      expect(options.value).toEqual(firstOptions);
    });

    it('allows showing dialog after closing', () => {
      const { isVisible, options, showConfirmation, close } = useVrlConfirm();

      const firstOptions = {
        header: 'First',
        message: 'First message',
        onAccept: vi.fn(),
      };

      showConfirmation(firstOptions);
      close();

      const secondOptions = {
        header: 'Second',
        message: 'Second message',
        onAccept: vi.fn(),
      };

      showConfirmation(secondOptions);

      expect(isVisible.value).toBe(true);
      expect(options.value).toEqual(secondOptions);
    });
  });

  describe('close', () => {
    it('sets visibility to false', () => {
      const { isVisible, showConfirmation, close } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept: vi.fn(),
      });

      close();

      expect(isVisible.value).toBe(false);
    });

    it('sets loading to false', () => {
      const { isLoading, showConfirmation, close } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept: vi.fn(),
      });

      isLoading.value = true;
      close();

      expect(isLoading.value).toBe(false);
    });
  });

  describe('handleAccept', () => {
    it('calls onAccept callback', async () => {
      const onAccept = vi.fn();
      const { showConfirmation, handleAccept } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept,
      });

      await handleAccept();

      expect(onAccept).toHaveBeenCalledOnce();
    });

    it('sets loading to true while processing', async () => {
      const { isLoading, showConfirmation, handleAccept } = useVrlConfirm();

      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept: () => promise,
      });

      const acceptPromise = handleAccept();

      expect(isLoading.value).toBe(true);

      resolvePromise!();
      await acceptPromise;

      expect(isLoading.value).toBe(false);
    });

    it('closes dialog after successful accept', async () => {
      const { isVisible, showConfirmation, handleAccept } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept: vi.fn(),
      });

      await handleAccept();

      expect(isVisible.value).toBe(false);
    });

    it('handles async onAccept callbacks', async () => {
      const onAccept = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const { showConfirmation, handleAccept } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept,
      });

      await handleAccept();

      expect(onAccept).toHaveBeenCalledOnce();
    });

    it('sets loading to false even if onAccept throws', async () => {
      const error = new Error('Test error');
      const onAccept = vi.fn(() => {
        throw error;
      });

      const { isLoading, showConfirmation, handleAccept } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept,
      });

      await expect(handleAccept()).rejects.toThrow('Test error');

      expect(isLoading.value).toBe(false);
    });

    it('does nothing if options is null', async () => {
      const { handleAccept } = useVrlConfirm();

      // Should not throw
      await handleAccept();
    });
  });

  describe('handleReject', () => {
    it('calls onReject callback if provided', () => {
      const onReject = vi.fn();
      const { showConfirmation, handleReject } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept: vi.fn(),
        onReject,
      });

      handleReject();

      expect(onReject).toHaveBeenCalledOnce();
    });

    it('does not throw if onReject is not provided', () => {
      const { showConfirmation, handleReject } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept: vi.fn(),
      });

      expect(() => handleReject()).not.toThrow();
    });

    it('closes dialog after reject', () => {
      const { isVisible, showConfirmation, handleReject } = useVrlConfirm();

      showConfirmation({
        header: 'Test',
        message: 'Test message',
        onAccept: vi.fn(),
      });

      handleReject();

      expect(isVisible.value).toBe(false);
    });

    it('does nothing if options is null', () => {
      const { handleReject } = useVrlConfirm();

      // Should not throw
      expect(() => handleReject()).not.toThrow();
    });
  });

  describe('Full Workflow', () => {
    it('handles complete confirmation workflow', async () => {
      const onAccept = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const { isVisible, isLoading, showConfirmation, handleAccept } = useVrlConfirm();

      expect(isVisible.value).toBe(false);
      expect(isLoading.value).toBe(false);

      showConfirmation({
        header: 'Delete Item',
        message: 'Are you sure?',
        onAccept,
      });

      expect(isVisible.value).toBe(true);

      await handleAccept();

      expect(onAccept).toHaveBeenCalledOnce();
      expect(isVisible.value).toBe(false);
      expect(isLoading.value).toBe(false);
    });

    it('handles complete rejection workflow', () => {
      const onReject = vi.fn();

      const { isVisible, showConfirmation, handleReject } = useVrlConfirm();

      expect(isVisible.value).toBe(false);

      showConfirmation({
        header: 'Delete Item',
        message: 'Are you sure?',
        onAccept: vi.fn(),
        onReject,
      });

      expect(isVisible.value).toBe(true);

      handleReject();

      expect(onReject).toHaveBeenCalledOnce();
      expect(isVisible.value).toBe(false);
    });
  });
});
