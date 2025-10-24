import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import DriverFormDialog from '../modals/DriverFormDialog.vue';
import type { LeagueDriver } from '@user/types/driver';
import type { PlatformFormField } from '@user/types/league';

// Mock the league store
const mockFetchDriverFormFieldsForLeague = vi.fn();
let mockPlatformFormFieldsValue: PlatformFormField[] = [];

vi.mock('@user/stores/leagueStore', () => ({
  useLeagueStore: vi.fn(() => ({
    get platformFormFields() {
      return mockPlatformFormFieldsValue;
    },
    fetchDriverFormFieldsForLeague: mockFetchDriverFormFieldsForLeague,
  })),
}));

// Mock BaseModal component
vi.mock('@user/components/common/modals/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div v-if="visible"><slot></slot><slot name="footer"></slot></div>',
    props: ['visible', 'header', 'width'],
  },
}));

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'type'],
  },
}));

vi.mock('primevue/inputnumber', () => ({
  default: {
    name: 'InputNumber',
    template:
      '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', parseInt($event.target.value))" />',
    props: ['modelValue', 'min', 'max', 'useGrouping', 'placeholder'],
  },
}));

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template:
      '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :value="opt.value">{{ opt.label }}</option></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
  },
}));

vi.mock('primevue/textarea', () => ({
  default: {
    name: 'Textarea',
    template:
      '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    props: ['modelValue', 'rows', 'placeholder'],
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
    props: ['label', 'severity'],
  },
}));

vi.mock('primevue/accordion', () => ({
  default: {
    name: 'Accordion',
    template: '<div class="mock-accordion"><slot></slot></div>',
    props: ['multiple'],
  },
}));

vi.mock('primevue/accordionpanel', () => ({
  default: {
    name: 'AccordionPanel',
    template: '<div class="mock-accordion-panel"><slot></slot></div>',
    props: ['value'],
  },
}));

vi.mock('primevue/accordionheader', () => ({
  default: {
    name: 'AccordionHeader',
    template: '<div class="mock-accordion-header"><slot></slot></div>',
  },
}));

vi.mock('primevue/accordioncontent', () => ({
  default: {
    name: 'AccordionContent',
    template: '<div class="mock-accordion-content"><slot></slot></div>',
  },
}));

describe('DriverFormDialog', () => {
  let mockDriver: LeagueDriver;
  let mockPlatformFormFields: PlatformFormField[];

  beforeEach(() => {
    // Set up Pinia
    setActivePinia(createPinia());

    // Reset mocks
    mockFetchDriverFormFieldsForLeague.mockClear();
    mockPlatformFormFieldsValue = []; // Reset to empty by default

    mockDriver = {
      id: 1,
      league_id: 1,
      driver_id: 101,
      driver: {
        id: 101,
        first_name: 'John',
        last_name: 'Smith',
        nickname: 'JSmith',
        discord_id: 'john#1234',
        email: 'john@example.com',
        phone: '+1234567890',
        psn_id: 'JohnSmith77',
        iracing_id: null,
        iracing_customer_id: null,
        display_name: 'John Smith',
        primary_platform_id: null,
        created_at: '2025-10-18T10:00:00Z',
        updated_at: '2025-10-18T10:00:00Z',
      },
      driver_number: 5,
      status: 'active',
      league_notes: 'Top performer',
      added_to_league_at: '2025-10-18T10:00:00Z',
    };

    mockPlatformFormFields = [
      { field: 'psn_id', label: 'PSN ID', type: 'text', placeholder: 'Enter PSN ID' },
      { field: 'iracing_id', label: 'iRacing ID', type: 'text', placeholder: 'Enter iRacing ID' },
    ];
  });

  it('should render in create mode', () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should render in edit mode with driver data', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'edit',
        driver: mockDriver,
        leagueId: 1,
      },
    });

    await wrapper.vm.$nextTick();

    const component = wrapper.vm as any;
    expect(component.formData.first_name).toBe('John');
    expect(component.formData.last_name).toBe('Smith');
    expect(component.formData.nickname).toBe('JSmith');
    expect(component.formData.discord_id).toBe('john#1234');
    expect(component.formData.driver_number).toBe(5);
  });

  it('should validate that at least one of nickname or discord_id is required', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.formData.psn_id = 'TestID';

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
    expect(component.errors.identifier).toBeDefined();
  });

  it('should pass validation with only nickname', async () => {
    // Set up platform fields in mock
    mockPlatformFormFieldsValue = mockPlatformFormFields;

    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.formData.nickname = 'JSmith';
    component.formData.psn_id = 'TestID';

    const isValid = component.validateForm();

    expect(isValid).toBe(true);
    expect(component.errors.identifier).toBeUndefined();
  });

  it('should pass validation with only discord_id', async () => {
    // Set up platform fields in mock
    mockPlatformFormFieldsValue = mockPlatformFormFields;

    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.formData.discord_id = 'user#1234';
    component.formData.psn_id = 'TestID';

    const isValid = component.validateForm();

    expect(isValid).toBe(true);
    expect(component.errors.identifier).toBeUndefined();
  });

  it('should pass validation with both nickname and discord_id', async () => {
    // Set up platform fields in mock
    mockPlatformFormFieldsValue = mockPlatformFormFields;

    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.formData.nickname = 'JSmith';
    component.formData.discord_id = 'user#1234';
    component.formData.psn_id = 'TestID';

    const isValid = component.validateForm();

    expect(isValid).toBe(true);
    expect(component.errors.identifier).toBeUndefined();
  });

  it('should validate that at least one platform ID is required', async () => {
    // Set up platform fields in mock
    mockPlatformFormFieldsValue = mockPlatformFormFields;

    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.formData.nickname = 'JSmith';

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
    expect(component.errors.platform).toBeDefined();
  });

  it('should validate email format', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.formData.nickname = 'JSmith';
    component.formData.psn_id = 'TestID';
    component.formData.email = 'invalid-email';

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
    expect(component.errors.email).toBeDefined();
  });

  it('should validate driver number range', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.formData.nickname = 'JSmith';
    component.formData.psn_id = 'TestID';
    component.formData.driver_number = 1000;

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
    expect(component.errors.driver_number).toBeDefined();
  });

  it('should emit save event with valid data', async () => {
    // Set up platform fields in mock
    mockPlatformFormFieldsValue = mockPlatformFormFields;

    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.formData.first_name = 'John';
    component.formData.last_name = 'Smith';
    component.formData.nickname = 'JSmith'; // Required: at least one of nickname or discord_id
    component.formData.psn_id = 'JohnSmith77';
    component.formData.driver_number = 5;

    component.handleSubmit();

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('save')).toBeTruthy();
    const emittedData = wrapper.emitted('save')?.[0]?.[0] as any;
    expect(emittedData.first_name).toBe('John');
    expect(emittedData.nickname).toBe('JSmith');
    expect(emittedData.psn_id).toBe('JohnSmith77');
  });

  it('should emit cancel event', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.handleCancel();

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('update:visible')).toBeTruthy();
  });

  it('should reset form when opening in create mode', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: false,
        mode: 'create',
        leagueId: 1,
      },
    });

    const component = wrapper.vm as any;
    component.formData.first_name = 'Test';

    await wrapper.setProps({ visible: true });

    expect(component.formData.first_name).toBe('');
  });

  it('should display correct dialog title', () => {
    const createWrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
    });

    expect((createWrapper.vm as any).dialogTitle).toBe('Add Driver');

    const editWrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'edit',
        leagueId: 1,
      },
    });

    expect((editWrapper.vm as any).dialogTitle).toBe('Edit Driver');
  });
});
