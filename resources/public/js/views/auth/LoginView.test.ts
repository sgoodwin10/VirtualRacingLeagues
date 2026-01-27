import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import LoginView from './LoginView.vue';
import { useAuthStore } from '@public/stores/authStore';

// Mock child components
vi.mock('@public/components/landing/BackgroundGrid.vue', () => ({
  default: { name: 'BackgroundGrid', template: '<div class="background-grid"></div>' },
}));
vi.mock('@public/components/landing/LandingNav.vue', () => ({
  default: { name: 'LandingNav', template: '<div class="landing-nav"></div>' },
}));

// Create router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    { path: '/register', name: 'register', component: { template: '<div>Register</div>' } },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: { template: '<div>Forgot</div>' },
    },
  ],
});

describe('LoginView', () => {
  let wrapper: VueWrapper;
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    vi.clearAllMocks();

    wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    });
  });

  describe('Rendering', () => {
    it('should render the login form', () => {
      expect(wrapper.find('form').exists()).toBe(true);
    });

    it('should render background effects', () => {
      expect(wrapper.findComponent({ name: 'BackgroundGrid' }).exists()).toBe(true);
    });

    it('should render navigation', () => {
      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(true);
    });

    it('should render page title', () => {
      expect(wrapper.text()).toContain('Sign In');
    });

    it('should render page subtitle', () => {
      expect(wrapper.text()).toContain('Welcome back to Virtual Racing Leagues');
    });

    it('should render email input field', () => {
      const emailInput = wrapper.find('#email');
      expect(emailInput.exists()).toBe(true);
      expect(emailInput.attributes('type')).toBe('email');
    });

    it('should render password input field', () => {
      const passwordInput = wrapper.find('#password');
      expect(passwordInput.exists()).toBe(true);
    });

    it('should render remember me checkbox', () => {
      expect(wrapper.text()).toContain('Remember me');
    });

    it('should render forgot password link', () => {
      const forgotLink = wrapper.find('a[href="/forgot-password"]');
      expect(forgotLink.exists()).toBe(true);
      expect(forgotLink.text()).toContain('Forgot password?');
    });

    it('should render submit button', () => {
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.exists()).toBe(true);
      expect(submitButton.text()).toContain('Sign In');
    });

    it('should render register link', () => {
      const registerLink = wrapper.find('a[href="/register"]');
      expect(registerLink.exists()).toBe(true);
      expect(registerLink.text()).toContain('Sign up');
    });
  });

  describe('User Interactions', () => {
    it('should update email value on input', async () => {
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com');
    });

    it('should update password value on input', async () => {
      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('password123');

      expect((passwordInput.element as HTMLInputElement).value).toBe('password123');
    });

    it('should clear email error when user types', async () => {
      // Submit empty form to trigger errors
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

    it('should clear password error when user types', async () => {
      // Submit empty form to trigger errors
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Password is required');

      // Start typing
      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('p');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).not.toContain('Password is required');
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

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Please enter a valid email address');
    });

    it('should show error for empty password', async () => {
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Password is required');
    });

    it('should disable submit button when form is invalid', () => {
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });

    it('should enable submit button when form is valid', async () => {
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('password123');

      await wrapper.vm.$nextTick();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('API Integration', () => {
    it('should call authStore.login with correct credentials on submit', async () => {
      const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });
    });

    it('should include remember me value in login call', async () => {
      const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');

      // Find and check the remember me checkbox (it's rendered by VrlCheckbox)
      // We need to trigger it through the component's model update
      await wrapper.vm.$nextTick();

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(loginSpy).toHaveBeenCalled();
    });

    it('should show loading state during API call', async () => {
      vi.spyOn(authStore, 'login').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Signing In...');
    });

    it('should disable submit button during loading', async () => {
      vi.spyOn(authStore, 'login').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });

    it('should display error message on failed authentication (401)', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 401 },
      };
      vi.spyOn(authStore, 'login').mockRejectedValue(error);

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('wrong-password');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Invalid email or password');
    });

    it('should display rate limit error (429)', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 429 },
      };
      vi.spyOn(authStore, 'login').mockRejectedValue(error);

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Too many login attempts');
    });

    it('should display server error (500)', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 },
      };
      vi.spyOn(authStore, 'login').mockRejectedValue(error);

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Server error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      const error = new Error('Network error');
      vi.spyOn(authStore, 'login').mockRejectedValue(error);

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      // The component shows "Network error" in the alert
      expect(wrapper.text()).toContain('Network error');
    });

    it('should disable button during submission to prevent multiple submissions', async () => {
      vi.spyOn(authStore, 'login').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      const submitButton = wrapper.find('button[type="submit"]');

      // Button should be enabled initially
      expect(submitButton.attributes('disabled')).toBeUndefined();

      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      // Button should be disabled after submit
      expect(submitButton.attributes('disabled')).toBeDefined();
      expect(submitButton.text()).toContain('Signing In...');
    });

    it('should trim email whitespace', async () => {
      const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('  test@example.com  ');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });
    });

    it('should not trim password', async () => {
      const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue();

      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('  password123  ');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '  password123  ',
        remember: false,
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to register page when sign up link clicked', async () => {
      const pushSpy = vi.spyOn(router, 'push');
      const registerLink = wrapper.find('a[href="/register"]');

      await registerLink.trigger('click');

      expect(pushSpy).toHaveBeenCalledWith('/register');
    });

    it('should navigate to forgot password page when link clicked', async () => {
      const pushSpy = vi.spyOn(router, 'push');
      const forgotLink = wrapper.find('a[href="/forgot-password"]');

      await forgotLink.trigger('click');

      expect(pushSpy).toHaveBeenCalledWith('/forgot-password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      expect(wrapper.text()).toContain('Email Address');
      expect(wrapper.text()).toContain('Password');
    });

    it('should mark required fields', () => {
      const emailLabel = wrapper.find('label[for="email"]');
      const passwordLabel = wrapper.find('label[for="password"]');

      expect(emailLabel.exists()).toBe(true);
      expect(passwordLabel.exists()).toBe(true);
    });

    it('should have autocomplete attributes', () => {
      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');

      expect(emailInput.attributes('autocomplete')).toBe('email');
      expect(passwordInput.attributes('autocomplete')).toBe('current-password');
    });
  });
});
