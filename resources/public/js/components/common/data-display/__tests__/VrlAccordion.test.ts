import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlAccordion, { type AccordionItem } from '../VrlAccordion.vue';
import { PhFlag } from '@phosphor-icons/vue';

describe('VrlAccordion', () => {
  const mockItems: AccordionItem[] = [
    {
      id: 1,
      title: 'Round 1',
      subtitle: 'Spa-Francorchamps • Dec 10, 2025',
      badge: 'Completed',
      badgeVariant: 'completed',
      disabled: false,
    },
    {
      id: 2,
      title: 'Round 2',
      subtitle: 'Monza • Dec 17, 2025',
      badge: 'Active',
      badgeVariant: 'active',
      disabled: false,
    },
    {
      id: 3,
      title: 'Round 3',
      subtitle: 'Silverstone • Dec 24, 2025',
      badge: 'Upcoming',
      badgeVariant: 'upcoming',
      disabled: true,
    },
  ];

  it('renders correctly with items', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findAll('.accordion-item')).toHaveLength(3);
  });

  it('displays item titles and subtitles', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
      },
    });

    const titles = wrapper.findAll('.accordion-title');
    expect(titles[0]?.text()).toBe('Round 1');
    expect(titles[1]?.text()).toBe('Round 2');

    const subtitles = wrapper.findAll('.accordion-subtitle');
    expect(subtitles[0]?.text()).toBe('Spa-Francorchamps • Dec 10, 2025');
  });

  it('displays badges with correct styling', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
      },
    });

    const badges = wrapper.findAll('.accordion-header span');
    // Find badges by checking their text content
    const completedBadge = badges.find((b) => b.text() === 'Completed');
    const activeBadge = badges.find((b) => b.text() === 'Active');
    const upcomingBadge = badges.find((b) => b.text() === 'Upcoming');

    // Completed and Active badges both use success variant
    expect(completedBadge?.classes()).toContain('bg-racing-success/10');
    expect(activeBadge?.classes()).toContain('bg-racing-success/10');
    expect(upcomingBadge?.classes()).toContain('bg-racing-warning/10');
  });

  it('toggles accordion item on click', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [],
      },
    });

    const firstHeader = wrapper.find('.accordion-header');
    await firstHeader.trigger('click');

    // Check that update:modelValue was emitted
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[0]]);

    // Check that item-toggle was emitted
    expect(wrapper.emitted('item-toggle')).toBeTruthy();
    expect(wrapper.emitted('item-toggle')?.[0]?.[0]).toBe(0); // index
    expect(wrapper.emitted('item-toggle')?.[0]?.[1]).toBe(true); // isOpen
  });

  it('supports multiple open items when multiple prop is true', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [],
        multiple: true,
      },
    });

    const headers = wrapper.findAll('.accordion-header');

    // Open first item
    await headers[0]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[0]]);

    // Open second item (should keep first open)
    await wrapper.setProps({ modelValue: [0] });
    await headers[1]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[0, 1]]);
  });

  it('allows only one open item when multiple prop is false', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [],
        multiple: false,
      },
    });

    const headers = wrapper.findAll('.accordion-header');

    // Open first item
    await headers[0]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[0]]);

    // Open second item (should close first)
    await wrapper.setProps({ modelValue: [0] });
    await headers[1]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[1]]);
  });

  it('closes an open item when clicked again in single mode', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [0],
        multiple: false,
      },
    });

    const firstHeader = wrapper.find('.accordion-header');
    await firstHeader.trigger('click');

    // Should close the item
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]]);
  });

  it('does not toggle disabled items', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [],
      },
    });

    const disabledHeader = wrapper.findAll('.accordion-header')[2];
    await disabledHeader?.trigger('click');

    // Should not emit any events
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('applies disabled styling to disabled items', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
      },
    });

    const items = wrapper.findAll('.accordion-item');
    expect(items[2]?.classes()).toContain('is-disabled');
  });

  it('applies is-open class to open items', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [0, 1],
      },
    });

    const items = wrapper.findAll('.accordion-item');
    expect(items[0]?.classes()).toContain('is-open');
    expect(items[1]?.classes()).toContain('is-open');
    expect(items[2]?.classes()).not.toContain('is-open');
  });

  it('rotates chevron icon when item is open', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [0],
      },
    });

    const chevrons = wrapper.findAll('.accordion-chevron');
    expect(chevrons[0]?.classes()).toContain('is-rotated');
    expect(chevrons[1]?.classes()).not.toContain('is-rotated');
  });

  it('renders custom icon when provided', () => {
    const itemsWithIcon: AccordionItem[] = [
      {
        id: 1,
        title: 'Round 1',
        icon: PhFlag,
      },
    ];

    const wrapper = mount(VrlAccordion, {
      props: {
        items: itemsWithIcon,
      },
    });

    expect(wrapper.find('.accordion-icon').exists()).toBe(true);
  });

  it('renders slot content for accordion panels', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [0],
      },
      slots: {
        'item-0': '<div class="test-content">Test Content</div>',
      },
    });

    expect(wrapper.find('.test-content').exists()).toBe(true);
    expect(wrapper.find('.test-content').text()).toBe('Test Content');
  });

  it('handles keyboard navigation with Enter key', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [],
      },
    });

    const firstHeader = wrapper.find('.accordion-header');
    await firstHeader.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[0]]);
  });

  it('handles keyboard navigation with Space key', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [],
      },
    });

    const firstHeader = wrapper.find('.accordion-header');
    await firstHeader.trigger('keydown', { key: ' ' });

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[0]]);
  });

  it('applies custom class from props', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        class: 'custom-accordion-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-accordion-class');
  });

  it('has correct ARIA attributes', () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [0],
      },
    });

    const firstHeader = wrapper.find('.accordion-header');
    const firstPanel = wrapper.find('.accordion-panel');

    expect(firstHeader.attributes('aria-expanded')).toBe('true');
    expect(firstHeader.attributes('aria-controls')).toBe('accordion-panel-0');
    expect(firstPanel.attributes('aria-labelledby')).toBe('accordion-header-0');
    expect(firstPanel.attributes('aria-hidden')).toBe('false');
  });

  it('syncs with v-model changes', async () => {
    const wrapper = mount(VrlAccordion, {
      props: {
        items: mockItems,
        modelValue: [],
      },
    });

    // Update modelValue prop
    await wrapper.setProps({ modelValue: [1] });

    const items = wrapper.findAll('.accordion-item');
    expect(items[1]?.classes()).toContain('is-open');
  });

  describe('Keyboard Navigation', () => {
    it('focuses next item on ArrowDown key', async () => {
      const wrapper = mount(VrlAccordion, {
        props: {
          items: mockItems,
          modelValue: [],
        },
        attachTo: document.body,
      });

      const headers = wrapper.findAll('.accordion-header');

      // Focus first header
      (headers[0]?.element as HTMLButtonElement).focus();
      expect(document.activeElement).toBe(headers[0]?.element);

      // Press ArrowDown
      await headers[0]?.trigger('keydown', { key: 'ArrowDown' });

      // Second header should now be focused
      expect(document.activeElement).toBe(headers[1]?.element);

      wrapper.unmount();
    });

    it('focuses previous item on ArrowUp key', async () => {
      const wrapper = mount(VrlAccordion, {
        props: {
          items: mockItems,
          modelValue: [],
        },
        attachTo: document.body,
      });

      const headers = wrapper.findAll('.accordion-header');

      // Focus second header
      (headers[1]?.element as HTMLButtonElement).focus();
      expect(document.activeElement).toBe(headers[1]?.element);

      // Press ArrowUp
      await headers[1]?.trigger('keydown', { key: 'ArrowUp' });

      // First header should now be focused
      expect(document.activeElement).toBe(headers[0]?.element);

      wrapper.unmount();
    });

    it('focuses first item on Home key', async () => {
      const wrapper = mount(VrlAccordion, {
        props: {
          items: mockItems,
          modelValue: [],
        },
        attachTo: document.body,
      });

      const headers = wrapper.findAll('.accordion-header');

      // Focus second header
      (headers[1]?.element as HTMLButtonElement).focus();
      expect(document.activeElement).toBe(headers[1]?.element);

      // Press Home
      await headers[1]?.trigger('keydown', { key: 'Home' });

      // First header should now be focused
      expect(document.activeElement).toBe(headers[0]?.element);

      wrapper.unmount();
    });

    it('focuses last item on End key', async () => {
      const wrapper = mount(VrlAccordion, {
        props: {
          items: mockItems,
          modelValue: [],
        },
        attachTo: document.body,
      });

      const headers = wrapper.findAll('.accordion-header');

      // Focus first header
      (headers[0]?.element as HTMLButtonElement).focus();
      expect(document.activeElement).toBe(headers[0]?.element);

      // Press End
      await headers[0]?.trigger('keydown', { key: 'End' });
      await wrapper.vm.$nextTick();

      // Last non-disabled header should now be focused
      // mockItems has item at index 2 disabled, so should focus index 1
      expect(document.activeElement).toBe(headers[1]?.element);

      wrapper.unmount();
    });

    it('skips disabled items when navigating with ArrowDown', async () => {
      const wrapper = mount(VrlAccordion, {
        props: {
          items: mockItems,
          modelValue: [],
        },
        attachTo: document.body,
      });

      const headers = wrapper.findAll('.accordion-header');

      // Focus second header (index 1)
      (headers[1]?.element as HTMLButtonElement).focus();
      expect(document.activeElement).toBe(headers[1]?.element);

      // Press ArrowDown - should skip disabled item (index 2) and stay at index 1
      // because there are no more enabled items after index 1
      await headers[1]?.trigger('keydown', { key: 'ArrowDown' });

      // Should still be on the second header since the third is disabled
      expect(document.activeElement).toBe(headers[1]?.element);

      wrapper.unmount();
    });

    it('skips disabled items when navigating with ArrowUp', async () => {
      const itemsWithMiddleDisabled: AccordionItem[] = [
        {
          id: 1,
          title: 'Round 1',
          disabled: false,
        },
        {
          id: 2,
          title: 'Round 2',
          disabled: true,
        },
        {
          id: 3,
          title: 'Round 3',
          disabled: false,
        },
      ];

      const wrapper = mount(VrlAccordion, {
        props: {
          items: itemsWithMiddleDisabled,
          modelValue: [],
        },
        attachTo: document.body,
      });

      const headers = wrapper.findAll('.accordion-header');

      // Focus third header (index 2)
      (headers[2]?.element as HTMLButtonElement).focus();
      expect(document.activeElement).toBe(headers[2]?.element);

      // Press ArrowUp - should skip disabled item (index 1) and go to index 0
      await headers[2]?.trigger('keydown', { key: 'ArrowUp' });

      // Should be on the first header
      expect(document.activeElement).toBe(headers[0]?.element);

      wrapper.unmount();
    });

    it('prevents default behavior on navigation keys', async () => {
      const wrapper = mount(VrlAccordion, {
        props: {
          items: mockItems,
          modelValue: [],
        },
      });

      const headers = wrapper.findAll('.accordion-header');

      // Test ArrowDown
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const preventDefaultSpy = vi.spyOn(arrowDownEvent, 'preventDefault');
      await headers[0]?.element.dispatchEvent(arrowDownEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();

      // Test Home
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      const homePreventDefaultSpy = vi.spyOn(homeEvent, 'preventDefault');
      await headers[0]?.element.dispatchEvent(homeEvent);
      expect(homePreventDefaultSpy).toHaveBeenCalled();
    });
  });
});
