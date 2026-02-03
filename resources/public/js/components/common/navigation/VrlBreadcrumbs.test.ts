import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import VrlBreadcrumbs from './VrlBreadcrumbs.vue';
import type { BreadcrumbItem } from '@public/types/navigation';

describe('VrlBreadcrumbs', () => {
  let router: ReturnType<typeof createRouter>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create a mock router
    router = createRouter({
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

    // Spy on console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('renders with 1 item', () => {
    const items: BreadcrumbItem[] = [{ label: 'Home' }];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('[data-test="breadcrumbs"]').exists()).toBe(true);
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Breadcrumb');
    expect(wrapper.findAll('[data-test="breadcrumb-item-wrapper"]')).toHaveLength(1);
    expect(wrapper.text()).toContain('Home');
  });

  it('renders with 3 items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Leagues', to: { name: 'leagues' } },
      { label: 'Standings' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.findAll('[data-test="breadcrumb-item-wrapper"]')).toHaveLength(3);
    expect(wrapper.text()).toContain('Home');
    expect(wrapper.text()).toContain('Leagues');
    expect(wrapper.text()).toContain('Standings');
  });

  it('renders with 5 items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Leagues', to: { name: 'leagues' } },
      { label: 'GT4 Pro League', to: { name: 'league-detail', params: { id: '123' } } },
      { label: 'Season 1' },
      { label: 'Standings' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.findAll('[data-test="breadcrumb-item-wrapper"]')).toHaveLength(5);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('warns when more than 5 items provided', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Leagues', to: { name: 'leagues' } },
      { label: 'GT4 Pro League', to: { name: 'league-detail', params: { id: '123' } } },
      { label: 'Season 1' },
      { label: 'Standings' },
      { label: 'Extra Item 1' },
      { label: 'Extra Item 2' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'VrlBreadcrumbs: more than 5 items provided. Limiting to first 5 for usability.',
    );
    expect(wrapper.findAll('[data-test="breadcrumb-item-wrapper"]')).toHaveLength(5);
  });

  it('warns when items array is empty', () => {
    const items: BreadcrumbItem[] = [];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith('VrlBreadcrumbs: items array is empty');
    expect(wrapper.findAll('[data-test="breadcrumb-item-wrapper"]')).toHaveLength(0);
  });

  it('last item is non-clickable and styled as active', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Leagues', to: { name: 'leagues' } },
      { label: 'Standings' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    const itemWrappers = wrapper.findAll('[data-test="breadcrumb-item-wrapper"]');
    const lastItem = itemWrappers[itemWrappers.length - 1];

    // Last item should be a span (non-clickable)
    expect(lastItem?.find('[data-test="breadcrumb-active"]').exists()).toBe(true);
    expect(lastItem?.find('[data-test="breadcrumb-link"]').exists()).toBe(false);
    expect(lastItem?.find('[data-test="breadcrumb-router-link"]').exists()).toBe(false);
  });

  it('supports both href and to navigation', async () => {
    const items: BreadcrumbItem[] = [
      { label: 'External', href: 'https://example.com' },
      { label: 'Home', to: { name: 'home' } },
      { label: 'Current' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    // First item should be an anchor with href
    const firstItem = wrapper.findAll('[data-test="breadcrumb-item-wrapper"]')[0];
    const anchor = firstItem?.find('[data-test="breadcrumb-link"]');
    expect(anchor?.exists()).toBe(true);
    expect(anchor?.attributes('href')).toBe('https://example.com');

    // Second item should be a RouterLink
    const secondItem = wrapper.findAll('[data-test="breadcrumb-item-wrapper"]')[1];
    expect(secondItem?.find('[data-test="breadcrumb-router-link"]').exists()).toBe(true);
  });

  it('applies aria-current="page" to last item', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Leagues', to: { name: 'leagues' } },
      { label: 'Standings' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    const itemWrappers = wrapper.findAll('[data-test="breadcrumb-item-wrapper"]');
    const lastItem = itemWrappers[itemWrappers.length - 1];
    const activeSpan = lastItem?.find('[data-test="breadcrumb-active"]');

    expect(activeSpan?.attributes('aria-current')).toBe('page');
  });

  it('renders separators between items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Leagues', to: { name: 'leagues' } },
      { label: 'Standings' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    const separators = wrapper.findAll('[data-test="breadcrumb-separator"]');
    expect(separators).toHaveLength(2); // 3 items = 2 separators

    // Check that separators have aria-hidden
    separators.forEach((separator) => {
      expect(separator.attributes('aria-hidden')).toBe('true');
    });
  });

  it('renders default "/" separator', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Standings' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    const separator = wrapper.find('[data-test="breadcrumb-separator"]');
    expect(separator.text()).toBe('/');
  });

  it('renders custom separator slot', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Standings' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      slots: {
        separator: '→',
      },
      global: {
        plugins: [router],
      },
    });

    const separator = wrapper.find('[data-test="breadcrumb-separator"]');
    expect(separator.text()).toBe('→');
  });

  it('does not render separator after last item', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Leagues', to: { name: 'leagues' } },
      { label: 'Standings' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    const itemWrappers = wrapper.findAll('[data-test="breadcrumb-item-wrapper"]');
    const lastItemWrapper = itemWrappers[itemWrappers.length - 1];

    // Last item wrapper should not contain a separator
    expect(lastItemWrapper?.find('[data-test="breadcrumb-separator"]').exists()).toBe(false);
  });

  it('uses semantic HTML structure', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Standings' },
    ];

    const wrapper = mount(VrlBreadcrumbs, {
      props: { items },
      global: {
        plugins: [router],
      },
    });

    // Should use nav element
    expect(wrapper.find('nav[data-test="breadcrumbs"]').exists()).toBe(true);

    // Should use ol (ordered list)
    expect(wrapper.find('ol').exists()).toBe(true);

    // Should use li for each item
    const listItems = wrapper.findAll('li[data-test="breadcrumb-item-wrapper"]');
    expect(listItems).toHaveLength(2);
  });
});
