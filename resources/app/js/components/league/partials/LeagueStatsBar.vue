<script setup lang="ts">
import { PhGameController, PhMapPinArea, PhSteeringWheel, PhTrophy } from '@phosphor-icons/vue';
import InfoItem from '@app/components/common/InfoItem.vue';
import type { League, Platform } from '@app/types/league';

interface Props {
  league: League;
}

defineProps<Props>();

function getPlatformNames(league: League): string {
  if (!league.platforms) {
    return 'No platforms';
  }

  // Ensure platforms is an array (handle edge case where it might be an object)
  const platformsArray = Array.isArray(league.platforms)
    ? league.platforms
    : (Object.values(league.platforms) as Platform[]);

  if (platformsArray.length === 0) {
    return 'No platforms';
  }

  return platformsArray.map((p) => p.name).join(', ');
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
