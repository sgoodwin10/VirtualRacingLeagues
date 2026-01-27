import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import VrlBreadcrumbItem from './VrlBreadcrumbItem.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/leagues', name: 'leagues', component: { template: '<div>Leagues</div>' } },
    {
      path: '/leagues/:id',
      name: 'league-detail',
      component: { template: '<div>League Detail</div>' },
    },
  ],
});

describe('VrlBreadcrumbItem', () => {
  describe('Rendering', () => {
    it('should render breadcrumb text from slot', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        slots: { default: 'Home' },
        global: { plugins: [router] },
      });

      expect(wrapper.text()).toContain('Home');
    });

    it('should render as link when href prop provided', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { href: '/about' },
        slots: { default: 'About' },
        global: { plugins: [router] },
      });

      const link = wrapper.find('[data-test="breadcrumb-link"]');
      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toBe('/about');
    });

    it('should render as RouterLink when to prop provided', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { to: { name: 'leagues' } },
        slots: { default: 'Leagues' },
        global: { plugins: [router] },
      });

      const routerLink = wrapper.find('[data-test="breadcrumb-router-link"]');
      expect(routerLink.exists()).toBe(true);
    });

    it('should render as span when active', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { active: true },
        slots: { default: 'Current Page' },
        global: { plugins: [router] },
      });

      const activeSpan = wrapper.find('[data-test="breadcrumb-active"]');
      expect(activeSpan.exists()).toBe(true);
      expect(activeSpan.element.tagName).toBe('SPAN');
    });

    it('should render as span when no to or href prop provided', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        slots: { default: 'Text Only' },
        global: { plugins: [router] },
      });

      const activeSpan = wrapper.find('[data-test="breadcrumb-active"]');
      expect(activeSpan.exists()).toBe(true);
    });
  });

  describe('Link Types', () => {
    it('should render regular anchor link with href', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { href: 'https://example.com' },
        slots: { default: 'External Link' },
        global: { plugins: [router] },
      });

      const link = wrapper.find('a');
      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toBe('https://example.com');
    });

    it('should render Vue Router link with to prop', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { to: '/leagues' },
        slots: { default: 'Leagues' },
        global: { plugins: [router] },
      });

      const routerLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(routerLink.exists()).toBe(true);
    });

    it('should render Vue Router link with named route', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { to: { name: 'leagues' } },
        slots: { default: 'Leagues' },
        global: { plugins: [router] },
      });

      const routerLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(routerLink.exists()).toBe(true);
    });

    it('should not render link when active is true and href provided', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: {
          href: '/test',
          active: true,
        },
        slots: { default: 'Active Page' },
        global: { plugins: [router] },
      });

      const link = wrapper.find('[data-test="breadcrumb-link"]');
      expect(link.exists()).toBe(false);

      const activeSpan = wrapper.find('[data-test="breadcrumb-active"]');
      expect(activeSpan.exists()).toBe(true);
    });

    it('should not render RouterLink when active is true and to provided', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: {
          to: '/leagues',
          active: true,
        },
        slots: { default: 'Active Page' },
        global: { plugins: [router] },
      });

      const routerLink = wrapper.find('[data-test="breadcrumb-router-link"]');
      expect(routerLink.exists()).toBe(false);

      const activeSpan = wrapper.find('[data-test="breadcrumb-active"]');
      expect(activeSpan.exists()).toBe(true);
    });
  });

  describe('Styling', () => {
    it('should apply link styles to anchor links', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { href: '/test' },
        slots: { default: 'Link' },
        global: { plugins: [router] },
      });

      const link = wrapper.find('a');
      expect(link.classes()).toContain('text-[var(--text-secondary)]');
      expect(link.classes()).toContain('no-underline');
      expect(link.classes()).toContain('transition-[var(--transition)]');
      expect(link.classes()).toContain('hover:text-[var(--cyan)]');
    });

    it('should apply link styles to router links', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { to: '/leagues' },
        slots: { default: 'Leagues' },
        global: { plugins: [router] },
      });

      const routerLink = wrapper.find('[data-test="breadcrumb-router-link"]');
      expect(routerLink.classes()).toContain('text-[var(--text-secondary)]');
      expect(routerLink.classes()).toContain('no-underline');
      expect(routerLink.classes()).toContain('transition-[var(--transition)]');
      expect(routerLink.classes()).toContain('hover:text-[var(--cyan)]');
    });

    it('should apply active/current styles when active', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { active: true },
        slots: { default: 'Current' },
        global: { plugins: [router] },
      });

      const activeSpan = wrapper.find('[data-test="breadcrumb-active"]');
      expect(activeSpan.classes()).toContain('text-[var(--text-primary)]');
      expect(activeSpan.classes()).toContain('pointer-events-none');
    });

    it('should show hover state for links', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { href: '/test' },
        slots: { default: 'Link' },
        global: { plugins: [router] },
      });

      const link = wrapper.find('a');
      expect(link.classes()).toContain('hover:text-[var(--cyan)]');
    });

    it('should not have pointer events on active items', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { active: true },
        slots: { default: 'Current' },
        global: { plugins: [router] },
      });

      const activeSpan = wrapper.find('[data-test="breadcrumb-active"]');
      expect(activeSpan.classes()).toContain('pointer-events-none');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable when link', async () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { href: '/test' },
        slots: { default: 'Link' },
        global: { plugins: [router] },
      });

      const link = wrapper.find('a');
      // Links are naturally keyboard navigable
      expect(link.exists()).toBe(true);
      expect(link.element.tagName).toBe('A');
    });

    it('should not be keyboard navigable when active', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { active: true },
        slots: { default: 'Current' },
        global: { plugins: [router] },
      });

      const activeSpan = wrapper.find('[data-test="breadcrumb-active"]');
      expect(activeSpan.classes()).toContain('pointer-events-none');
    });

    it('should have appropriate semantic markup for links', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { href: '/test' },
        slots: { default: 'Link' },
        global: { plugins: [router] },
      });

      const link = wrapper.find('a');
      expect(link.element.tagName).toBe('A');
      expect(link.attributes('href')).toBeDefined();
    });

    it('should have appropriate semantic markup for active item', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { active: true },
        slots: { default: 'Current' },
        global: { plugins: [router] },
      });

      const activeSpan = wrapper.find('span');
      expect(activeSpan.element.tagName).toBe('SPAN');
    });
  });

  describe('Props', () => {
    it('should accept href prop', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { href: '/test-path' },
        slots: { default: 'Test' },
        global: { plugins: [router] },
      });

      const link = wrapper.find('a');
      expect(link.attributes('href')).toBe('/test-path');
    });

    it('should accept to prop as string', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { to: '/leagues' },
        slots: { default: 'Leagues' },
        global: { plugins: [router] },
      });

      const routerLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(routerLink.exists()).toBe(true);
    });

    it('should accept to prop as object', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { to: { name: 'leagues', params: { id: '123' } } },
        slots: { default: 'Leagues' },
        global: { plugins: [router] },
      });

      const routerLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(routerLink.exists()).toBe(true);
    });

    it('should accept active prop', () => {
      const activeWrapper = mount(VrlBreadcrumbItem, {
        props: { active: true },
        slots: { default: 'Active' },
        global: { plugins: [router] },
      });

      const inactiveWrapper = mount(VrlBreadcrumbItem, {
        props: { active: false, href: '/test' },
        slots: { default: 'Inactive' },
        global: { plugins: [router] },
      });

      expect(activeWrapper.find('[data-test="breadcrumb-active"]').exists()).toBe(true);
      expect(inactiveWrapper.find('[data-test="breadcrumb-link"]').exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty slot content', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { active: true },
        slots: { default: '' },
        global: { plugins: [router] },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should prioritize active prop over href and to', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: {
          href: '/test',
          to: '/other',
          active: true,
        },
        slots: { default: 'Active' },
        global: { plugins: [router] },
      });

      // Should render as span, not link
      expect(wrapper.find('[data-test="breadcrumb-active"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="breadcrumb-link"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="breadcrumb-router-link"]').exists()).toBe(false);
    });

    it('should handle complex slot content', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { active: true },
        slots: { default: '<strong>Bold</strong> Text' },
        global: { plugins: [router] },
      });

      expect(wrapper.find('strong').exists()).toBe(true);
      expect(wrapper.text()).toContain('Bold');
    });

    it('should render only one element type', () => {
      const activeWrapper = mount(VrlBreadcrumbItem, {
        props: { active: true },
        slots: { default: 'Active' },
        global: { plugins: [router] },
      });

      const hrefWrapper = mount(VrlBreadcrumbItem, {
        props: { href: '/test' },
        slots: { default: 'Link' },
        global: { plugins: [router] },
      });

      const toWrapper = mount(VrlBreadcrumbItem, {
        props: { to: '/test' },
        slots: { default: 'Router' },
        global: { plugins: [router] },
      });

      // Each should render exactly one primary element
      expect(activeWrapper.find('[data-test="breadcrumb-active"]').exists()).toBe(true);
      expect(hrefWrapper.find('[data-test="breadcrumb-link"]').exists()).toBe(true);
      expect(toWrapper.find('[data-test="breadcrumb-router-link"]').exists()).toBe(true);
    });

    it('should handle external URLs in href', () => {
      const wrapper = mount(VrlBreadcrumbItem, {
        props: { href: 'https://example.com/external' },
        slots: { default: 'External' },
        global: { plugins: [router] },
      });

      const link = wrapper.find('a');
      expect(link.attributes('href')).toBe('https://example.com/external');
    });
  });
});
