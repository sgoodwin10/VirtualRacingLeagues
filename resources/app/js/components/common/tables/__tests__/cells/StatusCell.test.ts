import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusCell from '../../cells/StatusCell.vue';

describe('StatusCell', () => {
  it('renders active status', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.text()).toBe('Active');
  });

  it('renders pending status', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'pending',
      },
    });

    expect(wrapper.text()).toBe('Pending');
  });

  it('renders inactive status', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'inactive',
      },
    });

    expect(wrapper.text()).toBe('Inactive');
  });

  it('renders scheduled status', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'scheduled',
      },
    });

    expect(wrapper.text()).toBe('Scheduled');
  });

  it('renders error status', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'error',
      },
    });

    expect(wrapper.text()).toBe('Error');
  });

  it('renders failed status', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'failed',
      },
    });

    expect(wrapper.text()).toBe('Failed');
  });

  it('renders completed status', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'completed',
      },
    });

    expect(wrapper.text()).toBe('Completed');
  });

  it('renders custom label when provided', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'active',
        label: 'Running',
      },
    });

    expect(wrapper.text()).toBe('Running');
  });

  it('shows dot by default', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.find('.dot').exists()).toBe(true);
  });

  it('hides dot when showDot is false', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'active',
        showDot: false,
      },
    });

    expect(wrapper.find('.dot').exists()).toBe(false);
  });

  it('applies active class', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'active',
      },
    });

    expect(wrapper.classes()).toContain('status-badge');
    expect(wrapper.classes()).toContain('active');
  });

  it('applies pending class', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'pending',
      },
    });

    expect(wrapper.classes()).toContain('status-badge');
    expect(wrapper.classes()).toContain('pending');
  });

  it('applies inactive class', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'inactive',
      },
    });

    expect(wrapper.classes()).toContain('status-badge');
    expect(wrapper.classes()).toContain('inactive');
  });

  it('applies error class', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'error',
      },
    });

    expect(wrapper.classes()).toContain('status-badge');
    expect(wrapper.classes()).toContain('error');
  });

  it('applies completed class', () => {
    const wrapper = mount(StatusCell, {
      props: {
        status: 'completed',
      },
    });

    expect(wrapper.classes()).toContain('status-badge');
    expect(wrapper.classes()).toContain('completed');
  });
});
