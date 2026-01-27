import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BackgroundGrid from './BackgroundGrid.vue';

describe('BackgroundGrid', () => {
  describe('Rendering', () => {
    it('should render the background grid', () => {
      const wrapper = mount(BackgroundGrid);

      expect(wrapper.exists()).toBe(true);
    });

    it('should have fixed positioning', () => {
      const wrapper = mount(BackgroundGrid);

      const div = wrapper.find('div');
      expect(div.classes()).toContain('fixed');
    });

    it('should have pointer-events-none to allow clicks through', () => {
      const wrapper = mount(BackgroundGrid);

      const div = wrapper.find('div');
      expect(div.classes()).toContain('pointer-events-none');
    });

    it('should have aria-hidden attribute', () => {
      const wrapper = mount(BackgroundGrid);

      const div = wrapper.find('div');
      expect(div.attributes('aria-hidden')).toBe('true');
    });
  });
});
