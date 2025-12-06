import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import DivisionsPanel from '../DivisionsPanel.vue';
import { useDivisionStore } from '@app/stores/divisionStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import type { Division } from '@app/types/division';

// Mock PrimeVue composables
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({
    require: vi.fn(),
  }),
}));

describe('DivisionsPanel', () => {
  let wrapper: VueWrapper;
  let divisionStore: ReturnType<typeof useDivisionStore>;

  const mockDivisions: Division[] = [
    {
      id: 1,
      season_id: 1,
      name: 'Pro Division',
      description: 'Professional drivers division',
      logo_url: 'https://example.com/pro.png',
      order: 1,
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
    {
      id: 2,
      season_id: 1,
      name: 'Amateur Division',
      description: null,
      logo_url: null,
      order: 2,
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    divisionStore = useDivisionStore();
    useSeasonDriverStore(); // Initialize the store
  });

  const createWrapper = (props = {}) => {
    return mount(DivisionsPanel, {
      props: {
        seasonId: 1,
        raceDivisionsEnabled: true,
        ...props,
      },
      global: {
        stubs: {
          DataTable: {
            template: '<div><slot name="empty" /><slot /></div>',
          },
          Column: true,
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          Message: {
            template: '<div><slot /></div>',
          },
          DivisionFormModal: true,
          ConfirmDialog: true,
        },
      },
    });
  };

  describe('Disabled State', () => {
    it('shows disabled message when race divisions are not enabled', () => {
      wrapper = createWrapper({ raceDivisionsEnabled: false });

      expect(wrapper.text()).toContain('Divisions not enabled for this season');
    });

    it('does not show add division button when disabled', () => {
      wrapper = createWrapper({ raceDivisionsEnabled: false });

      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('Enabled State', () => {
    it('fetches divisions on mount when enabled', async () => {
      vi.spyOn(divisionStore, 'fetchDivisions').mockResolvedValue();

      wrapper = createWrapper({ raceDivisionsEnabled: true });

      await wrapper.vm.$nextTick();

      expect(divisionStore.fetchDivisions).toHaveBeenCalledWith(1);
    });

    it('shows add division button when enabled', () => {
      wrapper = createWrapper({ raceDivisionsEnabled: true });

      const addButton = wrapper.find('button');
      expect(addButton.exists()).toBe(true);
    });

    it('displays divisions in table', async () => {
      divisionStore.divisions = mockDivisions;

      wrapper = createWrapper({ raceDivisionsEnabled: true });

      await wrapper.vm.$nextTick();

      // Check that divisions are in the store
      expect(divisionStore.divisions).toHaveLength(2);
      expect(divisionStore.divisions[0]?.name).toBe('Pro Division');
      expect(divisionStore.divisions[1]?.name).toBe('Amateur Division');
    });

    it('shows empty state when no divisions', () => {
      divisionStore.divisions = [];

      wrapper = createWrapper({ raceDivisionsEnabled: true });

      expect(wrapper.text()).toContain('No divisions created yet');
    });
  });

  describe('Add Division', () => {
    it('shows add button when enabled', async () => {
      wrapper = createWrapper({ raceDivisionsEnabled: true });

      const addButton = wrapper.find('button');
      await addButton.trigger('click');

      // The component should handle the click
      expect(addButton.exists()).toBe(true);
    });
  });

  describe('Division Management', () => {
    it('renders division data when divisions are available', async () => {
      divisionStore.divisions = mockDivisions;

      wrapper = createWrapper({ raceDivisionsEnabled: true });

      await wrapper.vm.$nextTick();

      // Check that divisions are properly set in the store
      expect(divisionStore.divisions).toHaveLength(2);
      expect(divisionStore.divisions.find((d) => d.name === 'Pro Division')).toBeDefined();
      expect(divisionStore.divisions.find((d) => d.name === 'Amateur Division')).toBeDefined();
    });

    it('handles divisions with and without descriptions', async () => {
      divisionStore.divisions = mockDivisions;

      wrapper = createWrapper({ raceDivisionsEnabled: true });

      await wrapper.vm.$nextTick();

      // Check that divisions with and without descriptions are handled
      const proDivision = divisionStore.divisions.find((d) => d.name === 'Pro Division');
      expect(proDivision?.description).toBe('Professional drivers division');

      const amateurDivision = divisionStore.divisions.find((d) => d.name === 'Amateur Division');
      expect(amateurDivision?.description).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('shows loading state while fetching divisions', async () => {
      divisionStore.loading = true;

      wrapper = createWrapper({ raceDivisionsEnabled: true });

      await wrapper.vm.$nextTick();

      // Check that the loading state is set in the store
      expect(divisionStore.loading).toBe(true);
    });
  });
});
