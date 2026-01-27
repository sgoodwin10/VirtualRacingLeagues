import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildUrl, buildLoginAsUrl } from './url';

describe('url utilities', () => {
  describe('buildUrl', () => {
    beforeEach(() => {
      // Reset window.location for each test
      delete (window as any).location;
    });

    it('should build URL with port in development', () => {
      (window as any).location = {
        protocol: 'http:',
        port: '8000',
      };

      const url = buildUrl('app.virtualracingleagues.localhost', '/login-as?token=abc123');
      expect(url).toBe('http://app.virtualracingleagues.localhost:8000/login-as?token=abc123');
    });

    it('should build URL without port when port is 80 (http)', () => {
      (window as any).location = {
        protocol: 'http:',
        port: '80',
      };

      const url = buildUrl('app.example.com', '/login-as?token=abc123');
      expect(url).toBe('http://app.example.com/login-as?token=abc123');
    });

    it('should build URL without port when port is 443 (https)', () => {
      (window as any).location = {
        protocol: 'https:',
        port: '443',
      };

      const url = buildUrl('app.example.com', '/login-as?token=abc123');
      expect(url).toBe('https://app.example.com/login-as?token=abc123');
    });

    it('should build URL without port when port is empty', () => {
      (window as any).location = {
        protocol: 'https:',
        port: '',
      };

      const url = buildUrl('app.example.com', '/login-as?token=abc123');
      expect(url).toBe('https://app.example.com/login-as?token=abc123');
    });

    it('should build URL with custom port', () => {
      (window as any).location = {
        protocol: 'http:',
        port: '3000',
      };

      const url = buildUrl('app.example.com', '/dashboard');
      expect(url).toBe('http://app.example.com:3000/dashboard');
    });

    it('should normalize path to start with /', () => {
      (window as any).location = {
        protocol: 'http:',
        port: '8000',
      };

      const url = buildUrl('app.example.com', 'login-as?token=abc123');
      expect(url).toBe('http://app.example.com:8000/login-as?token=abc123');
    });

    it('should build URL without port when includePort is false', () => {
      (window as any).location = {
        protocol: 'http:',
        port: '8000',
      };

      const url = buildUrl('app.example.com', '/login-as?token=abc123', false);
      expect(url).toBe('http://app.example.com/login-as?token=abc123');
    });

    it('should handle HTTPS protocol correctly', () => {
      (window as any).location = {
        protocol: 'https:',
        port: '8443',
      };

      const url = buildUrl('app.example.com', '/secure');
      expect(url).toBe('https://app.example.com:8443/secure');
    });
  });

  describe('buildLoginAsUrl', () => {
    beforeEach(() => {
      // Reset window.location and import.meta.env
      delete (window as any).location;
      vi.stubEnv('VITE_APP_DOMAIN', 'app.virtualracingleagues.localhost');
    });

    it('should build login-as URL with token', () => {
      (window as any).location = {
        protocol: 'http:',
        port: '8000',
      };

      const url = buildLoginAsUrl('test-token-123');
      expect(url).toBe(
        'http://app.virtualracingleagues.localhost:8000/login-as?token=test-token-123',
      );
    });

    it('should throw error if VITE_APP_DOMAIN is not configured', () => {
      (window as any).location = {
        protocol: 'http:',
        port: '8000',
      };

      vi.stubEnv('VITE_APP_DOMAIN', '');

      expect(() => buildLoginAsUrl('test-token')).toThrow(
        'VITE_APP_DOMAIN environment variable is not configured',
      );
    });

    it('should build production URL without port', () => {
      (window as any).location = {
        protocol: 'https:',
        port: '443',
      };

      const url = buildLoginAsUrl('prod-token');
      expect(url).toBe('https://app.virtualracingleagues.localhost/login-as?token=prod-token');
    });
  });
});
