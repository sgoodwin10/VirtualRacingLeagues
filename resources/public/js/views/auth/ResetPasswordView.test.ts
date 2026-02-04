import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import ResetPasswordView from './ResetPasswordView.vue';
import { authService } from '@public/services/authService';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

// Mock auth service
vi.mock('@public/services/authService', () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}));

// Mock child components
vi.mock('@public/components/landing/BackgroundGrid.vue', () => ({
  default: { name: 'BackgroundGrid', template: '<div class="background-grid"></div>' },
}));
vi.mock('@public/components/landing/LandingNav.vue', () => ({
  default: { name: 'LandingNav', template: '<div class="landing-nav"></div>' },
}));

// Mock PrimeVue Toast
const mockToastAdd = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: mockToastAdd,
  }),
}));

// Create router with query params
const createTestRouter = (_queryParams = {}) => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
      {
        path: '/reset-password',
        name: 'reset-password',
        component: ResetPasswordView,
      },
    ],
  });
};

describe('ResetPasswordView', () => {
  let wrapper: VueWrapper;
  let router: ReturnType<typeof createTestRouter>;

  const createWrapper = async (
    queryParams: { email?: string; token?: string } = {
      email: 'test@example.com',
      token: 'test-token',
    },
  ) => {
    router = createTestRouter();
    await router.push({ path: '/reset-password', query: queryParams });

    return mount(ResetPasswordView, {
      global: {
        plugins: [
          router,
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
              },
            },
          ],
        ],
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the reset password form', async () => {
      wrapper = await createWrapper();
      expect(wrapper.find('form').exists()).toBe(true);
    });

    it('should render background effects', async () => {
      wrapper = await createWrapper();
      expect(wrapper.findComponent({ name: 'BackgroundGrid' }).exists()).toBe(true);
    });

    it('should render navigation', async () => {
      wrapper = await createWrapper();
      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(true);
    });

    it('should render page title', async () => {
      wrapper = await createWrapper();
      expect(wrapper.text()).toContain('Reset Password');
    });

    it('should render instructions text', async () => {
      wrapper = await createWrapper();
      expect(wrapper.text()).toContain('Enter your new password below');
    });

    it('should render password input field', async () => {
      wrapper = await createWrapper();
      const passwordInput = wrapper.find('#password');
      expect(passwordInput.exists()).toBe(true);
    });

    it('should render password confirmation input field', async () => {
      wrapper = await createWrapper();
      const passwordConfirmInput = wrapper.find('#password-confirmation');
      expect(passwordConfirmInput.exists()).toBe(true);
    });

    it('should render submit button', async () => {
      wrapper = await createWrapper();
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.exists()).toBe(true);
      expect(submitButton.text()).toContain('Reset Password');
    });

    it('should render back to login link', async () => {
      wrapper = await createWrapper();
      const backLink = wrapper.find('a[href="/login"]');
      expect(backLink.exists()).toBe(true);
      expect(backLink.text()).toContain('Back to login');
    });
  });

  describe('Token Validation', () => {
    it('should extract email from query params', async () => {
      wrapper = await createWrapper({ email: 'user@example.com', token: 'test-token' });
      await wrapper.vm.$nextTick();

      // If email is extracted correctly, the form should be shown (not the error)
      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.text()).not.toContain('Invalid Reset Link');
    });

    it('should extract token from query params', async () => {
      wrapper = await createWrapper({ email: 'test@example.com', token: 'valid-token-123' });
      await wrapper.vm.$nextTick();

      // If token is extracted correctly, the form should be shown (not the error)
      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.text()).not.toContain('Invalid Reset Link');
    });

    it('should show error when email is missing', async () => {
      wrapper = await createWrapper({ token: 'test-token' });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Invalid Reset Link');
      expect(wrapper.text()).toContain('This reset link is invalid or has expired');
    });

    it('should show error when token is missing', async () => {
      wrapper = await createWrapper({ email: 'test@example.com' });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Invalid Reset Link');
      expect(wrapper.text()).toContain('This reset link is invalid or has expired');
    });

    it('should show error when both email and token are missing', async () => {
      wrapper = await createWrapper({});
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Invalid Reset Link');
    });
  });

  describe('User Interactions', () => {
    it('should update password value on input', async () => {
      wrapper = await createWrapper();
      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('NewPassword123!');

      expect((passwordInput.element as HTMLInputElement).value).toBe('NewPassword123!');
    });

    it('should update password confirmation value on input', async () => {
      wrapper = await createWrapper();
      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('NewPassword123!');

      expect((passwordConfirmInput.element as HTMLInputElement).value).toBe('NewPassword123!');
    });

    it('should clear password error when user types', async () => {
      wrapper = await createWrapper();

      // Submit empty form to trigger error
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Password is required');

      // Start typing
      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('N');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).not.toContain('Password is required');
    });
  });

  describe('Validation', () => {
    it('should show error for empty password', async () => {
      wrapper = await createWrapper();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Password is required');
    });

    it('should show password requirements when password is entered', async () => {
      wrapper = await createWrapper();

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('weak');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Password must:');
    });

    it('should show success message when password meets all requirements', async () => {
      wrapper = await createWrapper();

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Password meets all requirements');
    });

    it('should show error when passwords do not match', async () => {
      wrapper = await createWrapper();

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('Password123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('DifferentPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Passwords do not match');
    });

    it('should disable submit button when form is invalid', async () => {
      wrapper = await createWrapper();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });

    it('should enable submit button when form is valid', async () => {
      wrapper = await createWrapper();

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('StrongPassword123!');

      await wrapper.vm.$nextTick();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('API Integration', () => {
    it('should call authService.resetPassword with correct data on submit', async () => {
      wrapper = await createWrapper({ email: 'test@example.com', token: 'test-token' });

      const mockResetPassword = vi.mocked(authService.resetPassword);
      mockResetPassword.mockResolvedValue();

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('NewPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('NewPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(mockResetPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: 'test-token',
        password: 'NewPassword123!',
        password_confirmation: 'NewPassword123!',
      });
    });

    it('should show loading state during API call', async () => {
      wrapper = await createWrapper();

      const mockResetPassword = vi.mocked(authService.resetPassword);
      mockResetPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('NewPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('NewPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Resetting...');
    });

    it('should show toast notification on success', async () => {
      wrapper = await createWrapper();

      const mockResetPassword = vi.mocked(authService.resetPassword);
      mockResetPassword.mockResolvedValue();

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('NewPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('NewPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Password Reset Successful',
        detail: 'Your password has been reset successfully.',
        life: 5000,
      });
    });

    it('should redirect to login on successful reset', async () => {
      wrapper = await createWrapper();

      const mockResetPassword = vi.mocked(authService.resetPassword);
      mockResetPassword.mockResolvedValue();

      const pushSpy = vi.spyOn(router, 'push');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('NewPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('NewPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 2100));

      expect(pushSpy).toHaveBeenCalledWith('/login');
    });

    it('should display error message on failed reset', async () => {
      wrapper = await createWrapper();

      const mockResetPassword = vi.mocked(authService.resetPassword);
      mockResetPassword.mockRejectedValue(new Error('Invalid token'));

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('NewPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('NewPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Failed to reset password');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      wrapper = await createWrapper();

      const mockResetPassword = vi.mocked(authService.resetPassword);
      mockResetPassword.mockRejectedValue(new Error('Network error'));

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('NewPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('NewPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Failed to reset password');
    });

    it('should disable button during submission to prevent multiple submissions', async () => {
      wrapper = await createWrapper();

      const mockResetPassword = vi.mocked(authService.resetPassword);
      mockResetPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('NewPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('NewPassword123!');

      const form = wrapper.find('form');
      const submitButton = wrapper.find('button[type="submit"]');

      // Button should be enabled initially
      expect(submitButton.attributes('disabled')).toBeUndefined();

      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      // Button should be disabled after submit
      expect(submitButton.attributes('disabled')).toBeDefined();
      expect(submitButton.text()).toContain('Resetting...');
    });

    it('should handle expired token gracefully', async () => {
      wrapper = await createWrapper();

      const mockResetPassword = vi.mocked(authService.resetPassword);
      mockResetPassword.mockRejectedValue(new Error('Token expired'));

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('NewPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('NewPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('request a new reset link');
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page when back link clicked', async () => {
      wrapper = await createWrapper();

      const pushSpy = vi.spyOn(router, 'push');
      const backLink = wrapper.find('a[href="/login"]');

      await backLink.trigger('click');

      expect(pushSpy).toHaveBeenCalledWith('/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      wrapper = await createWrapper();

      expect(wrapper.text()).toContain('New Password');
      expect(wrapper.text()).toContain('Confirm New Password');
    });

    it('should have autocomplete attributes', async () => {
      wrapper = await createWrapper();

      const passwordInput = wrapper.find('#password');
      const passwordConfirmInput = wrapper.find('#password-confirmation');

      expect(passwordInput.attributes('autocomplete')).toBe('new-password');
      expect(passwordConfirmInput.attributes('autocomplete')).toBe('new-password');
    });
  });
});
