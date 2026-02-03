<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useVrlConfirm } from '@app/composables/useVrlConfirm';
import type { Competition, CompetitionSeason } from '@app/types/competition';
import type { Season } from '@app/types/season';
import type { MenuItem } from 'primevue/menuitem';
import HTag from '@app/components/common/HTag.vue';

import Tag from 'primevue/tag';
import Tooltip from 'primevue/tooltip';
import SpeedDial from 'primevue/speeddial';
import { Button, FooterAddButton } from '@app/components/common/buttons';
import InfoItem from '@app/components/common/InfoItem.vue';
import SeasonFormSplitModal from '@app/components/season/modals/SeasonFormSplitModal.vue';
import ResponsiveImage from '@app/components/common/ResponsiveImage.vue';
import { VrlConfirmDialog } from '@app/components/common/dialogs';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useSeasonStore } from '@app/stores/seasonStore';
import {
  PhCalendarBlank,
  PhGameController,
  PhSteeringWheel,
  PhFlag,
  PhTrophy,
  PhPlus,
  PhImage,
  PhWarning,
  PhArchive,
  PhTray as PhInbox,
} from '@phosphor-icons/vue';

interface Props {
  competition: Competition;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'edit'): void;
  (e: 'delete', competitionId: number): void;
  (e: 'archive'): void;
}

const emit = defineEmits<Emits>();

const router = useRouter();
const toast = useToast();
const {
  isVisible: confirmVisible,
  options: confirmOptions,
  isLoading: confirmLoading,
  showConfirmation,
  handleAccept: handleConfirmAccept,
  handleReject: handleConfirmReject,
} = useVrlConfirm();
const competitionStore = useCompetitionStore();
const seasonStore = useSeasonStore();

const vTooltip = Tooltip;

// Toast duration constants
const TOAST_SUCCESS_DURATION = 3000;
const TOAST_ERROR_DURATION = 5000;

// State
const showSeasonDrawer = ref(false);
const editingSeasonId = ref<number | null>(null);
const seasonOperations = ref<Record<number, boolean>>({});

const cardClasses = computed(() => ({
  'opacity-60': props.competition.is_archived,
}));

// SpeedDial actions
const speedDialActions = computed<MenuItem[]>(() => [
  {
    label: 'Edit',
    icon: 'pi pi-pencil',
    command: () => handleEdit(),
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => confirmDelete(),
  },
]);

// Sort seasons by created_at (most recent first)
// Performance optimization: parse dates once and cache timestamps
const sortedSeasons = computed(() => {
  if (!props.competition.seasons) return [];

  // Create array with cached timestamps for sorting
  const seasonsWithTimestamps = props.competition.seasons.map((season) => ({
    season,
    timestamp: new Date(season.created_at).getTime(),
  }));

  // Sort by timestamp (most recent first)
  seasonsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp);

  // Return just the seasons
  return seasonsWithTimestamps.map((item) => item.season);
});

const hasSeasons = computed(() => sortedSeasons.value.length > 0);

const hasLogo = computed(() => {
  const url = props.competition.logo_url;
  // Handle null, empty string, and legacy "default.png" placeholder
  return !!url && url !== 'default.png';
});

const editingSeasonData = ref<Season | null>(null);

// Convert competition_colour JSON string to CSS rgb() color
const competitionBackgroundColor = computed(() => {
  if (hasLogo.value) {
    return 'transparent';
  }

  if (!props.competition.competition_colour) {
    return 'rgb(226, 232, 240)'; // Fallback to slate-200
  }

  try {
    const rgb = JSON.parse(props.competition.competition_colour);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  } catch {
    return 'rgb(226, 232, 240)'; // Fallback on parse error
  }
});

function getSeasonStatusTooltip(season: CompetitionSeason): string {
  if (season.is_archived) {
    return `Archived Season`;
  }
  if (season.is_active) {
    return `Active Season`;
  }
  if (season.status === 'setup') {
    return `In Setup`;
  }
  return '';
}

/**
 * Get SpeedDial actions for a season
 * Dynamically shows Archive or Unarchive based on season state
 */
