import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import RegisterView from '@public/views/auth/RegisterView.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
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

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return mount(RegisterView, {
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

  it('renders the registration form', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('h1').text()).toBe('Create Account');
    expect(wrapper.find('label[for="first-name"]').text()).toBe('First Name');
    expect(wrapper.find('label[for="last-name"]').text()).toBe('Last Name');
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('validates empty form submission', async () => {
    const wrapper = createWrapper();
    const form = wrapper.find('form');

    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('First name is required');
    expect(wrapper.text()).toContain('Last name is required');
    expect(wrapper.text()).toContain('Email is required');
    expect(wrapper.text()).toContain('Password is required');
  });

  it('calls register on valid form submission', async () => {
    const wrapper = createWrapper();
    const authStore = useAuthStore();
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue(undefined);

    const firstNameInput = wrapper.find('#first-name');
    const lastNameInput = wrapper.find('#last-name');
    const emailInput = wrapper.find('#email');
    const passwordInput = wrapper.find('#password input');
    const confirmInput = wrapper.find('#password-confirmation input');

    await firstNameInput.setValue('John');
    await lastNameInput.setValue('Doe');
    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('password123');
    await confirmInput.setValue('password123');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(registerSpy).toHaveBeenCalledWith({
      first_name: 'John',
      last_name: 'Doe',
      email: 'test@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    });
  });

  it('displays error on registration failure', async () => {
    const wrapper = createWrapper();
    const authStore = useAuthStore();

    vi.spyOn(authStore, 'register').mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Registration failed',
          errors: {
            email: ['The email has already been taken.'],
          },
        },
      },
      isAxiosError: true,
    });

    const firstNameInput = wrapper.find('#first-name');
    const lastNameInput = wrapper.find('#last-name');
    const emailInput = wrapper.find('#email');
    const passwordInput = wrapper.find('#password input');
    const confirmInput = wrapper.find('#password-confirmation input');

    await firstNameInput.setValue('John');
    await lastNameInput.setValue('Doe');
    await emailInput.setValue('existing@example.com');
    await passwordInput.setValue('password123');
    await confirmInput.setValue('password123');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('The email has already been taken');
  });
});
