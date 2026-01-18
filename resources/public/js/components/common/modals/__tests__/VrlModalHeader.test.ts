import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlModalHeader from '../VrlModalHeader.vue';
import VrlCloseButton from '@public/components/common/buttons/VrlCloseButton.vue';

describe('VrlModalHeader', () => {
  let wrapper: VueWrapper;

  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlModalHeader, {
      props: {
        ...props,
      },
      slots,
      global: {
        stubs: {
          VrlCloseButton: VrlCloseButton,
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
    it('should render modal header', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-test="vrl-modal-header"]').exists()).toBe(true);
    });

    it('should render title prop', () => {
      wrapper = createWrapper({ title: 'Test Title' });
      expect(wrapper.find('[data-test="vrl-modal-title"]').text()).toBe('Test Title');
    });

    it('should render default slot content', () => {
      wrapper = createWrapper({}, { default: 'Custom Title Content' });
      expect(wrapper.find('[data-test="vrl-modal-title"]').text()).toBe('Custom Title Content');
    });

    it('should render close button when closable is true', () => {
      wrapper = createWrapper({ closable: true });
      expect(wrapper.findComponent(VrlCloseButton).exists()).toBe(true);
    });

    it('should not render close button when closable is false', () => {
      wrapper = createWrapper({ closable: false });
      expect(wrapper.findComponent(VrlCloseButton).exists()).toBe(false);
    });

    it('should render custom close button slot', () => {
      wrapper = createWrapper({ closable: true }, { close: '<span class="custom-close">X</span>' });
      expect(wrapper.html()).toContain('custom-close');
    });
  });

  describe('Props', () => {
    it('should apply custom CSS class', () => {
      wrapper = createWrapper({ class: 'custom-header-class' });
      expect(wrapper.classes()).toContain('custom-header-class');
    });

    it('should have closable default to true', () => {
      wrapper = createWrapper();
      expect(wrapper.findComponent(VrlCloseButton).exists()).toBe(true);
    });
  });

  describe('Events', () => {
    it('should emit close event when close button is clicked', async () => {
      wrapper = createWrapper({ closable: true });
      const closeButton = wrapper.findComponent(VrlCloseButton);

      await closeButton.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should apply VRL modal header classes', () => {
      wrapper = createWrapper();
      expect(wrapper.attributes('data-test')).toBe('vrl-modal-header');
      expect(wrapper.classes()).toContain('flex');
      expect(wrapper.classes()).toContain('items-center');
      expect(wrapper.classes()).toContain('justify-between');
    });

    it('should apply VRL modal title classes', () => {
      wrapper = createWrapper({ title: 'Test' });
      const title = wrapper.find('[data-test="vrl-modal-title"]');
      expect(title.classes()).toContain('font-display');
    });
  });
});
