<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@user/stores/userStore';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';

const router = useRouter();
const userStore = useUserStore();
const userMenu = ref();

const menuItems = computed<MenuItem[]>(() => [
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => router.push({ name: 'profile' }),
  },
  {
    separator: true,
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: handleLogout,
  },
]);

const toggleUserMenu = (event: Event) => {
  userMenu.value.toggle(event);
};

async function handleLogout() {
  await userStore.logout();
  // Note: logout() will redirect to public site, no need to push route
}
</script>

<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center">
          <span class="text-xl font-bold text-blue-600">User Dashboard</span>
        </router-link>

        <!-- Navigation -->
        <nav class="flex items-center gap-4">
          <!-- User Menu (always visible on authenticated dashboard) -->
          <Button
            type="button"
            :label="userStore.userName"
            icon="pi pi-user"
            severity="secondary"
            outlined
            @click="toggleUserMenu"
          />
          <Menu ref="userMenu" :model="menuItems" :popup="true" />
        </nav>
      </div>
    </div>
  </header>
</template>
