import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAppSubdomainUrl } from './subdomain';

describe('subdomain utilities', () => {
  // Store original location
  const originalLocation = window.location;

  beforeEach(() => {
    // Delete the existing location object
    delete (window as any).location;
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  describe('getAppSubdomainUrl', () => {
    it('should return app subdomain URL with HTTP protocol', () => {
      // Mock window.location
      (window as any).location = {
        protocol: 'http:',
      };

      const url = getAppSubdomainUrl();

      // Should start with http://
      expect(url).toMatch(/^http:\/\//);
      // Should contain the domain from environment
      expect(url).toContain('app.');
    });

    it('should return app subdomain URL with HTTPS protocol', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();

      // Should start with https://
      expect(url).toMatch(/^https:\/\//);
      // Should contain the domain from environment
      expect(url).toContain('app.');
    });

    it('should use dynamic protocol detection', () => {
      // Test with HTTP
      (window as any).location = {
        protocol: 'http:',
      };

      let url = getAppSubdomainUrl();
      expect(url).toMatch(/^http:\/\//);

      // Test with HTTPS
      (window as any).location = {
        protocol: 'https:',
      };

      url = getAppSubdomainUrl();
      expect(url).toMatch(/^https:\/\//);
    });

    it('should construct full URL correctly', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();

      // URL should be well-formed
      expect(url).toMatch(/^https:\/\//);
      expect(url).not.toContain('undefined');
      expect(url).not.toContain('null');
      expect(url).not.toContain('//undefined');
      expect(url).not.toContain('//null');
    });

    it('should return consistent format', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();

      // Should have protocol://domain format
      expect(url).toMatch(/^https?:\/\/.+/);
      // Should not have trailing slash
      expect(url).not.toMatch(/\/$/);
    });

    it('should handle different protocols', () => {
      // Test HTTP
      (window as any).location = { protocol: 'http:' };
      expect(getAppSubdomainUrl()).toMatch(/^http:\/\//);

      // Test HTTPS
      (window as any).location = { protocol: 'https:' };
      expect(getAppSubdomainUrl()).toMatch(/^https:\/\//);
    });

    it('should use environment variable for domain', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();

      // Should use VITE_APP_DOMAIN from environment
      // The actual value depends on .env but should contain the domain
      expect(url).toBeTruthy();
      expect(url.length).toBeGreaterThan(10);
      expect(url).toMatch(/^https:\/\/.+/);
    });

    it('should not add extra slashes', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();
      expect(url).toBe(url.replace('///', '//'));
      expect(url).not.toContain('///');
    });

    it('should handle missing protocol gracefully', () => {
      (window as any).location = {
        protocol: undefined,
      };

      // Should still work with undefined protocol
      const url = getAppSubdomainUrl();
      expect(url).toBeTruthy();
      expect(url).toContain('app.');
    });

    it('should return a valid URL string', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();

      // Should be a valid URL
      expect(() => new URL(url)).not.toThrow();
    });

    it('should be usable for redirects', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();

      // Should be a valid URL
      const urlObject = new URL(url);
      expect(urlObject.protocol).toMatch(/^https?:$/);
      expect(urlObject.hostname).toBeTruthy();
      expect(urlObject.hostname).toContain('app.');
    });

    it('should be usable for API calls', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const baseUrl = getAppSubdomainUrl();
      const apiUrl = `${baseUrl}/api/user`;

      expect(apiUrl).toMatch(/^https:\/\/.+\/api\/user$/);
      expect(() => new URL(apiUrl)).not.toThrow();
    });

    it('should be usable for navigation', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const baseUrl = getAppSubdomainUrl();
      const dashboardUrl = `${baseUrl}/dashboard`;

      expect(dashboardUrl).toMatch(/^https:\/\/.+\/dashboard$/);
      expect(() => new URL(dashboardUrl)).not.toThrow();
    });

    it('should return URL usable for window.location assignment', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();

      // Should be a valid URL
      expect(() => new URL(url)).not.toThrow();

      const urlObj = new URL(url);
      expect(urlObj.href).toBeTruthy();
      expect(urlObj.protocol).toBe('https:');
    });

    it('should preserve protocol from current page', () => {
      // When on HTTP page, should return HTTP URL
      (window as any).location = { protocol: 'http:' };
      let url = getAppSubdomainUrl();
      expect(url).toMatch(/^http:\/\//);

      // When on HTTPS page, should return HTTPS URL
      (window as any).location = { protocol: 'https:' };
      url = getAppSubdomainUrl();
      expect(url).toMatch(/^https:\/\//);
    });

    it('should include app subdomain prefix', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();

      // URL should contain 'app.' as the subdomain
      expect(url).toContain('app.');
    });

    it('should construct URL in expected format', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();

      // Should match: protocol://app.domain.tld
      expect(url).toMatch(/^https:\/\/app\./);
    });

    it('should not include path or query parameters', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url = getAppSubdomainUrl();
      const urlObj = new URL(url);

      // Should not have path (other than /)
      expect(urlObj.pathname).toBe('/');
      // Should not have query parameters
      expect(urlObj.search).toBe('');
      // Should not have hash
      expect(urlObj.hash).toBe('');
    });

    it('should work consistently across multiple calls', () => {
      (window as any).location = {
        protocol: 'https:',
      };

      const url1 = getAppSubdomainUrl();
      const url2 = getAppSubdomainUrl();
      const url3 = getAppSubdomainUrl();

      // All calls should return the same value
      expect(url1).toBe(url2);
      expect(url2).toBe(url3);
    });
  });
});
