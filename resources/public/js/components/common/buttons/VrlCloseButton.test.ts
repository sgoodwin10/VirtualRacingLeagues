import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlCloseButton from './VrlCloseButton.vue';

describe('VrlCloseButton', () => {
  let wrapper: VueWrapper;

  const createWrapper = (props = {}, slots = {}) => {
    return mount(VrlCloseButton, {
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
    it('should render close button', () => {
      wrapper = createWrapper();
      expect(wrapper.find('.vrl-close-button').exists()).toBe(true);
    });

    it('should render default close icon', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('×');
    });

    it('should render custom slot content', () => {
      wrapper = createWrapper({}, { default: '<span class="custom-icon">X</span>' });
      expect(wrapper.html()).toContain('custom-icon');
    });

    it('should be a button element', () => {
      wrapper = createWrapper();
      expect(wrapper.element.tagName).toBe('BUTTON');
    });

    it('should have type="button"', () => {
      wrapper = createWrapper();
      expect(wrapper.attributes('type')).toBe('button');
    });
  });

  describe('Props', () => {
    it('should apply custom CSS class', () => {
      wrapper = createWrapper({ class: 'custom-close-class' });
      expect(wrapper.classes()).toContain('custom-close-class');
    });

    it('should apply sm size class', () => {
      wrapper = createWrapper({ size: 'sm' });
      expect(wrapper.classes()).toContain('w-6');
      expect(wrapper.classes()).toContain('h-6');
    });

    it('should apply md size class (default)', () => {
      wrapper = createWrapper({ size: 'md' });
      expect(wrapper.classes()).toContain('w-8');
      expect(wrapper.classes()).toContain('h-8');
    });

    it('should apply lg size class', () => {
      wrapper = createWrapper({ size: 'lg' });
      expect(wrapper.classes()).toContain('w-10');
      expect(wrapper.classes()).toContain('h-10');
    });

    it('should apply default variant class', () => {
      wrapper = createWrapper({ variant: 'default' });
      expect(wrapper.classes()).toContain('bg-[var(--bg-elevated)]');
      expect(wrapper.classes()).toContain('text-[var(--text-secondary)]');
    });

    it('should apply danger variant class', () => {
      wrapper = createWrapper({ variant: 'danger' });
      expect(wrapper.classes()).toContain('bg-red-500/10');
      expect(wrapper.classes()).toContain('text-red-400');
    });

    it('should apply ghost variant class', () => {
      wrapper = createWrapper({ variant: 'ghost' });
      expect(wrapper.classes()).toContain('bg-transparent');
      expect(wrapper.classes()).toContain('text-[var(--text-secondary)]');
    });

    it('should apply custom aria-label', () => {
      wrapper = createWrapper({ ariaLabel: 'Close dialog' });
      expect(wrapper.attributes('aria-label')).toBe('Close dialog');
    });

    it('should have default aria-label of "Close"', () => {
      wrapper = createWrapper();
      expect(wrapper.attributes('aria-label')).toBe('Close');
    });
  });

  describe('Events', () => {
    it('should emit click event when clicked', async () => {
      wrapper = createWrapper();
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    });

    it('should pass MouseEvent in click event', async () => {
      wrapper = createWrapper();
      await wrapper.trigger('click');
      const emittedEvents = wrapper.emitted('click');
      expect(emittedEvents).toBeTruthy();
      expect(emittedEvents?.[0][0]).toBeInstanceOf(MouseEvent);
    });
  });

  describe('Styling', () => {
    it('should apply VRL close button classes', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('vrl-close-button');
      expect(wrapper.classes()).toContain('inline-flex');
      expect(wrapper.classes()).toContain('items-center');
      expect(wrapper.classes()).toContain('justify-center');
      expect(wrapper.classes()).toContain('rounded-md');
      expect(wrapper.classes()).toContain('transition-all');
      expect(wrapper.classes()).toContain('cursor-pointer');
      expect(wrapper.classes()).toContain('border-none');
    });

    it('should have focus-visible styles', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('focus-visible:outline-2');
      expect(wrapper.classes()).toContain('focus-visible:outline-[var(--cyan)]');
      expect(wrapper.classes()).toContain('focus-visible:outline-offset-2');
    });
  });

  describe('Defaults', () => {
    it('should have md size by default', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('w-8');
      expect(wrapper.classes()).toContain('h-8');
    });

    it('should have default variant by default', () => {
      wrapper = createWrapper();
      expect(wrapper.classes()).toContain('bg-[var(--bg-elevated)]');
    });
  });
});
