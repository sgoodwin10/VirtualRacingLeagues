<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Card from 'primevue/card';
import Button from 'primevue/button';
import ButtonGroup from 'primevue/buttongroup';
import SpeedDial from 'primevue/speeddial';
import type { MenuItem } from 'primevue/menuitem';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import InfoItem from '@app/components/common/InfoItem.vue';
import LeagueVisibilityTag from '@app/components/league/partials/LeagueVisibilityTag.vue';
import { useLeagueStore } from '@app/stores/leagueStore';
import { useUserStore } from '@app/stores/userStore';
import { useImageUrl } from '@app/composables/useImageUrl';
import type { League } from '@app/types/league';
import { PhGameController, PhMapPinArea, PhSteeringWheel, PhTrophy } from '@phosphor-icons/vue';
import HTag from '@app/components/common/HTag.vue';

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

const competitionsText = computed(() => {
  const count = props.league.competitions_count;
  return count === 1 ? '1 Competition' : `${count} Competitions`;
});

const driversText = computed(() => {
  const count = props.league.drivers_count;
  return count === 1 ? '1 Driver' : `${count} Drivers`;
});

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

function handleView(): void {
  emit('view', props.league.id);
  // Navigate to league detail page
  router.push({ name: 'league-detail', params: { id: props.league.id.toString() } });
}

function handleEdit(): void {
  emit('edit', props.league.id);
  // Modal opening handled by parent component
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
  <Card class="transition-shadow duration-300 hover:shadow-lg border-blue-100 border">
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
        <div v-else class="w-full h-40 bg-linear-to-br from-blue-500 to-purple-600"></div>

        <!-- Logo with Error Handling and Fallback -->
        <img
          :src="logo.displayUrl.value"
          :alt="`${league.name} logo`"
          class="absolute -bottom-8 left-4 w-16 h-16 rounded-lg border-4 border-white shadow-lg object-cover"
          @load="logo.handleLoad"
          @error="logo.handleError"
        />

        <div class="absolute top-0 left-0 p-2">
          <LeagueVisibilityTag :visibility="league.visibility" />
        </div>

        <SpeedDial
          v-if="isOwner"
          :model="speedDialActions"
          direction="down"
          :button-props="{ size: 'small', rounded: true, severity: 'primary' }"
          show-icon="pi pi-bars"
          hide-icon="pi pi-times"
          style="position: absolute; right: 4px; top: 4px"
          class="speeddial-right"
        />
      </div>
    </template>

    <template #title>
      <div class="py-2 pl-22 pr-4 border-b border-slate-200 flex items-center justify-between">
        <HTag :level="3">{{ league.name }}</HTag>
      </div>
    </template>

    <template #content>
      <BasePanel>
        <template #header>
          <p
            v-if="league.tagline"
            class="italic text-sm w-full text-primary-400 text-center p-1 bg-primary-50 border-b border-slate-200 hidden"
          >
            {{ league.tagline }}
          </p>
        </template>
        <div class="grid grid-cols-2 gap-px w-full bg-surface-200">
          <InfoItem :icon="PhGameController" title="Platforms" :text="getPlatformNames(league)" />
          <InfoItem :icon="PhMapPinArea" title="Timezone" :text="league.timezone" />
          <InfoItem :icon="PhTrophy" title="Competitions" :text="competitionsText" />
          <InfoItem :icon="PhSteeringWheel" title="Drivers" :text="driversText" />
        </div>
      </BasePanel>
    </template>

    <template #footer>
      <div class="flex w-full p-2">
        <ButtonGroup class="w-1/2 hidden">
          <Button
            v-if="isOwner"
            icon="pi pi-trash"
            severity="danger"
            class="w-1/2 hidden"
            variant="outlined"
            @click="confirmDelete"
          />
          <Button
            v-if="isOwner"
            icon="pi pi-pencil"
            severity="warn"
            class="w-1/2 hidden"
            variant="outlined"
            @click="handleEdit"
          />
        </ButtonGroup>
        <Button
          label="View"
          severity="primary"
          icon="pi pi-eye"
          class="w-full"
          variant=""
          @click="handleView"
        />
      </div>
    </template>
  </Card>
</template>
