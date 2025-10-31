<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';
// import Button from 'primevue/button';
// import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { useSiteConfigStore } from '@app/stores/siteConfigStore';
import { PhFlagCheckered, PhQuestion, PhSignOut, PhUser } from '@phosphor-icons/vue';

const router = useRouter();
const userStore = useUserStore();
const userMenu = ref();

const siteConfig = useSiteConfigStore();

// TODO: Uncomment when user menu is implemented
// @ts-expect-error - Unused until user menu is implemented
const _menuItems = computed<MenuItem[]>(() => [
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

// TODO: Uncomment when user menu is implemented
// @ts-expect-error - Unused until user menu is implemented
const _toggleUserMenu = (event: Event) => {
  userMenu.value.toggle(event);
};

async function handleLogout() {
  await userStore.logout();
  // Note: logout() will redirect to public site, no need to push route
}

const linkStyles =
  'text-slate-500 hover:text-slate-800 text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-between gap-2';
</script>

<template>
  <header class="container w-full lg:mx-auto px-4 max-w-7xl mx-auto">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <router-link to="/" class="flex items-center">
        <span class="text-xl font-bold text-slate-600">{{ siteConfig.siteName }}</span>
      </router-link>

      <!-- Navigation -->
      <nav class="flex items-center gap-4">
        <!-- Leagues Link -->
        <router-link to="/leagues" :class="linkStyles" active-class="text-slate-900">
          <PhFlagCheckered :size="16" />
          Your Leagues
        </router-link>

        <router-link to="/leagues" :class="linkStyles" active-class="text-slate-900">
          <PhUser :size="16" />
          Profile
        </router-link>

        <router-link to="/leagues" :class="linkStyles" active-class="text-slate-900">
          <PhSignOut :size="16" />
          Logout
        </router-link>

        <div class="flex items-center justify-center bg-slate-100 px-2 py-2 rounded-full">
          <PhQuestion :size="20" class="text-slate-500 hover:text-slate-800" />
        </div>
      </nav>
    </div>
  </header>
</template>
