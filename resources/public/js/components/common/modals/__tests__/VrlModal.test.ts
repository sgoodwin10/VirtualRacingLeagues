import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import VrlModal from '../VrlModal.vue';
import PrimeVue from 'primevue/config';
import Dialog from 'primevue/dialog';

describe('VrlModal', () => {
  let wrapper: VueWrapper;

  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlModal, {
      props: {
        visible: false,
        ...props,
      },
      slots,
      global: {
        plugins: [PrimeVue],
        stubs: {
          Dialog: Dialog,
        },
      },
    });
  };

  beforeEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render PrimeVue Dialog component', () => {
      wrapper = createWrapper();
      expect(wrapper.findComponent(Dialog).exists()).toBe(true);
    });

    it('should render with visible prop', async () => {
      wrapper = createWrapper({ visible: true });
      await nextTick();
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('visible')).toBe(true);
    });

    it('should render with title prop', () => {
      wrapper = createWrapper({
        visible: true,
        title: 'Test Modal Title',
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('header')).toBe('Test Modal Title');
    });

    it('should render default slot content', () => {
      wrapper = createWrapper(
        { visible: true },
        { default: '<p class="test-content">Modal content</p>' },
      );
      expect(wrapper.html()).toContain('Modal content');
    });

    it('should render footer slot content', () => {
      wrapper = createWrapper(
        { visible: true },
        { footer: '<div class="test-footer">Footer content</div>' },
      );
      expect(wrapper.html()).toContain('Footer content');
    });

    it('should render header slot content', () => {
      wrapper = createWrapper(
        { visible: true },
        { header: '<h2 class="test-header">Custom Header</h2>' },
      );
      expect(wrapper.html()).toContain('Custom Header');
    });
  });

  describe('Props', () => {
    it('should apply custom width class', () => {
      wrapper = createWrapper({
        visible: true,
        width: 'xl',
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.attributes('class')).toMatch('max-w-xl');
    });

    it('should apply sm width class', () => {
      wrapper = createWrapper({
        visible: true,
        width: 'sm',
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.attributes('class')).toMatch('max-w-sm');
    });

    it('should apply 2xl width class', () => {
      wrapper = createWrapper({
        visible: true,
        width: '2xl',
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.attributes('class')).toMatch('max-w-2xl');
    });

    it('should apply custom CSS class', () => {
      wrapper = createWrapper({
        visible: true,
        class: 'custom-modal-class',
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.attributes('class')).toMatch('custom-modal-class');
    });

    it('should set closable prop', () => {
      wrapper = createWrapper({
        visible: true,
        closable: true,
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('closable')).toBe(true);
    });

    it('should set closable to false', () => {
      wrapper = createWrapper({
        visible: true,
        closable: false,
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('closable')).toBe(false);
    });

    it('should set closeOnBackdrop prop', () => {
      wrapper = createWrapper({
        visible: true,
        closeOnBackdrop: true,
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('dismissableMask')).toBe(true);
    });

    it('should set blockScroll prop', () => {
      wrapper = createWrapper({
        visible: true,
        blockScroll: true,
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('blockScroll')).toBe(true);
    });

    it('should set maximizable prop', () => {
      wrapper = createWrapper({
        visible: true,
        maximizable: true,
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('maximizable')).toBe(true);
    });

    it('should set position prop', () => {
      wrapper = createWrapper({
        visible: true,
        position: 'top',
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('position')).toBe('top');
    });

    it('should set ariaLabel prop', () => {
      wrapper = createWrapper({
        visible: true,
        ariaLabel: 'Custom modal label',
      });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.attributes('aria-label')).toBe('Custom modal label');
    });
  });

  describe('Events', () => {
    it('should emit update:visible when visibility changes', async () => {
      wrapper = createWrapper({
        visible: true,
      });

      const dialog = wrapper.findComponent(Dialog);
      await dialog.vm.$emit('update:visible', false);

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('should emit close event when closing', async () => {
      wrapper = createWrapper({
        visible: true,
      });

      const dialog = wrapper.findComponent(Dialog);
      await dialog.vm.$emit('update:visible', false);

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit show event', async () => {
      wrapper = createWrapper({
        visible: true,
      });

      const dialog = wrapper.findComponent(Dialog);
      await dialog.vm.$emit('show');

      expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('should emit hide event', async () => {
      wrapper = createWrapper({
        visible: true,
      });

      const dialog = wrapper.findComponent(Dialog);
      await dialog.vm.$emit('hide');

      expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('should emit after-hide event', async () => {
      wrapper = createWrapper({
        visible: true,
      });

      const dialog = wrapper.findComponent(Dialog);
      await dialog.vm.$emit('after-hide');

      expect(wrapper.emitted('after-hide')).toBeTruthy();
    });
  });

  describe('Default Props', () => {
    it('should have default width of lg', () => {
      wrapper = createWrapper({ visible: true });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.attributes('class')).toMatch('max-w-lg');
    });

    it('should have closable default to true', () => {
      wrapper = createWrapper({ visible: true });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('closable')).toBe(true);
    });

    it('should have closeOnBackdrop default to false', () => {
      wrapper = createWrapper({ visible: true });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('dismissableMask')).toBe(false);
    });

    it('should have blockScroll default to true', () => {
      wrapper = createWrapper({ visible: true });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('blockScroll')).toBe(true);
    });

    it('should have maximizable default to false', () => {
      wrapper = createWrapper({ visible: true });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('maximizable')).toBe(false);
    });

    it('should have position default to center', () => {
      wrapper = createWrapper({ visible: true });
      const dialog = wrapper.findComponent(Dialog);
      expect(dialog.props('position')).toBe('center');
    });
  });

  describe('PassThrough Configuration', () => {
    it('should apply VRL modal classes through PT', () => {
      wrapper = createWrapper({ visible: true });
      const dialog = wrapper.findComponent(Dialog);
      const pt = dialog.props('pt') as Record<string, unknown>;

      expect(pt).toBeDefined();
      expect(pt.root).toBeDefined();
    });
  });
});
