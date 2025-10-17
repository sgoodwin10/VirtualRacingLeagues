import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TrackingSettings from '../TrackingSettings.vue';

describe('TrackingSettings', () => {
  const mockFormData = {
    google_tag_manager_id: null,
    google_analytics_id: null,
    google_search_console_code: null,
  };

  const mockGetFieldError = () => null;
  const mockHasFieldError = () => false;

  it('renders without errors', () => {
    const wrapper = mount(TrackingSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
          Textarea: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders Google Tag Manager input', () => {
    const wrapper = mount(TrackingSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
          Textarea: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Google Tag Manager ID');
  });

  it('renders Google Analytics input', () => {
    const wrapper = mount(TrackingSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
          Textarea: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Google Analytics ID');
  });

  it('renders Google Search Console input', () => {
    const wrapper = mount(TrackingSettings, {
      props: {
        formData: mockFormData,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
      },
      global: {
        stubs: {
          InputText: true,
          Textarea: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Search Console Verification');
  });
});
