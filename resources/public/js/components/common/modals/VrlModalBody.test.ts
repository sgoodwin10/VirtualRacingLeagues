import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlModalBody from './VrlModalBody.vue';

describe('VrlModalBody', () => {
  let wrapper: VueWrapper;

  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlModalBody, {
      props: {
        ...props,
      },
      slots,
    });
  };

  beforeEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render modal body', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-test="vrl-modal-body"]').exists()).toBe(true);
    });

    it('should render default slot content', () => {
      wrapper = createWrapper({}, { default: '<p class="test-content">Body content</p>' });
      expect(wrapper.html()).toContain('Body content');
    });
  });

  describe('Props', () => {
    it('should apply custom CSS class', () => {
      wrapper = createWrapper({ class: 'custom-body-class' });
      expect(wrapper.classes()).toContain('custom-body-class');
    });

    it('should apply none padding class', () => {
      wrapper = createWrapper({ padding: 'none' });
      expect(wrapper.classes()).toContain('p-0');
    });

    it('should apply sm padding class', () => {
      wrapper = createWrapper({ padding: 'sm' });
      expect(wrapper.classes()).toContain('p-4');
    });

    it('should apply md padding class (default)', () => {
      wrapper = createWrapper({ padding: 'md' });
      expect(wrapper.classes()).toContain('p-6');
    });

    it('should apply lg padding class', () => {
      wrapper = createWrapper({ padding: 'lg' });
      expect(wrapper.classes()).toContain('p-8');
    });

    it('should have md padding by default', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('p-6');
    });
  });

  describe('Styling', () => {
    it('should apply VRL modal body classes', () => {
      wrapper = createWrapper();
      expect(wrapper.attributes('data-test')).toBe('vrl-modal-body');
    });

    it('should apply background color class', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('bg-[var(--bg-card)]');
    });
  });
});
