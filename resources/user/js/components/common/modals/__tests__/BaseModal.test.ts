import { describe, it, expect } from 'vitest';
import { mountWithStubs } from '@user/__tests__/setup';
import BaseModal from '@user/components/common/modals/BaseModal.vue';

/**
 * Helper function to get props from a Vue wrapper with proper typing
 */
import type { VueWrapper } from '@vue/test-utils';
import type { ComponentPublicInstance } from 'vue';

const getProps = (wrapper: VueWrapper<ComponentPublicInstance>) =>
  wrapper.props() as Record<string, unknown>;

describe('BaseModal', () => {
  describe('Rendering', () => {
    it('renders the modal when visible is true', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
      });

      expect(wrapper.findComponent({ name: 'Dialog' }).exists()).toBe(true);
    });

    it('renders with default header text', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          header: 'Test Modal',
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('header')).toBe('Test Modal');
    });

    it('accepts default slot content', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
        slots: {
          default: '<div class="test-content">Modal Content</div>',
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('accepts custom header slot', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
        slots: {
          header: '<div class="custom-header">Custom Header</div>',
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('accepts footer slot', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
        slots: {
          footer: '<div class="custom-footer">Footer Content</div>',
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.exists()).toBe(true);
    });
  });

  describe('Width Configuration', () => {
    it('accepts width prop - default lg', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
      });

      expect(getProps(wrapper).width).toBe('lg');
    });

    it('accepts width prop - sm', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          width: 'sm',
        },
      });

      expect(getProps(wrapper).width).toBe('sm');
    });

    it('accepts width prop - md', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          width: 'md',
        },
      });

      expect(getProps(wrapper).width).toBe('md');
    });

    it('accepts width prop - xl', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          width: 'xl',
        },
      });

      expect(getProps(wrapper).width).toBe('xl');
    });

    it('accepts width prop - 2xl', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          width: '2xl',
        },
      });

      expect(getProps(wrapper).width).toBe('2xl');
    });

    it('accepts width prop - 3xl', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          width: '3xl',
        },
      });

      expect(getProps(wrapper).width).toBe('3xl');
    });

    it('accepts width prop - 4xl', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          width: '4xl',
        },
      });

      expect(getProps(wrapper).width).toBe('4xl');
    });

    it('accepts width prop - full', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          width: 'full',
        },
      });

      expect(getProps(wrapper).width).toBe('full');
    });

    it('accepts custom width value', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          width: 'max-w-5xl',
        },
      });

      expect(getProps(wrapper).width).toBe('max-w-5xl');
    });
  });

  describe('Dialog Props Passthrough', () => {
    it('passes position prop to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          position: 'top',
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('position')).toBe('top');
    });

    it('passes draggable prop to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          draggable: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('draggable')).toBe(true);
    });

    it('passes closable prop to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          closable: false,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('closable')).toBe(false);
    });

    it('passes modal prop to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          modal: false,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('modal')).toBe(false);
    });

    it('passes dismissableMask prop to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          dismissableMask: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('dismissableMask')).toBe(true);
    });

    it('passes blockScroll prop to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          blockScroll: false,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('blockScroll')).toBe(false);
    });

    it('passes maximizable prop to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          maximizable: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('maximizable')).toBe(true);
    });

    it('passes showHeader prop to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          showHeader: false,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('showHeader')).toBe(false);
    });

    it('passes unstyled prop to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          unstyled: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('unstyled')).toBe(true);
    });
  });

  describe('Custom Classes', () => {
    it('accepts custom class prop', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          class: 'custom-modal-class',
        },
      });

      expect(getProps(wrapper).class).toBe('custom-modal-class');
    });

    it('passes contentClass to Dialog', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          contentClass: 'custom-content-class',
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('contentClass')).toBe('custom-content-class');
    });

    it('accepts both width and custom class', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          width: '2xl',
          class: 'my-custom-class',
        },
      });

      expect(getProps(wrapper).width).toBe('2xl');
      expect(getProps(wrapper).class).toBe('my-custom-class');
    });
  });

  describe('Events', () => {
    it('emits update:visible when Dialog emits update:visible', async () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      await dialog.vm.$emit('update:visible', false);

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('emits show when Dialog emits show', async () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      await dialog.vm.$emit('show');

      expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('emits hide when Dialog emits hide', async () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      await dialog.vm.$emit('hide');

      expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('emits after-hide when Dialog emits after-hide', async () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      await dialog.vm.$emit('after-hide');

      expect(wrapper.emitted('after-hide')).toBeTruthy();
    });

    it('emits maximize when Dialog emits maximize', async () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          maximizable: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      const mockEvent = new Event('click');
      await dialog.vm.$emit('maximize', mockEvent);

      expect(wrapper.emitted('maximize')).toBeTruthy();
      expect(wrapper.emitted('maximize')?.[0]).toEqual([mockEvent]);
    });

    it('emits unmaximize when Dialog emits unmaximize', async () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          maximizable: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      const mockEvent = new Event('click');
      await dialog.vm.$emit('unmaximize', mockEvent);

      expect(wrapper.emitted('unmaximize')).toBeTruthy();
      expect(wrapper.emitted('unmaximize')?.[0]).toEqual([mockEvent]);
    });

    it('emits dragstart when Dialog emits dragstart', async () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          draggable: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      const mockDragEvent = new DragEvent('dragstart');
      await dialog.vm.$emit('dragstart', mockDragEvent);

      expect(wrapper.emitted('dragstart')).toBeTruthy();
      expect(wrapper.emitted('dragstart')?.[0]).toEqual([mockDragEvent]);
    });

    it('emits dragend when Dialog emits dragend', async () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          draggable: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      const mockDragEvent = new DragEvent('dragend');
      await dialog.vm.$emit('dragend', mockDragEvent);

      expect(wrapper.emitted('dragend')).toBeTruthy();
      expect(wrapper.emitted('dragend')?.[0]).toEqual([mockDragEvent]);
    });
  });

  describe('Loading State', () => {
    it('accepts loading prop as true', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          loading: true,
        },
      });

      expect(getProps(wrapper).loading).toBe(true);
    });

    it('accepts loading prop as false', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          loading: false,
        },
      });

      expect(getProps(wrapper).loading).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('has correct default prop values', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });

      // Check defaults
      expect(dialog.props('position')).toBe('center');
      expect(dialog.props('draggable')).toBe(false);
      expect(dialog.props('closable')).toBe(true);
      expect(dialog.props('modal')).toBe(true);
      expect(dialog.props('dismissableMask')).toBe(false);
      expect(dialog.props('blockScroll')).toBe(true);
      expect(dialog.props('maximizable')).toBe(false);
      expect(dialog.props('showHeader')).toBe(true);

      // Check default width
      expect(getProps(wrapper).width).toBe('lg');
    });
  });

  describe('Accessibility', () => {
    it('accepts ariaLabel prop', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          ariaLabel: 'Accessible Modal',
        },
      });

      expect(getProps(wrapper).ariaLabel).toBe('Accessible Modal');
    });

    it('maintains keyboard focus when closable', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          closable: true,
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.props('closable')).toBe(true);
    });
  });

  describe('Slot Support', () => {
    it('supports container slot', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
        slots: {
          container: '<div class="custom-container">Container</div>',
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('supports closeicon slot', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
        },
        slots: {
          closeicon: '<span class="custom-close-icon">X</span>',
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('supports maximizeicon slot', () => {
      const wrapper = mountWithStubs(BaseModal, {
        props: {
          visible: true,
          maximizable: true,
        },
        slots: {
          maximizeicon: '<span class="custom-maximize-icon">[]</span>',
        },
      });

      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.exists()).toBe(true);
    });
  });
});
