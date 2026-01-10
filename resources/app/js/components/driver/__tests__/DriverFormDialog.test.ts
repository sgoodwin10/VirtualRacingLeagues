import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithStubs } from '@app/__tests__/setup';
import { createPinia, setActivePinia } from 'pinia';
import DriverFormDialog from '../modals/DriverFormDialog.vue';
import type { LeagueDriver } from '@app/types/driver';
import type { PlatformFormField } from '@app/types/league';
import { defineComponent } from 'vue';

// Mock the league store
const mockFetchDriverFormFieldsForLeague = vi.fn();
let mockPlatformFormFieldsValue: PlatformFormField[] = [];

vi.mock('@app/stores/leagueStore', () => ({
  useLeagueStore: vi.fn(() => ({
    get platformFormFields() {
      return mockPlatformFormFieldsValue;
    },
    fetchDriverFormFieldsForLeague: mockFetchDriverFormFieldsForLeague,
  })),
}));

// Stub components that are not yet in centralized stubs
const TechnicalAccordionStub = defineComponent({
  name: 'TechnicalAccordion',
  template: '<div class="mock-technical-accordion"><slot></slot></div>',
});

const TechnicalAccordionPanelStub = defineComponent({
  name: 'TechnicalAccordionPanel',
  props: {
    value: { type: String, default: '' },
  },
  template: '<div class="mock-technical-accordion-panel"><slot></slot></div>',
});

const TechnicalAccordionHeaderStub = defineComponent({
  name: 'TechnicalAccordionHeader',
  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: '' },
    iconVariant: { type: String, default: '' },
  },
  template:
    '<div class="mock-technical-accordion-header"><slot></slot><slot name="suffix"></slot></div>',
});

const TechnicalAccordionContentStub = defineComponent({
  name: 'TechnicalAccordionContent',
  props: {
    padding: { type: String, default: '' },
  },
  template: '<div class="mock-technical-accordion-content"><slot></slot></div>',
});

const AccordionBadgeStub = defineComponent({
  name: 'AccordionBadge',
  props: {
    text: { type: String, default: '' },
    severity: { type: String, default: '' },
  },
  template: '<span class="mock-accordion-badge">{{ text }}</span>',
});

const InputNumberStub = defineComponent({
  name: 'InputNumber',
  props: {
    modelValue: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    useGrouping: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  template:
    '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', parseInt($event.target.value))" />',
});

const TextareaStub = defineComponent({
  name: 'PrimeTextarea',
  props: {
    modelValue: { type: String, default: '' },
    rows: { type: Number, default: 3 },
    placeholder: { type: String, default: '' },
    maxlength: { type: Number, default: undefined },
  },
  emits: ['update:modelValue'],
  template:
    '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
});

describe('DriverFormDialog', () => {
  let mockDriver: LeagueDriver;
  let mockPlatformFormFields: PlatformFormField[];

  beforeEach(() => {
    // Set up Pinia
    setActivePinia(createPinia());

    // Reset mocks to ensure test independence
    mockFetchDriverFormFieldsForLeague.mockClear();
    mockFetchDriverFormFieldsForLeague.mockReset();
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
    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      global: {
        stubs: {
          TechnicalAccordion: TechnicalAccordionStub,
          TechnicalAccordionPanel: TechnicalAccordionPanelStub,
          TechnicalAccordionHeader: TechnicalAccordionHeaderStub,
          TechnicalAccordionContent: TechnicalAccordionContentStub,
          AccordionBadge: AccordionBadgeStub,
          InputNumber: InputNumberStub,
          Textarea: TextareaStub,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
    // Verify dialog title for create mode is computed correctly
    expect((wrapper.vm as any).dialogTitle).toBe('Add Driver');
  });

  const getStubOptions = () => ({
    global: {
      stubs: {
        TechnicalAccordion: TechnicalAccordionStub,
        TechnicalAccordionPanel: TechnicalAccordionPanelStub,
        TechnicalAccordionHeader: TechnicalAccordionHeaderStub,
        TechnicalAccordionContent: TechnicalAccordionContentStub,
        AccordionBadge: AccordionBadgeStub,
        InputNumber: InputNumberStub,
        Textarea: TextareaStub,
      },
    },
  });

  it('should render in edit mode with driver data', async () => {
    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'edit',
        driver: mockDriver,
        leagueId: 1,
      },
      ...getStubOptions(),
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
    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
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

    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
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

    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
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

    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
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

    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
    });

    const component = wrapper.vm as any;
    component.formData.nickname = 'JSmith';

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
    expect(component.errors.platform).toBeDefined();
  });

  it('should validate email format', async () => {
    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
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
    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
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

    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
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
    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
    });

    const component = wrapper.vm as any;
    component.handleCancel();

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('update:visible')).toBeTruthy();
  });

  it('should reset form when opening in create mode', async () => {
    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: false,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
    });

    const component = wrapper.vm as any;
    component.formData.first_name = 'Test';

    await wrapper.setProps({ visible: true });

    expect(component.formData.first_name).toBe('');
  });

  it('should display correct dialog title', () => {
    const createWrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
    });

    expect((createWrapper.vm as any).dialogTitle).toBe('Add Driver');

    const editWrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'edit',
        leagueId: 1,
      },
      ...getStubOptions(),
    });

    expect((editWrapper.vm as any).dialogTitle).toBe('Edit Driver');
  });
});
