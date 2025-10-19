import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DriverFormDialog from '../DriverFormDialog.vue';
import type { LeagueDriver } from '@user/types/driver';

// Mock PrimeVue components
vi.mock('primevue/dialog', () => ({
  default: {
    name: 'Dialog',
    template: '<div v-if="visible"><slot></slot><slot name="footer"></slot></div>',
    props: ['visible', 'header', 'modal', 'closable', 'draggable'],
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

describe('DriverFormDialog', () => {
  let mockDriver: LeagueDriver;

  beforeEach(() => {
    mockDriver = {
      id: 1,
      first_name: 'John',
      last_name: 'Smith',
      nickname: 'JSmith',
      email: 'john@example.com',
      phone: '+1234567890',
      psn_id: 'JohnSmith77',
      gt7_id: null,
      iracing_id: null,
      iracing_customer_id: null,
      driver_number: 5,
      status: 'active',
      league_notes: 'Top performer',
      added_to_league_at: '2025-10-18T10:00:00Z',
      created_at: '2025-10-18T10:00:00Z',
      updated_at: '2025-10-18T10:00:00Z',
    };
  });

  it('should render in create mode', () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
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
      },
    });

    await wrapper.vm.$nextTick();

    const component = wrapper.vm as any;
    expect(component.formData.first_name).toBe('John');
    expect(component.formData.last_name).toBe('Smith');
    expect(component.formData.psn_id).toBe('JohnSmith77');
    expect(component.formData.driver_number).toBe(5);
  });

  it('should validate that at least one name is required', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
      },
    });

    const component = wrapper.vm as any;
    component.formData.psn_id = 'TestID';

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
    expect(component.errors.name).toBeDefined();
  });

  it('should validate that at least one platform ID is required', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
      },
    });

    const component = wrapper.vm as any;
    component.formData.first_name = 'John';

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
    expect(component.errors.platform).toBeDefined();
  });

  it('should validate email format', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
      },
    });

    const component = wrapper.vm as any;
    component.formData.first_name = 'John';
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
      },
    });

    const component = wrapper.vm as any;
    component.formData.first_name = 'John';
    component.formData.psn_id = 'TestID';
    component.formData.driver_number = 1000;

    const isValid = component.validateForm();

    expect(isValid).toBe(false);
    expect(component.errors.driver_number).toBeDefined();
  });

  it('should emit save event with valid data', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
      },
    });

    const component = wrapper.vm as any;
    component.formData.first_name = 'John';
    component.formData.last_name = 'Smith';
    component.formData.psn_id = 'JohnSmith77';
    component.formData.driver_number = 5;

    component.handleSubmit();

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('save')).toBeTruthy();
    const emittedData = wrapper.emitted('save')?.[0]?.[0] as any;
    expect(emittedData.first_name).toBe('John');
    expect(emittedData.psn_id).toBe('JohnSmith77');
  });

  it('should emit cancel event', async () => {
    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'create',
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
      },
    });

    expect((createWrapper.vm as any).dialogTitle).toBe('Add Driver');

    const editWrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        mode: 'edit',
      },
    });

    expect((editWrapper.vm as any).dialogTitle).toBe('Edit Driver');
  });
});
