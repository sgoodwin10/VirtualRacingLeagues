import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ActivityLogDetailModal from './ActivityLogDetailModal.vue';
import type { Activity } from '@admin/types/activityLog';

describe('ActivityLogDetailModal', () => {
  const mockActivity: Activity = {
    id: 1,
    log_name: 'admin',
    description: 'Created admin user',
    subject_type: 'Admin',
    subject_id: 1,
    causer_type: 'Admin',
    causer_id: 1,
    event: 'created',
    properties: {
      attributes: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
    batch_uuid: null,
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  };

  const createWrapper = (props: any = {}) => {
    return mount(ActivityLogDetailModal, {
      props: {
        visible: true,
        activity: mockActivity,
        ...props,
      },
      global: {
        stubs: {
          BaseModal: {
            template:
              '<div v-if="visible" class="base-modal"><slot name="header" /><slot /><slot name="footer" /></div>',
            props: ['visible', 'dismissableMask', 'width'],
          },
          Button: {
            template: '<button type="button">{{ label }}</button>',
            props: ['label', 'icon', 'size', 'severity'],
          },
          Badge: {
            template: '<span class="badge">{{ text }}</span>',
            props: ['text', 'variant', 'size', 'icon'],
          },
        },
      },
    });
  };

  it('renders without errors', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders BaseModal component', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.base-modal').exists()).toBe(true);
  });

  it('displays activity description', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Created admin user');
  });

  it('displays activity ID', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('ID:');
  });

  it('emits update:visible when closing', async () => {
    const wrapper = createWrapper();

    const vm = wrapper.vm as any;
    vm.handleClose();

    expect(wrapper.emitted('update:visible')).toBeTruthy();
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
  });

  it('emits close event when closing', async () => {
    const wrapper = createWrapper();

    const vm = wrapper.vm as any;
    vm.handleClose();

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
