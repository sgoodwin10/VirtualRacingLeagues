<template>
  <div
    class="flex flex-row rounded-lg border border-[var(--color-border-muted)] hover:border-[var(--color-border-default)] transition-colors bg-elevated"
  >
    <div
      class="flex items-center p-4 border-r rounded-l-lg border-[var(--color-border-default)] bg-[var(--color-bg-dark)]"
    >
      <PhFlagCheckered size="24" class="text-white" />
    </div>

    <div class="flex flex-grow items-center">
      <div class="flex-grow flex flex-row items-center">
        <div class="flex items-center px-2 min-w-[200px]">
          <div class="flex flex-col">
            <span class="font-medium text-primary">{{
              race.name || `Race ${race.race_number}`
            }}</span>
            <span v-if="race.race_type" class="text-sm text-muted">{{ raceTypeLabel }}</span>
          </div>
        </div>

        <div class="flex flex-row gap-6 text-sm text-gray-600 mr-4">
          <div class="flex flex-col min-w-18">
            <div class="font-medium text-gray-500">Grid Source</div>
            <div class="text-secondary">{{ formatGridSource(race.grid_source) }}</div>
          </div>
          <div class="flex flex-col min-w-18">
            <div class="font-medium text-gray-500">Length</div>
            <div class="text-secondary">{{ formatRaceLength(race) }}</div>
          </div>
          <div v-if="race.weather">
            <div class="flex flex-col min-w-18">
              <div class="font-medium text-gray-500">Weather</div>
              <div class="text-secondary">{{ race.weather }}</div>
            </div>
          </div>
          <div v-if="race.mandatory_pit_stop">
            <div class="flex flex-col">
              <div class="font-medium text-gray-500">Pit Stop</div>
              <div class="text-secondary">
                {{ race.minimum_pit_time ? `${race.minimum_pit_time}s min` : 'Mandatory' }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 ml-auto">
          <BaseBadge
            v-if="hasRacePoints"
            v-tooltip.top="{
              value: formatRacePointsTooltip(race),
              escape: false,
              pt: {
                text: 'max-w-md whitespace-pre-wrap font-mono text-xs leading-relaxed',
              },
            }"
            variant="default"
          >
            Race Points
          </BaseBadge>
          <BaseBadge v-if="hasFastestLapBonus" variant="cyan"> FL Bonus </BaseBadge>
        </div>
      </div>

      <div class="flex-none flex items-center gap-2 mx-4">
        <Button
          :label="isCompleted ? 'Results' : 'Enter Results'"
          :icon="isCompleted ? PhTrophy : PhListChecks"
          size="sm"
          :variant="isCompleted ? 'outline' : 'primary'"
          @click="handleEnterResults"
        />
        <div v-if="!isRoundCompleted" class="flex items-center gap-2">
          <OrphanedResultsWarning
            :race-id="race.id"
            :has-orphaned-results="race.has_orphaned_results"
            :is-completed="isCompleted"
            :is-qualifying="false"
            @orphans-removed="handleOrphansRemoved"
          />
          <BaseToggleSwitch v-model="isCompleted" @update:model-value="handleToggleStatus">
            <template #handle="{ checked }">
              <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]" />
            </template>
          </BaseToggleSwitch>
          <span :class="['text-sm font-medium', isCompleted ? 'text-green-600' : 'text-slate-400']">
            Completed
          </span>
        </div>
        <Button
          v-if="!isRoundCompleted && !isCompleted"
          :icon="PhPencil"
          size="sm"
          variant="warning"
          aria-label="Edit race"
          :title="`Edit race`"
          @click="handleEdit"
        />

        <Button
          v-if="!isRoundCompleted && !isCompleted"
          :icon="PhTrash"
          size="sm"
          variant="danger"
          aria-label="Delete round"
          :title="`Delete race`"
          @click="handleDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@app/components/common/buttons';
