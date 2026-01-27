# Test Templates for Missing Tests

This document provides test templates to help you quickly implement the missing tests.

## Table of Contents
1. [Authentication View Template](#authentication-view-template)
2. [Landing View Template](#landing-view-template)
3. [Form Component Template](#form-component-template)
4. [Accordion Component Template](#accordion-component-template)
5. [League Component Template](#league-component-template)
6. [Navigation Component Template](#navigation-component-template)
7. [Utility Function Template](#utility-function-template)

---

## Authentication View Template

Use this for: LoginView, RegisterView, ForgotPasswordView, ResetPasswordView

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import ViewName from './ViewName.vue';
import * as authService from '@public/services/authService';

// Mock the auth service
vi.mock('@public/services/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

// Mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    { path: '/register', name: 'register', component: { template: '<div>Register</div>' } },
    { path: '/forgot-password', name: 'forgot-password', component: { template: '<div>Forgot</div>' } },
  ],
});

describe('ViewName', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mount(ViewName, {
      global: {
        plugins: [router],
        stubs: {
          // Stub child components if needed
          VrlInput: true,
          VrlButton: true,
        },
      },
    });
  });

  describe('Rendering', () => {
    it('should render the form', () => {
      expect(wrapper.find('form').exists()).toBe(true);
    });

    it('should render email input field', () => {
      const emailInput = wrapper.find('input[type="email"]');
      expect(emailInput.exists()).toBe(true);
    });

    it('should render password input field', () => {
      const passwordInput = wrapper.find('input[type="password"]');
      expect(passwordInput.exists()).toBe(true);
    });

    it('should render submit button', () => {
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.exists()).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('should update email value on input', async () => {
      const emailInput = wrapper.find('input[type="email"]');
      await emailInput.setValue('test@example.com');

      expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com');
    });

    it('should update password value on input', async () => {
      const passwordInput = wrapper.find('input[type="password"]');
      await passwordInput.setValue('password123');

      expect((passwordInput.element as HTMLInputElement).value).toBe('password123');
    });

    it('should submit form when button clicked', async () => {
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      expect(authService.login).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should show error for empty email', async () => {
      const submitButton = wrapper.find('button[type="submit"]');
      await submitButton.trigger('click');

      expect(wrapper.text()).toContain('Email is required');
    });

    it('should show error for invalid email format', async () => {
      const emailInput = wrapper.find('input[type="email"]');
      await emailInput.setValue('invalid-email');
      await emailInput.trigger('blur');

      expect(wrapper.text()).toContain('Invalid email');
    });

    it('should show error for empty password', async () => {
      const emailInput = wrapper.find('input[type="email"]');
      await emailInput.setValue('test@example.com');

      const submitButton = wrapper.find('button[type="submit"]');
      await submitButton.trigger('click');

      expect(wrapper.text()).toContain('Password is required');
    });
  });

  describe('API Integration', () => {
    it('should call auth service with correct credentials on submit', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' },
      });

      const emailInput = wrapper.find('input[type="email"]');
      const passwordInput = wrapper.find('input[type="password"]');

      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should show loading state during API call', async () => {
      vi.mocked(authService.login).mockReturnValue(
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');

      expect(wrapper.find('.loading').exists()).toBe(true);
    });

    it('should redirect on successful authentication', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' },
      });

      const pushSpy = vi.spyOn(router, 'push');

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(pushSpy).toHaveBeenCalledWith({ name: 'dashboard' });
    });

    it('should display error message on failed authentication', async () => {
      vi.mocked(authService.login).mockRejectedValue({
        message: 'Invalid credentials',
      });

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Invalid credentials');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Network error')
      );

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Network error');
    });

    it('should prevent multiple simultaneous submissions', async () => {
      vi.mocked(authService.login).mockReturnValue(
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      await form.trigger('submit.prevent');

      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should clear errors when user starts typing', async () => {
      // First trigger an error
      const form = wrapper.find('form');
      await form.trigger('submit.prevent');
      expect(wrapper.text()).toContain('Email is required');

      // Then start typing
      const emailInput = wrapper.find('input[type="email"]');
      await emailInput.setValue('test@example.com');

      expect(wrapper.text()).not.toContain('Email is required');
    });
  });
});
```

---

## Landing View Template

Use this for: HomeView

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import HomeView from './HomeView.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: HomeView }],
});

describe('HomeView', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(HomeView, {
      global: {
        plugins: [router],
        stubs: {
          // Stub heavy components for faster tests
          HeroSection: true,
          FeaturesSection: true,
          PlatformsSection: true,
          PricingSection: true,
        },
      },
    });
  });

  describe('Rendering', () => {
    it('should render the landing page', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should render HeroSection component', () => {
      expect(wrapper.findComponent({ name: 'HeroSection' }).exists()).toBe(true);
    });

    it('should render FeaturesSection component', () => {
      expect(wrapper.findComponent({ name: 'FeaturesSection' }).exists()).toBe(true);
    });

    it('should render PlatformsSection component', () => {
      expect(wrapper.findComponent({ name: 'PlatformsSection' }).exists()).toBe(true);
    });

    it('should render PricingSection component', () => {
      expect(wrapper.findComponent({ name: 'PricingSection' }).exists()).toBe(true);
    });

    it('should render PublicHeader', () => {
      expect(wrapper.findComponent({ name: 'PublicHeader' }).exists()).toBe(true);
    });

    it('should render PublicFooter', () => {
      expect(wrapper.findComponent({ name: 'PublicFooter' }).exists()).toBe(true);
    });
  });

  describe('Page Metadata', () => {
    it('should set correct page title', () => {
      expect(document.title).toContain('Home');
    });
  });

  describe('Section Order', () => {
    it('should render sections in correct order', () => {
      const sections = wrapper.findAll('[data-section]');
      expect(sections[0].attributes('data-section')).toBe('hero');
      expect(sections[1].attributes('data-section')).toBe('features');
      expect(sections[2].attributes('data-section')).toBe('platforms');
    });
  });
});
```

