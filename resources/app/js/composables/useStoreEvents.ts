/**
 * useStoreEvents Composable
 * Provides an event bus for store-to-store communication
 * This allows stores to emit events that other stores can listen to without direct dependencies
 */

import type { CompetitionSeason } from '@app/types/competition';

/**
 * Type-safe event map for store events
 * Maps event names to their argument types
 */
export interface StoreEventMap {
  'season:created': [competitionId: number, season: CompetitionSeason];
  'season:updated': [competitionId: number, season: CompetitionSeason];
  'season:deleted': [competitionId: number, seasonId: number];
  'season:archived': [competitionId: number, season: CompetitionSeason];
  'season:unarchived': [competitionId: number, season: CompetitionSeason];
  'season:activated': [competitionId: number, season: CompetitionSeason];
  'season:completed': [competitionId: number, season: CompetitionSeason];
  'season:restored': [competitionId: number, season: CompetitionSeason];
  'season:reactivated': [competitionId: number, season: CompetitionSeason];
}

type EventHandler<T extends unknown[] = unknown[]> = (...args: T) => void;

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
  on<K extends keyof StoreEventMap>(event: K, handler: EventHandler<StoreEventMap[K]>): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const handlers = this.events.get(event)!;

    // Prevent duplicate handler registration
    if (!handlers.includes(handler as EventHandler)) {
      handlers.push(handler as EventHandler);
    }
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param handler - Handler function to remove
   */
  off<K extends keyof StoreEventMap>(event: K, handler: EventHandler<StoreEventMap[K]>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event with typed arguments
   * @param event - Event name
   * @param args - Arguments to pass to event handlers
   */
  emit<K extends keyof StoreEventMap>(event: K, ...args: StoreEventMap[K]): void {
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
  clear(event?: keyof StoreEventMap): void {
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
  listenerCount(event: keyof StoreEventMap): number {
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
