import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, computed } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ActivityLog from './ActivityLog.vue';
import { useActivityLog } from '@app/composables/useActivityLog';
import type { FormattedActivity, Activity, ActivityFilterParams } from '@app/types/activityLog';

vi.mock('@app/composables/useActivityLog');

// Mock child components that use PrimeVue heavily
vi.mock('../ActivityFilters.vue', () => ({
  default: {
    name: 'ActivityFilters',
    template: '<div class="activity-filters"></div>',
    emits: ['filter', 'clear'],
  },
}));

vi.mock('../ActivityItem.vue', () => ({
  default: {
    name: 'ActivityItem',
    template: '<div class="activity-item">{{ activity.description }}</div>',
    props: ['activity'],
  },
}));

describe('ActivityLog', () => {
  const mockFormattedActivity: FormattedActivity = {
    id: 1,
    description: 'Created driver John Doe',
    icon: 'pi-user',
    iconColor: 'text-green-500',
    causer: 'Admin User',
    entityType: 'driver',
    entityName: 'John Doe',
    action: 'create',
    context: 'F1 Championship > 2024',
    timestamp: 'Jan 1, 2024, 12:00 PM',
    relativeTime: '2 hours ago',
  };

  let mockFetchActivities: ReturnType<typeof vi.fn>;
  let mockUpdateFilters: ReturnType<typeof vi.fn>;
  let mockGoToPage: ReturnType<typeof vi.fn>;
  let mockRefresh: ReturnType<typeof vi.fn>;

  const globalConfig = {
    global: {
      plugins: [
        [
          PrimeVue,
          {
            theme: {
              preset: Aura,
            },
          },
        ],
      ] as unknown as any[],
      stubs: {
        Skeleton: { template: '<div class="skeleton"></div>' },
        Button: {
          template:
            '<button v-bind="$attrs" @click="$emit(\'click\')">{{ label }}<slot /></button>',
          props: ['label', 'icon', 'loading', 'outlined', 'severity', 'size'],
        },
      },
    },
  };

  function createMockReturn(overrides: Partial<ReturnType<typeof useActivityLog>> = {}) {
    return {
      activities: ref<Activity[]>([]),
      formattedActivities: computed(() => [] as FormattedActivity[]),
      loading: ref(false),
      error: ref<string | null>(null),
      currentPage: ref(1),
      lastPage: ref(1),
      total: ref(0),
      filters: ref<ActivityFilterParams>({ limit: 25, page: 1 }),
      fetchActivities: mockFetchActivities as any,
      updateFilters: mockUpdateFilters as any,
      goToPage: mockGoToPage as any,
      refresh: mockRefresh as any,
      ...overrides,
    } as ReturnType<typeof useActivityLog>;
  }

  beforeEach(() => {
    vi.clearAllMocks();

    mockFetchActivities = vi.fn();
    mockUpdateFilters = vi.fn();
    mockGoToPage = vi.fn();
    mockRefresh = vi.fn();

    vi.mocked(useActivityLog).mockReturnValue(createMockReturn());
  });

  it('renders header correctly', () => {
    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    expect(wrapper.text()).toContain('Activity Log');
  });

  it('fetches activities on mount', async () => {
    mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    await flushPromises();

    expect(mockFetchActivities).toHaveBeenCalled();
  });

  it('displays total count when activities are loaded', () => {
    vi.mocked(useActivityLog).mockReturnValue(
      createMockReturn({
        formattedActivities: computed(() => [mockFormattedActivity]),
        total: ref(5),
      }),
    );

    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    expect(wrapper.text()).toContain('5 activities');
  });

  it('shows loading skeleton when loading', () => {
    vi.mocked(useActivityLog).mockReturnValue(
      createMockReturn({
        loading: ref(true),
      }),
    );

    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    expect(wrapper.find('.skeleton').exists()).toBe(true);
  });

  it('shows empty state when no activities', () => {
    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    expect(wrapper.text()).toContain('No activities found');
    expect(wrapper.find('.pi-history').exists()).toBe(true);
  });

  it('shows error state when error occurs', () => {
    vi.mocked(useActivityLog).mockReturnValue(
      createMockReturn({
        error: ref<string | null>('Failed to load activities'),
      }),
    );

    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    expect(wrapper.text()).toContain('Failed to load activities');
    expect(wrapper.find('.pi-exclamation-circle').exists()).toBe(true);
  });

  it('displays activities when loaded', () => {
    vi.mocked(useActivityLog).mockReturnValue(
      createMockReturn({
        formattedActivities: computed(() => [mockFormattedActivity]),
        total: ref(1),
      }),
    );

    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    expect(wrapper.text()).toContain('Created driver John Doe');
  });

  it('calls refresh when refresh button is clicked', async () => {
    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    // Find the button that says "Refresh"
    const buttons = wrapper.findAll('button');
    const refreshButton = buttons.find((btn) => btn.text().includes('Refresh'));
    expect(refreshButton).toBeDefined();
    await refreshButton!.trigger('click');

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('handles filter changes', async () => {
    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    const filters = wrapper.findComponent({ name: 'ActivityFilters' });
    await filters.vm.$emit('filter', { entity_type: 'driver' });

    expect(mockUpdateFilters).toHaveBeenCalledWith({ entity_type: 'driver' });
  });

  it('handles clear filters', async () => {
    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    const filters = wrapper.findComponent({ name: 'ActivityFilters' });
    await filters.vm.$emit('clear');

    expect(mockUpdateFilters).toHaveBeenCalledWith({
      entity_type: undefined,
      action: undefined,
      from_date: undefined,
      to_date: undefined,
    });
  });

  it('shows load more button when more pages exist', () => {
    vi.mocked(useActivityLog).mockReturnValue(
      createMockReturn({
        formattedActivities: computed(() => [mockFormattedActivity]),
        currentPage: ref(1),
        lastPage: ref(3),
        total: ref(75),
      }),
    );

    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    expect(wrapper.text()).toContain('Load More');
    expect(wrapper.text()).toContain('Showing page 1 of 3');
  });

  it('calls goToPage when load more is clicked', async () => {
    vi.mocked(useActivityLog).mockReturnValue(
      createMockReturn({
        formattedActivities: computed(() => [mockFormattedActivity]),
        currentPage: ref(1),
        lastPage: ref(3),
        total: ref(75),
      }),
    );

    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    // Find the button that says "Load More"
    const buttons = wrapper.findAll('button');
    const loadMoreButton = buttons.find((btn) => btn.text().includes('Load More'));
    expect(loadMoreButton).toBeDefined();
    await loadMoreButton!.trigger('click');

    expect(mockGoToPage).toHaveBeenCalledWith(2);
  });

  it('shows end of list message when on last page', () => {
    vi.mocked(useActivityLog).mockReturnValue(
      createMockReturn({
        formattedActivities: computed(() => [mockFormattedActivity]),
        currentPage: ref(3),
        lastPage: ref(3),
        total: ref(75),
      }),
    );

    const wrapper = mount(ActivityLog, {
      ...globalConfig,
      props: {
        leagueId: 1,
      },
    });

    expect(wrapper.text()).toContain("You've reached the end of the activity log");
    expect(wrapper.text()).not.toContain('Load More');
  });
});