function getSeasonActions(season: CompetitionSeason): MenuItem[] {
  const actions: MenuItem[] = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => handleEditSeason(season.id),
    },
  ];

  // Show Archive or Unarchive based on current state
  if (season.is_archived) {
    actions.push({
      label: 'Unarchive',
      icon: 'pi pi-inbox',
      command: () => confirmUnarchiveSeason(season),
    });
  } else {
    actions.push({
      label: 'Archive',
      icon: 'pi pi-box',
      command: () => confirmArchiveSeason(season),
    });
  }

  // Delete is always available
  actions.push({
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => confirmDeleteSeason(season),
  });

  return actions;
}

function isSeasonLoading(seasonId: number): boolean {
  return seasonOperations.value[seasonId] || false;
}

function handleSeasonClick(seasonId: number): void {
  router.push({
    name: 'season-detail',
    params: {
      leagueId: props.competition.league_id,
      competitionId: props.competition.id,
      seasonId,
    },
  });
}

function handleCreateSeason(): void {
  showSeasonDrawer.value = true;
}

function handleSeasonSaved(): void {
  // Season automatically added to competition via reactive store updates
  // No need to re-fetch - the UI updates automatically through Pinia reactivity
  showSeasonDrawer.value = false;
  editingSeasonId.value = null;
  editingSeasonData.value = null;
}

function handleDrawerHide(): void {
  // Reset editing state when drawer closes without saving
  editingSeasonId.value = null;
  editingSeasonData.value = null;
}

async function handleEditSeason(seasonId: number): Promise<void> {
  // Race condition protection: prevent multiple edit operations
  // Also check if drawer is already open to prevent rapid successive clicks
  if (editingSeasonId.value !== null || showSeasonDrawer.value) {
    return;
  }

  try {
    editingSeasonId.value = seasonId;
    // Fetch full season data for editing
    editingSeasonData.value = await seasonStore.fetchSeason(seasonId);
    showSeasonDrawer.value = true;
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load season data',
      life: TOAST_ERROR_DURATION,
    });
    // Reset editing state on error to allow retry
    editingSeasonId.value = null;
    editingSeasonData.value = null;
  }
}

function confirmArchiveSeason(season: CompetitionSeason): void {
  showConfirmation({
    message: `Are you sure you want to archive "${season.name}"? All associated rounds and races will also be archived.`,
    header: 'Archive Season',
    icon: PhArchive,
    iconColor: 'var(--orange)',
    iconBgColor: 'var(--orange-dim)',
    acceptLabel: 'Archive Season',
    acceptVariant: 'warning',
    onAccept: async () => {
      await archiveSeason(season.id);
    },
  });
}

async function archiveSeason(seasonId: number): Promise<void> {
  seasonOperations.value[seasonId] = true;

  try {
    await seasonStore.archiveExistingSeason(seasonId);
    toast.add({
      severity: 'success',
      summary: 'Season Archived',
      detail: 'Season has been archived successfully',
      life: TOAST_SUCCESS_DURATION,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to archive season',
      life: TOAST_ERROR_DURATION,
    });
  } finally {
    delete seasonOperations.value[seasonId];
  }
}

function confirmUnarchiveSeason(season: CompetitionSeason): void {
  showConfirmation({
    message: `Are you sure you want to unarchive "${season.name}"?`,
    header: 'Unarchive Season',
    icon: PhInbox,
    iconColor: 'var(--green)',
    iconBgColor: 'var(--green-dim)',
    acceptLabel: 'Unarchive Season',
    acceptVariant: 'success',
    onAccept: async () => {
      await unarchiveSeason(season.id);
    },
  });
}

async function unarchiveSeason(seasonId: number): Promise<void> {
  seasonOperations.value[seasonId] = true;

  try {
    await seasonStore.unarchiveExistingSeason(seasonId);
    toast.add({
      severity: 'success',
      summary: 'Season Restored',
      detail: 'Season has been unarchived successfully',
      life: TOAST_SUCCESS_DURATION,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to unarchive season',
      life: TOAST_ERROR_DURATION,
    });
  } finally {
    delete seasonOperations.value[seasonId];
  }
}

function confirmDeleteSeason(season: CompetitionSeason): void {
  showConfirmation({
    message: `Are you sure you want to delete "${season.name}"? This action cannot be undone and will permanently remove all associated rounds, races, and results.`,
    header: 'Delete Season',
    icon: PhWarning,
    iconColor: 'var(--red)',
    iconBgColor: 'var(--red-dim)',
    acceptLabel: 'Delete Season',
    acceptVariant: 'danger',
    onAccept: async () => {
      await deleteSeason(season.id);
    },
  });
}

