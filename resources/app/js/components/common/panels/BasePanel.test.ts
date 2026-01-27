import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BasePanel from './BasePanel.vue';
import Panel from 'primevue/panel';

describe('BasePanel', () => {
  describe('Rendering', () => {
    it('renders the Panel component', () => {
      const wrapper = mount(BasePanel);
      expect(wrapper.findComponent(Panel).exists()).toBe(true);
    });

    it('renders default slot content', () => {
      const wrapper = mount(BasePanel, {
        slots: {
          default: '<div class="test-content">Test Content</div>',
        },
      });

      expect(wrapper.html()).toContain('Test Content');
      expect(wrapper.find('.test-content').exists()).toBe(true);
    });

    it('renders header prop as panel header', () => {
      const wrapper = mount(BasePanel, {
        props: {
          header: 'Test Header',
        },
      });

      const panel = wrapper.findComponent(Panel);
      expect(panel.props('header')).toBe('Test Header');
    });

    it('renders header slot content', () => {
      const wrapper = mount(BasePanel, {
        slots: {
          header: '<div class="custom-header">Custom Header</div>',
        },
      });

      expect(wrapper.html()).toContain('Custom Header');
      expect(wrapper.find('.custom-header').exists()).toBe(true);
    });

    it('renders footer slot content', () => {
      const wrapper = mount(BasePanel, {
        slots: {
          footer: '<div class="custom-footer">Custom Footer</div>',
        },
      });

      expect(wrapper.html()).toContain('Custom Footer');
      expect(wrapper.find('.custom-footer').exists()).toBe(true);
    });

    it('renders icons slot content', () => {
      const wrapper = mount(BasePanel, {
        slots: {
          icons: '<span class="custom-icon">Icon</span>',
        },
      });

      expect(wrapper.html()).toContain('custom-icon');
    });
  });

  describe('Props', () => {
    it('passes collapsed prop to Panel', () => {
      const wrapper = mount(BasePanel, {
        props: {
          collapsed: true,
        },
      });

      const panel = wrapper.findComponent(Panel);
      expect(panel.props('collapsed')).toBe(true);
    });

    it('passes toggleable prop to Panel', () => {
      const wrapper = mount(BasePanel, {
        props: {
          toggleable: true,
        },
      });

      const panel = wrapper.findComponent(Panel);
      expect(panel.props('toggleable')).toBe(true);
    });

    it('defaults collapsed to false', () => {
      const wrapper = mount(BasePanel);
      const panel = wrapper.findComponent(Panel);
      expect(panel.props('collapsed')).toBe(false);
    });

    it('defaults toggleable to false', () => {
      const wrapper = mount(BasePanel);
      const panel = wrapper.findComponent(Panel);
      expect(panel.props('toggleable')).toBe(false);
    });

    it('passes unstyled prop to Panel', () => {
      const wrapper = mount(BasePanel, {
        props: {
          unstyled: true,
        },
      });

      const panel = wrapper.findComponent(Panel);
      expect(panel.props('unstyled')).toBe(true);
    });

    it('passes pt prop to Panel', () => {
      const ptConfig = {
        root: { class: 'custom-root' },
      };

      const wrapper = mount(BasePanel, {
        props: {
          pt: ptConfig,
        },
      });

      const panel = wrapper.findComponent(Panel);
      expect(panel.props('pt')).toEqual(ptConfig);
    });

    it('passes ptOptions prop to Panel', () => {
      const ptOptions = {
        mergeSections: true,
        mergeProps: false,
      };

      const wrapper = mount(BasePanel, {
        props: {
          ptOptions,
        },
      });

      const panel = wrapper.findComponent(Panel);
      expect(panel.props('ptOptions')).toEqual(ptOptions);
    });

    it('applies custom class to Panel', () => {
      const wrapper = mount(BasePanel, {
        props: {
          class: 'custom-panel-class',
        },
      });

      // Check that the class is applied to the root element
      const rootElement = wrapper.find('.p-panel');
      expect(rootElement.classes()).toContain('custom-panel-class');
    });

    it('applies contentClass to content wrapper', () => {
      const wrapper = mount(BasePanel, {
        props: {
          contentClass: 'p-4 bg-gray-100',
        },
        slots: {
          default: '<div>Content</div>',
        },
      });

      const contentWrapper = wrapper.find('.p-4.bg-gray-100');
      expect(contentWrapper.exists()).toBe(true);
      expect(contentWrapper.html()).toContain('Content');
    });

    it('applies footerClass to footer wrapper', () => {
      const wrapper = mount(BasePanel, {
        props: {
          footerClass: 'p-4 border-t',
        },
        slots: {
          footer: '<div>Footer</div>',
        },
      });

      const footerWrapper = wrapper.find('.p-4.border-t');
      expect(footerWrapper.exists()).toBe(true);
      expect(footerWrapper.html()).toContain('Footer');
    });
  });

  describe('Toggleable Functionality', () => {
    it('emits toggle event when panel is toggled', async () => {
      const wrapper = mount(BasePanel, {
        props: {
          toggleable: true,
        },
      });

      const panel = wrapper.findComponent(Panel);
      const toggleEvent = {
        originalEvent: new Event('click'),
        value: true,
      };

      await panel.vm.$emit('toggle', toggleEvent);

      expect(wrapper.emitted('toggle')).toBeTruthy();
      expect(wrapper.emitted('toggle')?.[0]).toEqual([toggleEvent]);
    });

    it('emits update:collapsed event when panel is toggled', async () => {
      const wrapper = mount(BasePanel, {
        props: {
          toggleable: true,
        },
      });

      const panel = wrapper.findComponent(Panel);
      const toggleEvent = {
        originalEvent: new Event('click'),
        value: true,
      };

      await panel.vm.$emit('toggle', toggleEvent);

      expect(wrapper.emitted('update:collapsed')).toBeTruthy();
      expect(wrapper.emitted('update:collapsed')?.[0]).toEqual([true]);
    });

    it('updates local collapsed state when toggled', async () => {
      const wrapper = mount(BasePanel, {
        props: {
          toggleable: true,
          collapsed: false,
        },
      });

      const panel = wrapper.findComponent(Panel);
      const toggleEvent = {
        originalEvent: new Event('click'),
        value: true,
      };

      await panel.vm.$emit('toggle', toggleEvent);
      await wrapper.vm.$nextTick();

      expect(panel.props('collapsed')).toBe(true);
    });
  });

  describe('v-model:collapsed Support', () => {
    it('syncs with v-model:collapsed when toggled', async () => {
      const wrapper = mount(BasePanel, {
        props: {
          toggleable: true,
          collapsed: false,
          'onUpdate:collapsed': (value: boolean) => wrapper.setProps({ collapsed: value }),
        },
      });

      const panel = wrapper.findComponent(Panel);
      const toggleEvent = {
        originalEvent: new Event('click'),
        value: true,
      };

      await panel.vm.$emit('toggle', toggleEvent);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:collapsed')?.[0]).toEqual([true]);
    });

    it('updates local state when collapsed prop changes externally', async () => {
      const wrapper = mount(BasePanel, {
        props: {
          toggleable: true,
          collapsed: false,
        },
      });

      let panel = wrapper.findComponent(Panel);
      expect(panel.props('collapsed')).toBe(false);

      await wrapper.setProps({ collapsed: true });
      await wrapper.vm.$nextTick();

      panel = wrapper.findComponent(Panel);
      expect(panel.props('collapsed')).toBe(true);
    });

    it('maintains collapsed state across prop updates', async () => {
      const wrapper = mount(BasePanel, {
        props: {
          toggleable: true,
          collapsed: true,
        },
      });

      let panel = wrapper.findComponent(Panel);
      expect(panel.props('collapsed')).toBe(true);

      // Update another prop
      await wrapper.setProps({ header: 'New Header' });
      await wrapper.vm.$nextTick();

      panel = wrapper.findComponent(Panel);
      expect(panel.props('collapsed')).toBe(true);
    });
  });

  describe('Slot Props', () => {
    it('passes collapsed state to header slot', () => {
      const headerSlot = vi.fn();

      mount(BasePanel, {
        props: {
          collapsed: true,
        },
        slots: {
          header: headerSlot,
        },
      });

      expect(headerSlot).toHaveBeenCalled();
      const slotProps = headerSlot.mock.calls[0]?.[0] as { collapsed: boolean } | undefined;
      expect(slotProps).toBeDefined();
      if (slotProps) {
        expect(slotProps.collapsed).toBe(true);
      }
    });

    it('updates header slot collapsed prop when toggled', async () => {
      const headerSlot = vi.fn(() => '<div>Header</div>');

      const wrapper = mount(BasePanel, {
        props: {
          toggleable: true,
          collapsed: false,
        },
        slots: {
          header: headerSlot,
        },
      });

      // Initial call
      expect(headerSlot).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Vitest mock call typing doesn't infer slot props correctly
      const firstCall = headerSlot.mock.calls[0];
      if (firstCall && firstCall.length > 0) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Vitest mock call typing doesn't infer slot props correctly
        const slotProps = firstCall[0] as unknown as { collapsed: boolean };
        expect(slotProps.collapsed).toBe(false);
      }

      // Toggle the panel
      const panel = wrapper.findComponent(Panel);
      await panel.vm.$emit('toggle', {
        originalEvent: new Event('click'),
        value: true,
      });
      await wrapper.vm.$nextTick();

      // Should have been called again with updated state
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Vitest mock call typing doesn't infer slot props correctly
      const lastCall = headerSlot.mock.calls[headerSlot.mock.calls.length - 1];
      if (lastCall && lastCall.length > 0) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Vitest mock call typing doesn't infer slot props correctly
        const slotProps = lastCall[0] as unknown as { collapsed: boolean };
        expect(slotProps.collapsed).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles empty slots gracefully', () => {
      const wrapper = mount(BasePanel);
      expect(wrapper.html()).toBeTruthy();
    });

    it('handles multiple class strings correctly', () => {
      const wrapper = mount(BasePanel, {
        props: {
          class: 'class-one class-two',
        },
      });

      const rootElement = wrapper.find('.p-panel');
      expect(rootElement.classes()).toContain('class-one');
      expect(rootElement.classes()).toContain('class-two');
    });

    it('does not render content wrapper when no default slot provided', () => {
      const wrapper = mount(BasePanel, {
        props: {
          contentClass: 'should-not-render',
        },
      });

      expect(wrapper.find('.should-not-render').exists()).toBe(false);
    });

    it('does not render footer wrapper when no footer slot provided', () => {
      const wrapper = mount(BasePanel, {
        props: {
          footerClass: 'should-not-render',
        },
      });

      expect(wrapper.find('.should-not-render').exists()).toBe(false);
    });

    it('handles rapid toggle events correctly', async () => {
      const wrapper = mount(BasePanel, {
        props: {
          toggleable: true,
          collapsed: false,
        },
      });

      const panel = wrapper.findComponent(Panel);

      // Toggle multiple times rapidly
      await panel.vm.$emit('toggle', {
        originalEvent: new Event('click'),
        value: true,
      });
      await panel.vm.$emit('toggle', {
        originalEvent: new Event('click'),
        value: false,
      });
      await panel.vm.$emit('toggle', {
        originalEvent: new Event('click'),
        value: true,
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:collapsed')).toHaveLength(3);
      expect(wrapper.emitted('update:collapsed')?.[2]).toEqual([true]);
    });
  });

  describe('Accessibility', () => {
    it('inherits PrimeVue Panel accessibility features', () => {
      const wrapper = mount(BasePanel, {
        props: {
          header: 'Accessible Panel',
          toggleable: true,
        },
      });

      // PrimeVue Panel should handle ARIA attributes
      const panel = wrapper.findComponent(Panel);
      expect(panel.exists()).toBe(true);
    });
  });
});
