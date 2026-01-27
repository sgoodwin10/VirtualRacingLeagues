import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToast } from './useToast';

// Mock PrimeVue's useToast
const mockToastAdd = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: mockToastAdd,
  })),
}));

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success', () => {
    it('should call toast.add with success severity', () => {
      const { success } = useToast();

      success('Operation successful');

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Operation successful',
        life: 5000,
      });
    });

    it('should use default "Success" summary', () => {
      const { success } = useToast();

      success('Test message');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Success',
        }),
      );
    });

    it('should use custom summary when provided', () => {
      const { success } = useToast();

      success('Test message', 'Custom Success');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Custom Success',
        }),
      );
    });

    it('should use message as detail', () => {
      const { success } = useToast();

      success('Detailed success message');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Detailed success message',
        }),
      );
    });

    it('should set life to 5000ms', () => {
      const { success } = useToast();

      success('Test');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          life: 5000,
        }),
      );
    });
  });

  describe('info', () => {
    it('should call toast.add with info severity', () => {
      const { info } = useToast();

      info('Information message');

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Info',
        detail: 'Information message',
        life: 5000,
      });
    });

    it('should use default "Info" summary', () => {
      const { info } = useToast();

      info('Test message');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Info',
        }),
      );
    });

    it('should use custom summary when provided', () => {
      const { info } = useToast();

      info('Test message', 'Custom Info');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Custom Info',
        }),
      );
    });

    it('should use message as detail', () => {
      const { info } = useToast();

      info('Detailed info message');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Detailed info message',
        }),
      );
    });

    it('should set life to 5000ms', () => {
      const { info } = useToast();

      info('Test');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          life: 5000,
        }),
      );
    });
  });

  describe('warn', () => {
    it('should call toast.add with warn severity', () => {
      const { warn } = useToast();

      warn('Warning message');

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Warning message',
        life: 5000,
      });
    });

    it('should use default "Warning" summary', () => {
      const { warn } = useToast();

      warn('Test message');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Warning',
        }),
      );
    });

    it('should use custom summary when provided', () => {
      const { warn } = useToast();

      warn('Test message', 'Custom Warning');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Custom Warning',
        }),
      );
    });

    it('should use message as detail', () => {
      const { warn } = useToast();

      warn('Detailed warning message');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Detailed warning message',
        }),
      );
    });

    it('should set life to 5000ms', () => {
      const { warn } = useToast();

      warn('Test');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          life: 5000,
        }),
      );
    });
  });

  describe('error', () => {
    it('should call toast.add with error severity', () => {
      const { error } = useToast();

      error('Error message');

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Error message',
        life: 5000,
      });
    });

    it('should use default "Error" summary', () => {
      const { error } = useToast();

      error('Test message');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Error',
        }),
      );
    });

    it('should use custom summary when provided', () => {
      const { error } = useToast();

      error('Test message', 'Custom Error');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Custom Error',
        }),
      );
    });

    it('should use message as detail', () => {
      const { error } = useToast();

      error('Detailed error message');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Detailed error message',
        }),
      );
    });

    it('should set life to 5000ms', () => {
      const { error } = useToast();

      error('Test');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          life: 5000,
        }),
      );
    });
  });

  describe('show', () => {
    it('should call toast.add with custom options', () => {
      const { show } = useToast();

      show({
        severity: 'success',
        summary: 'Custom Title',
        detail: 'Custom message',
        life: 3000,
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Custom Title',
        detail: 'Custom message',
        life: 3000,
      });
    });

    it('should default severity to "info"', () => {
      const { show } = useToast();

      show({
        detail: 'Test message',
      });

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
        }),
      );
    });

    it('should default life to 5000ms', () => {
      const { show } = useToast();

      show({
        detail: 'Test message',
      });

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          life: 5000,
        }),
      );
    });

    it('should override default severity', () => {
      const { show } = useToast();

      show({
        severity: 'error',
        detail: 'Test message',
      });

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
        }),
      );
    });

    it('should override default life', () => {
      const { show } = useToast();

      show({
        detail: 'Test message',
        life: 10000,
      });

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          life: 10000,
        }),
      );
    });

    it('should handle all severity types', () => {
      const { show } = useToast();

      const severities: Array<'success' | 'info' | 'warn' | 'error'> = [
        'success',
        'info',
        'warn',
        'error',
      ];

      severities.forEach((severity) => {
        show({
          severity,
          detail: `${severity} message`,
        });
      });

      expect(mockToastAdd).toHaveBeenCalledTimes(4);
    });

    it('should allow undefined summary', () => {
      const { show } = useToast();

      show({
        detail: 'Test message',
        summary: undefined,
      });

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: undefined,
        }),
      );
    });
  });

  describe('Return value interface', () => {
    it('should return all required methods', () => {
      const toast = useToast();

      expect(toast).toHaveProperty('success');
      expect(toast).toHaveProperty('info');
      expect(toast).toHaveProperty('warn');
      expect(toast).toHaveProperty('error');
      expect(toast).toHaveProperty('show');
      expect(typeof toast.success).toBe('function');
      expect(typeof toast.info).toBe('function');
      expect(typeof toast.warn).toBe('function');
      expect(typeof toast.error).toBe('function');
      expect(typeof toast.show).toBe('function');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple toast calls', () => {
      const { success, error, info } = useToast();

      success('Success 1');
      error('Error 1');
      info('Info 1');

      expect(mockToastAdd).toHaveBeenCalledTimes(3);
    });

    it('should handle empty message strings', () => {
      const { success } = useToast();

      success('');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: '',
        }),
      );
    });

    it('should handle long messages', () => {
      const { info } = useToast();
      const longMessage = 'A'.repeat(500);

      info(longMessage);

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: longMessage,
        }),
      );
    });

    it('should handle special characters in messages', () => {
      const { warn } = useToast();

      warn('Message with <html> & "quotes" and \'apostrophes\'');

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Message with <html> & "quotes" and \'apostrophes\'',
        }),
      );
    });
  });
});
