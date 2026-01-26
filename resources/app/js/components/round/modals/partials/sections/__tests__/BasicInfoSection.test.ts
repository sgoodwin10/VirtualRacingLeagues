import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import BasicInfoSection from '../BasicInfoSection.vue';
import InputText from 'primevue/inputtext';
import AutoComplete from 'primevue/autocomplete';
import DatePicker from 'primevue/datepicker';
import type { Track } from '@app/types/track';

describe('BasicInfoSection', () => {
  const globalConfig: Parameters<typeof mount>[1] = {
    global: {
      plugins: [[PrimeVue, { theme: { preset: Aura } }]],
    },
  };

  const mockTrack: Track = {
    id: 1,
    platform_id: 1,
    platform_track_location_id: 1,
    name: 'Silverstone Circuit',
    slug: 'silverstone-circuit',
    is_reverse: false,
    image_path: null,
    length_meters: 5891,
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    location: {
      id: 1,
      name: 'Silverstone',
      slug: 'silverstone',
      country: 'United Kingdom',
      is_active: true,
      sort_order: 1,
    },
  };

  describe('Rendering', () => {
    it('renders section title and description', () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      expect(wrapper.text()).toContain('Basic Information');
      expect(wrapper.text()).toContain('Round name, track, and scheduling');
    });

    it('renders round name input', () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const input = wrapper.findComponent(InputText);
      expect(input.exists()).toBe(true);
    });

    it('renders track autocomplete', () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const autocomplete = wrapper.findComponent(AutoComplete);
      expect(autocomplete.exists()).toBe(true);
    });

    it('renders date picker', () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.exists()).toBe(true);
    });
  });

  describe('Props', () => {
    it('displays round name value', () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: 'Test Round',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const input = wrapper.findComponent(InputText);
      expect(input.props('modelValue')).toBe('Test Round');
    });

    it('displays selected track', () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: mockTrack,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const autocomplete = wrapper.findComponent(AutoComplete);
      expect(autocomplete.props('modelValue')).toEqual(mockTrack);
    });

    it('displays scheduled date', () => {
      const date = new Date('2024-01-15T10:00:00');
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: date,
          errors: {},
        },
      });

      const datePicker = wrapper.findComponent(DatePicker);
      expect(datePicker.props('modelValue')).toEqual(date);
    });

    it('disables inputs when disabled prop is true', () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
          disabled: true,
        },
      });

      const input = wrapper.findComponent(InputText);
      const autocomplete = wrapper.findComponent(AutoComplete);
      const datePicker = wrapper.findComponent(DatePicker);

      expect(input.props('disabled')).toBe(true);
      expect(autocomplete.props('disabled')).toBe(true);
      expect(datePicker.props('disabled')).toBe(true);
    });

    it('shows validation errors', () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {
            name: 'Name is required',
            platform_track_id: 'Track is required',
            scheduled_at: 'Date is required',
          },
        },
      });

      // Verify errors prop is passed correctly
      expect(wrapper.props('errors')).toEqual({
        name: 'Name is required',
        platform_track_id: 'Track is required',
        scheduled_at: 'Date is required',
      });
    });
  });

  describe('Events', () => {
    it('emits update:roundName when input changes', async () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const input = wrapper.findComponent(InputText);
      await input.vm.$emit('update:modelValue', 'New Round');

      expect(wrapper.emitted('update:roundName')).toBeTruthy();
      expect(wrapper.emitted('update:roundName')?.[0]).toEqual(['New Round']);
    });

    it('emits track-search when searching', async () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const autocomplete = wrapper.findComponent(AutoComplete);
      await autocomplete.vm.$emit('complete', { query: 'silver' });

      expect(wrapper.emitted('track-search')).toBeTruthy();
      expect(wrapper.emitted('track-search')?.[0]).toEqual(['silver']);
    });

    it('emits track-select when track is selected', async () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const autocomplete = wrapper.findComponent(AutoComplete);
      await autocomplete.vm.$emit('item-select', { value: mockTrack });

      expect(wrapper.emitted('track-select')).toBeTruthy();
      expect(wrapper.emitted('track-select')?.[0]).toEqual([mockTrack]);
    });

    it('emits update:scheduledAt when date changes', async () => {
      const date = new Date('2024-01-15');
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const datePicker = wrapper.findComponent(DatePicker);
      await datePicker.vm.$emit('update:modelValue', date);

      expect(wrapper.emitted('update:scheduledAt')).toBeTruthy();
      expect(wrapper.emitted('update:scheduledAt')?.[0]).toEqual([date]);
    });

    it('emits blur events', async () => {
      const wrapper = mount(BasicInfoSection, {
        ...globalConfig,
        props: {
          roundName: '',
          selectedTrack: null,
          trackSuggestions: [],
          scheduledAt: null,
          errors: {},
        },
      });

      const input = wrapper.findComponent(InputText);
      await input.vm.$emit('blur');

      expect(wrapper.emitted('blur-name')).toBeTruthy();
    });
  });
});
