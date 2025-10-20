<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Chip from 'primevue/chip';
import Skeleton from 'primevue/skeleton';
import { getLeagueById } from '@user/services/leagueService';
import { useImageUrl } from '@user/composables/useImageUrl';
import { useDateFormatter } from '@user/composables/useDateFormatter';
import DriverManagementDrawer from '@user/components/driver/DriverManagementDrawer.vue';
import LeagueWizardDrawer from '@user/components/league/modals/LeagueWizardDrawer.vue';
import type { League } from '@user/types/league';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const league = ref<League | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showDriverDrawer = ref(false);
const showEditDrawer = ref(false);

const { formatDate } = useDateFormatter();

// Get league ID from route params
const leagueId = computed(() => route.params.id as string);
const leagueIdNumber = computed(() => parseInt(leagueId.value, 10));

// Image handling with composables
const logo = computed(() =>
  useImageUrl(() => league.value?.logo_url, '/images/default-league-logo.png')
);

const headerImage = computed(() => useImageUrl(() => league.value?.header_image_url));

onMounted(async () => {
  await loadLeague();
});

async function loadLeague(): Promise<void> {
  if (!leagueId.value) {
    error.value = 'League ID is required';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    league.value = await getLeagueById(leagueId.value);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load league';
    error.value = errorMessage;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}

function handleCreateCompetitions(): void {
  toast.add({
    severity: 'info',
    summary: 'Coming Soon',
    detail: 'Create Competitions feature is coming soon',
    life: 3000,
  });
}

function handleCreateDrivers(): void {
  showDriverDrawer.value = true;
}

function handleEditLeague(): void {
  showEditDrawer.value = true;
}

function handleLeagueSaved(): void {
  showEditDrawer.value = false;
  loadLeague();
}

function goBack(): void {
  router.push({ name: 'leagues' });
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Skeleton width="200px" height="2rem" class="mb-4" />
      <Skeleton width="100%" height="300px" class="mb-4" />
      <Skeleton width="100%" height="150px" />
    </div>

    <!-- Error State -->
    <div v-else-if="error || !league" class="text-center py-12">
      <Card class="bg-red-50 border border-red-200">
        <template #content>
          <div class="flex flex-col items-center gap-4">
            <i class="pi pi-exclamation-triangle text-6xl text-red-500"></i>
            <h2 class="text-2xl font-bold text-red-900">League Not Found</h2>
            <p class="text-red-700">
              {{ error || 'The league you are looking for does not exist or has been removed.' }}
            </p>
            <Button label="Back to Leagues" icon="pi pi-arrow-left" @click="goBack" />
          </div>
        </template>
      </Card>
    </div>

    <!-- League Content -->
    <div v-else class="space-y-6">
      <!-- Back Button -->
      <Button
        label="Back to Leagues"
        icon="pi pi-arrow-left"
        text
        severity="secondary"
        @click="goBack"
      />

      <!-- Header Image and Logo -->
      <Card class="overflow-hidden">
        <template #header>
          <div class="relative">
            <!-- Header Image with Error Handling -->
            <img
              v-if="headerImage.url.value && !headerImage.hasError.value"
              :src="headerImage.displayUrl.value"
              :alt="league.name"
              class="w-full h-48 object-cover"
              @load="headerImage.handleLoad"
              @error="headerImage.handleError"
            />
            <div v-else class="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600"></div>

            <!-- Logo with Error Handling and Fallback -->
            <img
              :src="logo.displayUrl.value"
              :alt="`${league.name} logo`"
              class="absolute -bottom-12 left-8 w-24 h-24 rounded-xl border-4 border-white shadow-xl object-cover"
              @load="logo.handleLoad"
              @error="logo.handleError"
            />

            <div class="absolute top-0 right-0 flex flex-col items-center gap-3 p-3">
              <Chip
                :label="league.visibility"
                :class="{
                  'bg-green-100 text-green-800': league.visibility === 'public',
                  'bg-yellow-100 text-yellow-800': league.visibility === 'private',
                  'bg-blue-100 text-blue-800': league.visibility === 'unlisted',
                }"
              />
              <Chip
                :label="league.status"
                :class="{
                  'bg-emerald-100 text-emerald-800': league.status === 'active',
                  'bg-gray-100 text-gray-800': league.status === 'archived',
                }"
              />
            </div>
          </div>
        </template>

        <template #content>
          <div class="space-y-6">
            <!-- Title and Visibility -->
            <div class="flex flex-wrap items-start justify-between gap-4 bg-gray-100 border-b border-gray-200 p-3">
              <div>
                <h1 class="text-4xl font-bold pl-32">{{ league.name }}</h1>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <Button
                  label="Create Competitions"
                  icon="pi pi-trophy"
                  severity="success"
                  size="small"
                  class="bg-white"
                  outlined
                  @click="handleCreateCompetitions"
                />
                <Button
                  label="Create Drivers"
                  icon="pi pi-users"
                  severity="info"
                  size="small"
                  @click="handleCreateDrivers"
                />
                <Button
                  label="Edit League"
                  icon="pi pi-pencil"
                  severity="secondary"
                  class="bg-white"
                  outlined
                  size="small"
                  @click="handleEditLeague"
                />
              </div>
            </div>

            <!-- Tagline -->
            <p v-if="league.tagline" class="text-xl text-gray-600 italic p-0">
              {{ league.tagline }}
            </p>

            <!-- Description -->
            <div v-if="league.description" class="prose max-w-none p-4">
              <h2 class="text-2xl font-semibold mb-3">About</h2>
              <div class="text-gray-700" v-html="league.description"></div>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t p-4">
              <!-- Platforms -->
              <div>
                <h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <i class="pi pi-desktop"></i>
                  Platforms
                </h3>
                <div
                  v-if="league.platforms && league.platforms.length > 0"
                  class="flex flex-wrap gap-2"
                >
                  <Chip
                    v-for="platform in league.platforms"
                    :key="platform.id"
                    :label="platform.name"
                    class="bg-blue-100 text-blue-800"
                  />
                </div>
                <p v-else class="text-gray-500">No platforms specified</p>
              </div>

              <!-- Timezone -->
              <div>
                <h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <i class="pi pi-clock"></i>
                  Timezone
                </h3>
                <p class="text-gray-700">{{ league.timezone }}</p>
              </div>

              <!-- Organizer -->
              <div>
                <h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <i class="pi pi-user"></i>
                  Organizer
                </h3>
                <p class="text-gray-700">{{ league.organizer_name }}</p>
              </div>

              <!-- Contact Email -->
              <div>
                <h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <i class="pi pi-envelope"></i>
                  Contact Email
                </h3>
                <a :href="`mailto:${league.contact_email}`" class="text-blue-600 hover:underline">
                  {{ league.contact_email }}
                </a>
              </div>

              <!-- Created Date -->
              <div v-if="league.created_at">
                <h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <i class="pi pi-calendar"></i>
                  Created
                </h3>
                <p class="text-gray-700">{{ formatDate(league.created_at) }}</p>
              </div>

              <!-- Last Updated -->
              <div v-if="league.updated_at">
                <h3 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <i class="pi pi-refresh"></i>
                  Last Updated
                </h3>
                <p class="text-gray-700">{{ formatDate(league.updated_at) }}</p>
              </div>
            </div>

            <!-- Social Media Links -->
            <div
              v-if="
                league.discord_url ||
                league.website_url ||
                league.twitter_handle ||
                league.instagram_handle ||
                league.youtube_url ||
                league.twitch_url
              "
              class="pt-6 border-t"
            >
              <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i class="pi pi-share-alt"></i>
                Social Media & Links
              </h3>
              <div class="flex flex-wrap gap-3">
                <Button
                  v-if="league.discord_url"
                  label="Discord"
                  icon="pi pi-discord"
                  severity="secondary"
                  outlined
                  :href="league.discord_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  as="a"
                />
                <Button
                  v-if="league.website_url"
                  label="Website"
                  icon="pi pi-globe"
                  severity="secondary"
                  outlined
                  :href="league.website_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  as="a"
                />
                <Button
                  v-if="league.twitter_handle"
                  label="Twitter"
                  icon="pi pi-twitter"
                  severity="secondary"
                  outlined
                  :href="`https://twitter.com/${league.twitter_handle}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  as="a"
                />
                <Button
                  v-if="league.instagram_handle"
                  label="Instagram"
                  icon="pi pi-instagram"
                  severity="secondary"
                  outlined
                  :href="`https://instagram.com/${league.instagram_handle}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  as="a"
                />
                <Button
                  v-if="league.youtube_url"
                  label="YouTube"
                  icon="pi pi-youtube"
                  severity="secondary"
                  outlined
                  :href="league.youtube_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  as="a"
                />
                <Button
                  v-if="league.twitch_url"
                  label="Twitch"
                  icon="pi pi-twitch"
                  severity="secondary"
                  outlined
                  :href="league.twitch_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  as="a"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Driver Management Drawer -->
    <DriverManagementDrawer
      v-if="league"
      v-model:visible="showDriverDrawer"
      :league-id="leagueIdNumber"
      :league-name="league.name"
      :league-platforms="league.platforms || []"
      @close="showDriverDrawer = false"
    />

    <!-- Edit League Drawer -->
    <LeagueWizardDrawer
      v-model:visible="showEditDrawer"
      :is-edit-mode="true"
      :league-id="leagueIdNumber"
      @league-saved="handleLeagueSaved"
    />
  </div>
</template>
