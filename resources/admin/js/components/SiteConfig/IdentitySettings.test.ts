import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IdentitySettings from './IdentitySettings.vue';

describe('IdentitySettings', () => {
  const mockFormData = {
    site_name: 'Test Site',
    timezone: 'UTC',
    discord_link: null,
    support_email: 'support@example.com',
    contact_email: 'contact@example.com',
    admin_email: 'admin@example.com',
    maintenance_mode: false,
    user_registration_enabled: true,
    logo: null,
    favicon: null,
    og_image: null,
    remove_logo: false,
    remove_favicon: false,
    remove_og_image: false,
  };

  const mockGetFieldError = () => null;
  const mockHasFieldError = () => false;

  it('renders without errors', () => {
    const wrapper = mount(IdentitySettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
          Select: true,
          ToggleSwitch: true,
          ImageUpload: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders site information section', () => {
    const wrapper = mount(IdentitySettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
          Select: true,
          ToggleSwitch: true,
          ImageUpload: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Site Information');
    expect(wrapper.text()).toContain('Site Name');
  });

  it('renders email addresses section', () => {
    const wrapper = mount(IdentitySettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
          Select: true,
          ToggleSwitch: true,
          ImageUpload: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Email Addresses');
    expect(wrapper.text()).toContain('Support Email');
  });

  it('renders application settings section', () => {
    const wrapper = mount(IdentitySettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
          Select: true,
          ToggleSwitch: true,
          ImageUpload: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Application Settings');
    expect(wrapper.text()).toContain('Maintenance Mode');
  });

  it('renders site images section', () => {
    const wrapper = mount(IdentitySettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
          Select: true,
          ToggleSwitch: true,
          ImageUpload: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Site Images');
  });
});