---

## Form Component Template

Use this for: VrlPasswordInput

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlPasswordInput from './VrlPasswordInput.vue';

describe('VrlPasswordInput', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(VrlPasswordInput, {
      props: {
        modelValue: '',
        label: 'Password',
      },
    });
  });

  describe('Rendering', () => {
    it('should render password input field', () => {
      const input = wrapper.find('input[type="password"]');
      expect(input.exists()).toBe(true);
    });

    it('should render toggle visibility button', () => {
      const toggleButton = wrapper.find('[data-testid="toggle-visibility"]');
      expect(toggleButton.exists()).toBe(true);
    });

    it('should display label when provided', () => {
      expect(wrapper.text()).toContain('Password');
    });

    it('should render as password type by default', () => {
      const input = wrapper.find('input');
      expect(input.attributes('type')).toBe('password');
    });
  });

  describe('User Interactions', () => {
    it('should toggle input type between password and text', async () => {
      const input = wrapper.find('input');
      const toggleButton = wrapper.find('[data-testid="toggle-visibility"]');

      expect(input.attributes('type')).toBe('password');

      await toggleButton.trigger('click');
      expect(input.attributes('type')).toBe('text');

      await toggleButton.trigger('click');
      expect(input.attributes('type')).toBe('password');
    });

    it('should emit update:modelValue on input', async () => {
      const input = wrapper.find('input');
      await input.setValue('password123');

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['password123']);
    });

    it('should change toggle icon when visibility changes', async () => {
      const toggleButton = wrapper.find('[data-testid="toggle-visibility"]');

      const iconBefore = toggleButton.find('svg').classes();
      await toggleButton.trigger('click');
      const iconAfter = toggleButton.find('svg').classes();

      expect(iconBefore).not.toEqual(iconAfter);
    });
  });

  describe('Props', () => {
    it('should accept and display modelValue', async () => {
      await wrapper.setProps({ modelValue: 'test-password' });

      const input = wrapper.find('input');
      expect((input.element as HTMLInputElement).value).toBe('test-password');
    });

    it('should apply disabled state', async () => {
      await wrapper.setProps({ disabled: true });

      const input = wrapper.find('input');
      expect(input.attributes('disabled')).toBeDefined();
    });

    it('should display error message', async () => {
      await wrapper.setProps({ error: 'Password is too short' });

      expect(wrapper.text()).toContain('Password is too short');
    });

    it('should show strength indicator when enabled', async () => {
      await wrapper.setProps({ showStrength: true, modelValue: 'weak' });

      expect(wrapper.find('[data-testid="password-strength"]').exists()).toBe(true);
    });
  });

  describe('Password Strength', () => {
    it('should calculate weak password strength', async () => {
      await wrapper.setProps({ showStrength: true, modelValue: 'abc' });

      expect(wrapper.text()).toContain('Weak');
    });

    it('should calculate medium password strength', async () => {
      await wrapper.setProps({ showStrength: true, modelValue: 'abc123XYZ' });

      expect(wrapper.text()).toContain('Medium');
    });

    it('should calculate strong password strength', async () => {
      await wrapper.setProps({
        showStrength: true,
        modelValue: 'Abc123!@#XYZ'
      });

      expect(wrapper.text()).toContain('Strong');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      const input = wrapper.find('input');
      const label = wrapper.find('label');

      expect(input.attributes('id')).toBe(label.attributes('for'));
    });

    it('should have descriptive toggle button text', () => {
      const toggleButton = wrapper.find('[data-testid="toggle-visibility"]');
      expect(toggleButton.attributes('aria-label')).toContain('password');
    });

    it('should announce visibility changes to screen readers', async () => {
      const toggleButton = wrapper.find('[data-testid="toggle-visibility"]');

      expect(toggleButton.attributes('aria-label')).toContain('Show');

      await toggleButton.trigger('click');
      expect(toggleButton.attributes('aria-label')).toContain('Hide');
    });
  });
});
```

---

## Accordion Component Template

Use this for: VrlAccordionHeader, VrlAccordionContent

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import VrlAccordionHeader from './VrlAccordionHeader.vue';

describe('VrlAccordionHeader', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(VrlAccordionHeader, {
      props: {
        title: 'Accordion Header',
        isExpanded: false,
      },
    });
  });

  describe('Rendering', () => {
    it('should render header text', () => {
      expect(wrapper.text()).toContain('Accordion Header');
    });

    it('should render expand/collapse icon', () => {
      expect(wrapper.find('[data-testid="accordion-icon"]').exists()).toBe(true);
    });

    it('should show collapsed state by default', () => {
      expect(wrapper.find('[aria-expanded="false"]').exists()).toBe(true);
    });

    it('should show expanded state when prop is true', async () => {
      await wrapper.setProps({ isExpanded: true });
      expect(wrapper.find('[aria-expanded="true"]').exists()).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('should emit toggle event on click', async () => {
      await wrapper.trigger('click');
      expect(wrapper.emitted('toggle')).toBeTruthy();
    });

    it('should emit toggle event on Enter key press', async () => {
      await wrapper.trigger('keydown.enter');
      expect(wrapper.emitted('toggle')).toBeTruthy();
    });

    it('should emit toggle event on Space key press', async () => {
      await wrapper.trigger('keydown.space');
      expect(wrapper.emitted('toggle')).toBeTruthy();
    });

    it('should change icon when expanded', async () => {
      const iconBefore = wrapper.find('[data-testid="accordion-icon"]').classes();

      await wrapper.setProps({ isExpanded: true });
      const iconAfter = wrapper.find('[data-testid="accordion-icon"]').classes();

      expect(iconBefore).not.toEqual(iconAfter);
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      expect(wrapper.attributes('role')).toBe('button');
    });

    it('should have aria-expanded attribute', () => {
      expect(wrapper.attributes('aria-expanded')).toBeDefined();
    });

    it('should have aria-controls attribute', async () => {
      await wrapper.setProps({ controlsId: 'accordion-content-1' });
      expect(wrapper.attributes('aria-controls')).toBe('accordion-content-1');
    });

    it('should be keyboard accessible', () => {
      expect(wrapper.attributes('tabindex')).toBe('0');
    });

    it('should have focus indicator', async () => {
      await wrapper.trigger('focus');
      expect(wrapper.classes()).toContain('focus');
    });
  });
});
```