async function deleteSeason(seasonId: number): Promise<void> {
  seasonOperations.value[seasonId] = true;

  try {
    // Pass competition ID to ensure event is emitted even after page refresh
    await seasonStore.deleteExistingSeason(seasonId, props.competition.id);
    toast.add({
      severity: 'success',
      summary: 'Season Deleted',
      detail: 'Season has been deleted successfully',
      life: TOAST_SUCCESS_DURATION,
    });
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete season',
      life: TOAST_ERROR_DURATION,
    });
  } finally {
    delete seasonOperations.value[seasonId];
  }
}

function handleEdit(): void {
  emit('edit');
}

function confirmDelete(): void {
  showConfirmation({
    message: `Are you sure you want to delete "${props.competition.name}"? \nThis action cannot be undone and will remove all associated seasons and data.`,
    header: 'Delete Competition',
    icon: PhWarning,
    iconColor: 'var(--red)',
    iconBgColor: 'var(--red-dim)',
    acceptLabel: 'Delete Competition',
    acceptVariant: 'danger',
    onAccept: async () => {
      await deleteCompetition();
    },
  });
}

async function deleteCompetition(): Promise<void> {
  try {
    await competitionStore.deleteExistingCompetition(props.competition.id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Competition deleted successfully',
      life: TOAST_SUCCESS_DURATION,
    });
    emit('delete', props.competition.id);
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete competition',
      life: TOAST_ERROR_DURATION,
    });
  }
}

// Cleanup: clear seasonOperations on unmount to prevent memory leaks
onUnmounted(() => {
  seasonOperations.value = {};
});
</script>

