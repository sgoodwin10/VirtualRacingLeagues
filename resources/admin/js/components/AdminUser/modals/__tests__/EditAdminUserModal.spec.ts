import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import EditAdminUserModal from '../EditAdminUserModal.vue';
import type { EditAdminUserModalProps, RoleOption } from '../EditAdminUserModal.vue';
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

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :disabled="disabled" :class="{ \'p-invalid\': invalid }" />',
    props: ['modelValue', 'type', 'disabled', 'invalid', 'required'],
    emits: ['update:modelValue', 'input'],
  },
}));

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template:
      '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\', $event)" :disabled="disabled" :class="{ \'p-invalid\': invalid }"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
    props: [
      'modelValue',
      'options',
      'optionLabel',
      'optionValue',
      'placeholder',
      'disabled',
      'invalid',
    ],
    emits: ['update:modelValue', 'change'],
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

describe('EditAdminUserModal', () => {
  const mockRoleOptions: RoleOption[] = [
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Admin', value: 'admin' },
    { label: 'Moderator', value: 'moderator' },
  ];

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

  const defaultProps: EditAdminUserModalProps = {
    visible: true,
    adminUser: mockAdminUser,
    availableRoles: mockRoleOptions,
    saving: false,
    disableRoleEdit: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when visible is true', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });

    it('does not render when visible is false', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          visible: false,
        },
      });

      expect(wrapper.find('.base-modal').exists()).toBe(false);
    });

    it('renders modal header with correct title', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Edit Admin User');
    });

    it('renders all form fields', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.find('#edit-first-name').exists()).toBe(true);
      expect(wrapper.find('#edit-last-name').exists()).toBe(true);
      expect(wrapper.find('#edit-email').exists()).toBe(true);
      expect(wrapper.find('#edit-role').exists()).toBe(true);
    });

    it('renders footer with Cancel and Save buttons', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Cancel');
      expect(wrapper.text()).toContain('Save Changes');
    });
  });

  describe('Form Initialization', () => {
    it('loads admin user data into form', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.first_name).toBe('John');
      expect(vm.formData.last_name).toBe('Doe');
      expect(vm.formData.email).toBe('john@example.com');
      expect(vm.formData.role).toBe('admin');
    });

    it('handles admin user with only name field', async () => {
      const userWithOnlyName: Admin = {
        ...mockAdminUser,
        first_name: '',
        last_name: '',
        name: 'Jane Smith',
      };

      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: userWithOnlyName,
        },
      });

      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.first_name).toBe('Jane');
      expect(vm.formData.last_name).toBe('Smith');
    });

    it('updates form when adminUser prop changes', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const newUser: Admin = {
        ...mockAdminUser,
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        role: 'moderator',
      };

      await wrapper.setProps({ adminUser: newUser });
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.first_name).toBe('Jane');
      expect(vm.formData.last_name).toBe('Smith');
      expect(vm.formData.email).toBe('jane@example.com');
      expect(vm.formData.role).toBe('moderator');
    });
  });

  describe('Form Validation', () => {
    it('validates required first name field', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = '';
      vm.handleSave();
      await nextTick();

      expect(vm.errors.first_name).toBe('First name is required');
    });

    it('validates required last name field', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.last_name = '';
      vm.handleSave();
      await nextTick();

      expect(vm.errors.last_name).toBe('Last name is required');
    });

    it('validates required email field', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.email = '';
      vm.handleSave();
      await nextTick();

      expect(vm.errors.email).toBe('Email is required');
    });

    it('validates email format', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.email = 'invalid-email';
      vm.handleSave();
      await nextTick();

      expect(vm.errors.email).toBe('Please enter a valid email address');
    });

    it('validates required role field', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.role = '';
      vm.handleSave();
      await nextTick();

      expect(vm.errors.role).toBe('Role is required');
    });

    it('passes validation with all valid fields', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      const result = vm.validateForm();

      expect(result).toBe(true);
      expect(Object.keys(vm.errors).length).toBe(0);
    });

    it('displays validation error messages', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = '';
      vm.handleSave();
      await nextTick();

      expect(wrapper.html()).toContain('First name is required');
    });
  });

  describe('User Interactions', () => {
    it('updates form data when typing in first name', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const firstNameInput = wrapper.find('#edit-first-name');
      await firstNameInput.setValue('Jane');
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.first_name).toBe('Jane');
    });

    it('updates form data when typing in last name', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const lastNameInput = wrapper.find('#edit-last-name');
      await lastNameInput.setValue('Smith');
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.last_name).toBe('Smith');
    });

    it('updates form data when typing in email', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const emailInput = wrapper.find('#edit-email');
      await emailInput.setValue('newemail@example.com');
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.email).toBe('newemail@example.com');
    });

    it('updates form data when selecting a role', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const roleSelect = wrapper.find('#edit-role');
      await roleSelect.setValue('moderator');
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.role).toBe('moderator');
    });
  });

  describe('Events', () => {
    it('emits save event with form data when validation passes', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = 'Jane';
      vm.formData.last_name = 'Smith';
      vm.formData.email = 'jane@example.com';
      vm.formData.role = 'moderator';

      vm.handleSave();
      await nextTick();

      expect(wrapper.emitted('save')).toBeTruthy();
      expect(wrapper.emitted('save')?.[0]?.[0]).toEqual({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        role: 'moderator',
      });
    });

    it('does not emit save event when validation fails', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = '';
      vm.handleSave();
      await nextTick();

      expect(wrapper.emitted('save')).toBeFalsy();
    });

    it('emits cancel event when Cancel button is clicked', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      vm.handleCancel();
      await nextTick();

      expect(wrapper.emitted('cancel')).toBeTruthy();
    });

    it('emits update:visible false when Cancel button is clicked', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      vm.handleCancel();
      await nextTick();

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('emits close event when Cancel button is clicked', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      vm.handleCancel();
      await nextTick();

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('disables form inputs when saving', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          saving: true,
        },
      });

      const firstNameInput = wrapper.find('#edit-first-name');
      const lastNameInput = wrapper.find('#edit-last-name');
      const emailInput = wrapper.find('#edit-email');
      const roleSelect = wrapper.find('#edit-role');

      expect(firstNameInput.attributes('disabled')).toBeDefined();
      expect(lastNameInput.attributes('disabled')).toBeDefined();
      expect(emailInput.attributes('disabled')).toBeDefined();
      expect(roleSelect.attributes('disabled')).toBeDefined();
    });

    it('disables Cancel button when saving', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          saving: true,
        },
      });

      const buttons = wrapper.findAll('button');
      const cancelButton = buttons.find((btn) => btn.text().includes('Cancel'));

      expect(cancelButton?.attributes('disabled')).toBeDefined();
    });

    it('shows loading state on Save button when saving', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          saving: true,
        },
      });

      const buttons = wrapper.findAll('button');
      const saveButton = buttons.find((btn) => btn.text().includes('Save'));

      expect(saveButton?.attributes('loading')).toBeDefined();
    });
  });

  describe('Role Edit Restrictions', () => {
    it('disables role select when disableRoleEdit is true', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          disableRoleEdit: true,
        },
      });

      const roleSelect = wrapper.find('#edit-role');
      expect(roleSelect.attributes('disabled')).toBeDefined();
    });

    it('shows helper text when role editing is disabled', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          disableRoleEdit: true,
        },
      });

      expect(wrapper.text()).toContain('You cannot change your own role');
    });

    it('does not disable role select when disableRoleEdit is false', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          disableRoleEdit: false,
        },
      });

      const roleSelect = wrapper.find('#edit-role');
      expect(roleSelect.attributes('disabled')).toBeUndefined();
    });

    it('allows role changes when not editing own profile', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          disableRoleEdit: false,
        },
      });

      const vm = wrapper.vm as any;
      const roleSelect = wrapper.find('#edit-role');

      await roleSelect.setValue('super_admin');
      await nextTick();

      expect(vm.formData.role).toBe('super_admin');
    });
  });

  describe('Partial Updates', () => {
    it('preserves unchanged field values', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Only change first name
      vm.formData.first_name = 'Jane';

      vm.handleSave();
      await nextTick();

      const emittedData = wrapper.emitted('save')?.[0]?.[0] as any;
      expect(emittedData?.first_name).toBe('Jane');
      expect(emittedData?.last_name).toBe('Doe');
      expect(emittedData?.email).toBe('john@example.com');
      expect(emittedData?.role).toBe('admin');
    });

    it('allows updating only email', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.email = 'newemail@example.com';

      vm.handleSave();
      await nextTick();

      const emittedData = wrapper.emitted('save')?.[0]?.[0] as any;
      expect(emittedData?.email).toBe('newemail@example.com');
    });

    it('allows updating only role', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.role = 'moderator';

      vm.handleSave();
      await nextTick();

      const emittedData = wrapper.emitted('save')?.[0]?.[0] as any;
      expect(emittedData?.role).toBe('moderator');
    });
  });

  describe('Role Options', () => {
    it('displays all available role options', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const roleSelect = wrapper.find('#edit-role');
      const options = roleSelect.findAll('option');

      expect(options.length).toBe(3);
      expect(options[0]?.text()).toBe('Super Admin');
      expect(options[1]?.text()).toBe('Admin');
      expect(options[2]?.text()).toBe('Moderator');
    });

    it('preselects current user role', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      await nextTick();

      const roleSelect = wrapper.find('#edit-role');
      expect((roleSelect.element as HTMLSelectElement).value).toBe('admin');
    });
  });

  describe('Error Display', () => {
    it('displays invalid class on input with error', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = '';
      vm.handleSave();
      await nextTick();

      const firstNameInput = wrapper.find('#edit-first-name');
      expect(firstNameInput.classes()).toContain('p-invalid');
    });

    it('clears errors when form data is corrected', async () => {
      const wrapper = mount(EditAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Trigger error
      vm.formData.first_name = '';
      vm.handleSave();
      await nextTick();
      expect(vm.errors.first_name).toBe('First name is required');

      // Fix error
      vm.formData.first_name = 'John';
      vm.handleSave();
      await nextTick();

      expect(vm.errors.first_name).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles null adminUser prop', () => {
      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: null,
        },
      });

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });

    it('handles adminUser with missing name fields', async () => {
      const userWithoutNames: Admin = {
        ...mockAdminUser,
        first_name: '',
        last_name: '',
        name: '',
      };

      const wrapper = mount(EditAdminUserModal, {
        props: {
          ...defaultProps,
          adminUser: userWithoutNames,
        },
      });

      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.first_name).toBe('');
      expect(vm.formData.last_name).toBe('');
    });
  });
});
