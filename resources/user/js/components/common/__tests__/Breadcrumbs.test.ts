/**
 * Breadcrumbs Component Tests
 *
 * Tests the Breadcrumbs component functionality including:
 * - Rendering single and multiple breadcrumbs
 * - Router navigation
 * - Icon rendering
 * - Separator rendering
 * - Accessibility
 * - Non-clickable last item behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountWithStubs, createTestRouter } from '@user/__tests__/setup/testUtils';
import Breadcrumbs from '../Breadcrumbs.vue';
import type { BreadcrumbItem } from '../Breadcrumbs.vue';
import type { VueWrapper } from '@vue/test-utils';

describe('Breadcrumbs', () => {
  let wrapper: VueWrapper<any>;
  const mockRouter = createTestRouter([
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/leagues', name: 'leagues', component: { template: '<div>Leagues</div>' } },
    {
      path: '/leagues/:id',
      name: 'league-detail',
      component: { template: '<div>League Detail</div>' },
    },
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Single Breadcrumb', () => {
    it('renders a single breadcrumb item without a link', () => {
      const items: BreadcrumbItem[] = [{ label: 'Current Page' }];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      expect(wrapper.find('nav').exists()).toBe(true);
      expect(wrapper.find('ol').exists()).toBe(true);
      expect(wrapper.findAll('li')).toHaveLength(1);
      expect(wrapper.text()).toContain('Current Page');

      // Should not have a router-link since it's the last (and only) item
      expect(wrapper.find('a').exists()).toBe(false);
    });

    it('renders a single breadcrumb with icon', () => {
      const items: BreadcrumbItem[] = [{ label: 'Back', icon: 'pi-arrow-left' }];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const icon = wrapper.find('i.pi-arrow-left');
      expect(icon.exists()).toBe(true);
      expect(icon.attributes('aria-hidden')).toBe('true');
    });

    it('renders a single breadcrumb with router link (should still be clickable)', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Back to Home', to: { name: 'home' }, icon: 'pi-arrow-left' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      // Even with a single item, if it has a 'to' prop and it's not the last item,
      // it should be clickable. However, since it IS the last item (index 0 === length-1),
      // it should NOT be clickable
      expect(wrapper.find('a').exists()).toBe(false);
      expect(wrapper.find('span.font-semibold').text()).toBe('Back to Home');
    });
  });

  describe('Multiple Breadcrumbs', () => {
    it('renders multiple breadcrumb items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Leagues', to: { name: 'leagues' } },
        { label: 'My League' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const listItems = wrapper.findAll('li');
      expect(listItems).toHaveLength(3);

      // First two items should be links
      const links = wrapper.findAll('a');
      expect(links).toHaveLength(2);
      expect(links[0]?.text()).toContain('Home');
      expect(links[1]?.text()).toContain('Leagues');

      // Last item should not be a link
      const lastItem = listItems[2];
      expect(lastItem).toBeDefined();
      expect(lastItem!.find('a').exists()).toBe(false);
      expect(lastItem!.text()).toContain('My League');
    });

    it('renders separators between breadcrumb items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Leagues', to: { name: 'leagues' } },
        { label: 'My League' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      // Should have 2 separators (between 3 items)
      const separators = wrapper.findAll('i.pi-chevron-right');
      expect(separators).toHaveLength(2);

      // Separators should be hidden from screen readers
      separators.forEach((separator) => {
        expect(separator.attributes('aria-hidden')).toBe('true');
      });
    });

    it('renders custom icon separator', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: {
          items,
          separator: 'pi-angle-right',
        },
        global: {
          plugins: [mockRouter],
        },
      });

      const separator = wrapper.find('i.pi-angle-right');
      expect(separator.exists()).toBe(true);
    });

    it('renders text separator when textSeparator is true', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: {
          items,
          separator: '/',
          textSeparator: true,
        },
        global: {
          plugins: [mockRouter],
        },
      });

      const separator = wrapper.find('span.text-gray-400');
      expect(separator.exists()).toBe(true);
      expect(separator.text()).toBe('/');
      expect(separator.attributes('aria-hidden')).toBe('true');
    });

    it('renders breadcrumbs with mixed icons', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' }, icon: 'pi-home' },
        { label: 'Leagues', to: { name: 'leagues' } },
        { label: 'My League', icon: 'pi-flag' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      expect(wrapper.find('i.pi-home').exists()).toBe(true);
      expect(wrapper.find('i.pi-flag').exists()).toBe(true);
    });
  });

  describe('Router Navigation', () => {
    it('navigates to correct route when clicking breadcrumb', async () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Leagues', to: { name: 'leagues' } },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const homeLink = wrapper.findAll('a')[0];
      expect(homeLink).toBeDefined();
      expect(homeLink!.attributes('href')).toBe('/');

      const leaguesLink = wrapper.findAll('a')[1];
      expect(leaguesLink).toBeDefined();
      expect(leaguesLink!.attributes('href')).toBe('/leagues');
    });

    it('supports route objects with params', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Leagues', to: { name: 'leagues' } },
        { label: 'League #1', to: { name: 'league-detail', params: { id: '1' } } },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const links = wrapper.findAll('a');
      expect(links).toHaveLength(3);

      // The third link should have the dynamic param
      expect(links[2]).toBeDefined();
      expect(links[2]!.attributes('href')).toBe('/leagues/1');
    });

    it('supports string paths as to prop', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Leagues', to: '/leagues' },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const links = wrapper.findAll('a');
      expect(links[0]).toBeDefined();
      expect(links[0]!.attributes('href')).toBe('/');
      expect(links[1]).toBeDefined();
      expect(links[1]!.attributes('href')).toBe('/leagues');
    });
  });

  describe('Last Item Behavior', () => {
    it('makes last item non-clickable even with to prop', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Current', to: { name: 'leagues' } }, // Has 'to' but should still be non-clickable
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const links = wrapper.findAll('a');
      expect(links).toHaveLength(1); // Only the first item should be a link

      // Last item should be a span
      const lastItem = wrapper.findAll('li')[1];
      expect(lastItem).toBeDefined();
      expect(lastItem!.find('span.font-semibold').exists()).toBe(true);
      expect(lastItem!.find('a').exists()).toBe(false);
    });

    it('applies font-semibold to last item', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const lastItem = wrapper.findAll('li')[1];
      expect(lastItem).toBeDefined();
      const lastItemSpan = lastItem!.find('span.font-semibold');
      expect(lastItemSpan.exists()).toBe(true);
      expect(lastItemSpan.text()).toBe('Current');
    });

    it('applies font-medium to clickable items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const link = wrapper.find('a');
      const linkSpan = link.find('span.font-medium');
      expect(linkSpan.exists()).toBe(true);
      expect(linkSpan.text()).toBe('Home');
    });
  });

  describe('Styling and Classes', () => {
    it('applies correct hover styles to clickable breadcrumbs', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const link = wrapper.find('a');
      expect(link.classes()).toContain('hover:text-gray-900');
      expect(link.classes()).toContain('text-gray-600');
      expect(link.classes()).toContain('transition-colors');
    });

    it('applies correct text color to non-clickable items', () => {
      const items: BreadcrumbItem[] = [{ label: 'Current' }];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const span = wrapper.find('span.text-gray-900');
      expect(span.exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure with nav and ol', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const nav = wrapper.find('nav');
      expect(nav.exists()).toBe(true);
      expect(nav.attributes('aria-label')).toBe('Breadcrumb');

      const ol = wrapper.find('ol');
      expect(ol.exists()).toBe(true);
      expect(ol.element.tagName).toBe('OL');
    });

    it('marks last item with aria-current="page"', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Leagues', to: { name: 'leagues' } },
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const listItems = wrapper.findAll('li');
      expect(listItems[2]).toBeDefined();
      const lastItemContent = listItems[2]!.find('[aria-current="page"]');
      expect(lastItemContent.exists()).toBe(true);
    });

    it('hides icons from screen readers with aria-hidden', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' }, icon: 'pi-home' },
        { label: 'Current', icon: 'pi-flag' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const icons = wrapper.findAll('i[aria-hidden="true"]');
      // Should have 2 breadcrumb icons + 1 separator icon = 3 total
      expect(icons.length).toBeGreaterThanOrEqual(2);

      icons.forEach((icon) => {
        expect(icon.attributes('aria-hidden')).toBe('true');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items: [] },
        global: {
          plugins: [mockRouter],
        },
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Breadcrumbs: items array is empty');
      expect(wrapper.findAll('li')).toHaveLength(0);

      consoleWarnSpy.mockRestore();
    });

    it('limits display to 5 items maximum', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const items: BreadcrumbItem[] = [
        { label: 'Item 1', to: { name: 'home' } },
        { label: 'Item 2', to: { name: 'home' } },
        { label: 'Item 3', to: { name: 'home' } },
        { label: 'Item 4', to: { name: 'home' } },
        { label: 'Item 5', to: { name: 'home' } },
        { label: 'Item 6' }, // This should be excluded
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Breadcrumbs: more than 5 items provided, only first 5 will be displayed',
      );
      expect(wrapper.findAll('li')).toHaveLength(5);
      expect(wrapper.text()).not.toContain('Item 6');

      consoleWarnSpy.mockRestore();
    });

    it('handles items without labels gracefully', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: '', to: { name: 'leagues' } }, // Empty label
        { label: 'Current' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      const listItems = wrapper.findAll('li');
      expect(listItems).toHaveLength(3);
      // Component should still render but with empty text
      expect(listItems[1]).toBeDefined();
      expect(listItems[1]!.text().trim()).toBe('');
    });

    it('handles breadcrumbs with only icons', () => {
      const items: BreadcrumbItem[] = [
        { label: '', to: { name: 'home' }, icon: 'pi-home' },
        { label: '', icon: 'pi-flag' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      expect(wrapper.find('i.pi-home').exists()).toBe(true);
      expect(wrapper.find('i.pi-flag').exists()).toBe(true);
    });
  });

  describe('5 Items Maximum', () => {
    it('renders exactly 5 items correctly', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' }, icon: 'pi-home' },
        { label: 'Leagues', to: { name: 'leagues' } },
        { label: 'League 1', to: { name: 'league-detail', params: { id: '1' } } },
        { label: 'Competitions', to: { name: 'home' } },
        { label: 'Current Competition' },
      ];

      wrapper = mountWithStubs(Breadcrumbs, {
        props: { items },
        global: {
          plugins: [mockRouter],
        },
      });

      expect(wrapper.findAll('li')).toHaveLength(5);
      expect(wrapper.findAll('a')).toHaveLength(4); // All except last
      expect(wrapper.findAll('i.pi-chevron-right')).toHaveLength(4); // 4 separators
    });
  });
});
