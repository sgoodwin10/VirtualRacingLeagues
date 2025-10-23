<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Competition } from '@user/types/competition';

import Card from 'primevue/card';
import Chip from 'primevue/chip';
import Button from 'primevue/button';

interface Props {
  competition: Competition;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'archive'): void;
}

const emit = defineEmits<Emits>();

const router = useRouter();

const cardClasses = computed(() => ({
  'opacity-60': props.competition.is_archived,
}));

function handleView(): void {
  router.push({
    name: 'competition-detail',
    params: {
      leagueId: props.competition.league_id,
      competitionId: props.competition.id,
    },
  });
}
</script>

<template>
  <Card :class="cardClasses" class="competition-card cursor-pointer" @click="handleView">
    <template #header>
      <img :src="competition.logo_url" :alt="competition.name" class="w-full h-48 object-cover" />
    </template>

    <template #title>
      <div class="flex justify-between items-start">
        <span>{{ competition.name }}</span>
        <Chip v-if="competition.is_archived" label="Archived" severity="secondary" size="small" />
      </div>
    </template>

    <template #subtitle>
      <Chip v-if="competition.platform" :label="competition.platform.name" icon="pi pi-gamepad" />
    </template>

    <template #content>
      <p v-if="competition.description" class="text-gray-600 text-sm mb-4 line-clamp-2">
        {{ competition.description }}
      </p>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <span class="text-xs text-gray-500">Seasons</span>
          <p class="font-semibold">{{ competition.stats.total_seasons }}</p>
        </div>
        <div>
          <span class="text-xs text-gray-500">Drivers</span>
          <p class="font-semibold">{{ competition.stats.total_drivers }}</p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <Button label="View" icon="pi pi-eye" outlined @click.stop="handleView" />
        <Button label="Edit" icon="pi pi-pencil" outlined @click.stop="emit('edit')" />
      </div>
    </template>
  </Card>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
