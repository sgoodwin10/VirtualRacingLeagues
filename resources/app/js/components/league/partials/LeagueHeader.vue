<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import HTag from '@app/components/common/HTag.vue';
import LeagueVisibilityTag from '@app/components/league/partials/LeagueVisibilityTag.vue';
import { useImageUrl } from '@app/composables/useImageUrl';
import type { League } from '@app/types/league';

interface Props {
  league: League;
}

interface Emits {
  (e: 'edit'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const logo = computed(() =>
  useImageUrl(() => props.league.logo_url, '/images/default-league-logo.png'),
);

const headerImage = computed(() => useImageUrl(() => props.league.header_image_url));

function handleEdit(): void {
  emit('edit');
}
</script>

<template>
  <div class="relative">
    <!-- Header Image with Error Handling -->
    <img
      v-if="headerImage.url.value && !headerImage.hasError.value"
      :src="headerImage.displayUrl.value"
      :alt="league.name"
      class="w-full h-48 object-cover"
      @load="headerImage.handleLoad"
      @error="headerImage.handleError"
    />
    <div v-else class="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600"></div>

    <!-- Logo with Error Handling and Fallback -->
    <img
      :src="logo.displayUrl.value"
      :alt="`${league.name} logo`"
      class="absolute -bottom-12 left-8 w-24 h-24 rounded-xl border-4 border-white shadow-xl object-cover"
      @load="logo.handleLoad"
      @error="logo.handleError"
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
