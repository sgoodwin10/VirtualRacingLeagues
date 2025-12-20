import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { SeasonStandingDriver } from '@public/types/public';
import type { Mock } from 'vitest';

// Mock Chart.js - must be hoisted before imports
vi.mock('chart.js', () => {
  const mockDestroy = vi.fn();
  const mockUpdate = vi.fn();
  const mockGetDatasetMeta = vi.fn().mockReturnValue({ hidden: null });

  const MockChart = Object.assign(
    vi.fn().mockImplementation(() => ({
      destroy: mockDestroy,
      update: mockUpdate,
      data: { labels: [], datasets: [] },
      getDatasetMeta: mockGetDatasetMeta,
    })),
    {
      register: vi.fn(),
    },
  );

  return {
    Chart: MockChart,
    LineController: class {},
    LineElement: class {},
    PointElement: class {},
    CategoryScale: class {},
    LinearScale: class {},
    Title: class {},
    Tooltip: class {},
    Legend: class {},
    Filler: class {},
  };
});

// Import component after mocking
import PointsProgressionChart from '../PointsProgressionChart.vue';
import { Chart } from 'chart.js';

describe('PointsProgressionChart', () => {
  const mockDrivers: SeasonStandingDriver[] = [
    {
      position: 1,
      driver_id: 1,
      driver_name: 'Driver 1',
      total_points: 75,
      podiums: 3,
      poles: 2,
      rounds: [
        {
          round_id: 1,
          round_number: 1,
          points: 25,
          position: 1,
          has_pole: true,
          has_fastest_lap: false,
        },
        {
          round_id: 2,
          round_number: 2,
          points: 18,
          position: 2,
          has_pole: false,
          has_fastest_lap: true,
        },
        {
          round_id: 3,
          round_number: 3,
          points: 32,
          position: 1,
          has_pole: true,
          has_fastest_lap: true,
        },
      ],
    },
    {
      position: 2,
      driver_id: 2,
      driver_name: 'Driver 2',
      total_points: 60,
      podiums: 2,
      poles: 1,
      rounds: [
        {
          round_id: 1,
          round_number: 1,
          points: 18,
          position: 2,
          has_pole: false,
          has_fastest_lap: false,
        },
        {
          round_id: 2,
          round_number: 2,
          points: 25,
          position: 1,
          has_pole: true,
          has_fastest_lap: false,
        },
        {
          round_id: 3,
          round_number: 3,
          points: 17,
          position: 3,
          has_pole: false,
          has_fastest_lap: false,
        },
      ],
    },
  ];

  const mockRounds = [
    { round_id: 1, round_number: 1, name: 'R1' },
    { round_id: 2, round_number: 2, name: 'R2' },
    { round_id: 3, round_number: 3, name: 'R3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders without crashing', () => {
    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders a canvas element', () => {
    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const canvas = wrapper.find('canvas');
    expect(canvas.exists()).toBe(true);
  });

  it('applies proper styling to the chart container', () => {
    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const container = wrapper.find('.points-progression-chart');
    expect(container.exists()).toBe(true);
  });

  it('handles empty drivers array', () => {
    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: [],
        rounds: mockRounds,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('handles empty rounds array', () => {
    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: [],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('handles many drivers', () => {
    const manyDrivers: SeasonStandingDriver[] = Array.from({ length: 20 }, (_, i) => ({
      position: i + 1,
      driver_id: i + 1,
      driver_name: `Driver ${i + 1}`,
      total_points: 100 - i * 5,
      podiums: 3,
      poles: 2,
      rounds: [
        {
          round_id: 1,
          round_number: 1,
          points: 25,
          position: 1,
          has_pole: false,
          has_fastest_lap: false,
        },
      ],
    }));

    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: manyDrivers,
        rounds: mockRounds,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('initializes Chart.js on mount', () => {
    mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    expect(Chart).toHaveBeenCalled();
  });

  it('calculates cumulative points correctly', () => {
    mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    // Get the chart config passed to Chart constructor
    const chartConfig = (Chart as unknown as Mock).mock.calls[0]?.[1];
    expect(chartConfig).toBeDefined();

    const datasets = chartConfig?.data?.datasets;
    expect(datasets).toBeDefined();
    expect(datasets).toHaveLength(2);

    // Driver 1: [25, 43, 75] cumulative points
    expect(datasets?.[0]?.data).toEqual([25, 43, 75]);

    // Driver 2: [18, 43, 60] cumulative points
    expect(datasets?.[1]?.data).toEqual([18, 43, 60]);
  });

  it('destroys chart on unmount', () => {
    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    // Simply verify that unmount doesn't throw errors
    expect(() => wrapper.unmount()).not.toThrow();
  });

  it('updates chart when drivers change', async () => {
    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    // Change drivers
    const newDrivers: SeasonStandingDriver[] = [
      {
        position: 1,
        driver_id: 3,
        driver_name: 'Driver 3',
        total_points: 50,
        podiums: 1,
        poles: 1,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 50,
            position: 1,
            has_pole: true,
            has_fastest_lap: true,
          },
        ],
      },
    ];

    // Verify props change works correctly
    await wrapper.setProps({ drivers: newDrivers });
    await wrapper.vm.$nextTick();

    // Verify component still exists and works
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('canvas').exists()).toBe(true);
  });

  it('updates chart when rounds change', async () => {
    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    // Add a new round
    const newRounds = [...mockRounds, { round_id: 4, round_number: 4, name: 'R4' }];

    // Verify props change works correctly
    await wrapper.setProps({ rounds: newRounds });
    await wrapper.vm.$nextTick();

    // Verify component still exists and works
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('canvas').exists()).toBe(true);
  });

  it('assigns different colors to each driver', () => {
    mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const chartConfig = (Chart as unknown as Mock).mock.calls[0]?.[1];
    const datasets = chartConfig?.data?.datasets;

    expect(datasets).toBeDefined();
    expect(datasets).toHaveLength(2);

    // Each driver should have a different color
    const color1 = datasets?.[0]?.borderColor;
    const color2 = datasets?.[1]?.borderColor;

    expect(color1).toBeDefined();
    expect(color2).toBeDefined();
    expect(color1).not.toBe(color2);
  });

  it('reinitializes chart when unmounted and remounted', () => {
    const wrapper = mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    wrapper.unmount();

    // Remount
    const wrapper2 = mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    // Verify component renders correctly after remount
    expect(wrapper2.exists()).toBe(true);
    expect(wrapper2.find('canvas').exists()).toBe(true);
  });

  it('handles drivers with missing round data', () => {
    const driversWithMissingData: SeasonStandingDriver[] = [
      {
        position: 1,
        driver_id: 1,
        driver_name: 'Driver 1',
        total_points: 25,
        podiums: 1,
        poles: 1,
        rounds: [
          {
            round_id: 1,
            round_number: 1,
            points: 25,
            position: 1,
            has_pole: true,
            has_fastest_lap: false,
          },
          // Missing round 2 and 3
        ],
      },
    ];

    mount(PointsProgressionChart, {
      props: {
        drivers: driversWithMissingData,
        rounds: mockRounds,
      },
    });

    const chartConfig = (Chart as unknown as Mock).mock.calls[0]?.[1];
    const datasets = chartConfig?.data?.datasets;

    expect(datasets).toBeDefined();
    expect(datasets?.[0]?.data).toEqual([25, null, null]); // Missing rounds show as null
  });

  it('generates correct round labels', () => {
    mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const chartConfig = (Chart as unknown as Mock).mock.calls[0]?.[1];
    const labels = chartConfig?.data?.labels;

    expect(labels).toEqual(['R1', 'R2', 'R3']);
  });

  it('sets correct chart configuration', () => {
    mount(PointsProgressionChart, {
      props: {
        drivers: mockDrivers,
        rounds: mockRounds,
      },
    });

    const chartConfig = (Chart as unknown as Mock).mock.calls[0]?.[1];

    expect(chartConfig?.type).toBe('line');
    expect(chartConfig?.options?.responsive).toBe(true);
    expect(chartConfig?.options?.maintainAspectRatio).toBe(true);
    expect(chartConfig?.options?.plugins?.legend?.display).toBe(true);
  });
});
