import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToast } from '../useToast';
import { useToast as usePrimeToast } from 'primevue/usetoast';

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(),
}));

describe('useToast', () => {
  const mockAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePrimeToast).mockReturnValue({
      add: mockAdd,
      remove: vi.fn(),
      removeGroup: vi.fn(),
      removeAllGroups: vi.fn(),
    });
  });

  it('success() adds toast with severity "success"', () => {
    const toast = useToast();
    toast.success('Operation successful');

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Success',
      detail: 'Operation successful',
      life: 5000,
    });
  });

  it('success() adds toast with custom summary', () => {
    const toast = useToast();
    toast.success('Operation successful', 'Great!');

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Great!',
      detail: 'Operation successful',
      life: 5000,
    });
  });

  it('info() adds toast with severity "info"', () => {
    const toast = useToast();
    toast.info('Here is some information');

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Info',
      detail: 'Here is some information',
      life: 5000,
    });
  });

  it('info() adds toast with custom summary', () => {
    const toast = useToast();
    toast.info('Here is some information', 'Notice');

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Notice',
      detail: 'Here is some information',
      life: 5000,
    });
  });

  it('warn() adds toast with severity "warn"', () => {
    const toast = useToast();
    toast.warn('This is a warning');

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'Warning',
      detail: 'This is a warning',
      life: 5000,
    });
  });

  it('warn() adds toast with custom summary', () => {
    const toast = useToast();
    toast.warn('This is a warning', 'Caution!');

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'Caution!',
      detail: 'This is a warning',
      life: 5000,
    });
  });

  it('error() adds toast with severity "error"', () => {
    const toast = useToast();
    toast.error('An error occurred');

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred',
      life: 5000,
    });
  });

  it('error() adds toast with custom summary', () => {
    const toast = useToast();
    toast.error('An error occurred', 'Failed!');

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Failed!',
      detail: 'An error occurred',
      life: 5000,
    });
  });

  it('show() adds toast with custom options', () => {
    const toast = useToast();
    toast.show({
      severity: 'success',
      summary: 'Custom Summary',
      detail: 'Custom detail message',
      life: 3000,
    });

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Custom Summary',
      detail: 'Custom detail message',
      life: 3000,
    });
  });

  it('show() uses default severity "info" when not provided', () => {
    const toast = useToast();
    toast.show({
      detail: 'Message without severity',
    });

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'info',
      summary: undefined,
      detail: 'Message without severity',
      life: 5000,
    });
  });

  it('show() uses default life 5000ms when not provided', () => {
    const toast = useToast();
    toast.show({
      severity: 'warn',
      detail: 'Message without life',
    });

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'warn',
      summary: undefined,
      detail: 'Message without life',
      life: 5000,
    });
  });

  it('default life is 5000ms for all methods', () => {
    const toast = useToast();

    toast.success('Success message');
    toast.info('Info message');
    toast.warn('Warning message');
    toast.error('Error message');

    expect(mockAdd).toHaveBeenCalledTimes(4);
    mockAdd.mock.calls.forEach((call) => {
      expect(call[0].life).toBe(5000);
    });
  });

  it('summary defaults are applied correctly', () => {
    const toast = useToast();

    toast.success('Message');
    expect(mockAdd).toHaveBeenLastCalledWith(expect.objectContaining({ summary: 'Success' }));

    toast.info('Message');
    expect(mockAdd).toHaveBeenLastCalledWith(expect.objectContaining({ summary: 'Info' }));

    toast.warn('Message');
    expect(mockAdd).toHaveBeenLastCalledWith(expect.objectContaining({ summary: 'Warning' }));

    toast.error('Message');
    expect(mockAdd).toHaveBeenLastCalledWith(expect.objectContaining({ summary: 'Error' }));
  });
});
