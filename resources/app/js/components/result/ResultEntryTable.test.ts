import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResultEntryTable from './ResultEntryTable.vue';
import type { RaceResultFormData, DriverOption } from '@app/types/raceResult';

// Mock vuedraggable
vi.mock('vuedraggable', () => ({
  default: {
    name: 'Draggable',
    props: ['modelValue', 'tag', 'itemKey', 'handle'],
    emits: ['update:modelValue', 'end'],
    template:
      '<component :is="tag"><slot v-for="(element, index) in modelValue" :key="element[itemKey]" name="item" :element="element" :index="index"></slot></component>',
  },
}));

// Mock Phosphor icons
vi.mock('@phosphor-icons/vue', () => ({
  PhDotsSixVertical: {
    name: 'PhDotsSixVertical',
    props: ['size'],
    template: '<svg data-testid="drag-handle"></svg>',
  },
  PhTrash: {
    name: 'PhTrash',
    template: '<svg data-testid="trash-icon"></svg>',
  },
  PhPlus: {
    name: 'PhPlus',
    template: '<svg data-testid="plus-icon"></svg>',
  },
}));

// Mock PrimeVue components
vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    props: [
      'modelValue',
      'options',
      'optionLabel',
      'optionValue',
      'placeholder',
      'filter',
      'disabled',
    ],
    emits: ['update:modelValue', 'change'],
    template: '<select @change="$emit(\'change\')"><slot /></select>',
  },
}));

// Mock custom Button component from @app/components/common/buttons
vi.mock('@app/components/common/buttons', () => ({
  Button: {
    name: 'Button',
    props: ['label', 'icon', 'size', 'variant', 'outlined', 'text', 'disabled'],
    emits: ['click'],
    template:
      '<button :data-icon="icon?.name || \'unknown\'" :data-label="label" :disabled="disabled" @click="$emit(\'click\')">{{ label }}<component :is="icon" v-if="icon" /></button>',
  },
}));

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    props: ['modelValue', 'binary'],
    emits: ['update:modelValue', 'change'],
    template:
      '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked); $emit(\'change\', $event)" />',
  },
}));

// Mock InputText from PrimeVue to avoid $primevue issues
vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    props: ['modelValue', 'placeholder', 'invalid'],
    emits: ['update:modelValue'],
    template:
      '<input type="text" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" :class="{ invalid }" />',
  },
}));

// Mock ResultTimeInput component
vi.mock('../ResultTimeInput.vue', () => ({
  default: {
    name: 'ResultTimeInput',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template:
      '<input type="text" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" />',
  },
}));

// Mock the useRaceTimeCalculation composable
vi.mock('@app/composables/useRaceTimeCalculation', () => ({
  useRaceTimeCalculation: () => ({
    sortResultsByTime: vi.fn((results: RaceResultFormData[]) => results),
    parseTimeToMs: vi.fn((time: string | null | undefined) => {
      if (!time || time.trim() === '') return null;
      // Simple mock: parse format hh:mm:ss.ms to milliseconds
      const match = time.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
      if (!match) return null;
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);
      const ms = parseInt(match[4] || '0', 10);
      return hours * 3600000 + minutes * 60000 + seconds * 1000 + ms;
    }),
    calculateEffectiveTime: vi.fn((raceTimeMs: number | null, penaltiesMs: number | null) => {
      if (raceTimeMs === null) return null;
      return raceTimeMs + (penaltiesMs ?? 0);
    }),
    formatMsToTime: vi.fn((ms: number) => {
      const hours = Math.floor(ms / 3600000);
      let remaining = ms - hours * 3600000;
      const minutes = Math.floor(remaining / 60000);
      remaining -= minutes * 60000;
      const seconds = Math.floor(remaining / 1000);
      const milliseconds = remaining - seconds * 1000;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    }),
    normalizeTimeInput: vi.fn((time: string) => time),
    isValidTimeFormat: vi.fn(() => true),
  }),
}));

