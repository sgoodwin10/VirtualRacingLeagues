import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlSpinner from './VrlSpinner.vue';

describe('VrlSpinner', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      const wrapper = mount(VrlSpinner);

      expect(wrapper.find('[data-test="spinner"]').exists()).toBe(true);
    });

    it('should have proper ARIA attributes', () => {
      const wrapper = mount(VrlSpinner);

      const spinner = wrapper.find('[data-test="spinner"]');
      expect(spinner.attributes('role')).toBe('status');
      expect(spinner.attributes('aria-label')).toBe('Loading');
    });

    it('should render screen reader text', () => {
      const wrapper = mount(VrlSpinner);

      const srText = wrapper.find('.sr-only');
      expect(srText.exists()).toBe(true);
      expect(srText.text()).toBe('Loading');
    });
  });

  describe('size prop', () => {
    it('should apply default size (24px, 3px)', () => {
      const wrapper = mount(VrlSpinner);

      const spinner = wrapper.find('[data-test="spinner"]').element as HTMLElement;
      expect(spinner.style.width).toBe('24px');
      expect(spinner.style.height).toBe('24px');
      expect(spinner.style.borderWidth).toBe('3px');
    });

    it('should apply sm size (16px, 2px)', () => {
      const wrapper = mount(VrlSpinner, {
        props: { size: 'sm' },
      });

      const spinner = wrapper.find('[data-test="spinner"]').element as HTMLElement;
      expect(spinner.style.width).toBe('16px');
      expect(spinner.style.height).toBe('16px');
      expect(spinner.style.borderWidth).toBe('2px');
    });

    it('should apply lg size (40px, 4px)', () => {
      const wrapper = mount(VrlSpinner, {
        props: { size: 'lg' },
      });

      const spinner = wrapper.find('[data-test="spinner"]').element as HTMLElement;
      expect(spinner.style.width).toBe('40px');
      expect(spinner.style.height).toBe('40px');
      expect(spinner.style.borderWidth).toBe('4px');
    });
  });

  describe('color prop', () => {
    it('should apply default color (var(--cyan))', () => {
      const wrapper = mount(VrlSpinner);

      const spinner = wrapper.find('[data-test="spinner"]').element as HTMLElement;
      expect(spinner.style.borderTopColor).toBe('var(--cyan)');
    });

    it('should apply custom color', () => {
      const wrapper = mount(VrlSpinner, {
        props: { color: 'var(--green)' },
      });

      const spinner = wrapper.find('[data-test="spinner"]').element as HTMLElement;
      expect(spinner.style.borderTopColor).toBe('var(--green)');
    });
  });

  describe('thickness prop', () => {
    it('should use default thickness based on size', () => {
      const wrapper = mount(VrlSpinner, {
        props: { size: 'default' },
      });

      const spinner = wrapper.find('[data-test="spinner"]').element as HTMLElement;
      expect(spinner.style.borderWidth).toBe('3px');
    });

    it('should apply custom thickness', () => {
      const wrapper = mount(VrlSpinner, {
        props: { thickness: '5px' },
      });

      const spinner = wrapper.find('[data-test="spinner"]').element as HTMLElement;
      expect(spinner.style.borderWidth).toBe('5px');
    });

    it('should override default thickness with custom value', () => {
      const wrapper = mount(VrlSpinner, {
        props: { size: 'sm', thickness: '4px' },
      });

      const spinner = wrapper.find('[data-test="spinner"]').element as HTMLElement;
      expect(spinner.style.borderWidth).toBe('4px');
    });
  });

  describe('centered prop', () => {
    it('should not be centered by default', () => {
      const wrapper = mount(VrlSpinner);

      expect(wrapper.classes()).not.toContain('flex');
      expect(wrapper.find('[data-test="spinner"]').exists()).toBe(true);
    });

    it('should render with container when centered', () => {
      const wrapper = mount(VrlSpinner, {
        props: { centered: true },
      });

      expect(wrapper.classes()).toContain('flex');
      expect(wrapper.classes()).toContain('items-center');
      expect(wrapper.classes()).toContain('justify-center');
      expect(wrapper.find('[data-test="spinner"]').exists()).toBe(true);
    });
  });

  describe('label prop', () => {
    it('should use default label "Loading"', () => {
      const wrapper = mount(VrlSpinner);

      const spinner = wrapper.find('[data-test="spinner"]');
      expect(spinner.attributes('aria-label')).toBe('Loading');
      expect(wrapper.find('.sr-only').text()).toBe('Loading');
    });

    it('should apply custom label', () => {
      const wrapper = mount(VrlSpinner, {
        props: { label: 'Loading data' },
      });

      const spinner = wrapper.find('[data-test="spinner"]');
      expect(spinner.attributes('aria-label')).toBe('Loading data');
      expect(wrapper.find('.sr-only').text()).toBe('Loading data');
    });
  });

  describe('combined props', () => {
    it('should apply all custom props together', () => {
      const wrapper = mount(VrlSpinner, {
        props: {
          size: 'lg',
          color: 'var(--purple)',
          thickness: '6px',
          centered: true,
          label: 'Processing',
        },
      });

      expect(wrapper.classes()).toContain('flex');

      const spinner = wrapper.find('[data-test="spinner"]').element as HTMLElement;
      expect(spinner.style.width).toBe('40px');
      expect(spinner.style.height).toBe('40px');
      expect(spinner.style.borderWidth).toBe('6px');
      expect(spinner.style.borderTopColor).toBe('var(--purple)');

      expect(wrapper.find('[data-test="spinner"]').attributes('aria-label')).toBe('Processing');
      expect(wrapper.find('.sr-only').text()).toBe('Processing');
    });
  });
});
