import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import RaceEventResultsSection from '../RaceEventResultsSection.vue';
import type { RaceEventResults } from '@app/types/roundResult';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';

const mockQualifyingEvent: RaceEventResults = {
  id: 10,
  race_number: 0,
  name: 'Qualifying',
  is_qualifier: true,
  race_points: false,
  status: 'completed',
  results: [
    {
      id: 100,
      race_id: 10,
      driver_id: 1,
      division_id: 1,
      position: 1,
      race_time: null,
      race_time_difference: null,
      fastest_lap: '01:12.345',
      penalties: null,
      has_fastest_lap: false,
      has_pole: true,
      dnf: false,
      status: 'confirmed',
      race_points: 3,
      positions_gained: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      driver: { id: 1, name: 'Lewis Hamilton' },
    },
    {
      id: 101,
      race_id: 10,
      driver_id: 2,
      division_id: 2,
      position: 2,
      race_time: null,
      race_time_difference: null,
      fastest_lap: '01:12.567',
      penalties: null,
      has_fastest_lap: false,
      has_pole: false,
      dnf: false,
      status: 'confirmed',
      race_points: 2,
      positions_gained: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      driver: { id: 2, name: 'Max Verstappen' },
    },
  ],
};

const mockRaceEvent: RaceEventResults = {
  id: 11,
  race_number: 1,
  name: 'Feature Race',
  is_qualifier: false,
  race_points: true,
  status: 'completed',
  results: [
    {
      id: 102,
      race_id: 11,
      driver_id: 1,
      division_id: 1,
      position: 1,
      race_time: '01:42:05.123',
      race_time_difference: null,
      fastest_lap: '01:13.456',
      penalties: null,
      has_fastest_lap: true,
      has_pole: false,
      dnf: false,
      status: 'confirmed',
      race_points: 25,
      positions_gained: 2, // Started 3rd, finished 1st
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      driver: { id: 1, name: 'Lewis Hamilton' },
    },
    {
      id: 103,
      race_id: 11,
      driver_id: 2,
      division_id: 1,
      position: 2,
      race_time: '01:42:07.890',
      race_time_difference: '+00:00:02.767',
      fastest_lap: '01:13.789',
      penalties: '00:00:05.000',
      has_fastest_lap: false,
      has_pole: false,
      dnf: false,
      status: 'confirmed',
      race_points: 18,
      positions_gained: -1, // Started 1st, finished 2nd
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      driver: { id: 2, name: 'Max Verstappen' },
    },
    {
      id: 104,
      race_id: 11,
      driver_id: 3,
      division_id: 2,
      position: 3,
      race_time: null,
      race_time_difference: null,
      fastest_lap: '01:14.123',
      penalties: null,
      has_fastest_lap: false,
      has_pole: false,
      dnf: true,
      status: 'confirmed',
      race_points: 0,
      positions_gained: null, // No grid source
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      driver: { id: 3, name: 'Charles Leclerc' },
    },
  ],
};

