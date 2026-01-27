import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EmailSettings from './EmailSettings.vue';

describe('EmailSettings', () => {
  const mockFormData = {
    support_email: 'support@example.com',
    contact_email: 'contact@example.com',
    admin_email: 'admin@example.com',
  };

  const mockGetFieldError = () => null;
  const mockHasFieldError = () => false;

  it('renders without errors', () => {
    const wrapper = mount(EmailSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders support email input', () => {
    const wrapper = mount(EmailSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Support Email');
  });

  it('renders contact email input', () => {
    const wrapper = mount(EmailSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Contact Email');
  });

  it('renders admin email input', () => {
    const wrapper = mount(EmailSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Admin Email');
  });
});
