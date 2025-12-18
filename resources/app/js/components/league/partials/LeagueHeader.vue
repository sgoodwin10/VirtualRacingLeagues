<script setup lang="ts">
import Button from 'primevue/button';
import HTag from '@app/components/common/HTag.vue';
import LeagueVisibilityTag from '@app/components/league/partials/LeagueVisibilityTag.vue';
import ResponsiveImage from '@app/components/common/ResponsiveImage.vue';
import type { League } from '@app/types/league';

interface Props {
  league: League;
}

interface Emits {
  (e: 'edit'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function handleEdit(): void {
  emit('edit');
}
</script>

<template>
  <div class="relative">
    <!-- Header Image - use new media system with fallback -->
    <ResponsiveImage
      v-if="league.header_image || league.header_image_url"
      :media="league.header_image"
      :fallback-url="league.header_image_url ?? undefined"
      :alt="league.name"
      sizes="(max-width: 768px) 100vw, 1280px"
      img-class="w-full h-48 object-cover"
    />
    <div v-else class="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600"></div>

    <!-- Logo - use new media system with fallback -->
    <ResponsiveImage
      :media="league.logo"
      :fallback-url="league.logo_url ?? '/images/default-league-logo.png'"
      :alt="`${league.name} logo`"
      sizes="96px"
      conversion="medium"
      img-class="absolute -bottom-12 left-8 w-24 h-24 rounded-xl border-4 border-white shadow-xl object-cover"
    />

    <div class="absolute top-0 left-0 flex flex-col items-center gap-3 p-2">
      <LeagueVisibilityTag :visibility="league.visibility" />
    </div>
  </div>

  <!-- Title and Visibility -->
  <div
    class="flex flex-wrap items-start justify-between gap-4 bg-slate-100 border-b border-gray-200 p-3 shadow-lg"
  >
    <HTag additional-classes="ml-32" :level="2">{{ league.name }}</HTag>

    <!-- Action Buttons -->
    <div class="flex gap-3">
      <Button
        label="Edit League"
        icon="pi pi-pencil"
        severity="secondary"
        class="bg-white"
        outlined
        size="small"
        @click="handleEdit"
      />
    </div>
  </div>
</template>
