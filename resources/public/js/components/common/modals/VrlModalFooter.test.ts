import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlModalFooter from './VrlModalFooter.vue';

describe('VrlModalFooter', () => {
  let wrapper: VueWrapper;

  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlModalFooter, {
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
    it('should render modal footer', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-test="vrl-modal-footer"]').exists()).toBe(true);
    });

    it('should render default slot content', () => {
      wrapper = createWrapper({}, { default: '<button class="test-button">Submit</button>' });
      expect(wrapper.html()).toContain('test-button');
    });
  });

  describe('Props', () => {
    it('should apply custom CSS class', () => {
      wrapper = createWrapper({ class: 'custom-footer-class' });
      expect(wrapper.classes()).toContain('custom-footer-class');
    });

    it('should apply left alignment class', () => {
      wrapper = createWrapper({ align: 'left' });
      expect(wrapper.classes()).toContain('justify-start');
    });

    it('should apply center alignment class', () => {
      wrapper = createWrapper({ align: 'center' });
      expect(wrapper.classes()).toContain('justify-center');
    });

    it('should apply right alignment class (default)', () => {
      wrapper = createWrapper({ align: 'right' });
      expect(wrapper.classes()).toContain('justify-end');
    });

    it('should apply between alignment class', () => {
      wrapper = createWrapper({ align: 'between' });
      expect(wrapper.classes()).toContain('justify-between');
    });

    it('should apply sm gap class', () => {
      wrapper = createWrapper({ gap: 'sm' });
      expect(wrapper.classes()).toContain('gap-2');
    });

    it('should apply md gap class (default)', () => {
      wrapper = createWrapper({ gap: 'md' });
      expect(wrapper.classes()).toContain('gap-3');
    });

    it('should apply lg gap class', () => {
      wrapper = createWrapper({ gap: 'lg' });
      expect(wrapper.classes()).toContain('gap-4');
    });

    it('should have right alignment by default', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('justify-end');
    });

    it('should have md gap by default', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('gap-3');
    });
  });

  describe('Styling', () => {
    it('should apply VRL modal footer classes', () => {
      wrapper = createWrapper();
      expect(wrapper.attributes('data-test')).toBe('vrl-modal-footer');
      expect(wrapper.classes()).toContain('flex');
    });

    it('should apply background color class', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('bg-[var(--bg-panel)]');
    });

    it('should apply border class', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('border-t');
      expect(wrapper.classes()).toContain('border-[var(--border)]');
    });
  });
});
