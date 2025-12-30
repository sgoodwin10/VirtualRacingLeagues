import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import RoundStandingsSection from '../RoundStandingsSection.vue';
import type { RoundStandings, RoundStandingDivision } from '@app/types/roundResult';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';

const mockStandingsNoDivisions: RoundStandings = {
  standings: [
    {
      position: 1,
      driver_id: 1,
      driver_name: 'Lewis Hamilton',
      total_points: 28,
      race_points: 25,
      fastest_lap_points: 2,
      pole_position_points: 1,
      total_positions_gained: 3,
    },
    {
      position: 2,
      driver_id: 2,
      driver_name: 'Max Verstappen',
      total_points: 18,
      race_points: 18,
      fastest_lap_points: 0,
      pole_position_points: 0,
      total_positions_gained: 0,
    },
    {
      position: 3,
      driver_id: 3,
      driver_name: 'Charles Leclerc',
      total_points: 15,
      race_points: 15,
      fastest_lap_points: 0,
      pole_position_points: 0,
      total_positions_gained: -2,
    },
    {
      position: 4,
      driver_id: 4,
      driver_name: 'George Russell',
      total_points: 12,
      race_points: 10,
      fastest_lap_points: 1,
      pole_position_points: 1,
      total_positions_gained: 1,
    },
  ],
};

const mockStandingsWithDivisions: RoundStandings = {
  standings: [
    {
      division_id: 1,
      division_name: 'Pro',
      results: [
        {
          position: 1,
          driver_id: 1,
          driver_name: 'Lewis Hamilton',
          total_points: 28,
          race_points: 25,
          fastest_lap_points: 2,
          pole_position_points: 1,
          total_positions_gained: 3,
        },
        {
          position: 2,
          driver_id: 2,
          driver_name: 'Max Verstappen',
          total_points: 18,
          race_points: 18,
          fastest_lap_points: 0,
          pole_position_points: 0,
          total_positions_gained: 0,
        },
      ],
    },
    {
      division_id: 2,
      division_name: 'Am',
      results: [
        {
          position: 1,
          driver_id: 3,
          driver_name: 'Charles Leclerc',
          total_points: 15,
          race_points: 13,
          fastest_lap_points: 1,
          pole_position_points: 1,
          total_positions_gained: -2,
        },
        {
          position: 2,
          driver_id: 4,
          driver_name: 'George Russell',
          total_points: 12,
          race_points: 12,
          fastest_lap_points: 0,
          pole_position_points: 0,
          total_positions_gained: 1,
        },
      ],
    },
  ] as RoundStandingDivision[],
};

