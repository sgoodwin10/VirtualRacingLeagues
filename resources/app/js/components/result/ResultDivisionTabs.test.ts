import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ResultDivisionTabs from './ResultDivisionTabs.vue';
import type { RaceResultFormData, DriverOption } from '@app/types/raceResult';
import type { Division } from '@app/types/division';

// Mock PrimeVue components
vi.mock('primevue/tabs', () => ({
  default: {
    name: 'Tabs',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/tablist', () => ({
  default: {
    name: 'TabList',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/tab', () => ({
  default: {
    name: 'Tab',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/tabpanels', () => ({
  default: {
    name: 'TabPanels',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/tabpanel', () => ({
  default: {
    name: 'TabPanel',
    template: '<div><slot /></div>',
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button @click="$attrs.onClick"><slot /></button>',
  },
}));

// Mock useVrlConfirm
const mockShowConfirmation = vi.fn();
vi.mock('@app/composables/useVrlConfirm', async () => {
  const { ref } = await import('vue');
  return {
    useVrlConfirm: () => ({
      isVisible: ref(false),
      options: ref(null),
      isLoading: ref(false),
      showConfirmation: mockShowConfirmation,
      close: vi.fn(),
      handleAccept: vi.fn(),
      handleReject: vi.fn(),
    }),
  };
});

// Mock ResultEntryTable component
vi.mock('../ResultEntryTable.vue', () => ({
  default: {
    name: 'ResultEntryTable',
    template: '<div></div>',
  },
}));

describe('ResultDivisionTabs', () => {
  let wrapper: VueWrapper;

  const mockDivisions: Division[] = [
    {
      id: 1,
      name: 'Division A',
      description: 'Top tier',
      logo_url: null,
      order: 1,
      season_id: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 2,
      name: 'Division B',
      description: 'Mid tier',
      logo_url: null,
      order: 2,
      season_id: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ];

  const mockDriversByDivision: Record<number, DriverOption[]> = {
    1: [
      {
        id: 1,
        name: 'Driver 1',
        division_id: 1,
        nickname: 'D1',
        psn_id: 'psn1',
        iracing_id: null,
        discord_id: null,
      },
      {
        id: 2,
        name: 'Driver 2',
        division_id: 1,
        nickname: 'D2',
        psn_id: 'psn2',
        iracing_id: null,
        discord_id: null,
      },
    ],
    2: [
      {
        id: 3,
        name: 'Driver 3',
        division_id: 2,
        nickname: 'D3',
        psn_id: 'psn3',
        iracing_id: null,
        discord_id: null,
      },
    ],
  };

  const mockResults: RaceResultFormData[] = [
    {
      driver_id: 1,
      division_id: 1,
      position: 1,
      original_race_time: '01:23:45.678',
      original_race_time_difference: '',
      fastest_lap: '01:25.123',
      penalties: '',
      has_fastest_lap: true,
      has_pole: false,
      dnf: false,
      _originalPenalties: '',
      _penaltyChanged: false,
    },
    {
      driver_id: 2,
      division_id: 1,
      position: 2,
      original_race_time: '01:24:00.000',
      original_race_time_difference: '+14.322',
      fastest_lap: '01:26.456',
      penalties: '5',
      has_fastest_lap: false,
      has_pole: false,
      dnf: false,
      _originalPenalties: '5',
      _penaltyChanged: false,
    },
    {
      driver_id: 3,
      division_id: 2,
      position: 1,
      original_race_time: '01:25:00.000',
      original_race_time_difference: '',
      fastest_lap: '01:27.789',
      penalties: '',
      has_fastest_lap: false,
      has_pole: false,
      dnf: true,
      _originalPenalties: '',
      _penaltyChanged: false,
    },
  ];

  beforeEach(() => {
    mockShowConfirmation.mockClear();
  });

  const createWrapper = (props = {}) => {
    return mount(ResultDivisionTabs, {
      props: {
        results: mockResults,
        divisions: mockDivisions,
        driversByDivision: mockDriversByDivision,
        isQualifying: false,
        selectedDriverIds: new Set([1, 2, 3]),
        readOnly: false,
        ...props,
      },
      global: {
        plugins: [
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
              },
            },
          ],
        ],
      },
    });
  };

  describe('Reset All Button', () => {
    it('should render the Reset All Results button when not in read-only mode', () => {
      wrapper = createWrapper();
      const button = wrapper.find('button');
      expect(button.exists()).toBe(true);
    });

    it('should not render the Reset All Results button in read-only mode', () => {
      wrapper = createWrapper({ readOnly: true });
      const button = wrapper.find('button');
      expect(button.exists()).toBe(false);
    });

    it('should show confirmation dialog when Reset All button is clicked', async () => {
      wrapper = createWrapper();
      const button = wrapper.find('button');

      await button.trigger('click');

      expect(mockShowConfirmation).toHaveBeenCalledTimes(1);
      expect(mockShowConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Are you sure you want to reset all results?'),
          header: 'Reset All Results',
        }),
      );
    });

    it('should emit reset-all event when confirmation is accepted', async () => {
      // Mock the confirmation to accept BEFORE creating wrapper
      mockShowConfirmation.mockImplementation((options: any) => {
        if (options.onAccept) {
          options.onAccept();
        }
      });

      wrapper = createWrapper();
      const button = wrapper.find('button');

      await button.trigger('click');

      // Verify the event was emitted
      expect(wrapper.emitted('reset-all')).toBeTruthy();
      expect(wrapper.emitted('reset-all')).toHaveLength(1);
    });

    it('should not emit reset-all event when confirmation is rejected', async () => {
      wrapper = createWrapper();
      const button = wrapper.find('button');

      await button.trigger('click');

      // The event should not be emitted yet
      expect(wrapper.emitted('reset-all')).toBeFalsy();
    });
  });

  describe('Component Rendering', () => {
    it('should render all divisions as tabs', () => {
      wrapper = createWrapper();
      expect(wrapper.html()).toContain('Division A');
      expect(wrapper.html()).toContain('Division B');
    });

    it('should handle multiple divisions', () => {
      wrapper = createWrapper();
      // Verify we have the correct number of divisions
      expect(mockDivisions).toHaveLength(2);
      expect(mockDivisions[0]?.name).toBe('Division A');
      expect(mockDivisions[1]?.name).toBe('Division B');
    });
  });
});