---

## League Component Template

Use this for: RoundAccordion, RaceEventAccordion, RoundStandingsTable, CrossDivisionResultsTable

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import ComponentName from './ComponentName.vue';

// Mock API if needed
vi.mock('@public/services/leagueService', () => ({
  fetchRoundResults: vi.fn(),
  fetchStandings: vi.fn(),
}));

describe('ComponentName', () => {
  let wrapper: VueWrapper;

  const mockData = {
    // Define mock data structure
  };

  beforeEach(() => {
    wrapper = mount(ComponentName, {
      props: {
        data: mockData,
      },
    });
  });

  describe('Rendering', () => {
    it('should render component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should display data correctly', () => {
      // Test data rendering
    });

    it('should show empty state when no data', async () => {
      await wrapper.setProps({ data: [] });
      expect(wrapper.text()).toContain('No data');
    });
  });

  describe('User Interactions', () => {
    it('should expand/collapse on click', async () => {
      const header = wrapper.find('[data-testid="accordion-header"]');
      await header.trigger('click');

      expect(wrapper.find('[data-testid="accordion-content"]').isVisible()).toBe(true);
    });
  });

  describe('Data Display', () => {
    it('should format data correctly', () => {
      // Test data formatting
    });

    it('should sort data correctly', () => {
      // Test sorting
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data gracefully', async () => {
      await wrapper.setProps({ data: null });
      expect(wrapper.text()).toContain('No data available');
    });

    it('should handle loading state', async () => {
      await wrapper.setProps({ loading: true });
      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true);
    });
  });
});
```

---

## Navigation Component Template

Use this for: VrlTab, VrlBreadcrumbItem, LandingNav

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import ComponentName from './ComponentName.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/about', name: 'about', component: { template: '<div>About</div>' } },
  ],
});

describe('ComponentName', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(ComponentName, {
      props: {
        label: 'Nav Item',
        to: { name: 'about' },
      },
      global: {
        plugins: [router],
      },
    });
  });

  describe('Rendering', () => {
    it('should render navigation item', () => {
      expect(wrapper.text()).toContain('Nav Item');
    });

    it('should render as link when to prop provided', () => {
      expect(wrapper.find('a').exists()).toBe(true);
    });

    it('should apply active styles when current route', async () => {
      await router.push('/about');
      await wrapper.vm.$nextTick();

      expect(wrapper.classes()).toContain('active');
    });
  });

  describe('User Interactions', () => {
    it('should navigate on click', async () => {
      const pushSpy = vi.spyOn(router, 'push');
      await wrapper.trigger('click');

      expect(pushSpy).toHaveBeenCalledWith({ name: 'about' });
    });

    it('should emit click event', async () => {
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      await wrapper.trigger('keydown.enter');
      expect(wrapper.emitted('click')).toBeTruthy();
    });

    it('should have proper ARIA attributes', () => {
      expect(wrapper.attributes('role')).toBe('link');
    });
  });
});
```

