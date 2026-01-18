import { describe, it, expect, vi } from 'vitest';
import { useLoadingState } from '../useLoadingState';

describe('useLoadingState', () => {
  it('should initialize with loading state false', () => {
    const { isLoading, loadingMessage } = useLoadingState();

    expect(isLoading.value).toBe(false);
    expect(loadingMessage.value).toBeUndefined();
  });

  describe('startLoading', () => {
    it('should set loading to true', () => {
      const { isLoading, startLoading } = useLoadingState();

      startLoading();

      expect(isLoading.value).toBe(true);
    });

    it('should set loading message', () => {
      const { loadingMessage, startLoading } = useLoadingState();

      startLoading('Loading data...');

      expect(loadingMessage.value).toBe('Loading data...');
    });

    it('should set loading without message', () => {
      const { isLoading, loadingMessage, startLoading } = useLoadingState();

      startLoading();

      expect(isLoading.value).toBe(true);
      expect(loadingMessage.value).toBeUndefined();
    });
  });

  describe('stopLoading', () => {
    it('should set loading to false', () => {
      const { isLoading, startLoading, stopLoading } = useLoadingState();

      startLoading('Loading...');
      stopLoading();

      expect(isLoading.value).toBe(false);
    });

    it('should clear loading message', () => {
      const { loadingMessage, startLoading, stopLoading } = useLoadingState();

      startLoading('Loading...');
      stopLoading();

      expect(loadingMessage.value).toBeUndefined();
    });

    it('should handle multiple start/stop cycles', () => {
      const { isLoading, loadingMessage, startLoading, stopLoading } = useLoadingState();

      startLoading('First load');
      expect(isLoading.value).toBe(true);
      expect(loadingMessage.value).toBe('First load');

      stopLoading();
      expect(isLoading.value).toBe(false);
      expect(loadingMessage.value).toBeUndefined();

      startLoading('Second load');
      expect(isLoading.value).toBe(true);
      expect(loadingMessage.value).toBe('Second load');

      stopLoading();
      expect(isLoading.value).toBe(false);
      expect(loadingMessage.value).toBeUndefined();
    });
  });

  describe('withLoading', () => {
    it('should set loading before async operation', async () => {
      const { isLoading, withLoading } = useLoadingState();

      const asyncFn = vi.fn().mockResolvedValue('result');

      expect(isLoading.value).toBe(false);

      const promise = withLoading(asyncFn);

      expect(isLoading.value).toBe(true);

      await promise;
    });

    it('should clear loading after async operation completes', async () => {
      const { isLoading, withLoading } = useLoadingState();

      const asyncFn = vi.fn().mockResolvedValue('result');

      await withLoading(asyncFn);

      expect(isLoading.value).toBe(false);
    });

    it('should return the result of async operation', async () => {
      const { withLoading } = useLoadingState();

      const asyncFn = vi.fn().mockResolvedValue('result');

      const result = await withLoading(asyncFn);

      expect(result).toBe('result');
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    it('should set loading message during operation', async () => {
      const { loadingMessage, withLoading } = useLoadingState();

      const asyncFn = vi.fn().mockResolvedValue('result');

      const promise = withLoading(asyncFn, 'Loading data...');

      expect(loadingMessage.value).toBe('Loading data...');

      await promise;
    });

    it('should clear loading message after operation', async () => {
      const { loadingMessage, withLoading } = useLoadingState();

      const asyncFn = vi.fn().mockResolvedValue('result');

      await withLoading(asyncFn, 'Loading data...');

      expect(loadingMessage.value).toBeUndefined();
    });

    it('should clear loading even if async operation fails', async () => {
      const { isLoading, withLoading } = useLoadingState();

      const asyncFn = vi.fn().mockRejectedValue(new Error('Failed'));

      await expect(withLoading(asyncFn)).rejects.toThrow('Failed');
      expect(isLoading.value).toBe(false);
    });

    it('should clear loading message even if async operation fails', async () => {
      const { loadingMessage, withLoading } = useLoadingState();

      const asyncFn = vi.fn().mockRejectedValue(new Error('Failed'));

      await expect(withLoading(asyncFn, 'Loading...')).rejects.toThrow('Failed');
      expect(loadingMessage.value).toBeUndefined();
    });

    it('should propagate errors from async operation', async () => {
      const { withLoading } = useLoadingState();

      const error = new Error('Custom error');
      const asyncFn = vi.fn().mockRejectedValue(error);

      await expect(withLoading(asyncFn)).rejects.toThrow('Custom error');
    });

    it('should handle successful async operation with complex return type', async () => {
      const { withLoading } = useLoadingState();

      const complexResult = { id: 1, name: 'Test', nested: { value: 42 } };
      const asyncFn = vi.fn().mockResolvedValue(complexResult);

      const result = await withLoading(asyncFn, 'Loading complex data...');

      expect(result).toEqual(complexResult);
    });

    it('should handle multiple concurrent withLoading calls', async () => {
      const { isLoading, withLoading } = useLoadingState();

      const asyncFn1 = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve('1'), 100)));
      const asyncFn2 = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve('2'), 50)));

      const promise1 = withLoading(asyncFn1, 'Loading 1');
      const promise2 = withLoading(asyncFn2, 'Loading 2');

      expect(isLoading.value).toBe(true);

      const results = await Promise.all([promise1, promise2]);

      expect(results).toEqual(['1', '2']);
    });
  });

  describe('reactivity', () => {
    it('should maintain reactive references', () => {
      const state1 = useLoadingState();
      const state2 = useLoadingState();

      // Each call should create independent state
      state1.startLoading('State 1');
      expect(state1.isLoading.value).toBe(true);
      expect(state1.loadingMessage.value).toBe('State 1');
      expect(state2.isLoading.value).toBe(false);
      expect(state2.loadingMessage.value).toBeUndefined();
    });
  });
});
