<template>
  <DataTable
    :value="leagues"
    :loading="loading"
    :rows="15"
    :paginator="true"
    :rows-per-page-options="[15, 25, 50]"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    current-page-report-template="Showing {first} to {last} of {totalRecords} leagues"
    striped-rows
    responsive-layout="scroll"
    class="leagues-table"
  >
    <!-- Empty state -->
    <template #empty>
      <EmptyState message="No leagues found" />
    </template>

    <!-- Loading state -->
    <template #loading>
      <LoadingState message="Loading leagues..." />
    </template>

    <!-- ID Column -->
    <Column field="id" header="ID" :sortable="true" style="min-width: 80px">
      <template #body="{ data }">
        <span class="text-gray-700">{{ data.id }}</span>
      </template>
    </Column>

    <!-- Logo Column -->
    <Column field="logo_url" header="Logo" style="min-width: 80px">
      <template #body="{ data }">
        <img
          v-if="data.logo_url"
          :src="data.logo_url"
          :alt="`${data.name} logo`"
          class="w-8 h-8 rounded object-cover"
        />
        <div v-else class="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
          <span class="text-gray-400 text-xs">N/A</span>
        </div>
      </template>
    </Column>

    <!-- Name Column -->
    <Column field="name" header="Name" :sortable="true" style="min-width: 250px">
      <template #body="{ data }">
        <div>
          <p class="font-medium text-gray-900">{{ data.name }}</p>
          <p class="text-xs text-gray-500">{{ data.slug }}</p>
        </div>
      </template>
    </Column>

    <!-- Platforms Column -->
    <Column field="platforms" header="Platforms" style="min-width: 200px">
      <template #body="{ data }">
        <div v-if="data.platforms && data.platforms.length > 0" class="flex flex-wrap gap-1">
          <Badge
            v-for="platform in data.platforms"
            :key="platform.id"
            :text="platform.name"
            variant="info"
            size="sm"
          />
        </div>
        <span v-else class="text-gray-400">-</span>
      </template>
    </Column>

    <!-- Visibility Column -->
    <Column field="visibility" header="Visibility" :sortable="true" style="min-width: 120px">
      <template #body="{ data }">
        <Badge
          :text="getVisibilityLabel(data.visibility)"
          :variant="getVisibilityVariant(data.visibility)"
        />
      </template>
    </Column>

    <!-- Status Column -->
    <Column field="status" header="Status" :sortable="true" style="min-width: 100px">
      <template #body="{ data }">
        <Badge
          :text="getStatusLabel(data.status)"
          :variant="getStatusVariant(data.status)"
          :icon="getStatusIcon(data.status)"
        />
      </template>
    </Column>

    <!-- Manager Column -->
    <Column field="owner" header="Manager" style="min-width: 180px">
      <template #body="{ data }">
        <div v-if="data.owner">
          <p class="text-sm text-gray-900">{{ getOwnerName(data.owner) }}</p>
          <p class="text-xs text-gray-500">{{ data.owner.email }}</p>
        </div>
        <span v-else class="text-gray-400">-</span>
      </template>
    </Column>

    <!-- Actions Column -->
    <Column header="Actions" :exportable="false" style="min-width: 120px">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            v-tooltip.top="'View'"
            icon="pi pi-eye"
            text
            rounded
            severity="secondary"
            size="small"
            @click="handleView(data)"
          />
          <Button
            v-if="data.status === 'active'"
            v-tooltip.top="'Archive'"
            icon="pi pi-archive"
            text
            rounded
            severity="warning"
            size="small"
            @click="handleArchive(data)"
          />
          <Button
            v-if="data.status === 'archived'"
            v-tooltip.top="'Delete'"
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            @click="handleDelete(data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Badge from '@admin/components/common/Badge.vue';
import EmptyState from '@admin/components/common/EmptyState.vue';
import LoadingState from '@admin/components/common/LoadingState.vue';
import type { League, LeagueVisibility, LeagueStatus } from '@admin/types/league';

/**
 * Props interface for LeaguesTable component
 */
export interface LeaguesTableProps {
  /**
   * Array of leagues to display
   */
  leagues?: League[];

  /**
   * Whether the table is loading
   */
  loading?: boolean;
}

/**
 * Emits interface for LeaguesTable component
 */
export interface LeaguesTableEmits {
  /**
   * Emitted when user clicks view
   */
  (event: 'view', league: League): void;

  /**
   * Emitted when user clicks archive
   */
  (event: 'archive', league: League): void;

  /**
   * Emitted when user clicks delete
   */
  (event: 'delete', league: League): void;
}

// Props
withDefaults(defineProps<LeaguesTableProps>(), {
  leagues: () => [],
  loading: false,
});

// Emits
const emit = defineEmits<LeaguesTableEmits>();

/**
 * Get visibility label
 */
const getVisibilityLabel = (visibility: LeagueVisibility): string => {
  const labels: Record<LeagueVisibility, string> = {
    public: 'Public',
    private: 'Private',
    unlisted: 'Unlisted',
  };
  return labels[visibility] || visibility;
};

/**
 * Get visibility badge variant
 */
const getVisibilityVariant = (
  visibility: LeagueVisibility,
): 'success' | 'warning' | 'secondary' => {
  const variants: Record<LeagueVisibility, 'success' | 'warning' | 'secondary'> = {
    public: 'success',
    private: 'warning',
    unlisted: 'secondary',
  };
  return variants[visibility] || 'secondary';
};

/**
 * Get status label
 */
const getStatusLabel = (status: LeagueStatus): string => {
  const labels: Record<LeagueStatus, string> = {
    active: 'Active',
    archived: 'Archived',
  };
  return labels[status] || status;
};

/**
 * Get status badge variant
 */
const getStatusVariant = (status: LeagueStatus): 'success' | 'danger' => {
  const variants: Record<LeagueStatus, 'success' | 'danger'> = {
    active: 'success',
    archived: 'danger',
  };
  return variants[status] || 'success';
};

/**
 * Get status icon
 */
const getStatusIcon = (status: LeagueStatus): string => {
  const icons: Record<LeagueStatus, string> = {
    active: 'pi pi-check-circle',
    archived: 'pi pi-times-circle',
  };
  return icons[status] || '';
};

/**
 * Get owner full name
 */
const getOwnerName = (owner: { first_name: string; last_name: string; name?: string }): string => {
  return owner.name || `${owner.first_name} ${owner.last_name}`.trim();
};

/**
 * Handle view click
 */
const handleView = (league: League): void => {
  emit('view', league);
};

/**
 * Handle archive click
 */
const handleArchive = (league: League): void => {
  emit('archive', league);
};

/**
 * Handle delete click
 */
const handleDelete = (league: League): void => {
  emit('delete', league);
};
</script>

<style scoped></style>
