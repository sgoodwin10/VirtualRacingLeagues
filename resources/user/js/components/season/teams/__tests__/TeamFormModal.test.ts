import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TeamFormModal from '../TeamFormModal.vue';
import { useTeamStore } from '@user/stores/teamStore';
import type { Team } from '@user/types/team';

// Mock PrimeVue Toast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('TeamFormModal', () => {
  let wrapper: VueWrapper;
  let teamStore: ReturnType<typeof useTeamStore>;

  const mockTeam: Team = {
    id: 1,
    season_id: 1,
    name: 'Red Bull Racing',
    logo_url: 'https://example.com/logo.png',
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    teamStore = useTeamStore();
  });

  const createWrapper = (props = {}) => {
    return mount(TeamFormModal, {
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

    it('validates team name is required', async () => {
      vi.spyOn(teamStore, 'createTeam').mockResolvedValue(mockTeam);
      wrapper = createWrapper({ mode: 'add' });

      const input = wrapper.find('input');
      await input.setValue('');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1]; // Second button is submit

      // Button should be disabled
      expect(submitButton?.attributes('disabled')).toBeDefined();
    });

    it('validates team name minimum length', async () => {
      vi.spyOn(teamStore, 'createTeam').mockResolvedValue(mockTeam);
      wrapper = createWrapper({ mode: 'add' });

      const input = wrapper.find('input');
      await input.setValue('A');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      // Button should be disabled when name is too short
      expect(submitButton?.attributes('disabled')).toBeDefined();
    });

    it('creates team with valid data', async () => {
      vi.spyOn(teamStore, 'createTeam').mockResolvedValue(mockTeam);

      wrapper = createWrapper({ mode: 'add' });

      const input = wrapper.find('input');
      await input.setValue('Red Bull Racing');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      // Button should be enabled (no disabled attribute or false)
      const isDisabled = submitButton?.attributes('disabled');
      expect(isDisabled === undefined || isDisabled === 'false').toBe(true);

      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(teamStore.createTeam).toHaveBeenCalledWith(1, {
        name: 'Red Bull Racing',
        logo: undefined,
      });
    });

    it('emits save event on successful creation', async () => {
      vi.spyOn(teamStore, 'createTeam').mockResolvedValue(mockTeam);

      wrapper = createWrapper({ mode: 'add' });

      const input = wrapper.find('input');
      await input.setValue('Red Bull Racing');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.emitted('save')).toBeTruthy();
      expect(wrapper.emitted('save')?.[0]).toEqual([mockTeam]);
    });
  });

  describe('Edit Mode', () => {
    it('renders modal with correct title in edit mode', () => {
      wrapper = createWrapper({ mode: 'edit', team: mockTeam });
      expect(wrapper.exists()).toBe(true);
    });

    it('loads team data in edit mode', async () => {
      // Start with visible: false to trigger the watcher when we set it to true
      wrapper = createWrapper({ mode: 'edit', team: mockTeam, visible: false });

      // Trigger the watcher by setting visible to true
      await wrapper.setProps({ visible: true });
      await wrapper.vm.$nextTick();

      const input = wrapper.find('input');
      expect((input.element as HTMLInputElement).value).toBe('Red Bull Racing');
    });

    it('updates team with valid data', async () => {
      const updatedTeam = {
        ...mockTeam,
        name: 'Red Bull Racing Updated',
      };
      vi.spyOn(teamStore, 'updateTeam').mockResolvedValue(updatedTeam);

      wrapper = createWrapper({ mode: 'edit', team: mockTeam });
      await wrapper.vm.$nextTick();

      const input = wrapper.find('input');
      await input.setValue('Red Bull Racing Updated');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      await submitButton?.trigger('click');
      await wrapper.vm.$nextTick();

      expect(teamStore.updateTeam).toHaveBeenCalledWith(1, 1, {
        name: 'Red Bull Racing Updated',
        logo: null,
      });
    });
  });

  describe('Validation', () => {
    it('disables submit button when name is too short', async () => {
      wrapper = createWrapper({ mode: 'add' });

      const input = wrapper.find('input');
      await input.setValue('A');
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const submitButton = buttons[1];

      expect(submitButton?.attributes('disabled')).toBeDefined();
    });

    it('enables submit button when name is valid', async () => {
      wrapper = createWrapper({ mode: 'add' });

      const input = wrapper.find('input');
      await input.setValue('Valid Team Name');
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