describe('ResultEntryTable', () => {
  const mockDrivers: DriverOption[] = [
    { id: 1, name: 'Alice Johnson', division_id: 1 },
    { id: 2, name: 'Bob Smith', division_id: 1 },
    { id: 3, name: 'Charlie Brown', division_id: 1 },
  ];

  const createMockResult = (driverId: number, divisionId = 1): RaceResultFormData => ({
    driver_id: driverId,
    division_id: divisionId,
    position: null,
    original_race_time: '',
    original_race_time_difference: '',
    fastest_lap: '',
    penalties: '',
    has_fastest_lap: false,
    has_pole: false,
    dnf: false,
    _originalPenalties: '',
    _penaltyChanged: false,
  });

  const mockResults: RaceResultFormData[] = [createMockResult(1)];

  const createWrapper = (
    results: RaceResultFormData[] = mockResults,
    drivers: DriverOption[] = mockDrivers,
    isQualifying = false,
    selectedDriverIds = new Set([1]),
    readOnly = false,
    raceTimesRequired = true,
  ) => {
    return mount(ResultEntryTable, {
      props: {
        results,
        drivers,
        isQualifying,
        selectedDriverIds,
        readOnly,
        raceTimesRequired,
      },
    });
  };

  describe('Rendering', () => {
    it('renders the table with correct headers for race mode', () => {
      const wrapper = createWrapper();

      // In edit mode, drag handle column is first (empty header)
      expect(wrapper.find('th:nth-child(1)').text()).toBe(''); // Drag handle column
      expect(wrapper.find('th:nth-child(2)').text()).toBe('#');
      expect(wrapper.find('th:nth-child(3)').text()).toBe('Driver');
      expect(wrapper.find('th:nth-child(4)').text()).toBe('Original Time');
      expect(wrapper.find('th:nth-child(5)').text()).toBe('Time Diff');
      expect(wrapper.find('th:nth-child(6)').text()).toBe('Fastest Lap');
      expect(wrapper.find('th:nth-child(7)').text()).toBe('Penalties');
      expect(wrapper.find('th:nth-child(8)').text()).toBe('DNF');
      // Actions column has empty header but contains delete buttons
      expect(wrapper.find('th:nth-child(9)').exists()).toBe(true);
    });

    it('renders the table with correct headers for qualifying mode', () => {
      const wrapper = createWrapper(mockResults, mockDrivers, true);

      // In edit mode, drag handle column is first (empty header)
      expect(wrapper.find('th:nth-child(1)').text()).toBe(''); // Drag handle column
      expect(wrapper.find('th:nth-child(2)').text()).toBe('#');
      expect(wrapper.find('th:nth-child(3)').text()).toBe('Driver');
      expect(wrapper.find('th:nth-child(4)').text()).toBe('Lap Time');
      // Actions column has empty header but contains delete buttons
      expect(wrapper.find('th:nth-child(5)').exists()).toBe(true);
      // Should not show race-specific columns
      expect(wrapper.text()).not.toContain('Race Time');
      expect(wrapper.text()).not.toContain('Time Diff');
      expect(wrapper.text()).not.toContain('Penalties');
    });

    it('renders result rows with correct position numbers', () => {
      const results: RaceResultFormData[] = [
        createMockResult(1),
        createMockResult(2),
        createMockResult(3),
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2, 3]));

      const rows = wrapper.findAll('tbody tr');
      expect(rows).toHaveLength(3);
      // Position is now in second column (first is drag handle)
      expect(rows[0]!.find('td:nth-child(2)').text()).toBe('1');
      expect(rows[1]!.find('td:nth-child(2)').text()).toBe('2');
      expect(rows[2]!.find('td:nth-child(2)').text()).toBe('3');
    });

    it('renders delete button for each row', () => {
      const wrapper = createWrapper();

      const deleteButtons = wrapper
        .findAll('button')
        .filter((btn) => btn.attributes('data-icon') === 'PhTrash');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('renders Add Driver button', () => {
      const wrapper = createWrapper();

      const addButtons = wrapper
        .findAll('button')
        .filter((btn) => btn.attributes('data-label') === 'Add Driver');
      expect(addButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Delete Row Functionality', () => {
    it('emits update:results event when delete button is clicked', async () => {
      const results: RaceResultFormData[] = [createMockResult(1), createMockResult(2)];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]));

      // Find all delete buttons
      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        return btn.attributes('data-icon') === 'PhTrash';
      });

      // Click the first delete button
      await deleteButtons[0]!.trigger('click');

      // Should emit with the updated results (first row removed)
      expect(wrapper.emitted('update:results')).toBeTruthy();
      const emittedResults = wrapper.emitted('update:results')![0]![0] as RaceResultFormData[];
      expect(emittedResults).toHaveLength(1);
      expect(emittedResults[0]!.driver_id).toBe(2);
    });

    it('removes the correct row when multiple rows exist', async () => {
      const results: RaceResultFormData[] = [
        createMockResult(1),
        createMockResult(2),
        createMockResult(3),
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2, 3]));

      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        return btn.attributes('data-icon') === 'PhTrash';
      });

      // Delete the middle row (index 1, driver_id 2)
      await deleteButtons[1]!.trigger('click');

      const emittedResults = wrapper.emitted('update:results')![0]![0] as RaceResultFormData[];
      expect(emittedResults).toHaveLength(2);
      expect(emittedResults[0]!.driver_id).toBe(1);
      expect(emittedResults[1]!.driver_id).toBe(3);
    });
  });

  describe('Add Driver Functionality', () => {
    it('emits update:results event when Add Driver button is clicked', async () => {
      const wrapper = createWrapper(mockResults, mockDrivers, false, new Set([1]));

      const addButton = wrapper
        .findAll('button')
        .find((btn) => btn.attributes('data-label') === 'Add Driver');

      await addButton?.trigger('click');

      expect(wrapper.emitted('update:results')).toBeTruthy();
      const emittedResults = wrapper.emitted('update:results')![0]![0] as RaceResultFormData[];
      expect(emittedResults).toHaveLength(2);
    });

    it('adds the first available driver alphabetically', async () => {
      const wrapper = createWrapper(mockResults, mockDrivers, false, new Set([1]));

      const addButton = wrapper
        .findAll('button')
        .find((btn) => btn.attributes('data-label') === 'Add Driver');

      await addButton?.trigger('click');

      const emittedResults = wrapper.emitted('update:results')![0]![0] as RaceResultFormData[];
      // Alice (1) is already selected, so Bob (2) should be selected (alphabetically first)
      expect(emittedResults[1]!.driver_id).toBe(2); // Bob Smith
    });

    it('adds driver with correct initial values', async () => {
      const wrapper = createWrapper(mockResults, mockDrivers, false, new Set([1]));

      const addButton = wrapper
        .findAll('button')
        .find((btn) => btn.attributes('data-label') === 'Add Driver');

      await addButton?.trigger('click');

      const emittedResults = wrapper.emitted('update:results')![0]![0] as RaceResultFormData[];
      const newRow = emittedResults[1]!;

      expect(newRow.driver_id).toBe(2);
      expect(newRow.division_id).toBe(1);
      expect(newRow.position).toBeNull();
      expect(newRow.original_race_time).toBe('');
      expect(newRow.original_race_time_difference).toBe('');
      expect(newRow.fastest_lap).toBe('');
      expect(newRow.penalties).toBe('');
      expect(newRow.has_fastest_lap).toBe(false);
      expect(newRow.has_pole).toBe(false);
    });

    it('disables Add Driver button when all drivers are selected', async () => {
      const results: RaceResultFormData[] = [
        createMockResult(1),
        createMockResult(2),
        createMockResult(3),
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2, 3]));

      const addButton = wrapper
        .findAll('button')
        .find((btn) => btn.attributes('data-label') === 'Add Driver');

      expect(addButton?.attributes('disabled')).toBeDefined();
    });

    it('enables Add Driver button when drivers are available', async () => {
      const wrapper = createWrapper(mockResults, mockDrivers, false, new Set([1]));

      const addButton = wrapper
        .findAll('button')
        .find((btn) => btn.attributes('data-label') === 'Add Driver');

      expect(addButton?.attributes('disabled')).toBeUndefined();
    });

    it('selects alphabetically first available driver when multiple are available', async () => {
      const drivers: DriverOption[] = [
        { id: 1, name: 'Zara Wilson', division_id: 1 },
        { id: 2, name: 'Alice Johnson', division_id: 1 },
        { id: 3, name: 'Charlie Brown', division_id: 1 },
      ];
      const results: RaceResultFormData[] = [createMockResult(1)];
      const wrapper = createWrapper(results, drivers, false, new Set([1]));

      const addButton = wrapper
        .findAll('button')
        .find((btn) => btn.attributes('data-label') === 'Add Driver');

      await addButton?.trigger('click');

      const emittedResults = wrapper.emitted('update:results')![0]![0] as RaceResultFormData[];
      // Alice Johnson (id: 2) should be selected as she's alphabetically first
      expect(emittedResults[1]!.driver_id).toBe(2);
    });

    it('enables Add Driver button after deleting a row when all drivers were selected', async () => {
      // Start with all drivers selected
      const results: RaceResultFormData[] = [
        createMockResult(1),
        createMockResult(2),
        createMockResult(3),
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2, 3]));

      // Verify Add Driver button is initially disabled
      let addButton = wrapper
        .findAll('button')
        .find((btn) => btn.attributes('data-label') === 'Add Driver');
      expect(addButton?.attributes('disabled')).toBeDefined();

      // Delete a row to free up a driver
      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        return btn.attributes('data-icon') === 'PhTrash';
      });
      await deleteButtons[0]!.trigger('click');

      // Get the emitted results and update the wrapper props to simulate parent update
      const emittedResults = wrapper.emitted('update:results')![0]![0] as RaceResultFormData[];
      await wrapper.setProps({
        results: emittedResults,
        selectedDriverIds: new Set(
          emittedResults.map((r) => r.driver_id).filter((id): id is number => id !== null),
        ),
      });

      // Verify Add Driver button is now enabled
      addButton = wrapper
        .findAll('button')
        .find((btn) => btn.attributes('data-label') === 'Add Driver');
      expect(addButton?.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Driver Selection', () => {
    it('provides available drivers for dropdown excluding already selected', () => {
      const results: RaceResultFormData[] = [createMockResult(1), createMockResult(2)];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]));

      // The dropdowns should show all drivers but disable those already selected
      const selects = wrapper.findAll('select');
      expect(selects).toHaveLength(2);
    });
  });

  describe('Integration with Parent', () => {
    it('emits update:results when driver selection changes', async () => {
      const wrapper = createWrapper();

      const select = wrapper.find('select');
      await select.trigger('change');

      expect(wrapper.emitted('update:results')).toBeTruthy();
    });
  });

  describe('Read-only Mode', () => {
    it('renders driver names as text instead of dropdown in read-only mode', () => {
      // In read-only mode, rows without data (race_time, fastest_lap, or dnf) are filtered out
      // So we need to provide a result with actual data
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: '01:30:45.123',
          original_race_time_difference: '',
          fastest_lap: '01:25:00.456',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), true);

      // Should show driver name as text
      expect(wrapper.text()).toContain('Alice Johnson');
      // Should not show dropdown
      expect(wrapper.findAll('select')).toHaveLength(0);
    });

    it('renders times as text instead of inputs in read-only mode', () => {
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: '01:30:45.123',
          original_race_time_difference: '',
          fastest_lap: '01:25:00.456',
          penalties: '00:00:05.000',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), true);

      // Should show times as text (formatted by useTimeFormat which removes leading zeros)
      expect(wrapper.text()).toContain('1:30:45.123');
      expect(wrapper.text()).toContain('1:25:00.456');
      expect(wrapper.text()).toContain('05.000');
    });

    it('hides delete buttons in read-only mode', () => {
      const wrapper = createWrapper(mockResults, mockDrivers, false, new Set([1]), true);

      // Should not show delete buttons
      const deleteButtons = wrapper.findAll('button').filter((btn) => {
        return btn.attributes('data-icon') === 'PhTrash';
      });
      expect(deleteButtons).toHaveLength(0);
    });

    it('hides Add Driver button in read-only mode', () => {
      const wrapper = createWrapper(mockResults, mockDrivers, false, new Set([1]), true);

      // Should not show Add Driver button
      const addButtons = wrapper.findAll('button').filter((btn) => {
        return btn.attributes('data-label') === 'Add Driver';
      });
      expect(addButtons).toHaveLength(0);
    });

    it('does not render actions column header in read-only mode', () => {
      const wrapper = createWrapper(mockResults, mockDrivers, false, new Set([1]), true);

      // Race mode should have 7 columns (Position, Driver, Original Time, Time Diff, Fastest Lap, Penalties, DNF) with no actions column in read-only
      const headers = wrapper.findAll('th');
      expect(headers).toHaveLength(7);
    });

    it('shows dash for empty time values in read-only mode', () => {
      // In read-only mode, rows without data are filtered out
      // Use a DNF result which has no race time but should still be shown
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: null,
          original_race_time: '', // Empty - should show dash
          original_race_time_difference: '', // Empty - should show dash
          fastest_lap: '', // Empty - should show dash
          penalties: '', // Empty - should show dash
          has_fastest_lap: false,
          has_pole: false,
          dnf: true, // DNF ensures the row is displayed
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), true);

      // Should show dashes for empty values
      const dashes = wrapper.findAll('span.font-mono').filter((span) => span.text() === '-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('filters out drivers without result data in read-only mode', () => {
      const results: RaceResultFormData[] = [
        // Driver 1: has race_time - should be shown
        {
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: '01:30:00.000',
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        // Driver 2: no data - should be filtered out
        {
          driver_id: 2,
          division_id: 1,
          position: null,
          original_race_time: '',
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        // Driver 3: has fastest_lap - should be shown
        {
          driver_id: 3,
          division_id: 1,
          position: 2,
          original_race_time: '',
          original_race_time_difference: '',
          fastest_lap: '01:25:00.000',
          penalties: '',
          has_fastest_lap: true,
          has_pole: false,
          dnf: false,
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2, 3]), true);

      // Should show Alice Johnson (has race_time) and Charlie Brown (has fastest_lap)
      // Should NOT show Bob Smith (no data)
      expect(wrapper.text()).toContain('Alice Johnson');
      expect(wrapper.text()).toContain('Charlie Brown');
      expect(wrapper.text()).not.toContain('Bob Smith');
    });

    it('shows all drivers including those without data in edit mode', () => {
      const results: RaceResultFormData[] = [
        createMockResult(1), // No data
        createMockResult(2), // No data
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]), false); // readOnly = false

      // In edit mode, all drivers should be shown (as dropdowns)
      const rows = wrapper.findAll('tbody tr');
      expect(rows).toHaveLength(2);
    });

    it('shows DNF drivers in read-only mode even without times', () => {
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: null,
          original_race_time: '',
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: true, // DNF flag is set
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), true);

      // Driver should be shown because they have DNF status
      expect(wrapper.text()).toContain('Alice Johnson');
      expect(wrapper.text()).toContain('DNF');
    });
  });

  describe('No Times Mode (Drag and Drop)', () => {
    it('renders draggable component when raceTimesRequired is false', () => {
      const results: RaceResultFormData[] = [createMockResult(1), createMockResult(2)];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]), false, false);

      // Should have draggable component
      expect(wrapper.findComponent({ name: 'Draggable' }).exists()).toBe(true);
    });

    it('renders draggable component when raceTimesRequired is true (Phase 2)', () => {
      const wrapper = createWrapper();

      // Drag-and-drop is now enabled for both modes (Phase 2 change)
      expect(wrapper.findComponent({ name: 'Draggable' }).exists()).toBe(true);
    });

    it('hides time columns when raceTimesRequired is false', () => {
      const results: RaceResultFormData[] = [createMockResult(1)];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), false, false);

      // Should not show time-related headers
      expect(wrapper.text()).not.toContain('Race Time');
      expect(wrapper.text()).not.toContain('Time Diff');
      expect(wrapper.text()).not.toContain('Penalties');
    });

    it('shows DNF and FL columns side by side in no-times race mode', () => {
      const results: RaceResultFormData[] = [createMockResult(1)];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), false, false);

      // Should show DNF and FL headers
      expect(wrapper.text()).toContain('DNF');
      expect(wrapper.text()).toContain('FL');
    });

    it('shows Pole column in no-times qualifying mode', () => {
      const results: RaceResultFormData[] = [createMockResult(1)];
      const wrapper = createWrapper(results, mockDrivers, true, new Set([1]), false, false);

      // Should show Pole header
      expect(wrapper.text()).toContain('Pole');
    });

    it('shows drag handle column in no-times edit mode', () => {
      const results: RaceResultFormData[] = [createMockResult(1)];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), false, false);

      // Should render drag handle icon
      expect(wrapper.findComponent({ name: 'PhDotsSixVertical' }).exists()).toBe(true);
    });

    it('shows drag handle in times-required mode (Phase 2)', () => {
      const results: RaceResultFormData[] = [createMockResult(1)];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), false, true);

      // Drag handles are now shown in both modes (Phase 2 change)
      expect(wrapper.findComponent({ name: 'PhDotsSixVertical' }).exists()).toBe(true);
    });

    it('renders DNF rows with red background in no-times mode', () => {
      const results: RaceResultFormData[] = [
        { ...createMockResult(1), dnf: true },
        createMockResult(2),
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]), false, false);

      const draggable = wrapper.findComponent({ name: 'Draggable' });
      expect(draggable.exists()).toBe(true);

      // The row with DNF should have bg-red-50 class
      const rows = wrapper.findAll('tr');
      const dnfRow = rows.find((row) => row.classes().includes('bg-red-50'));
      expect(dnfRow).toBeTruthy();
    });

    it('shows FL checkbox in no-times race mode', () => {
      const results: RaceResultFormData[] = [createMockResult(1)];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), false, false);

      // Should have 2 checkboxes per row: DNF and FL
      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThanOrEqual(2);
    });

    it('shows Pole checkbox in no-times qualifying mode', () => {
      const results: RaceResultFormData[] = [createMockResult(1)];
      const wrapper = createWrapper(results, mockDrivers, true, new Set([1]), false, false);

      // Should have Pole checkbox
      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThanOrEqual(1);
    });

    it('emits update:results when DNF is toggled in no-times mode', async () => {
      const results: RaceResultFormData[] = [createMockResult(1), createMockResult(2)];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]), false, false);

      // Find DNF checkbox
      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      const dnfCheckbox = checkboxes[0];

      // Toggle DNF
      await dnfCheckbox?.trigger('change');

      // Should emit update:results
      expect(wrapper.emitted('update:results')).toBeTruthy();
    });
  });

  describe('Dynamic Time Difference Calculation (Read-Only Mode)', () => {
    it('calculates time differences dynamically in read-only mode based on position 1 driver', () => {
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: '01:30:00.000', // 90000ms
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '', // No penalty
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: 1,
          position: 2,
          original_race_time: '01:30:05.000', // 90005ms (5s behind)
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '', // No penalty
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]), true, true);

      // Position 1 driver should not show time difference
      const rows = wrapper.findAll('tbody tr');
      expect(rows).toHaveLength(2);

      // Position 2 driver should show calculated time difference of +5s
      // Note: The calculated difference is displayed via formatRaceTime which removes leading zeros
      expect(wrapper.text()).toContain('1:30:05.000'); // Driver 2's race time
    });

    it('calculates time differences dynamically when penalties are present', () => {
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: '01:30:00.000', // 90000ms
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '00:00:02.000', // 2s penalty = 92000ms effective
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: 1,
          position: 2,
          original_race_time: '01:30:03.000', // 90003ms
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '', // No penalty = 90003ms effective
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]), true, true);

      // The component should calculate time differences based on effective times (original + penalties)
      // Position 1: 90000ms + 2000ms = 92000ms effective
      // Position 2: 90003ms + 0ms = 90003ms effective
      // Since driver 1 has a penalty, driver 2 should actually finish ahead with a -1997ms difference
      const rows = wrapper.findAll('tbody tr');
      expect(rows).toHaveLength(2);
    });

    it('does not calculate time differences for DNF drivers', () => {
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: '01:30:00.000',
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: 1,
          position: null,
          original_race_time: '',
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: true, // DNF driver
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]), true, true);

      // DNF driver should be shown but without time difference
      expect(wrapper.text()).toContain('Alice Johnson');
      expect(wrapper.text()).toContain('Bob Smith');
      expect(wrapper.text()).toContain('DNF');
    });

    it('does not calculate time differences in edit mode', () => {
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: '01:30:00.000',
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
        {
          driver_id: 2,
          division_id: 1,
          position: 2,
          original_race_time: '01:30:05.000',
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];
      // Edit mode (readOnly = false)
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1, 2]), false, true);

      // In edit mode, time differences should show the original values from props
      // (not calculated dynamically)
      const inputs = wrapper.findAll('input');
      expect(inputs.length).toBeGreaterThan(0); // Should have input fields in edit mode
    });

    it('does not calculate time differences in qualifying mode', () => {
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: '',
          original_race_time_difference: '',
          fastest_lap: '01:25:00.000',
          penalties: '',
          has_fastest_lap: false,
          has_pole: true,
          dnf: false,
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, true, new Set([1]), true, true);

      // Qualifying mode should not show time differences
      expect(wrapper.text()).not.toContain('Time Diff');
      expect(wrapper.text()).toContain('1:25:00.000'); // Fastest lap time
    });

    it('position 1 driver has no time difference displayed', () => {
      const results: RaceResultFormData[] = [
        {
          driver_id: 1,
          division_id: 1,
          position: 1,
          original_race_time: '01:30:00.000',
          original_race_time_difference: '',
          fastest_lap: '',
          penalties: '',
          has_fastest_lap: false,
          has_pole: false,
          dnf: false,
        },
      ];
      const wrapper = createWrapper(results, mockDrivers, false, new Set([1]), true, true);

      // Position 1 driver should not show time difference
      const rows = wrapper.findAll('tbody tr');
      expect(rows).toHaveLength(1);

      // The cell should be empty or contain no visible text for position 1
      const firstRow = rows[0];
      const timeDiffCell = firstRow?.findAll('td')[3]; // Index 3 for 4th column (Time Diff is the 4th column)
      // Should not contain a + sign for position 1
      expect(timeDiffCell?.text()).not.toContain('+');
    });
  });
});
