import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PanelHeader from '../PanelHeader.vue';
import { PhTrophy, PhUsers } from '@phosphor-icons/vue';

describe('PanelHeader', () => {
  it('renders with title only', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Test Header',
      },
    });

    expect(wrapper.text()).toContain('Test Header');
    expect(wrapper.find('span').exists()).toBe(true);
  });

  it('renders with icon', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        icon: PhTrophy,
        title: 'Season Standings',
      },
    });

    expect(wrapper.text()).toContain('Season Standings');
    expect(wrapper.findComponent(PhTrophy).exists()).toBe(true);
  });

  it('renders with icon and custom icon class', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        icon: PhTrophy,
        iconClass: 'text-amber-600',
        title: 'Season Standings',
      },
    });

    const icon = wrapper.findComponent(PhTrophy);
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('text-amber-600');
  });

  it('renders with description', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Divisions',
        description: 'Skill-based groupings for fair competition',
      },
    });

    expect(wrapper.text()).toContain('Divisions');
    expect(wrapper.text()).toContain('Skill-based groupings for fair competition');
    expect(wrapper.find('h3').exists()).toBe(true);
    expect(wrapper.find('p').exists()).toBe(true);
  });

  it('renders with gradient background', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Test Header',
        gradient: 'from-purple-50 to-blue-50',
      },
    });

    const container = wrapper.find('div');
    expect(container.classes()).toContain('bg-gradient-to-r');
    expect(container.classes()).toContain('from-purple-50');
    expect(container.classes()).toContain('to-blue-50');
  });

  it('renders with icon, title, description, and gradient', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        icon: PhTrophy,
        iconClass: 'text-purple-600',
        title: 'Divisions',
        description: 'Skill-based groupings for fair competition',
        gradient: 'from-purple-50 to-blue-50',
      },
    });

    expect(wrapper.findComponent(PhTrophy).exists()).toBe(true);
    expect(wrapper.text()).toContain('Divisions');
    expect(wrapper.text()).toContain('Skill-based groupings for fair competition');
    expect(wrapper.find('div').classes()).toContain('bg-gradient-to-r');
  });

  it('applies border-right class when borderRight prop is true', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Test Header',
        borderRight: true,
      },
    });

    expect(wrapper.find('div').classes()).toContain('border-r');
  });

  it('does not apply border-right class when borderRight prop is false', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Test Header',
        borderRight: false,
      },
    });

    expect(wrapper.find('div').classes()).not.toContain('border-r');
  });

  it('applies correct padding for headers with description/gradient', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Test Header',
        description: 'Test description',
      },
    });

    const container = wrapper.find('div');
    expect(container.classes()).toContain('py-3');
    expect(container.classes()).toContain('px-4');
    expect(container.classes()).not.toContain('mx-4');
  });

  it('applies correct padding for simple headers without description/gradient', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Test Header',
      },
    });

    const container = wrapper.find('div');
    expect(container.classes()).toContain('py-2');
    expect(container.classes()).toContain('mx-4');
    expect(container.classes()).not.toContain('px-4');
  });

  it('uses custom icon size', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        icon: PhUsers,
        iconSize: 20,
        title: 'Test Header',
      },
    });

    const icon = wrapper.findComponent(PhUsers);
    expect(icon.props('size')).toBe(20);
  });

  it('uses custom icon weight', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        icon: PhUsers,
        iconWeight: 'bold',
        title: 'Test Header',
      },
    });

    const icon = wrapper.findComponent(PhUsers);
    expect(icon.props('weight')).toBe('bold');
  });

  it('uses default icon weight (fill) when not specified', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        icon: PhUsers,
        title: 'Test Header',
      },
    });

    const icon = wrapper.findComponent(PhUsers);
    expect(icon.props('weight')).toBe('fill');
  });

  it('applies correct text color with gradient', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Test Header',
        description: 'Test description',
        gradient: 'from-purple-50 to-blue-50',
      },
    });

    const title = wrapper.find('h3');
    expect(title.classes()).toContain('text-gray-900');
  });

  it('applies correct text color without gradient', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Test Header',
        description: 'Test description',
      },
    });

    const title = wrapper.find('h3');
    expect(title.classes()).toContain('text-surface-700');
  });

  it('always includes base classes', () => {
    const wrapper = mount(PanelHeader, {
      props: {
        title: 'Test Header',
      },
    });

    const container = wrapper.find('div');
    expect(container.classes()).toContain('flex');
    expect(container.classes()).toContain('items-center');
    expect(container.classes()).toContain('gap-3');
    expect(container.classes()).toContain('border-b');
    expect(container.classes()).toContain('border-gray-200');
    expect(container.classes()).toContain('w-full');
  });
});
