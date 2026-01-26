import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ForgotPasswordView from '@public/views/auth/ForgotPasswordView.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import { authService } from '@public/services/authService';

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({
    query: {},
  }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
  },
}));

// Mock auth service
vi.mock('@public/services/authService', () => ({
  authService: {
    requestPasswordReset: vi.fn(),
  },
}));

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return mount(ForgotPasswordView, {
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

  it('renders the forgot password form', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('h1').text()).toBe('Forgot Password?');
    expect(wrapper.find('label[for="email"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('validates empty email', async () => {
    const wrapper = createWrapper();
    const form = wrapper.find('form');

    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Email is required');
  });

  it('calls authService on valid form submission', async () => {
    const wrapper = createWrapper();
    vi.mocked(authService.requestPasswordReset).mockResolvedValue(undefined);

    const emailInput = wrapper.find('#email');
    await emailInput.setValue('test@example.com');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  it('displays error on failure', async () => {
    const wrapper = createWrapper();
    vi.mocked(authService.requestPasswordReset).mockRejectedValue(new Error('Network error'));

    const emailInput = wrapper.find('#email');
    await emailInput.setValue('test@example.com');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('Failed to send reset link');
  });
});
