<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { PhGameController, PhHash, PhCalendar, PhTrophy, PhCaretRight } from '@phosphor-icons/vue';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import BaseModalHeader from '@app/components/common/modals/BaseModalHeader.vue';
import { Button } from '@app/components/common/buttons';
import { TagIndicator, BaseBadge } from '@app/components/common/indicators';
import { ListSectionHeader } from '@app/components/common/lists';
import DriverStatusBadge from './DriverStatusBadge.vue';
import { useDateFormatter } from '@app/composables/useDateFormatter';
import { getLeagueDriverSeasons } from '@app/services/driverSeasonService';
import type { LeagueDriver, LeagueDriverSeasonData } from '@app/types/driver';

interface Props {
  visible: boolean;
  driver: LeagueDriver | null;
  showEditButton?: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
  (e: 'edit'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showEditButton: true,
});
const emit = defineEmits<Emits>();
const router = useRouter();

const { formatDate } = useDateFormatter();

// State for seasons
const driverSeasons = ref<LeagueDriverSeasonData[]>([]);
const loadingSeasons = ref(false);
const seasonsError = ref<string | null>(null);

/**
 * Get driver's full name
 */
const driverName = computed(() => {
  if (!props.driver?.driver) return '';
  return props.driver.driver.display_name;
});

/**
 * Get driver's initials for avatar
 */
const driverInitials = computed(() => {
  if (!props.driver?.driver) return '?';
  const name = props.driver.driver.display_name;
  const parts = name.split(' ').filter((p) => p.length > 0);

  // Handle empty array (name is empty or only spaces)
  if (parts.length === 0) return '?';

  // Handle single name (return first 2 characters)
  if (parts.length === 1) return parts[0]!.substring(0, 2).toUpperCase();

  // Handle multiple names (first and last initials)
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
});

/**
 * Fetch driver seasons when modal becomes visible and driver is set
 */
watch(
  () => [props.visible, props.driver],
  async ([visible, driver]) => {
    if (visible && driver) {
      await fetchDriverSeasons();
    }
  },
  { immediate: true },
);

/**
 * Fetch driver seasons from API
 */
async function fetchDriverSeasons(): Promise<void> {
  if (!props.driver?.league_id || !props.driver?.id) return;

  loadingSeasons.value = true;
  seasonsError.value = null;

  try {
    driverSeasons.value = await getLeagueDriverSeasons(props.driver.league_id, props.driver.id);
  } catch (error) {
    console.error('Failed to fetch driver seasons:', error);
    seasonsError.value = 'Failed to load seasons';
    driverSeasons.value = [];
  } finally {
    loadingSeasons.value = false;
  }
}

/**
 * Get driver's platform IDs with icons
 */
const platformIds = computed(() => {
  if (!props.driver?.driver) return [];

  const platforms = [];
  const driver = props.driver.driver;

  if (driver.psn_id) {
    platforms.push({
      label: 'PSN ID',
      value: driver.psn_id,
      icon: PhGameController,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      isPrimary: driver.primary_platform_id === 'psn',
    });
  }
  if (driver.iracing_id) {
    platforms.push({
      label: 'iRacing ID',
      value: driver.iracing_id,
      icon: PhGameController,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      isPrimary: driver.primary_platform_id === 'iracing',
    });
  }
  if (driver.iracing_customer_id) {
    platforms.push({
      label: 'iRacing Customer ID',
      value: driver.iracing_customer_id.toString(),
      icon: PhHash,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      isPrimary: false,
    });
  }

  return platforms;
});

/**
 * Check if driver has any platform IDs
 */
const hasPlatformIds = computed(() => platformIds.value.length > 0);

/**
 * Navigate to season page
 */
async function navigateToSeason(season: LeagueDriverSeasonData): Promise<void> {
  if (!props.driver?.league_id) return;

  handleClose();
  try {
    await router.push(
      `/leagues/${props.driver.league_id}/competitions/${season.competition_id}/seasons/${season.season_id}`,
    );
  } catch (error) {
    console.error('Navigation failed:', error);
  }
}

/**
 * Handle close button
 */
const handleClose = (): void => {
  emit('close');
  emit('update:visible', false);
};

/**
 * Handle edit button
 */
const handleEdit = (): void => {
  emit('edit');
};
</script>

