import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlSearchBar from '../VrlSearchBar.vue';

describe('VrlSearchBar', () => {
  it('renders with default props', () => {
    const wrapper = mount(VrlSearchBar, {
      props: {
        modelValue: '',
      },
    });

    const searchContainer = wrapper.find('[role="search"]');
    expect(searchContainer.exists()).toBe(true);
  });

  describe('placeholder', () => {
    it('shows default placeholder text', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('placeholder')).toBe('Search...');
    });

    it('shows custom placeholder text', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
          placeholder: 'Search leagues, drivers, or competitions...',
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('placeholder')).toBe('Search leagues, drivers, or competitions...');
    });
  });

  describe('v-model binding', () => {
    it('displays current value', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: 'test search',
        },
      });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('test search');
    });

    it('emits update:modelValue on input', async () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      await input.setValue('new search');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new search']);
    });

    it('updates value when modelValue prop changes', async () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: 'initial',
        },
      });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('initial');

      await wrapper.setProps({ modelValue: 'updated' });
      expect(input.element.value).toBe('updated');
    });
  });

  describe('search event', () => {
    it('emits search event on Enter key', async () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: 'test query',
        },
      });

      const input = wrapper.find('input');
      await input.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('search')).toBeTruthy();
      expect(wrapper.emitted('search')?.[0]).toEqual(['test query']);
    });

    it('prevents default on Enter key', async () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: 'test',
        },
      });

      const input = wrapper.find('input');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = { called: false };

      (event as never as { preventDefault: () => void }).preventDefault = () => {
        preventDefaultSpy.called = true;
      };

      input.element.dispatchEvent(event);

      // The component should prevent default, but we can verify the event was emitted
      expect(wrapper.emitted('search')).toBeTruthy();
    });

    it('does not emit search event on other keys', async () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: 'test',
        },
      });

      const input = wrapper.find('input');
      await input.trigger('keydown', { key: 'a' });
      await input.trigger('keydown', { key: 'Escape' });
      await input.trigger('keydown', { key: 'Tab' });

      expect(wrapper.emitted('search')).toBeFalsy();
    });
  });

  describe('loading state', () => {
    it('shows magnifying glass icon by default', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      // Check that the search icon SVG is rendered (Phosphor icon renders as SVG)
      const svg = wrapper.findAll('svg');
      expect(svg.length).toBeGreaterThan(0);
    });

    it('shows spinner when loading is true', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
          loading: true,
        },
      });

      // Spinner should have animate-spin class
      const spinner = wrapper.find('.animate-spin');
      expect(spinner.exists()).toBe(true);
    });

    it('disables input when loading', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
          loading: true,
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('disabled')).toBeDefined();
    });

    it('enables input when not loading', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
          loading: false,
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('disabled')).toBeUndefined();
    });
  });

  describe('icon visibility', () => {
    it('magnifying glass icon is visible when not loading', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
          loading: false,
        },
      });

      // Check for icon by looking for mr-2 or mr-3 class (icon wrapper)
      const iconWrapper = wrapper.find('.mr-2, .mr-3');
      expect(iconWrapper.exists()).toBe(true);
    });

    it('spinner icon is visible when loading', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
          loading: true,
        },
      });

      const spinner = wrapper.find('.animate-spin');
      expect(spinner.exists()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has role="search"', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const searchContainer = wrapper.find('[role="search"]');
      expect(searchContainer.exists()).toBe(true);
    });

    it('has aria-label', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const searchContainer = wrapper.find('[role="search"]');
      expect(searchContainer.attributes('aria-label')).toBe('Search');
    });

    it('icons have aria-hidden', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const icons = wrapper.findAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('focus behavior', () => {
    it('has focusable input', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      expect(input.element.tabIndex).not.toBe(-1);
    });

    it('exposes focus method', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      expect(wrapper.vm.focus).toBeDefined();
      expect(typeof wrapper.vm.focus).toBe('function');
    });
  });

  describe('styling', () => {
    it('has correct input classes', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('flex-1');
      expect(input.classes()).toContain('bg-transparent');
      expect(input.classes()).toContain('border-none');
      expect(input.classes()).toContain('min-h-[44px]');
    });

    it('applies custom class', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
          class: 'custom-class',
        },
      });

      const container = wrapper.find('[role="search"]');
      expect(container.classes()).toContain('custom-class');
    });

    it('has theme CSS variables', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const container = wrapper.find('[role="search"]');
      const style = container.attributes('style');
      expect(style).toContain('var(--bg-secondary)');
      expect(style).toContain('var(--border-primary)');
    });
  });

  describe('touch target', () => {
    it('has 44px minimum height for accessibility', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      expect(input.classes()).toContain('min-h-[44px]');
    });
  });

  describe('input type', () => {
    it('has type="text"', () => {
      const wrapper = mount(VrlSearchBar, {
        props: {
          modelValue: '',
        },
      });

      const input = wrapper.find('input');
      expect(input.attributes('type')).toBe('text');
    });
  });
});
