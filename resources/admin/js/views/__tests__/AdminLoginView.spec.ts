import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import AdminLoginView from '../AdminLoginView.vue';
import { useAdminStore } from '@admin/stores/adminStore';
import { useRouter } from 'vue-router';
import axios from 'axios';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}));

describe('AdminLoginView', () => {
  let mockRouter: any;
  let pinia: any;

  beforeEach(() => {
    // Create a fresh pinia instance for each test
    pinia = createPinia();
    setActivePinia(pinia);

    // Mock router
    mockRouter = {
      replace: vi.fn(),
      push: vi.fn(),
    };
    vi.mocked(useRouter).mockReturnValue(mockRouter);

    vi.clearAllMocks();
  });

  /**
   * Helper function to mount AdminLoginView with proper configuration
   */
  const mountLoginView = () => {
    return mount(AdminLoginView, {
      global: {
        plugins: [pinia],
        stubs: {
          InputText: {
            template:
              '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :disabled="disabled" />',
            props: ['modelValue', 'disabled'],
          },
          Password: {
            template:
              '<div class="p-password"><input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :disabled="disabled" :class="inputClass" type="password" /></div>',
            props: ['modelValue', 'disabled', 'inputClass', 'pt'],
          },
          Button: {
            template:
              '<button :disabled="disabled || loading" :loading="loading" :type="type"><slot>{{ label }}</slot></button>',
            props: ['label', 'disabled', 'loading', 'type'],
          },
          Checkbox: {
            template:
              '<input type="checkbox" :id="inputId" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" :disabled="disabled" />',
            props: ['modelValue', 'inputId', 'binary', 'disabled'],
          },
          Message: {
            template: '<div class="p-message" v-if="!closable || true"><slot></slot></div>',
            props: ['severity', 'closable'],
          },
        },
      },
    });
  };

  describe('Component Rendering', () => {
    it('renders login form correctly', () => {
      const wrapper = mountLoginView();

      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.text()).toContain('Admin Login');
    });

    it('shows email field', () => {
      const wrapper = mountLoginView();

      const emailField = wrapper.find('#email');
      expect(emailField.exists()).toBe(true);
      expect(wrapper.text()).toContain('Email Address');
    });

    it('shows password field', () => {
      const wrapper = mountLoginView();

      const passwordField = wrapper.find('#password');
      expect(passwordField.exists()).toBe(true);
      expect(wrapper.text()).toContain('Password');
    });

    it('shows remember me checkbox', () => {
      const wrapper = mountLoginView();

      const checkbox = wrapper.find('#remember');
      expect(checkbox.exists()).toBe(true);
      expect(wrapper.text()).toContain('Remember me for 30 days');
    });

    it('shows submit button', () => {
      const wrapper = mountLoginView();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.exists()).toBe(true);
      expect(wrapper.text()).toContain('Sign In');
    });

    it('renders logo/header section', () => {
      const wrapper = mountLoginView();

      expect(wrapper.find('.pi-shield').exists()).toBe(true);
      expect(wrapper.text()).toContain('Enter your credentials to access the admin panel');
    });

    it('does not show error message initially', () => {
      const wrapper = mountLoginView();

      expect(wrapper.find('.p-message').exists()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('email field is required', async () => {
      const wrapper = mountLoginView();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Email is required');
    });

    it('validates email format', async () => {
      const wrapper = mountLoginView();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('invalid-email');
      await nextTick();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Please enter a valid email address');
    });

    it('accepts valid email format', async () => {
      const wrapper = mountLoginView();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');
      await nextTick();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      // Should not show email validation errors
      expect(wrapper.text()).not.toContain('Please enter a valid email address');
      expect(wrapper.text()).not.toContain('Email is required');
    });

    it('password field is required', async () => {
      const wrapper = mountLoginView();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');
      await nextTick();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Password is required');
    });

    it('form cannot be submitted when invalid', async () => {
      const wrapper = mountLoginView();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });

    it('submit button is enabled when form is valid', async () => {
      const wrapper = mountLoginView();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');
      await nextTick();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeUndefined();
    });

    it('shows inline error for email field', async () => {
      const wrapper = mountLoginView();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      const emailInput = wrapper.find('#email');
      expect(emailInput.classes()).toContain('p-invalid');
    });

    it('shows inline error for password field', async () => {
      const wrapper = mountLoginView();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');
      await nextTick();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      const passwordField = wrapper.find('#password');
      expect(passwordField.classes()).toContain('p-invalid');
    });
  });

  describe('Successful Login Flow', () => {
    it('calls adminStore.login with correct credentials', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const loginSpy = vi.spyOn(adminStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
        remember: false,
      });
    });

    it('includes remember me flag when checkbox is checked', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const loginSpy = vi.spyOn(adminStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const rememberCheckbox = wrapper.find('#remember');
      await rememberCheckbox.setValue(true);

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
        remember: true,
      });
    });

    it('redirects to /admin/dashboard on success', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      vi.spyOn(adminStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(mockRouter.replace).toHaveBeenCalledWith({ name: 'dashboard' });
    });

    it('trims email whitespace before submission', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const loginSpy = vi.spyOn(adminStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('  admin@example.com  ');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
        remember: false,
      });
    });

    it('clears form errors on successful login', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      vi.spyOn(adminStore, 'login').mockResolvedValue();

      // First attempt - trigger errors
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Email is required');

      // Second attempt - successful
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).not.toContain('Email is required');
      expect(wrapper.find('.p-message').exists()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('shows error for 401 (Invalid credentials)', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            message: 'Invalid credentials',
          },
        },
      };
      vi.spyOn(adminStore, 'login').mockRejectedValue(error);
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('wrongpassword');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain(
        'Login unsuccessful. Please check your credentials and try again.',
      );
      expect(wrapper.find('.p-message').exists()).toBe(true);
    });

    it('shows error for 422 (Validation errors from server)', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const error = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: {
              email: ['The email field is invalid'],
            },
          },
        },
      };
      vi.spyOn(adminStore, 'login').mockRejectedValue(error);
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Validation failed');
    });

    it('shows generic error for 422 with credentials keyword', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const error = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'Invalid credentials provided',
            errors: {},
          },
        },
      };
      vi.spyOn(adminStore, 'login').mockRejectedValue(error);
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain(
        'Login unsuccessful. Please check your credentials and try again.',
      );
    });

    it('shows error for 429 (Too many attempts)', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const error = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {
            message: 'Too many requests',
          },
        },
      };
      vi.spyOn(adminStore, 'login').mockRejectedValue(error);
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain(
        'Too many login attempts. Please wait a moment and try again.',
      );
    });

    it('shows error for 500+ (Server errors)', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const error = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      };
      vi.spyOn(adminStore, 'login').mockRejectedValue(error);
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Server error. Please try again later.');
    });

    it('handles generic axios errors', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            message: 'Bad request',
          },
        },
      };
      vi.spyOn(adminStore, 'login').mockRejectedValue(error);
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain(
        'Login unsuccessful. Please check your credentials and try again.',
      );
    });

    it('handles non-axios errors', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const error = new Error('Network error');
      vi.spyOn(adminStore, 'login').mockRejectedValue(error);
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Network error');
    });
  });

  describe('Loading State', () => {
    it('submit button is disabled during submission', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      vi.spyOn(adminStore, 'login').mockReturnValue(loginPromise);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();

      // Resolve the promise
      resolveLogin!();
      await flushPromises();
    });

    it('shows loading state on submit button', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      vi.spyOn(adminStore, 'login').mockReturnValue(loginPromise);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('loading')).toBeDefined();

      // Resolve the promise
      resolveLogin!();
      await flushPromises();
    });

    it('disables form inputs during submission', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      vi.spyOn(adminStore, 'login').mockReturnValue(loginPromise);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(emailInput.attributes('disabled')).toBeDefined();
      expect(passwordInput.attributes('disabled')).toBeDefined();

      // Resolve the promise
      resolveLogin!();
      await flushPromises();
    });

    it('disables remember me checkbox during submission', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      vi.spyOn(adminStore, 'login').mockReturnValue(loginPromise);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      const rememberCheckbox = wrapper.find('#remember');
      expect(rememberCheckbox.attributes('disabled')).toBeDefined();

      // Resolve the promise
      resolveLogin!();
      await flushPromises();
    });

    it('re-enables form after submission completes', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      vi.spyOn(adminStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(emailInput.attributes('disabled')).toBeUndefined();
    });
  });

  describe('User Interactions', () => {
    it('clears email error when user starts typing', async () => {
      const wrapper = mountLoginView();

      // Trigger validation error
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Email is required');

      // Start typing
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('a');
      await nextTick();

      expect(wrapper.text()).not.toContain('Email is required');
    });

    it('clears password error when user starts typing', async () => {
      const wrapper = mountLoginView();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      // Trigger validation error
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Password is required');

      // Start typing
      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('p');
      await nextTick();

      expect(wrapper.text()).not.toContain('Password is required');
    });

    it('clears general error message when user starts typing in email', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            message: 'Invalid credentials',
          },
        },
      };
      vi.spyOn(adminStore, 'login').mockRejectedValue(error);
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('wrongpassword');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.find('.p-message').exists()).toBe(true);

      // Start typing in email
      await emailInput.setValue('admin2@example.com');
      await nextTick();

      expect(wrapper.find('.p-message').exists()).toBe(false);
    });

    it('clears general error message when user starts typing in password', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            message: 'Invalid credentials',
          },
        },
      };
      vi.spyOn(adminStore, 'login').mockRejectedValue(error);
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('wrongpassword');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.find('.p-message').exists()).toBe(true);

      // Start typing in password
      await passwordInput.setValue('newpassword');
      await nextTick();

      expect(wrapper.find('.p-message').exists()).toBe(false);
    });

    it('remember me checkbox works correctly', async () => {
      const wrapper = mountLoginView();

      const rememberCheckbox = wrapper.find('#remember');

      // Initially unchecked
      expect((rememberCheckbox.element as HTMLInputElement).checked).toBe(false);

      // Check the checkbox
      await rememberCheckbox.setValue(true);
      await nextTick();

      expect((rememberCheckbox.element as HTMLInputElement).checked).toBe(true);

      // Uncheck the checkbox
      await rememberCheckbox.setValue(false);
      await nextTick();

      expect((rememberCheckbox.element as HTMLInputElement).checked).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('email field has proper labels and attributes', () => {
      const wrapper = mountLoginView();

      const emailInput = wrapper.find('#email');
      expect(emailInput.attributes('type')).toBe('email');
      expect(emailInput.attributes('autocomplete')).toBe('email');
      expect(wrapper.find('label[for="email"]').exists()).toBe(true);
    });

    it('password field has proper labels and attributes', () => {
      const wrapper = mountLoginView();

      const passwordInput = wrapper.find('#password input');
      expect(passwordInput.attributes('autocomplete')).toBe('current-password');
      expect(wrapper.find('label[for="password"]').exists()).toBe(true);
    });

    it('remember me checkbox has proper label association', () => {
      const wrapper = mountLoginView();

      const checkbox = wrapper.find('#remember');
      expect(checkbox.exists()).toBe(true);
      expect(wrapper.find('label[for="remember"]').exists()).toBe(true);
    });

    it('submit button has proper type attribute', () => {
      const wrapper = mountLoginView();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('type')).toBe('submit');
    });
  });

  describe('Form Behavior', () => {
    it('prevents default form submission', async () => {
      const wrapper = mountLoginView();

      const adminStore = useAdminStore();
      vi.spyOn(adminStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      const submitEvent = new Event('submit');
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      await form.element.dispatchEvent(submitEvent);

      // The form has @submit.prevent, so preventDefault should be called
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('clears all validation errors when form is resubmitted', async () => {
      const wrapper = mountLoginView();

      // First submission - trigger errors
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await nextTick();

      expect(wrapper.text()).toContain('Email is required');
      expect(wrapper.text()).toContain('Password is required');

      // Fill in form
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('admin@example.com');

      const passwordInput = wrapper.find('#password input');
      await passwordInput.setValue('password123');

      const adminStore = useAdminStore();
      vi.spyOn(adminStore, 'login').mockResolvedValue();

      // Second submission
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).not.toContain('Email is required');
      expect(wrapper.text()).not.toContain('Password is required');
    });
  });
});
