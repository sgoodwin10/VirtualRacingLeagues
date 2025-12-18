<template>
  <BaseModal :visible="isVisible" width="50rem" @update:visible="handleVisibleChange">
    <template #header>Driver Details</template>

    <template #footer>
      <!-- Can be expanded with action buttons if needed -->
      <div class="flex justify-end">
        <!-- Future action buttons can go here -->
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <i class="pi pi-spinner pi-spin text-blue-500 text-4xl"></i>
      <p class="text-gray-500 ml-4">Loading driver details...</p>
    </div>

    <!-- Content -->
    <div v-else-if="driver" class="space-y-4">
      <!-- Header Section with Driver Name and Status -->
      <div class="flex items-center justify-between pb-3 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="pi pi-user text-blue-600"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              {{ driver.display_name }}
            </h3>
            <p v-if="driver.email" class="text-sm text-gray-600">{{ driver.email }}</p>
          </div>
        </div>
      </div>

      <!-- Main Info Grid - 2 Columns -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Left Column: Driver Identity Info -->
        <div class="space-y-4">
          <!-- Identity Section -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-user text-blue-500"></i>
              Driver Information
            </h4>

            <div class="space-y-3">
              <!-- Full Name -->
              <div
                v-if="driver.first_name || driver.last_name"
                class="flex items-center justify-between"
              >
                <span class="text-gray-600">Full Name</span>
                <span class="text-gray-900 font-medium">
                  {{
                    driver.first_name && driver.last_name
                      ? `${driver.first_name} ${driver.last_name}`
                      : driver.first_name || driver.last_name
                  }}
                </span>
              </div>

              <!-- Nickname -->
              <div v-if="driver.nickname" class="flex items-center justify-between">
                <span class="text-gray-600">Nickname</span>
                <span class="text-gray-900 font-medium">{{ driver.nickname }}</span>
              </div>

              <!-- Email -->
              <div v-if="driver.email" class="flex items-center justify-between">
                <span class="text-gray-600">Email</span>
                <a :href="`mailto:${driver.email}`" class="text-blue-600 hover:text-blue-700">
                  {{ driver.email }}
                </a>
              </div>

              <!-- Phone -->
              <div v-if="driver.phone" class="flex items-center justify-between">
                <span class="text-gray-600">Phone</span>
                <a :href="`tel:${driver.phone}`" class="text-gray-900 hover:text-blue-600">
                  {{ driver.phone }}
                </a>
              </div>

              <!-- Slug -->
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Slug</span>
                <span class="text-gray-900 font-mono text-sm">{{ driver.slug }}</span>
              </div>

              <!-- Created Date -->
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Created</span>
                <span class="text-gray-900">{{ formatDate(driver.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Platform IDs -->
        <div class="space-y-4">
          <!-- Platform IDs Section -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-desktop text-purple-500"></i>
              Platform IDs
            </h4>

            <div class="space-y-3">
              <!-- PSN ID -->
              <div v-if="driver.psn_id">
                <p class="text-gray-600 text-sm mb-1 flex items-center gap-2">
                  <Badge text="PSN" variant="info" size="sm" />
                  PlayStation Network
                </p>
                <p class="text-gray-900 font-medium">{{ driver.psn_id }}</p>
              </div>

              <!-- iRacing ID -->
              <div v-if="driver.iracing_id">
                <p class="text-gray-600 text-sm mb-1 flex items-center gap-2">
                  <Badge text="iRacing" variant="success" size="sm" />
                  iRacing Username
                </p>
                <p class="text-gray-900 font-medium">{{ driver.iracing_id }}</p>
              </div>

              <!-- iRacing Customer ID -->
              <div v-if="driver.iracing_customer_id">
                <p class="text-gray-600 text-sm mb-1 flex items-center gap-2">
                  <Badge text="iRacing" variant="success" size="sm" />
                  iRacing Customer ID
                </p>
                <p class="text-gray-900 font-medium font-mono">{{ driver.iracing_customer_id }}</p>
              </div>

              <!-- Discord ID -->
              <div v-if="driver.discord_id">
                <p class="text-gray-600 text-sm mb-1 flex items-center gap-2">
                  <Badge text="Discord" variant="secondary" size="sm" />
                  Discord
                </p>
                <p class="text-gray-900 font-medium">{{ driver.discord_id }}</p>
              </div>

              <!-- No Platform IDs -->
              <div
                v-if="
                  !driver.psn_id &&
                  !driver.iracing_id &&
                  !driver.iracing_customer_id &&
                  !driver.discord_id
                "
                class="text-center py-4 text-gray-500"
              >
                <i class="pi pi-info-circle text-2xl mb-2"></i>
                <p>No platform IDs available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Linked User Section (if available) -->
      <div v-if="driverDetails?.user" class="pt-4 border-t border-gray-200">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="pi pi-link text-green-500"></i>
            Linked User Account
          </h4>
          <div class="grid grid-cols-3 gap-4">
            <!-- User Name -->
            <div>
              <p class="text-gray-600 text-sm mb-1">Name</p>
              <router-link
                :to="`/users?user_id=${driverDetails.user.id}`"
                class="text-blue-600 hover:text-blue-700 font-medium"
              >
                {{ driverDetails.user.first_name }} {{ driverDetails.user.last_name }}
              </router-link>
            </div>

            <!-- User Email -->
            <div>
              <p class="text-gray-600 text-sm mb-1">Email</p>
              <a
                :href="`mailto:${driverDetails.user.email}`"
                class="text-gray-900 hover:text-blue-600"
              >
                {{ driverDetails.user.email }}
              </a>
            </div>

            <!-- User Status -->
            <div>
              <p class="text-gray-600 text-sm mb-1">Status</p>
              <Badge
                :text="driverDetails.user.status"
                :variant="driverDetails.user.status === 'active' ? 'success' : 'secondary'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Race Statistics (if available) -->
      <div v-if="driverDetails?.race_stats" class="pt-4 border-t border-gray-200">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="pi pi-chart-bar text-green-500"></i>
            Race Statistics
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900">
                {{ driverDetails.race_stats.total_races }}
              </p>
              <p class="text-gray-600 text-sm mt-1">Total Races</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-yellow-600">
                {{ driverDetails.race_stats.total_wins }}
              </p>
              <p class="text-gray-600 text-sm mt-1">Wins</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600">
                {{ driverDetails.race_stats.total_podiums }}
              </p>
              <p class="text-gray-600 text-sm mt-1">Podiums</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-purple-600">
                {{ driverDetails.race_stats.total_poles }}
              </p>
              <p class="text-gray-600 text-sm mt-1">Pole Positions</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600">
                {{ driverDetails.race_stats.best_finish ?? '-' }}
              </p>
              <p class="text-gray-600 text-sm mt-1">Best Finish</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Leagues and Seasons Grid - 2 Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        <!-- Leagues -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="pi pi-sitemap text-blue-500"></i>
            Leagues
          </h4>
          <div v-if="driverDetails?.leagues && driverDetails.leagues.length > 0">
            <div v-for="league in driverDetails.leagues" :key="league.id" class="mb-3 last:mb-0">
              <div class="flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                <div
                  v-if="league.logo || league.logo_url"
                  class="w-10 h-10 rounded overflow-hidden flex-shrink-0"
                >
                  <ResponsiveImage
                    :media="league.logo"
                    :fallback-url="league.logo_url ?? undefined"
                    :alt="`${league.name} logo`"
                    conversion="thumb"
                    img-class="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div v-else class="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                  <i class="pi pi-sitemap text-gray-400"></i>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900">{{ league.name }}</p>
                  <p class="text-xs text-gray-500">{{ league.slug }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-gray-500">
            <i class="pi pi-inbox text-2xl mb-2"></i>
            <p>Not part of any leagues</p>
          </div>
        </div>

        <!-- Seasons -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="pi pi-calendar text-orange-500"></i>
            Seasons
          </h4>
          <div v-if="driverDetails?.seasons && driverDetails.seasons.length > 0">
            <DataTable
              :value="driverDetails.seasons"
              :rows="5"
              :paginator="driverDetails.seasons.length > 5"
              striped-rows
              size="small"
              class="text-sm"
            >
              <Column field="name" header="Season" style="min-width: 120px">
                <template #body="{ data }">
                  <span class="font-medium text-gray-900">{{ data.name }}</span>
                </template>
              </Column>
              <Column field="competition_name" header="Competition" style="min-width: 120px">
                <template #body="{ data }">
                  <span class="text-gray-700 text-sm">{{ data.competition_name }}</span>
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
            </DataTable>
          </div>
          <div v-else class="text-center py-4 text-gray-500">
            <i class="pi pi-inbox text-2xl mb-2"></i>
            <p>No season participation</p>
          </div>
        </div>
      </div>
    </div>

    <!-- No Driver Selected -->
    <div v-else class="text-center py-12 text-gray-500">
      <i class="pi pi-info-circle text-4xl mb-3"></i>
      <p>No driver selected</p>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import BaseModal from '@admin/components/modals/BaseModal.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Badge from '@admin/components/common/Badge.vue';
import ResponsiveImage from '@admin/components/common/ResponsiveImage.vue';
import { driverService } from '@admin/services/driverService';
import { useErrorToast } from '@admin/composables/useErrorToast';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { isRequestCancelled } from '@admin/types/errors';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import type { Driver, DriverDetails } from '@admin/types/driver';

interface Props {
  visible: boolean;
  driver: Driver | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

// Composables
const { showErrorToast } = useErrorToast();
const { getSignal, cancel: cancelRequests } = useRequestCancellation();
const { formatDate } = useDateFormatter();

// State
const loading = ref(false);
const driverDetails = ref<DriverDetails | null>(null);

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

/**
 * Handle visibility change from BaseModal
 */
const handleVisibleChange = (value: boolean): void => {
  emit('update:visible', value);
};

/**
 * Watch for driver or visibility changes and load details
 */
watch(
  [() => props.driver, () => props.visible],
  async ([driver, visible]) => {
    if (driver && visible) {
      await loadDriverDetails(driver.id);
    } else {
      driverDetails.value = null;
    }
  },
  { immediate: true },
);

/**
 * Load driver details from API
 */
const loadDriverDetails = async (driverId: number): Promise<void> => {
  loading.value = true;

  // Cancel any pending requests
  cancelRequests('Loading new driver details');

  try {
    driverDetails.value = await driverService.getDriverDetails(driverId, getSignal());
  } catch (error) {
    // Silently ignore cancelled requests
    if (isRequestCancelled(error)) {
      return;
    }

    showErrorToast(error, 'Failed to load driver details');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped></style>
