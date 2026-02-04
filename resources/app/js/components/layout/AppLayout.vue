<script setup lang="ts">
import { computed } from 'vue';
import { useNavigationStore } from '@app/stores/navigationStore';
import { useUserStore } from '@app/stores/userStore';
import { useSiteConfig } from '@app/composables/useSiteConfig';
import { useBreadcrumbs } from '@app/composables/useBreadcrumbs';
import IconRail from './IconRail.vue';
import Sidebar from './Sidebar.vue';
import HeaderBar from './HeaderBar.vue';
import ProfileSettingsModal from '@app/components/profile/ProfileSettingsModal.vue';
import ContactFloatingButton from '@app/components/contact/ContactFloatingButton.vue';
import MaintenanceMode from '@app/components/maintenance/MaintenanceMode.vue';
import AdminMaintenanceBar from '@app/components/maintenance/AdminMaintenanceBar.vue';
import Toast from 'primevue/toast';

const navigationStore = useNavigationStore();
const userStore = useUserStore();
const { isMaintenanceMode } = useSiteConfig();
const breadcrumbs = useBreadcrumbs();

const showSidebar = computed(() => navigationStore.showSidebar);
const showProfile = computed({
  get: () => navigationStore.showProfileModal,
  set: (value) => navigationStore.setProfileModal(value),
});

// Show maintenance mode if enabled and user is not an admin
const showMaintenanceMode = computed(() => isMaintenanceMode.value && !userStore.isAdmin);

// Show admin maintenance bar if maintenance mode is enabled and user is an admin
const showAdminBar = computed(() => isMaintenanceMode.value && userStore.isAdmin);
</script>

<template>
  <!-- Maintenance Mode (non-admin users) -->
  <MaintenanceMode v-if="showMaintenanceMode" />

  <!-- Normal App (maintenance disabled or admin user) -->
  <div v-else class="app-layout">
    <!-- Admin Maintenance Bar (admin users only, when maintenance is enabled) -->
    <AdminMaintenanceBar v-if="showAdminBar" />

    <IconRail :style="showAdminBar ? 'margin-top: 20px;' : ''" />
    <Sidebar v-if="showSidebar" :style="showAdminBar ? 'margin-top: 20px;' : ''" />
    <main class="main-content" :style="showAdminBar ? 'margin-top: 20px;' : ''">
      <HeaderBar :breadcrumbs="breadcrumbs">
        <template #actions>
          <!-- Actions slot can be filled by individual views -->
        </template>
      </HeaderBar>
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>

    <!-- Global components -->
    <Toast />
    <ProfileSettingsModal v-model:visible="showProfile" />
    <ContactFloatingButton />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
}

.content-wrapper {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
