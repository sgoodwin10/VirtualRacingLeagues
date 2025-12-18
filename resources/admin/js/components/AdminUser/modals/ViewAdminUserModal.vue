<template>
  <BaseModal
    :visible="visible"
    :dismissable-mask="true"
    width="550px"
    @update:visible="handleVisibleChange"
  >
    <!-- Custom Header -->
    <template #header> Admin User Details </template>

    <!-- Content -->
    <div v-if="adminUser" class="space-y-5">
      <!-- Header Section with Name and Status -->
      <div class="flex items-start justify-between pb-4 border-b border-gray-200">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ getFullName(adminUser) }}
              </h3>
              <p class="text-sm text-gray-600">{{ adminUser.email }}</p>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <Badge
            :text="getStatusLabel(adminUser.status)"
            :variant="getStatusVariant(adminUser.status)"
            :icon="getStatusIcon(adminUser.status)"
          />
          <Badge
            :text="getRoleLabel(adminUser.role)"
            :variant="getRoleVariant(adminUser.role)"
            size="sm"
          />
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-2 gap-x-6 gap-y-4">
        <!-- ID -->
        <div class="flex items-center gap-3">
          <div
            class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100"
          >
            <i class="pi pi-hashtag text-gray-600 text-sm"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-gray-500 mb-0.5">ID</p>
            <p class="text-sm font-medium text-gray-900 font-mono">{{ adminUser.id }}</p>
          </div>
        </div>

        <!-- Last Login -->
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50">
            <i class="pi pi-clock text-blue-600 text-sm"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-gray-500 mb-0.5">Last Login</p>
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ formatDate(adminUser.last_login_at) }}
            </p>
          </div>
        </div>

        <!-- Created At -->
        <div class="flex items-center gap-3">
          <div
            class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-green-50"
          >
            <i class="pi pi-calendar-plus text-green-600 text-sm"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-gray-500 mb-0.5">Created</p>
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ formatDate(adminUser.created_at) }}
            </p>
          </div>
        </div>

        <!-- Updated At -->
        <div class="flex items-center gap-3">
          <div
            class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-purple-50"
          >
            <i class="pi pi-calendar text-purple-600 text-sm"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-gray-500 mb-0.5">Updated</p>
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ formatDate(adminUser.updated_at) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Activity History Section -->
      <div class="pt-4 border-t border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <i class="pi pi-history text-blue-500"></i>
            Recent Activity
          </h4>
          <router-link
            :to="{ name: 'activity-logs' }"
            class="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </router-link>
        </div>

        <!-- Loading State -->
        <div v-if="loadingActivities" class="text-center py-4">
          <i class="pi pi-spinner pi-spin text-blue-500 text-xl"></i>
          <p class="text-sm text-gray-500 mt-2">Loading activities...</p>
        </div>

        <!-- Activities List -->
        <div v-else-if="recentActivities.length > 0" class="space-y-2">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 mb-1">{{ activity.description }}</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <Badge
                    v-if="activity.event"
                    :text="activity.event"
                    :variant="getEventVariant(activity.event)"
                    size="sm"
                  />
                  <span class="text-xs text-gray-500">
                    {{ formatDateShort(activity.created_at) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-4">
          <i class="pi pi-clock text-gray-400 text-2xl mb-2"></i>
          <p class="text-sm text-gray-500">No recent activities</p>
        </div>
      </div>
    </div>

    <!-- Custom Footer -->
    <template #footer>
      <div class="flex justify-between w-full">
        <div class="flex gap-2">
          <Button
            v-if="canEdit"
            label="Edit"
            icon="pi pi-pencil"
            size="small"
            @click="handleEdit"
          />
          <Button
            v-if="canDelete && !isOwnProfile"
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            @click="handleDelete"
          />
        </div>
        <Button label="Close" severity="secondary" size="small" @click="handleClose" />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Button from 'primevue/button';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import Badge, { type BadgeVariant } from '@admin/components/common/Badge.vue';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { useNameHelpers } from '@admin/composables/useNameHelpers';
import { activityLogService } from '@admin/services/activityLogService';
import type { Admin, AdminRole, AdminStatus } from '@admin/types/admin';
import type { Activity, EventType } from '@admin/types/activityLog';
import { logger } from '@admin/utils/logger';

/**
 * Props interface for ViewAdminUserModal component
 */
export interface ViewAdminUserModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Admin user to display
   */
  adminUser: Admin | null;

  /**
   * Whether the current user can edit this admin user
   */
  canEdit?: boolean;

  /**
   * Whether the current user can delete this admin user
   */
  canDelete?: boolean;

  /**
   * Whether this is the current logged-in admin viewing their own profile
   */
  isOwnProfile?: boolean;
}

/**
 * Emits interface for ViewAdminUserModal component
 */
export interface ViewAdminUserModalEmits {
  /**
   * Emitted when the modal visibility changes
   */
  (event: 'update:visible', value: boolean): void;

  /**
   * Emitted when the edit button is clicked
   */
  (event: 'edit', user: Admin, isOwnProfile: boolean): void;

  /**
   * Emitted when the delete button is clicked
   */
  (event: 'delete', user: Admin): void;

  /**
   * Emitted when the modal is closed
   */
  (event: 'close'): void;
}

// Props
const props = withDefaults(defineProps<ViewAdminUserModalProps>(), {
  canEdit: false,
  canDelete: false,
  isOwnProfile: false,
});

// Emits
const emit = defineEmits<ViewAdminUserModalEmits>();

// State for activities
const recentActivities = ref<Activity[]>([]);
const loadingActivities = ref(false);

// Composables
const { formatDate, formatDateShort } = useDateFormatter();
const { getFullName } = useNameHelpers();

/**
 * Load recent activities for admin user
 */
const loadRecentActivities = async (): Promise<void> => {
  if (!props.adminUser) {
    recentActivities.value = [];
    return;
  }

  loadingActivities.value = true;
  try {
    const activities = await activityLogService.getActivitiesForAdmin(props.adminUser.id);
    // Get only the 5 most recent activities
    recentActivities.value = activities.slice(0, 5);
  } catch (error) {
    logger.error('Failed to load activities:', error);
    recentActivities.value = [];
  } finally {
    loadingActivities.value = false;
  }
};

// Watch for admin user changes and load activities
watch(
  () => props.adminUser,
  (newAdminUser) => {
    if (newAdminUser && props.visible) {
      loadRecentActivities();
    }
  },
  { immediate: true },
);

// Watch for visibility changes
watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible && props.adminUser) {
      loadRecentActivities();
    }
  },
);

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
 * Handle visibility change
 */
