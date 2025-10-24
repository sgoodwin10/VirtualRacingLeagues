<template>
  <BaseModal
    :visible="visible"
    :dismissable-mask="true"
    width="700px"
    @update:visible="handleVisibleChange"
  >
    <!-- Custom Header -->
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-info-circle text-blue-500"></i>
        Activity Details
      </div>
    </template>

    <!-- Content -->
    <div v-if="activity" class="space-y-5">
      <!-- Header Section with Type and Event -->
      <div class="flex items-start justify-between pb-4 border-b border-gray-200">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ activity.description }}
          </h3>
          <p class="text-sm text-gray-600">
            ID: <span class="font-mono">{{ activity.id }}</span>
          </p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <Badge
            :text="activity.log_name === 'admin' ? 'Admin' : 'User'"
            :variant="activity.log_name === 'admin' ? 'purple' : 'info'"
            :icon="activity.log_name === 'admin' ? 'pi-shield' : 'pi-user'"
          />
          <Badge
            v-if="activity.event"
            :text="formatEvent(activity.event)"
            :variant="getEventVariant(activity.event)"
          />
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-2 gap-x-6 gap-y-4">
        <!-- Performed By -->
        <div class="col-span-2">
          <p class="text-xs text-gray-500 mb-2">Performed By</p>
          <div v-if="activity.causer" class="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div
              :class="[
                'flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold text-sm',
                getCauserAvatarClass(activity.causer_type),
              ]"
            >
              {{ getCauserInitials(activity.causer) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">
                {{ getCauserName(activity.causer) }}
              </p>
              <p class="text-xs text-gray-500">
                {{ getCauserTypeLabel(activity.causer_type) }} ID: {{ activity.causer.id }} •
                {{ activity.causer.email }}
              </p>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500 italic">System</p>
        </div>

        <!-- Target -->
        <div v-if="activity.subject_type" class="col-span-2">
          <p class="text-xs text-gray-500 mb-2">Target</p>
          <div class="p-3 rounded-lg bg-gray-50">
            <p class="text-sm font-medium text-gray-900">
              {{ formatSubjectType(activity.subject_type) }}
            </p>
            <p class="text-xs text-gray-500 font-mono">ID: {{ activity.subject_id }}</p>
          </div>
        </div>

        <!-- Date -->
        <div>
          <p class="text-xs text-gray-500 mb-2">Created At</p>
          <p class="text-sm font-medium text-gray-900">
            {{ formatDate(activity.created_at) }}
          </p>
        </div>

        <!-- Batch UUID -->
        <div v-if="activity.batch_uuid">
          <p class="text-xs text-gray-500 mb-2">Batch UUID</p>
          <p class="text-sm font-medium text-gray-900 font-mono text-xs truncate">
            {{ activity.batch_uuid }}
          </p>
        </div>
      </div>

      <!-- Changes Section (if attributes exist) -->
      <div v-if="hasChanges" class="pt-4 border-t border-gray-200">
        <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-history text-blue-500"></i>
          Changes
        </h4>
        <div class="space-y-3">
          <div
            v-for="change in getChanges()"
            :key="change.field"
            class="p-3 rounded-lg bg-gray-50 border border-gray-200"
          >
            <p class="text-xs font-semibold text-gray-700 mb-2">
              {{ formatFieldName(change.field) }}
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-gray-500 mb-1">Old Value</p>
                <p class="text-sm text-gray-900 font-mono break-words">
                  {{ formatValue(change.oldValue) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">New Value</p>
                <p class="text-sm text-gray-900 font-mono break-words">
                  {{ formatValue(change.newValue) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Properties Section (if additional properties exist) -->
      <div v-if="hasAdditionalProperties" class="pt-4 border-t border-gray-200">
        <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-info-circle text-blue-500"></i>
          Additional Information
        </h4>
        <div class="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <pre class="text-xs text-gray-900 overflow-x-auto">{{
            formatJSON(getAdditionalProperties())
          }}</pre>
        </div>
      </div>

      <!-- All Properties (Collapsed by default) -->
      <div class="pt-4 border-t border-gray-200">
        <button
          class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          @click="showAllProperties = !showAllProperties"
        >
          <i :class="['pi', showAllProperties ? 'pi-chevron-down' : 'pi-chevron-right']"></i>
          {{ showAllProperties ? 'Hide' : 'Show' }} Raw Properties
        </button>
        <div
          v-if="showAllProperties"
          class="mt-3 p-4 rounded-lg bg-gray-900 border border-gray-700"
        >
          <pre class="text-xs text-green-400 overflow-x-auto">{{
            formatJSON(activity.properties)
          }}</pre>
        </div>
      </div>
    </div>

    <!-- Custom Footer -->
    <template #footer>
      <Button label="Close" severity="secondary" size="small" @click="handleClose" />
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Badge, { type BadgeVariant } from '@admin/components/common/Badge.vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import type { Activity, EventType, Causer, ActivityChanges } from '@admin/types/activityLog';

/**
 * Props interface for ActivityLogDetailModal component
 */
export interface ActivityLogDetailModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Activity to display
   */
  activity: Activity | null;
}

/**
 * Emits interface for ActivityLogDetailModal component
 */
export interface ActivityLogDetailModalEmits {
  /**
   * Emitted when the modal visibility changes
   */
  (event: 'update:visible', value: boolean): void;

  /**
   * Emitted when the modal is closed
   */
  (event: 'close'): void;
}

// Props
const props = defineProps<ActivityLogDetailModalProps>();

// Emits
const emit = defineEmits<ActivityLogDetailModalEmits>();

// State
const showAllProperties = ref(false);

// Composables
const { formatDate } = useDateFormatter();

/**
 * Check if activity has changes (attributes and old values)
 */
const hasChanges = computed(() => {
  if (!props.activity?.properties) return false;
  return !!(props.activity.properties.attributes || props.activity.properties.old);
});

/**
 * Check if activity has additional properties beyond attributes/old
 */
const hasAdditionalProperties = computed(() => {
  if (!props.activity?.properties) return false;
  const properties = props.activity.properties;
  const keys = Object.keys(properties).filter((key) => key !== 'attributes' && key !== 'old');
  return keys.length > 0;
});

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
 * Format event type for display
 */
const formatEvent = (event: EventType): string => {
  return event.charAt(0).toUpperCase() + event.slice(1);
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
 * Get causer initials
 */
const getCauserInitials = (causer: Causer): string => {
  if (causer.first_name && causer.last_name) {
    return `${causer.first_name.charAt(0)}${causer.last_name.charAt(0)}`.toUpperCase();
  }
  if (causer.name) {
    const parts = causer.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]?.charAt(0) || ''}${parts[1]?.charAt(0) || ''}`.toUpperCase();
    }
    return causer.name.charAt(0).toUpperCase();
  }
  return causer.email.charAt(0).toUpperCase();
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
 * Get causer avatar background class based on type
 */
const getCauserAvatarClass = (causerType: string | null): string => {
  // Use different colors for Admin vs User
  if (causerType && causerType.includes('Admin')) {
    return 'bg-gradient-to-br from-purple-500 to-purple-600';
  }
  return 'bg-gradient-to-br from-blue-500 to-blue-600';
};

/**
 * Format subject type for display
 */
const formatSubjectType = (subjectType: string): string => {
  const parts = subjectType.split('\\');
  return parts[parts.length - 1] || subjectType;
};

/**
 * Get changes array from properties
 */
const getChanges = (): ActivityChanges[] => {
  if (!props.activity?.properties) return [];

  const attributes = props.activity.properties.attributes || {};
  const old = props.activity.properties.old || {};
  const changes: ActivityChanges[] = [];

  // Get all unique field names
  const fields = new Set([...Object.keys(attributes), ...Object.keys(old)]);

  fields.forEach((field) => {
    changes.push({
      field,
      oldValue: old[field],
      newValue: attributes[field],
    });
  });

  return changes;
};

/**
 * Get additional properties (excluding attributes and old)
 */
const getAdditionalProperties = (): Record<string, unknown> => {
  if (!props.activity?.properties) return {};

  const properties = { ...props.activity.properties };
  delete properties.attributes;
  delete properties.old;

  return properties;
};

/**
 * Format field name for display
 */
const formatFieldName = (field: string): string => {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format value for display
 */
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

/**
 * Format JSON for display
 */
const formatJSON = (obj: unknown): string => {
  return JSON.stringify(obj, null, 2);
};

/**
 * Handle visibility change
 */
const handleVisibleChange = (value: boolean): void => {
  emit('update:visible', value);
  if (!value) {
    showAllProperties.value = false;
  }
};

/**
 * Handle close button click
 */
const handleClose = (): void => {
  emit('update:visible', false);
  emit('close');
  showAllProperties.value = false;
};
</script>

<style scoped>
/* ActivityLogDetailModal specific styles */
pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