<template>
  <div
    :class="cardClasses"
    class="competition-card flex flex-col w-full h-96 rounded-md border border-slate-200 bg-white hover:shadow-md transition-shadow duration-300 hover:border-primary-200"
  >
    <div class="flex bg-white rounded-t-md relative">
      <div
        class="flex items-center justify-center rounded-tl-md overflow-hidden"
        :style="{ backgroundColor: competitionBackgroundColor }"
        :class="{ 'w-18 h-18 m-1 p-1': hasLogo, 'w-16 h-16 m-2': !hasLogo }"
      >
        <ResponsiveImage
          v-if="hasLogo"
          :media="competition.logo"
          :fallback-url="competition.logo_url ?? undefined"
          :alt="competition.name"
          conversion="small"
          sizes="72px"
          img-class="w-full h-full object-cover rounded-tl-md"
        />
        <PhImage v-else :size="32" weight="light" class="text-white/50" />
      </div>

      <div class="flex-1 content-center pl-2 pr-2">
        <div class="flex justify-between items-start">
          <HTag :level="3">{{ competition.name }}</HTag>
          <Tag
            v-if="competition.is_archived"
            value="Archived"
            severity="secondary"
            class="text-xs"
          />
        </div>
        <p v-if="competition.description" class="text-gray-600 text-sm">
          {{ competition.description }}
        </p>
      </div>

      <div style="position: absolute; right: 8px; top: 8px" @click.stop>
        <SpeedDial
          :model="speedDialActions"
          direction="left"
          :button-props="{ size: 'small', rounded: true, severity: 'secondary' }"
          show-icon="pi pi-bars"
          hide-icon="pi pi-times"
          class="speeddial-competition"
        />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-px bg-surface-200 border-b border-t border-gray-200">
      <InfoItem
        v-if="competition.platform_name"
        :icon="PhGameController"
        :text="competition.platform_name"
        centered
      />
      <InfoItem
        v-if="competition.stats"
        :icon="PhFlag"
        :text="'Seasons ' + (competition.stats?.total_seasons ?? 0)"
        centered
      />
      <InfoItem
        v-if="competition.stats"
        :icon="PhSteeringWheel"
        :text="'Drivers ' + (competition.stats?.total_drivers ?? 0)"
        centered
      />
    </div>

    <div
      class="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400"
    >
      <!-- Empty state -->
      <div
        v-if="!hasSeasons"
        class="flex flex-col items-center justify-center h-full text-gray-400 gap-3"
      >
        <PhTrophy :size="48" weight="light" />
        <div class="text-center">
          <p class="text-sm font-medium">No seasons yet</p>
          <p class="text-xs mt-1">Get started by creating your first season</p>
        </div>
        <Button
          label="Create Season"
          :icon="PhPlus"
          variant="primary"
          size="sm"
          @click.stop="handleCreateSeason"
        />
      </div>

      <!-- Seasons list -->
      <div v-else class="space-y-2 min-h-0 flex-1 flex flex-col">
        <div class="px-2 font-medium text-sm text-slate-400">Seasons</div>
        <div class="flex-1 space-y-2 overflow-y-auto">
          <div
            v-for="season in sortedSeasons"
            :key="season.id"
            class="relative flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer hover:shadow-md"
            :class="{ 'opacity-60': isSeasonLoading(season.id) }"
            @click="handleSeasonClick(season.id)"
          >
            <!-- Season name -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="font-medium text-md text-slate-700 truncate">{{ season.name }}</span>
            </div>

            <!-- Season stats and status -->
            <div class="flex items-center gap-3 shrink-0 ml-2 mr-8">
              <!-- Status tag -->
              <Tag
                v-if="season.is_archived"
                v-tooltip.top="getSeasonStatusTooltip(season)"
                value="Archived"
                severity="secondary"
                class="shrink-0 text-xs"
              />
              <Tag
                v-else-if="season.is_active"
                v-tooltip.top="getSeasonStatusTooltip(season)"
                value="Active"
                severity="success"
                class="shrink-0 text-xs"
              />
              <Tag
                v-else-if="season.status === 'setup'"
                v-tooltip.top="getSeasonStatusTooltip(season)"
                value="Setup"
                severity="warn"
                class="shrink-0 text-xs"
              />

              <!-- Drivers -->
              <div
                v-tooltip.top="'Drivers: ' + (season.stats?.driver_count ?? 0)"
                class="flex items-center gap-1 text-xs text-slate-600"
              >
                <PhSteeringWheel :size="16" weight="regular" class="text-slate-400" />
                <span>{{ season.stats?.driver_count ?? 0 }}</span>
              </div>

              <!-- Rounds -->
              <div
                v-tooltip.top="'Rounds: ' + (season.stats?.round_count ?? 0)"
                class="flex items-center gap-1 text-xs text-slate-600"
              >
                <PhCalendarBlank :size="16" weight="regular" class="text-slate-400" />
                <span>{{ season.stats?.round_count ?? 0 }}</span>
              </div>

              <!-- Races -->
              <div
                v-tooltip.top="'Races: ' + (season.stats?.race_count ?? 0)"
                class="flex items-center gap-1 text-xs text-slate-600"
              >
                <PhFlag :size="16" weight="regular" class="text-slate-400" />
                <span>{{ season.stats?.race_count ?? 0 }}</span>
              </div>
            </div>

            <!-- Season SpeedDial -->
            <div
              style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%)"
              @click.stop
            >
              <SpeedDial
                :model="getSeasonActions(season)"
                direction="left"
                :button-props="{ size: 'small', rounded: true, severity: 'secondary' }"
                show-icon="pi pi-ellipsis-h"
                hide-icon="pi pi-times"
                :disabled="isSeasonLoading(season.id) || editingSeasonId !== null"
                class="speeddial-season"
              />
            </div>
          </div>
        </div>

        <!-- Create New Season Button (only shown when seasons exist) -->
        <FooterAddButton label="Create New Season" @click="handleCreateSeason" />
      </div>
    </div>

    <!-- Season Form Modal -->
    <SeasonFormSplitModal
      v-model:visible="showSeasonDrawer"
      :competition-id="competition.id"
      :competition-name="competition.name"
      :season="editingSeasonData"
      :is-edit-mode="!!editingSeasonId"
      @season-saved="handleSeasonSaved"
      @hide="handleDrawerHide"
    />

    <!-- Confirmation Dialog -->
    <VrlConfirmDialog
      v-model:visible="confirmVisible"
      v-bind="confirmOptions"
      :loading="confirmLoading"
      @accept="handleConfirmAccept"
      @reject="handleConfirmReject"
    />
  </div>
</template>

<style scoped></style>
