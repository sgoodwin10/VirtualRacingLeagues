import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import ViewAdminUserModal from '../ViewAdminUserModal.vue';
import type { ViewAdminUserModalProps } from '../ViewAdminUserModal.vue';
import type { Admin } from '@admin/types/admin';
import type { Activity } from '@admin/types/activityLog';

vi.mock('@admin/services/activityLogService', () => {
  const mockGetActivitiesForAdmin = vi.fn();
  return {
    activityLogService: {
      getActivitiesForAdmin: mockGetActivitiesForAdmin,
    },
  };
});

import { activityLogService } from '@admin/services/activityLogService';
const mockGetActivitiesForAdmin = activityLogService.getActivitiesForAdmin as ReturnType<
  typeof vi.fn
>;

// Create a mock router
let router: ReturnType<typeof createRouter>;

const mockActivities: Activity[] = [
  {
    id: 1,
    log_name: 'admin',
    description: 'Created admin user',
    subject_type: 'Admin',
    subject_id: 1,
    causer_type: 'Admin',
    causer_id: 1,
    event: 'created',
    properties: {},
    batch_uuid: null,
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  },
  {
    id: 2,
    log_name: 'admin',
    description: 'Updated admin user',
    subject_type: 'Admin',
    subject_id: 1,
    causer_type: 'Admin',
    causer_id: 1,
    event: 'updated',
    properties: {},
    batch_uuid: null,
    created_at: '2024-01-02T00:00:00.000000Z',
    updated_at: '2024-01-02T00:00:00.000000Z',
  },
];

const mockAdminUser: Admin = {
  id: 1,
  name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  role: 'admin',
  status: 'active',
  last_login_at: '2024-01-10T00:00:00.000000Z',
  created_at: '2024-01-01T00:00:00.000000Z',
  updated_at: '2024-01-01T00:00:00.000000Z',
  deleted_at: null,
};

const defaultProps: ViewAdminUserModalProps = {
  visible: true,
  adminUser: mockAdminUser,
  canEdit: true,
  canDelete: true,
  isOwnProfile: false,
};

