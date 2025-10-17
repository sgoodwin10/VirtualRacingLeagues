import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SiteConfigForm from '../SiteConfigForm.vue';
import type { SiteConfig } from '@admin/types/siteConfig';

describe('SiteConfigForm', () => {
  const mockConfig: SiteConfig = {
    id: 1,
    site_name: 'Test Site',
    maintenance_mode: false,
    timezone: 'UTC',
    user_registration_enabled: true,
    google_tag_manager_id: null,
    google_analytics_id: null,
    google_search_console_code: null,
    discord_link: null,
    support_email: null,
    contact_email: null,
    admin_email: null,
    files: {
      logo: null,
      favicon: null,
      og_image: null,
    },
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  };

  const mockGetFieldError = () => null;
  const mockHasFieldError = () => false;

  const createWrapper = (props: any = {}) => {
    return mount(SiteConfigForm, {
      props: {
        config: mockConfig,
        saving: false,
        getFieldError: mockGetFieldError,
        hasFieldError: mockHasFieldError,
        ...props,
      },
      global: {
        stubs: {
          Tabs: {
            template: '<div class="tabs"><slot /></div>',
            props: ['value'],
          },
          TabList: {
            template: '<div class="tab-list"><slot /></div>',
          },
          Tab: {
            template: '<div class="tab"><slot /></div>',
            props: ['value'],
          },
          TabPanels: {
            template: '<div class="tab-panels"><slot /></div>',
          },
          TabPanel: {
            template: '<div class="tab-panel"><slot /></div>',
            props: ['value'],
          },
          Button: {
            template: '<button type="button">{{ label }}</button>',
            props: ['type', 'label', 'severity', 'outlined', 'icon', 'loading', 'disabled'],
          },
          IdentitySettings: {
            template: '<div class="identity-settings">IdentitySettings</div>',
            props: ['formData', 'getFieldError', 'hasFieldError'],
          },
          TrackingSettings: {
            template: '<div class="tracking-settings">TrackingSettings</div>',
            props: ['formData', 'getFieldError', 'hasFieldError'],
          },
        },
      },
    });
  };

  it('renders without errors', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders tabs', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.tabs').exists()).toBe(true);
  });

  it('renders save button', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Save Changes');
  });

  it('renders cancel button', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Cancel');
  });

  it('renders IdentitySettings component', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.identity-settings').exists()).toBe(true);
  });

  it('renders TrackingSettings component', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.tracking-settings').exists()).toBe(true);
  });
});
