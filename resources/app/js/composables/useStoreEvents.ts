/**
 * useStoreEvents Composable
 * Provides an event bus for store-to-store communication
 * This allows stores to emit events that other stores can listen to without direct dependencies
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (...args: any[]) => void;

/**
 * Store Event Bus
 * Singleton event bus for communication between stores
 */
class StoreEventBus {
  private events: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event
   * @param event - Event name
   * @param handler - Handler function to be called when event is emitted
   * Note: Duplicate handler prevention - the same handler will not be registered twice
   */
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const handlers = this.events.get(event)!;

    // Prevent duplicate handler registration
    if (!handlers.includes(handler)) {
      handlers.push(handler);
    }
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param handler - Handler function to remove
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event with optional arguments
   * @param event - Event name
   * @param args - Arguments to pass to event handlers
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      // Iterate over a copy to prevent issues if handlers are modified during emit
      [...handlers].forEach((handler) => handler(...args));
    }
  }

  /**
   * Clear all event handlers for a specific event or all events
   * @param event - Optional event name to clear (clears all if not provided)
   */
  clear(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Remove all listeners from all events
   * This is an alias for clear() with no arguments for compatibility
   */
  removeAllListeners(): void {
    this.events.clear();
  }

  /**
   * Get the number of handlers for a specific event
   * @param event - Event name
   * @returns Number of handlers
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }
}

/**
 * Singleton instance of the store event bus
 */
export const storeEventBus = new StoreEventBus();

/**
 * Composable to access the store event bus
 * @returns Store event bus instance
 *
 * @example
 * // In one store (emitting events)
 * const events = useStoreEvents();
 * events.emit('season:created', seasonId, seasonData);
 *
 * // In another store (listening to events)
 * const events = useStoreEvents();
 * events.on('season:created', (seasonId, seasonData) => {
 *   // Handle the event
 * });
 */
export function useStoreEvents() {
  return storeEventBus;
}
