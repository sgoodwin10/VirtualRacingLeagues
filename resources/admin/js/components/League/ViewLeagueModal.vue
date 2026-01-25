<template>
  <BaseModal
    :visible="props.visible"
    width="50rem"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>League Details</template>

    <template #footer>
      <div class="flex justify-between items-center">
        <Button
          v-if="canLoginAsUser && detailedLeague?.owner"
          label="Login As User"
          icon="pi pi-sign-in"
          size="small"
          severity="warning"
          :loading="loggingInAsUser"
          @click="handleLoginAsUser"
        />
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <i class="pi pi-spinner pi-spin text-blue-500 text-4xl"></i>
      <p class="text-gray-500 ml-4">Loading league details...</p>
    </div>

    <!-- Content -->
    <div v-else-if="detailedLeague" class="space-y-4">
      <!-- Header Section with League Name and Status -->
      <div class="flex items-center justify-between pb-3 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <!-- League Logo or Icon -->
          <div
            v-if="detailedLeague.logo || detailedLeague.logo_url"
            class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
          >
            <ResponsiveImage
              :media="detailedLeague.logo"
              :fallback-url="detailedLeague.logo_url"
              :alt="`${detailedLeague.name} logo`"
              conversion="thumb"
              img-class="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div
            v-else
            class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <i class="pi pi-sitemap text-blue-600 text-lg"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              {{ detailedLeague.name }}
            </h3>
            <p class="text-sm text-gray-600 font-mono">{{ detailedLeague.slug }}</p>
          </div>
        </div>
        <Badge
          :text="detailedLeague.status"
          :variant="detailedLeague.status === 'active' ? 'success' : 'secondary'"
        />
      </div>

      <!-- Main Info Grid - 2 Columns -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Left Column: Basic Information -->
        <div class="space-y-4">
          <!-- Basic Information Section -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-info-circle text-purple-500"></i>
              Basic Information
            </h4>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">League ID</span>
                <span class="text-gray-900 font-medium">{{ detailedLeague.id }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600">Slug</span>
                <span class="text-gray-900 font-mono text-sm">{{ detailedLeague.slug }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600">Status</span>
                <Badge
                  :text="detailedLeague.status"
                  :variant="detailedLeague.status === 'active' ? 'success' : 'secondary'"
                />
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600">Visibility</span>
                <Badge :text="detailedLeague.visibility" variant="info" />
              </div>

              <div v-if="detailedLeague.timezone" class="flex items-center justify-between">
                <span class="text-gray-600">Timezone</span>
                <span class="text-gray-900 text-sm">{{ detailedLeague.timezone }}</span>
              </div>

              <div v-if="detailedLeague.created_at" class="flex items-center justify-between">
                <span class="text-gray-600">Created</span>
                <span class="text-gray-900 text-sm">{{
                  formatDate(detailedLeague.created_at)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Season Statistics -->
        <div class="space-y-4">
          <!-- Season Statistics Section -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-chart-bar text-green-500"></i>
              Season Statistics
            </h4>

            <div
              v-if="
                detailedLeague &&
                'seasons_summary' in detailedLeague &&
                detailedLeague.seasons_summary
              "
              class="grid grid-cols-3 gap-4"
            >
              <!-- Total Seasons -->
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900">
                  {{ detailedLeague.seasons_summary.total }}
                </p>
                <p class="text-gray-600 text-sm mt-1">Total</p>
              </div>

              <!-- Active Seasons -->
              <div class="text-center">
                <p class="text-2xl font-bold text-green-600">
                  {{ detailedLeague.seasons_summary.active }}
                </p>
                <p class="text-gray-600 text-sm mt-1">Active</p>
              </div>

              <!-- Completed Seasons -->
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-600">
                  {{ detailedLeague.seasons_summary.completed }}
                </p>
                <p class="text-gray-600 text-sm mt-1">Completed</p>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              <p>No statistics available</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Owner Section -->
      <div class="pt-4 border-t border-gray-200">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="pi pi-user text-blue-500"></i>
            League Owner
          </h4>
          <div v-if="detailedLeague.owner" class="grid grid-cols-2 gap-4">
            <!-- Owner Name -->
            <div>
              <p class="text-gray-600 text-sm mb-1">Owner Name</p>
              <router-link
                :to="`/users?user_id=${detailedLeague.owner.id}`"
                class="text-blue-600 hover:text-blue-700 font-medium"
              >
                {{ getFullName(detailedLeague.owner) }}
              </router-link>
            </div>

            <!-- Owner Email -->
            <div>
              <p class="text-gray-600 text-sm mb-1">Email</p>
              <a
                :href="`mailto:${detailedLeague.owner.email}`"
                class="text-gray-900 hover:text-blue-600"
              >
                {{ detailedLeague.owner.email }}
              </a>
            </div>
          </div>
          <div v-else class="text-gray-500 text-sm">No owner information available</div>
        </div>
      </div>

      <!-- Competitions Section -->
      <div class="pt-4 border-t border-gray-200">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="pi pi-trophy text-yellow-500"></i>
            Competitions
          </h4>

          <!-- Competitions Table -->
          <div
            v-if="
              detailedLeague &&
              'competitions' in detailedLeague &&
              detailedLeague.competitions &&
              detailedLeague.competitions.length > 0
            "
          >
            <DataTable
              :value="detailedLeague.competitions"
              :rows="5"
              :paginator="detailedLeague.competitions.length > 5"
              striped-rows
              size="small"
              class="text-sm"
            >
              <Column field="name" header="Name" style="min-width: 120px">
                <template #body="{ data }">
                  <span class="font-medium text-gray-900">{{ data.name }}</span>
                </template>
              </Column>

              <Column field="platform_name" header="Platform" style="min-width: 100px">
                <template #body="{ data }">
                  <span class="text-gray-700">{{ data.platform_name }}</span>
                </template>
              </Column>

              <Column field="status" header="Status" style="min-width: 80px">
                <template #body="{ data }">
                  <Tag
                    :value="data.status"
                    :severity="data.status === 'active' ? 'success' : 'secondary'"
                  />
                </template>
              </Column>

              <Column field="season_count" header="Seasons" style="min-width: 80px">
                <template #body="{ data }">
                  <span class="text-gray-700 font-medium">{{ data.season_count }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
          <div v-else class="text-center py-4 text-gray-500">
            <i class="pi pi-inbox text-2xl mb-2"></i>
            <p>No competitions found</p>
          </div>
        </div>
      </div>

      <!-- Social Links Section (if any exist) -->
      <div v-if="hasSocialLinks" class="pt-4 border-t border-gray-200">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="pi pi-share-alt text-indigo-500"></i>
            Social Links
          </h4>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              v-if="detailedLeague.website_url"
              :href="detailedLeague.website_url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <i class="pi pi-globe text-blue-500"></i>
              <span class="text-sm text-gray-700">Website</span>
            </a>

            <a
              v-if="detailedLeague.discord_url"
              :href="detailedLeague.discord_url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-indigo-500 transition-colors"
            >
              <i class="pi pi-discord text-indigo-500"></i>
              <span class="text-sm text-gray-700">Discord</span>
            </a>

            <a
              v-if="detailedLeague.twitter_handle"
              :href="`https://twitter.com/${detailedLeague.twitter_handle}`"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-sky-500 transition-colors"
            >
              <i class="pi pi-twitter text-sky-500"></i>
              <span class="text-sm text-gray-700">Twitter</span>
            </a>

            <a
              v-if="detailedLeague.youtube_url"
              :href="detailedLeague.youtube_url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-red-500 transition-colors"
            >
              <i class="pi pi-youtube text-red-500"></i>
              <span class="text-sm text-gray-700">YouTube</span>
            </a>

            <a
              v-if="detailedLeague.twitch_url"
              :href="detailedLeague.twitch_url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-purple-500 transition-colors"
            >
              <i class="pi pi-twitch text-purple-500"></i>
              <span class="text-sm text-gray-700">Twitch</span>
            </a>

            <a
              v-if="detailedLeague.instagram_handle"
              :href="`https://instagram.com/${detailedLeague.instagram_handle}`"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-pink-500 transition-colors"
            >
              <i class="pi pi-instagram text-pink-500"></i>
              <span class="text-sm text-gray-700">Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center text-gray-500 py-12">
      <i class="pi pi-inbox text-4xl mb-4"></i>
      <p class="text-lg">No league selected</p>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import Button from 'primevue/button';
import Badge from '@admin/components/common/Badge.vue';
import ResponsiveImage from '@admin/components/common/ResponsiveImage.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import type { League, LeagueDetails } from '@admin/types/league';
import { useNameHelpers } from '@admin/composables/useNameHelpers';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { useAdminStore } from '@admin/stores/adminStore';
import { leagueService } from '@admin/services/leagueService';
import { userService } from '@admin/services/userService';
import { logger } from '@admin/utils/logger';
import { buildLoginAsUrl } from '@admin/utils/url';

/**
 * Props interface for ViewLeagueModal component
 */
export interface ViewLeagueModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * League to display
   */
  league: League | null;
}

/**
 * Emits interface for ViewLeagueModal component
 */
export interface ViewLeagueModalEmits {
  /**
   * Emitted when visibility changes
   */
  (event: 'update:visible', value: boolean): void;
}

// Props
const props = defineProps<ViewLeagueModalProps>();

// Emits
const emit = defineEmits<ViewLeagueModalEmits>();

// Composables and services
const { getFullName } = useNameHelpers();
const { formatDate } = useDateFormatter();
const adminStore = useAdminStore();
const toast = useToast();

// State
const loading = ref(false);
const detailedLeague = ref<LeagueDetails | League | null>(null);
const loggingInAsUser = ref(false);

/**
 * Check if current admin can login as user
 */
const canLoginAsUser = computed((): boolean => {
  return adminStore.isAdmin;
});

/**
 * Check if league has any social links
 */
const hasSocialLinks = computed((): boolean => {
  if (!detailedLeague.value) return false;
  return !!(
    detailedLeague.value.website_url ||
    detailedLeague.value.discord_url ||
    detailedLeague.value.twitter_handle ||
    detailedLeague.value.youtube_url ||
    detailedLeague.value.twitch_url ||
    detailedLeague.value.instagram_handle
  );
});

/**
 * Load detailed league information
 */
const loadLeagueDetails = async (): Promise<void> => {
  if (!props.league) return;

  loading.value = true;
  try {
    // For now, use the getLeagueDetails method (which will be implemented by backend)
    // If it fails, fall back to the basic league data
    detailedLeague.value = await leagueService.getLeagueDetails(props.league.id);
  } catch (error) {
    // If detailed endpoint doesn't exist yet, use basic league data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Detailed league endpoint not available yet, using basic data', errorMessage);
    detailedLeague.value = props.league;
  } finally {
    loading.value = false;
  }
};

/**
 * Handle login as user action
 */
const handleLoginAsUser = async (): Promise<void> => {
  if (!detailedLeague.value?.owner) return;

  loggingInAsUser.value = true;
  try {
    const { token } = await userService.loginAsUser(detailedLeague.value.owner.id.toString());

    // Build login URL with proper port handling
    const loginUrl = buildLoginAsUrl(token);

    // Open in new tab
    window.open(loginUrl, '_blank');

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Opening user dashboard for ${getFullName(detailedLeague.value.owner)}`,
      life: 3000,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to login as user', errorMessage);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to login as user',
      life: 3000,
    });
  } finally {
    loggingInAsUser.value = false;
  }
};

/**
 * Watch for league changes and load details
 */
watch(
  () => props.visible,
  async (newValue) => {
    if (newValue && props.league) {
      await loadLeagueDetails();
    }
  },
);
</script>
