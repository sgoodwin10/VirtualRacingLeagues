import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithStubs } from '@app/__tests__/setup';
import { createPinia, setActivePinia } from 'pinia';
import DriverFormDialog from './modals/DriverFormDialog.vue';
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

  it('should validate that at least a name field OR a platform ID is required', async () => {
    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
    });

    const component = wrapper.vm as any;
    // No name fields and no platform IDs

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
    expect(component.errors.identifier).toBeDefined();
  });

  it('should pass validation with only nickname (no platform ID)', async () => {
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
    // No platform IDs provided

    const isValid = component.validateForm();

    expect(isValid).toBe(true);
    expect(component.errors.identifier).toBeUndefined();
  });

  it('should pass validation with only a platform ID (no name)', async () => {
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
    // No name fields provided
    component.formData.psn_id = 'TestID';

    const isValid = component.validateForm();

    expect(isValid).toBe(true);
    expect(component.errors.identifier).toBeUndefined();
  });

  it('should pass validation with both name and platform ID', async () => {
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

  it('should pass validation with only first name (no platform ID)', async () => {
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
    // No platform IDs provided

    const isValid = component.validateForm();

    expect(isValid).toBe(true);
    expect(component.errors.identifier).toBeUndefined();
  });

  it('should pass validation with only last name (no platform ID)', async () => {
    const wrapper = mountWithStubs(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        leagueId: 1,
      },
      ...getStubOptions(),
    });

    const component = wrapper.vm as any;
    component.formData.last_name = 'Smith';
    // No platform IDs provided

    const isValid = component.validateForm();

    expect(isValid).toBe(true);
    expect(component.errors.identifier).toBeUndefined();
  });

  it('should pass validation with only discord_id (no name)', async () => {
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
    // No name fields provided

    const isValid = component.validateForm();

    expect(isValid).toBe(true);
    expect(component.errors.identifier).toBeUndefined();
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

  describe('Nickname auto-population', () => {
    it('should auto-populate nickname from discord_id (highest priority)', async () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      // Simulate user entering discord_id (goes through the handler)
      component.handleDiscordIdUpdate('testuser#1234');

      // Nickname should auto-populate from discord_id
      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      const formData = component.getFormData();
      expect(formData.nickname).toBe('testuser#1234');
    });

    it('should auto-populate nickname from platform ID when discord_id is empty', async () => {
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

      // Simulate user entering platform ID (goes through the handler)
      component.handlePlatformFieldUpdate('psn_id', 'PSNUser123');

      // Nickname should auto-populate from platform ID
      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      const formData = component.getFormData();
      expect(formData.nickname).toBe('PSNUser123');
    });

    it('should auto-populate nickname from first_name (lowest priority)', async () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      // Simulate user entering first_name (goes through the handler)
      component.handleFirstNameUpdate('John');

      // Nickname should auto-populate from first_name
      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      const formData = component.getFormData();
      expect(formData.nickname).toBe('John');
    });

    it('should prioritize discord_id over platform ID', async () => {
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

      // Set platform ID first
      component.handlePlatformFieldUpdate('psn_id', 'PSNUser123');
      expect(component.getFormData().nickname).toBe('PSNUser123');

      // Now set discord_id - should override
      component.handleDiscordIdUpdate('discord#5678');

      // Nickname should now be from discord_id (higher priority)
      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      expect(component.getFormData().nickname).toBe('discord#5678');
    });

    it('should prioritize platform ID over first_name', async () => {
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

      // Set first_name first
      component.handleFirstNameUpdate('John');
      expect(component.getFormData().nickname).toBe('John');

      // Now set platform ID - should override
      component.handlePlatformFieldUpdate('psn_id', 'PSNUser123');

      // Nickname should now be from platform ID (higher priority)
      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      expect(component.getFormData().nickname).toBe('PSNUser123');
    });

    it('should NOT auto-populate when user manually enters nickname', async () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      // User manually enters nickname
      component.handleNicknameUpdate('MyCustomNick');

      expect(component.getFormData().nickname).toBe('MyCustomNick');

      // Now set discord_id - should NOT override manual entry
      component.handleDiscordIdUpdate('discord#1234');

      // Nickname should remain the manual entry (proving manual entry flag is working)
      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      expect(component.getFormData().nickname).toBe('MyCustomNick');
    });

    it('should NOT auto-populate in edit mode', async () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'edit',
          driver: mockDriver,
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;
      await wrapper.vm.$nextTick();

      // Initial nickname from driver data
      const initialNickname = component.formData.nickname;

      // Change discord_id in edit mode
      component.formData.discord_id = 'newdiscord#9999';
      await wrapper.vm.$nextTick();

      // Nickname should NOT auto-populate in edit mode
      expect(component.formData.nickname).toBe(initialNickname);
    });

    it('should clear nickname when all source fields are empty', async () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      // Set discord_id
      component.handleDiscordIdUpdate('testuser#1234');
      expect(component.getFormData().nickname).toBe('testuser#1234');

      // Clear discord_id
      component.handleDiscordIdUpdate('');

      // Nickname should be cleared
      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      expect(component.getFormData().nickname).toBe('');
    });

    it('should update nickname when switching from lower to higher priority field', async () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      // Start with first_name
      component.handleFirstNameUpdate('John');
      expect(component.getFormData().nickname).toBe('John');

      // Add discord_id (higher priority)
      component.handleDiscordIdUpdate('johndoe#1234');

      // Should switch to discord_id
      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      expect(component.getFormData().nickname).toBe('johndoe#1234');
    });

    it('should reset userHasEnteredNickname flag when form is reset', async () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      // User manually enters nickname
      component.handleNicknameUpdate('CustomNick');
      expect(component.getFormData().nickname).toBe('CustomNick');

      // Reset form
      component.resetForm();

      // Auto-population should work again (proving flag was reset)
      component.handleDiscordIdUpdate('testuser#5678');

      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      expect(component.getFormData().nickname).toBe('testuser#5678');
    });

    it('should trim whitespace from auto-populated nickname', async () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      // Set discord_id with whitespace
      component.handleDiscordIdUpdate('  testuser#1234  ');

      // Nickname should be trimmed
      // Note: Don't call $nextTick here as it causes the visible watcher to reset the form
      expect(component.getFormData().nickname).toBe('testuser#1234');
    });
  });

  describe('Server Error Handling', () => {
    it('should set server error via setServerError method', () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;
      const errorMessage = "Driver with platform ID 'Nik_Makozi' is already in league 1";

      component.setServerError(errorMessage);

      expect(component.generalError).toBe(errorMessage);
    });

    it('should pass generalError to DriverEditSidebar component', async () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;
      const errorMessage = 'This is a server error';

      component.setServerError(errorMessage);
      await wrapper.vm.$nextTick();

      const sidebar = wrapper.findComponent({ name: 'DriverEditSidebar' });
      expect(sidebar.props('generalError')).toBe(errorMessage);
    });

    it('should clear generalError when form is validated', () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      // Set a server error
      component.setServerError('Some error');
      expect(component.generalError).toBe('Some error');

      // Validate form (should clear general error)
      component.handleDiscordIdUpdate('testuser');
      component.validateForm();

      expect(component.generalError).toBe('');
    });

    it('should clear generalError when form is reset', () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      // Set a server error
      component.setServerError('Some error');
      expect(component.generalError).toBe('Some error');

      // Reset form
      component.resetForm();

      expect(component.generalError).toBe('');
    });

    it('should expose generalError in defineExpose', () => {
      const wrapper = mountWithStubs(DriverFormDialog, {
        props: {
          visible: true,
          mode: 'create',
          leagueId: 1,
        },
        ...getStubOptions(),
      });

      const component = wrapper.vm as any;

      expect(component.generalError).toBeDefined();
      expect(typeof component.setServerError).toBe('function');
    });
  });
});
