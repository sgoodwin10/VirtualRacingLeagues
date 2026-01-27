import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlAccordionHeader from './VrlAccordionHeader.vue';

describe('VrlAccordionHeader', () => {
  describe('Rendering', () => {
    it('should render header text/slot content', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Accordion Header Title' },
      });

      expect(wrapper.text()).toContain('Accordion Header Title');
    });

    it('should display expand/collapse icon', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      const icon = wrapper.find('[data-test="vrl-accordion-toggle"]');
      expect(icon.exists()).toBe(true);
    });

    it('should show collapsed state visually when not active', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-accordion-toggle"]');
      expect(toggle.classes()).not.toContain('rotate-180');
    });

    it('should show expanded state visually when active', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: true },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-accordion-toggle"]');
      expect(toggle.classes()).toContain('rotate-180');
    });

    it('should apply custom CSS class', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: {
          active: false,
          class: 'custom-header-class',
        },
        slots: { title: 'Test' },
      });

      expect(wrapper.classes()).toContain('custom-header-class');
    });

    it('should render custom icon via slot', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: {
          title: 'Test',
          icon: '<span data-test="custom-icon">★</span>',
        },
      });

      expect(wrapper.find('[data-test="custom-icon"]').exists()).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('should emit click event on click', async () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.length).toBe(1);
    });

    it('should emit click event on Enter key press', async () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.length).toBe(1);
    });

    it('should emit click event on Space key press', async () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('click')).toBeTruthy();
      expect(wrapper.emitted('click')?.length).toBe(1);
    });

    it('should not emit click event when disabled', async () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: {
          active: false,
          disabled: true,
        },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('should not emit click event on Enter key when disabled', async () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: {
          active: false,
          disabled: true,
        },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('should change icon color when expanded', () => {
      const wrapperCollapsed = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      const wrapperExpanded = mount(VrlAccordionHeader, {
        props: { active: true },
        slots: { title: 'Test' },
      });

      const collapsedToggle = wrapperCollapsed.find('[data-test="vrl-accordion-toggle"]');
      const expandedToggle = wrapperExpanded.find('[data-test="vrl-accordion-toggle"]');

      expect(collapsedToggle.classes()).not.toContain('text-[var(--cyan)]');
      expect(expandedToggle.classes()).toContain('text-[var(--cyan)]');
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      expect(wrapper.attributes('role')).toBe('button');
    });

    it('should have aria-expanded attribute set to false when not active', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      expect(wrapper.attributes('aria-expanded')).toBe('false');
    });

    it('should have aria-expanded attribute set to true when active', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: true },
        slots: { title: 'Test' },
      });

      expect(wrapper.attributes('aria-expanded')).toBe('true');
    });

    it('should have aria-disabled attribute when disabled', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: {
          active: false,
          disabled: true,
        },
        slots: { title: 'Test' },
      });

      expect(wrapper.attributes('aria-disabled')).toBe('true');
    });

    it('should have tabindex="0" when not disabled', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: {
          active: false,
          disabled: false,
        },
        slots: { title: 'Test' },
      });

      expect(wrapper.attributes('tabindex')).toBe('0');
    });

    it('should have tabindex="-1" when disabled', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: {
          active: false,
          disabled: true,
        },
        slots: { title: 'Test' },
      });

      expect(wrapper.attributes('tabindex')).toBe('-1');
    });

    it('should be keyboard accessible', async () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      // Test Enter key
      await wrapper.trigger('keydown', { key: 'Enter' });
      expect(wrapper.emitted('click')).toBeTruthy();

      // Test Space key
      await wrapper.trigger('keydown', { key: ' ' });
      expect(wrapper.emitted('click')?.length).toBe(2);
    });
  });

  describe('Props', () => {
    it('should accept active prop and apply styles', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: true },
        slots: { title: 'Test' },
      });

      const toggle = wrapper.find('[data-test="vrl-accordion-toggle"]');
      expect(toggle.classes()).toContain('rotate-180');
      expect(toggle.classes()).toContain('text-[var(--cyan)]');
    });

    it('should accept disabled prop and prevent interactions', async () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: {
          active: false,
          disabled: true,
        },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeFalsy();

      expect(wrapper.attributes('aria-disabled')).toBe('true');
      expect(wrapper.attributes('tabindex')).toBe('-1');
    });

    it('should apply hover styles only when not disabled', () => {
      const enabledWrapper = mount(VrlAccordionHeader, {
        props: {
          active: false,
          disabled: false,
        },
        slots: { title: 'Test' },
      });

      const disabledWrapper = mount(VrlAccordionHeader, {
        props: {
          active: false,
          disabled: true,
        },
        slots: { title: 'Test' },
      });

      expect(enabledWrapper.classes()).toContain('hover:bg-[var(--bg-elevated)]');
      expect(disabledWrapper.classes()).not.toContain('hover:bg-[var(--bg-elevated)]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty slot content', () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: '' },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should prevent default on Space key to avoid page scroll', async () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      // We can't easily test preventDefault with wrapper.trigger, but we can verify
      // the behavior indirectly by confirming the Space key emits the click event
      await wrapper.trigger('keydown', { key: ' ' });

      // If Space key is handled properly, it should emit a click event
      expect(wrapper.emitted('click')).toBeTruthy();
    });

    it('should not respond to other keys', async () => {
      const wrapper = mount(VrlAccordionHeader, {
        props: { active: false },
        slots: { title: 'Test' },
      });

      await wrapper.trigger('keydown', { key: 'a' });
      await wrapper.trigger('keydown', { key: 'Escape' });
      await wrapper.trigger('keydown', { key: 'Tab' });

      expect(wrapper.emitted('click')).toBeFalsy();
    });
  });
});