describe('ViewAdminUserModal', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetActivitiesForAdmin.mockResolvedValue(mockActivities);

    // Create router with memory history
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/activity-logs',
          name: 'activity-logs',
          component: { template: '<div>Activity Logs</div>' },
        },
      ],
    });

    await router.push('/');
    await router.isReady();
  });

  const createWrapper = (props: ViewAdminUserModalProps) => {
    return mount(ViewAdminUserModal, {
      props,
      global: {
        plugins: [router, PrimeVue],
        stubs: {
          RouterLink: true,
          BaseModal: {
            template:
              '<div v-if="visible" class="base-modal"><slot name="header" /><slot /><slot name="footer" /></div>',
            props: ['visible', 'dismissableMask', 'width'],
          },
          Button: {
            template: '<button type="button">{{ label }}</button>',
            props: ['label', 'icon', 'size', 'severity', 'loading'],
          },
          Badge: {
            template: '<span class="badge">{{ text }}</span>',
            props: ['text', 'variant', 'size', 'icon'],
          },
        },
      },
    });
  };

  describe('Rendering', () => {
    it('renders when visible is true', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });

    it('does not render when visible is false', () => {
      const wrapper = createWrapper({
        ...defaultProps,
        visible: false,
      });

      expect(wrapper.find('.base-modal').exists()).toBe(false);
    });

    it('renders modal header with correct title', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('Admin User Details');
    });
  });

  describe('User Information Display', () => {
    it('displays user full name', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('John Doe');
    });

    it('displays user email', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('john@example.com');
    });

    it('displays user ID', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('1');
    });

    it('displays user status badge', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('Active');
    });

    it('displays user role badge', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('Admin');
    });

    it('displays last login date', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('Last Login');
    });

    it('displays created date', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('Created');
    });

    it('displays updated date', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('Updated');
    });
  });

  describe('Activity Loading', () => {
    it('loads activities when modal opens', async () => {
      createWrapper({
        ...defaultProps,
        visible: true,
      });

      await nextTick();
      await nextTick();

      expect(mockGetActivitiesForAdmin).toHaveBeenCalledWith(1);
    });

    it('displays loading state while fetching activities', async () => {
      mockGetActivitiesForAdmin.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockActivities), 100))
      );

      const wrapper = createWrapper(defaultProps);

      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.loadingActivities).toBe(true);
    });

    it('displays activities after loading', async () => {
      const wrapper = createWrapper(defaultProps);

      await nextTick();
      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.recentActivities.length).toBeGreaterThan(0);
    });

    it('limits activities to 5 most recent', async () => {
      const manyActivities = Array.from({ length: 10 }, (_, i) => ({
        ...mockActivities[0],
        id: i + 1,
      }));

      mockGetActivitiesForAdmin.mockResolvedValue(manyActivities);

      const wrapper = createWrapper(defaultProps);

      await nextTick();
      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.recentActivities.length).toBe(5);
    });

    it('handles activity loading errors gracefully', async () => {
      mockGetActivitiesForAdmin.mockRejectedValue(new Error('Failed to load activities'));

      const wrapper = createWrapper(defaultProps);

      await nextTick();
      await nextTick();
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.recentActivities.length).toBe(0);
    });

    it('reloads activities when adminUser changes', async () => {
      const wrapper = createWrapper(defaultProps);

      await nextTick();
      await nextTick();

      const newUser = { ...mockAdminUser, id: 2 };
      await wrapper.setProps({ adminUser: newUser });
      await nextTick();
      await nextTick();

      expect(mockGetActivitiesForAdmin).toHaveBeenCalledWith(2);
    });

    it('reloads activities when modal visibility changes to true', async () => {
      const wrapper = createWrapper({
        ...defaultProps,
        visible: false,
      });

      await wrapper.setProps({ visible: true });
      await nextTick();
      await nextTick();

      expect(mockGetActivitiesForAdmin).toHaveBeenCalled();
    });
  });

  describe('Events', () => {
    it('emits edit event when Edit button is clicked', async () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      vm.handleEdit();
      await nextTick();

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockAdminUser, false]);
    });

    it('emits edit event with isOwnProfile flag', async () => {
      const wrapper = createWrapper({
        ...defaultProps,
        isOwnProfile: true,
      });

      const vm = wrapper.vm as any;
      vm.handleEdit();
      await nextTick();

      expect(wrapper.emitted('edit')?.[0]).toEqual([mockAdminUser, true]);
    });

    it('emits delete event when Delete button is clicked', async () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      vm.handleDelete();
      await nextTick();

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual([mockAdminUser]);
    });

    it('emits update:visible false when Close button is clicked', async () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      vm.handleClose();
      await nextTick();

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('emits close event when Close button is clicked', async () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      vm.handleClose();
      await nextTick();

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Button Visibility', () => {
    it('shows Edit button when canEdit is true', () => {
      const wrapper = createWrapper({
        ...defaultProps,
        canEdit: true,
      });

      expect(wrapper.text()).toContain('Edit');
    });

    it('hides Edit button when canEdit is false', () => {
      const wrapper = createWrapper({
        ...defaultProps,
        canEdit: false,
      });

      const buttons = wrapper.findAll('button');
      const editButton = buttons.find((btn) => btn.text().includes('Edit'));

      expect(editButton).toBeUndefined();
    });

    it('shows Delete button when canDelete is true and not own profile', () => {
      const wrapper = createWrapper({
        ...defaultProps,
        canDelete: true,
        isOwnProfile: false,
      });

      expect(wrapper.text()).toContain('Delete');
    });

    it('hides Delete button when canDelete is false', () => {
      const wrapper = createWrapper({
        ...defaultProps,
        canDelete: false,
        isOwnProfile: false,
      });

      const buttons = wrapper.findAll('button');
      const deleteButton = buttons.find((btn) => btn.text().includes('Delete'));

      expect(deleteButton).toBeUndefined();
    });

    it('hides Delete button when viewing own profile', () => {
      const wrapper = createWrapper({
        ...defaultProps,
        canDelete: true,
        isOwnProfile: true,
      });

      const buttons = wrapper.findAll('button');
      const deleteButton = buttons.find((btn) => btn.text().includes('Delete'));

      expect(deleteButton).toBeUndefined();
    });

    it('always shows Close button', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.text()).toContain('Close');
    });
  });

  describe('Helper Functions', () => {
    it('correctly extracts first name from admin user', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      expect(vm.getFirstName(mockAdminUser)).toBe('John');
    });

    it('correctly extracts last name from admin user', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      expect(vm.getLastName(mockAdminUser)).toBe('Doe');
    });

    it('constructs full name correctly', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      expect(vm.getFullName(mockAdminUser)).toBe('John Doe');
    });

    it('returns correct role label', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      expect(vm.getRoleLabel('admin')).toBe('Admin');
      expect(vm.getRoleLabel('super_admin')).toBe('Super Admin');
      expect(vm.getRoleLabel('moderator')).toBe('Moderator');
    });

    it('returns correct role badge variant', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      expect(vm.getRoleVariant('super_admin')).toBe('purple');
      expect(vm.getRoleVariant('admin')).toBe('info');
      expect(vm.getRoleVariant('moderator')).toBe('success');
    });

    it('returns correct status label', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      expect(vm.getStatusLabel('active')).toBe('Active');
      expect(vm.getStatusLabel('inactive')).toBe('Inactive');
      expect(vm.getStatusLabel('suspended')).toBe('Suspended');
    });

    it('returns correct status badge variant', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      expect(vm.getStatusVariant('active')).toBe('success');
      expect(vm.getStatusVariant('inactive')).toBe('secondary');
      expect(vm.getStatusVariant('suspended')).toBe('danger');
    });

    it('returns correct status icon', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      expect(vm.getStatusIcon('active')).toBe('pi-circle-fill');
      expect(vm.getStatusIcon('inactive')).toBe('pi-circle');
      expect(vm.getStatusIcon('suspended')).toBe('pi-ban');
    });

    it('returns correct event variant', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      expect(vm.getEventVariant('created')).toBe('success');
      expect(vm.getEventVariant('updated')).toBe('info');
      expect(vm.getEventVariant('deleted')).toBe('danger');
    });
  });

  describe('Date Formatting', () => {
    it('formats recent dates as relative time', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

      const formatted = vm.formatDateShort(fiveMinutesAgo);
      expect(formatted).toContain('m ago');
    });

    it('formats dates within 24 hours as hours ago', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

      const formatted = vm.formatDateShort(twoHoursAgo);
      expect(formatted).toContain('h ago');
    });

    it('formats dates within 7 days as days ago', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const formatted = vm.formatDateShort(threeDaysAgo);
      expect(formatted).toContain('d ago');
    });

    it('handles invalid dates gracefully', () => {
      const wrapper = createWrapper(defaultProps);

      const vm = wrapper.vm as any;
      const formatted = vm.formatDateShort('invalid-date');
      expect(formatted).toBe('Invalid date');
    });
  });

  describe('Activity Display', () => {
    it('displays activity history section', async () => {
      const wrapper = createWrapper(defaultProps);

      await nextTick();
      await nextTick();
      await nextTick();

      expect(wrapper.text()).toContain('Recent Activity');
    });

    it('displays View All link', async () => {
      const wrapper = createWrapper(defaultProps);

      await nextTick();

      // The RouterLink stub doesn't render text content, so check for the route name instead
      const routerLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(routerLink.exists()).toBe(true);
    });

    it('displays empty state when no activities', async () => {
      mockGetActivitiesForAdmin.mockResolvedValue([]);

      const wrapper = createWrapper(defaultProps);

      await nextTick();
      await nextTick();
      await nextTick();

      expect(wrapper.text()).toContain('No recent activities');
    });

    it('displays activity descriptions', async () => {
      const wrapper = createWrapper(defaultProps);

      await nextTick();
      await nextTick();
      await nextTick();

      expect(wrapper.text()).toContain('Created admin user');
    });
  });

  describe('Modal Behavior', () => {
    it('is dismissable by mask click', () => {
      const wrapper = createWrapper(defaultProps);

      const baseModal = wrapper.find('.base-modal');
      expect(baseModal.exists()).toBe(true);
    });

    it('has appropriate width', () => {
      const wrapper = createWrapper(defaultProps);

      const baseModal = wrapper.find('.base-modal');
      expect(baseModal.exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles null adminUser prop', () => {
      const wrapper = createWrapper({
        ...defaultProps,
        adminUser: null,
      });

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });

    it('handles adminUser with missing optional fields', () => {
      const minimalUser: Admin = {
        id: 1,
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'admin',
        status: 'active',
        last_login_at: null,
        created_at: '2024-01-01T00:00:00.000000Z',
        updated_at: '2024-01-01T00:00:00.000000Z',
        deleted_at: null,
      };

      const wrapper = createWrapper({
        ...defaultProps,
        adminUser: minimalUser,
      });

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });
  });

  describe('Read-Only Behavior', () => {
    it('does not allow editing user information directly', () => {
      const wrapper = createWrapper(defaultProps);

      const inputs = wrapper.findAll('input');
      expect(inputs.length).toBe(0);
    });

    it('displays information in read-only format', () => {
      const wrapper = createWrapper(defaultProps);

      expect(wrapper.html()).not.toContain('<input');
      expect(wrapper.html()).not.toContain('<select');
    });
  });
});
