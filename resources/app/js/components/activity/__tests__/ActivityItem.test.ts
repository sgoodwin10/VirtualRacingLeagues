import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ActivityItem from '../ActivityItem.vue';
import type { FormattedActivity } from '@app/types/activityLog';

describe('ActivityItem', () => {
  const mockActivity: FormattedActivity = {
    id: 1,
    description: 'Created driver John Doe',
    icon: 'pi-user',
    iconColor: 'text-green-500',
    causer: 'Admin User',
    entityType: 'driver',
    entityName: 'John Doe',
    action: 'create',
    context: 'F1 Championship > 2024 > Round 1',
    timestamp: 'Jan 1, 2024, 12:00 PM',
    relativeTime: '2 hours ago',
  };

  it('renders activity correctly', () => {
    const wrapper = mount(ActivityItem, {
      props: {
        activity: mockActivity,
      },
    });

    expect(wrapper.text()).toContain('Created driver John Doe');
    expect(wrapper.text()).toContain('by Admin User');
    expect(wrapper.text()).toContain('2 hours ago');
    expect(wrapper.text()).toContain('F1 Championship > 2024 > Round 1');
  });

  it('displays correct icon', () => {
    const wrapper = mount(ActivityItem, {
      props: {
        activity: mockActivity,
      },
    });

    const icon = wrapper.find('.pi-user');
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('text-green-500');
  });

  it('applies correct background color for green action', () => {
    const wrapper = mount(ActivityItem, {
      props: {
        activity: mockActivity,
      },
    });

    const iconContainer = wrapper.find('.bg-green-100');
    expect(iconContainer.exists()).toBe(true);
  });

  it('shows context breadcrumb when context is provided', () => {
    const wrapper = mount(ActivityItem, {
      props: {
        activity: mockActivity,
      },
    });

    expect(wrapper.text()).toContain('F1 Championship > 2024 > Round 1');
  });

  it('hides context when not provided', () => {
    const activityWithoutContext: FormattedActivity = {
      ...mockActivity,
      context: '',
    };

    const wrapper = mount(ActivityItem, {
      props: {
        activity: activityWithoutContext,
      },
    });

    expect(wrapper.text()).not.toContain('>');
  });

  it('does not show changes toggle when no changes', () => {
    const wrapper = mount(ActivityItem, {
      props: {
        activity: mockActivity,
      },
    });

    expect(wrapper.text()).not.toContain('Show Changes');
  });

  it('shows changes toggle when changes are present', () => {
    const activityWithChanges: FormattedActivity = {
      ...mockActivity,
      changes: {
        old: { name: 'Old Name' },
        new: { name: 'New Name' },
      },
    };

    const wrapper = mount(ActivityItem, {
      props: {
        activity: activityWithChanges,
      },
    });

    expect(wrapper.text()).toContain('Show Changes');
  });

  it('toggles changes section when button is clicked', async () => {
    const activityWithChanges: FormattedActivity = {
      ...mockActivity,
      changes: {
        old: { name: 'Old Name' },
        new: { name: 'New Name' },
      },
    };

    const wrapper = mount(ActivityItem, {
      props: {
        activity: activityWithChanges,
      },
    });

    expect(wrapper.text()).not.toContain('Old Values');

    const toggleButton = wrapper.find('button');
    await toggleButton.trigger('click');

    expect(wrapper.text()).toContain('Old Values');
    expect(wrapper.text()).toContain('New Values');
    expect(wrapper.text()).toContain('Hide Changes');

    await toggleButton.trigger('click');

    expect(wrapper.text()).not.toContain('Old Values');
    expect(wrapper.text()).toContain('Show Changes');
  });

  it('displays old and new values when expanded', async () => {
    const activityWithChanges: FormattedActivity = {
      ...mockActivity,
      changes: {
        old: { name: 'Old Name' },
        new: { name: 'New Name' },
      },
    };

    const wrapper = mount(ActivityItem, {
      props: {
        activity: activityWithChanges,
      },
    });

    const toggleButton = wrapper.find('button');
    await toggleButton.trigger('click');

    expect(wrapper.html()).toContain('Old Name');
    expect(wrapper.html()).toContain('New Name');
  });

  it('shows timestamp as title attribute', () => {
    const wrapper = mount(ActivityItem, {
      props: {
        activity: mockActivity,
      },
    });

    const timeElement = wrapper.find('[title="Jan 1, 2024, 12:00 PM"]');
    expect(timeElement.exists()).toBe(true);
    expect(timeElement.text()).toBe('2 hours ago');
  });

  it('applies hover styles', () => {
    const wrapper = mount(ActivityItem, {
      props: {
        activity: mockActivity,
      },
    });

    const container = wrapper.find('.hover\\:bg-\\[var\\(--bg-hover\\)\\]');
    expect(container.exists()).toBe(true);
  });
});
