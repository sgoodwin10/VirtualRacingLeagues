import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import type { Router } from 'vue-router';
import RegisterSuccessView from '@public/views/auth/RegisterSuccessView.vue';

describe('RegisterSuccessView', () => {
  let wrapper: VueWrapper;
  let router: Router;

  const createWrapper = async (email?: string) => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/register/success',
          name: 'register-success',
          component: RegisterSuccessView,
        },
        {
          path: '/login',
          name: 'login',
          component: { template: '<div>Login</div>' },
        },
      ],
    });

    // Navigate to the success page with optional email query param
    if (email) {
      await router.push({ name: 'register-success', query: { email } });
    } else {
      await router.push({ name: 'register-success' });
    }

    return mount(RegisterSuccessView, {
      global: {
        plugins: [router],
        stubs: {
          BackgroundGrid: true,
          LandingNav: true,
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the success page correctly', async () => {
      wrapper = await createWrapper();

      expect(wrapper.find('h1').text()).toBe('Welcome to Virtual Racing Leagues!');
      expect(wrapper.text()).toContain('Your account has been created successfully');
    });

    it('displays the user email when provided in query params', async () => {
      const testEmail = 'test@example.com';
      wrapper = await createWrapper(testEmail);

      expect(wrapper.text()).toContain(testEmail);
      expect(wrapper.text()).toContain("We've sent a confirmation email to");
    });

    it('displays generic message when email is not provided', async () => {
      wrapper = await createWrapper();

      expect(wrapper.text()).toContain("We've sent a confirmation email to your inbox");
      expect(wrapper.text()).not.toContain('@');
    });

    it('renders all three steps in the "What happens next?" section', async () => {
      wrapper = await createWrapper();

      expect(wrapper.text()).toContain('Check your email');
      expect(wrapper.text()).toContain('Verify your email address');
      expect(wrapper.text()).toContain('Start racing!');
    });

    it('renders the success alert with correct type', async () => {
      wrapper = await createWrapper();

      const alert = wrapper.find('[data-test="alert"]');
      expect(alert.exists()).toBe(true);
      expect(alert.attributes('data-type')).toBe('success');
    });

    it('displays action buttons', async () => {
      wrapper = await createWrapper();

      const buttons = wrapper.findAllComponents({ name: 'VrlButton' });
      expect(buttons.length).toBeGreaterThanOrEqual(2);

      // Check for "Open Email Client" button
      expect(wrapper.text()).toContain('Open Email Client');

      // Check for "Continue to Login" button
      expect(wrapper.text()).toContain('Continue to Login');
    });

    it('displays help text for not receiving email', async () => {
      wrapper = await createWrapper();

      expect(wrapper.text()).toContain("Didn't receive the email?");
      expect(wrapper.text()).toContain('Check your spam folder');
    });
  });

  describe('User Interactions', () => {
    it('navigates to login page when "Continue to Login" button is clicked', async () => {
      wrapper = await createWrapper('test@example.com');

      // Spy on router.push to verify it's called with correct route
      const pushSpy = vi.spyOn(router, 'push');

      // Access the component instance and call the handler directly
      const vm = wrapper.vm as any;

      // Call the handleLoginRedirect method
      await vm.handleLoginRedirect();

      // Verify router.push was called with '/login'
      expect(pushSpy).toHaveBeenCalledWith('/login');
    });

    it('opens email client when "Open Email Client" button is clicked', async () => {
      wrapper = await createWrapper('test@example.com');

      // Mock window.location.href
      const originalLocation = window.location.href;
      delete (window as any).location;
      window.location = { href: originalLocation } as any;

      const locationSpy = vi.spyOn(window.location, 'href', 'set');

      // Find the button with "Open Email Client" text
      const allButtons = wrapper.findAll('button');
      const emailButton = allButtons.find((btn) => btn.text().includes('Open Email Client'));

      expect(emailButton).toBeDefined();
      await emailButton!.trigger('click');

      expect(locationSpy).toHaveBeenCalledWith('mailto:');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      wrapper = await createWrapper();

      const h1 = wrapper.find('h1');
      const h2 = wrapper.find('h2');

      expect(h1.exists()).toBe(true);
      expect(h2.exists()).toBe(true);
    });

    it('has router-link for login in help text', async () => {
      wrapper = await createWrapper();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      const helpLinks = links.filter(
        (link) =>
          link.element.textContent?.includes('Sign in now') ||
          link.element.textContent?.includes('contact support'),
      );

      expect(helpLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing email gracefully', async () => {
      wrapper = await createWrapper();

      // Should not crash and should show generic message
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain("We've sent a confirmation email to your inbox");
    });

    it('handles email with special characters', async () => {
      const specialEmail = 'test+special@example.com';
      wrapper = await createWrapper(specialEmail);

      expect(wrapper.text()).toContain(specialEmail);
    });
  });
});
