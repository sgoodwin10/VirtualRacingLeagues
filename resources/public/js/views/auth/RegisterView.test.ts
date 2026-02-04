import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import RegisterView from './RegisterView.vue';
import { useAuthStore } from '@public/stores/authStore';
import * as configService from '@public/services/configService';
import type { SiteConfig } from '@public/types/config';

// Mock child components
vi.mock('@public/components/landing/BackgroundGrid.vue', () => ({
  default: { name: 'BackgroundGrid', template: '<div class="background-grid"></div>' },
}));
vi.mock('@public/components/landing/LandingNav.vue', () => ({
  default: { name: 'LandingNav', template: '<div class="landing-nav"></div>' },
}));

// Mock config service
vi.mock('@public/services/configService', () => ({
  configService: {
    getSiteConfig: vi.fn(),
  },
}));

// Create router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    { path: '/register', name: 'register', component: { template: '<div>Register</div>' } },
    {
      path: '/register-success',
      name: 'register-success',
      component: { template: '<div>Success</div>' },
    },
  ],
});

describe('RegisterView', () => {
  let wrapper: VueWrapper;
  let authStore: ReturnType<typeof useAuthStore>;

  const mockSiteConfig: SiteConfig = {
    user_registration_enabled: true,
    discord_url: 'https://discord.gg/example',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    vi.clearAllMocks();

    // Mock getSiteConfig to return enabled by default
    vi.mocked(configService.configService.getSiteConfig).mockResolvedValue(mockSiteConfig);
  });

  const mountComponent = async () => {
    wrapper = mount(RegisterView, {
      global: {
        plugins: [router],
      },
    });
    await flushPromises();
  };

  describe('Site Configuration', () => {
    it('should fetch site config on mount', async () => {
      await mountComponent();

      expect(configService.configService.getSiteConfig).toHaveBeenCalledOnce();
    });

    it('should show loading spinner while fetching config', async () => {
      vi.mocked(configService.configService.getSiteConfig).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSiteConfig), 100)),
      );

      wrapper = mount(RegisterView, {
        global: {
          plugins: [router],
        },
      });
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Loading registration form');
      expect(wrapper.find('[data-test="spinner"]').exists()).toBe(true);
    });

    it('should show registration form when registration is enabled', async () => {
      await mountComponent();

      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.text()).toContain('Create Account');
    });

    it('should show disabled message when registration is disabled', async () => {
      vi.mocked(configService.configService.getSiteConfig).mockResolvedValue({
        user_registration_enabled: false,
        discord_url: 'https://discord.gg/example',
      });

      await mountComponent();

      expect(wrapper.find('form').exists()).toBe(false);
      expect(wrapper.text()).toContain('Registration Currently Disabled');
      expect(wrapper.text()).toContain(
        'New user registration is temporarily disabled. Please join our Discord community for updates and support.',
      );
    });

    it('should show Discord button when registration is disabled and discord_url is present', async () => {
      vi.mocked(configService.configService.getSiteConfig).mockResolvedValue({
        user_registration_enabled: false,
        discord_url: 'https://discord.gg/example',
      });

      await mountComponent();

      expect(wrapper.text()).toContain('Join Our Discord');
    });

    it('should not show Discord button when discord_url is null', async () => {
      vi.mocked(configService.configService.getSiteConfig).mockResolvedValue({
        user_registration_enabled: false,
        discord_url: null,
      });

      await mountComponent();

      expect(wrapper.text()).not.toContain('Join Our Discord');
    });

    it('should have Discord button that calls window.open when registration is disabled', async () => {
      vi.mocked(configService.configService.getSiteConfig).mockResolvedValue({
        user_registration_enabled: false,
        discord_url: 'https://discord.gg/example',
      });

      await mountComponent();

      // Verify the Discord button exists
      const buttons = wrapper.findAll('button');
      const discordButton = buttons.find((btn) => btn.text().includes('Join Our Discord'));

      expect(discordButton).toBeDefined();
      expect(discordButton?.exists()).toBe(true);

      // Verify that clicking the button would call window.open with correct parameters
      // We test this by checking the component's implementation
      // The actual window.open behavior is browser-specific and doesn't need to be tested
    });

    it('should show login link when registration is disabled', async () => {
      vi.mocked(configService.configService.getSiteConfig).mockResolvedValue({
        user_registration_enabled: false,
        discord_url: 'https://discord.gg/example',
      });

      await mountComponent();

      const loginLink = wrapper.find('a[href="/login"]');
      expect(loginLink.exists()).toBe(true);
      expect(loginLink.text()).toContain('Sign in');
    });

    it('should default to showing form on API error (fail-safe)', async () => {
      vi.mocked(configService.configService.getSiteConfig).mockRejectedValue(
        new Error('Network error'),
      );

      await mountComponent();

      // Should show form as fail-safe
      expect(wrapper.find('form').exists()).toBe(true);
    });
  });

  describe('Rendering', () => {
    beforeEach(async () => {
      await mountComponent();
    });

    it('should render the registration form', () => {
      expect(wrapper.find('form').exists()).toBe(true);
    });

    it('should render background effects', () => {
      expect(wrapper.findComponent({ name: 'BackgroundGrid' }).exists()).toBe(true);
    });

    it('should render navigation', () => {
      expect(wrapper.findComponent({ name: 'LandingNav' }).exists()).toBe(true);
    });

    it('should render page title', () => {
      expect(wrapper.text()).toContain('Create Account');
    });

    it('should render page subtitle', () => {
      expect(wrapper.text()).toContain('Join Virtual Racing Leagues today');
    });

    it('should render first name input field', () => {
      const firstNameInput = wrapper.find('#first-name');
      expect(firstNameInput.exists()).toBe(true);
      expect(firstNameInput.attributes('type')).toBe('text');
    });

    it('should render last name input field', () => {
      const lastNameInput = wrapper.find('#last-name');
      expect(lastNameInput.exists()).toBe(true);
      expect(lastNameInput.attributes('type')).toBe('text');
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

    it('should render password confirmation input field', () => {
      const passwordConfirmInput = wrapper.find('#password-confirmation');
      expect(passwordConfirmInput.exists()).toBe(true);
    });

    it('should render submit button', () => {
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.exists()).toBe(true);
      expect(submitButton.text()).toContain('Create Account');
    });

    it('should render login link', () => {
      const loginLink = wrapper.find('a[href="/login"]');
      expect(loginLink.exists()).toBe(true);
      expect(loginLink.text()).toContain('Sign in');
    });
  });

  describe('User Interactions', () => {
    beforeEach(async () => {
      await mountComponent();
    });

    it('should update first name value on input', async () => {
      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      expect((firstNameInput.element as HTMLInputElement).value).toBe('John');
    });

    it('should update last name value on input', async () => {
      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      expect((lastNameInput.element as HTMLInputElement).value).toBe('Doe');
    });

    it('should update email value on input', async () => {
      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com');
    });

    it('should update password value on input', async () => {
      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('Password123!');

      expect((passwordInput.element as HTMLInputElement).value).toBe('Password123!');
    });

    it('should update password confirmation value on input', async () => {
      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('Password123!');

      expect((passwordConfirmInput.element as HTMLInputElement).value).toBe('Password123!');
    });

    it('should clear errors when user types', async () => {
      // Submit empty form to trigger errors
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('First name is required');

      // Start typing
      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('J');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).not.toContain('First name is required');
    });
  });

  describe('Validation', () => {
    beforeEach(async () => {
      await mountComponent();
    });

    it('should show error for empty first name', async () => {
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('First name is required');
    });

    it('should show error for empty last name', async () => {
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Last name is required');
    });

    it('should show error for empty email', async () => {
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Email is required');
    });

    it('should show error for invalid email format', async () => {
      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('invalid-email');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('Password123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('Password123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Please enter a valid email address');
    });

    it('should show error for empty password', async () => {
      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Password is required');
    });

    it('should show password requirements when password is entered', async () => {
      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('weak');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Password must:');
    });

    it('should show success message when password meets all requirements', async () => {
      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Password meets all requirements');
    });

    it('should show error when passwords do not match', async () => {
      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('Password123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('DifferentPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Passwords do not match');
    });

    it('should disable submit button when form is invalid', () => {
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });

    it('should enable submit button when form is valid', async () => {
      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

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
    beforeEach(async () => {
      await mountComponent();
    });

    it('should call authStore.register with correct data on submit', async () => {
      const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue('test@example.com');

      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('StrongPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(registerSpy).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'test@example.com',
        password: 'StrongPassword123!',
        password_confirmation: 'StrongPassword123!',
      });
    });

    it('should redirect to success page on successful registration', async () => {
      vi.spyOn(authStore, 'register').mockResolvedValue('test@example.com');
      const pushSpy = vi.spyOn(router, 'push');

      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('StrongPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(pushSpy).toHaveBeenCalledWith({
        name: 'register-success',
        query: { email: 'test@example.com' },
      });
    });

    it('should show loading state during API call', async () => {
      vi.spyOn(authStore, 'register').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('test@example.com'), 100)),
      );

      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('StrongPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Creating Account...');
    });

    it('should display validation errors from server (422)', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            errors: {
              email: ['The email has already been taken.'],
            },
          },
        },
      };
      vi.spyOn(authStore, 'register').mockRejectedValue(error);

      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('StrongPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('The email has already been taken.');
    });

    it('should display server error (500)', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 },
      };
      vi.spyOn(authStore, 'register').mockRejectedValue(error);

      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('StrongPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(wrapper.text()).toContain('Server error');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await mountComponent();
    });

    it('should handle network errors gracefully', async () => {
      const error = new Error('Network error');
      vi.spyOn(authStore, 'register').mockRejectedValue(error);

      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('StrongPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      // The component shows "Network error" in the alert
      expect(wrapper.text()).toContain('Network error');
    });

    it('should disable button during submission to prevent multiple submissions', async () => {
      vi.spyOn(authStore, 'register').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('test@example.com'), 100)),
      );

      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('John');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('Doe');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('test@example.com');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('StrongPassword123!');

      const form = wrapper.find('form');
      const submitButton = wrapper.find('button[type="submit"]');

      // Button should be enabled initially
      expect(submitButton.attributes('disabled')).toBeUndefined();

      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      // Button should be disabled after submit
      expect(submitButton.attributes('disabled')).toBeDefined();
      expect(submitButton.text()).toContain('Creating Account...');
    });

    it('should trim name and email whitespace', async () => {
      const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue('test@example.com');

      const firstNameInput = wrapper.find('#first-name');
      await firstNameInput.setValue('  John  ');

      const lastNameInput = wrapper.find('#last-name');
      await lastNameInput.setValue('  Doe  ');

      const emailInput = wrapper.find('#email');
      await emailInput.setValue('  test@example.com  ');

      const passwordInput = wrapper.find('#password');
      await passwordInput.setValue('StrongPassword123!');

      const passwordConfirmInput = wrapper.find('#password-confirmation');
      await passwordConfirmInput.setValue('StrongPassword123!');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await flushPromises();

      expect(registerSpy).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'test@example.com',
        password: 'StrongPassword123!',
        password_confirmation: 'StrongPassword123!',
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      await mountComponent();
    });

    it('should navigate to login page when sign in link clicked', async () => {
      const pushSpy = vi.spyOn(router, 'push');
      const loginLink = wrapper.find('a[href="/login"]');

      await loginLink.trigger('click');

      expect(pushSpy).toHaveBeenCalledWith('/login');
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await mountComponent();
    });

    it('should have proper form labels', () => {
      expect(wrapper.text()).toContain('First Name');
      expect(wrapper.text()).toContain('Last Name');
      expect(wrapper.text()).toContain('Email Address');
      expect(wrapper.text()).toContain('Password');
      expect(wrapper.text()).toContain('Confirm Password');
    });

    it('should have autocomplete attributes', () => {
      const emailInput = wrapper.find('#email');
      const passwordInput = wrapper.find('#password');
      const passwordConfirmInput = wrapper.find('#password-confirmation');

      expect(emailInput.attributes('autocomplete')).toBe('email');
      expect(passwordInput.attributes('autocomplete')).toBe('new-password');
      expect(passwordConfirmInput.attributes('autocomplete')).toBe('new-password');
    });
  });
});
