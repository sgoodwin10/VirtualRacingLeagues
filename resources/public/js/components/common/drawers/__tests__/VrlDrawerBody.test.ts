import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlDrawerBody from '../VrlDrawerBody.vue';

describe('VrlDrawerBody', () => {
  let wrapper: VueWrapper;

  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlDrawerBody, {
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
    it('should render drawer body', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-test="vrl-drawer-body"]').exists()).toBe(true);
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

    it('should apply overflow-y-auto when scrollable is true', () => {
      wrapper = createWrapper({ scrollable: true });
      expect(wrapper.classes()).toContain('overflow-y-auto');
    });

    it('should apply overflow-hidden when scrollable is false', () => {
      wrapper = createWrapper({ scrollable: false });
      expect(wrapper.classes()).toContain('overflow-hidden');
    });

    it('should be scrollable by default', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('overflow-y-auto');
    });
  });

  describe('Styling', () => {
    it('should apply VRL drawer body classes', () => {
      wrapper = createWrapper();
      expect(wrapper.attributes('data-test')).toBe('vrl-drawer-body');
      expect(wrapper.classes()).toContain('flex-1');
    });

    it('should apply background color class', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('bg-[var(--bg-card)]');
    });
  });
});
