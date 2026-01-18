import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlTablePagination from '../VrlTablePagination.vue';

describe('VrlTablePagination', () => {
  const mountPagination = (props = {}) => {
    return mount(VrlTablePagination, {
      props: {
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        first: 0,
        last: 9,
        ...props,
      },
    });
  };

  describe('Rendering', () => {
    it('renders pagination container', () => {
      const wrapper = mountPagination();
      expect(wrapper.find('.table-pagination').exists()).toBe(true);
    });

    it('renders pagination info text', () => {
      const wrapper = mountPagination();
      expect(wrapper.text()).toContain('Showing 1-10 of 50');
    });

    it('uses custom entity name in info text', () => {
      const wrapper = mountPagination({ entityName: 'drivers' });
      expect(wrapper.text()).toContain('drivers');
    });

    it('renders prev and next buttons', () => {
      const wrapper = mountPagination();
      const buttons = wrapper.findAll('.pagination-btn');
      expect(buttons.length).toBeGreaterThan(2);
      expect(buttons[0].text()).toBe('←');
      expect(buttons[buttons.length - 1].text()).toBe('→');
    });
  });

  describe('Page Buttons', () => {
    it('shows correct number of page buttons (max 5)', () => {
      const wrapper = mountPagination({ totalPages: 5 });
      const pageButtons = wrapper
        .findAll('.pagination-btn')
        .filter((btn) => !btn.text().match(/[←→]/));

      expect(pageButtons.length).toBe(5);
    });

    it('limits page buttons to 5 when total pages > 5', () => {
      const wrapper = mountPagination({ totalPages: 10 });
      const pageButtons = wrapper
        .findAll('.pagination-btn')
        .filter((btn) => !btn.text().match(/[←→]/));

      expect(pageButtons.length).toBeLessThanOrEqual(5);
    });

    it('highlights active page button', () => {
      const wrapper = mountPagination({ currentPage: 3 });
      const activeButton = wrapper.find('.pagination-btn.active');

      expect(activeButton.exists()).toBe(true);
      expect(activeButton.text()).toBe('3');
    });

    it('adds aria-current to active page', () => {
      const wrapper = mountPagination({ currentPage: 2 });
      const buttons = wrapper.findAll('.pagination-btn');
      const activeButton = buttons.find((btn) => btn.text() === '2');

      expect(activeButton?.attributes('aria-current')).toBe('page');
    });
  });

  describe('Navigation Buttons', () => {
    it('disables prev button on first page', () => {
      const wrapper = mountPagination({ currentPage: 1 });
      const prevButton = wrapper.findAll('.pagination-btn')[0];

      expect(prevButton.attributes('disabled')).toBeDefined();
    });

    it('enables prev button when not on first page', () => {
      const wrapper = mountPagination({ currentPage: 2 });
      const prevButton = wrapper.findAll('.pagination-btn')[0];

      expect(prevButton.attributes('disabled')).toBeUndefined();
    });

    it('disables next button on last page', () => {
      const wrapper = mountPagination({ currentPage: 5, totalPages: 5 });
      const buttons = wrapper.findAll('.pagination-btn');
      const nextButton = buttons[buttons.length - 1];

      expect(nextButton.attributes('disabled')).toBeDefined();
    });

    it('enables next button when not on last page', () => {
      const wrapper = mountPagination({ currentPage: 4, totalPages: 5 });
      const buttons = wrapper.findAll('.pagination-btn');
      const nextButton = buttons[buttons.length - 1];

      expect(nextButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Events', () => {
    it('emits page-change event when page button clicked', async () => {
      const wrapper = mountPagination();
      const pageButtons = wrapper
        .findAll('.pagination-btn')
        .filter((btn) => !btn.text().match(/[←→]/));

      await pageButtons[2].trigger('click');

      expect(wrapper.emitted('page-change')).toBeTruthy();
      expect(wrapper.emitted('page-change')?.[0]).toEqual([2]); // 0-indexed (page 3 -> index 2)
    });

    it('emits prev event when prev button clicked', async () => {
      const wrapper = mountPagination({ currentPage: 2 });
      const prevButton = wrapper.findAll('.pagination-btn')[0];

      await prevButton.trigger('click');

      expect(wrapper.emitted('prev')).toBeTruthy();
    });

    it('emits next event when next button clicked', async () => {
      const wrapper = mountPagination({ currentPage: 2 });
      const buttons = wrapper.findAll('.pagination-btn');
      const nextButton = buttons[buttons.length - 1];

      await nextButton.trigger('click');

      expect(wrapper.emitted('next')).toBeTruthy();
    });
  });

  describe('Computed Properties', () => {
    it('calculates visible pages correctly for middle page', () => {
      const wrapper = mountPagination({ currentPage: 5, totalPages: 10 });
      const pageButtons = wrapper
        .findAll('.pagination-btn')
        .filter((btn) => !btn.text().match(/[←→]/));

      // Should show pages 3, 4, 5, 6, 7 (centered on current page 5)
      expect(pageButtons.length).toBe(5);
    });

    it('calculates visible pages correctly for first page', () => {
      const wrapper = mountPagination({ currentPage: 1, totalPages: 10 });
      const pageButtons = wrapper
        .findAll('.pagination-btn')
        .filter((btn) => !btn.text().match(/[←→]/));

      // Should show pages 1, 2, 3, 4, 5
      expect(pageButtons[0].text()).toBe('1');
      expect(pageButtons.length).toBe(5);
    });

    it('calculates visible pages correctly for last page', () => {
      const wrapper = mountPagination({ currentPage: 10, totalPages: 10 });
      const pageButtons = wrapper
        .findAll('.pagination-btn')
        .filter((btn) => !btn.text().match(/[←→]/));

      // Should show pages 6, 7, 8, 9, 10
      expect(pageButtons[pageButtons.length - 1].text()).toBe('10');
      expect(pageButtons.length).toBe(5);
    });

    it('formats pagination info correctly', () => {
      const wrapper = mountPagination({
        first: 10,
        last: 19,
        totalItems: 50,
        entityName: 'drivers',
      });

      expect(wrapper.text()).toContain('Showing 11-20 of 50 drivers');
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on prev button', () => {
      const wrapper = mountPagination();
      const prevButton = wrapper.findAll('.pagination-btn')[0];

      expect(prevButton.attributes('aria-label')).toBe('Previous page');
    });

    it('has aria-label on next button', () => {
      const wrapper = mountPagination();
      const buttons = wrapper.findAll('.pagination-btn');
      const nextButton = buttons[buttons.length - 1];

      expect(nextButton.attributes('aria-label')).toBe('Next page');
    });

    it('has aria-label on page buttons', () => {
      const wrapper = mountPagination();
      const pageButtons = wrapper
        .findAll('.pagination-btn')
        .filter((btn) => !btn.text().match(/[←→]/));

      expect(pageButtons[0].attributes('aria-label')).toBe('Page 1');
    });
  });
});
