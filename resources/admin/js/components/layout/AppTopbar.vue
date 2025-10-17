<template>
  <header
    :class="[
      'fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30 transition-all duration-300',
      isCollapsed ? 'left-20' : 'left-64',
    ]"
  >
    <div class="flex items-center justify-between h-full px-4 lg:px-6">
      <!-- Left Section: Menu Toggle + Breadcrumbs -->
      <div class="flex items-center gap-4 flex-1 min-w-0">
        <!-- Menu Toggle Button -->
        <Button
          v-tooltip.bottom="isCollapsed ? 'Expand menu' : 'Collapse menu'"
          :icon="isCollapsed ? 'pi pi-bars' : 'pi pi-times'"
          text
          rounded
          severity="secondary"
          @click="toggleSidebar"
        />

        <!-- Breadcrumbs -->
        <Breadcrumb :model="breadcrumbItems" class="hidden sm:flex flex-1 min-w-0">
          <template #item="{ item }">
            <router-link
              v-if="item.to"
              :to="item.to"
              class="text-gray-600 hover:text-blue-600 no-underline"
            >
              <i v-if="item.icon" :class="[item.icon, 'mr-2']"></i>
              <span>{{ item.label }}</span>
            </router-link>
            <span v-else class="text-gray-900 font-medium">
              <i v-if="item.icon" :class="[item.icon, 'mr-2']"></i>
              <span>{{ item.label }}</span>
            </span>
          </template>
        </Breadcrumb>
      </div>

      <!-- Right Section: Search + Notifications -->
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="relative hidden md:block">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Search..."
              class="w-64"
              @keyup.enter="handleSearch"
            />
          </IconField>
        </div>

        <!-- Search Button (Mobile) -->
        <Button
          icon="pi pi-search"
          text
          rounded
          severity="secondary"
          class="md:hidden"
          @click="toggleMobileSearch"
        />

        <!-- Notifications -->
        <OverlayBadge :value="unreadCount > 0 ? unreadCount : undefined" severity="danger">
          <Button
            v-tooltip.bottom="'Notifications'"
            icon="pi pi-bell"
            text
            rounded
            severity="secondary"
            @click="toggleNotifications"
          />
        </OverlayBadge>

        <!-- User Menu -->
        <Button
          v-tooltip.bottom="'Account'"
          icon="pi pi-user"
          text
          rounded
          severity="secondary"
          @click="toggleUserMenu"
        />
      </div>
    </div>

    <!-- Mobile Search Overlay -->
    <transition name="slide-down">
      <div
        v-if="showMobileSearch"
        class="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 p-4 md:hidden"
      >
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Search..."
            class="w-full"
            autofocus
            @keyup.enter="handleSearch"
          />
        </IconField>
      </div>
    </transition>
  </header>

  <!-- Notifications Panel -->
  <Popover ref="notificationsPanel" class="w-80">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
      <Button
        v-if="hasUnreadNotifications"
        label="Mark all read"
        text
        size="small"
        @click="markAllAsRead"
      />
    </div>

    <div v-if="notifications.length === 0" class="text-center py-8">
      <i class="pi pi-bell text-4xl text-gray-400 mb-3"></i>
      <p class="text-gray-600">No notifications</p>
    </div>

    <div v-else class="space-y-3 max-h-96 overflow-y-auto">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'p-3 rounded-lg cursor-pointer transition-colors',
          notification.read ? 'bg-gray-50' : 'bg-blue-50',
        ]"
        @click="markAsRead(notification.id)"
      >
        <div class="flex items-start gap-3">
          <div
            :class="[
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              getNotificationColor(notification.type),
            ]"
          >
            <i :class="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">
              {{ notification.title }}
            </p>
            <p class="text-xs text-gray-600 mt-1">
              {{ notification.message }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ formatTime(notification.timestamp) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Popover>

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
          <div v-if="adminStore.adminRole" class="mt-1">
            <Badge
              :text="getRoleLabel(adminStore.adminRole)"
              :variant="getRoleVariant(adminStore.adminRole)"
              size="sm"
            />
          </div>
        </div>
      </div>

      <!-- Menu Items -->
      <Button
        label="Profile"
        icon="pi pi-user"
        text
        class="w-full justify-start !text-gray-700 hover:!text-gray-900 hover:!bg-gray-50"
        @click="handleViewProfile"
      />

      <!-- Logout Button -->
      <div class="pt-2 border-t border-gray-200">
        <Button
          label="Sign Out"
          icon="pi pi-sign-out"
          text
          class="w-full justify-start !text-gray-500 hover:!text-gray-700 hover:!bg-gray-50"
          :loading="isLoggingOut"
          @click="handleLogout"
        />
      </div>
    </div>
  </Popover>

  <!-- View Admin User Modal -->
  <ViewAdminUserModal
    v-model:visible="showViewModal"
    :admin-user="adminStore.admin"
    :can-edit="true"
    :can-delete="false"
    :is-own-profile="true"
    @edit="handleEditProfile"
    @close="showViewModal = false"
  />

  <!-- Edit Admin User Modal -->
  <EditAdminUserModal
    v-model:visible="showEditModal"
    :admin-user="adminStore.admin"
    :available-roles="availableRoles"
    :saving="isSavingProfile"
    :disable-role-edit="true"
    @save="handleSaveProfile"
    @cancel="showEditModal = false"
    @close="showEditModal = false"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Breadcrumb from 'primevue/breadcrumb';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Popover from 'primevue/popover';
import OverlayBadge from 'primevue/overlaybadge';
import { useLayoutStore } from '@admin/stores/layoutStore';
import { useAdminStore } from '@admin/stores/adminStore';
import Badge, { type BadgeVariant } from '@admin/components/common/Badge.vue';
import ViewAdminUserModal from '@admin/components/AdminUser/modals/ViewAdminUserModal.vue';
import EditAdminUserModal from '@admin/components/AdminUser/modals/EditAdminUserModal.vue';
import { adminUserService } from '@admin/services/adminUserService';
import type { AdminUserUpdateData, AdminRole } from '@admin/types/admin';
import type { RoleOption } from '@admin/components/AdminUser/modals/EditAdminUserModal.vue';
import { logger } from '@admin/utils/logger';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const layoutStore = useLayoutStore();
const adminStore = useAdminStore();

// Refs
const searchQuery = ref('');
const showMobileSearch = ref(false);
const notificationsPanel = ref();
const userMenuPanel = ref();
const isLoggingOut = ref(false);
const showViewModal = ref(false);
const showEditModal = ref(false);
const isSavingProfile = ref(false);

// Available roles for the role dropdown
const availableRoles = ref<RoleOption[]>([
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
]);

// Computed properties
const isCollapsed = computed(() => layoutStore.sidebarCollapsed);
const notifications = computed(() => layoutStore.notifications);
const unreadCount = computed(() => layoutStore.unreadNotificationsCount);
const hasUnreadNotifications = computed(() => layoutStore.hasUnreadNotifications);
const adminName = computed(() => adminStore.adminName);
const adminEmail = computed(() => adminStore.adminEmail);

/**
 * Get admin initials for avatar
 */
const adminInitials = computed(() => {
  const name = adminStore.adminName;
  const parts = name.split(' ').filter((part) => part.length > 0);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
});

// Breadcrumb items based on current route
const breadcrumbItems = computed<Array<{ label: string; icon?: string; to?: string }>>(() => {
  const items: Array<{ label: string; icon?: string; to?: string }> = [
    { label: 'Overview', icon: 'pi pi-home', to: '/admin' },
  ];

  if (route.meta.breadcrumb) {
    const breadcrumb = route.meta.breadcrumb as Array<{ label: string; to?: string }>;
    items.push(...breadcrumb);
  } else if (route.meta.title && route.path !== '/admin') {
    items.push({ label: route.meta.title as string });
  }

  return items;
});

// Methods
const toggleSidebar = (): void => {
  layoutStore.toggleSidebar();
};

const toggleMobileSearch = (): void => {
  showMobileSearch.value = !showMobileSearch.value;
};

const handleSearch = (): void => {
  if (searchQuery.value.trim()) {
    logger.debug('Search query:', searchQuery.value);
    // Implement search functionality
    showMobileSearch.value = false;
  }
};

const toggleNotifications = (event: Event): void => {
  notificationsPanel.value.toggle(event);
};

const toggleUserMenu = (event: Event): void => {
  userMenuPanel.value.toggle(event);
};

const markAsRead = (id: string): void => {
  layoutStore.markNotificationAsRead(id);
};

const markAllAsRead = (): void => {
  layoutStore.markAllNotificationsAsRead();
};

/**
 * Handle view profile button click
 */
const handleViewProfile = (): void => {
  showViewModal.value = true;
  userMenuPanel.value.hide();
};

/**
 * Handle edit profile from view modal
 */
const handleEditProfile = (): void => {
  showViewModal.value = false;
  showEditModal.value = true;
};

/**
 * Handle save profile
 */
const handleSaveProfile = async (data: AdminUserUpdateData): Promise<void> => {
  if (!adminStore.admin) return;

  isSavingProfile.value = true;
  try {
    // Update the admin user via API
    const updatedAdmin = await adminUserService.updateAdminUser(adminStore.admin.id, data);

    // Update the admin store with the new data
    adminStore.setAdmin(updatedAdmin);

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Profile Updated',
      detail: 'Your profile has been updated successfully',
      life: 3000,
    });

    // Close the modal
    showEditModal.value = false;
  } catch (error) {
    logger.error('Failed to update profile:', error);
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update your profile. Please try again.',
      life: 5000,
    });
  } finally {
    isSavingProfile.value = false;
  }
};

/**
 * Handle logout with confirmation
 */
const handleLogout = async (): Promise<void> => {
  if (isLoggingOut.value) return;

  try {
    isLoggingOut.value = true;

    // Logout through store
    await adminStore.logout();

    // Hide user menu
    userMenuPanel.value.hide();

    // Redirect to login
    await router.push({ name: 'login' });
  } catch (error) {
    logger.error('Logout failed:', error);
  } finally {
    isLoggingOut.value = false;
  }
};

const getNotificationColor = (type: string): string => {
  const colors = {
    info: 'bg-blue-100 text-blue-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
    success: 'bg-green-100 text-green-600',
  };
  return colors[type as keyof typeof colors] || colors.info;
};

const getNotificationIcon = (type: string): string => {
  const icons = {
    info: 'pi pi-info-circle',
    warning: 'pi pi-exclamation-triangle',
    error: 'pi pi-times-circle',
    success: 'pi pi-check-circle',
  };
  return icons[type as keyof typeof icons] || icons.info;
};

const formatTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
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
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