---

## Utility Function Template

Use this for: subdomain.ts

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSubdomain,
  isPublicSubdomain,
  isAppSubdomain,
  isAdminSubdomain,
  buildSubdomainUrl,
  redirectToSubdomain,
} from './subdomain';

describe('subdomain utilities', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
  });

  describe('getSubdomain', () => {
    it('should extract subdomain from hostname', () => {
      (window as any).location = { hostname: 'app.example.com' };
      expect(getSubdomain()).toBe('app');
    });

    it('should return empty string for root domain', () => {
      (window as any).location = { hostname: 'example.com' };
      expect(getSubdomain()).toBe('');
    });

    it('should handle localhost', () => {
      (window as any).location = { hostname: 'localhost' };
      expect(getSubdomain()).toBe('');
    });

    it('should handle localhost with port', () => {
      (window as any).location = { hostname: 'localhost:3000' };
      expect(getSubdomain()).toBe('');
    });

    it('should handle subdomain with port', () => {
      (window as any).location = { hostname: 'app.example.com:3000' };
      expect(getSubdomain()).toBe('app');
    });
  });

  describe('isPublicSubdomain', () => {
    it('should return true for public subdomain', () => {
      (window as any).location = { hostname: 'example.com' };
      expect(isPublicSubdomain()).toBe(true);
    });

    it('should return false for app subdomain', () => {
      (window as any).location = { hostname: 'app.example.com' };
      expect(isPublicSubdomain()).toBe(false);
    });
  });

  describe('isAppSubdomain', () => {
    it('should return true for app subdomain', () => {
      (window as any).location = { hostname: 'app.example.com' };
      expect(isAppSubdomain()).toBe(true);
    });

    it('should return false for public subdomain', () => {
      (window as any).location = { hostname: 'example.com' };
      expect(isAppSubdomain()).toBe(false);
    });
  });

  describe('buildSubdomainUrl', () => {
    it('should build URL with subdomain', () => {
      (window as any).location = {
        hostname: 'example.com',
        protocol: 'https:',
      };

      const url = buildSubdomainUrl('app', '/dashboard');
      expect(url).toBe('https://app.example.com/dashboard');
    });

    it('should preserve query parameters', () => {
      (window as any).location = {
        hostname: 'example.com',
        protocol: 'https:',
      };

      const url = buildSubdomainUrl('app', '/dashboard?id=123');
      expect(url).toBe('https://app.example.com/dashboard?id=123');
    });

    it('should handle localhost', () => {
      (window as any).location = {
        hostname: 'localhost:3000',
        protocol: 'http:',
      };

      const url = buildSubdomainUrl('app', '/dashboard');
      expect(url).toBe('http://app.localhost:3000/dashboard');
    });
  });

  describe('redirectToSubdomain', () => {
    it('should redirect to specified subdomain', () => {
      const mockReplace = vi.fn();
      (window as any).location = {
        hostname: 'example.com',
        protocol: 'https:',
        replace: mockReplace,
      };

      redirectToSubdomain('app', '/dashboard');
      expect(mockReplace).toHaveBeenCalledWith('https://app.example.com/dashboard');
    });
  });
});
```

---

## General Testing Tips

### 1. Use data-testid for stable selectors
```typescript
// In component
<button data-testid="submit-button">Submit</button>

// In test
wrapper.find('[data-testid="submit-button"]')
```

### 2. Test user behavior, not implementation
```typescript
// Good ✅
it('should show error when email is invalid', async () => {
  await wrapper.find('input[type="email"]').setValue('invalid');
  await wrapper.find('button').trigger('click');
  expect(wrapper.text()).toContain('Invalid email');
});

// Bad ❌
it('should call validateEmail function', () => {
  expect(wrapper.vm.validateEmail).toHaveBeenCalled();
});
```

### 3. Use async/await for all interactions
```typescript
// Always await user interactions
await wrapper.find('button').trigger('click');
await wrapper.vm.$nextTick();
```

### 4. Mock external dependencies
```typescript
// Mock API calls
vi.mock('@public/services/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

// Mock router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
```

### 5. Test accessibility
```typescript
it('should have proper ARIA attributes', () => {
  expect(wrapper.attributes('aria-label')).toBeDefined();
  expect(wrapper.attributes('role')).toBe('button');
});

it('should be keyboard accessible', async () => {
  await wrapper.trigger('keydown.enter');
  expect(wrapper.emitted('click')).toBeTruthy();
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests for specific component
npm test -- VrlPasswordInput.test.ts

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

---

**End of Templates Document**
