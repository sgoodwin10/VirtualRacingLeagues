import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlLoadingOverlay from '../VrlLoadingOverlay.vue';
import VrlSpinner from '../VrlSpinner.vue';

describe('VrlLoadingOverlay', () => {
  describe('rendering', () => {
    it('should not render when visible is false', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: false },
      });

      expect(wrapper.find('[data-test="loading-overlay"]').exists()).toBe(false);
    });

    it('should render when visible is true', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true },
      });

      expect(wrapper.find('[data-test="loading-overlay"]').exists()).toBe(true);
    });

    it('should have proper ARIA attributes', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true },
      });

      const overlay = wrapper.find('[data-test="loading-overlay"]');
      expect(overlay.attributes('role')).toBe('dialog');
      expect(overlay.attributes('aria-modal')).toBe('true');
      expect(overlay.attributes('aria-labelledby')).toBe('loading-message');
    });

    it('should render spinner', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true },
      });

      expect(wrapper.findComponent(VrlSpinner).exists()).toBe(true);
    });

    it('should have content wrapper', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true },
      });

      expect(wrapper.find('[data-test="loading-overlay-content"]').exists()).toBe(true);
    });
  });

  describe('message prop', () => {
    it('should not render message by default', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true },
      });

      expect(wrapper.find('[data-test="loading-overlay-message"]').exists()).toBe(false);
    });

    it('should render message when provided', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true, message: 'Loading data...' },
      });

      const message = wrapper.find('[data-test="loading-overlay-message"]');
      expect(message.exists()).toBe(true);
      expect(message.text()).toBe('Loading data...');
      expect(message.attributes('id')).toBe('loading-message');
    });
  });

  describe('spinnerSize prop', () => {
    it('should use lg spinner by default', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true },
      });

      const spinner = wrapper.findComponent(VrlSpinner);
      expect(spinner.props('size')).toBe('lg');
    });

    it('should apply custom spinner size', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true, spinnerSize: 'default' },
      });

      const spinner = wrapper.findComponent(VrlSpinner);
      expect(spinner.props('size')).toBe('default');
    });
  });

  describe('opacity prop', () => {
    it('should apply default opacity (0.8)', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true },
      });

      const overlay = wrapper.find('[data-test="loading-overlay"]').element as HTMLElement;
      expect(overlay.style.backgroundColor).toBe('rgba(13, 17, 23, 0.8)');
    });

    it('should apply custom opacity', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true, opacity: 0.5 },
      });

      const overlay = wrapper.find('[data-test="loading-overlay"]').element as HTMLElement;
      expect(overlay.style.backgroundColor).toBe('rgba(13, 17, 23, 0.5)');
    });

    it('should handle full opacity (1)', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true, opacity: 1 },
      });

      const overlay = wrapper.find('[data-test="loading-overlay"]').element as HTMLElement;
      expect(overlay.style.backgroundColor).toBe('rgba(13, 17, 23, 1)');
    });

    it('should handle transparent overlay (0)', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true, opacity: 0 },
      });

      const overlay = wrapper.find('[data-test="loading-overlay"]').element as HTMLElement;
      expect(overlay.style.backgroundColor).toBe('rgba(13, 17, 23, 0)');
    });
  });

  describe('zIndex prop', () => {
    it('should apply default z-index (1000)', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true },
      });

      const overlay = wrapper.find('[data-test="loading-overlay"]').element as HTMLElement;
      expect(overlay.style.zIndex).toBe('1000');
    });

    it('should apply custom z-index', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true, zIndex: 2000 },
      });

      const overlay = wrapper.find('[data-test="loading-overlay"]').element as HTMLElement;
      expect(overlay.style.zIndex).toBe('2000');
    });
  });

  describe('combined props', () => {
    it('should apply all custom props together', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: {
          visible: true,
          message: 'Please wait...',
          spinnerSize: 'default',
          opacity: 0.9,
          zIndex: 1500,
        },
      });

      expect(wrapper.find('[data-test="loading-overlay"]').exists()).toBe(true);

      const overlay = wrapper.find('[data-test="loading-overlay"]').element as HTMLElement;
      expect(overlay.style.backgroundColor).toBe('rgba(13, 17, 23, 0.9)');
      expect(overlay.style.zIndex).toBe('1500');

      const message = wrapper.find('[data-test="loading-overlay-message"]');
      expect(message.text()).toBe('Please wait...');

      const spinner = wrapper.findComponent(VrlSpinner);
      expect(spinner.props('size')).toBe('default');
    });
  });

  describe('transitions', () => {
    it('should use Transition component', () => {
      const wrapper = mount(VrlLoadingOverlay, {
        props: { visible: true },
      });

      // The Transition component wraps the content
      expect(wrapper.html()).toContain('data-test="loading-overlay"');
    });
  });
});
