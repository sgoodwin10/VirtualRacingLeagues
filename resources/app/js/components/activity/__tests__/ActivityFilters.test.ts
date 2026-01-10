import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ActivityFilters from '../ActivityFilters.vue';

describe('ActivityFilters', () => {
  const globalConfig: Parameters<typeof mount>[1] = {
    global: {
      plugins: [[PrimeVue, { theme: { preset: Aura } }]],
      stubs: {
        Select: {
          template: `
            <select
              :value="modelValue"
              @change="$emit('update:modelValue', $event.target.value); $emit('change', $event)"
              data-testid="select"
            >
              <option value="">{{ placeholder }}</option>
              <option v-for="opt in options" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          `,
          props: [
            'modelValue',
            'options',
            'optionLabel',
            'optionValue',
            'placeholder',
            'showClear',
          ],
          emits: ['update:modelValue', 'change'],
        },
        DatePicker: {
          template: `
            <input
              type="date"
              :value="modelValue ? formatDate(modelValue) : ''"
              @change="handleChange($event)"
              data-testid="datepicker"
            />
          `,
          props: ['modelValue', 'placeholder', 'showIcon', 'showButtonBar', 'dateFormat'],
          emits: ['update:modelValue', 'date-select', 'clear-click'],
          methods: {
            formatDate(date: Date | undefined): string {
              if (!date) return '';
              return date.toISOString().split('T')[0];
            },
            handleChange(event: Event) {
              const target = event.target as HTMLInputElement;
              if (target.value) {
                const date = new Date(target.value);
                this.$emit('update:modelValue', date);
                this.$emit('date-select', date);
              } else {
                this.$emit('update:modelValue', undefined);
                this.$emit('clear-click');
              }
            },
          },
        },
        Button: {
          template:
            '<button @click="$emit(\'click\')" :class="{ outlined: outlined }">{{ label }}</button>',
          props: ['label', 'icon', 'severity', 'outlined', 'size'],
          emits: ['click'],
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter controls', () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    expect(wrapper.text()).toContain('Entity Type');
    expect(wrapper.text()).toContain('Action');
    expect(wrapper.text()).toContain('From Date');
    expect(wrapper.text()).toContain('To Date');
  });

  it('renders entity type dropdown with all options', () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const html = wrapper.html();
    expect(html).toContain('League');
    expect(html).toContain('Driver');
    expect(html).toContain('Competition');
    expect(html).toContain('Season');
    expect(html).toContain('Round');
    expect(html).toContain('Race');
    expect(html).toContain('Qualifier');
    expect(html).toContain('Division');
    expect(html).toContain('Team');
    expect(html).toContain('Season Driver');
  });

  it('renders action dropdown with all options', () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const html = wrapper.html();
    expect(html).toContain('Create');
    expect(html).toContain('Update');
    expect(html).toContain('Delete');
    expect(html).toContain('Complete');
    expect(html).toContain('Archive');
    expect(html).toContain('Import');
    expect(html).toContain('Add Driver');
    expect(html).toContain('Remove Driver');
    expect(html).toContain('Reorder');
    expect(html).toContain('Enter Results');
  });

  it('emits filter event when entity type is selected', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const selects = wrapper.findAll('[data-testid="select"]');
    const entityTypeSelect = selects[0];

    await entityTypeSelect.setValue('driver');
    await flushPromises();

    expect(wrapper.emitted('filter')).toBeTruthy();
    const emittedFilters = wrapper.emitted('filter')![0][0];
    expect(emittedFilters).toHaveProperty('entity_type', 'driver');
  });

  it('emits filter event when action is selected', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const selects = wrapper.findAll('[data-testid="select"]');
    const actionSelect = selects[1];

    await actionSelect.setValue('create');
    await flushPromises();

    expect(wrapper.emitted('filter')).toBeTruthy();
    const emittedFilters = wrapper.emitted('filter')![0][0];
    expect(emittedFilters).toHaveProperty('action', 'create');
  });

  it('emits filter event when from date is selected', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const datepickers = wrapper.findAll('[data-testid="datepicker"]');
    const fromDatePicker = datepickers[0];

    await fromDatePicker.setValue('2024-01-15');
    await flushPromises();

    expect(wrapper.emitted('filter')).toBeTruthy();
    const emittedFilters = wrapper.emitted('filter')![0][0];
    expect(emittedFilters).toHaveProperty('from_date', '2024-01-15');
  });

  it('emits filter event when to date is selected', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const datepickers = wrapper.findAll('[data-testid="datepicker"]');
    const toDatePicker = datepickers[1];

    await toDatePicker.setValue('2024-01-31');
    await flushPromises();

    expect(wrapper.emitted('filter')).toBeTruthy();
    const emittedFilters = wrapper.emitted('filter')![0][0];
    expect(emittedFilters).toHaveProperty('to_date', '2024-01-31');
  });

  it('does not show clear button initially', () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    expect(wrapper.text()).not.toContain('Clear All Filters');
  });

  it('shows clear button when filters are active', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const selects = wrapper.findAll('[data-testid="select"]');
    const entityTypeSelect = selects[0];

    await entityTypeSelect.setValue('driver');
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('Clear All Filters');
  });

  it('emits clear event when clear button is clicked', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    // Set a filter first
    const selects = wrapper.findAll('[data-testid="select"]');
    await selects[0].setValue('driver');
    await flushPromises();
    await nextTick();

    // Click clear button
    const clearButton = wrapper.find('button');
    await clearButton.trigger('click');

    expect(wrapper.emitted('clear')).toBeTruthy();
  });

  it('clears all filter values when clear is clicked', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    // Set multiple filters
    const selects = wrapper.findAll('[data-testid="select"]');
    await selects[0].setValue('driver');
    await selects[1].setValue('create');
    await flushPromises();

    // Click clear button
    const clearButton = wrapper.find('button');
    await clearButton.trigger('click');
    await nextTick();

    // Verify clear event was emitted
    expect(wrapper.emitted('clear')).toBeTruthy();

    // Clear button should be hidden after clearing
    expect(wrapper.text()).not.toContain('Clear All Filters');
  });

  it('combines multiple filters in filter event', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const selects = wrapper.findAll('[data-testid="select"]');
    const datepickers = wrapper.findAll('[data-testid="datepicker"]');

    // Set entity type
    await selects[0].setValue('driver');
    await flushPromises();

    // Set action
    await selects[1].setValue('create');
    await flushPromises();

    // Set from date
    await datepickers[0].setValue('2024-01-01');
    await flushPromises();

    // Set to date
    await datepickers[1].setValue('2024-01-31');
    await flushPromises();

    // Get the last filter event
    const filterEvents = wrapper.emitted('filter') as Array<[Record<string, unknown>]>;
    const lastFilter = filterEvents[filterEvents.length - 1][0];

    expect(lastFilter).toEqual({
      entity_type: 'driver',
      action: 'create',
      from_date: '2024-01-01',
      to_date: '2024-01-31',
    });
  });

  it('formats date correctly for API', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const datepickers = wrapper.findAll('[data-testid="datepicker"]');
    await datepickers[0].setValue('2024-06-15');
    await flushPromises();

    const emittedFilters = wrapper.emitted('filter')![0][0];
    expect(emittedFilters).toHaveProperty('from_date', '2024-06-15');
  });

  it('does not include undefined filters in event', async () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    // Only select entity type
    const selects = wrapper.findAll('[data-testid="select"]');
    await selects[0].setValue('driver');
    await flushPromises();

    const emittedFilters = wrapper.emitted('filter')![0][0] as Record<string, unknown>;

    // Should have entity_type but not action, from_date, to_date
    expect(emittedFilters.entity_type).toBe('driver');
    expect('action' in emittedFilters).toBe(false);
    expect('from_date' in emittedFilters).toBe(false);
    expect('to_date' in emittedFilters).toBe(false);
  });

  it('has responsive grid layout', () => {
    const wrapper = mount(ActivityFilters, globalConfig);

    const grid = wrapper.find('.grid');
    expect(grid.exists()).toBe(true);
    expect(grid.classes()).toContain('grid-cols-1');
    expect(grid.classes()).toContain('md:grid-cols-2');
    expect(grid.classes()).toContain('lg:grid-cols-4');
  });
});
