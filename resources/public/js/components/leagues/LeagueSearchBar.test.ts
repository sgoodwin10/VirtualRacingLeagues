import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LeagueSearchBar from './LeagueSearchBar.vue';
import type { Platform } from '@public/types/public';

describe('LeagueSearchBar', () => {
  const mockPlatforms: Platform[] = [
    { id: 1, name: 'iRacing', slug: 'iracing' },
    { id: 2, name: 'Gran Turismo 7', slug: 'gt7' },
    { id: 3, name: 'Assetto Corsa', slug: 'ac' },
  ];

  const defaultProps = {
    modelValue: '',
    platform: null as string | number | null,
    sortBy: 'popular' as 'popular' | 'recent' | 'name',
    platforms: mockPlatforms,
  };

  describe('Rendering', () => {
    it('should render search input with correct placeholder', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const input = wrapper.find('input[type="text"]');
      expect(input.exists()).toBe(true);
      expect(input.attributes('placeholder')).toBe('Search leagues by name...');
    });

    it('should render search icon', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const icon = wrapper.find('.search-icon');
      expect(icon.exists()).toBe(true);
      expect(icon.text()).toBe('🔍');
    });

    it('should render platform filter dropdown', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const selects = wrapper.findAll('select');
      expect(selects.length).toBe(2); // Platform + Sort
    });

    it('should render "All Platforms" as first option', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const platformSelect = wrapper.findAll('select')[0];
      const options = platformSelect?.findAll('option');
      expect(options?.[0]?.text()).toBe('All Platforms');
      // The value attribute in the template is :value="null" which renders as an empty string in HTML
      // But Vue binds it to null for the model
      expect(options?.[0]?.element.getAttribute('value')).toBeNull();
    });

    it('should render all platform options', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const platformSelect = wrapper.findAll('select')[0];
      const options = platformSelect?.findAll('option');

      expect(options?.length).toBe(4); // "All Platforms" + 3 platforms
      expect(options?.[1]?.text()).toBe('iRacing');
      expect(options?.[2]?.text()).toBe('Gran Turismo 7');
      expect(options?.[3]?.text()).toBe('Assetto Corsa');
    });

    it('should render sort dropdown with all options', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const sortSelect = wrapper.findAll('select')[1];
      const options = sortSelect?.findAll('option');

      expect(options?.length).toBe(3);
      expect(options?.[0]?.text()).toBe('Most Popular');
      expect(options?.[0]?.element.value).toBe('popular');
      expect(options?.[1]?.text()).toBe('Recently Active');
      expect(options?.[1]?.element.value).toBe('recent');
      expect(options?.[2]?.text()).toBe('Name A-Z');
      expect(options?.[2]?.element.value).toBe('name');
    });
  });

  describe('Search Input', () => {
    it('should display modelValue in search input', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: {
          ...defaultProps,
          modelValue: 'test search',
        },
      });

      const input = wrapper.find('input[type="text"]');
      expect((input.element as HTMLInputElement).value).toBe('test search');
    });

    it('should emit update:modelValue when input changes', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const input = wrapper.find('input[type="text"]');
      await input.setValue('new search');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new search']);
    });

    it('should emit update:modelValue with empty string', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: {
          ...defaultProps,
          modelValue: 'existing search',
        },
      });

      const input = wrapper.find('input[type="text"]');
      await input.setValue('');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
    });
  });

  describe('Platform Filter', () => {
    it('should display platform prop value', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: {
          ...defaultProps,
          platform: 1,
        },
      });

      const platformSelect = wrapper.findAll('select')[0];
      expect(platformSelect?.element.value).toBe('1');
    });

    it('should emit update:platform when platform changes', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const platformSelect = wrapper.findAll('select')[0];
      await platformSelect?.setValue('2');

      expect(wrapper.emitted('update:platform')).toBeTruthy();
      expect(wrapper.emitted('update:platform')?.[0]).toEqual([2]);
    });

    it('should convert "null" string to null when selecting "All Platforms"', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: {
          ...defaultProps,
          platform: 1,
        },
      });

      const platformSelect = wrapper.findAll('select')[0];
      await platformSelect?.setValue('null');

      expect(wrapper.emitted('update:platform')).toBeTruthy();
      expect(wrapper.emitted('update:platform')?.[0]).toEqual([null]);
    });

    it('should convert string to number for platform ID', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const platformSelect = wrapper.findAll('select')[0];
      await platformSelect?.setValue('3');

      expect(wrapper.emitted('update:platform')).toBeTruthy();
      expect(wrapper.emitted('update:platform')?.[0]).toEqual([3]);
    });

    it('should handle empty string as null', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const platformSelect = wrapper.findAll('select')[0];
      await platformSelect?.setValue('');

      expect(wrapper.emitted('update:platform')).toBeTruthy();
      expect(wrapper.emitted('update:platform')?.[0]).toEqual([null]);
    });
  });

  describe('Sort Filter', () => {
    it('should display sortBy prop value', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: {
          ...defaultProps,
          sortBy: 'recent',
        },
      });

      const sortSelect = wrapper.findAll('select')[1];
      expect(sortSelect?.element.value).toBe('recent');
    });

    it('should emit update:sortBy when sort option changes to "recent"', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const sortSelect = wrapper.findAll('select')[1];
      await sortSelect?.setValue('recent');

      expect(wrapper.emitted('update:sortBy')).toBeTruthy();
      expect(wrapper.emitted('update:sortBy')?.[0]).toEqual(['recent']);
    });

    it('should emit update:sortBy when sort option changes to "name"', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const sortSelect = wrapper.findAll('select')[1];
      await sortSelect?.setValue('name');

      expect(wrapper.emitted('update:sortBy')).toBeTruthy();
      expect(wrapper.emitted('update:sortBy')?.[0]).toEqual(['name']);
    });

    it('should emit update:sortBy when sort option changes to "popular"', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: {
          ...defaultProps,
          sortBy: 'recent',
        },
      });

      const sortSelect = wrapper.findAll('select')[1];
      await sortSelect?.setValue('popular');

      expect(wrapper.emitted('update:sortBy')).toBeTruthy();
      expect(wrapper.emitted('update:sortBy')?.[0]).toEqual(['popular']);
    });

    it('should emit correct sort value', async () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const sortSelect = wrapper.findAll('select')[1];
      await sortSelect?.setValue('name');

      const emitted = wrapper.emitted('update:sortBy');
      expect(emitted?.[0]?.[0]).toBe('name');
    });
  });

  describe('Styling and Layout', () => {
    it('should have responsive flex layout', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const searchBar = wrapper.find('.search-bar');
      expect(searchBar.classes()).toContain('flex');
      expect(searchBar.classes()).toContain('flex-col');
      expect(searchBar.classes()).toContain('sm:flex-row');
    });

    it('should apply focus styles to inputs', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const input = wrapper.find('input[type="text"]');
      expect(input.classes()).toContain('focus:border-[var(--cyan)]');
      expect(input.classes()).toContain('focus:ring-2');
      expect(input.classes()).toContain('focus:ring-[var(--cyan-dim)]');
    });

    it('should apply focus styles to selects', () => {
      const wrapper = mount(LeagueSearchBar, {
        props: defaultProps,
      });

      const selects = wrapper.findAll('select');
      selects.forEach((select) => {
        expect(select.classes()).toContain('focus:border-[var(--cyan)]');
        expect(select.classes()).toContain('focus:ring-2');
        expect(select.classes()).toContain('focus:ring-[var(--cyan-dim)]');
      });
    });
  });
});
