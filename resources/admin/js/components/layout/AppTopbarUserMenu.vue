<template>
  <!-- User Menu Panel -->
  <Popover ref="userMenuPanel" class="w-72">
    <div class="space-y-2">
      <!-- Admin Info Header -->
      <div class="flex items-center gap-3 pb-3 border-b border-gray-200">
        <div
          class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"
        >
          <span class="text-white font-semibold text-lg">
            {{ adminInitials }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 truncate">
            {{ adminName }}
          </p>
          <p class="text-xs text-gray-600 truncate">
            {{ adminEmail }}
          </p>
          <div v-if="adminRole" class="mt-1">
            <Badge :text="getRoleLabel(adminRole)" :variant="getRoleVariant(adminRole)" size="sm" />
          </div>
        </div>
      </div>

      <!-- Menu Items -->
      <Button
        label="Profile"
        icon="pi pi-user"
        text
        class="w-full justify-start !text-gray-700 hover:!text-gray-900 hover:!bg-gray-50"
        @click="emit('view-profile')"
      />

      <!-- Logout Button -->
      <div class="pt-2 border-t border-gray-200">
        <Button
          label="Sign Out"
          icon="pi pi-sign-out"
          text
          class="w-full justify-start !text-gray-500 hover:!text-gray-700 hover:!bg-gray-50"
          :loading="isLoggingOut"
          @click="emit('logout')"
        />
      </div>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Popover from 'primevue/popover';
import Badge, { type BadgeVariant } from '@admin/components/common/Badge.vue';
import type { AdminRole } from '@admin/types/admin';

/**
 * Props interface
 */
export interface AppTopbarUserMenuProps {
  adminName: string;
  adminEmail: string;
  adminRole: AdminRole | null;
  isLoggingOut: boolean;
}

/**
 * Emits interface
 */
export interface AppTopbarUserMenuEmits {
  (event: 'view-profile'): void;
  (event: 'logout'): void;
}

// Props
const props = defineProps<AppTopbarUserMenuProps>();

// Emits
const emit = defineEmits<AppTopbarUserMenuEmits>();

// Template ref
const userMenuPanel = ref();

/**
 * Get admin initials for avatar
 */
const adminInitials = computed(() => {
  const parts = props.adminName.split(' ').filter((part) => part.length > 0);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return props.adminName.substring(0, 2).toUpperCase();
});

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
 * Toggle the user menu panel
 */
const toggle = (event: Event): void => {
  userMenuPanel.value.toggle(event);
};

/**
 * Hide the user menu panel
 */
const hide = (): void => {
  userMenuPanel.value.hide();
};

// Expose toggle and hide methods
defineExpose({ toggle, hide });
</script>
