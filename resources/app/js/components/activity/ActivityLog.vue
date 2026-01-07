<script setup lang="ts">
import { onMounted } from 'vue';
import { useActivityLog } from '@app/composables/useActivityLog';
import ActivityItem from '@app/components/activity/ActivityItem.vue';
import ActivityFilters from '@app/components/activity/ActivityFilters.vue';
import Skeleton from 'primevue/skeleton';
import Button from '@app/components/common/buttons/Button.vue';
import type { ActivityFilterParams } from '@app/types/activityLog';
import HTag from '@app/components/common/HTag.vue';
import { PhArrowClockwise } from '@phosphor-icons/vue';

interface Props {
  leagueId: number;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
});

const {
  formattedActivities,
  loading,
  error,
  currentPage,
  lastPage,
  total,
  fetchActivities,
  updateFilters,
  goToPage,
  refresh,
} = useActivityLog(props.leagueId);

onMounted(() => {
  fetchActivities();
});

function handleFilterChange(filters: ActivityFilterParams) {
  updateFilters(filters);
}

function handleClearFilters() {
  updateFilters({
    entity_type: undefined,
    action: undefined,
    from_date: undefined,
    to_date: undefined,
  });
}

function handleLoadMore() {
  if (currentPage.value < lastPage.value) {
    goToPage(currentPage.value + 1);
  }
}
</script>

<template>
  <div class="activity-log">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <HTag v-if="!compact" :level="2">Activity Log</HTag>
        <p v-if="!loading && total && !compact" class="text-sm text-[var(--text-muted)] mt-1">
          {{ total }} {{ total === 1 ? 'activity' : 'activities' }}
        </p>
      </div>
      <Button
        label="Refresh Activity Log"
        :icon="PhArrowClockwise"
        variant="warning"
        size="sm"
        @click="refresh"
      />
    </div>

    <!-- Filters -->
    <ActivityFilters
      v-if="!compact"
      class="mb-6"
      @filter="handleFilterChange"
      @clear="handleClearFilters"
    />

    <!-- Error state -->
    <div
      v-if="error && !loading"
      class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-circle"></i>
        <p class="font-medium">Failed to load activities</p>
      </div>
      <p class="text-sm mt-1">{{ error }}</p>
      <Button label="Try Again" severity="danger" size="small" class="mt-3" @click="refresh" />
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && formattedActivities.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="flex gap-3">
        <Skeleton shape="circle" size="2.5rem" />
        <div class="flex-1">
          <Skeleton width="70%" height="1.25rem" class="mb-2" />
          <Skeleton width="40%" height="0.875rem" class="mb-2" />
          <Skeleton width="30%" height="0.875rem" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="!loading && formattedActivities.length === 0 && !error"
      class="text-center py-12 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]"
    >
      <i class="pi pi-history text-6xl text-[var(--text-muted)] mb-4"></i>
      <h3 class="text-lg font-mono font-semibold text-[var(--text-primary)] mb-2">
        No activities found
      </h3>
      <p class="text-[var(--text-muted)]">
        There are no activities to display for this league yet.
      </p>
    </div>

    <!-- Activity list -->
    <div
      v-if="!loading && formattedActivities.length > 0"
      class="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-4"
    >
      <ActivityItem
        v-for="activity in formattedActivities"
        :key="activity.id"
        :activity="activity"
        :compact="compact"
      />
    </div>

    <!-- Load more / Pagination -->
    <div
      v-if="!loading && formattedActivities.length > 0 && currentPage < lastPage"
      class="mt-6 text-center"
    >
      <Button label="Load More" icon="pi pi-chevron-down" outlined @click="handleLoadMore" />
      <p class="text-sm text-[var(--text-muted)] mt-2">
        Showing page {{ currentPage }} of {{ lastPage }}
      </p>
    </div>

    <!-- End of list message -->
    <div
      v-if="!loading && formattedActivities.length > 0 && currentPage >= lastPage"
      class="mt-6 text-center text-sm text-[var(--text-muted)]"
    >
      You've reached the end of the activity log
    </div>
  </div>
</template>
