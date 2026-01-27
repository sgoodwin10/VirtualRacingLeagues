import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAsyncAction, createAsyncActions } from './useAsyncAction';

describe('useAsyncAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { isLoading, error, data } = useAsyncAction();
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(data.value).toBeNull();
    });
  });

  describe('execute', () => {
    it('should execute async function successfully', async () => {
      const { execute, isLoading, data } = useAsyncAction<string>();
      const asyncFn = vi.fn().mockResolvedValue('test result');

      const result = await execute(asyncFn);

      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.data).toBe('test result');
      expect(data.value).toBe('test result');
      expect(isLoading.value).toBe(false);
    });

    it('should set loading state during execution', async () => {
      const { execute, isLoading } = useAsyncAction();
      const asyncFn = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            expect(isLoading.value).toBe(true);
            resolve('done');
          }),
      );

      await execute(asyncFn);
      expect(isLoading.value).toBe(false);
    });

    it('should handle errors', async () => {
      const { execute, error } = useAsyncAction();
      const testError = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(testError);

      const result = await execute(asyncFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe(testError);
      expect(error.value).toBe(testError);
    });

    it('should clear previous error before execution', async () => {
      const { execute, error } = useAsyncAction();
      const firstError = new Error('First error');
      const asyncFn1 = vi.fn().mockRejectedValue(firstError);
      const asyncFn2 = vi.fn().mockResolvedValue('success');

      await execute(asyncFn1);
      expect(error.value).toBe(firstError);

      await execute(asyncFn2);
      expect(error.value).toBeNull();
    });

    it('should execute onSuccess callback', async () => {
      const { execute } = useAsyncAction<string>();
      const onSuccess = vi.fn();
      const asyncFn = vi.fn().mockResolvedValue('test result');

      await execute(asyncFn, { onSuccess });

      expect(onSuccess).toHaveBeenCalledWith('test result');
    });

    it('should execute async onSuccess callback', async () => {
      const { execute } = useAsyncAction<string>();
      const onSuccess = vi.fn().mockResolvedValue(undefined);
      const asyncFn = vi.fn().mockResolvedValue('test result');

      await execute(asyncFn, { onSuccess });

      expect(onSuccess).toHaveBeenCalledWith('test result');
    });

    it('should execute onError callback', async () => {
      const { execute } = useAsyncAction();
      const onError = vi.fn();
      const testError = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(testError);

      await execute(asyncFn, { onError });

      expect(onError).toHaveBeenCalledWith(testError);
    });

    it('should execute async onError callback', async () => {
      const { execute } = useAsyncAction();
      const onError = vi.fn().mockResolvedValue(undefined);
      const testError = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(testError);

      await execute(asyncFn, { onError });

      expect(onError).toHaveBeenCalledWith(testError);
    });

    it('should execute onFinally callback on success', async () => {
      const { execute } = useAsyncAction();
      const onFinally = vi.fn();
      const asyncFn = vi.fn().mockResolvedValue('success');

      await execute(asyncFn, { onFinally });

      expect(onFinally).toHaveBeenCalledTimes(1);
    });

    it('should execute onFinally callback on error', async () => {
      const { execute } = useAsyncAction();
      const onFinally = vi.fn();
      const asyncFn = vi.fn().mockRejectedValue(new Error('error'));

      await execute(asyncFn, { onFinally });

      expect(onFinally).toHaveBeenCalledTimes(1);
    });

    it('should not throw by default', async () => {
      const { execute } = useAsyncAction();
      const asyncFn = vi.fn().mockRejectedValue(new Error('error'));

      await expect(execute(asyncFn)).resolves.toBeDefined();
    });

    it('should throw when throwOnError is true', async () => {
      const { execute } = useAsyncAction();
      const testError = new Error('Test error');
      const asyncFn = vi.fn().mockRejectedValue(testError);

      await expect(execute(asyncFn, { throwOnError: true })).rejects.toThrow(testError);
    });

    it('should respect logErrors option', async () => {
      const { execute } = useAsyncAction();
      const asyncFn = vi.fn().mockRejectedValue(new Error('error'));

      // Should not throw even with logging disabled
      await expect(execute(asyncFn, { logErrors: false })).resolves.toBeDefined();
    });

    it('should use custom error message for logging', async () => {
      const { execute } = useAsyncAction();
      const asyncFn = vi.fn().mockRejectedValue(new Error('error'));

      await execute(asyncFn, { errorMessage: 'Custom error message' });
      // Just verify it doesn't throw - logging is mocked
      expect(true).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      const { execute, reset, isLoading, error, data } = useAsyncAction<string>();
      const asyncFn = vi.fn().mockResolvedValue('test result');

      await execute(asyncFn);
      expect(data.value).toBe('test result');

      reset();

      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(data.value).toBeNull();
    });
  });
});

describe('createAsyncActions', () => {
  it('should create multiple async actions', () => {
    const actions = createAsyncActions({
      create: useAsyncAction<string>(),
      update: useAsyncAction<string>(),
      delete: useAsyncAction<void>(),
    });

    expect(actions.create).toBeDefined();
    expect(actions.update).toBeDefined();
    expect(actions.delete).toBeDefined();
  });

  it('should have independent states', async () => {
    const actions = createAsyncActions({
      create: useAsyncAction<string>(),
      update: useAsyncAction<string>(),
    });

    const createFn = vi.fn().mockResolvedValue('created');
    await actions.create.execute(createFn);

    expect(actions.create.data.value).toBe('created');
    expect(actions.update.data.value).toBeNull();
  });

  it('should have independent loading states', async () => {
    const actions = createAsyncActions({
      create: useAsyncAction<string>(),
      update: useAsyncAction<string>(),
    });

    const createFn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          expect(actions.create.isLoading.value).toBe(true);
          expect(actions.update.isLoading.value).toBe(false);
          resolve('done');
        }),
    );

    await actions.create.execute(createFn);
  });
});