describe('RaceEventResultsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const createWrapper = (props = {}) => {
    return mount(RaceEventResultsSection, {
      props: {
        raceEvent: mockRaceEvent,
        ...props,
      },
      global: {
        plugins: [
          [
            PrimeVue,
            {
              theme: {
                preset: Aura,
                options: {
                  prefix: 'p',
                  darkModeSelector: false,
                  cssLayer: false,
                },
              },
            },
          ],
          ToastService,
        ],
      },
    });
  };

  describe('Race Event Title', () => {
    it('should display qualifying title for qualifiers', () => {
      const wrapper = createWrapper({ raceEvent: mockQualifyingEvent });

      expect(wrapper.text()).toContain('Qualifying');
    });

    it('should display race name when provided', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('Feature Race');
    });

    it('should display default race title when no name provided', () => {
      const raceWithoutName = { ...mockRaceEvent, name: null };
      const wrapper = createWrapper({ raceEvent: raceWithoutName });

      expect(wrapper.text()).toContain('Race 1');
    });

    it('should display default qualifying title when no name provided', () => {
      const qualifyingWithoutName = { ...mockQualifyingEvent, name: null };
      const wrapper = createWrapper({ raceEvent: qualifyingWithoutName });

      expect(wrapper.text()).toContain('Qualifying');
    });
  });

  describe('Results Table - Qualifying', () => {
    it('should display qualifying-specific columns', () => {
      const wrapper = createWrapper({ raceEvent: mockQualifyingEvent, raceTimesRequired: true });

      expect(wrapper.text()).toContain('Lap Time');
      // Should not have race-specific columns
      expect(wrapper.text()).not.toContain('Race Time');
      expect(wrapper.text()).not.toContain('Gap');
      expect(wrapper.text()).not.toContain('Penalties');
      // Status column should not be visible for qualifying
      const html = wrapper.html();
      expect(html).not.toContain('DNF');
    });

    it('should display pole position tag', () => {
      const wrapper = createWrapper({ raceEvent: mockQualifyingEvent });

      // Find all tags
      const tags = wrapper.findAllComponents({ name: 'Tag' });
      const poleTags = tags.filter((tag) => tag.props('value') === 'P');

      expect(poleTags).toHaveLength(1);
    });

    it('should display lap times', () => {
      const wrapper = createWrapper({ raceEvent: mockQualifyingEvent, raceTimesRequired: true });

      expect(wrapper.text()).toContain('01:12.345');
      expect(wrapper.text()).toContain('01:12.567');
    });
  });

  describe('Results Table - Race', () => {
    it('should display race-specific columns', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      expect(wrapper.text()).toContain('Time');
      expect(wrapper.text()).toContain('Gap');
      expect(wrapper.text()).toContain('Fastest Lap');
      expect(wrapper.text()).toContain('Penalties');
    });

    it('should display race times', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      // Times are formatted by useTimeFormat which removes leading zeros
      expect(wrapper.text()).toContain('1:42:05.123');
      expect(wrapper.text()).toContain('1:42:07.890');
    });

    it('should display time differences', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      // Time differences are formatted by useTimeFormat which removes leading zeros
      expect(wrapper.text()).toContain('+02.767');
    });

    it('should display fastest lap tag', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      const tags = wrapper.findAllComponents({ name: 'Tag' });
      const fastestLapTags = tags.filter((tag) => tag.props('value') === 'FL');

      expect(fastestLapTags).toHaveLength(1);
    });

    it('should display penalties', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      // Penalties are formatted by useTimeFormat which removes leading zeros
      expect(wrapper.text()).toContain('05.000');
    });

    it('should display DNF status', () => {
      const wrapper = createWrapper();

      const tags = wrapper.findAllComponents({ name: 'Tag' });
      const dnfTags = tags.filter((tag) => tag.props('value') === 'DNF');

      expect(dnfTags).toHaveLength(1);
    });
  });

  describe('Position Display', () => {
    it('should display positions for all results', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('1');
      expect(wrapper.text()).toContain('2');
      expect(wrapper.text()).toContain('3');
    });

    it('should start position counter at 1 for each race', () => {
      const wrapper = createWrapper();

      // Position numbers should start at 1 regardless of backend position values
      const html = wrapper.html();
      expect(html).toContain('1');
      expect(wrapper.text()).toContain('1');
    });

    it('should renumber positions when filtering by division', () => {
      const wrapper = createWrapper({ divisionId: 1 });

      // When filtering by division 1, only Lewis Hamilton and Max Verstappen should appear
      // with positions 1 and 2 (Charles Leclerc from division 2 should be filtered out)
      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
      expect(wrapper.text()).not.toContain('Charles Leclerc');

      // Check that we only have 2 rows in the table
      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('value')).toHaveLength(2);
    });
  });

  describe('Driver Names Display', () => {
    it('should display all driver names', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
      expect(wrapper.text()).toContain('Charles Leclerc');
    });
  });

  describe('Points Display', () => {
    it('should display points for all results when race_points is true', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('Points');
      expect(wrapper.text()).toContain('25');
      expect(wrapper.text()).toContain('18');
      expect(wrapper.text()).toContain('0');
    });

    it('should not display points column when race_points is false', () => {
      const raceWithoutPoints = { ...mockRaceEvent, race_points: false };
      const wrapper = createWrapper({ raceEvent: raceWithoutPoints });

      expect(wrapper.text()).not.toContain('Points');
    });

    it('should display points column for qualifying when race_points is true', () => {
      const qualifyingWithPoints = { ...mockQualifyingEvent, race_points: true };
      const wrapper = createWrapper({ raceEvent: qualifyingWithPoints });

      expect(wrapper.text()).toContain('Points');
    });

    it('should not display points column for qualifying when race_points is false', () => {
      const wrapper = createWrapper({ raceEvent: mockQualifyingEvent });

      expect(wrapper.text()).not.toContain('Points');
    });
  });

  describe('Division Filtering', () => {
    it('should show all results when no division filter', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
      expect(wrapper.text()).toContain('Charles Leclerc');
    });

    it('should filter results by division when divisionId provided', () => {
      const wrapper = createWrapper({ divisionId: 1 });

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
      expect(wrapper.text()).not.toContain('Charles Leclerc');
    });

    it('should show only division 2 results', () => {
      const wrapper = createWrapper({ divisionId: 2 });

      expect(wrapper.text()).not.toContain('Lewis Hamilton');
      expect(wrapper.text()).not.toContain('Max Verstappen');
      expect(wrapper.text()).toContain('Charles Leclerc');
    });

    it('should show no results for non-existent division', () => {
      const wrapper = createWrapper({ divisionId: 999 });

      expect(wrapper.text()).not.toContain('Lewis Hamilton');
      expect(wrapper.text()).not.toContain('Max Verstappen');
      expect(wrapper.text()).not.toContain('Charles Leclerc');
    });
  });

  describe('Empty State', () => {
    it('should display empty message when no results for race', () => {
      const emptyRaceEvent: RaceEventResults = {
        ...mockRaceEvent,
        results: [],
      };
      const wrapper = createWrapper({ raceEvent: emptyRaceEvent });

      expect(wrapper.text()).toContain('No results recorded for this race');
    });

    it('should display empty message when no results for qualifying', () => {
      const emptyQualifyingEvent: RaceEventResults = {
        ...mockQualifyingEvent,
        results: [],
      };
      const wrapper = createWrapper({ raceEvent: emptyQualifyingEvent });

      expect(wrapper.text()).toContain('No results recorded for this qualifying session');
    });
  });

  describe('Null Value Handling', () => {
    it('should display dash for null race times', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      // Charles Leclerc has null race_time (DNF)
      const html = wrapper.html();
      expect(html).toContain('-');
    });

    it('should display dash for null penalties', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      const html = wrapper.html();
      expect(html).toContain('-');
    });

    it('should display dash for null fastest laps', () => {
      const eventWithNullFastestLap: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!,
            fastest_lap: null,
          },
        ],
      };
      const wrapper = createWrapper({
        raceEvent: eventWithNullFastestLap,
        raceTimesRequired: true,
      });

      const html = wrapper.html();
      expect(html).toContain('-');
    });
  });

  describe('Result Filtering Based on Round Completion', () => {
    it('should show all drivers when round is not completed', () => {
      const eventWithMixedResults: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!, // Has race_time
          },
          {
            ...mockRaceEvent.results[1]!,
            race_time: null,
            fastest_lap: null,
            dnf: false, // Driver with no results at all
          },
        ],
      };
      const wrapper = createWrapper({ raceEvent: eventWithMixedResults, isRoundCompleted: false });

      // Both drivers should be visible
      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
    });

    it('should filter out drivers without results when round is completed', () => {
      const eventWithMixedResults: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!, // Has race_time
          },
          {
            ...mockRaceEvent.results[1]!,
            race_time: null,
            fastest_lap: null,
            dnf: false, // Driver with no results at all
          },
        ],
      };
      const wrapper = createWrapper({ raceEvent: eventWithMixedResults, isRoundCompleted: true });

      // Only driver with results should be visible
      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).not.toContain('Max Verstappen');
    });

    it('should show DNF drivers when round is completed', () => {
      const eventWithDNF: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!,
            race_time: null,
            fastest_lap: '01:13.456',
            dnf: true, // DNF driver
          },
        ],
      };
      const wrapper = createWrapper({ raceEvent: eventWithDNF, isRoundCompleted: true });

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('DNF');
    });

    it('should show drivers with fastest lap but no race time when round is completed', () => {
      const eventWithFastestLapOnly: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!,
            race_time: null,
            fastest_lap: '01:13.456',
            dnf: false,
          },
        ],
      };
      const wrapper = createWrapper({
        raceEvent: eventWithFastestLapOnly,
        isRoundCompleted: true,
      });

      expect(wrapper.text()).toContain('Lewis Hamilton');
    });

    it('should filter qualifying results based on lap time when round is completed', () => {
      const qualifyingWithMixedResults: RaceEventResults = {
        ...mockQualifyingEvent,
        results: [
          {
            ...mockQualifyingEvent.results[0]!, // Has fastest_lap (qualifying time)
          },
          {
            ...mockQualifyingEvent.results[1]!,
            fastest_lap: null, // No qualifying time
          },
        ],
      };
      const wrapper = createWrapper({
        raceEvent: qualifyingWithMixedResults,
        isRoundCompleted: true,
      });

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).not.toContain('Max Verstappen');
    });

    it('should show all qualifying drivers when round is not completed', () => {
      const qualifyingWithMixedResults: RaceEventResults = {
        ...mockQualifyingEvent,
        results: [
          {
            ...mockQualifyingEvent.results[0]!, // Has fastest_lap (qualifying time)
          },
          {
            ...mockQualifyingEvent.results[1]!,
            fastest_lap: null, // No qualifying time
          },
        ],
      };
      const wrapper = createWrapper({
        raceEvent: qualifyingWithMixedResults,
        isRoundCompleted: false,
      });

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
    });
  });

  describe('Positions Gained Display', () => {
    it('should display +/- column header for races', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      expect(wrapper.text()).toContain('+/-');
    });

    it('should not display +/- column for qualifying', () => {
      const wrapper = createWrapper({ raceEvent: mockQualifyingEvent });

      expect(wrapper.text()).not.toContain('+/-');
    });

    it('should display positive positions gained with + prefix', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      // Lewis Hamilton gained 2 positions
      expect(wrapper.text()).toContain('+2');
    });

    it('should display negative positions gained without extra prefix', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      // Max Verstappen lost 1 position
      expect(wrapper.text()).toContain('-1');
    });

    it('should display dash for null positions_gained', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      // Charles Leclerc has null positions_gained
      const html = wrapper.html();
      expect(html).toContain('-');
    });

    it('should display 0 for zero positions gained', () => {
      const eventWithZeroGained: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!,
            positions_gained: 0,
          },
        ],
      };
      const wrapper = createWrapper({ raceEvent: eventWithZeroGained, raceTimesRequired: true });

      expect(wrapper.text()).toContain('0');
    });

    it('should apply green color class for positive positions gained', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      const html = wrapper.html();
      // Check that green text class exists for Lewis Hamilton's +2
      expect(html).toContain('text-green-600');
    });

    it('should apply red color class for negative positions gained', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      const html = wrapper.html();
      // Check that red text class exists for Max Verstappen's -1
      expect(html).toContain('text-red-600');
    });

    it('should apply gray color class for null positions gained', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      const html = wrapper.html();
      // Check that gray text class exists for Charles Leclerc's null
      expect(html).toContain('text-gray-600');
    });
  });
});
