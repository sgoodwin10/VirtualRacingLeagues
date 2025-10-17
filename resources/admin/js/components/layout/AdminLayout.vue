<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Topbar -->
    <AppTopbar />

    <!-- Main Content Area -->
    <main :class="['transition-all duration-300 pt-16', isCollapsed ? 'ml-20' : 'ml-64']">
      <div class="p-4 min-h-screen bg-gray-50">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useBreakpoints } from '@vueuse/core';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';
import { useLayoutStore } from '@admin/stores/layoutStore';

const layoutStore = useLayoutStore();

// Responsive breakpoints
const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024,
});

const isMobile = breakpoints.smaller('desktop');

// Computed properties
const isCollapsed = computed(() => layoutStore.sidebarCollapsed);

// Initialize layout
onMounted(() => {
  // On mobile devices, start with collapsed sidebar
  if (isMobile.value && !layoutStore.sidebarCollapsed) {
    layoutStore.setSidebarCollapsed(true);
  }

  // Add demo notifications (remove in production)
  layoutStore.addNotification({
    title: 'Welcome!',
    message: 'Welcome to the admin dashboard',
    type: 'success',
  });
});
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: var(--surface-ground);
}

/* Page transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ensure smooth transitions on layout changes */
main {
  transition: margin-left 0.3s ease;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  main {
    margin-left: 0 !important;
  }
}
</style>
