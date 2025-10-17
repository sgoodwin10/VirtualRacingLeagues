import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LoginView from '../LoginView.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { useAuthStore } from '@public/stores/authStore';

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({
    query: {},
  }),
}));

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return mount(LoginView, {
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

  it('renders the login form', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('h1').text()).toBe('Welcome Back');
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('validates empty form submission', async () => {
    const wrapper = createWrapper();
    const form = wrapper.find('form');

    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Email is required');
    expect(wrapper.text()).toContain('Password is required');
  });

  it('calls login on valid form submission', async () => {
    const wrapper = createWrapper();
    const authStore = useAuthStore();
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue(undefined);

    const emailInput = wrapper.find('#email');
    const passwordInput = wrapper.find('#password input');

    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('password123');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      remember: false,
    });
  });

  it('displays error on login failure', async () => {
    const wrapper = createWrapper();
    const authStore = useAuthStore();

    vi.spyOn(authStore, 'login').mockRejectedValue({
      response: { status: 401 },
      isAxiosError: true,
    });

    const emailInput = wrapper.find('#email');
    const passwordInput = wrapper.find('#password input');

    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('wrongpassword');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('Invalid email or password');
  });
});