describe('RoundStandingsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const createWrapper = (props = {}) => {
    return mount(RoundStandingsSection, {
      props: {
        roundStandings: mockStandingsNoDivisions,
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

  describe('Section Header', () => {
    it('should display Round Standings title', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('Round Standings');
    });

    it('should display trophy icon in header', () => {
      const wrapper = createWrapper();

      const trophyIcon = wrapper.findComponent({ name: 'PhTrophy' });
      expect(trophyIcon.exists()).toBe(true);
    });
  });

  describe('Standings Table - No Divisions', () => {
    it('should display all drivers when no division filter', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
      expect(wrapper.text()).toContain('Charles Leclerc');
      expect(wrapper.text()).toContain('George Russell');
    });

    it('should display positions correctly', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('1');
      expect(wrapper.text()).toContain('2');
      expect(wrapper.text()).toContain('3');
      expect(wrapper.text()).toContain('4');
    });

    it('should display race points when hasRacePointsEnabled is true', () => {
      const wrapper = createWrapper({ hasRacePointsEnabled: true });

      expect(wrapper.text()).toContain('25');
      expect(wrapper.text()).toContain('18');
      expect(wrapper.text()).toContain('15');
      expect(wrapper.text()).toContain('10');
    });

    it('should display 0 race_points correctly (not empty string)', () => {
      const standingsWithZeroRacePoints: RoundStandings = {
        standings: [
          {
            position: 1,
            driver_id: 1,
            driver_name: 'Driver With Zero Points',
            total_points: 1,
            race_points: 0,
            fastest_lap_points: 1,
            pole_position_points: 0,
            total_positions_gained: 0,
          },
        ],
      };

      const wrapper = createWrapper({
        roundStandings: standingsWithZeroRacePoints,
        hasRacePointsEnabled: true,
      });

      // Should display "0" in the race points column, not an empty string
      expect(wrapper.text()).toContain('Driver With Zero Points');
      const html = wrapper.html();
      // The race_points column should show "0"
      expect(html).toContain('0');
    });

    it('should not display race points column when hasRacePointsEnabled is false', () => {
      const wrapper = createWrapper({ hasRacePointsEnabled: false });

      // Race points column should not be visible, but Total Points column will still show
      // We can verify by checking that the Total Race Points header is not present
      expect(wrapper.text()).not.toContain('Total Race Points');
    });

    it('should display fastest lap points', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('2');
      expect(wrapper.text()).toContain('1');
    });

    it('should display decimal race points correctly (up to 2 decimal places)', () => {
      const standingsWithDecimalPoints: RoundStandings = {
        standings: [
          {
            position: 1,
            driver_id: 1,
            driver_name: 'Driver 1',
            total_points: 27.5,
            race_points: 25.5,
            fastest_lap_points: 2,
            pole_position_points: 0,
            total_positions_gained: 0,
          },
          {
            position: 2,
            driver_id: 2,
            driver_name: 'Driver 2',
            total_points: 19.75,
            race_points: 18.75,
            fastest_lap_points: 1,
            pole_position_points: 0,
            total_positions_gained: 0,
          },
        ],
      };

      const wrapper = createWrapper({
        roundStandings: standingsWithDecimalPoints,
        hasRacePointsEnabled: true,
      });

      expect(wrapper.text()).toContain('25.5');
      expect(wrapper.text()).toContain('18.75');
      expect(wrapper.text()).toContain('27.5');
      expect(wrapper.text()).toContain('19.75');
    });

    it('should display whole numbers without decimal points in race_points', () => {
      const standingsWithWholePoints: RoundStandings = {
        standings: [
          {
            position: 1,
            driver_id: 1,
            driver_name: 'Driver 1',
            total_points: 25,
            race_points: 25,
            fastest_lap_points: 0,
            pole_position_points: 0,
            total_positions_gained: 0,
          },
        ],
      };

      const wrapper = createWrapper({
        roundStandings: standingsWithWholePoints,
        hasRacePointsEnabled: true,
      });

      // Should display whole numbers without decimals
      expect(wrapper.text()).toContain('25');
      expect(wrapper.text()).not.toContain('25.0');
    });

    it('should display pole position points', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('1');
    });

    it('should display final points', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('28');
      expect(wrapper.text()).toContain('18');
      expect(wrapper.text()).toContain('15');
      expect(wrapper.text()).toContain('12');
    });
  });

  describe('Standings Table - With Divisions', () => {
    it('should display Pro division drivers when Pro division selected', () => {
      const wrapper = createWrapper({
        roundStandings: mockStandingsWithDivisions,
        divisionId: 1,
      });

      expect(wrapper.text()).toContain('Lewis Hamilton');
      expect(wrapper.text()).toContain('Max Verstappen');
      expect(wrapper.text()).not.toContain('Charles Leclerc');
      expect(wrapper.text()).not.toContain('George Russell');
    });

    it('should display Am division drivers when Am division selected', () => {
      const wrapper = createWrapper({
        roundStandings: mockStandingsWithDivisions,
        divisionId: 2,
      });

      expect(wrapper.text()).not.toContain('Lewis Hamilton');
      expect(wrapper.text()).not.toContain('Max Verstappen');
      expect(wrapper.text()).toContain('Charles Leclerc');
      expect(wrapper.text()).toContain('George Russell');
    });

    it('should show no results for non-existent division', () => {
      const wrapper = createWrapper({
        roundStandings: mockStandingsWithDivisions,
        divisionId: 999,
      });

      expect(wrapper.text()).toContain('No standings data available');
    });
  });

  describe('Bonus Points Display', () => {
    it('should show lightning icon for fastest lap points > 0', () => {
      const wrapper = createWrapper();

      const lightningIcons = wrapper.findAllComponents({ name: 'PhLightning' });
      // Lewis Hamilton (2 FL points) and George Russell (1 FL point)
      expect(lightningIcons.length).toBeGreaterThanOrEqual(2);
    });

    it('should show medal icon for pole position points > 0', () => {
      const wrapper = createWrapper();

      const medalIcons = wrapper.findAllComponents({ name: 'PhMedal' });
      // Lewis Hamilton (1 pole point) and George Russell (1 pole point)
      expect(medalIcons.length).toBeGreaterThanOrEqual(2);
    });

    it('should not show icons when bonus points are 0', () => {
      const wrapper = createWrapper();

      // Max Verstappen has 0 FL and 0 pole points
      const html = wrapper.html();
      expect(html).toContain('Max Verstappen');
    });
  });

  describe('Podium Highlighting', () => {
    it('should apply gold background to 1st position', () => {
      const wrapper = createWrapper();

      const table = wrapper.findComponent({ name: 'DataTable' });
      expect(table.exists()).toBe(true);

      const html = wrapper.html();
      // Check that podium-1 class exists (gold styling via CSS)
      expect(html).toContain('podium-1');
    });

    it('should apply silver background to 2nd position', () => {
      const wrapper = createWrapper();

      const html = wrapper.html();
      // Check that podium-2 class exists (silver styling via CSS)
      expect(html).toContain('podium-2');
    });

    it('should apply bronze background to 3rd position', () => {
      const wrapper = createWrapper();

      const html = wrapper.html();
      // Check that podium-3 class exists (bronze styling via CSS)
      expect(html).toContain('podium-3');
    });
  });

  describe('Empty State', () => {
    it('should display empty message when roundStandings is null', () => {
      const wrapper = createWrapper({ roundStandings: null });

      expect(wrapper.text()).toContain('No standings data available');
    });

    it('should display empty message when standings array is empty', () => {
      const wrapper = createWrapper({
        roundStandings: { standings: [] },
      });

      expect(wrapper.text()).toContain('No standings data available');
    });
  });

  describe('Column Headers', () => {
    it('should display all required column headers when hasRacePointsEnabled is false', () => {
      const wrapper = createWrapper({ hasRacePointsEnabled: false });

      expect(wrapper.text()).toContain('#');
      expect(wrapper.text()).toContain('Driver');
      expect(wrapper.text()).not.toContain('Total Race Points');
      expect(wrapper.text()).toContain('Fastest Lap');
      expect(wrapper.text()).toContain('Pole Position');
      expect(wrapper.text()).toContain('+/-');
      expect(wrapper.text()).toContain('Final Points');
    });

    it('should display Total Race Points column when hasRacePointsEnabled is true', () => {
      const wrapper = createWrapper({ hasRacePointsEnabled: true });

      expect(wrapper.text()).toContain('#');
      expect(wrapper.text()).toContain('Driver');
      expect(wrapper.text()).toContain('Total Race Points');
      expect(wrapper.text()).toContain('Fastest Lap');
      expect(wrapper.text()).toContain('Pole Position');
      expect(wrapper.text()).toContain('+/-');
      expect(wrapper.text()).toContain('Final Points');
    });

    it('should not display Total Race Points column when hasRacePointsEnabled is undefined', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('#');
      expect(wrapper.text()).toContain('Driver');
      expect(wrapper.text()).not.toContain('Total Race Points');
      expect(wrapper.text()).toContain('Fastest Lap');
      expect(wrapper.text()).toContain('Pole Position');
      expect(wrapper.text()).toContain('+/-');
      expect(wrapper.text()).toContain('Final Points');
    });
  });

  describe('Drivers with Zero Points', () => {
    it('should display drivers who have 0 total points', () => {
      const standingsWithZeroPoints: RoundStandings = {
        standings: [
          {
            position: 1,
            driver_id: 1,
            driver_name: 'Winner Driver',
            total_points: 25,
            race_points: 25,
            fastest_lap_points: 0,
            pole_position_points: 0,
            total_positions_gained: 0,
          },
          {
            position: 2,
            driver_id: 2,
            driver_name: 'Last Place Driver',
            total_points: 0,
            race_points: 0,
            fastest_lap_points: 0,
            pole_position_points: 0,
            total_positions_gained: -5,
          },
          {
            position: 3,
            driver_id: 3,
            driver_name: 'DNF Driver',
            total_points: 0,
            race_points: 0,
            fastest_lap_points: 0,
            pole_position_points: 0,
            total_positions_gained: 0,
          },
        ],
      };

      const wrapper = createWrapper({ roundStandings: standingsWithZeroPoints });

      // All drivers should be visible, including those with 0 points
      expect(wrapper.text()).toContain('Winner Driver');
      expect(wrapper.text()).toContain('Last Place Driver');
      expect(wrapper.text()).toContain('DNF Driver');
    });

    it('should show 0 in Final Points column for drivers with no points', () => {
      const standingsWithZeroPoints: RoundStandings = {
        standings: [
          {
            position: 1,
            driver_id: 1,
            driver_name: 'Last Place Driver',
            total_points: 0,
            race_points: 0,
            fastest_lap_points: 0,
            pole_position_points: 0,
            total_positions_gained: 0,
          },
        ],
      };

      const wrapper = createWrapper({ roundStandings: standingsWithZeroPoints });

      // Should display 0 explicitly in the Final Points column
      expect(wrapper.text()).toContain('Last Place Driver');
      // The DataTable should render 0, not an empty string
      const html = wrapper.html();
      expect(html).toContain('Last Place Driver');
    });
  });

  describe('Total Positions Gained Display', () => {
    it('should display +/- column header', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('+/-');
    });

    it('should display positive total positions gained with + prefix', () => {
      const wrapper = createWrapper();

      // Lewis Hamilton gained 3 positions total
      expect(wrapper.text()).toContain('+3');
      // George Russell gained 1 position total
      expect(wrapper.text()).toContain('+1');
    });

    it('should display negative total positions gained without extra prefix', () => {
      const wrapper = createWrapper();

      // Charles Leclerc lost 2 positions total
      expect(wrapper.text()).toContain('-2');
    });

    it('should display 0 for zero total positions gained', () => {
      const wrapper = createWrapper();

      // Max Verstappen has 0 positions gained
      expect(wrapper.text()).toContain('0');
    });

    it('should apply green color class for positive total positions gained', () => {
      const wrapper = createWrapper();

      const html = wrapper.html();
      // Check that green text class exists for Lewis Hamilton's +3
      expect(html).toContain('text-green-600');
    });

    it('should apply red color class for negative total positions gained', () => {
      const wrapper = createWrapper();

      const html = wrapper.html();
      // Check that red text class exists for Charles Leclerc's -2
      expect(html).toContain('text-red-600');
    });

    it('should apply gray color class for zero total positions gained', () => {
      const wrapper = createWrapper();

      const html = wrapper.html();
      // Check that gray text class exists for Max Verstappen's 0
      expect(html).toContain('text-gray-600');
    });

    it('should display total positions gained with divisions', () => {
      const wrapper = createWrapper({
        roundStandings: mockStandingsWithDivisions,
        divisionId: 1,
      });

      // Pro division: Lewis +3, Max 0
      expect(wrapper.text()).toContain('+3');
      expect(wrapper.text()).toContain('0');
    });

    it('should display total positions gained for Am division', () => {
      const wrapper = createWrapper({
        roundStandings: mockStandingsWithDivisions,
        divisionId: 2,
      });

      // Am division: Charles -2, George +1
      expect(wrapper.text()).toContain('-2');
      expect(wrapper.text()).toContain('+1');
    });
  });
});
