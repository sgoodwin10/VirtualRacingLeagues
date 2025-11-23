<script setup lang="ts">
import { PhGameController, PhMapPinArea, PhSteeringWheel, PhTrophy } from '@phosphor-icons/vue';
import InfoItem from '@app/components/common/InfoItem.vue';
import type { League } from '@app/types/league';

interface Props {
  league: League;
}

defineProps<Props>();

function getPlatformNames(league: League): string {
  if (!league.platforms || league.platforms.length === 0) {
    return 'No platforms';
  }

  if (league.platforms.length <= 2) {
    return league.platforms.map((p) => p.name).join(', ');
  }

  return league.platforms.map((p) => p.name).join(', ');
}

function getCompetitionText(count: number): string {
  return `${count} Competition${count === 1 ? '' : 's'}`;
}

function getDriverText(count: number): string {
  return `${count} Driver${count === 1 ? '' : 's'}`;
}
</script>

<template>
  <div class="grid grid-cols-4 border-b border-gray-200 gap-px bg-surface-200">
    <InfoItem :icon="PhGameController" :text="getPlatformNames(league)" centered />
    <InfoItem :icon="PhMapPinArea" :text="league.timezone" centered />
    <InfoItem :icon="PhTrophy" :text="getCompetitionText(league.competitions_count)" centered />
    <InfoItem :icon="PhSteeringWheel" :text="getDriverText(league.drivers_count)" centered />
  </div>
</template>
