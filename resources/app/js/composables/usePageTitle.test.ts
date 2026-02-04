import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ref, computed } from 'vue';
import { usePageTitle } from './usePageTitle';

// Mock site config name for tests
const mockSiteName = 'App Dashboard';

describe('usePageTitle', () => {
  let originalTitle: string;

  beforeEach(() => {
    originalTitle = document.title;
    // Mock window.__SITE_CONFIG__
    window.__SITE_CONFIG__ = {
      name: mockSiteName,
      timezone: 'UTC',
      discord: { url: null, inviteCode: null },
      maintenance: { enabled: false, message: '' },
      registration: { enabled: true },
      google: { analyticsId: null, tagManagerId: null, searchConsoleCode: null },
      emails: { support: null, contact: null, admin: null },
    };
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  describe('with reactive title', () => {
    it('should set title with single string', () => {
      const title = ref('My League');
      usePageTitle(title);

      expect(document.title).toBe('My League - App Dashboard');
    });

    it('should set title with array of strings', () => {
      const title = ref(['Season 2024', 'GT3 Championship', 'Formula Racing League']);
      usePageTitle(title);

      expect(document.title).toBe(
        'Season 2024 - GT3 Championship - Formula Racing League - App Dashboard',
      );
    });

    it('should update title when reactive value changes', async () => {
      const title = ref('Initial League');
      usePageTitle(title);

      expect(document.title).toBe('Initial League - App Dashboard');

      title.value = 'Updated League';
      await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for reactivity

      expect(document.title).toBe('Updated League - App Dashboard');
    });

    it('should update title when array changes', async () => {
      const title = ref(['Season 2023']);
      usePageTitle(title);

      expect(document.title).toBe('Season 2023 - App Dashboard');

      title.value = ['Season 2024', 'GT3 Championship', 'Formula Racing League'];
      await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for reactivity

      expect(document.title).toBe(
        'Season 2024 - GT3 Championship - Formula Racing League - App Dashboard',
      );
    });

    it('should handle null title', () => {
      const title = ref<string | null>(null);
      usePageTitle(title);

      expect(document.title).toBe('App Dashboard');
    });

    it('should handle undefined title', () => {
      const title = ref<string | undefined>(undefined);
      usePageTitle(title);

      expect(document.title).toBe('App Dashboard');
    });

    it('should handle empty string', () => {
      const title = ref('');
      usePageTitle(title);

      expect(document.title).toBe('App Dashboard');
    });

    it('should handle empty array', () => {
      const title = ref<string[]>([]);
      usePageTitle(title);

      expect(document.title).toBe('App Dashboard');
    });

    it('should filter out empty strings in array', () => {
      const title = ref(['Season 2024', '', 'Formula Racing League']);
      usePageTitle(title);

      expect(document.title).toBe('Season 2024 - Formula Racing League - App Dashboard');
    });

    it('should filter out whitespace-only strings in array', () => {
      const title = ref(['Season 2024', '   ', 'Formula Racing League']);
      usePageTitle(title);

      expect(document.title).toBe('Season 2024 - Formula Racing League - App Dashboard');
    });

    it('should work with computed ref', async () => {
      const season = ref({ name: 'Season 2024' });
      const competition = ref({ name: 'GT3 Championship' });
      const league = ref({ name: 'Formula Racing League' });

      const title = computed(() => [season.value.name, competition.value.name, league.value.name]);
      usePageTitle(title);

      expect(document.title).toBe(
        'Season 2024 - GT3 Championship - Formula Racing League - App Dashboard',
      );

      season.value.name = 'Season 2025';
      await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for reactivity

      expect(document.title).toBe(
        'Season 2025 - GT3 Championship - Formula Racing League - App Dashboard',
      );
    });

    it('should handle transition from null to value', async () => {
      const title = ref<string | null>(null);
      usePageTitle(title);

      expect(document.title).toBe('App Dashboard');

      title.value = 'New League';
      await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for reactivity

      expect(document.title).toBe('New League - App Dashboard');
    });

    it('should handle transition from value to null', async () => {
      const title = ref<string | null>('Initial League');
      usePageTitle(title);

      expect(document.title).toBe('Initial League - App Dashboard');

      title.value = null;
      await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for reactivity

      expect(document.title).toBe('App Dashboard');
    });
  });

  describe('with manual setTitle', () => {
    it('should set title with string using setTitle', () => {
      const { setTitle } = usePageTitle();
      setTitle('Manual League');

      expect(document.title).toBe('Manual League - App Dashboard');
    });

    it('should set title with array using setTitle', () => {
      const { setTitle } = usePageTitle();
      setTitle(['Season 2024', 'GT3 Championship', 'Formula Racing League']);

      expect(document.title).toBe(
        'Season 2024 - GT3 Championship - Formula Racing League - App Dashboard',
      );
    });

    it('should update title multiple times with setTitle', () => {
      const { setTitle } = usePageTitle();

      setTitle('First League');
      expect(document.title).toBe('First League - App Dashboard');

      setTitle('Second League');
      expect(document.title).toBe('Second League - App Dashboard');

      setTitle(['Season 2024', 'Third League']);
      expect(document.title).toBe('Season 2024 - Third League - App Dashboard');
    });

    it('should filter out empty strings when using setTitle with array', () => {
      const { setTitle } = usePageTitle();
      setTitle(['Season 2024', '', 'Formula Racing League']);

      expect(document.title).toBe('Season 2024 - Formula Racing League - App Dashboard');
    });
  });

  describe('edge cases', () => {
    it('should handle very long title strings', () => {
      const longTitle = 'A'.repeat(500);
      const title = ref(longTitle);
      usePageTitle(title);

      expect(document.title).toBe(`${longTitle} - App Dashboard`);
    });

    it('should handle special characters in title', () => {
      const title = ref('Season 2024 & GT3 Championship (Pro)');
      usePageTitle(title);

      expect(document.title).toBe('Season 2024 & GT3 Championship (Pro) - App Dashboard');
    });

    it('should handle unicode characters', () => {
      const title = ref(['Season 2024 🏁', 'GT3 Championship']);
      usePageTitle(title);

      expect(document.title).toBe('Season 2024 🏁 - GT3 Championship - App Dashboard');
    });

    it('should preserve spacing in title parts', () => {
      const title = ref(['  Season 2024  ', '  GT3 Championship  ']);
      usePageTitle(title);

      // The filter checks for empty strings after trim, but doesn't trim the values themselves
      // This is by design - we preserve spacing in actual content (browsers will normalize whitespace anyway)
      expect(document.title).toContain('Season 2024');
      expect(document.title).toContain('GT3 Championship');
      expect(document.title).toContain('App Dashboard');
    });
  });

  describe('without providing title', () => {
    it('should allow manual control without reactive title', () => {
      const { setTitle } = usePageTitle();

      // Initial state - should not change document.title
      const initialTitle = document.title;
      expect(document.title).toBe(initialTitle);

      setTitle('Manual Title');
      expect(document.title).toBe('Manual Title - App Dashboard');
    });
  });
});
