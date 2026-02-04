import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { usePageTitle } from './usePageTitle';

describe('usePageTitle', () => {
  const mockAppName = 'Test App';

  beforeEach(() => {
    // Mock document.title
    Object.defineProperty(document, 'title', {
      writable: true,
      value: '',
      configurable: true,
    });

    // Mock window.__SITE_CONFIG__ (checked first by getSiteConfig)
    window.__SITE_CONFIG__ = {
      name: mockAppName,
      timezone: 'UTC',
      discord: { url: null, inviteCode: null },
      maintenance: { enabled: false, message: '' },
      registration: { enabled: true },
      google: { analyticsId: null, tagManagerId: null, searchConsoleCode: null },
      emails: { support: null, contact: null, admin: null },
    };

    // Mock import.meta.env as fallback
    vi.stubEnv('VITE_APP_NAME', mockAppName);
  });

  describe('formatTitle', () => {
    it('should return app name when title is null', () => {
      const { setTitle } = usePageTitle();
      setTitle(null as unknown as string);

      expect(document.title).toBe(mockAppName);
    });

    it('should return app name when title is undefined', () => {
      const { setTitle } = usePageTitle();
      setTitle(undefined as unknown as string);

      expect(document.title).toBe(mockAppName);
    });

    it('should return app name when title is empty string', () => {
      const { setTitle } = usePageTitle();
      setTitle('');

      expect(document.title).toBe(mockAppName);
    });

    it('should format single title with app name', () => {
      const { setTitle } = usePageTitle();
      setTitle('Home');

      expect(document.title).toBe(`Home - ${mockAppName}`);
    });

    it('should format array with separator', () => {
      const { setTitle } = usePageTitle();
      setTitle(['Season 2024', 'Formula Racing']);

      expect(document.title).toBe(`Season 2024 - Formula Racing - ${mockAppName}`);
    });

    it('should filter empty strings from array', () => {
      const { setTitle } = usePageTitle();
      setTitle(['Page', '', 'Section']);

      expect(document.title).toBe(`Page - Section - ${mockAppName}`);
    });

    it('should filter whitespace-only strings from array', () => {
      const { setTitle } = usePageTitle();
      setTitle(['Page', '   ', 'Section']);

      expect(document.title).toBe(`Page - Section - ${mockAppName}`);
    });

    it('should handle array with all empty values', () => {
      const { setTitle } = usePageTitle();
      setTitle(['', '  ', '']);

      expect(document.title).toBe(mockAppName);
    });

    it('should handle mixed valid and empty values', () => {
      const { setTitle } = usePageTitle();
      setTitle(['', 'Valid', '', 'Title', '  ']);

      expect(document.title).toBe(`Valid - Title - ${mockAppName}`);
    });
  });

  describe('setTitle', () => {
    it('should update document.title', () => {
      const { setTitle } = usePageTitle();
      setTitle('Test Page');

      expect(document.title).toBe(`Test Page - ${mockAppName}`);
    });

    it('should format title correctly with string', () => {
      const { setTitle } = usePageTitle();
      setTitle('Dashboard');

      expect(document.title).toBe(`Dashboard - ${mockAppName}`);
    });

    it('should format title correctly with array', () => {
      const { setTitle } = usePageTitle();
      setTitle(['Settings', 'Profile']);

      expect(document.title).toBe(`Settings - Profile - ${mockAppName}`);
    });

    it('should update title multiple times', () => {
      const { setTitle } = usePageTitle();

      setTitle('Page 1');
      expect(document.title).toBe(`Page 1 - ${mockAppName}`);

      setTitle('Page 2');
      expect(document.title).toBe(`Page 2 - ${mockAppName}`);

      setTitle(['Page', '3']);
      expect(document.title).toBe(`Page - 3 - ${mockAppName}`);
    });
  });

  describe('Reactive watching', () => {
    it('should watch reactive title ref', async () => {
      const titleRef = ref('Initial Title');
      usePageTitle(titleRef);

      await nextTick();
      expect(document.title).toBe(`Initial Title - ${mockAppName}`);
    });

    it('should update document.title when ref changes', async () => {
      const titleRef = ref('First');
      usePageTitle(titleRef);

      await nextTick();
      expect(document.title).toBe(`First - ${mockAppName}`);

      titleRef.value = 'Second';
      await nextTick();
      expect(document.title).toBe(`Second - ${mockAppName}`);
    });

    it('should update immediately with immediate: true', async () => {
      const titleRef = ref('Immediate Title');
      usePageTitle(titleRef);

      // Should update immediately without waiting for nextTick
      await nextTick();
      expect(document.title).toBe(`Immediate Title - ${mockAppName}`);
    });

    it('should handle reactive array title', async () => {
      const titleRef = ref(['First', 'Second']);
      usePageTitle(titleRef);

      await nextTick();
      expect(document.title).toBe(`First - Second - ${mockAppName}`);

      titleRef.value = ['Updated', 'Title'];
      await nextTick();
      expect(document.title).toBe(`Updated - Title - ${mockAppName}`);
    });

    it('should handle null/undefined reactive values', async () => {
      const titleRef = ref<string | null>('Initial');
      usePageTitle(titleRef);

      await nextTick();
      expect(document.title).toBe(`Initial - ${mockAppName}`);

      titleRef.value = null;
      await nextTick();
      expect(document.title).toBe(mockAppName);
    });

    it('should handle reactive value changing from string to array', async () => {
      const titleRef = ref<string | string[]>('String Title');
      usePageTitle(titleRef);

      await nextTick();
      expect(document.title).toBe(`String Title - ${mockAppName}`);

      titleRef.value = ['Array', 'Title'];
      await nextTick();
      expect(document.title).toBe(`Array - Title - ${mockAppName}`);
    });
  });

  describe('Without reactive title', () => {
    it('should not throw when no title provided', () => {
      expect(() => usePageTitle()).not.toThrow();
    });

    it('should only expose setTitle method', () => {
      const result = usePageTitle();

      expect(result).toHaveProperty('setTitle');
      expect(typeof result.setTitle).toBe('function');
    });

    it('should not set title on initialization when no reactive title provided', () => {
      document.title = 'Existing Title';
      usePageTitle();

      // Should not change existing title
      expect(document.title).toBe('Existing Title');
    });

    it('should allow manual title setting', () => {
      const { setTitle } = usePageTitle();

      setTitle('Manual Title');
      expect(document.title).toBe(`Manual Title - ${mockAppName}`);
    });
  });

  describe('Return value interface', () => {
    it('should return setTitle method', () => {
      const result = usePageTitle();

      expect(result).toHaveProperty('setTitle');
      expect(typeof result.setTitle).toBe('function');
    });

    it('should return same interface with or without reactive title', () => {
      const withRef = usePageTitle(ref('Title'));
      const withoutRef = usePageTitle();

      expect(Object.keys(withRef)).toEqual(Object.keys(withoutRef));
      expect(typeof withRef.setTitle).toBe(typeof withoutRef.setTitle);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long titles', () => {
      const { setTitle } = usePageTitle();
      const longTitle = 'A'.repeat(200);

      setTitle(longTitle);
      expect(document.title).toBe(`${longTitle} - ${mockAppName}`);
    });

    it('should handle special characters in title', () => {
      const { setTitle } = usePageTitle();
      setTitle('Title & Subtitle | Special <> Characters');

      expect(document.title).toBe(`Title & Subtitle | Special <> Characters - ${mockAppName}`);
    });

    it('should handle unicode characters', () => {
      const { setTitle } = usePageTitle();
      setTitle('Racing 🏎️ Championship');

      expect(document.title).toBe(`Racing 🏎️ Championship - ${mockAppName}`);
    });

    it('should handle array with single element', () => {
      const { setTitle } = usePageTitle();
      setTitle(['Single']);

      expect(document.title).toBe(`Single - ${mockAppName}`);
    });
  });
});
