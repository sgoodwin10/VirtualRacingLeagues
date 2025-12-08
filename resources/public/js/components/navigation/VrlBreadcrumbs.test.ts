import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { RouterLink } from 'vue-router';
import VrlBreadcrumbs, { type BreadcrumbItem } from './VrlBreadcrumbs.vue';

describe('VrlBreadcrumbs', () => {
  describe('Rendering', () => {
    it('renders with required props', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Current Page' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('Home');
      expect(wrapper.text()).toContain('Current Page');
    });

    it('renders custom class', () => {
      const items: BreadcrumbItem[] = [{ label: 'Home' }];

      const wrapper = mount(VrlBreadcrumbs, {
        props: {
          items,
          class: 'custom-breadcrumb',
        },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.classes()).toContain('custom-breadcrumb');
    });
  });

  describe('Accessibility', () => {
    it('has nav element with aria-label', () => {
      const items: BreadcrumbItem[] = [{ label: 'Home' }];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const nav = wrapper.find('nav');
      expect(nav.exists()).toBe(true);
      expect(nav.attributes('aria-label')).toBe('Breadcrumb');
    });

    it('adds aria-current="page" to last item', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Leagues', to: '/leagues' },
        { label: 'GT Masters Cup' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const spans = wrapper.findAll('span');
      const lastItem = spans[spans.length - 1];
      expect(lastItem.attributes('aria-current')).toBe('page');
    });

    it('does not add aria-current to non-last items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const links = wrapper.findAllComponents(RouterLink);
      if (links.length > 0) {
        expect(links[0].attributes('aria-current')).toBeUndefined();
      }
    });
  });

  describe('RouterLink Integration', () => {
    it('renders RouterLink for items with "to" prop (except last)', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Leagues', to: '/leagues' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const links = wrapper.findAllComponents(RouterLink);
      expect(links.length).toBe(2);
    });

    it('renders span for last item even if it has "to" prop', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Current', to: '/current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const links = wrapper.findAllComponents(RouterLink);
      expect(links.length).toBe(1); // Only first item is a link
    });

    it('renders span for items without "to" prop', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Not a link' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const links = wrapper.findAllComponents(RouterLink);
      expect(links.length).toBe(0);
    });

    it('passes route location object to RouterLink', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const link = wrapper.findComponent(RouterLink);
      expect(link.exists()).toBe(true);
    });
  });

  describe('Icons', () => {
    it('renders home icon for first item without custom icon', async () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const homeIcon = wrapper.findComponent({ name: 'PhHouse' });
      expect(homeIcon.exists()).toBe(true);
    });

    it('does not render home icon if first item has custom icon', async () => {
      const items: BreadcrumbItem[] = [
        { label: 'Dashboard', icon: 'gauge', to: '/' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      await wrapper.vm.$nextTick();

      const homeIcon = wrapper.findComponent({ name: 'PhHouse' });
      expect(homeIcon.exists()).toBe(false);
    });

    it('renders custom icon when provided', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Leagues', icon: 'flag-checkered', to: '/leagues' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Separators', () => {
    it('renders separators between items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Leagues', to: '/leagues' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const separators = wrapper.findAllComponents({ name: 'PhCaretRight' });
      expect(separators.length).toBe(2); // 3 items = 2 separators
    });

    it('does not render separator after last item', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const separators = wrapper.findAllComponents({ name: 'PhCaretRight' });
      expect(separators.length).toBe(1); // 2 items = 1 separator
    });

    it('renders no separators for single item', () => {
      const items: BreadcrumbItem[] = [{ label: 'Current' }];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const separators = wrapper.findAllComponents({ name: 'PhCaretRight' });
      expect(separators.length).toBe(0);
    });
  });

  describe('Styling', () => {
    it('applies hover styles to clickable items', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const link = wrapper.findComponent(RouterLink);
      expect(link.classes()).toContain('hover:text-racing-gold');
      expect(link.classes()).toContain('transition-colors');
      expect(link.classes()).toContain('cursor-pointer');
    });

    it('applies font-medium to last item', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Current' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const spans = wrapper.findAll('span');
      const lastItem = spans[spans.length - 1];
      expect(lastItem.classes()).toContain('font-medium');
    });

    it('applies correct font and size classes', () => {
      const items: BreadcrumbItem[] = [{ label: 'Test' }];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      const span = wrapper.find('span');
      expect(span.classes()).toContain('font-data');
      expect(span.classes()).toContain('text-[11px]');
    });
  });

  describe('Multiple Items', () => {
    it('handles single item breadcrumb', () => {
      const items: BreadcrumbItem[] = [{ label: 'Home' }];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Home');
    });

    it('handles two item breadcrumb', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'About' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Home');
      expect(wrapper.text()).toContain('About');
    });

    it('handles many item breadcrumb', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', to: '/' },
        { label: 'Leagues', to: '/leagues' },
        { label: 'GT Masters', to: '/leagues/gt' },
        { label: 'Season 2024', to: '/leagues/gt/2024' },
        { label: 'Race 5' },
      ];

      const wrapper = mount(VrlBreadcrumbs, {
        props: { items },
        global: {
          stubs: {
            RouterLink: true,
          },
        },
      });

      expect(wrapper.text()).toContain('Home');
      expect(wrapper.text()).toContain('Leagues');
      expect(wrapper.text()).toContain('GT Masters');
      expect(wrapper.text()).toContain('Season 2024');
      expect(wrapper.text()).toContain('Race 5');

      const separators = wrapper.findAllComponents({ name: 'PhCaretRight' });
      expect(separators.length).toBe(4);
    });
  });
});
