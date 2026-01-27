import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Create a dynamic mock that resets between tests
let mockAxiosInstance: AxiosInstance;

vi.mock('axios', () => {
  const actual = vi.importActual('axios');
  return {
    ...actual,
    default: {
      ...actual,
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Setup fresh mock axios instance for each test
    mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      request: vi.fn(),
    } as any;

    // Clear all cookies properly
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('initialization', () => {
    it('should create axios instance with correct config', async () => {
      await import('./api');

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: '/api',
        withCredentials: true,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });

    it('should setup request interceptor', async () => {
      await import('./api');

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should setup response interceptor', async () => {
      await import('./api');

      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('CSRF token handling', () => {
    it('should add CSRF token to POST requests', async () => {
      document.cookie = 'XSRF-TOKEN=test-token-123';
      await import('./api');

      const requestInterceptor = (mockAxiosInstance.interceptors.request.use as any).mock
        .calls[0][0];
      const config = requestInterceptor({
        method: 'post',
        headers: {},
      });

      expect(config.headers['X-CSRF-TOKEN']).toBe('test-token-123');
      expect(config.headers['X-XSRF-TOKEN']).toBe('test-token-123');
    });

    it('should add CSRF token to PUT requests', async () => {
      document.cookie = 'XSRF-TOKEN=test-token';
      await import('./api');

      const requestInterceptor = (mockAxiosInstance.interceptors.request.use as any).mock
        .calls[0][0];
      const config = requestInterceptor({
        method: 'put',
        headers: {},
      });

      expect(config.headers['X-CSRF-TOKEN']).toBe('test-token');
    });

    it('should add CSRF token to PATCH requests', async () => {
      document.cookie = 'XSRF-TOKEN=test-token';
      await import('./api');

      const requestInterceptor = (mockAxiosInstance.interceptors.request.use as any).mock
        .calls[0][0];
      const config = requestInterceptor({
        method: 'patch',
        headers: {},
      });

      expect(config.headers['X-CSRF-TOKEN']).toBe('test-token');
    });

    it('should add CSRF token to DELETE requests', async () => {
      document.cookie = 'XSRF-TOKEN=test-token';
      await import('./api');

      const requestInterceptor = (mockAxiosInstance.interceptors.request.use as any).mock
        .calls[0][0];
      const config = requestInterceptor({
        method: 'delete',
        headers: {},
      });

      expect(config.headers['X-CSRF-TOKEN']).toBe('test-token');
    });

    it('should NOT add CSRF token to GET requests', async () => {
      document.cookie = 'XSRF-TOKEN=test-token';
      await import('./api');

      const requestInterceptor = (mockAxiosInstance.interceptors.request.use as any).mock
        .calls[0][0];
      const config = requestInterceptor({
        method: 'get',
        headers: {},
      });

      expect(config.headers['X-CSRF-TOKEN']).toBeUndefined();
      expect(config.headers['X-XSRF-TOKEN']).toBeUndefined();
    });

    it('should decode URL-encoded CSRF token', async () => {
      const encodedToken = encodeURIComponent('token+with/special=chars');
      document.cookie = `XSRF-TOKEN=${encodedToken}`;
      await import('./api');

      const requestInterceptor = (mockAxiosInstance.interceptors.request.use as any).mock
        .calls[0][0];
      const config = requestInterceptor({
        method: 'post',
        headers: {},
      });

      expect(config.headers['X-CSRF-TOKEN']).toBe('token+with/special=chars');
    });

    it('should handle missing CSRF token gracefully', async () => {
      // Explicitly clear cookies and use new module
      document.cookie = '';
      vi.resetModules();
      await import('./api');

      const requestInterceptor = (mockAxiosInstance.interceptors.request.use as any).mock
        .calls[0][0];
      const config = requestInterceptor({
        method: 'post',
        headers: {},
      });

      expect(config.headers['X-CSRF-TOKEN']).toBeUndefined();
    });

    it('should handle multiple cookies correctly', async () => {
      document.cookie = 'session=abc123';
      document.cookie = 'XSRF-TOKEN=test-token';
      document.cookie = 'other=value';
      await import('./api');

      const requestInterceptor = (mockAxiosInstance.interceptors.request.use as any).mock
        .calls[0][0];
      const config = requestInterceptor({
        method: 'post',
        headers: {},
      });

      expect(config.headers['X-CSRF-TOKEN']).toBe('test-token');
    });

    it('should fetch CSRF token from endpoint', async () => {
      (mockAxiosInstance.get as any).mockResolvedValue({});
      const { apiService } = await import('./api');

      await apiService.fetchCSRFToken();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/csrf-cookie');
    });
  });

  describe('error handling', () => {
    it('should retry request on 419 CSRF mismatch', async () => {
      (mockAxiosInstance.request as any).mockResolvedValue({ data: 'success' });
      (mockAxiosInstance.get as any).mockResolvedValue({});

      await import('./api');

      const responseInterceptor = (mockAxiosInstance.interceptors.response.use as any).mock
        .calls[0][1];

      const error = {
        response: { status: 419 },
        config: {
          method: 'post',
        },
      };

      await responseInterceptor(error);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/csrf-cookie');
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'post',
        _retry: true,
      });
    });

    it('should NOT retry 419 error if already retried', async () => {
      await import('./api');

      const responseInterceptor = (mockAxiosInstance.interceptors.response.use as any).mock
        .calls[0][1];

      const error = {
        response: { status: 419 },
        config: {
          method: 'post',
          _retry: true,
        },
      };

      await expect(responseInterceptor(error)).rejects.toEqual(error);
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
      expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    });

    it('should NOT retry 419 error if config is missing', async () => {
      await import('./api');

      const responseInterceptor = (mockAxiosInstance.interceptors.response.use as any).mock
        .calls[0][1];

      const error = {
        response: { status: 419 },
        config: undefined,
      };

      await expect(responseInterceptor(error)).rejects.toEqual(error);
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('should NOT redirect on 401 error', async () => {
      await import('./api');

      const responseInterceptor = (mockAxiosInstance.interceptors.response.use as any).mock
        .calls[0][1];

      const error = {
        response: { status: 401 },
        config: {},
      };

      await expect(responseInterceptor(error)).rejects.toEqual(error);
    });

    it('should propagate 500 errors', async () => {
      await import('./api');

      const responseInterceptor = (mockAxiosInstance.interceptors.response.use as any).mock
        .calls[0][1];

      const error = {
        response: { status: 500 },
        config: {},
      };

      await expect(responseInterceptor(error)).rejects.toEqual(error);
    });

    it('should propagate 422 validation errors', async () => {
      await import('./api');

      const responseInterceptor = (mockAxiosInstance.interceptors.response.use as any).mock
        .calls[0][1];

      const error = {
        response: { status: 422 },
        config: {},
      };

      await expect(responseInterceptor(error)).rejects.toEqual(error);
    });

    it('should propagate network errors', async () => {
      await import('./api');

      const responseInterceptor = (mockAxiosInstance.interceptors.response.use as any).mock
        .calls[0][1];

      const error = {
        message: 'Network Error',
        config: {},
      };

      await expect(responseInterceptor(error)).rejects.toEqual(error);
    });
  });

  describe('getClient', () => {
    it('should return axios instance', async () => {
      const { apiService } = await import('./api');
      const client = apiService.getClient();

      expect(client).toBe(mockAxiosInstance);
    });

    it('should export apiClient as singleton', async () => {
      const { apiClient, apiService } = await import('./api');

      expect(apiClient).toBe(apiService.getClient());
    });
  });
});
