import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStoreEvents, storeEventBus } from '../useStoreEvents';

describe('useStoreEvents', () => {
  beforeEach(() => {
    // Clear all events before each test
    storeEventBus.clear();
  });

  it('should emit and receive events', () => {
    const events = useStoreEvents();
    const handler = vi.fn();

    events.on('test:event', handler);
    events.emit('test:event', 'arg1', 'arg2');

    expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support multiple handlers for the same event', () => {
    const events = useStoreEvents();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    events.on('test:event', handler1);
    events.on('test:event', handler2);
    events.emit('test:event', 'data');

    expect(handler1).toHaveBeenCalledWith('data');
    expect(handler2).toHaveBeenCalledWith('data');
  });

  it('should remove event handler with off', () => {
    const events = useStoreEvents();
    const handler = vi.fn();

    events.on('test:event', handler);
    events.off('test:event', handler);
    events.emit('test:event');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle removing non-existent handler gracefully', () => {
    const events = useStoreEvents();
    const handler = vi.fn();

    events.off('test:event', handler); // Remove without adding

    expect(() => events.emit('test:event')).not.toThrow();
  });

  it('should clear all handlers for a specific event', () => {
    const events = useStoreEvents();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    events.on('test:event', handler1);
    events.on('test:event', handler2);
    events.clear('test:event');
    events.emit('test:event');

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should clear all events when no event name provided', () => {
    const events = useStoreEvents();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    events.on('event1', handler1);
    events.on('event2', handler2);
    events.clear();
    events.emit('event1');
    events.emit('event2');

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should return listener count', () => {
    const events = useStoreEvents();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    expect(events.listenerCount('test:event')).toBe(0);

    events.on('test:event', handler1);
    expect(events.listenerCount('test:event')).toBe(1);

    events.on('test:event', handler2);
    expect(events.listenerCount('test:event')).toBe(2);

    events.off('test:event', handler1);
    expect(events.listenerCount('test:event')).toBe(1);
  });

  it('should handle events with no arguments', () => {
    const events = useStoreEvents();
    const handler = vi.fn();

    events.on('test:event', handler);
    events.emit('test:event');

    expect(handler).toHaveBeenCalledWith();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle events with multiple arguments', () => {
    const events = useStoreEvents();
    const handler = vi.fn();

    events.on('test:event', handler);
    events.emit('test:event', 1, 'two', { three: 3 }, [4]);

    expect(handler).toHaveBeenCalledWith(1, 'two', { three: 3 }, [4]);
  });

  it('should not call handlers for different events', () => {
    const events = useStoreEvents();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    events.on('event1', handler1);
    events.on('event2', handler2);
    events.emit('event1', 'data');

    expect(handler1).toHaveBeenCalledWith('data');
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should maintain singleton behavior', () => {
    const events1 = useStoreEvents();
    const events2 = useStoreEvents();
    const handler = vi.fn();

    events1.on('test:event', handler);
    events2.emit('test:event', 'data');

    expect(handler).toHaveBeenCalledWith('data');
  });

  it('should handle complex event payloads', () => {
    const events = useStoreEvents();
    const handler = vi.fn();

    const complexData = {
      id: 123,
      name: 'Test',
      nested: {
        value: 'nested',
      },
      array: [1, 2, 3],
    };

    events.on('test:event', handler);
    events.emit('test:event', complexData);

    expect(handler).toHaveBeenCalledWith(complexData);
  });
});