<template>
  <BaseModal :visible="visible" width="3xl" @update:visible="$emit('update:visible', $event)">
    <template #header>
      <BaseModalHeader :title="`Driver Details - ${driverName}`" />
    </template>

    <div v-if="driver" class="space-y-6">
      <!-- Driver Header -->
      <div class="flex items-start gap-6 pb-6 border-b border-[var(--border)]">
        <!-- Avatar -->
        <div
          class="flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center border-2 border-cyan-400 shadow-lg"
        >
          <span class="font-mono font-bold text-2xl text-white">{{ driverInitials }}</span>
        </div>

        <!-- Driver Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h2 class="text-card-title text-xl mb-1">
                {{ driver.driver.display_name }}
              </h2>
              <p v-if="driver.driver.nickname" class="text-body-small text-[var(--text-muted)]">
                "{{ driver.driver.nickname }}"
              </p>
            </div>
            <DriverStatusBadge :status="driver.status" />
          </div>

          <!-- Driver Number and Date -->
          <div class="flex gap-6 mt-4">
            <div class="flex items-center gap-2">
              <PhHash :size="16" class="text-[var(--text-muted)]" />
              <span class="text-form-label text-[var(--text-muted)]">Number</span>
              <span class="font-mono font-semibold text-[var(--text-primary)]">
                {{ driver.driver_number ?? 'N/A' }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <PhCalendar :size="16" class="text-[var(--text-muted)]" />
              <span class="text-form-label text-[var(--text-muted)]">Added</span>
              <span class="text-body-small text-[var(--text-secondary)]">
                {{ formatDate(driver.added_to_league_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Platform Identifiers Section -->
      <section>
        <ListSectionHeader title="Platform Identifiers" class="mb-4" />
        <div v-if="hasPlatformIds" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Platform Items -->
          <div
            v-for="platform in platformIds"
            :key="platform.label"
            :class="[
              'flex items-center gap-3 p-3 rounded-lg border transition-all',
              platform.isPrimary
                ? 'bg-cyan-dim border-cyan-500'
                : 'bg-surface-200 border-transparent',
            ]"
          >
            <div
              :class="[
                'flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg',
                platform.bgColor,
              ]"
            >
              <component :is="platform.icon" :size="20" :class="platform.iconColor" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-form-label text-[var(--text-muted)] uppercase">
                  {{ platform.label }}
                </span>
                <TagIndicator v-if="platform.isPrimary" variant="cyan" size="xs">
                  PRIMARY
                </TagIndicator>
              </div>
              <div class="font-mono font-semibold text-[var(--text-primary)] mt-0.5">
                {{ platform.value }}
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="text-center py-8 px-4 bg-surface-100 rounded-lg border border-[var(--border)]"
        >
          <PhGameController :size="48" class="text-[var(--text-muted)] opacity-30 mx-auto mb-3" />
          <p class="text-body-small text-[var(--text-muted)]">No platform identifiers available</p>
        </div>
      </section>

      <!-- Competitions & Seasons Section -->
      <section>
        <ListSectionHeader title="Competitions & Seasons" class="mb-4" />

        <!-- Loading State -->
        <div
          v-if="loadingSeasons"
          class="text-center py-12 px-4 bg-surface-100 rounded-lg border border-[var(--border)]"
        >
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
          <p class="mt-3 text-body-small text-[var(--text-muted)]">Loading seasons...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="seasonsError"
          class="text-center py-12 px-4 bg-surface-100 rounded-lg border border-[var(--border)]"
        >
          <PhTrophy :size="48" class="text-red-500 opacity-30 mx-auto mb-3" />
          <p class="text-body-small text-red-600">{{ seasonsError }}</p>
        </div>

        <!-- Season List -->
        <div v-else-if="driverSeasons.length > 0" class="space-y-2">
          <button
            v-for="season in driverSeasons"
            :key="season.season_id"
            type="button"
            class="w-full flex items-center gap-4 p-4 rounded-lg bg-surface-200 border border-transparent hover:border-cyan-500 hover:bg-cyan-dim transition-all group"
            @click="navigateToSeason(season)"
          >
            <!-- Active Indicator -->
            <div
              v-if="season.season_status === 'active'"
              class="flex-shrink-0 w-2 h-2 rounded-full bg-green-500"
            />
            <div v-else class="flex-shrink-0 w-2 h-2" />

            <!-- Season Info -->
            <div class="flex-1 flex flex-row text-left min-w-0">
              <div class="flex flex-grow">
                <div class="self-center">
                  {{ season.season_name }}
                </div>
                <div class="text-sm text-[var(--text-secondary)] self-center pl-2">
                  {{ season.competition_name }}
                </div>
              </div>

              <div class="flex items-center gap-2 mt-0.5 h-full">
                <BaseBadge v-if="season.season_status === 'active'" variant="green" size="md">
                  ACTIVE
                </BaseBadge>
                <BaseBadge v-if="season.division_name" variant="purple" size="md">
                  {{ season.division_name }}
                </BaseBadge>
                <BaseBadge v-if="season.team_name" variant="cyan" size="md">
                  {{ season.team_name }}
                </BaseBadge>
              </div>
            </div>

            <!-- Arrow Icon -->
            <PhCaretRight
              :size="20"
              weight="bold"
              class="flex-shrink-0 text-[var(--text-muted)] group-hover:text-cyan-500 transition-colors"
            />
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="text-center py-12 px-4 bg-surface-100 rounded-lg border border-[var(--border)]"
        >
          <PhTrophy :size="48" class="text-[var(--text-muted)] opacity-30 mx-auto mb-3" />
          <p class="text-body-small text-[var(--text-muted)]">
            Not participating in any seasons yet
          </p>
        </div>
      </section>

      <!-- League Notes Section -->
      <section v-if="driver.league_notes">
        <ListSectionHeader title="League Notes" class="mb-4" />
        <div class="p-4 bg-surface-100 rounded-lg border border-[var(--border)]">
          <p class="text-body text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
            {{ driver.league_notes }}
          </p>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Close" variant="secondary" @click="handleClose" />
        <Button v-if="showEditButton" label="Edit Driver" variant="warning" @click="handleEdit" />
      </div>
    </template>
  </BaseModal>
</template>
