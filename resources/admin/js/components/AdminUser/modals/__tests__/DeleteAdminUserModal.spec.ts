import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import DeleteAdminUserModal from '../DeleteAdminUserModal.vue';
import type { DeleteAdminUserModalProps } from '../DeleteAdminUserModal.vue';
import type { Admin } from '@admin/types/admin';

// Mock PrimeVue components
vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template:
      '<button @click="$emit(\'click\')" :disabled="disabled || loading" :loading="loading" :icon="icon" :severity="severity"><slot>{{ label }}</slot></button>',
    props: ['label', 'icon', 'severity', 'disabled', 'loading'],
  },
}));

// Mock BaseModal component
vi.mock('@admin/components/modals/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: `
      <div v-if="visible" class="base-modal">
        <div class="modal-header">
          <slot name="header"></slot>
        </div>
        <div class="modal-content">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `,
    props: ['visible', 'dismissableMask', 'width'],
    emits: ['update:visible'],
  },
}));

describe('DeleteAdminUserModal', () => {
  const mockAdminUser: Admin = {
    id: 1,
    name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    last_login_at: '2024-01-01T00:00:00.000000Z',
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
    deleted_at: null,
  };

  const defaultProps: DeleteAdminUserModalProps = {
    visible: true,
    adminUser: mockAdminUser,
    deleting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when visible is true', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });

    it('does not render when visible is false', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          visible: false,
        },
      });

      expect(wrapper.find('.base-modal').exists()).toBe(false);
    });

    it('renders modal header with correct title', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Confirm Deactivation');
    });

    it('renders warning icon', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.html()).toContain('pi-exclamation-triangle');
    });

    it('renders confirmation message', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Are you sure you want to deactivate this admin user?');
    });

    it('renders footer with Cancel and Deactivate buttons', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Cancel');
      expect(wrapper.text()).toContain('Deactivate');
    });
  });

  describe('User Information Display', () => {
    it('displays user full name', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('John Doe');
    });

    it('displays user email', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('john@example.com');
    });

    it('displays user name from name field when first_name and last_name are missing', () => {
      const userWithOnlyName: Admin = {
        ...mockAdminUser,
        first_name: '',
        last_name: '',
        name: 'Jane Smith',
      };

      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: userWithOnlyName,
        },
      });

      expect(wrapper.text()).toContain('Jane Smith');
    });

    it('renders user information box', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.html()).toContain('bg-gray-50');
    });

    it('displays additional context about deactivation', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain(
        'This will mark the user as inactive. They will no longer be able to access the admin panel.',
      );
    });
  });

  describe('Events', () => {
    it('emits delete event with admin user when Deactivate button is clicked', async () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      vm.handleDelete();
      await nextTick();

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]?.[0]).toEqual(mockAdminUser);
    });

    it('does not emit delete event when adminUser is null', async () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: null,
        },
      });

      const vm = wrapper.vm as any;
      vm.handleDelete();
      await nextTick();

      expect(wrapper.emitted('delete')).toBeFalsy();
    });

    it('emits cancel event when Cancel button is clicked', async () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      vm.handleCancel();
      await nextTick();

      expect(wrapper.emitted('cancel')).toBeTruthy();
    });

    it('emits update:visible false when Cancel button is clicked', async () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      vm.handleCancel();
      await nextTick();

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('emits close event when Cancel button is clicked', async () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      vm.handleCancel();
      await nextTick();

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('disables Cancel button when deleting', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          deleting: true,
        },
      });

      const buttons = wrapper.findAll('button');
      const cancelButton = buttons.find((btn) => btn.text().includes('Cancel'));

      expect(cancelButton?.attributes('disabled')).toBeDefined();
    });

    it('shows loading state on Deactivate button when deleting', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          deleting: true,
        },
      });

      const buttons = wrapper.findAll('button');
      const deactivateButton = buttons.find((btn) => btn.text().includes('Deactivate'));

      expect(deactivateButton?.attributes('loading')).toBeDefined();
    });

    it('enables buttons when not deleting', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          deleting: false,
        },
      });

      const buttons = wrapper.findAll('button');
      const cancelButton = buttons.find((btn) => btn.text().includes('Cancel'));

      expect(cancelButton?.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Name Display', () => {
    it('displays full name correctly', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('John Doe');
    });

    it('displays name from name field when first_name/last_name are missing', () => {
      const userWithOnlyName = {
        ...mockAdminUser,
        first_name: '',
        last_name: '',
        name: 'Jane Smith',
      };

      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: userWithOnlyName,
        },
      });

      expect(wrapper.text()).toContain('Jane Smith');
    });

    it('handles middle names in full name', () => {
      const userWithMiddleName = {
        ...mockAdminUser,
        first_name: '',
        last_name: '',
        name: 'John Michael Doe',
      };

      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: userWithMiddleName,
        },
      });

      expect(wrapper.text()).toContain('John Michael Doe');
    });

    it('handles user with only first name', () => {
      const userWithOnlyFirstName = {
        ...mockAdminUser,
        first_name: 'John',
        last_name: '',
        name: '',
      };

      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: userWithOnlyFirstName,
        },
      });

      expect(wrapper.text()).toContain('John');
    });
  });

  describe('Modal Behavior', () => {
    it('is dismissable by mask click', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const baseModal = wrapper.findComponent({ name: 'BaseModal' });
      expect(baseModal.props('dismissableMask')).toBe(true);
    });

    it('has appropriate width', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const baseModal = wrapper.findComponent({ name: 'BaseModal' });
      expect(baseModal.props('width')).toBe('500px');
    });
  });

  describe('Deactivate Button Styling', () => {
    it('uses danger severity for Deactivate button', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const buttons = wrapper.findAll('button');
      const deactivateButton = buttons.find((btn) => btn.text().includes('Deactivate'));

      expect(deactivateButton?.attributes('severity')).toBe('danger');
    });

    it('displays trash icon on Deactivate button', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const buttons = wrapper.findAll('button');
      const deactivateButton = buttons.find((btn) => btn.text().includes('Deactivate'));

      expect(deactivateButton?.attributes('icon')).toBe('pi pi-trash');
    });
  });

  describe('Edge Cases', () => {
    it('handles null adminUser prop', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: null,
        },
      });

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });

    it('handles adminUser with empty name fields', () => {
      const userWithEmptyNames: Admin = {
        ...mockAdminUser,
        first_name: '',
        last_name: '',
        name: '',
      };

      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: userWithEmptyNames,
        },
      });

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });

    it('handles adminUser with special characters in name', async () => {
      const userWithSpecialChars: Admin = {
        ...mockAdminUser,
        id: 999,
        first_name: "John-O'Brien",
        last_name: 'Müller',
        name: '', // Clear the name field so first_name and last_name are used
        email: 'special@example.com',
      };

      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          visible: true,
          adminUser: userWithSpecialChars,
          deleting: false,
        },
      });

      await nextTick();

      expect(wrapper.text()).toContain("John-O'Brien Müller");
    });

    it('handles adminUser with very long names', async () => {
      const userWithLongName: Admin = {
        ...mockAdminUser,
        id: 998,
        first_name: 'Johnathon',
        last_name: 'VeryLongLastNameThatMightBreakLayout',
        name: '', // Clear the name field so first_name and last_name are used
        email: 'longname@example.com',
      };

      const wrapper = mount(DeleteAdminUserModal, {
        props: {
          visible: true,
          adminUser: userWithLongName,
          deleting: false,
        },
      });

      await nextTick();

      expect(wrapper.text()).toContain('Johnathon VeryLongLastNameThatMightBreakLayout');
    });
  });

  describe('Button Interactions', () => {
    it('triggers delete handler when Deactivate button is clicked', async () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const buttons = wrapper.findAll('button');
      const deactivateButton = buttons.find((btn) => btn.text().includes('Deactivate'));

      await deactivateButton?.trigger('click');
      await nextTick();

      expect(wrapper.emitted('delete')).toBeTruthy();
    });

    it('triggers cancel handler when Cancel button is clicked', async () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const buttons = wrapper.findAll('button');
      const cancelButton = buttons.find((btn) => btn.text().includes('Cancel'));

      await cancelButton?.trigger('click');
      await nextTick();

      expect(wrapper.emitted('cancel')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic warning colors', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.html()).toContain('text-red-500');
    });

    it('provides context about the action consequences', () => {
      const wrapper = mount(DeleteAdminUserModal, {
        props: defaultProps,
      });

      const contextText = wrapper.text();
      expect(contextText).toContain('no longer be able to access');
    });
  });
});
