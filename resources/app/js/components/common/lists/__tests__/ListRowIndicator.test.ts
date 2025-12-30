/**
 * ListRowIndicator Component Tests
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ListRowIndicator from '../ListRowIndicator.vue';

describe('ListRowIndicator', () => {
  it('renders with active status', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.classes()).toContain('bg-[var(--green)]');
    expect(wrapper.classes()).toContain('shadow-[0_0_8px_var(--green)]');
  });

  it('renders with upcoming status', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'upcoming',
      },
    });

    expect(wrapper.classes()).toContain('bg-[var(--cyan)]');
  });

  it('renders with completed status', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'completed',
      },
    });

    expect(wrapper.classes()).toContain('bg-[var(--text-muted)]');
  });

  it('renders with pending status', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'pending',
      },
    });

    expect(wrapper.classes()).toContain('bg-[var(--orange)]');
  });

  it('renders with inactive status', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'inactive',
      },
    });

    expect(wrapper.classes()).toContain('bg-[var(--border)]');
  });

  it('applies default height of 40px', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.attributes('style')).toContain('height: 40px');
  });

  it('applies default width of 4px', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.attributes('style')).toContain('width: 4px');
  });

  it('applies custom height as number', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'active',
        height: 60,
      },
    });

    expect(wrapper.attributes('style')).toContain('height: 60px');
  });

  it('applies custom width as string', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'active',
        width: '6px',
      },
    });

    expect(wrapper.attributes('style')).toContain('width: 6px');
  });

  it('applies ARIA status role', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.attributes('role')).toBe('status');
  });

  it('applies correct ARIA label', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'upcoming',
      },
    });

    expect(wrapper.attributes('aria-label')).toBe('Status: upcoming');
  });

  it('applies custom classes', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'active',
        class: 'custom-indicator',
      },
    });

    expect(wrapper.classes()).toContain('custom-indicator');
  });

  it('has rounded corners', () => {
    const wrapper = mount(ListRowIndicator, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.classes()).toContain('rounded-full');
  });
});
