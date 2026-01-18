import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlListRowIndicator from '../VrlListRowIndicator.vue';

describe('VrlListRowIndicator', () => {
  it('renders with active status (green)', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.classes()).toContain('bg-[var(--green)]');
    expect(wrapper.attributes('aria-label')).toBe('Status: active');
    expect(wrapper.attributes('data-status')).toBe('active');
  });

  it('renders with pending status (orange)', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'pending',
      },
    });

    expect(wrapper.classes()).toContain('bg-[var(--orange)]');
    expect(wrapper.attributes('aria-label')).toBe('Status: pending');
    expect(wrapper.attributes('data-status')).toBe('pending');
  });

  it('renders with inactive status (muted)', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'inactive',
      },
    });

    expect(wrapper.classes()).toContain('bg-[var(--text-muted)]');
    expect(wrapper.attributes('aria-label')).toBe('Status: inactive');
    expect(wrapper.attributes('data-status')).toBe('inactive');
  });

  it('applies default dimensions (4px × 40px)', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.element.style.width).toBe('4px');
    expect(wrapper.element.style.height).toBe('40px');
  });

  it('applies custom dimensions as strings', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'active',
        width: '6px',
        height: '50px',
      },
    });

    expect(wrapper.element.style.width).toBe('6px');
    expect(wrapper.element.style.height).toBe('50px');
  });

  it('applies custom dimensions as numbers (converts to px)', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'active',
        width: 3,
        height: 32,
      },
    });

    expect(wrapper.element.style.width).toBe('3px');
    expect(wrapper.element.style.height).toBe('32px');
  });

  it('has proper ARIA attributes', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'pending',
      },
    });

    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-label')).toBe('Status: pending');
  });

  it('has base indicator classes', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.classes()).toContain('w-1');
    expect(wrapper.classes()).toContain('h-10');
    expect(wrapper.classes()).toContain('shrink-0');
  });

  it('has data-test attribute', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.attributes('data-test')).toBe('list-row-indicator');
  });

  it('applies custom classes', () => {
    const wrapper = mount(VrlListRowIndicator, {
      props: {
        status: 'active',
        class: 'custom-class',
      },
    });

    expect(wrapper.classes()).toContain('custom-class');
    expect(wrapper.classes()).toContain('w-1');
  });
});
