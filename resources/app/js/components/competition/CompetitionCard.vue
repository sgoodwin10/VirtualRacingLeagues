<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import type { Competition, CompetitionSeason } from '@app/types/competition';
import type { MenuItem } from 'primevue/menuitem';
import HTag from '@app/components/common/HTag.vue';

import Tag from 'primevue/tag';
import Tooltip from 'primevue/tooltip';
import SpeedDial from 'primevue/speeddial';
import InfoItem from '@app/components/common/InfoItem.vue';
import SeasonFormDrawer from '@app/components/season/modals/SeasonFormDrawer.vue';
import { useCompetitionStore } from '@app/stores/competitionStore';
import {
  PhCalendarBlank,
  PhGameController,
  PhSteeringWheel,
  PhFlag,
  PhTrophy,
  PhPlus,
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
const confirm = useConfirm();
const competitionStore = useCompetitionStore();

const vTooltip = Tooltip;

// State
const showSeasonDrawer = ref(false);

const cardClasses = computed(() => ({
  'opacity-60': props.competition.is_archived,
}));

// SpeedDial actions
const speedDialActions = computed<MenuItem[]>(() => [
  {
    label: 'Edit',
    icon: 'pi pi-pencil',
    command: handleEdit,
    severity: 'warn',
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: confirmDelete,
    severity: 'danger',
  },
]);

// Sort seasons by created_at (most recent first)
const sortedSeasons = computed(() => {
  if (!props.competition.seasons) return [];
  return [...props.competition.seasons].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
});

const hasSeasons = computed(() => sortedSeasons.value.length > 0);

function getSeasonStatusTooltip(season: CompetitionSeason): string {
  const drivers = season.stats.driver_count;
  const rounds = season.stats.round_count;
  const races = season.stats.race_count;

  if (season.is_archived) {
    return `Archived Season - ${drivers} drivers, ${rounds} rounds, ${races} races`;
  }
  if (season.is_active) {
    return `Active Season - ${drivers} drivers, ${rounds} rounds, ${races} races`;
  }
  if (season.status === 'setup') {
    return `In Setup - ${drivers} drivers, ${rounds} rounds, ${races} races`;
  }
  return '';
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
  // Refresh will be handled by parent component re-fetching data
  // The drawer will close itself via v-model:visible
  showSeasonDrawer.value = false;
}

function handleEdit(): void {
  emit('edit');
}

function confirmDelete(): void {
  confirm.require({
    message: `Are you sure you want to delete "${props.competition.name}"? This action cannot be undone and will remove all associated seasons and data.`,
    header: 'Delete Competition',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteCompetition(),
  });
}

async function deleteCompetition(): Promise<void> {
  try {
    await competitionStore.deleteExistingCompetition(props.competition.id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Competition deleted successfully',
      life: 3000,
    });
    emit('delete', props.competition.id);
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete competition',
      life: 5000,
    });
  }
}
</script>

<template>
  <div
    :class="cardClasses"
    class="competition-card flex flex-col w-full h-72 rounded-md border border-slate-200 bg-white hover:shadow-md transition-shadow duration-300 hover:border-primary-200"
  >
    <div class="flex bg-white rounded-t-md relative">
      <div class="w-18 h-18 p-2">
        <img
          :src="competition.logo_url"
          :alt="competition.name"
          class="w-full h-full object-cover"
        />
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

      <SpeedDial
        :model="speedDialActions"
        direction="left"
        :button-props="{ size: 'small', rounded: true, severity: 'secondary' }"
        show-icon="pi pi-bars"
        hide-icon="pi pi-times"
        style="position: absolute; right: 8px; top: 8px"
        class="speeddial-right"
      />
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
        :text="'Seasons ' + competition.stats.total_seasons"
        centered
      />
      <InfoItem
        v-if="competition.stats"
        :icon="PhSteeringWheel"
        :text="'Drivers ' + competition.stats.total_drivers"
        centered
      />
    </div>

    <div
      class="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400"
    >
      <!-- Empty state -->
      <div
        v-if="!hasSeasons"
        class="flex flex-col items-center justify-center h-full text-gray-400 gap-2"
      >
        <PhTrophy :size="32" weight="light" />
        <p class="text-sm">No seasons yet</p>
      </div>

      <!-- Seasons list -->
      <div v-else class="space-y-2 min-h-0">
        <div class="px-2 font-medium text-sm text-slate-400">Seasons</div>
        <div
          v-for="season in sortedSeasons"
          :key="season.id"
          class="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
          @click="handleSeasonClick(season.id)"
        >
          <!-- Season name -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="font-medium text-sm text-slate-700 truncate">{{ season.name }}</span>
          </div>

          <!-- Season stats and status -->
          <div class="flex items-center gap-3 shrink-0 ml-2">
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
            <div class="flex items-center gap-1 text-xs text-slate-600">
              <PhSteeringWheel :size="16" weight="regular" class="text-slate-400" />
              <span>{{ season.stats.driver_count }}</span>
            </div>

            <!-- Rounds -->
            <div class="flex items-center gap-1 text-xs text-slate-600">
              <PhCalendarBlank :size="16" weight="regular" class="text-slate-400" />
              <span>{{ season.stats.round_count }}</span>
            </div>

            <!-- Races -->
            <div class="flex items-center gap-1 text-xs text-slate-600">
              <PhFlag :size="16" weight="regular" class="text-slate-400" />
              <span>{{ season.stats.race_count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Create New Season Button -->
      <div class="mt-2">
        <button
          type="button"
          class="flex items-center justify-center gap-2 w-full p-2 bg-white rounded border-2 border-dashed border-slate-300 hover:border-primary-400 hover:bg-primary-50/20 transition-all cursor-pointer group text-slate-500 hover:text-primary-600"
          @click.stop="handleCreateSeason"
        >
          <PhPlus :size="16" weight="bold" class="text-slate-400 group-hover:text-primary-500" />
          <span class="text-sm font-medium">Create New Season</span>
        </button>
      </div>
    </div>

    <!-- Season Form Drawer -->
    <SeasonFormDrawer
      v-model:visible="showSeasonDrawer"
      :competition-id="competition.id"
      :is-edit-mode="false"
      @season-saved="handleSeasonSaved"
    />
  </div>
</template>

<style scoped></style>