import BaseToggleSwitch from '@app/components/common/inputs/BaseToggleSwitch.vue';
import { BaseBadge } from '@app/components/common/indicators';
import OrphanedResultsWarning from './OrphanedResultsWarning.vue';
import type { Race, GridSource } from '@app/types/race';
import { RACE_TYPE_OPTIONS, GRID_SOURCE_OPTIONS } from '@app/types/race';
import { PhFlagCheckered, PhListChecks, PhPencil, PhTrash, PhTrophy } from '@phosphor-icons/vue';

interface Props {
  race: Race;
  isRoundCompleted?: boolean;
}

interface Emits {
  (e: 'edit', race: Race): void;
  (e: 'delete', race: Race): void;
  (e: 'enterResults', race: Race): void;
  (e: 'toggleStatus', race: Race, newStatus: 'scheduled' | 'completed'): void;
  (e: 'refresh'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const raceTypeLabel = computed(() => {
  const option = RACE_TYPE_OPTIONS.find((opt) => opt.value === props.race.race_type);
  return option?.label || props.race.race_type;
});

const hasFastestLapBonus = computed(() => {
  return props.race.fastest_lap !== null && props.race.fastest_lap > 0;
});

const hasRacePoints = computed(() => {
  return !!props.race.race_points;
});

const isCompleted = computed({
  get: () => props.race.status === 'completed',
  set: () => {
    // Handled by handleToggleStatus
  },
});

function formatRaceLength(race: Race): string {
  if (race.length_type === 'laps') {
    return `${race.length_value} laps`;
  } else {
    return `${race.length_value} minutes${race.extra_lap_after_time ? ' + lap' : ''}`;
  }
}

function formatGridSource(gridSource: GridSource): string {
  const option = GRID_SOURCE_OPTIONS.find((opt) => opt.value === gridSource);
  return option?.label || gridSource;
}

function formatRacePointsTooltip(race: Race): string {
  const lines: string[] = ['<strong>Race Points Configuration</strong>', ''];

  // Parse points system
  if (race.points_system && Object.keys(race.points_system).length > 0) {
    const positions = Object.entries(race.points_system)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(
        ([pos, pts]) => `<span class="w-6">P${pos}:</span> <span class="font-bold">${pts}</span>`,
      );

    lines.push('<strong>Position Points:</strong>');

    // Create a grid layout for position points
    lines.push(
      '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem 0.5rem; margin-top: 0.5rem;">',
    );
    positions.forEach((positionText) => {
      lines.push(`<div style="white-space: nowrap;">${positionText}</div>`);
    });
    lines.push('</div>');
    lines.push('');
  } else {
    lines.push('<strong>Position Points:</strong> Not configured');
    lines.push('');
  }

  // Bonus points
  const bonuses: string[] = [];

  if (race.fastest_lap !== null && race.fastest_lap > 0) {
    const restriction = race.fastest_lap_top_10 ? ' (Top 10 only)' : '';
    bonuses.push(`Fastest Lap: +${race.fastest_lap} pts${restriction}`);
  }

  // Other points
  const otherPoints: string[] = [];
  if (race.dnf_points !== 0) {
    otherPoints.push(`DNF: ${race.dnf_points} pts`);
  }
  if (race.dns_points !== 0) {
    otherPoints.push(`DNS: ${race.dns_points} pts`);
  }

  if (bonuses.length > 0) {
    lines.push('<strong>Bonus Points:</strong>');
    lines.push(bonuses.join('\n'));
  }

  if (otherPoints.length > 0) {
    if (bonuses.length > 0) {
      lines.push('');
    }
    lines.push('<strong>Other Points:</strong>');
    lines.push(otherPoints.join('\n'));
  }

  if (bonuses.length === 0 && otherPoints.length === 0) {
    lines.push('<strong>Bonus Points:</strong> None');
  }

  return lines.join('\n');
}

function handleEdit(): void {
  emit('edit', props.race);
}

function handleDelete(): void {
  emit('delete', props.race);
}

function handleEnterResults(): void {
  emit('enterResults', props.race);
}

function handleToggleStatus(checked: boolean): void {
  const newStatus = checked ? 'completed' : 'scheduled';
  emit('toggleStatus', props.race, newStatus);
}

function handleOrphansRemoved(): void {
  emit('refresh');
}
</script>
