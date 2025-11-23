/**
 * Tests for useCrudStore Composable
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCrudStore } from '../useCrudStore';

interface TestEntity {
  id: number;
  name: string;
}

describe('useCrudStore', () => {
  let crud: ReturnType<typeof useCrudStore<TestEntity>>;

  beforeEach(() => {
    crud = useCrudStore<TestEntity>();
  });

  describe('Initial State', () => {
    it('should initialize with empty items array', () => {
      expect(crud.items.value).toEqual([]);
    });

    it('should initialize with null currentItem', () => {
      expect(crud.currentItem.value).toBeNull();
    });

    it('should initialize with loading false', () => {
      expect(crud.loading.value).toBe(false);
    });

    it('should initialize with null error', () => {
      expect(crud.error.value).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      crud.setLoading(true);
      expect(crud.loading.value).toBe(true);
    });

    it('should set loading to false', () => {
      crud.setLoading(true);
      crud.setLoading(false);
      expect(crud.loading.value).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      crud.setError('Test error');
      expect(crud.error.value).toBe('Test error');
    });

    it('should set error to null', () => {
      crud.setError('Test error');
      crud.setError(null);
      expect(crud.error.value).toBeNull();
    });
  });

  describe('setItems', () => {
    it('should set items array', () => {
      const items: TestEntity[] = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      crud.setItems(items);
      expect(crud.items.value).toEqual(items);
    });

    it('should replace existing items', () => {
      crud.setItems([{ id: 1, name: 'Item 1' }]);
      crud.setItems([{ id: 2, name: 'Item 2' }]);
      expect(crud.items.value).toEqual([{ id: 2, name: 'Item 2' }]);
    });

    it('should set empty array', () => {
      crud.setItems([{ id: 1, name: 'Item 1' }]);
      crud.setItems([]);
      expect(crud.items.value).toEqual([]);
    });
  });

  describe('setCurrentItem', () => {
    it('should set current item', () => {
      const item: TestEntity = { id: 1, name: 'Item 1' };
      crud.setCurrentItem(item);
      expect(crud.currentItem.value).toEqual(item);
    });

    it('should set current item to null', () => {
      crud.setCurrentItem({ id: 1, name: 'Item 1' });
      crud.setCurrentItem(null);
      expect(crud.currentItem.value).toBeNull();
    });
  });

  describe('addItem', () => {
    it('should add item to empty list', () => {
      const item: TestEntity = { id: 1, name: 'Item 1' };
      crud.addItem(item);
      expect(crud.items.value).toEqual([item]);
    });

    it('should add item to existing list', () => {
      crud.setItems([{ id: 1, name: 'Item 1' }]);
      const newItem: TestEntity = { id: 2, name: 'Item 2' };
      crud.addItem(newItem);
      expect(crud.items.value).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]);
    });

    it('should maintain item order', () => {
      crud.addItem({ id: 1, name: 'Item 1' });
      crud.addItem({ id: 2, name: 'Item 2' });
      crud.addItem({ id: 3, name: 'Item 3' });
      expect(crud.items.value.map((i) => i.id)).toEqual([1, 2, 3]);
    });
  });

  describe('updateItemInList', () => {
    beforeEach(() => {
      crud.setItems([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]);
    });

    it('should update existing item in list', () => {
      const updatedItem: TestEntity = { id: 2, name: 'Updated Item 2' };
      crud.updateItemInList(updatedItem);
      expect(crud.items.value[1]).toEqual(updatedItem);
    });

    it('should not affect other items', () => {
      crud.updateItemInList({ id: 2, name: 'Updated Item 2' });
      expect(crud.items.value[0]).toEqual({ id: 1, name: 'Item 1' });
      expect(crud.items.value[2]).toEqual({ id: 3, name: 'Item 3' });
    });

    it('should update currentItem if it matches', () => {
      crud.setCurrentItem({ id: 2, name: 'Item 2' });
      const updatedItem: TestEntity = { id: 2, name: 'Updated Item 2' };
      crud.updateItemInList(updatedItem);
      expect(crud.currentItem.value).toEqual(updatedItem);
    });

    it('should not update currentItem if it does not match', () => {
      crud.setCurrentItem({ id: 1, name: 'Item 1' });
      crud.updateItemInList({ id: 2, name: 'Updated Item 2' });
      expect(crud.currentItem.value).toEqual({ id: 1, name: 'Item 1' });
    });

    it('should handle non-existent item gracefully', () => {
      const itemsBefore = [...crud.items.value];
      crud.updateItemInList({ id: 999, name: 'Non-existent' });
      expect(crud.items.value).toEqual(itemsBefore);
    });
  });

  describe('removeItemFromList', () => {
    beforeEach(() => {
      crud.setItems([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]);
    });

    it('should remove item from list', () => {
      crud.removeItemFromList(2);
      expect(crud.items.value).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 3, name: 'Item 3' },
      ]);
    });

    it('should clear currentItem if it matches removed item', () => {
      crud.setCurrentItem({ id: 2, name: 'Item 2' });
      crud.removeItemFromList(2);
      expect(crud.currentItem.value).toBeNull();
    });

    it('should not clear currentItem if it does not match', () => {
      crud.setCurrentItem({ id: 1, name: 'Item 1' });
      crud.removeItemFromList(2);
      expect(crud.currentItem.value).toEqual({ id: 1, name: 'Item 1' });
    });

    it('should handle removing first item', () => {
      crud.removeItemFromList(1);
      expect(crud.items.value).toEqual([
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]);
    });

    it('should handle removing last item', () => {
      crud.removeItemFromList(3);
      expect(crud.items.value).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]);
    });

    it('should handle non-existent item gracefully', () => {
      const itemsBefore = [...crud.items.value];
      crud.removeItemFromList(999);
      expect(crud.items.value).toEqual(itemsBefore);
    });

    it('should handle removing from empty list', () => {
      crud.setItems([]);
      crud.removeItemFromList(1);
      expect(crud.items.value).toEqual([]);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      crud.setError('Test error');
      crud.clearError();
      expect(crud.error.value).toBeNull();
    });

    it('should be idempotent when error is already null', () => {
      crud.clearError();
      expect(crud.error.value).toBeNull();
    });
  });

  describe('resetStore', () => {
    beforeEach(() => {
      crud.setItems([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]);
      crud.setCurrentItem({ id: 1, name: 'Item 1' });
      crud.setLoading(true);
      crud.setError('Test error');
    });

    it('should reset items to empty array', () => {
      crud.resetStore();
      expect(crud.items.value).toEqual([]);
    });

    it('should reset currentItem to null', () => {
      crud.resetStore();
      expect(crud.currentItem.value).toBeNull();
    });

    it('should reset loading to false', () => {
      crud.resetStore();
      expect(crud.loading.value).toBe(false);
    });

    it('should reset error to null', () => {
      crud.resetStore();
      expect(crud.error.value).toBeNull();
    });
  });

  describe('Readonly Properties', () => {
    it('should expose loading as readonly', () => {
      expect(crud.loading).toBeDefined();
      // TypeScript enforces readonly, but we can verify it exists
    });

    it('should expose error as readonly', () => {
      expect(crud.error).toBeDefined();
      // TypeScript enforces readonly, but we can verify it exists
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle add, update, and remove sequence', () => {
      // Add items
      crud.addItem({ id: 1, name: 'Item 1' });
      crud.addItem({ id: 2, name: 'Item 2' });
      expect(crud.items.value).toHaveLength(2);

      // Update item
      crud.updateItemInList({ id: 1, name: 'Updated Item 1' });
      expect(crud.items.value[0].name).toBe('Updated Item 1');

      // Remove item
      crud.removeItemFromList(1);
      expect(crud.items.value).toEqual([{ id: 2, name: 'Item 2' }]);
    });

    it('should handle multiple updates to same item', () => {
      crud.addItem({ id: 1, name: 'Item 1' });
      crud.updateItemInList({ id: 1, name: 'Update 1' });
      crud.updateItemInList({ id: 1, name: 'Update 2' });
      crud.updateItemInList({ id: 1, name: 'Update 3' });
      expect(crud.items.value[0].name).toBe('Update 3');
    });

    it('should maintain consistency during error scenarios', () => {
      crud.setItems([{ id: 1, name: 'Item 1' }]);
      crud.setError('API Error');

      // Items should still be accessible even with error
      expect(crud.items.value).toEqual([{ id: 1, name: 'Item 1' }]);
      expect(crud.error.value).toBe('API Error');

      // Can clear error independently
      crud.clearError();
      expect(crud.items.value).toEqual([{ id: 1, name: 'Item 1' }]);
      expect(crud.error.value).toBeNull();
    });

    it('should maintain consistency during loading scenarios', () => {
      crud.setLoading(true);
      crud.setItems([{ id: 1, name: 'Item 1' }]);

      // Items should be set even while loading
      expect(crud.loading.value).toBe(true);
      expect(crud.items.value).toEqual([{ id: 1, name: 'Item 1' }]);

      crud.setLoading(false);
      expect(crud.items.value).toEqual([{ id: 1, name: 'Item 1' }]);
    });
  });
});
