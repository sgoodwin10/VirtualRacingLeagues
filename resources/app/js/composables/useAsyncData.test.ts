import { describe, it, expect } from 'vitest';
import { useAsyncData } from './useAsyncData';

describe('useAsyncData', () => {
  it('should initialize with null data, false loading, and null error', () => {
    const { data, loading, error } = useAsyncData<string>();

    expect(data.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should set loading to true during execution', async () => {
    const { loading, execute } = useAsyncData<string>();

    let isLoadingDuringExecution = false;

    const promise = execute(async () => {
      isLoadingDuringExecution = loading.value;
      return 'test data';
    });

    expect(loading.value).toBe(true);
    await promise;

    expect(isLoadingDuringExecution).toBe(true);
  });

  it('should set data on successful execution', async () => {
    const { data, loading, error, execute } = useAsyncData<string>();

    await execute(async () => 'test data');

    expect(data.value).toBe('test data');
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should set error on failed execution', async () => {
    const { data, loading, error, execute } = useAsyncData<string>('Default error message');

    await expect(
      execute(async () => {
        throw new Error('Test error');
      }),
    ).rejects.toThrow('Test error');

    expect(data.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBe('Test error');
  });

  it('should use default error message when error has no message', async () => {
    const { error, execute } = useAsyncData<string>('Default error');

    await expect(
      execute(async () => {
        throw 'String error'; // Non-Error throw
      }),
    ).rejects.toBe('String error');

    expect(error.value).toBe('Default error');
  });

  it('should clear error with clearError', async () => {
    const { error, execute, clearError } = useAsyncData<string>();

    await expect(
      execute(async () => {
        throw new Error('Test error');
      }),
    ).rejects.toThrow();

    expect(error.value).toBe('Test error');

    clearError();

    expect(error.value).toBeNull();
  });

  it('should reset all state with reset', async () => {
    const { data, loading, error, execute, reset } = useAsyncData<string>();

    await execute(async () => 'test data');

    expect(data.value).toBe('test data');

    reset();

    expect(data.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('should handle multiple sequential executions', async () => {
    const { data, execute } = useAsyncData<number>();

    await execute(async () => 1);
    expect(data.value).toBe(1);

    await execute(async () => 2);
    expect(data.value).toBe(2);

    await execute(async () => 3);
    expect(data.value).toBe(3);
  });

  it('should clear error on new execution', async () => {
    const { error, execute } = useAsyncData<string>();

    await expect(
      execute(async () => {
        throw new Error('First error');
      }),
    ).rejects.toThrow();

    expect(error.value).toBe('First error');

    await execute(async () => 'success');

    expect(error.value).toBeNull();
  });

  it('should return the result from execute', async () => {
    const { execute } = useAsyncData<string>();

    const result = await execute(async () => 'test data');

    expect(result).toBe('test data');
  });

  it('should work with complex data types', async () => {
    interface User {
      id: number;
      name: string;
    }

    const { data, execute } = useAsyncData<User>();

    await execute(async () => ({ id: 1, name: 'John' }));

    expect(data.value).toEqual({ id: 1, name: 'John' });
  });
});
