import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import DriverNameLink from '../DriverNameLink.vue';
import { publicApi } from '@public/services/publicApi';
import type { PublicDriverProfile } from '@public/types/public';

// Mock the publicApi service
vi.mock('@public/services/publicApi', () => ({
  publicApi: {
    fetchDriverProfile: vi.fn(),
  },
}));

// Create a mock router for testing
const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/leagues/:leagueSlug/seasons/:seasonSlug',
        name: 'season-view',
        component: { template: '<div>Season View</div>' },
      },
    ],
  });
};

describe('DriverNameLink', () => {
  const mockDriverProfile: PublicDriverProfile = {
    nickname: 'TestDriver',
    driver_number: 44,
    platform_accounts: {
      psn_id: 'test_psn',
    },
    career_stats: {
      total_poles: 5,
      total_podiums: 12,
    },
    competitions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders driver name', () => {
    const router = createMockRouter();
    const wrapper = mount(DriverNameLink, {
      props: {
        driverName: 'John Doe',
        driverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(wrapper.find('.driver-name-link').text()).toBe('John Doe');
  });

  it('renders as a button element', () => {
    const router = createMockRouter();
    const wrapper = mount(DriverNameLink, {
      props: {
        driverName: 'John Doe',
        driverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    const button = wrapper.find('.driver-name-link');
    expect(button.element.tagName).toBe('BUTTON');
    expect(button.attributes('type')).toBe('button');
  });

  it('opens modal when clicked', async () => {
    const router = createMockRouter();
    const wrapper = mount(DriverNameLink, {
      props: {
        driverName: 'John Doe',
        driverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    const button = wrapper.find('.driver-name-link');
    await button.trigger('click');

    // Modal should be rendered
    const modal = wrapper.findComponent({ name: 'DriverInfoModal' });
    expect(modal.exists()).toBe(true);
    expect(modal.props('modelValue')).toBe(true);
    expect(modal.props('seasonDriverId')).toBe(123);
  });

  it('passes correct driver ID to modal', async () => {
    const router = createMockRouter();
    const wrapper = mount(DriverNameLink, {
      props: {
        driverName: 'Jane Smith',
        driverId: 456,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    await wrapper.find('.driver-name-link').trigger('click');

    const modal = wrapper.findComponent({ name: 'DriverInfoModal' });
    expect(modal.props('seasonDriverId')).toBe(456);
  });

  it('closes modal when modal emits update:modelValue(false)', async () => {
    const router = createMockRouter();
    const wrapper = mount(DriverNameLink, {
      props: {
        driverName: 'John Doe',
        driverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    // Open modal
    await wrapper.find('.driver-name-link').trigger('click');
    let modal = wrapper.findComponent({ name: 'DriverInfoModal' });
    expect(modal.props('modelValue')).toBe(true);

    // Close modal
    await modal.vm.$emit('update:modelValue', false);
    await wrapper.vm.$nextTick();

    modal = wrapper.findComponent({ name: 'DriverInfoModal' });
    expect(modal.props('modelValue')).toBe(false);
  });

  it('modal is initially closed', () => {
    const router = createMockRouter();
    const wrapper = mount(DriverNameLink, {
      props: {
        driverName: 'John Doe',
        driverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    const modal = wrapper.findComponent({ name: 'DriverInfoModal' });
    expect(modal.props('modelValue')).toBe(false);
  });

  it('can be opened multiple times', async () => {
    const router = createMockRouter();
    const wrapper = mount(DriverNameLink, {
      props: {
        driverName: 'John Doe',
        driverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    const button = wrapper.find('.driver-name-link');

    // Open first time
    await button.trigger('click');
    let modal = wrapper.findComponent({ name: 'DriverInfoModal' });
    expect(modal.props('modelValue')).toBe(true);

    // Close
    await modal.vm.$emit('update:modelValue', false);
    await wrapper.vm.$nextTick();

    modal = wrapper.findComponent({ name: 'DriverInfoModal' });
    expect(modal.props('modelValue')).toBe(false);

    // Open second time
    await button.trigger('click');
    modal = wrapper.findComponent({ name: 'DriverInfoModal' });
    expect(modal.props('modelValue')).toBe(true);
  });

  it('has correct accessibility attributes', () => {
    const router = createMockRouter();
    const wrapper = mount(DriverNameLink, {
      props: {
        driverName: 'John Doe',
        driverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    const button = wrapper.find('.driver-name-link');
    expect(button.attributes('type')).toBe('button');
  });

  it('fetches driver data when modal opens', async () => {
    vi.mocked(publicApi.fetchDriverProfile).mockResolvedValue(mockDriverProfile);

    const router = createMockRouter();
    const wrapper = mount(DriverNameLink, {
      props: {
        driverName: 'John Doe',
        driverId: 123,
      },
      global: {
        plugins: [router],
        stubs: {
          Teleport: true,
        },
      },
    });

    expect(publicApi.fetchDriverProfile).not.toHaveBeenCalled();

    await wrapper.find('.driver-name-link').trigger('click');
    await flushPromises();

    expect(publicApi.fetchDriverProfile).toHaveBeenCalledWith(123, expect.any(AbortSignal));
  });

  it('renders different driver names correctly', () => {
    const router = createMockRouter();

    const names = ['Alice', 'Bob Smith', "Charlie O'Donnell", 'Driver #44'];

    names.forEach((name) => {
      const wrapper = mount(DriverNameLink, {
        props: {
          driverName: name,
          driverId: 123,
        },
        global: {
          plugins: [router],
          stubs: {
            Teleport: true,
          },
        },
      });

      expect(wrapper.find('.driver-name-link').text()).toBe(name);
    });
  });
});
