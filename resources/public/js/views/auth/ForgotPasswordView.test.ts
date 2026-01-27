import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import ForgotPasswordView from './ForgotPasswordView.vue';
import { authService } from '@public/services/authService';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

// Mock auth service
vi.mock('@public/services/authService', () => ({
  authService: {
    requestPasswordReset: vi.fn(),
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

// Create router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: { template: '<div>Forgot</div>' },
    },
  ],
});

describe('ForgotPasswordView', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    vi.clearAllMocks();

    wrapper = mount(ForgotPasswordView, {
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
  });

  describe('Rendering', () => {
    it('should render the forgot password form', () => {
      expect(wrapper.find('form').exists()).toBe(true);
    });

    it('should render background effects', () => {
      expect(wrapper.findComponent({ name: 'BackgroundGrid' }).exists()).toBe(true);
    });

    it('should render navigation', () => {
      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(true);
    });

    it('should render page title', () => {
      expect(wrapper.text()).toContain('Forgot Password?');
    });

    it('should render instructions text', () => {
      expect(wrapper.text()).toContain(
        "Enter your email address and we'll send you a link to reset your password.",
      );
    });

    it('should render email input field', () => {
      const emailInput = wrapper.find('#email');
      expect(emailInput.exists()).toBe(true);
      expect(emailInput.attributes('type')).toBe('email');
    });

    it('should render submit button', () => {
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.exists()).toBe(true);
      expect(submitButton.text()).toContain('Send Reset Link');
    });

    it('should render back to login link', () => {
      const backLink = wrapper.find('a[href="/login"]');
      expect(backLink.exists()).toBe(true);
      expect(backLink.text()).toContain('Back to login');
    });
  });

  describe('User Interactions', () => {
    it('should update email value on input', async () => {
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com');
    });

    it('should clear email error when user types', async () => {
      // Submit empty form to trigger error
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Email is required');

      // Start typing
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('t');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).not.toContain('Email is required');
    });
  });

  describe('Validation', () => {
    it('should show error for empty email', async () => {
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Email is required');
    });

    it('should show error for invalid email format', async () => {
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('invalid-email');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Please enter a valid email address');
    });

    it('should disable submit button when form is invalid', () => {
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });

    it('should enable submit button when form is valid', async () => {
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');
      await wrapper.vm.$nextTick();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('API Integration', () => {
    it('should call authService.requestPasswordReset with email on submit', async () => {
      const mockRequestPasswordReset = vi.mocked(authService.requestPasswordReset);
      mockRequestPasswordReset.mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    it('should show loading state during API call', async () => {
      const mockRequestPasswordReset = vi.mocked(authService.requestPasswordReset);
      mockRequestPasswordReset.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Sending...');
    });

    it('should show success message on successful request', async () => {
      const mockRequestPasswordReset = vi.mocked(authService.requestPasswordReset);
      mockRequestPasswordReset.mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Email Sent');
      expect(wrapper.text()).toContain('Please check your inbox');
    });

    it('should show toast notification on success', async () => {
      const mockRequestPasswordReset = vi.mocked(authService.requestPasswordReset);
      mockRequestPasswordReset.mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(mockToastAdd).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Email Sent',
        detail: 'Password reset link has been sent to your email.',
        life: 5000,
      });
    });

    it('should hide form after successful submission', async () => {
      const mockRequestPasswordReset = vi.mocked(authService.requestPasswordReset);
      mockRequestPasswordReset.mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.find('form').exists()).toBe(false);
    });

    it('should display error message on failed request', async () => {
      const mockRequestPasswordReset = vi.mocked(authService.requestPasswordReset);
      mockRequestPasswordReset.mockRejectedValue(new Error('Network error'));

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Failed to send reset link');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      const mockRequestPasswordReset = vi.mocked(authService.requestPasswordReset);
      mockRequestPasswordReset.mockRejectedValue(new Error('Network error'));

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Failed to send reset link. Please try again.');
    });

    it('should disable button during submission to prevent multiple submissions', async () => {
      const mockRequestPasswordReset = vi.mocked(authService.requestPasswordReset);
      mockRequestPasswordReset.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      const submitButton = wrapper.find('button[type="submit"]');

      // Button should be enabled initially
      expect(submitButton.attributes('disabled')).toBeUndefined();

      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      // Button should be disabled after submit
      expect(submitButton.attributes('disabled')).toBeDefined();
      expect(submitButton.text()).toContain('Sending...');
    });

    it('should handle non-existent email gracefully', async () => {
      const mockRequestPasswordReset = vi.mocked(authService.requestPasswordReset);
      mockRequestPasswordReset.mockResolvedValue();

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('nonexistent@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      // Should still show success for security reasons
      expect(wrapper.text()).toContain('Email Sent');
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page when back link clicked', async () => {
      const pushSpy = vi.spyOn(router, 'push');
      const backLink = wrapper.find('a[href="/login"]');

      await backLink.trigger('click');

      expect(pushSpy).toHaveBeenCalledWith('/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      expect(wrapper.text()).toContain('Email Address');
    });

    it('should have autocomplete attribute', () => {
      const emailInput = wrapper.find('#email');
      expect(emailInput.attributes('autocomplete')).toBe('email');
    });
  });
});
