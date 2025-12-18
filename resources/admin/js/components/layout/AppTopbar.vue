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
          aria-label="Toggle sidebar menu"
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
              aria-label="Search"
              @keyup.enter="handleSearch"
            />
          </IconField>
        </div>

        <!-- Search Button (Mobile) -->
        <Button
          v-tooltip.bottom="'Search'"
          icon="pi pi-search"
          text
          rounded
          severity="secondary"
          class="md:hidden"
          aria-label="Open search"
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
            aria-label="View notifications"
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
          aria-label="Account menu"
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
            aria-label="Search"
            @keyup.enter="handleSearch"
            @keyup.escape="showMobileSearch = false"
          />
        </IconField>
      </div>
    </transition>
  </header>

  <!-- Notifications Panel -->
  <AppTopbarNotifications
    ref="notificationsRef"
    :notifications="notifications"
    :has-unread-notifications="hasUnreadNotifications"
    @mark-read="markAsRead"
    @mark-all-read="markAllAsRead"
  />

  <!-- User Menu Panel -->
  <AppTopbarUserMenu
    ref="userMenuRef"
    :admin-name="adminName"
    :admin-email="adminEmail"
    :admin-role="adminStore.adminRole"
    :is-logging-out="isLoggingOut"
    @view-profile="handleViewProfile"
    @logout="handleLogout"
  />

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
import OverlayBadge from 'primevue/overlaybadge';
import { useLayoutStore } from '@admin/stores/layoutStore';
import { useAdminStore } from '@admin/stores/adminStore';
import AppTopbarNotifications from '@admin/components/layout/AppTopbarNotifications.vue';
import AppTopbarUserMenu from '@admin/components/layout/AppTopbarUserMenu.vue';
import ViewAdminUserModal from '@admin/components/AdminUser/modals/ViewAdminUserModal.vue';
import EditAdminUserModal from '@admin/components/AdminUser/modals/EditAdminUserModal.vue';
import { adminUserService } from '@admin/services/adminUserService';
import type { AdminUserUpdateData } from '@admin/types/admin';
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
const notificationsRef = ref();
const userMenuRef = ref();
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
  notificationsRef.value.toggle(event);
};

const toggleUserMenu = (event: Event): void => {
  userMenuRef.value.toggle(event);
};

const markAsRead = (id: string): void => {
  layoutStore.markNotificationAsRead(id);
};

const markAllAsRead = (): void => {
  layoutStore.markAllNotificationsAsRead();
};

const handleViewProfile = (): void => {
  showViewModal.value = true;
  userMenuRef.value.hide();
};

const handleEditProfile = (): void => {
  showViewModal.value = false;
  showEditModal.value = true;
};

const handleSaveProfile = async (data: AdminUserUpdateData): Promise<void> => {
  if (!adminStore.admin) return;

  isSavingProfile.value = true;
  try {
    const updatedAdmin = await adminUserService.updateAdminUser(adminStore.admin.id, data);
    adminStore.setAdmin(updatedAdmin);

    toast.add({
      severity: 'success',
      summary: 'Profile Updated',
      detail: 'Your profile has been updated successfully',
      life: 3000,
    });

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

const handleLogout = async (): Promise<void> => {
  if (isLoggingOut.value) return;

  try {
    isLoggingOut.value = true;
    await adminStore.logout();
    userMenuRef.value.hide();
    await router.push({ name: 'login' });
  } catch (error) {
    logger.error('Logout failed:', error);
  } finally {
    isLoggingOut.value = false;
  }
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
