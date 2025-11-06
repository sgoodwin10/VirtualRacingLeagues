<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@app/stores/userStore';
import { useSiteConfigStore } from '@app/stores/siteConfigStore';
import { PhFlagCheckered, PhQuestion, PhSignOut, PhUser } from '@phosphor-icons/vue';
import ProfileSettingsModal from '@app/components/profile/ProfileSettingsModal.vue';

const userStore = useUserStore();
const siteConfig = useSiteConfigStore();

// Profile modal state
const showProfileModal = ref(false);

const openProfileModal = () => {
  showProfileModal.value = true;
};

const handleProfileUpdated = () => {
  // Optional: Handle any additional logic after profile update
  // The composable already handles the toast notification
};

async function handleLogout() {
  await userStore.logout();
  // Note: logout() will redirect to public site, no need to push route
}

const linkStyles =
  'text-slate-500 hover:text-slate-800 text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-between gap-2';
</script>

<template>
  <header class="w-screen bg-slate-100 border-b-1 border-cyan-300">
    <div class="lg:mx-auto px-4 max-w-7xl mx-auto">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3">
          <img src="/images/logo/256.png" alt="Site Logo" class="h-28 w-auto absolute top-1" />
          <span class="text-xl font-bold text-slate-600 pl-32">{{ siteConfig.siteName }}</span>
        </router-link>

        <!-- Navigation -->
        <nav class="flex items-center gap-4">
          <!-- Leagues Link -->
          <router-link to="/" :class="linkStyles" active-class="text-slate-900">
            <PhFlagCheckered :size="16" />
            Your Leagues
          </router-link>

          <button :class="linkStyles" type="button" @click="openProfileModal">
            <PhUser :size="16" />
            Profile
          </button>

          <button :class="linkStyles" type="button" @click="handleLogout">
            <PhSignOut :size="16" />
            Logout
          </button>

          <div class="flex items-center justify-center bg-slate-100 px-2 py-2 rounded-full">
            <PhQuestion :size="20" class="text-slate-500 hover:text-slate-800" />
          </div>
        </nav>
      </div>
    </div>
  </header>

  <!-- Profile Settings Modal -->
  <ProfileSettingsModal
    v-model:visible="showProfileModal"
    @profile-updated="handleProfileUpdated"
  />
</template>
