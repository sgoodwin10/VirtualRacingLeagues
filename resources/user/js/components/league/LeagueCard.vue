<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import ButtonGroup from 'primevue/buttongroup';
import { useLeagueStore } from '@user/stores/leagueStore';
import { useUserStore } from '@user/stores/userStore';
import { useImageUrl } from '@user/composables/useImageUrl';
import type { League } from '@user/types/league';

interface Props {
  league: League;
}

interface Emits {
  (e: 'view', leagueId: number): void;
  (e: 'edit', leagueId: number): void;
  (e: 'delete', leagueId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const leagueStore = useLeagueStore();
const userStore = useUserStore();

const isOwner = computed(() => {
  return userStore.user?.id === props.league.owner_user_id;
});

// Use composable for logo with fallback
const logo = useImageUrl(() => props.league.logo_url, '/images/default-league-logo.png');

// Use composable for header image
const headerImage = useImageUrl(() => props.league.header_image_url);

function getVisibilitySeverity(visibility: string): 'success' | 'info' | 'warning' {
  switch (visibility) {
    case 'public':
      return 'success';
    case 'private':
      return 'warning';
    case 'unlisted':
      return 'info';
    default:
      return 'info';
  }
}

function getPlatformNames(league: League): string {
  if (!league.platforms || league.platforms.length === 0) {
    return 'No platforms';
  }

  if (league.platforms.length <= 2) {
    return league.platforms.map((p) => p.name).join(', ');
  }

  const first = league.platforms[0];
  const second = league.platforms[1];

  if (!first || !second) {
    return 'No platforms';
  }

  return `${first.name}, ${second.name} +${league.platforms.length - 2} more`;
}

function handleView(): void {
  emit('view', props.league.id);
  // Navigate to league detail page
  router.push({ name: 'league-detail', params: { id: props.league.id.toString() } });
}

function handleEdit(): void {
  emit('edit', props.league.id);
  // Drawer opening handled by parent component
}

function confirmDelete(): void {
  confirm.require({
    message: `Are you sure you want to delete "${props.league.name}"? This action cannot be undone.`,
    header: 'Delete League',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteLeague(),
  });
}

async function deleteLeague(): Promise<void> {
  try {
    await leagueStore.removeLeague(props.league.id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'League deleted successfully',
      life: 3000,
    });
    emit('delete', props.league.id);
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete league',
      life: 5000,
    });
  }
}
</script>

<template>
  <Card class="hover:shadow-lg transition-shadow duration-300">
    <template #header>
      <div class="relative">
        <!-- Header Image with Error Handling -->
        <img
          v-if="headerImage.url.value && !headerImage.hasError.value"
          :src="headerImage.displayUrl.value"
          :alt="league.name"
          class="w-full h-40 object-cover"
          @load="headerImage.handleLoad"
          @error="headerImage.handleError"
        />
        <div v-else class="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600"></div>

        <!-- Logo with Error Handling and Fallback -->
        <img
          :src="logo.displayUrl.value"
          :alt="`${league.name} logo`"
          class="absolute -bottom-8 left-4 w-16 h-16 rounded-lg border-4 border-white shadow-lg object-cover"
          @load="logo.handleLoad"
          @error="logo.handleError"
        />

        <div class="absolute top-0 right-0 p-2">
          <Tag
            :value="league.visibility.toUpperCase()"
            :severity="getVisibilitySeverity(league.visibility)"
            class="text-xs uppercase border"
          />
        </div>
      </div>
    </template>

    <template #title>
      <div class="mt-6">
        <h3 class="text-xl font-bold mb-1">{{ league.name }}</h3>
      </div>
    </template>

    <template #content>
      <div class="space-y-3 pb-2">
        <p v-if="league.tagline" class="">
          {{ league.tagline }}
        </p>

        <div class="flex items-center gap-2">
          <i class="pi pi-desktop"></i>
          <span>{{ getPlatformNames(league) }}</span>
        </div>

        <div v-if="league.timezone" class="flex items-center gap-2">
          <i class="pi pi-clock"></i>
          <span>{{ league.timezone }}</span>
        </div>

        <div v-if="league.organizer_name" class="flex items-center gap-2">
          <i class="pi pi-user"></i>
          <span>{{ league.organizer_name }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full space-x-4 border-t border-gray-200 pt-4">
        <ButtonGroup class="w-1/2">
          <Button
            v-if="isOwner"
            icon="pi pi-trash"
            severity="danger"
            class="w-1/2"
            variant="outlined"
            @click="confirmDelete"
          />
          <Button
            v-if="isOwner"
            icon="pi pi-pencil"
            severity="warn"
            class="w-1/2"
            variant="outlined"
            @click="handleEdit"
          />
        </ButtonGroup>
        <Button
          label="View"
          severity="info"
          icon="pi pi-eye"
          class="w-1/2"
          variant="outlined"
          @click="handleView"
        />
      </div>
    </template>
  </Card>
</template>
