<template>
  <BaseModal
    :visible="props.visible"
    width="50rem"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>User Details</template>

    <template #footer>
      <div class="flex justify-between items-center">
        <Button
          v-if="canLoginAsUser"
          label="Login As User"
          icon="pi pi-sign-in"
          size="small"
          severity="warning"
          :loading="loggingInAsUser"
          @click="handleLoginAsUser"
        />
        <div class="flex justify-end flex-1 ml-4">
          <Button
            v-if="!props.user?.email_verified_at"
            label="Resend Verification Email"
            icon="pi pi-send"
            size="small"
            severity="secondary"
            :loading="resendingVerification"
            @click="resendVerificationEmail"
          />
        </div>
      </div>
    </template>

    <div v-if="props.user" class="space-y-4">
      <!-- Header Section with Name and Status -->
      <div class="flex items-center justify-between pb-3 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span class="text-blue-600 font-semibold text-sm">
              {{ getUserInitials(props.user) }}
            </span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              {{ getFullName(props.user) }}
            </h3>
            <p class="text-sm text-gray-600">{{ props.user.email }}</p>
          </div>
        </div>
        <Badge
          :text="getStatusLabel(props.user.status)"
          :variant="getStatusVariant(props.user.status)"
          :icon="getStatusIcon(props.user.status)"
        />
      </div>

      <!-- Main Info Grid - 2 Columns -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Left Column: Identity & Account Info -->
        <div class="space-y-4">
          <!-- Identity Section -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-user text-blue-500"></i>
              Identity Information
            </h4>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">User ID</span>
                <span class="text-gray-900">
                  {{ props.user.id }}
                </span>
              </div>

              <div class="flex items-center justify-between gap-2">
                <span class="text-gray-600">UUID</span>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm text-gray-900 truncate max-w-xs">
                    {{ props.user.uuid || 'N/A' }}
                  </span>
                  <button
                    v-if="props.user.uuid"
                    type="button"
                    class="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy UUID"
                    @click="copyUuid"
                  >
                    <i class="pi pi-copy text-gray-500 text-xs"></i>
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600">Alias</span>
                <span class="text-gray-900">
                  {{ props.user.alias || 'N/A' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Account Status Section -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-shield text-green-500"></i>
              Account Status
            </h4>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Email Status</span>
                <div class="flex items-center gap-2">
                  <div
                    :class="[
                      'w-3 h-3 rounded-full',
                      props.user.email_verified_at ? 'bg-green-500' : 'bg-red-500',
                    ]"
                  ></div>
                  <span class="font-medium text-gray-900">
                    {{ props.user.email_verified_at ? 'Verified' : 'Unverified' }}
                  </span>
                </div>
              </div>

              <div v-if="props.user.email_verified_at" class="flex items-center justify-between">
                <span class="text-gray-600">Verified On</span>
                <span class="text-gray-500">
                  {{ formatDate(props.user.email_verified_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Timeline & Activity -->
        <div class="space-y-4">
          <!-- Timeline Section -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-calendar text-purple-500"></i>
              Timeline
            </h4>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Account Created</span>
                <span class="text-gray-900">
                  {{ formatDate(props.user.created_at) }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600">Last Updated</span>
                <span class="text-gray-900">
                  {{ formatDate(props.user.updated_at) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-chart-bar text-orange-500"></i>
              Quick Stats
            </h4>

            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Status</span>
                <Badge
                  :text="getStatusLabel(props.user.status)"
                  :variant="getStatusVariant(props.user.status)"
                  :icon="getStatusIcon(props.user.status)"
                />
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Activities</span>
                <span class="font-medium text-gray-900">{{ activities.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity History Section -->
      <div class="pt-4 border-t border-gray-200">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="pi pi-history text-blue-500"></i>
            Recent Activity
          </h4>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-4">
            <i class="pi pi-spinner pi-spin text-blue-500 text-lg"></i>
            <p class="text-gray-500 mt-2">Loading activities...</p>
          </div>

          <!-- Activities List -->
          <div v-else-if="activities.length > 0" class="space-y-2">
            <div
              v-for="activity in activities.slice(0, 5)"
              :key="activity.id"
              class="p-3 rounded bg-white border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-gray-900 flex-1">{{ activity.description }}</p>
                <span class="text-gray-500 flex-shrink-0">
                  {{ formatDateShort(activity.created_at) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-4">
            <i class="pi pi-clock text-gray-400 text-2xl mb-2"></i>
            <p class="text-gray-500">No recent activities</p>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import Badge from '@admin/components/common/Badge.vue';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { useStatusHelpers } from '@admin/composables/useStatusHelpers';
import { useNameHelpers } from '@admin/composables/useNameHelpers';
import { useAdminStore } from '@admin/stores/adminStore';
import type { User } from '@admin/types/user';
import { userService } from '@admin/services/userService';
import { logger } from '@admin/utils/logger';
import { buildLoginAsUrl } from '@admin/utils/url';

const props = defineProps<{
  visible: boolean;
  user: User | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const toast = useToast();
const adminStore = useAdminStore();
const activities = ref<Array<{ id: number; description: string; created_at: string }>>([]);
const loading = ref(false);
const resendingVerification = ref(false);
const loggingInAsUser = ref(false);

// Composables
const { formatDate, formatDateShort } = useDateFormatter();
const { getStatusLabel, getStatusVariant, getStatusIcon } = useStatusHelpers();
const { getFullName, getUserInitials } = useNameHelpers();

/**
 * Check if current admin can login as user
 * Only super_admin and admin roles can login as users
 */
const canLoginAsUser = computed((): boolean => {
  return adminStore.isAdmin;
});

/**
 * Load user activities when modal is opened
 */
watch(
  () => props.visible,
  async (newValue) => {
    if (newValue && props.user) {
      loading.value = true;
      try {
        const userData = await userService.getUser(props.user.id);
        activities.value = userData.activities || [];
      } catch (error) {
        logger.error('Failed to load user activities', error);
      } finally {
        loading.value = false;
      }
    }
  },
);

/**
 * Copy UUID to clipboard
 */
const copyUuid = async (): Promise<void> => {
  if (!props.user?.uuid) return;

  try {
    await navigator.clipboard.writeText(props.user.uuid);
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'UUID copied to clipboard',
      life: 2000,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to copy UUID',
      life: 3000,
    });
  }
};

/**
 * Resend verification email to user
 */
const resendVerificationEmail = async (): Promise<void> => {
  if (!props.user) return;

  resendingVerification.value = true;
  try {
    await userService.resendVerification(props.user.id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Verification email sent successfully',
      life: 3000,
    });
  } catch (error) {
    logger.error('Failed to resend verification email', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to send verification email',
      life: 3000,
    });
  } finally {
    resendingVerification.value = false;
  }
};

/**
 * Handle login as user action
 * Gets a login token from backend and opens user dashboard in new tab
 */
const handleLoginAsUser = async (): Promise<void> => {
  if (!props.user) return;

  loggingInAsUser.value = true;
  try {
    const { token } = await userService.loginAsUser(props.user.id);

    // Build login URL with proper port handling
    const loginUrl = buildLoginAsUrl(token);

    // Open in new tab
    window.open(loginUrl, '_blank');

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Opening user dashboard for ${getFullName(props.user)}`,
      life: 3000,
    });
  } catch (error) {
    logger.error('Failed to login as user', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to login as user',
      life: 3000,
    });
  } finally {
    loggingInAsUser.value = false;
  }
};
</script>
