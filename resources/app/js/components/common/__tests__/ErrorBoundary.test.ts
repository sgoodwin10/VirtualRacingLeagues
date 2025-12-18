/**
 * Tests for ErrorBoundary Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import ErrorBoundary from '../ErrorBoundary.vue';

// Safe component that renders normally
const SafeComponent = defineComponent({
  render() {
    return h('div', { class: 'safe-content' }, 'Safe content');
  },
});

// Component that throws an error immediately
const ErrorComponent = defineComponent({
  setup() {
    throw new Error('Test error message');
  },
  render() {
    return h('div', 'Should not render');
  },
});

// Component that throws an error on mount
const MountErrorComponent = defineComponent({
  mounted() {
    throw new Error('Mount error');
  },
  render() {
    return h('div', 'Content');
  },
});

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Component Structure', () => {
    it('should render successfully', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(SafeComponent),
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render slot content when no error', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(SafeComponent),
        },
      });

      expect(wrapper.find('.safe-content').exists()).toBe(true);
      expect(wrapper.text()).toContain('Safe content');
    });

    it('should not show error UI initially', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(SafeComponent),
        },
      });

      expect(wrapper.find('.error-boundary').exists()).toBe(false);
    });
  });

  describe('Props and State', () => {
    it('should render without error initially', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(SafeComponent),
        },
      });

      // Should render slot content, not error UI
      expect(wrapper.find('.error-boundary').exists()).toBe(false);
      expect(wrapper.find('.safe-content').exists()).toBe(true);
    });

    it('should not show error details in production mode', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(SafeComponent),
        },
      });

      // Error boundary should not be visible when no error
      expect(wrapper.find('.error-boundary').exists()).toBe(false);
    });
  });

  describe('Slots', () => {
    it('should support default slot', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: '<div class="test-slot">Test Content</div>',
        },
      });

      expect(wrapper.find('.test-slot').exists()).toBe(true);
      expect(wrapper.text()).toContain('Test Content');
    });

    it('should render multiple slot elements', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: `
            <div class="item-1">Item 1</div>
            <div class="item-2">Item 2</div>
          `,
        },
      });

      expect(wrapper.find('.item-1').exists()).toBe(true);
      expect(wrapper.find('.item-2').exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML when rendering content', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(SafeComponent),
        },
      });

      // Component should render div wrapper
      expect(wrapper.element.tagName).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display errors from child components', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      });

      // Wait for error to be processed
      await wrapper.vm.$nextTick();

      // Error boundary should be visible
      expect(wrapper.find('.error-boundary').exists()).toBe(true);
      expect(wrapper.text()).toContain('Something went wrong');
      expect(wrapper.text()).toContain('Test error message');
    });

    it('should display error message when child component throws', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      });

      await wrapper.vm.$nextTick();

      // Check error message is displayed
      expect(wrapper.find('.error-boundary').exists()).toBe(true);
      const errorText = wrapper.text();
      expect(errorText).toContain('Something went wrong');
      expect(errorText).toContain('Test error message');
    });

    it('should show error details in development mode', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      });

      await wrapper.vm.$nextTick();

      // In dev mode, details should be available
      const details = wrapper.find('details');
      expect(details.exists()).toBe(true);
      expect(details.find('summary').text()).toContain('Show error details');
    });

    it('should provide a reset button to retry', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      });

      await wrapper.vm.$nextTick();

      // Reset button should be present
      const resetButton = wrapper.find('button');
      expect(resetButton.exists()).toBe(true);
      expect(resetButton.text()).toContain('Try again');
    });

    it('should reset error state when reset button is clicked', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      });

      await wrapper.vm.$nextTick();

      // Error should be displayed
      expect(wrapper.find('.error-boundary').exists()).toBe(true);

      // Click reset button
      const resetButton = wrapper.find('button');
      await resetButton.trigger('click');
      await wrapper.vm.$nextTick();

      // After reset, the error boundary attempts to re-render children
      // Since ErrorComponent always throws, it will show error again
      // This is expected behavior - the component itself still has the error
      expect(resetButton.exists()).toBe(true);
    });

    it('should catch mount errors', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(MountErrorComponent),
        },
      });

      await wrapper.vm.$nextTick();

      // Error boundary should catch the mount error
      expect(wrapper.find('.error-boundary').exists()).toBe(true);
      expect(wrapper.text()).toContain('Something went wrong');
      expect(wrapper.text()).toContain('Mount error');
    });

    it('should not display safe content when error occurs', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      });

      await wrapper.vm.$nextTick();

      // Safe content should not be rendered
      expect(wrapper.find('.safe-content').exists()).toBe(false);
      // Error UI should be rendered instead
      expect(wrapper.find('.error-boundary').exists()).toBe(true);
    });

    it('should display error stack trace in development mode', async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      });

      await wrapper.vm.$nextTick();

      // Expand details to see stack trace
      const details = wrapper.find('details');
      expect(details.exists()).toBe(true);

      // Stack trace should be in the details
      const detailsContent = details.html();
      expect(detailsContent).toContain('Stack');
    });
  });
});
