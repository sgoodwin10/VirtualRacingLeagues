<script setup lang="ts">
import { computed } from 'vue';
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

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Extract fallback logo path to a constant
const FALLBACK_LOGO_PATH = '/images/logo/128.png';

// Computed properties for cleaner template logic
const hasHeaderImage = computed(() => {
  return !!(props.league.header_image || props.league.header_image_url?.trim());
});

const headerImageUrl = computed(() => {
  return props.league.header_image_url?.trim() || undefined;
});

function handleEdit(): void {
  emit('edit');
}
</script>

<template>
  <div class="relative">
    <!-- Header Image - use new media system with fallback -->
    <ResponsiveImage
      v-if="hasHeaderImage"
      :media="league.header_image"
      :fallback-url="headerImageUrl"
      :alt="league.name"
      sizes="(max-width: 768px) 100vw, 1280px"
      img-class="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover"
    />
    <div
      v-else
      class="w-full h-40 sm:h-48 md:h-56 lg:h-64 bg-gradient-to-br from-blue-500 to-purple-600"
    ></div>

    <!-- Logo - use new media system with fallback -->
    <ResponsiveImage
      :media="league.logo"
      :fallback-url="league.logo_url ?? FALLBACK_LOGO_PATH"
      :alt="`${league.name} logo`"
      sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
      conversion="medium"
      img-class="absolute -bottom-8 sm:-bottom-10 md:-bottom-12 left-4 sm:left-6 md:left-8 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl border-4 border-white shadow-xl object-cover"
    />

    <div class="absolute top-0 left-0 flex flex-col items-center gap-3 p-2">
      <LeagueVisibilityTag :visibility="league.visibility" />
    </div>
  </div>

  <!-- Title and Visibility -->
  <div
    class="flex flex-wrap items-start justify-between gap-4 bg-slate-100 border-b border-gray-200 p-3 shadow-lg"
  >
    <HTag additional-classes="ml-20 sm:ml-24 md:ml-32" :level="2">{{ league.name }}</HTag>

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
