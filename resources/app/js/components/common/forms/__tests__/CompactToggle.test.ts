import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CompactToggle from '../CompactToggle.vue';

describe('CompactToggle', () => {
  describe('Basic Functionality', () => {
    it('renders with label', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
        },
      });

      expect(wrapper.text()).toContain('Test Toggle');
    });

    it('emits update:modelValue when clicked', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
        },
      });

      await wrapper.find('[data-testid="compact-toggle"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('does not emit when disabled', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
          disabled: true,
        },
      });

      await wrapper.find('[data-testid="compact-toggle"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('applies disabled styles when disabled', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
          disabled: true,
        },
      });

      const toggle = wrapper.find('[data-testid="compact-toggle"]');
      expect(toggle.classes()).toContain('opacity-60');
      expect(toggle.classes()).toContain('cursor-not-allowed');
    });

    it('applies active styles when enabled', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
        },
      });

      const toggle = wrapper.find('[data-testid="compact-toggle"]');
      expect(toggle.classes()).toContain('border-[var(--cyan)]');
    });
  });

  describe('Slot Position - Below (default)', () => {
    it('uses below layout by default', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
        },
      });

      const toggle = wrapper.find('[data-testid="compact-toggle"]');
      expect(toggle.classes()).toContain('justify-between');
    });

    it('does not show nested options when modelValue is false', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
        },
        slots: {
          default: '<div data-testid="nested-content">Nested Content</div>',
        },
      });

      expect(wrapper.find('[data-testid="compact-nested-options"]').exists()).toBe(false);
    });

    it('shows nested options below when modelValue is true', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
        },
        slots: {
          default: '<div data-testid="nested-content">Nested Content</div>',
        },
      });

      // Wait for transition
      await wrapper.vm.$nextTick();

      const nestedOptions = wrapper.find('[data-testid="compact-nested-options"]');
      expect(nestedOptions.exists()).toBe(true);
      expect(nestedOptions.classes()).toContain('mt-3');
    });

    it('does not show inline options in below mode', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
          slotPosition: 'below',
        },
        slots: {
          default: '<div data-testid="nested-content">Nested Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="compact-inline-options"]').exists()).toBe(false);
    });
  });

  describe('Slot Position - Inline', () => {
    it('uses inline layout when slotPosition is "inline"', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
          slotPosition: 'inline',
        },
      });

      // In inline mode (labelPosition beside), the wrapper div should have flex classes
      const flexContainer = wrapper.find('.flex.flex-row');
      expect(flexContainer.exists()).toBe(true);
    });

    it('shows slot content inline when modelValue is true', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
          slotPosition: 'inline',
        },
        slots: {
          default: '<div data-testid="inline-content">Inline Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      const inlineOptions = wrapper.find('[data-testid="compact-inline-options"]');
      expect(inlineOptions.exists()).toBe(true);
      expect(inlineOptions.classes()).toContain('flex-1');
    });

    it('does not show nested options below in inline mode', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
          slotPosition: 'inline',
        },
        slots: {
          default: '<div data-testid="inline-content">Inline Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="compact-nested-options"]').exists()).toBe(false);
    });

    it('does not show inline content when modelValue is false', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
          slotPosition: 'inline',
        },
        slots: {
          default: '<div data-testid="inline-content">Inline Content</div>',
        },
      });

      expect(wrapper.find('[data-testid="compact-inline-options"]').exists()).toBe(false);
    });
  });

  describe('Toggle Switch Visual', () => {
    it('shows switch in off state when modelValue is false', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
        },
      });

      const switchContainer = wrapper
        .findAll('div')
        .find((div) => div.classes().includes('rounded-full'));

      expect(switchContainer).toBeTruthy();
      // Verify it has the off state styling (bg-elevated and border classes)
      const classStr = switchContainer?.classes().join(' ') || '';
      expect(classStr.includes('bg-') && classStr.includes('border-')).toBe(true);
    });

    it('shows switch in on state when modelValue is true', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
        },
      });

      const switchContainer = wrapper
        .findAll('div')
        .find((div) => div.classes().includes('rounded-full'));

      expect(switchContainer).toBeTruthy();
      // Verify it has the on state styling (cyan background and border)
      const classStr = switchContainer?.classes().join(' ') || '';
      expect(
        classStr.includes('cyan') || (classStr.includes('bg-') && classStr.includes('border-')),
      ).toBe(true);
    });
  });

  describe('Label Position - Above', () => {
    it('renders label above the toggle when labelPosition is "above"', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
          labelPosition: 'above',
        },
      });

      const label = wrapper.find('label');
      expect(label.exists()).toBe(true);
      expect(label.text()).toBe('Test Toggle');
      expect(label.classes()).toContain('uppercase');
      expect(label.classes()).toContain('tracking-widest');
    });

    it('does not show inline label span when labelPosition is "above"', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
          labelPosition: 'above',
        },
      });

      // Should not have the inline span label
      const spans = wrapper.findAll('span');
      const labelSpan = spans.find((s) => s.text() === 'Test Toggle');
      expect(labelSpan).toBeUndefined();
    });

    it('emits update:modelValue when clicked with label above', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
          labelPosition: 'above',
        },
      });

      await wrapper.find('[data-testid="compact-toggle"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('applies active styles when enabled with label above', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
          labelPosition: 'above',
        },
      });

      const toggle = wrapper.find('[data-testid="compact-toggle"]');
      expect(toggle.classes()).toContain('border-[var(--cyan)]');
    });

    it('works with slotPosition below and label above', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
          labelPosition: 'above',
          slotPosition: 'below',
        },
        slots: {
          default: '<div data-testid="nested-content">Nested Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('label').exists()).toBe(true);
      expect(wrapper.find('[data-testid="compact-nested-options"]').exists()).toBe(true);
    });

    it('works with slotPosition inline and label above', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
          labelPosition: 'above',
          slotPosition: 'inline',
        },
        slots: {
          default: '<div data-testid="inline-content">Inline Content</div>',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('label').exists()).toBe(true);
      expect(wrapper.find('[data-testid="compact-inline-options"]').exists()).toBe(true);
    });

    it('does not emit when disabled with label above', async () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
          labelPosition: 'above',
          disabled: true,
        },
      });

      await wrapper.find('[data-testid="compact-toggle"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });

  describe('Label Position - Beside (default)', () => {
    it('renders label beside the toggle by default', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
        },
      });

      // Should not have a separate label element
      const label = wrapper.find('label');
      expect(label.exists()).toBe(false);

      // Label should be in span inside the toggle
      const span = wrapper.find('[data-testid="compact-toggle"] span');
      expect(span.exists()).toBe(true);
      expect(span.text()).toBe('Test Toggle');
    });

    it('renders label beside when labelPosition is explicitly "beside"', () => {
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: false,
          label: 'Test Toggle',
          labelPosition: 'beside',
        },
      });

      const label = wrapper.find('label');
      expect(label.exists()).toBe(false);

      const span = wrapper.find('[data-testid="compact-toggle"] span');
      expect(span.exists()).toBe(true);
    });
  });

  describe('Slot Click Propagation', () => {
    it('prevents click propagation on nested content (below mode)', async () => {
      const clickHandler = vi.fn();
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
        },
        slots: {
          default: '<button data-testid="nested-button">Click Me</button>',
        },
      });

      wrapper
        .find('[data-testid="compact-toggle"]')
        .element.addEventListener('click', clickHandler);

      await wrapper.vm.$nextTick();

      // Click on nested content should not toggle
      const nestedButton = wrapper.find('[data-testid="nested-button"]');
      await nestedButton.trigger('click');

      // The nested content div has @click.stop, so parent shouldn't be triggered
      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('prevents click propagation on inline content', async () => {
      const clickHandler = vi.fn();
      const wrapper = mount(CompactToggle, {
        props: {
          modelValue: true,
          label: 'Test Toggle',
          slotPosition: 'inline',
        },
        slots: {
          default: '<button data-testid="inline-button">Click Me</button>',
        },
      });

      wrapper
        .find('[data-testid="compact-toggle"]')
        .element.addEventListener('click', clickHandler);

      await wrapper.vm.$nextTick();

      // Click on inline content should not toggle
      const inlineButton = wrapper.find('[data-testid="inline-button"]');
      await inlineButton.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });
});
