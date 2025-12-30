import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import HeaderBar from '../HeaderBar.vue';
import type { BreadcrumbItem } from '@app/components/common/Breadcrumbs.vue';

describe('HeaderBar', () => {
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

  describe('Rendering', () => {
    it('renders the header bar container', () => {
      const wrapper = mount(HeaderBar, {
        global: {
          plugins: [router],
        },
      });

      expect(wrapper.find('.header-bar').exists()).toBe(true);
    });

    it('renders left and right sections', () => {
      const wrapper = mount(HeaderBar, {
        global: {
          plugins: [router],
        },
      });

      expect(wrapper.find('.header-left').exists()).toBe(true);
      expect(wrapper.find('.header-right').exists()).toBe(true);
    });
  });

  describe('Breadcrumbs', () => {
    it('does not render breadcrumbs when no items provided', () => {
      const wrapper = mount(HeaderBar, {
        global: {
          plugins: [router],
        },
      });

      expect(wrapper.findComponent({ name: 'Breadcrumbs' }).exists()).toBe(false);
    });

    it('does not render breadcrumbs when empty array provided', () => {
      const wrapper = mount(HeaderBar, {
        props: {
          breadcrumbs: [],
        },
        global: {
          plugins: [router],
        },
      });

      expect(wrapper.findComponent({ name: 'Breadcrumbs' }).exists()).toBe(false);
    });

    it('renders breadcrumbs when items are provided', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Current Page' },
      ];

      const wrapper = mount(HeaderBar, {
        props: {
          breadcrumbs,
        },
        global: {
          plugins: [router],
        },
      });

      const breadcrumbsComponent = wrapper.findComponent({ name: 'Breadcrumbs' });
      expect(breadcrumbsComponent.exists()).toBe(true);
      expect(breadcrumbsComponent.props('items')).toEqual(breadcrumbs);
    });

    it('passes breadcrumb items to Breadcrumbs component', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Leagues', to: { name: 'leagues' } },
        { label: 'Current League' },
      ];

      const wrapper = mount(HeaderBar, {
        props: {
          breadcrumbs,
        },
        global: {
          plugins: [router],
        },
      });

      const breadcrumbsComponent = wrapper.findComponent({ name: 'Breadcrumbs' });
      expect(breadcrumbsComponent.props('items')).toEqual(breadcrumbs);
    });
  });

  describe('Actions Slot', () => {
    it('renders actions slot when provided', () => {
      const wrapper = mount(HeaderBar, {
        global: {
          plugins: [router],
        },
        slots: {
          actions: '<button class="test-action">Test Action</button>',
        },
      });

      expect(wrapper.find('.test-action').exists()).toBe(true);
      expect(wrapper.find('.test-action').text()).toBe('Test Action');
    });

    it('renders multiple action buttons in slot', () => {
      const wrapper = mount(HeaderBar, {
        global: {
          plugins: [router],
        },
        slots: {
          actions: `
            <button class="action-1">Action 1</button>
            <button class="action-2">Action 2</button>
          `,
        },
      });

      expect(wrapper.find('.action-1').exists()).toBe(true);
      expect(wrapper.find('.action-2').exists()).toBe(true);
    });

    it('renders empty actions section when no slot provided', () => {
      const wrapper = mount(HeaderBar, {
        global: {
          plugins: [router],
        },
      });

      const actionsSection = wrapper.find('.header-right');
      expect(actionsSection.exists()).toBe(true);
      expect(actionsSection.text()).toBe('');
    });
  });

  describe('Styling', () => {
    it('applies correct CSS classes to header bar', () => {
      const wrapper = mount(HeaderBar, {
        global: {
          plugins: [router],
        },
      });

      const headerBar = wrapper.find('.header-bar');
      expect(headerBar.exists()).toBe(true);
    });

    it('applies flex layout classes', () => {
      const wrapper = mount(HeaderBar, {
        global: {
          plugins: [router],
        },
      });

      expect(wrapper.find('.header-left').exists()).toBe(true);
      expect(wrapper.find('.header-right').exists()).toBe(true);
    });
  });

  describe('Integration', () => {
    it('works with breadcrumbs and actions together', () => {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Home', to: { name: 'home' } },
        { label: 'Settings' },
      ];

      const wrapper = mount(HeaderBar, {
        props: {
          breadcrumbs,
        },
        global: {
          plugins: [router],
        },
        slots: {
          actions: '<button class="save-btn">Save</button>',
        },
      });

      expect(wrapper.findComponent({ name: 'Breadcrumbs' }).exists()).toBe(true);
      expect(wrapper.find('.save-btn').exists()).toBe(true);
    });
  });
});
