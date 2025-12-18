import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeImageUrl, getSafeImageUrl } from '../urlSanitizer';

describe('urlSanitizer', () => {
  describe('sanitizeImageUrl', () => {
    // Spy on console.warn to test warnings
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    describe('valid URLs', () => {
      it('should allow valid HTTPS URLs', () => {
        const url = 'https://example.com/image.jpg';
        expect(sanitizeImageUrl(url)).toBe(url);
      });

      it('should allow valid HTTP URLs', () => {
        const url = 'http://example.com/image.png';
        expect(sanitizeImageUrl(url)).toBe(url);
      });

      it('should allow data URLs with valid image formats', () => {
        const validDataUrls = [
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wB8=',
          'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
          'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg==',
        ];

        validDataUrls.forEach((url) => {
          expect(sanitizeImageUrl(url)).toBe(url);
        });
      });

      it('should allow URLs with query parameters', () => {
        const url = 'https://example.com/image.jpg?size=large&quality=high';
        expect(sanitizeImageUrl(url)).toBe(url);
      });

      it('should allow URLs with hash fragments', () => {
        const url = 'https://example.com/image.jpg#section';
        expect(sanitizeImageUrl(url)).toBe(url);
      });

      it('should trim whitespace from URLs', () => {
        const url = '  https://example.com/image.jpg  ';
        expect(sanitizeImageUrl(url)).toBe('https://example.com/image.jpg');
      });

      it('should allow relative URLs starting with /', () => {
        const relativeUrls = [
          '/images/logo.png',
          '/assets/header.jpg',
          '/static/images/test.webp',
          '/path/to/image.svg',
        ];

        relativeUrls.forEach((url) => {
          expect(sanitizeImageUrl(url)).toBe(url);
        });
      });
    });

    describe('dangerous protocols', () => {
      it('should block javascript: protocol', () => {
        expect(sanitizeImageUrl('javascript:alert(1)')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Blocked dangerous protocol'),
        );
      });

      it('should block javascript: protocol (case insensitive)', () => {
        const dangerous = ['JavaScript:alert(1)', 'JAVASCRIPT:alert(1)', 'JaVaScRiPt:alert(1)'];

        dangerous.forEach((url) => {
          expect(sanitizeImageUrl(url)).toBeNull();
        });
      });

      it('should block vbscript: protocol', () => {
        expect(sanitizeImageUrl('vbscript:msgbox("XSS")')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Blocked dangerous protocol'),
        );
      });

      it('should block file: protocol', () => {
        expect(sanitizeImageUrl('file:///etc/passwd')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Blocked dangerous protocol'),
        );
      });

      it('should block data:text/html', () => {
        expect(sanitizeImageUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Blocked dangerous protocol'),
        );
      });

      it('should block blob: protocol', () => {
        expect(sanitizeImageUrl('blob:https://example.com/uuid')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Blocked dangerous protocol'),
        );
      });
    });

    describe('invalid data URLs', () => {
      it('should block non-image data URLs', () => {
        expect(sanitizeImageUrl('data:application/json;base64,eyJ0ZXN0IjoidHJ1ZSJ9')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Blocked non-image data URL'),
        );
      });

      it('should block data URLs without base64 encoding', () => {
        expect(sanitizeImageUrl('data:image/png,notbase64')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid data URL format'),
        );
      });

      it('should block data URLs with invalid structure', () => {
        expect(sanitizeImageUrl('data:image/png')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Invalid data URL format'),
        );
      });
    });

    describe('encoded dangerous characters', () => {
      it('should block URLs with encoded < character', () => {
        expect(sanitizeImageUrl('https://example.com/image.jpg?param=%3cscript%3e')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Blocked URL with encoded dangerous characters'),
        );
      });

      it('should block URLs with encoded > character', () => {
        expect(sanitizeImageUrl('https://example.com/image.jpg?param=%3c/script%3e')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Blocked URL with encoded dangerous characters'),
        );
      });

      it('should block URLs with encoded quotes', () => {
        expect(sanitizeImageUrl('https://example.com/image.jpg?param=%22test%22')).toBeNull();
        expect(sanitizeImageUrl('https://example.com/image.jpg?param=%27test%27')).toBeNull();
      });

      it('should block URLs with HTML entities', () => {
        expect(sanitizeImageUrl('https://example.com/image.jpg?param=&#60;script&#62;')).toBeNull();
      });
    });

    describe('invalid URLs', () => {
      it('should return null for empty string', () => {
        expect(sanitizeImageUrl('')).toBeNull();
      });

      it('should return null for whitespace-only string', () => {
        expect(sanitizeImageUrl('   ')).toBeNull();
      });

      it('should return null for null', () => {
        expect(sanitizeImageUrl(null)).toBeNull();
      });

      it('should return null for undefined', () => {
        expect(sanitizeImageUrl(undefined)).toBeNull();
      });

      it('should return null for malformed URLs', () => {
        const malformed = [
          'not a url',
          'htp://example.com',
          '://example.com',
          'example.com/image.jpg', // Missing protocol
        ];

        malformed.forEach((url) => {
          expect(sanitizeImageUrl(url)).toBeNull();
          expect(consoleWarnSpy).toHaveBeenCalled();
        });
      });

      it('should block disallowed protocols', () => {
        expect(sanitizeImageUrl('ftp://example.com/image.jpg')).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Blocked disallowed protocol'),
        );
      });
    });

    describe('edge cases', () => {
      it('should handle non-string input gracefully', () => {
        // @ts-expect-error Testing runtime behavior
        expect(sanitizeImageUrl(123)).toBeNull();
        // @ts-expect-error Testing runtime behavior
        expect(sanitizeImageUrl({})).toBeNull();
        // @ts-expect-error Testing runtime behavior
        expect(sanitizeImageUrl([])).toBeNull();
      });

      it('should handle very long URLs', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(10000) + '.jpg';
        expect(sanitizeImageUrl(longUrl)).toBe(longUrl);
      });
    });
  });

  describe('getSafeImageUrl', () => {
    it('should return sanitized URL when valid', () => {
      const url = 'https://example.com/image.jpg';
      expect(getSafeImageUrl(url)).toBe(url);
    });

    it('should return fallback when URL is invalid', () => {
      const fallback = 'https://example.com/default.jpg';
      expect(getSafeImageUrl('javascript:alert(1)', fallback)).toBe(fallback);
    });

    it('should return null when both URL and fallback are invalid', () => {
      expect(getSafeImageUrl('javascript:alert(1)', 'javascript:alert(2)')).toBeNull();
    });

    it('should return null when URL is invalid and no fallback provided', () => {
      expect(getSafeImageUrl('javascript:alert(1)')).toBeNull();
    });

    it('should handle null/undefined URL with fallback', () => {
      const fallback = 'https://example.com/default.jpg';
      expect(getSafeImageUrl(null, fallback)).toBe(fallback);
      expect(getSafeImageUrl(undefined, fallback)).toBe(fallback);
    });

    it('should return null when URL is null/undefined and no fallback', () => {
      expect(getSafeImageUrl(null)).toBeNull();
      expect(getSafeImageUrl(undefined)).toBeNull();
    });
  });
});