const handleVisibleChange = (value: boolean): void => {
  emit('update:visible', value);
};

/**
 * Handle edit button click
 */
const handleEdit = (): void => {
  if (props.adminUser) {
    emit('edit', props.adminUser, props.isOwnProfile);
  }
};

/**
 * Handle delete button click
 */
const handleDelete = (): void => {
  if (props.adminUser) {
    emit('delete', props.adminUser);
  }
};

/**
 * Handle close button click
 */
const handleClose = (): void => {
  emit('update:visible', false);
  emit('close');
};

/**
 * Get role label for display
 */
const getRoleLabel = (role: AdminRole): string => {
  const labels: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    moderator: 'Moderator',
  };
  return labels[role] || 'Unknown';
};

/**
 * Get role badge variant
 */
const getRoleVariant = (role: AdminRole): BadgeVariant => {
  const variants: Record<AdminRole, BadgeVariant> = {
    super_admin: 'purple',
    admin: 'info',
    moderator: 'success',
  };
  return variants[role] || 'secondary';
};

/**
 * Get status label for display
 */
const getStatusLabel = (status: AdminStatus): string => {
  const labels: Record<AdminStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
  };
  return labels[status] || status;
};

/**
 * Get status badge variant
 */
const getStatusVariant = (status: AdminStatus): BadgeVariant => {
  const variants: Record<AdminStatus, BadgeVariant> = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'danger',
  };
  return variants[status] || 'secondary';
};

/**
 * Get status icon
 */
const getStatusIcon = (status: AdminStatus): string => {
  const icons: Record<AdminStatus, string> = {
    active: 'pi-circle-fill',
    inactive: 'pi-circle',
    suspended: 'pi-ban',
  };
  return icons[status] || 'pi-circle';
};
</script>

<style scoped>
/* ViewAdminUserModal specific styles */
</style>
