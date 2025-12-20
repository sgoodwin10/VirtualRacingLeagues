import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ResetPasswordView from '@public/views/auth/ResetPasswordView.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import { authService } from '@public/services/authService';

// Mock vue-router
const mockPush = vi.fn();
const mockQuery = { email: 'test@example.com', token: 'test-token' };

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({
    query: mockQuery,
  }),
}));

// Mock auth service
vi.mock('@public/services/authService', () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}));

describe('ResetPasswordView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    vi.clearAllMocks();
    mockQuery.email = 'test@example.com';
    mockQuery.token = 'test-token';
  });

  const createWrapper = () => {
    return mount(ResetPasswordView, {
      global: {
        plugins: [
          createPinia(),
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
                options: {
                  prefix: 'p',
                  darkModeSelector: false,
                  cssLayer: {
                    name: 'primevue',
                    order: 'tailwind-base, primevue, tailwind-utilities',
                  },
                },
              },
            },
          ],
          ToastService,
        ],
        stubs: {
          'router-link': {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    });
  };

  it('renders the reset password form', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('h1').text()).toBe('Reset Password');
    expect(wrapper.find('label[for="password"]').text()).toBe('New Password');
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('validates empty password', async () => {
    const wrapper = createWrapper();
    const form = wrapper.find('form');

    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Password is required');
  });

  it('validates mismatched passwords', async () => {
    const wrapper = createWrapper();

    const passwordInput = wrapper.find('#password input');
    const confirmInput = wrapper.find('#password-confirmation input');

    await passwordInput.setValue('Password123!');
    await confirmInput.setValue('Different123!');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Passwords do not match');
  });

  it('calls authService on valid form submission', async () => {
    const wrapper = createWrapper();
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

    const passwordInput = wrapper.find('#password input');
    const confirmInput = wrapper.find('#password-confirmation input');

    await passwordInput.setValue('Password123!');
    await confirmInput.setValue('Password123!');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(authService.resetPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: 'test-token',
      password: 'Password123!',
      password_confirmation: 'Password123!',
    });
  });

  it('displays error on reset failure', async () => {
    const wrapper = createWrapper();
    vi.mocked(authService.resetPassword).mockRejectedValue(new Error('Reset failed'));

    const passwordInput = wrapper.find('#password input');
    const confirmInput = wrapper.find('#password-confirmation input');

    await passwordInput.setValue('Password123!');
    await confirmInput.setValue('Password123!');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('Failed to reset password');
  });
});
