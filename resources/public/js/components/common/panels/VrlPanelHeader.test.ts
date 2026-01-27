import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlPanelHeader from './VrlPanelHeader.vue';

describe('VrlPanelHeader', () => {
  describe('Rendering', () => {
    it('should render title slot content', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: { title: 'Panel Title' },
      });

      expect(wrapper.text()).toContain('Panel Title');
    });

    it('should render actions slot when provided', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: {
          title: 'Title',
          actions: '<button class="test-action">Action</button>',
        },
      });

      const action = wrapper.find('.test-action');
      expect(action.exists()).toBe(true);
      expect(action.text()).toContain('Action');
    });

    it('should apply header styles', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: { title: 'Test' },
      });

      const header = wrapper.find('[data-test="vrl-panel-header"]');
      expect(header.classes()).toContain('flex');
      expect(header.classes()).toContain('items-center');
      expect(header.classes()).toContain('justify-between');
      expect(header.classes()).toContain('px-5');
      expect(header.classes()).toContain('py-4');
      expect(header.classes()).toContain('bg-[var(--bg-panel)]');
      expect(header.classes()).toContain('border-b');
      expect(header.classes()).toContain('border-[var(--border)]');
    });

    it('should display toggle icon when clickable', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: true,
        },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-panel-toggle"]');
      expect(toggle.exists()).toBe(true);
    });

    it('should not display toggle icon when not clickable', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: false,
        },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-panel-toggle"]');
      expect(toggle.exists()).toBe(false);
    });

    it('should apply custom CSS class', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          class: 'custom-header',
        },
        slots: { title: 'Test' },
      });

      expect(wrapper.classes()).toContain('custom-header');
    });
  });

  describe('User Interactions', () => {
    it('should emit click event when clickable', async () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: true,
        },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.length).toBe(1);
    });

    it('should not emit click event when not clickable', async () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: false,
        },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('should emit keydown event', async () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: true,
        },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('keydown')).toBeTruthy();
      expect(wrapper.emitted('keydown')?.length).toBe(1);
    });

    it('should show hover state when clickable', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: true,
        },
        slots: { title: 'Test' },
      });

      expect(wrapper.classes()).toContain('cursor-pointer');
      expect(wrapper.classes()).toContain('hover:bg-[var(--bg-elevated)]');
    });

    it('should not show hover state when not clickable', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: false,
        },
        slots: { title: 'Test' },
      });

      expect(wrapper.classes()).not.toContain('cursor-pointer');
      expect(wrapper.classes()).not.toContain('hover:bg-[var(--bg-elevated)]');
    });
  });

  describe('Toggle Icon State', () => {
    it('should show collapsed icon state when not expanded', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: true,
        },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-panel-toggle"]');
      expect(toggle.classes()).not.toContain('rotate-180');
    });

    it('should show expanded icon state when expanded', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: true,
          clickable: true,
        },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-panel-toggle"]');
      expect(toggle.classes()).toContain('rotate-180');
    });

    it('should transition icon rotation', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: true,
        },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-panel-toggle"]');
      expect(toggle.classes()).toContain('transition-transform');
      expect(toggle.classes()).toContain('duration-300');
    });
  });

  describe('Props', () => {
    it('should accept expanded prop', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: true, clickable: true },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-panel-toggle"]');
      expect(toggle.classes()).toContain('rotate-180');
    });

    it('should accept clickable prop', () => {
      const clickableWrapper = mount(VrlPanelHeader, {
        props: { expanded: false, clickable: true },
        slots: { title: 'Test' },
      });

      const nonClickableWrapper = mount(VrlPanelHeader, {
        props: { expanded: false, clickable: false },
        slots: { title: 'Test' },
      });

      expect(clickableWrapper.classes()).toContain('cursor-pointer');
      expect(nonClickableWrapper.classes()).not.toContain('cursor-pointer');
    });

    it('should default clickable to false', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: { title: 'Test' },
      });

      expect(wrapper.classes()).not.toContain('cursor-pointer');
    });
  });

  describe('Slots', () => {
    it('should render title slot', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: { title: '<span class="custom-title">Custom Title</span>' },
      });

      expect(wrapper.find('.custom-title').exists()).toBe(true);
      expect(wrapper.text()).toContain('Custom Title');
    });

    it('should render actions slot', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: {
          title: 'Title',
          actions: '<button class="action-btn">Edit</button>',
        },
      });

      expect(wrapper.find('.action-btn').exists()).toBe(true);
    });

    it('should render both title and actions slots together', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: {
          title: 'Panel Title',
          actions: '<button>Action</button>',
        },
      });

      expect(wrapper.text()).toContain('Panel Title');
      expect(wrapper.find('button').exists()).toBe(true);
    });

    it('should handle empty title slot', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: { title: '' },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should handle multiple action buttons', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: {
          title: 'Test',
          actions: `
            <button class="btn-1">Action 1</button>
            <button class="btn-2">Action 2</button>
          `,
        },
      });

      expect(wrapper.find('.btn-1').exists()).toBe(true);
      expect(wrapper.find('.btn-2').exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle click event with clickable=false gracefully', async () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: false,
        },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('click');
      // Should not crash, just not emit
      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('should pass through additional attributes', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        attrs: { 'data-custom': 'value' },
        slots: { title: 'Test' },
      });

      expect(wrapper.attributes('data-custom')).toBe('value');
    });

    it('should apply transition classes to toggle icon', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: {
          expanded: false,
          clickable: true,
        },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-panel-toggle"]');
      expect(toggle.classes()).toContain('transition-transform');
      expect(toggle.classes()).toContain('duration-300');
    });

    it('should have proper element structure', () => {
      const wrapper = mount(VrlPanelHeader, {
        props: { expanded: false },
        slots: {
          title: 'Test Title',
          actions: '<button>Action</button>',
        },
      });

      // Should have main container
      const header = wrapper.find('[data-test="vrl-panel-header"]');
      expect(header.exists()).toBe(true);

      // Should have title section
      const titleSection = header.find('.font-display');
      expect(titleSection.exists()).toBe(true);

      // Should have actions section
      const actionsSection = header.find('.flex.items-center.gap-2');
      expect(actionsSection.exists()).toBe(true);
    });
  });
});
