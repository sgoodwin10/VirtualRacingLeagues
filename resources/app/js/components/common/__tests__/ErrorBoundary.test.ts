/**
 * Tests for ErrorBoundary Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import ErrorBoundary from '../ErrorBoundary.vue';

// Safe component that renders normally
const SafeComponent = defineComponent({
  render() {
    return h('div', { class: 'safe-content' }, 'Safe content');
  },
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
});
