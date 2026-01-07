import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { usePageTitle } from '../usePageTitle';

describe('usePageTitle', () => {
  const originalTitle = document.title;
  // Note: We use the actual VITE_APP_NAME from the environment for testing
  const mockAppName = import.meta.env.VITE_APP_NAME || 'Your App';

  beforeEach(() => {
    document.title = 'Original Title';
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  describe('basic functionality', () => {
    it('should allow manual title setting when no reactive title is provided', () => {
      const { setTitle } = usePageTitle();
      // Initially, title is not changed
      expect(document.title).toBe('Original Title');

      // But we can manually set it
      setTitle('Manual Title');
      expect(document.title).toBe(`Manual Title - ${mockAppName}`);
    });

    it('should set title with single string', async () => {
      const title = ref('League Name');
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`League Name - ${mockAppName}`);
    });

    it('should set title with array of strings', async () => {
      const title = ref(['Season 2024', 'Formula Racing League']);
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`Season 2024 - Formula Racing League - ${mockAppName}`);
    });

    it('should update title when reactive value changes', async () => {
      const title = ref('Initial League');
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`Initial League - ${mockAppName}`);

      title.value = 'Updated League';
      await nextTick();
      expect(document.title).toBe(`Updated League - ${mockAppName}`);
    });

    it('should update title when reactive array changes', async () => {
      const title = ref(['Season 2024', 'Initial League']);
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`Season 2024 - Initial League - ${mockAppName}`);

      title.value = ['Season 2025', 'Updated League'];
      await nextTick();
      expect(document.title).toBe(`Season 2025 - Updated League - ${mockAppName}`);
    });
  });

  describe('edge cases', () => {
    it('should handle null title', async () => {
      const title = ref<string | null>(null);
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(mockAppName);
    });

    it('should handle undefined title', async () => {
      const title = ref<string | undefined>(undefined);
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(mockAppName);
    });

    it('should handle empty string', async () => {
      const title = ref('');
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(mockAppName);
    });

    it('should handle empty array', async () => {
      const title = ref<string[]>([]);
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(mockAppName);
    });

    it('should filter out empty strings from array', async () => {
      const title = ref(['', 'League Name', '']);
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`League Name - ${mockAppName}`);
    });

    it('should handle array with only whitespace strings', async () => {
      const title = ref(['   ', '\t', '\n']);
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(mockAppName);
    });

    it('should handle transition from null to valid title', async () => {
      const title = ref<string | null>(null);
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(mockAppName);

      title.value = 'League Name';
      await nextTick();
      expect(document.title).toBe(`League Name - ${mockAppName}`);
    });

    it('should handle transition from valid title to null', async () => {
      const title = ref<string | null>('League Name');
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`League Name - ${mockAppName}`);

      title.value = null;
      await nextTick();
      expect(document.title).toBe(mockAppName);
    });
  });

  describe('setTitle method', () => {
    it('should manually set title with string', () => {
      const { setTitle } = usePageTitle();
      setTitle('Manual League');
      expect(document.title).toBe(`Manual League - ${mockAppName}`);
    });

    it('should manually set title with array', () => {
      const { setTitle } = usePageTitle();
      setTitle(['Season 2024', 'Manual League']);
      expect(document.title).toBe(`Season 2024 - Manual League - ${mockAppName}`);
    });

    it('should override reactive title when called manually', async () => {
      const title = ref('Reactive League');
      const { setTitle } = usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`Reactive League - ${mockAppName}`);

      setTitle('Manual Override');
      expect(document.title).toBe(`Manual Override - ${mockAppName}`);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle league detail page scenario', async () => {
      const league = ref<{ name: string } | null>(null);
      const pageTitle = ref<string | null>(null);

      // Watch league and update pageTitle (simulating computed)
      const updatePageTitle = () => {
        pageTitle.value = league.value?.name || null;
      };

      usePageTitle(pageTitle);
      updatePageTitle();

      // Initially no league loaded
      await nextTick();
      expect(document.title).toBe(mockAppName);

      // League data loaded
      league.value = { name: 'Formula Racing League' };
      updatePageTitle();
      await nextTick();
      expect(document.title).toBe(`Formula Racing League - ${mockAppName}`);

      // Navigate to different league
      league.value = { name: 'GT Championship' };
      updatePageTitle();
      await nextTick();
      expect(document.title).toBe(`GT Championship - ${mockAppName}`);
    });

    it('should handle season detail page scenario', async () => {
      const season = ref<{ name: string } | null>(null);
      const league = ref<{ name: string } | null>(null);
      const pageTitle = ref<string[] | null>(null);

      // Watch season and league and update pageTitle (simulating computed)
      const updatePageTitle = () => {
        const parts: string[] = [];
        if (season.value?.name) parts.push(season.value.name);
        if (league.value?.name) parts.push(league.value.name);
        pageTitle.value = parts.length > 0 ? parts : null;
      };

      usePageTitle(pageTitle);
      updatePageTitle();

      // Initially no data loaded
      await nextTick();
      expect(document.title).toBe(mockAppName);

      // League loaded first
      league.value = { name: 'Formula Racing League' };
      updatePageTitle();
      await nextTick();
      expect(document.title).toBe(`Formula Racing League - ${mockAppName}`);

      // Season loaded
      season.value = { name: 'Season 2024' };
      updatePageTitle();
      await nextTick();
      expect(document.title).toBe(`Season 2024 - Formula Racing League - ${mockAppName}`);

      // Navigate to different season
      season.value = { name: 'Season 2025' };
      updatePageTitle();
      await nextTick();
      expect(document.title).toBe(`Season 2025 - Formula Racing League - ${mockAppName}`);
    });
  });

  describe('app name usage', () => {
    it('should use app name from environment', async () => {
      const title = ref('Formula Racing');
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`Formula Racing - ${mockAppName}`);
    });
  });

  describe('special characters', () => {
    it('should handle titles with special characters', async () => {
      const title = ref('League & Championship 2024 - Round #5');
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`League & Championship 2024 - Round #5 - ${mockAppName}`);
    });

    it('should handle titles with unicode characters', async () => {
      const title = ref('Racing League 🏎️');
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`Racing League 🏎️ - ${mockAppName}`);
    });

    it('should handle titles with multiple hyphens', async () => {
      const title = ref(['Pre-Season', 'Open-Wheel', 'Formula-E']);
      usePageTitle(title);

      await nextTick();
      expect(document.title).toBe(`Pre-Season - Open-Wheel - Formula-E - ${mockAppName}`);
    });
  });
});
