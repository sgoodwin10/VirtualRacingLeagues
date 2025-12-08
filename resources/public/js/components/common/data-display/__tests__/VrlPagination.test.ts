import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlPagination from '../VrlPagination.vue';
import {
  PhCaretLeft,
  PhCaretRight,
  PhCaretDoubleLeft,
  PhCaretDoubleRight,
} from '@phosphor-icons/vue';

describe('VrlPagination', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      expect(wrapper.find('nav').exists()).toBe(true);
      expect(wrapper.find('nav').attributes('role')).toBe('navigation');
      expect(wrapper.find('nav').attributes('aria-label')).toBe('Pagination');
    });

    it('renders standard variant by default', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      // Should have previous and next buttons
      expect(wrapper.findComponent(PhCaretLeft).exists()).toBe(true);
      expect(wrapper.findComponent(PhCaretRight).exists()).toBe(true);

      // Should have page number buttons
      expect(wrapper.text()).toContain('1');
      expect(wrapper.text()).toContain('2');
    });
  });

  describe('Standard Variant', () => {
    it('renders all page numbers when total is 7 or less', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 7,
          variant: 'standard',
        },
      });

      expect(wrapper.text()).toContain('1');
      expect(wrapper.text()).toContain('2');
      expect(wrapper.text()).toContain('3');
      expect(wrapper.text()).toContain('4');
      expect(wrapper.text()).toContain('5');
      expect(wrapper.text()).toContain('6');
      expect(wrapper.text()).toContain('7');
    });

    it('shows ellipsis when total pages exceed 7', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 5,
          totalPages: 12,
          variant: 'standard',
        },
      });

      expect(wrapper.text()).toContain('...');
    });

    it('always shows first and last page numbers', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 5,
          totalPages: 12,
          variant: 'standard',
        },
      });

      expect(wrapper.text()).toContain('1');
      expect(wrapper.text()).toContain('12');
    });

    it('disables previous button on first page', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
          variant: 'standard',
        },
      });

      const prevButton = wrapper.find('[aria-label="Previous page"]');
      expect(prevButton.attributes('disabled')).toBeDefined();
      expect(prevButton.attributes('aria-disabled')).toBe('true');
    });

    it('disables next button on last page', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 5,
          totalPages: 5,
          variant: 'standard',
        },
      });

      const nextButton = wrapper.find('[aria-label="Next page"]');
      expect(nextButton.attributes('disabled')).toBeDefined();
      expect(nextButton.attributes('aria-disabled')).toBe('true');
    });

    it('marks current page with aria-current', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
          variant: 'standard',
        },
      });

      const buttons = wrapper.findAll('button');
      const page3Button = buttons.find((btn) => btn.text() === '3');
      expect(page3Button?.attributes('aria-current')).toBe('page');
    });
  });

  describe('Compact Variant', () => {
    it('renders compact variant correctly', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 12,
          variant: 'compact',
        },
      });

      expect(wrapper.text()).toContain('Page');
      expect(wrapper.text()).toContain('3');
      expect(wrapper.text()).toContain('of');
      expect(wrapper.text()).toContain('12');
    });

    it('shows current page in gold color', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 12,
          variant: 'compact',
        },
      });

      const html = wrapper.html();
      expect(html).toContain('text-[var(--accent-gold)]');
    });

    it('has previous and next buttons only', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 12,
          variant: 'compact',
        },
      });

      const buttons = wrapper.findAll('button');
      expect(buttons).toHaveLength(2); // Only prev and next
    });
  });

  describe('Racing Variant', () => {
    it('renders racing variant with angled buttons', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
          variant: 'racing',
        },
      });

      const html = wrapper.html();
      expect(html).toContain('clip-path:polygon');
    });

    it('applies different clip-path to arrow buttons', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
          variant: 'racing',
        },
      });

      const html = wrapper.html();
      // Arrow buttons have 15% polygon
      expect(html).toContain('[clip-path:polygon(15%_0%,100%_0%,85%_100%,0%_100%)]');
      // Page buttons have 5% polygon
      expect(html).toContain('[clip-path:polygon(5%_0%,100%_0%,95%_100%,0%_100%)]');
    });
  });

  describe('Info Display', () => {
    it('shows info text when showInfo is true', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 16,
          showInfo: true,
          totalRecords: 156,
          perPage: 10,
        },
      });

      expect(wrapper.text()).toContain('Showing');
      expect(wrapper.text()).toContain('21-30');
      expect(wrapper.text()).toContain('of');
      expect(wrapper.text()).toContain('156');
      expect(wrapper.text()).toContain('results');
    });

    it('does not show info text when showInfo is false', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 16,
          showInfo: false,
        },
      });

      expect(wrapper.text()).not.toContain('Showing');
    });

    it('shows first/last page buttons when showInfo is true', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 10,
          showInfo: true,
          totalRecords: 100,
        },
      });

      expect(wrapper.findComponent(PhCaretDoubleLeft).exists()).toBe(true);
      expect(wrapper.findComponent(PhCaretDoubleRight).exists()).toBe(true);
    });
  });

  describe('Per-Page Selector', () => {
    it('shows per-page selector when showPerPage is true', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 10,
          showPerPage: true,
        },
      });

      expect(wrapper.find('select').exists()).toBe(true);
      expect(wrapper.text()).toContain('Show');
      expect(wrapper.text()).toContain('per page');
    });

    it('does not show per-page selector when showPerPage is false', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 10,
          showPerPage: false,
        },
      });

      expect(wrapper.find('select').exists()).toBe(false);
    });

    it('renders default per-page options', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 10,
          showPerPage: true,
        },
      });

      const options = wrapper.findAll('option');
      expect(options).toHaveLength(4);
      expect(options[0]?.text()).toBe('10');
      expect(options[1]?.text()).toBe('25');
      expect(options[2]?.text()).toBe('50');
      expect(options[3]?.text()).toBe('100');
    });

    it('renders custom per-page options', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 10,
          showPerPage: true,
          perPageOptions: [5, 15, 30],
        },
      });

      const options = wrapper.findAll('option');
      expect(options).toHaveLength(3);
      expect(options[0]?.text()).toBe('5');
      expect(options[1]?.text()).toBe('15');
      expect(options[2]?.text()).toBe('30');
    });

    it('emits update:perPage when selection changes', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 2,
          totalPages: 10,
          showPerPage: true,
          perPage: 10,
        },
      });

      const select = wrapper.find('select');
      await select.setValue('25');
      await select.trigger('change');

      expect(wrapper.emitted('update:perPage')).toBeTruthy();
      expect(wrapper.emitted('update:perPage')?.[0]).toEqual([25]);
    });

    it('resets to page 1 when per-page changes', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 10,
          showPerPage: true,
        },
      });

      const select = wrapper.find('select');
      await select.setValue(50);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    });
  });

  describe('Navigation', () => {
    it('emits update:modelValue when page button is clicked', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      const buttons = wrapper.findAll('button');
      const page3Button = buttons.find((btn) => btn.text() === '3');
      await page3Button?.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3]);
    });

    it('emits update:modelValue when next button is clicked', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 2,
          totalPages: 5,
        },
      });

      const nextButton = wrapper.find('[aria-label="Next page"]');
      await nextButton.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3]);
    });

    it('emits update:modelValue when previous button is clicked', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
        },
      });

      const prevButton = wrapper.find('[aria-label="Previous page"]');
      await prevButton.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2]);
    });

    it('goes to first page when first button is clicked', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 5,
          totalPages: 10,
          showInfo: true,
          totalRecords: 100,
        },
      });

      const firstButton = wrapper.find('[aria-label="First page"]');
      await firstButton.trigger('click');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    });

    it('goes to last page when last button is clicked', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 5,
          totalPages: 10,
          showInfo: true,
          totalRecords: 100,
        },
      });

      const lastButton = wrapper.find('[aria-label="Last page"]');
      await lastButton.trigger('click');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([10]);
    });

    it('does not emit when clicking current page', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
        },
      });

      const buttons = wrapper.findAll('button');
      const page3Button = buttons.find((btn) => btn.text() === '3');
      await page3Button?.trigger('click');

      // Should not emit when clicking current page
      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('does not go below page 1', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      const prevButton = wrapper.find('[aria-label="Previous page"]');
      await prevButton.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('does not go above total pages', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 5,
          totalPages: 5,
        },
      });

      const nextButton = wrapper.find('[aria-label="Next page"]');
      await nextButton.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('Keyboard Navigation', () => {
    it('goes to previous page on ArrowLeft', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
        },
        attachTo: document.body,
      });

      // Focus a button first - keyboard nav only works when focus is on a button
      const pageButton = wrapper.find('button');
      await pageButton.trigger('keydown', { key: 'ArrowLeft' });

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2]);
      wrapper.unmount();
    });

    it('goes to next page on ArrowRight', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
        },
        attachTo: document.body,
      });

      // Focus a button first - keyboard nav only works when focus is on a button
      const pageButton = wrapper.find('button');
      await pageButton.trigger('keydown', { key: 'ArrowRight' });

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([4]);
      wrapper.unmount();
    });

    it('goes to first page on Home', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
        },
        attachTo: document.body,
      });

      // Focus a button first - keyboard nav only works when focus is on a button
      const pageButton = wrapper.find('button');
      await pageButton.trigger('keydown', { key: 'Home' });

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
      wrapper.unmount();
    });

    it('goes to last page on End', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
        },
        attachTo: document.body,
      });

      // Focus a button first - keyboard nav only works when focus is on a button
      const pageButton = wrapper.find('button');
      await pageButton.trigger('keydown', { key: 'End' });

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([5]);
      wrapper.unmount();
    });
  });

  describe('Styling', () => {
    it('applies custom class', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
          class: 'custom-pagination-class',
        },
      });

      expect(wrapper.classes()).toContain('custom-pagination-class');
    });

    it('applies active styling to current page', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
        },
      });

      const buttons = wrapper.findAll('button');
      const page3Button = buttons.find((btn) => btn.text() === '3');
      expect(page3Button?.classes()).toContain('bg-[var(--accent-gold)]');
      expect(page3Button?.classes()).toContain('text-[#0a0a0a]');
    });

    it('applies inactive styling to non-current pages', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
        },
      });

      const buttons = wrapper.findAll('button');
      const page1Button = buttons.find((btn) => btn.text() === '1');
      expect(page1Button?.classes()).toContain('bg-[var(--bg-tertiary)]');
      expect(page1Button?.classes()).toContain('text-[var(--text-muted)]');
    });

    it('applies disabled styling to disabled buttons', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      const prevButton = wrapper.find('[aria-label="Previous page"]');
      expect(prevButton.classes()).toContain('opacity-40');
      expect(prevButton.classes()).toContain('cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('has navigation role', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      expect(wrapper.find('nav').attributes('role')).toBe('navigation');
    });

    it('has aria-label for navigation', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      expect(wrapper.find('nav').attributes('aria-label')).toBe('Pagination');
    });

    it('has aria-label for previous button', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 2,
          totalPages: 5,
        },
      });

      const prevButton = wrapper.find('[aria-label="Previous page"]');
      expect(prevButton.exists()).toBe(true);
    });

    it('has aria-label for next button', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 2,
          totalPages: 5,
        },
      });

      const nextButton = wrapper.find('[aria-label="Next page"]');
      expect(nextButton.exists()).toBe(true);
    });

    it('has aria-label for page buttons', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      const buttons = wrapper.findAll('button');
      const page2Button = buttons.find((btn) => btn.text() === '2');
      expect(page2Button?.attributes('aria-label')).toBe('Page 2');
    });

    it('sets aria-disabled on disabled buttons', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      const prevButton = wrapper.find('[aria-label="Previous page"]');
      expect(prevButton.attributes('aria-disabled')).toBe('true');
    });

    it('sets aria-current on current page', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 3,
          totalPages: 5,
        },
      });

      const buttons = wrapper.findAll('button');
      const page3Button = buttons.find((btn) => btn.text() === '3');
      expect(page3Button?.attributes('aria-current')).toBe('page');
    });
  });

  describe('Edge Cases', () => {
    it('handles single page correctly', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 1,
        },
      });

      const prevButton = wrapper.find('[aria-label="Previous page"]');
      const nextButton = wrapper.find('[aria-label="Next page"]');

      expect(prevButton.attributes('disabled')).toBeDefined();
      expect(nextButton.attributes('disabled')).toBeDefined();
    });

    it('handles two pages correctly', () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 2,
        },
      });

      expect(wrapper.text()).toContain('1');
      expect(wrapper.text()).toContain('2');
      expect(wrapper.text()).not.toContain('...');
    });

    it('updates when modelValue prop changes', async () => {
      const wrapper = mount(VrlPagination, {
        props: {
          modelValue: 1,
          totalPages: 5,
        },
      });

      await wrapper.setProps({ modelValue: 3 });

      const buttons = wrapper.findAll('button');
      const page3Button = buttons.find((btn) => btn.text() === '3');
      expect(page3Button?.attributes('aria-current')).toBe('page');
    });
  });
});
