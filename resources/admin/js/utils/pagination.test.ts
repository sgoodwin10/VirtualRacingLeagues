import { describe, it, expect } from 'vitest';
import {
  transformPaginatedResponse,
  createEmptyPaginatedResponse,
  type BackendPaginatedResponse,
} from './pagination';
import type { PaginatedResponse } from '@admin/types/api';

describe('pagination utilities', () => {
  describe('transformPaginatedResponse', () => {
    it('should transform backend pagination response to frontend format', () => {
      const backendResponse: BackendPaginatedResponse<{ id: number; name: string }> = {
        success: true,
        data: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        meta: {
          current_page: 2,
          from: 11,
          last_page: 5,
          path: '/api/items',
          per_page: 10,
          to: 20,
          total: 50,
        },
      };

      const result = transformPaginatedResponse(backendResponse);

      expect(result).toEqual({
        current_page: 2,
        data: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        first_page_url: '/api/items?page=1',
        from: 11,
        last_page: 5,
        last_page_url: '/api/items?page=5',
        links: [],
        next_page_url: '/api/items?page=3',
        path: '/api/items',
        per_page: 10,
        prev_page_url: '/api/items?page=1',
        to: 20,
        total: 50,
      });
    });

    it('should set next_page_url to null when on last page', () => {
      const backendResponse: BackendPaginatedResponse<{ id: number }> = {
        success: true,
        data: [{ id: 1 }],
        meta: {
          current_page: 5,
          from: 41,
          last_page: 5,
          path: '/api/items',
          per_page: 10,
          to: 50,
          total: 50,
        },
      };

      const result = transformPaginatedResponse(backendResponse);

      expect(result.next_page_url).toBeNull();
      expect(result.prev_page_url).toBe('/api/items?page=4');
    });

    it('should set prev_page_url to null when on first page', () => {
      const backendResponse: BackendPaginatedResponse<{ id: number }> = {
        success: true,
        data: [{ id: 1 }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 5,
          path: '/api/items',
          per_page: 10,
          to: 10,
          total: 50,
        },
      };

      const result = transformPaginatedResponse(backendResponse);

      expect(result.prev_page_url).toBeNull();
      expect(result.next_page_url).toBe('/api/items?page=2');
    });

    it('should handle single page results', () => {
      const backendResponse: BackendPaginatedResponse<{ id: number }> = {
        success: true,
        data: [{ id: 1 }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          path: '/api/items',
          per_page: 10,
          to: 1,
          total: 1,
        },
      };

      const result = transformPaginatedResponse(backendResponse);

      expect(result.prev_page_url).toBeNull();
      expect(result.next_page_url).toBeNull();
      expect(result.first_page_url).toBe('/api/items?page=1');
      expect(result.last_page_url).toBe('/api/items?page=1');
    });

    it('should return empty paginated response when success is false', () => {
      const backendResponse: BackendPaginatedResponse<{ id: number }> = {
        success: false,
        data: [],
        meta: {
          current_page: 1,
          from: 0,
          last_page: 1,
          path: '/api/items',
          per_page: 10,
          to: 0,
          total: 0,
        },
      };

      const result = transformPaginatedResponse(backendResponse);

      expect(result).toEqual(createEmptyPaginatedResponse());
    });

    it('should return empty paginated response when data is missing', () => {
      const backendResponse = {
        success: true,
        data: undefined,
        meta: {
          current_page: 1,
          from: 0,
          last_page: 1,
          path: '/api/items',
          per_page: 10,
          to: 0,
          total: 0,
        },
      } as unknown as BackendPaginatedResponse<{ id: number }>;

      const result = transformPaginatedResponse(backendResponse);

      expect(result).toEqual(createEmptyPaginatedResponse());
    });

    it('should handle empty data array', () => {
      const backendResponse: BackendPaginatedResponse<{ id: number }> = {
        success: true,
        data: [],
        meta: {
          current_page: 1,
          from: 0,
          last_page: 1,
          path: '/api/items',
          per_page: 10,
          to: 0,
          total: 0,
        },
      };

      const result = transformPaginatedResponse(backendResponse);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('createEmptyPaginatedResponse', () => {
    it('should create an empty paginated response with default values', () => {
      const result = createEmptyPaginatedResponse();

      expect(result).toEqual({
        current_page: 1,
        data: [],
        first_page_url: '',
        from: 0,
        last_page: 1,
        last_page_url: '',
        links: [],
        next_page_url: null,
        path: '',
        per_page: 15,
        prev_page_url: null,
        to: 0,
        total: 0,
      });
    });

    it('should create empty response with correct type', () => {
      interface TestItem {
        id: number;
        name: string;
      }

      const result: PaginatedResponse<TestItem> = createEmptyPaginatedResponse<TestItem>();

      expect(result.data).toEqual([]);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
