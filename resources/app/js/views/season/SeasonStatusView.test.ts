import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SeasonStatusView from './SeasonStatusView.vue';
import { useSeasonStore } from '@app/stores/seasonStore';
import type { Season } from '@app/types/season';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      seasonId: '1',
      leagueId: '1',
      competitionId: '1',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock PrimeVue hooks
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

describe('SeasonStatusView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mountComponent = (season: Season | null = null) => {
    const seasonStore = useSeasonStore();
    if (season) {
      seasonStore.currentSeason = season;
    }

    return mount(SeasonStatusView, {
      global: {
        plugins: [PrimeVue, ConfirmationService, ToastService],
        stubs: {
          SeasonSettings: {
            name: 'SeasonSettings',
            props: ['season'],
            template:
              '<div data-testid="season-settings">Season Settings: {{ season?.name }}</div>',
          },
        },
      },
    });
  };

  const mockSeason = {
    id: 1,
    name: 'Test Season',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    competitionId: 1,
    leagueId: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  } as any;

  it('does not render SeasonSettings when season is not loaded', () => {
    const wrapper = mountComponent(null);

    expect(wrapper.find('[data-testid="season-settings"]').exists()).toBe(false);
  });

  it('renders SeasonSettings component when season is loaded', () => {
    const wrapper = mountComponent(mockSeason);

    expect(wrapper.find('[data-testid="season-settings"]').exists()).toBe(true);
  });

  it('passes season prop to SeasonSettings', () => {
    const wrapper = mountComponent(mockSeason);

    const seasonSettings = wrapper.find('[data-testid="season-settings"]');
    expect(seasonSettings.text()).toContain('Test Season');
  });

  it('renders within a container div', () => {
    const wrapper = mountComponent(mockSeason);

    expect(wrapper.element.tagName).toBe('DIV');
  });
});
