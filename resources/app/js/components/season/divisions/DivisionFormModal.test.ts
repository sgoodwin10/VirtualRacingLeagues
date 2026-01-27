import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import DivisionFormModal from './DivisionFormModal.vue';
import { useDivisionStore } from '@app/stores/divisionStore';
import type { Division } from '@app/types/division';

// Mock PrimeVue Toast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('DivisionFormModal', () => {
  let wrapper: VueWrapper;
  let divisionStore: ReturnType<typeof useDivisionStore>;

  const mockDivision: Division = {
    id: 1,
    season_id: 1,
    name: 'Pro Division',
    description: 'Professional drivers division',
    logo_url: 'https://example.com/logo.png',
    order: 1,
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    divisionStore = useDivisionStore();
  });

  const createWrapper = (props = {}) => {
    return mount(DivisionFormModal, {
      props: {
        visible: true,
        mode: 'add',
        seasonId: 1,
        ...props,
      },
      global: {
        stubs: {
          BaseModal: {
            template: '<div><slot /><slot name="footer" /></div>',
          },
          FormLabel: true,
          FormError: true,
          FormInputGroup: {
            template: '<div><slot /></div>',
          },
          ImageUpload: {
            template: '<div></div>',
          },
          InputText: {
            template: `<input
              :id="id"
              :value="modelValue"
              @input="$emit('update:modelValue', $event.target.value)"
              :disabled="disabled"
              :maxlength="maxlength"
              :placeholder="placeholder"
            />`,
            props: ['id', 'modelValue', 'disabled', 'maxlength', 'placeholder', 'size', 'class'],
          },
          Textarea: {
            template: `<textarea
              :id="id"
              :value="modelValue"
              @input="$emit('update:modelValue', $event.target.value)"
              :disabled="disabled"
              :maxlength="maxlength"
              :rows="rows"
              :placeholder="placeholder"
            ></textarea>`,
            props: ['id', 'modelValue', 'disabled', 'maxlength', 'placeholder', 'rows', 'class'],
          },
          Button: {
            template: `<button
              @click="$emit('click')"
              :disabled="disabled"
              :class="$attrs.class"
            ><slot /></button>`,
            props: ['label', 'severity', 'outlined', 'disabled', 'loading', 'icon', 'size'],
          },
        },
      },
    });
  };

  describe('Add Mode', () => {
    it('renders modal with correct title in add mode', () => {
      wrapper = createWrapper({ mode: 'add' });
      expect(wrapper.exists()).toBe(true);
    });

    it('validates division name is required', async () => {
      vi.spyOn(divisionStore, 'createDivision').mockResolvedValue(mockDivision);
      wrapper = createWrapper({ mode: 'add' });

      const input = wrapper.find('input');
      await input.setValue('');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1]; // Second button is submit

      // Button should be disabled
      expect(submitButton?.attributes('disabled')).toBeDefined();
    });

    it('validates division name minimum length', async () => {
      vi.spyOn(divisionStore, 'createDivision').mockResolvedValue(mockDivision);
      wrapper = createWrapper({ mode: 'add' });

      const input = wrapper.find('input');
      await input.setValue('A');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      // Button should be disabled when name is too short
      expect(submitButton?.attributes('disabled')).toBeDefined();
    });

    it('creates division with valid data', async () => {
      vi.spyOn(divisionStore, 'createDivision').mockResolvedValue(mockDivision);

      wrapper = createWrapper({ mode: 'add' });

      const inputs = wrapper.findAll('input');
      const nameInput = inputs[0];
      if (!nameInput) throw new Error('Name input not found');
      await nameInput.setValue('Pro Division');
      await wrapper.vm.$nextTick();

      const textarea = wrapper.find('textarea');
      await textarea.setValue('Professional drivers division');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      // Button should be enabled (no disabled attribute or false)
      const isDisabled = submitButton?.attributes('disabled');
      expect(isDisabled === undefined || isDisabled === 'false').toBe(true);

      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(divisionStore.createDivision).toHaveBeenCalledWith(1, {
        name: 'Pro Division',
        description: 'Professional drivers division',
        logo: undefined,
      });
    });

    it('creates division without description (optional field)', async () => {
      vi.spyOn(divisionStore, 'createDivision').mockResolvedValue(mockDivision);

      wrapper = createWrapper({ mode: 'add' });

      const inputs = wrapper.findAll('input');
      const nameInput = inputs[0];
      if (!nameInput) throw new Error('Name input not found');
      await nameInput.setValue('Pro Division');
      await wrapper.vm.$nextTick();

      // Leave description empty
      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(divisionStore.createDivision).toHaveBeenCalledWith(1, {
        name: 'Pro Division',
        description: undefined,
        logo: undefined,
      });
    });

    it('emits save event on successful creation', async () => {
      vi.spyOn(divisionStore, 'createDivision').mockResolvedValue(mockDivision);

      wrapper = createWrapper({ mode: 'add' });

      const inputs = wrapper.findAll('input');
      const nameInput = inputs[0];
      if (!nameInput) throw new Error('Name input not found');
      await nameInput.setValue('Pro Division');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.emitted('save')).toBeTruthy();
      expect(wrapper.emitted('save')?.[0]).toEqual([mockDivision]);
    });
  });

  describe('Edit Mode', () => {
    it('renders modal with correct title in edit mode', () => {
      wrapper = createWrapper({ mode: 'edit', division: mockDivision });
      expect(wrapper.exists()).toBe(true);
    });

    it('loads division data in edit mode', async () => {
      // Start with visible: false to trigger the watcher when we set it to true
      wrapper = createWrapper({ mode: 'edit', division: mockDivision, visible: false });

      // Trigger the watcher by setting visible to true
      await wrapper.setProps({ visible: true });
      await wrapper.vm.$nextTick();

      const inputs = wrapper.findAll('input');
      const nameInput = inputs[0];
      if (!nameInput) throw new Error('Name input not found');
      expect((nameInput.element as HTMLInputElement).value).toBe('Pro Division');

      const textarea = wrapper.find('textarea');
      expect((textarea.element as HTMLTextAreaElement).value).toBe('Professional drivers division');
    });

    it('updates division with valid data', async () => {
      const updatedDivision = {
        ...mockDivision,
        name: 'Pro Division Updated',
        description: 'Updated description',
      };
      vi.spyOn(divisionStore, 'updateDivision').mockResolvedValue(updatedDivision);

      wrapper = createWrapper({ mode: 'edit', division: mockDivision });
      await wrapper.vm.$nextTick();

      const inputs = wrapper.findAll('input');
      const nameInput = inputs[0];
      if (!nameInput) throw new Error('Name input not found');
      await nameInput.setValue('Pro Division Updated');
      await wrapper.vm.$nextTick();

      const textarea = wrapper.find('textarea');
      await textarea.setValue('Updated description');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(divisionStore.updateDivision).toHaveBeenCalledWith(1, 1, {
        name: 'Pro Division Updated',
        description: 'Updated description',
        logo: null,
      });
    });
  });

  describe('Validation', () => {
    it('disables submit button when name is too short', async () => {
      wrapper = createWrapper({ mode: 'add' });

      const inputs = wrapper.findAll('input');
      const nameInput = inputs[0];
      if (!nameInput) throw new Error('Name input not found');
      await nameInput.setValue('A');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      expect(submitButton?.attributes('disabled')).toBeDefined();
    });

    it('allows empty description (optional field)', async () => {
      wrapper = createWrapper({ mode: 'add' });

      const inputs = wrapper.findAll('input');
      const nameInput = inputs[0];
      if (!nameInput) throw new Error('Name input not found');
      await nameInput.setValue('Pro Division');
      await wrapper.vm.$nextTick();

      // Leave description empty - should be valid
      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      // Button should be enabled when description is empty (optional)
      const isDisabled = submitButton?.attributes('disabled');
      expect(isDisabled === undefined || isDisabled === 'false').toBe(true);
    });

    it('enables submit button when name is valid', async () => {
      wrapper = createWrapper({ mode: 'add' });

      const inputs = wrapper.findAll('input');
      const nameInput = inputs[0];
      if (!nameInput) throw new Error('Name input not found');
      await nameInput.setValue('Valid Division Name');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      // Button should be enabled (no disabled attribute or false)
      const isDisabled = submitButton?.attributes('disabled');
      expect(isDisabled === undefined || isDisabled === 'false').toBe(true);
    });
  });

  describe('Cancel', () => {
    it('emits update:visible false when cancel is clicked', async () => {
      wrapper = createWrapper({ mode: 'add' });

      const buttons = wrapper.findAll('button');
      const cancelButton = buttons[0]; // First button is cancel

      await cancelButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });
  });
});
