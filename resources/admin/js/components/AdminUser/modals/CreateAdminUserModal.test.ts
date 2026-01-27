import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import CreateAdminUserModal from './CreateAdminUserModal.vue';
import type { CreateAdminUserModalProps, RoleOption } from './CreateAdminUserModal.vue';

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

describe('CreateAdminUserModal', () => {
  const mockRoleOptions: RoleOption[] = [
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Admin', value: 'admin' },
    { label: 'Moderator', value: 'moderator' },
  ];

  const defaultProps: CreateAdminUserModalProps = {
    visible: true,
    availableRoles: mockRoleOptions,
    saving: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when visible is true', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.find('.base-modal').exists()).toBe(true);
    });

    it('does not render when visible is false', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: {
          ...defaultProps,
          visible: false,
        },
      });

      expect(wrapper.find('.base-modal').exists()).toBe(false);
    });

    it('renders modal header with correct title', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.text()).toContain('Add Admin User');
    });

    it('renders all form fields', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      expect(wrapper.find('#create-first-name').exists()).toBe(true);
      expect(wrapper.find('#create-last-name').exists()).toBe(true);
      expect(wrapper.find('#create-email').exists()).toBe(true);
      expect(wrapper.find('#create-role').exists()).toBe(true);
    });

    it('renders footer with Cancel and Create buttons', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      expect(wrapper.text()).toContain('Cancel');
      expect(wrapper.text()).toContain('Create Admin User');
    });
  });

  describe('Form Initialization', () => {
    it('initializes form with empty values', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      expect(vm.formData.first_name).toBe('');
      expect(vm.formData.last_name).toBe('');
      expect(vm.formData.email).toBe('');
      expect(vm.formData.role).toBe('moderator');
    });

    it('resets form when modal opens', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: {
          ...defaultProps,
          visible: false,
        },
      });

      const vm = wrapper.vm as any;

      // Manually set some form data
      vm.formData.first_name = 'Test';
      vm.formData.last_name = 'User';
      vm.formData.email = 'test@example.com';

      // Open modal
      await wrapper.setProps({ visible: true });
      await nextTick();

      // Form should be reset
      expect(vm.formData.first_name).toBe('');
      expect(vm.formData.last_name).toBe('');
      expect(vm.formData.email).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('validates required first name field', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Try to submit with empty first name
      vm.handleSave();
      await nextTick();

      expect(vm.errors.first_name).toBe('First name is required');
    });

    it('validates required last name field', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Set other required fields
      vm.formData.first_name = 'John';

      vm.handleSave();
      await nextTick();

      expect(vm.errors.last_name).toBe('Last name is required');
    });

    it('validates required email field', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = 'John';
      vm.formData.last_name = 'Doe';

      vm.handleSave();
      await nextTick();

      expect(vm.errors.email).toBe('Email is required');
    });

    it('validates email format', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = 'John';
      vm.formData.last_name = 'Doe';
      vm.formData.email = 'invalid-email';

      vm.handleSave();
      await nextTick();

      expect(vm.errors.email).toBe('Please enter a valid email address');
    });

    it('validates required role field', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = 'John';
      vm.formData.last_name = 'Doe';
      vm.formData.email = 'john@example.com';
      vm.formData.role = '';

      vm.handleSave();
      await nextTick();

      expect(vm.errors.role).toBe('Role is required');
    });

    it('passes validation with all valid fields', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = 'John';
      vm.formData.last_name = 'Doe';
      vm.formData.email = 'john@example.com';
      vm.formData.role = 'admin';

      const result = vm.validateForm();

      expect(result).toBe(true);
      expect(Object.keys(vm.errors).length).toBe(0);
    });

    it('displays validation error messages', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Trigger validation errors
      vm.handleSave();
      await nextTick();

      // Check if error messages are displayed
      expect(wrapper.html()).toContain('First name is required');
    });

    it('clears field error when user starts typing', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Set an error
      vm.errors.first_name = 'First name is required';

      // Clear the error
      vm.clearFieldError('first_name');
      await nextTick();

      expect(vm.errors.first_name).toBeUndefined();
    });
  });

  describe('User Interactions', () => {
    it('updates form data when typing in first name', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const firstNameInput = wrapper.find('#create-first-name');
      await firstNameInput.setValue('John');
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.first_name).toBe('John');
    });

    it('updates form data when typing in last name', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const lastNameInput = wrapper.find('#create-last-name');
      await lastNameInput.setValue('Doe');
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.last_name).toBe('Doe');
    });

    it('updates form data when typing in email', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const emailInput = wrapper.find('#create-email');
      await emailInput.setValue('john@example.com');
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.email).toBe('john@example.com');
    });

    it('updates form data when selecting a role', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const roleSelect = wrapper.find('#create-role');
      await roleSelect.setValue('admin');
      await nextTick();

      const vm = wrapper.vm as any;
      expect(vm.formData.role).toBe('admin');
    });
  });

  describe('Events', () => {
    it('emits save event with form data when validation passes', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Fill in valid form data
      vm.formData.first_name = 'John';
      vm.formData.last_name = 'Doe';
      vm.formData.email = 'john@example.com';
      vm.formData.role = 'admin';

      vm.handleSave();
      await nextTick();

      expect(wrapper.emitted('save')).toBeTruthy();
      expect(wrapper.emitted('save')?.[0]?.[0]).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'admin',
      });
    });

    it('does not emit save event when validation fails', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Submit with empty form
      vm.handleSave();
      await nextTick();

      expect(wrapper.emitted('save')).toBeFalsy();
    });

    it('emits cancel event when Cancel button is clicked', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      vm.handleCancel();
      await nextTick();

      expect(wrapper.emitted('cancel')).toBeTruthy();
    });

    it('emits update:visible false when Cancel button is clicked', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      vm.handleCancel();
      await nextTick();

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('emits close event when Cancel button is clicked', async () => {
      const wrapper = mount(CreateAdminUserModal, {
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
      const wrapper = mount(CreateAdminUserModal, {
        props: {
          ...defaultProps,
          saving: true,
        },
      });

      const firstNameInput = wrapper.find('#create-first-name');
      const lastNameInput = wrapper.find('#create-last-name');
      const emailInput = wrapper.find('#create-email');
      const roleSelect = wrapper.find('#create-role');

      expect(firstNameInput.attributes('disabled')).toBeDefined();
      expect(lastNameInput.attributes('disabled')).toBeDefined();
      expect(emailInput.attributes('disabled')).toBeDefined();
      expect(roleSelect.attributes('disabled')).toBeDefined();
    });

    it('disables Cancel button when saving', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: {
          ...defaultProps,
          saving: true,
        },
      });

      const buttons = wrapper.findAll('button');
      const cancelButton = buttons.find((btn) => btn.text().includes('Cancel'));

      expect(cancelButton?.attributes('disabled')).toBeDefined();
    });

    it('shows loading state on Create button when saving', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: {
          ...defaultProps,
          saving: true,
        },
      });

      const buttons = wrapper.findAll('button');
      const createButton = buttons.find((btn) => btn.text().includes('Create'));

      expect(createButton?.attributes('loading')).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('can set backend validation errors via exposed method', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.setValidationErrors({
        email: ['The email has already been taken.'],
      });
      await nextTick();

      expect(vm.hasError('email')).toBe(true);
      expect(vm.getErrorMessage('email')).toBe('The email has already been taken.');
    });

    it('displays backend validation errors', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.setValidationErrors({
        email: ['The email has already been taken.'],
      });
      await nextTick();

      expect(wrapper.html()).toContain('The email has already been taken.');
    });

    it('clears backend validation errors when field is modified', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Set backend error
      vm.setValidationErrors({
        email: ['The email has already been taken.'],
      });
      await nextTick();

      // Clear error
      vm.clearFieldError('email');
      await nextTick();

      expect(vm.hasError('email')).toBe(false);
    });

    it('displays invalid class on input with error', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // Trigger validation error
      vm.handleSave();
      await nextTick();

      const firstNameInput = wrapper.find('#create-first-name');
      expect(firstNameInput.classes()).toContain('p-invalid');
    });
  });

  describe('Role Options', () => {
    it('displays all available role options', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const roleSelect = wrapper.find('#create-role');
      const options = roleSelect.findAll('option');

      expect(options.length).toBe(3);
      expect(options[0]?.text()).toBe('Super Admin');
      expect(options[1]?.text()).toBe('Admin');
      expect(options[2]?.text()).toBe('Moderator');
    });

    it('defaults to moderator role', () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;
      expect(vm.formData.role).toBe('moderator');
    });
  });

  describe('Form Submission', () => {
    it('accepts whitespace-padded text fields as valid', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      vm.formData.first_name = '  John  ';
      vm.formData.last_name = '  Doe  ';
      vm.formData.email = 'john@example.com'; // Email regex doesn't accept spaces
      vm.formData.role = 'admin';

      const isValid = vm.validateForm();

      expect(isValid).toBe(true);
    });

    it('clears previous validation errors on submit', async () => {
      const wrapper = mount(CreateAdminUserModal, {
        props: defaultProps,
      });

      const vm = wrapper.vm as any;

      // First submission with errors
      vm.handleSave();
      await nextTick();
      expect(Object.keys(vm.errors).length).toBeGreaterThan(0);

      // Set valid data and submit again
      vm.formData.first_name = 'John';
      vm.formData.last_name = 'Doe';
      vm.formData.email = 'john@example.com';
      vm.formData.role = 'admin';

      vm.handleSave();
      await nextTick();

      expect(Object.keys(vm.errors).length).toBe(0);
    });
  });
});
