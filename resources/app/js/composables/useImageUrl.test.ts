import { describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useImageUrl } from './useImageUrl';

describe('useImageUrl', () => {
  beforeEach(() => {
    // Reset window.location.origin for each test
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://app.virtualracingleagues.localhost',
      },
      writable: true,
    });
  });

  describe('URL normalization', () => {
    it('returns empty string for null/undefined URLs', () => {
      const nullUrl = ref<string | null>(null);
      const { url } = useImageUrl(nullUrl);

      expect(url.value).toBe('');
    });

    it('returns fallback URL for null/undefined when fallback provided', () => {
      const nullUrl = ref<string | null>(null);
      const { url } = useImageUrl(nullUrl, '/images/default.png');

      expect(url.value).toBe('/images/default.png');
    });

    it('returns full URLs unchanged', () => {
      const fullUrl = ref('http://example.com/image.jpg');
      const { url } = useImageUrl(fullUrl);

      expect(url.value).toBe('http://example.com/image.jpg');
    });

    it('returns HTTPS URLs unchanged', () => {
      const fullUrl = ref('https://example.com/image.jpg');
      const { url } = useImageUrl(fullUrl);

      expect(url.value).toBe('https://example.com/image.jpg');
    });

    it('prepends origin to relative /storage/ URLs', () => {
      const relativeUrl = ref('/storage/leagues/logos/image.jpg');
      const { url } = useImageUrl(relativeUrl);

      expect(url.value).toBe(
        'http://app.virtualracingleagues.localhost/storage/leagues/logos/image.jpg',
      );
    });

    it('returns other relative paths unchanged', () => {
      const relativeUrl = ref('/images/logo.png');
      const { url } = useImageUrl(relativeUrl);

      expect(url.value).toBe('/images/logo.png');
    });

    it('works with reactive refs', () => {
      const imageUrl = ref<string | null>('/storage/image1.jpg');
      const { url } = useImageUrl(imageUrl);

      expect(url.value).toBe('http://app.virtualracingleagues.localhost/storage/image1.jpg');

      // Change the URL
      imageUrl.value = '/storage/image2.jpg';
      expect(url.value).toBe('http://app.virtualracingleagues.localhost/storage/image2.jpg');
    });

    it('works with getter functions', () => {
      const imageUrl = '/storage/image1.jpg';
      const { url } = useImageUrl(() => imageUrl);

      expect(url.value).toBe('http://app.virtualracingleagues.localhost/storage/image1.jpg');
    });
  });

  describe('loading and error states', () => {
    it('initializes with loading true and error false', () => {
      const imageUrl = ref('/storage/image.jpg');
      const { isLoading, hasError } = useImageUrl(imageUrl);

      expect(isLoading.value).toBe(true);
      expect(hasError.value).toBe(false);
    });

    it('sets loading false and error false on handleLoad', () => {
      const imageUrl = ref('/storage/image.jpg');
      const { isLoading, hasError, handleLoad } = useImageUrl(imageUrl);

      handleLoad();

      expect(isLoading.value).toBe(false);
      expect(hasError.value).toBe(false);
    });

    it('sets loading false and error true on handleError', () => {
      const imageUrl = ref('/storage/image.jpg');
      const { isLoading, hasError, handleError } = useImageUrl(imageUrl);

      handleError();

      expect(isLoading.value).toBe(false);
      expect(hasError.value).toBe(true);
    });

    it('resets loading and error states with reset()', () => {
      const imageUrl = ref('/storage/image.jpg');
      const { isLoading, hasError, handleError, reset } = useImageUrl(imageUrl);

      handleError();
      expect(isLoading.value).toBe(false);
      expect(hasError.value).toBe(true);

      reset();
      expect(isLoading.value).toBe(true);
      expect(hasError.value).toBe(false);
    });
  });

  describe('displayUrl with fallback', () => {
    it('returns url when no error', () => {
      const imageUrl = ref('/storage/image.jpg');
      const { displayUrl, handleLoad } = useImageUrl(imageUrl, '/images/fallback.png');

      handleLoad();

      expect(displayUrl.value).toBe('http://app.virtualracingleagues.localhost/storage/image.jpg');
    });

    it('returns fallback URL when error occurred', () => {
      const imageUrl = ref('/storage/image.jpg');
      const { displayUrl, handleError } = useImageUrl(imageUrl, '/images/fallback.png');

      handleError();

      expect(displayUrl.value).toBe('/images/fallback.png');
    });

    it('returns url when error occurred but no fallback provided', () => {
      const imageUrl = ref('/storage/image.jpg');
      const { displayUrl, handleError } = useImageUrl(imageUrl);

      handleError();

      expect(displayUrl.value).toBe('http://app.virtualracingleagues.localhost/storage/image.jpg');
    });
  });

  describe('cross-subdomain support', () => {
    it('works on public subdomain', () => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://virtualracingleagues.localhost',
        },
        writable: true,
      });

      const imageUrl = ref('/storage/image.jpg');
      const { url } = useImageUrl(imageUrl);

      expect(url.value).toBe('http://virtualracingleagues.localhost/storage/image.jpg');
    });

    it('works on app subdomain', () => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://app.virtualracingleagues.localhost',
        },
        writable: true,
      });

      const imageUrl = ref('/storage/image.jpg');
      const { url } = useImageUrl(imageUrl);

      expect(url.value).toBe('http://app.virtualracingleagues.localhost/storage/image.jpg');
    });

    it('works on admin subdomain', () => {
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://admin.virtualracingleagues.localhost',
        },
        writable: true,
      });

      const imageUrl = ref('/storage/image.jpg');
      const { url } = useImageUrl(imageUrl);

      expect(url.value).toBe('http://admin.virtualracingleagues.localhost/storage/image.jpg');
    });
  });
});
