<template>
  <DataTable
    :value="activities"
    :loading="loading"
    :rows="rowsPerPage"
    :paginator="paginator"
    :rows-per-page-options="[10, 25, 50, 100]"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    current-page-report-template="Showing {first} to {last} of {totalRecords} activities"
    striped-rows
    responsive-layout="scroll"
    class="activity-log-table"
  >
    <!-- Empty state -->
    <template #empty>
      <EmptyState message="No activities found" />
    </template>

    <!-- Loading state -->
    <template #loading>
      <LoadingState message="Loading activities..." />
    </template>

    <!-- ID Column -->
    <Column field="id" header="ID" :sortable="true" style="min-width: 80px">
      <template #body="{ data }">
        <span class="font-mono text-sm text-gray-700">{{ data.id }}</span>
      </template>
    </Column>

    <!-- Log Name Column -->
    <Column field="log_name" header="Type" :sortable="true" style="min-width: 100px">
      <template #body="{ data }">
        <Badge
          :text="data.log_name === 'admin' ? 'Admin' : 'User'"
          :variant="data.log_name === 'admin' ? 'purple' : 'info'"
          :icon="data.log_name === 'admin' ? 'pi-shield' : 'pi-user'"
        />
      </template>
    </Column>

    <!-- Event Column -->
    <Column v-if="showEvent" field="event" header="Event" :sortable="true" style="min-width: 110px">
      <template #body="{ data }">
        <Badge
          v-if="data.event"
          :text="formatEvent(data.event)"
          :variant="getEventVariant(data.event)"
        />
        <span v-else class="text-gray-400 text-sm">-</span>
      </template>
    </Column>

    <!-- Description Column -->
    <Column field="description" header="Description" style="min-width: 300px">
      <template #body="{ data }">
        <span class="text-gray-900">{{ data.description }}</span>
      </template>
    </Column>

    <!-- Causer Column -->
    <Column header="Performed By" style="min-width: 250px">
      <template #body="{ data }">
        <div v-if="data.causer" class="flex items-center gap-2">
          <div class="min-w-0">
            <p class="truncate">
              {{ getCauserName(data.causer) }}
            </p>
            <p class="text-md text-gray-500 truncate">
              {{ getCauserTypeLabel(data.causer_type) }} ID: {{ data.causer.id }}
            </p>
          </div>
        </div>
        <span v-else class="text-gray-400 text-sm">System</span>
      </template>
    </Column>

    <!-- Subject Column -->
    <Column v-if="showSubject" header="Target" style="min-width: 150px">
      <template #body="{ data }">
        <div v-if="data.subject_type && data.subject_id">
          <p class="">{{ formatSubjectType(data.subject_type) }}</p>
          <p class="text-md text-gray-500 font-mono">ID: {{ data.subject_id }}</p>
        </div>
        <span v-else class="text-gray-400 text-sm">-</span>
      </template>
    </Column>

    <!-- Date Column -->
    <Column field="created_at" header="Date" :sortable="true" style="min-width: 180px">
      <template #body="{ data }">
        <span class="text-gray-700 text-md">
          {{ formatDate(data.created_at) }}
        </span>
      </template>
    </Column>

    <!-- Actions Column -->
    <Column header="Actions" :exportable="false" style="min-width: 80px">
      <template #body="{ data }">
        <Button
          v-tooltip.top="'View Details'"
          icon="pi pi-eye"
          text
          rounded
          severity="info"
          size="small"
          @click="handleViewDetails(data)"
        />
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Badge, { type BadgeVariant } from '@admin/components/common/Badge.vue';
import EmptyState from '@admin/components/common/EmptyState.vue';
import LoadingState from '@admin/components/common/LoadingState.vue';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import type { Activity, EventType, Causer } from '@admin/types/activityLog';

/**
 * Props interface for ActivityLogTable component
 */
export interface ActivityLogTableProps {
  /**
   * Array of activities to display
   */
  activities: Activity[];

  /**
   * Whether the table is loading
   */
  loading?: boolean;

  /**
   * Whether to show the event column
   */
  showEvent?: boolean;

  /**
   * Whether to show the subject column
   */
  showSubject?: boolean;

  /**
   * Whether to enable pagination
   */
  paginator?: boolean;

  /**
   * Number of rows per page
   */
  rowsPerPage?: number;
}

/**
 * Emits interface for ActivityLogTable component
 */
export interface ActivityLogTableEmits {
  /**
   * Emitted when user clicks view details
   */
  (event: 'view-details', activity: Activity): void;
}

// Props
withDefaults(defineProps<ActivityLogTableProps>(), {
  loading: false,
  showEvent: true,
  showSubject: true,
  paginator: true,
  rowsPerPage: 10,
});

// Emits
const emit = defineEmits<ActivityLogTableEmits>();

// Composables
const { formatDate } = useDateFormatter();

/**
 * Format event type for display
 */
const formatEvent = (event: EventType): string => {
  return event.charAt(0).toUpperCase() + event.slice(1);
};

/**
 * Get event variant for badge
 */
const getEventVariant = (event: EventType): BadgeVariant => {
  const variants: Record<EventType, BadgeVariant> = {
    created: 'success',
    updated: 'info',
    deleted: 'danger',
  };

  return variants[event] || 'secondary';
};

/**
 * Get causer name from causer object
 */
const getCauserName = (causer: Causer): string => {
  if (causer.first_name && causer.last_name) {
    return `${causer.first_name} ${causer.last_name}`;
  }
  if (causer.name) {
    return causer.name;
  }
  return causer.email;
};

/**
 * Get causer type label (Admin or User)
 */
const getCauserTypeLabel = (causerType: string | null): string => {
  // Check if causer is an Admin based on causer_type field
  if (causerType && causerType.includes('Admin')) {
    return 'Admin';
  }
  return 'User';
};

/**
 * Format subject type for display
 */
const formatSubjectType = (subjectType: string): string => {
  // Extract class name from full namespace (e.g., "App\Models\User" -> "User")
  const parts = subjectType.split('\\');
  return parts[parts.length - 1] || subjectType;
};

/**
 * Handle view details click
 */
const handleViewDetails = (activity: Activity): void => {
  emit('view-details', activity);
};
</script>

<style scoped></style>
