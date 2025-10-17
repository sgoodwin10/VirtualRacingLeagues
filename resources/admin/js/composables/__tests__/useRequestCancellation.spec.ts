import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRequestCancellation, useMultipleRequestCancellation } from '../useRequestCancellation';

describe('useRequestCancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSignal', () => {
    it('should return an AbortSignal', () => {
      const { getSignal } = useRequestCancellation();
      const signal = getSignal();
      expect(signal).toBeInstanceOf(AbortSignal);
    });

    it('should return a valid signal', () => {
      const { getSignal } = useRequestCancellation();
      const signal = getSignal();
      expect(signal.aborted).toBe(false);
    });
  });

  describe('cancel', () => {
    it('should abort the signal', () => {
      const { getSignal, cancel } = useRequestCancellation();
      const signal = getSignal();
      expect(signal.aborted).toBe(false);

      cancel();
      expect(signal.aborted).toBe(true);
    });

    it('should create new controller after cancellation', () => {
      const { getSignal, cancel } = useRequestCancellation();
      const firstSignal = getSignal();
      cancel();

      const secondSignal = getSignal();
      expect(secondSignal).not.toBe(firstSignal);
      expect(secondSignal.aborted).toBe(false);
    });

    it('should accept optional reason', () => {
      const { cancel } = useRequestCancellation();
      expect(() => cancel('Test reason')).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should create new controller without aborting', () => {
      const { getSignal, reset } = useRequestCancellation();
      const firstSignal = getSignal();
      reset();

      expect(firstSignal.aborted).toBe(false);
      const secondSignal = getSignal();
      expect(secondSignal).not.toBe(firstSignal);
    });
  });

  describe('isAborted', () => {
    it('should return false initially', () => {
      const { isAborted } = useRequestCancellation();
      expect(isAborted()).toBe(false);
    });

    it('should return false after cancellation (new controller created)', () => {
      const { getSignal, cancel, isAborted } = useRequestCancellation();
      const signal = getSignal();
      expect(signal.aborted).toBe(false);

      cancel();

      // After cancel, a new controller is created, so isAborted returns false
      expect(isAborted()).toBe(false);
      // But the old signal is aborted
      expect(signal.aborted).toBe(true);
    });

    it('should return false after reset', () => {
      const { reset, isAborted } = useRequestCancellation();
      reset();
      expect(isAborted()).toBe(false);
    });
  });
});

describe('useMultipleRequestCancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSignal', () => {
    it('should create a signal for a key', () => {
      const { createSignal } = useMultipleRequestCancellation();
      const signal = createSignal('request1');
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    });

    it('should replace existing signal with same key', () => {
      const { createSignal } = useMultipleRequestCancellation();
      const firstSignal = createSignal('request1');
      const secondSignal = createSignal('request1');

      expect(firstSignal).not.toBe(secondSignal);
      expect(firstSignal.aborted).toBe(true);
      expect(secondSignal.aborted).toBe(false);
    });

    it('should maintain different signals for different keys', () => {
      const { createSignal } = useMultipleRequestCancellation();
      const signal1 = createSignal('request1');
      const signal2 = createSignal('request2');

      expect(signal1).not.toBe(signal2);
      expect(signal1.aborted).toBe(false);
      expect(signal2.aborted).toBe(false);
    });
  });

  describe('cancel', () => {
    it('should cancel specific request by key', () => {
      const { createSignal, cancel } = useMultipleRequestCancellation();
      const signal1 = createSignal('request1');
      const signal2 = createSignal('request2');

      cancel('request1');

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
    });

    it('should accept optional reason', () => {
      const { createSignal, cancel } = useMultipleRequestCancellation();
      createSignal('request1');
      expect(() => cancel('request1', 'Test reason')).not.toThrow();
    });

    it('should not throw for non-existent key', () => {
      const { cancel } = useMultipleRequestCancellation();
      expect(() => cancel('nonexistent')).not.toThrow();
    });
  });

  describe('cancelAll', () => {
    it('should cancel all requests', () => {
      const { createSignal, cancelAll } = useMultipleRequestCancellation();
      const signal1 = createSignal('request1');
      const signal2 = createSignal('request2');
      const signal3 = createSignal('request3');

      cancelAll();

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(true);
      expect(signal3.aborted).toBe(true);
    });

    it('should accept optional reason', () => {
      const { createSignal, cancelAll } = useMultipleRequestCancellation();
      createSignal('request1');
      expect(() => cancelAll('Test reason')).not.toThrow();
    });

    it('should not throw with no requests', () => {
      const { cancelAll } = useMultipleRequestCancellation();
      expect(() => cancelAll()).not.toThrow();
    });
  });

  describe('isAborted', () => {
    it('should return false for active request', () => {
      const { createSignal, isAborted } = useMultipleRequestCancellation();
      createSignal('request1');
      expect(isAborted('request1')).toBe(false);
    });

    it('should return true for cancelled request', () => {
      const { createSignal, cancel, isAborted } = useMultipleRequestCancellation();
      createSignal('request1');
      cancel('request1');
      expect(isAborted('request1')).toBe(true);
    });

    it('should return true for non-existent request', () => {
      const { isAborted } = useMultipleRequestCancellation();
      expect(isAborted('nonexistent')).toBe(true);
    });
  });
});
