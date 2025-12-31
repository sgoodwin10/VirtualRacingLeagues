import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResultCsvImport from '../ResultCsvImport.vue';
import type { CsvResultRow } from '@app/types/raceResult';

// Mock the useRaceTimeCalculation composable
vi.mock('@app/composables/useRaceTimeCalculation', () => ({
  useRaceTimeCalculation: () => ({
    parseTimeToMs: (value: string | null | undefined): number | null => {
      if (!value || value.trim() === '') return null;

      const TIME_PATTERN = /^[+]?(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/;
      const match = value.match(TIME_PATTERN);
      if (!match) return null;

      const hours = parseInt(match[1] ?? '0', 10);
      const minutes = parseInt(match[2] ?? '0', 10);
      const seconds = parseInt(match[3] ?? '0', 10);
      const msStr = (match[4] ?? '0').padEnd(3, '0');
      const milliseconds = parseInt(msStr, 10);

      return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
    },
    formatMsToTime: (ms: number): string => {
      const hours = Math.floor(ms / 3600000);
      let remaining = ms - hours * 3600000;

      const minutes = Math.floor(remaining / 60000);
      remaining -= minutes * 60000;

      const seconds = Math.floor(remaining / 1000);
      const milliseconds = remaining - seconds * 1000;

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    },
    normalizeTimeInput: (value: string | null | undefined): string => {
      if (!value || value.trim() === '') return '';

      const trimmed = value.trim().replace(/\s+/g, '');

      const FLEXIBLE_PATTERNS = {
        full: /^([+]?)(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/,
        minutes: /^([+]?)(\d{1,2}):(\d{2})\.(\d{1,3})$/,
        seconds: /^([+]?)(\d{1,2})\.(\d{1,3})$/,
      };

      const fullMatch = trimmed.match(FLEXIBLE_PATTERNS.full);
      if (fullMatch) {
        const prefix = fullMatch[1] ?? '';
        const hours = (fullMatch[2] ?? '0').padStart(2, '0');
        const minutes = fullMatch[3] ?? '00';
        const seconds = fullMatch[4] ?? '00';
        const ms = (fullMatch[5] ?? '0').padEnd(3, '0');
        return `${prefix}${hours}:${minutes}:${seconds}.${ms}`;
      }

      const minutesMatch = trimmed.match(FLEXIBLE_PATTERNS.minutes);
      if (minutesMatch) {
        const prefix = minutesMatch[1] ?? '';
        const minutes = (minutesMatch[2] ?? '0').padStart(2, '0');
        const seconds = minutesMatch[3] ?? '00';
        const ms = (minutesMatch[4] ?? '0').padEnd(3, '0');
        return `${prefix}00:${minutes}:${seconds}.${ms}`;
      }

      const secondsMatch = trimmed.match(FLEXIBLE_PATTERNS.seconds);
      if (secondsMatch) {
        const prefix = secondsMatch[1] ?? '';
        const seconds = (secondsMatch[2] ?? '0').padStart(2, '0');
        const ms = (secondsMatch[3] ?? '0').padEnd(3, '0');
        return `${prefix}00:00:${seconds}.${ms}`;
      }

      return trimmed;
    },
  }),
}));

// Mock PrimeVue components
vi.mock('primevue/textarea', () => ({
  default: {
    name: 'Textarea',
    props: ['modelValue', 'rows', 'placeholder', 'invalid'],
    emits: ['update:modelValue'],
    template:
      '<textarea :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'PrimeButton',
    props: [
      'label',
      'icon',
      'size',
      'severity',
      'disabled',
      'type',
      'loading',
      'text',
      'outlined',
      'class',
      'pt',
      'aria-label',
    ],
    emits: ['click'],
    template:
      '<button :disabled="disabled" @click="$emit(\'click\', $event)"><slot name="icon" /><slot />{{ label }}</button>',
  },
}));

// Mock custom Button component
vi.mock('@app/components/common/buttons', () => ({
  Button: {
    name: 'Button',
    props: [
      'label',
      'icon',
      'size',
      'variant',
      'disabled',
      'loading',
      'type',
      'iconPos',
      'ariaLabel',
      'pt',
    ],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\', $event)">{{ label }}</button>',
  },
}));

// Mock Phosphor icons
vi.mock('@phosphor-icons/vue', () => ({
  PhFileCsv: {
    name: 'PhFileCsv',
    props: ['size'],
    template: '<svg></svg>',
  },
  PhUpload: {
    name: 'PhUpload',
    props: ['size'],
    template: '<svg></svg>',
  },
  PhCheck: {
    name: 'PhCheck',
    props: ['size'],
    template: '<svg></svg>',
  },
}));

describe('ResultCsvImport', () => {
  const createWrapper = (props = {}) => {
    return mount(ResultCsvImport, {
      props: {
        isQualifying: false,
        raceTimesRequired: true,
        ...props,
      },
    });
  };

  const parseCSV = async (wrapper: ReturnType<typeof createWrapper>, csvData: string) => {
    const vm = wrapper.vm as any;
    vm.csvText = csvData;
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const parseButton = buttons.find((btn) => btn.text() === 'Parse CSV');
    await parseButton?.trigger('click');
    await wrapper.vm.$nextTick();

    return wrapper.emitted('parse')?.[0]?.[0] as CsvResultRow[] | undefined;
  };

  describe('Basic CSV Parsing', () => {
    it('parses basic CSV with all columns', async () => {
      const wrapper = createWrapper();
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,01:23:45.678,,01:32.456
Jane Doe,,,01:33.123`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(2);
      expect(rows![0]).toMatchObject({
        driver: 'John Smith',
        race_time: '01:23:45.678',
        fastest_lap_time: '01:32.456',
      });
      expect(rows![1]).toMatchObject({
        driver: 'Jane Doe',
        fastest_lap_time: '01:33.123',
      });
    });

    it('handles DNF indicators correctly', async () => {
      const wrapper = createWrapper();
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,DNF,01:32.456
Jane Doe,,retired,01:33.123
Bob Wilson,,ret,01:35.000`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(3);
      expect(rows![0]?.dnf).toBe(true);
      expect(rows![1]?.dnf).toBe(true);
      expect(rows![2]?.dnf).toBe(true);
      expect(rows![0]?.original_race_time_difference).toBe('');
      expect(rows![1]?.original_race_time_difference).toBe('');
      expect(rows![2]?.original_race_time_difference).toBe('');
    });

    it('removes leading + from time differences', async () => {
      const wrapper = createWrapper();
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,+00:00:14.567,01:32.456`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows![0]?.original_race_time_difference).toBe('00:00:14.567');
    });
  });

  describe('Lap Format Parsing', () => {
    it('calculates race time for "1 lap" format', async () => {
      const wrapper = createWrapper();
      // Fastest lap: 01:30.000 = 90000ms
      // Expected: (90000 + 500) * 1 = 90500ms = 00:01:30.500
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,1 lap,01:30.000`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(1);
      expect(rows![0]?.original_race_time_difference).toBe('00:01:30.500');
      expect(rows![0]?.fastest_lap_time).toBe('01:30.000');
    });

    it('calculates race time for "2 laps" format', async () => {
      const wrapper = createWrapper();
      // Fastest lap: 01:30.000 = 90000ms
      // Expected: (90000 + 500) * 2 = 181000ms = 00:03:01.000
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
Jane Doe,,2 laps,01:30.000`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(1);
      expect(rows![0]?.original_race_time_difference).toBe('00:03:01.000');
    });

    it('handles lap format case-insensitively', async () => {
      const wrapper = createWrapper();
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,1 LAP,01:30.000
Jane Doe,,2 LAPS,01:30.000
Bob Wilson,,3 Lap,01:30.000`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(3);
      expect(rows![0]?.original_race_time_difference).toBe('00:01:30.500');
      expect(rows![1]?.original_race_time_difference).toBe('00:03:01.000');
      // 3 laps: (90000 + 500) * 3 = 271500ms = 00:04:31.500
      expect(rows![2]?.original_race_time_difference).toBe('00:04:31.500');
    });

    it('handles lap format with varying whitespace', async () => {
      const wrapper = createWrapper();
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,1lap,01:30.000
Jane Doe,,2  laps,01:30.000`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(2);
      expect(rows![0]?.original_race_time_difference).toBe('00:01:30.500');
      expect(rows![1]?.original_race_time_difference).toBe('00:03:01.000');
    });

    it('throws error when lap format used without fastest lap time', async () => {
      const wrapper = createWrapper();
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,2 laps,`;

      const vm = wrapper.vm as any;
      vm.csvText = csvData;
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const parseButton = buttons.find((btn) => btn.text() === 'Parse CSV');
      await parseButton?.trigger('click');
      await wrapper.vm.$nextTick();

      // Should NOT emit parse event, should show error instead
      const parseEvent = wrapper.emitted('parse');
      expect(parseEvent).toBeUndefined();

      // Check that error is shown
      expect(vm.parseError).toContain('fastest lap time is required');
    });

    it('calculates correctly with complex fastest lap times', async () => {
      const wrapper = createWrapper();
      // Fastest lap: 02:15.567 = 135567ms
      // Expected for 2 laps: (135567 + 500) * 2 = 272134ms = 00:04:32.134
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,2 laps,02:15.567`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(1);
      expect(rows![0]?.original_race_time_difference).toBe('00:04:32.134');
    });
  });

  describe('Mixed Data Parsing', () => {
    it('handles mix of time differences, lap format, and DNF', async () => {
      const wrapper = createWrapper();
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
Winner,,00:00:00.000,01:30.000
Second,,00:00:05.123,01:30.500
Third,,1 lap,01:31.000
Fourth,,2 laps,01:32.000
DNF Driver,,DNF,01:35.000`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(5);

      // Winner - normal time difference
      expect(rows![0]?.original_race_time_difference).toBe('00:00:00.000');
      expect(rows![0]?.dnf).toBeUndefined();

      // Second - normal time difference
      expect(rows![1]?.original_race_time_difference).toBe('00:00:05.123');
      expect(rows![1]?.dnf).toBeUndefined();

      // Third - 1 lap (91000 + 500) * 1 = 91500ms = 00:01:31.500
      expect(rows![2]?.original_race_time_difference).toBe('00:01:31.500');
      expect(rows![2]?.dnf).toBeUndefined();

      // Fourth - 2 laps (92000 + 500) * 2 = 185000ms = 00:03:05.000
      expect(rows![3]?.original_race_time_difference).toBe('00:03:05.000');
      expect(rows![3]?.dnf).toBeUndefined();

      // DNF
      expect(rows![4]?.dnf).toBe(true);
      expect(rows![4]?.original_race_time_difference).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('disables parse button when CSV is empty', async () => {
      const wrapper = createWrapper();

      const vm = wrapper.vm as any;
      vm.csvText = '';
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const parseButton = buttons.find((btn) => btn.text() === 'Parse CSV');

      // Button should be disabled when there's no text
      expect(parseButton?.attributes('disabled')).toBeDefined();
    });

    it('shows error for CSV without driver column', async () => {
      const wrapper = createWrapper();
      const csvData = `name,time
John,01:23:45.678`;

      const vm = wrapper.vm as any;
      vm.csvText = csvData;
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const parseButton = buttons.find((btn) => btn.text() === 'Parse CSV');
      await parseButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(vm.parseError).toContain('driver');
    });

    it('shows error for invalid fastest lap time format with lap calculation', async () => {
      const wrapper = createWrapper();
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,2 laps,invalid_time`;

      const vm = wrapper.vm as any;
      vm.csvText = csvData;
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const parseButton = buttons.find((btn) => btn.text() === 'Parse CSV');
      await parseButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(vm.parseError).toContain('invalid fastest lap time format');
    });
  });

  describe('Edge Cases', () => {
    it('skips empty rows', async () => {
      const wrapper = createWrapper();
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,00:00:05.123,01:30.000

Jane Doe,,00:00:10.456,01:30.500`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(2);
    });

    it('handles zero laps correctly', async () => {
      const wrapper = createWrapper();
      // 0 laps should result in 0 time
      const csvData = `driver,race_time,original_race_time_difference,fastest_lap_time
John Smith,,0 laps,01:30.000`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(1);
      expect(rows![0]?.original_race_time_difference).toBe('00:00:00.000');
    });
  });

  describe('Race Times Required Validation', () => {
    it('requires fastest_lap_time for qualifying sessions', async () => {
      const wrapper = createWrapper({ isQualifying: true, raceTimesRequired: true });
      const csvData = `driver
John Smith
Jane Doe`;

      const vm = wrapper.vm as any;
      vm.csvText = csvData;
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const parseButton = buttons.find((btn) => btn.text() === 'Parse CSV');
      await parseButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(vm.parseError).toContain('fastest_lap_time');
      expect(vm.parseError).toContain('qualifying sessions');
    });

    it('allows qualifying sessions with only driver and fastest_lap_time', async () => {
      const wrapper = createWrapper({ isQualifying: true, raceTimesRequired: true });
      const csvData = `driver,fastest_lap_time
John Smith,01:32.456
Jane Doe,01:33.123`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(2);
      expect(rows![0]?.driver).toBe('John Smith');
      expect(rows![0]?.fastest_lap_time).toBe('01:32.456');
      expect(rows![1]?.driver).toBe('Jane Doe');
      expect(rows![1]?.fastest_lap_time).toBe('01:33.123');
    });

    it('requires time columns when race_times_required is true for races', async () => {
      const wrapper = createWrapper({ isQualifying: false, raceTimesRequired: true });
      const csvData = `driver
John Smith
Jane Doe`;

      const vm = wrapper.vm as any;
      vm.csvText = csvData;
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const parseButton = buttons.find((btn) => btn.text() === 'Parse CSV');
      await parseButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(vm.parseError).toContain('race_time');
      expect(vm.parseError).toContain('original_race_time_difference');
      expect(vm.parseError).toContain('fastest_lap_time');
    });

    it('allows races with only driver column when race_times_required is false', async () => {
      const wrapper = createWrapper({ isQualifying: false, raceTimesRequired: false });
      const csvData = `driver
John Smith
Jane Doe
Bob Wilson`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(3);
      expect(rows![0]?.driver).toBe('John Smith');
      expect(rows![1]?.driver).toBe('Jane Doe');
      expect(rows![2]?.driver).toBe('Bob Wilson');
    });

    it('allows optional time columns when race_times_required is false', async () => {
      const wrapper = createWrapper({ isQualifying: false, raceTimesRequired: false });
      const csvData = `driver,fastest_lap_time
John Smith,01:32.456
Jane Doe,01:33.123`;

      const rows = await parseCSV(wrapper, csvData);

      expect(rows).toBeDefined();
      expect(rows).toHaveLength(2);
      expect(rows![0]?.driver).toBe('John Smith');
      expect(rows![0]?.fastest_lap_time).toBe('01:32.456');
      expect(rows![1]?.driver).toBe('Jane Doe');
      expect(rows![1]?.fastest_lap_time).toBe('01:33.123');
    });
  });

  describe('Dynamic Text Display', () => {
    it('shows correct placeholder for qualifying sessions', () => {
      const wrapper = createWrapper({ isQualifying: true });
      const vm = wrapper.vm as any;

      expect(vm.placeholderText).toContain('driver,fastest_lap_time');
      expect(vm.placeholderText).not.toContain('race_time');
      expect(vm.expectedColumnsText).toBe('Required Column Headers: driver, fastest_lap_time');
    });

    it('shows correct placeholder for races with times required', () => {
      const wrapper = createWrapper({ isQualifying: false, raceTimesRequired: true });
      const vm = wrapper.vm as any;

      expect(vm.placeholderText).toContain(
        'driver,race_time,original_race_time_difference,fastest_lap_time',
      );
      expect(vm.expectedColumnsText).toBe(
        'Required Column Headers: driver, race_time, original_race_time_difference, fastest_lap_time <br /> Data can be blank if not applicable',
      );
    });

    it('shows correct placeholder for races without times required', () => {
      const wrapper = createWrapper({ isQualifying: false, raceTimesRequired: false });
      const vm = wrapper.vm as any;

      expect(vm.placeholderText).toContain('driver');
      expect(vm.placeholderText).not.toContain('race_time');
      expect(vm.expectedColumnsText).toBe(
        'Required Column Headers: driver (`fastest_lap_time` optional)',
      );
    });
  });
});
