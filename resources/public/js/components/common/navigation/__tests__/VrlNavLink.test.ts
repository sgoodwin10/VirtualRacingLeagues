import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import VrlNavLink from '../VrlNavLink.vue';

describe('VrlNavLink', () => {
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    // Create a mock router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/about', name: 'about', component: { template: '<div>About</div>' } },
        { path: '/contact', name: 'contact', component: { template: '<div>Contact</div>' } },
      ],
    });
  });

  it('renders as anchor with href', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: 'https://example.com',
      },
      slots: {
        default: 'External Link',
      },
    });

    const anchor = wrapper.find('a');
    expect(anchor.exists()).toBe(true);
    expect(anchor.attributes('href')).toBe('https://example.com');
    expect(anchor.text()).toBe('External Link');
  });

  it('renders as RouterLink with to', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        to: { name: 'about' },
      },
      slots: {
        default: 'About',
      },
      global: {
        plugins: [router],
      },
    });

    const link = wrapper.find('[data-test="nav-router-link"]');
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe('About');
  });

  it('renders as span when neither href nor to provided', () => {
    const wrapper = mount(VrlNavLink, {
      slots: {
        default: 'Just Text',
      },
    });

    const span = wrapper.find('[data-test="nav-span"]');
    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('Just Text');
  });

  it('applies active class when active prop is true', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
        active: true,
      },
      slots: {
        default: 'Active Link',
      },
    });

    expect(wrapper.find('[data-test="nav-link"]').classes()).toContain(
      'text-[var(--text-primary)]',
    );
  });

  it('does not apply active class when active prop is false', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
        active: false,
      },
      slots: {
        default: 'Inactive Link',
      },
    });

    expect(wrapper.find('[data-test="nav-link"]').classes()).toContain(
      'text-[var(--text-secondary)]',
    );
  });

  it('applies aria-current="page" when active', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
        active: true,
      },
      slots: {
        default: 'Active Link',
      },
    });

    expect(wrapper.find('[data-test="nav-link"]').attributes('aria-current')).toBe('page');
  });

  it('does not apply aria-current when inactive', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
        active: false,
      },
      slots: {
        default: 'Inactive Link',
      },
    });

    expect(wrapper.find('[data-test="nav-link"]').attributes('aria-current')).toBeUndefined();
  });

  it('opens external links in new tab', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: 'https://example.com',
        external: true,
      },
      slots: {
        default: 'External',
      },
    });

    const anchor = wrapper.find('a');
    expect(anchor.attributes('target')).toBe('_blank');
    expect(anchor.attributes('rel')).toBe('noopener noreferrer');
  });

  it('does not set target and rel for internal links', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/internal',
        external: false,
      },
      slots: {
        default: 'Internal',
      },
    });

    const anchor = wrapper.find('a');
    expect(anchor.attributes('target')).toBeUndefined();
    expect(anchor.attributes('rel')).toBeUndefined();
  });

  it('does not set target and rel when external is not provided', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
      },
      slots: {
        default: 'Link',
      },
    });

    const anchor = wrapper.find('a');
    expect(anchor.attributes('target')).toBeUndefined();
    expect(anchor.attributes('rel')).toBeUndefined();
  });

  it('has proper nav-link class', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
      },
      slots: {
        default: 'Link',
      },
    });

    expect(wrapper.find('[data-test="nav-link"]').exists()).toBe(true);
  });

  it('renders slot content correctly', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
      },
      slots: {
        default: '<span>Custom Content</span>',
      },
    });

    expect(wrapper.html()).toContain('<span>Custom Content</span>');
  });

  it('works with router link and active state', async () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        to: { name: 'about' },
        active: true,
      },
      slots: {
        default: 'About',
      },
      global: {
        plugins: [router],
      },
    });

    const link = wrapper.find('[data-test="nav-router-link"]');
    expect(link.exists()).toBe(true);
    expect(link.classes()).toContain('text-[var(--text-primary)]');
    expect(link.attributes('aria-current')).toBe('page');
  });

  it('href takes precedence over to when both provided', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: 'https://example.com',
        to: { name: 'about' },
      },
      slots: {
        default: 'Link',
      },
      global: {
        plugins: [router],
      },
    });

    const anchor = wrapper.find('a');
    expect(anchor.attributes('href')).toBe('https://example.com');
  });

  it('supports multiple route formats', () => {
    // Test with route name
    const wrapper1 = mount(VrlNavLink, {
      props: {
        to: { name: 'about' },
      },
      slots: {
        default: 'About',
      },
      global: {
        plugins: [router],
      },
    });
    expect(wrapper1.find('[data-test="nav-router-link"]').exists()).toBe(true);

    // Test with route path
    const wrapper2 = mount(VrlNavLink, {
      props: {
        to: '/contact',
      },
      slots: {
        default: 'Contact',
      },
      global: {
        plugins: [router],
      },
    });
    expect(wrapper2.find('[data-test="nav-router-link"]').exists()).toBe(true);
  });

  it('has animated underline styles', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
      },
      slots: {
        default: 'Link',
      },
    });

    const link = wrapper.find('[data-test="nav-link"]');
    expect(link.exists()).toBe(true);
    // The ::after pseudo-element for underline is defined in inline classes
    expect(link.classes()).toContain("after:content-['']");
  });

  it('maintains accessibility with keyboard navigation', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
      },
      slots: {
        default: 'Link',
      },
    });

    const link = wrapper.find('[data-test="nav-link"]');
    // Links should be focusable by default
    expect(link.element.tagName).toBe('A');
  });

  it('works in header navigation context', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        to: { name: 'home' },
      },
      slots: {
        default: 'Home',
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('[data-test="nav-router-link"]').text()).toBe('Home');
  });

  it('works in footer navigation context', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: 'mailto:support@example.com',
      },
      slots: {
        default: 'Contact',
      },
    });

    expect(wrapper.find('a').attributes('href')).toBe('mailto:support@example.com');
  });

  it('handles empty slot gracefully', () => {
    const wrapper = mount(VrlNavLink, {
      props: {
        href: '/test',
      },
    });

    expect(wrapper.find('[data-test="nav-link"]').exists()).toBe(true);
  });
});
