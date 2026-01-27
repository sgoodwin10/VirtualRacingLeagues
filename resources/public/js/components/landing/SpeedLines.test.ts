import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SpeedLines from './SpeedLines.vue';

describe('SpeedLines', () => {
  describe('Rendering', () => {
    it('should render the speed lines container', () => {
      const wrapper = mount(SpeedLines);

      expect(wrapper.exists()).toBe(true);
    });

    it('should render 5 speed line elements', () => {
      const wrapper = mount(SpeedLines);

      const speedLines = wrapper.findAll('.speed-line');
      expect(speedLines).toHaveLength(5);
    });

    it('should have fixed positioning', () => {
      const wrapper = mount(SpeedLines);

      const container = wrapper.find('div');
      expect(container.classes()).toContain('fixed');
    });

    it('should have pointer-events-none to allow clicks through', () => {
      const wrapper = mount(SpeedLines);

      const container = wrapper.find('div');
      expect(container.classes()).toContain('pointer-events-none');
    });

    it('should have aria-hidden attribute', () => {
      const wrapper = mount(SpeedLines);

      const container = wrapper.find('div');
      expect(container.attributes('aria-hidden')).toBe('true');
    });
  });
});
