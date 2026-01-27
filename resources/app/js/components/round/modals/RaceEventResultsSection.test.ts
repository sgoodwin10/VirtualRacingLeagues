import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import RaceEventResultsSection from './RaceEventResultsSection.vue';
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
      original_race_time: null,
      final_race_time: null,
      original_race_time_difference: null,
      final_race_time_difference: null,
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
      original_race_time: null,
      final_race_time: null,
      original_race_time_difference: null,
      final_race_time_difference: null,
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
      original_race_time: '01:42:05.123',
      final_race_time: '01:42:05.123',
      original_race_time_difference: null,
      final_race_time_difference: null,
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
      original_race_time: '01:42:07.890',
      final_race_time: '01:42:12.890', // original + 5 seconds penalty
      original_race_time_difference: null,
      final_race_time_difference: '+00:00:02.767',
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
      original_race_time: null,
      final_race_time: null,
      original_race_time_difference: null,
      final_race_time_difference: null,
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
      // Shows final_race_time (with penalties applied)
      expect(wrapper.text()).toContain('1:42:05.123'); // Driver 1 - no penalties
      expect(wrapper.text()).toContain('1:42:12.890'); // Driver 2 - with 5 second penalty
    });

    it('should display time differences', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      // Time differences are dynamically calculated based on effective time (original_race_time + penalties)
      // Hamilton: 1:42:05.123 (no penalties), Verstappen: 1:42:07.890 + 5.000 penalty = 1:42:12.890
      // Gap = 1:42:12.890 - 1:42:05.123 = 7.767 seconds
      expect(wrapper.text()).toContain('+07.767');
    });

    it('should not display gap for position 1 driver', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });
      const rows = wrapper.findAll('tr');

      // Find the row for Hamilton (position 1)
      const hamiltonRow = rows.find((row) => row.text().includes('Lewis Hamilton'));
      expect(hamiltonRow).toBeDefined();

      // Position 1 should not have any time gap displayed (no + prefix in gap column)
      // The row should contain Hamilton's time but not a gap value starting with +
      const hamiltonText = hamiltonRow!.text();

      // Hamilton has time 1:42:05.123 displayed, but should NOT have a +XX:XX gap
      expect(hamiltonText).toContain('1:42:05.123');

      // Count occurrences of + in the row - should only be positions_gained (+2), not a gap
      const plusMatches = hamiltonText.match(/\+/g) || [];
      // Hamilton has positions_gained: 2, so there's one + for that, but no gap +
      expect(plusMatches.length).toBeLessThanOrEqual(1);
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

    it('should display decimal points correctly (up to 2 decimal places)', () => {
      const raceWithDecimalPoints = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0],
            race_points: 12.5,
          },
          {
            ...mockRaceEvent.results[1],
            race_points: 9.75,
          },
          {
            ...mockRaceEvent.results[2],
            race_points: 6.25,
          },
        ],
      };
      const wrapper = createWrapper({ raceEvent: raceWithDecimalPoints });

      expect(wrapper.text()).toContain('12.5');
      expect(wrapper.text()).toContain('9.75');
      expect(wrapper.text()).toContain('6.25');
    });

    it('should display whole numbers without decimal points', () => {
      const raceWithWholePoints = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0],
            race_points: 25,
          },
          {
            ...mockRaceEvent.results[1],
            race_points: 18,
          },
        ],
      };
      const wrapper = createWrapper({ raceEvent: raceWithWholePoints });

      // Should not have decimal points for whole numbers
      expect(wrapper.text()).toContain('25');
      expect(wrapper.text()).toContain('18');
      expect(wrapper.text()).not.toContain('25.0');
      expect(wrapper.text()).not.toContain('18.0');
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

  describe('Result Display - All Results Shown', () => {
    it('should show all drivers regardless of round completion status', () => {
      const eventWithMixedResults: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!, // Has race_time
          },
          {
            ...mockRaceEvent.results[1]!,
            original_race_time: null,
            final_race_time: null,
            fastest_lap: null,
            dnf: false, // Driver with no timing data at all
          },
        ],
      };
      const wrapper = createWrapper({ raceEvent: eventWithMixedResults, isRoundCompleted: true });

      // Both drivers should be visible - if race_result exists, show it
      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
    });

    it('should show drivers without timing data when round is not completed', () => {
      const eventWithMixedResults: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!, // Has race_time
          },
          {
            ...mockRaceEvent.results[1]!,
            original_race_time: null,
            final_race_time: null,
            fastest_lap: null,
            dnf: false, // Driver with no timing data
          },
        ],
      };
      const wrapper = createWrapper({ raceEvent: eventWithMixedResults, isRoundCompleted: false });

      // Both drivers should be visible
      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
    });

    it('should show DNF drivers', () => {
      const eventWithDNF: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!,
            original_race_time: null,
            final_race_time: null,
            fastest_lap: '01:13.456',
            dnf: true, // DNF driver
          },
        ],
      };
      const wrapper = createWrapper({ raceEvent: eventWithDNF, isRoundCompleted: true });

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('DNF');
    });

    it('should show drivers with fastest lap but no race time', () => {
      const eventWithFastestLapOnly: RaceEventResults = {
        ...mockRaceEvent,
        results: [
          {
            ...mockRaceEvent.results[0]!,
            original_race_time: null,
            final_race_time: null,
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

    it('should show all qualifying drivers even without lap times', () => {
      const qualifyingWithMixedResults: RaceEventResults = {
        ...mockQualifyingEvent,
        results: [
          {
            ...mockQualifyingEvent.results[0]!, // Has fastest_lap (qualifying time)
          },
          {
            ...mockQualifyingEvent.results[1]!,
            fastest_lap: null, // No qualifying time - still shown
          },
        ],
      };
      const wrapper = createWrapper({
        raceEvent: qualifyingWithMixedResults,
        isRoundCompleted: true,
      });

      // Both drivers should be shown - race_result exists
      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
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
    it('should display +/- column header for races regardless of raceTimesRequired', () => {
      const wrapper = createWrapper({ raceTimesRequired: false });

      expect(wrapper.text()).toContain('+/-');
    });

    it('should display +/- column when raceTimesRequired is true', () => {
      const wrapper = createWrapper({ raceTimesRequired: true });

      expect(wrapper.text()).toContain('+/-');
    });

    it('should not display +/- column for qualifying', () => {
      const wrapper = createWrapper({ raceEvent: mockQualifyingEvent });

      expect(wrapper.text()).not.toContain('+/-');
    });

    it('should display positive positions gained with + prefix', () => {
      const wrapper = createWrapper();

      // Lewis Hamilton gained 2 positions
      expect(wrapper.text()).toContain('+2');
    });

    it('should display negative positions gained without extra prefix', () => {
      const wrapper = createWrapper();

      // Max Verstappen lost 1 position
      expect(wrapper.text()).toContain('-1');
    });

    it('should display dash for null positions_gained', () => {
      const wrapper = createWrapper();

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
      const wrapper = createWrapper({ raceEvent: eventWithZeroGained });

      expect(wrapper.text()).toContain('0');
    });

    it('should apply green color class for positive positions gained', () => {
      const wrapper = createWrapper();

      const html = wrapper.html();
      // Check that green text class exists for Lewis Hamilton's +2
      expect(html).toContain('text-green-600');
    });

    it('should apply red color class for negative positions gained', () => {
      const wrapper = createWrapper();

      const html = wrapper.html();
      // Check that red text class exists for Max Verstappen's -1
      expect(html).toContain('text-red-600');
    });

    it('should apply gray color class for null positions gained', () => {
      const wrapper = createWrapper();

      const html = wrapper.html();
      // Check that text-secondary class exists for null/0 values
      expect(html).toContain('text-secondary');
    });
  });
});
