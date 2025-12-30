<script setup lang="ts">
import { computed } from 'vue';
import { useNavigationStore } from '@app/stores/navigationStore';
import { useBreadcrumbs } from '@app/composables/useBreadcrumbs';
import IconRail from './IconRail.vue';
import Sidebar from './Sidebar.vue';
import HeaderBar from './HeaderBar.vue';
import ProfileSettingsModal from '@app/components/profile/ProfileSettingsModal.vue';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const navigationStore = useNavigationStore();
const breadcrumbs = useBreadcrumbs();
const showSidebar = computed(() => navigationStore.showSidebar);
const showProfile = computed({
  get: () => navigationStore.showProfileModal,
  set: (value) => navigationStore.setProfileModal(value),
});
</script>

<template>
  <div class="app-layout">
    <IconRail />
    <Sidebar v-if="showSidebar" />
    <main class="main-content">
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
    <ConfirmDialog />
    <ProfileSettingsModal v-model:visible="showProfile" />
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
