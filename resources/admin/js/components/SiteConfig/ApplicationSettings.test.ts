import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ApplicationSettings from './ApplicationSettings.vue';

describe('ApplicationSettings', () => {
  const mockFormData = {
    maintenance_mode: false,
    user_registration_enabled: true,
    timezone: 'UTC',
    discord_link: null,
  };

  const mockGetFieldError = () => null;
  const mockHasFieldError = () => false;

  it('renders without errors', () => {
    const wrapper = mount(ApplicationSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          ToggleSwitch: true,
          Select: true,
          InputText: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders maintenance mode toggle', () => {
    const wrapper = mount(ApplicationSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          ToggleSwitch: true,
          Select: true,
          InputText: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Maintenance Mode');
  });

  it('renders user registration toggle', () => {
    const wrapper = mount(ApplicationSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          ToggleSwitch: true,
          Select: true,
          InputText: true,
        },
      },
    });

    expect(wrapper.text()).toContain('User Registration');
  });

  it('renders timezone select', () => {
    const wrapper = mount(ApplicationSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          ToggleSwitch: true,
          Select: true,
          InputText: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Timezone');
  });

  it('renders discord link input', () => {
    const wrapper = mount(ApplicationSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          ToggleSwitch: true,
          Select: true,
          InputText: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Discord Server Link');
  });
});
