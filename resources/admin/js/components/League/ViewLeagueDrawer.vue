<template>
  <Drawer
    v-model:visible="isVisible"
    position="bottom"
    :header="`League Details${league ? ': ' + league.name : ''}`"
    :style="{ height: '80vh' }"
    class="view-league-drawer"
  >
    <div v-if="league" class="space-y-6">
      <!-- Placeholder content - to be expanded later -->
      <div class="text-center text-gray-500 py-8">
        <i class="pi pi-info-circle text-4xl mb-4"></i>
        <p class="text-lg">League details will be displayed here</p>
        <p class="text-sm mt-2">Full implementation coming soon</p>
      </div>

      <!-- Basic league info -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-3">Basic Information</h3>
        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt class="text-sm font-medium text-gray-500">ID</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ league.id }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Name</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ league.name }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Slug</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ league.slug }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Status</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ league.status }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Visibility</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ league.visibility }}</dd>
          </div>
          <div v-if="league.owner">
            <dt class="text-sm font-medium text-gray-500">Owner</dt>
            <dd class="mt-1 text-sm text-gray-900">
              {{ getFullName(league.owner) }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
    <div v-else class="text-center text-gray-500 py-8">
      <p>No league selected</p>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Drawer from 'primevue/drawer';
import type { League } from '@admin/types/league';
import { useNameHelpers } from '@admin/composables/useNameHelpers';

/**
 * Props interface for ViewLeagueDrawer component
 */
export interface ViewLeagueDrawerProps {
  /**
   * Whether the drawer is visible
   */
  visible: boolean;

  /**
   * League to display
   */
  league: League | null;
}

/**
 * Emits interface for ViewLeagueDrawer component
 */
export interface ViewLeagueDrawerEmits {
  /**
   * Emitted when visibility changes
   */
  (event: 'update:visible', value: boolean): void;
}

// Props
const props = defineProps<ViewLeagueDrawerProps>();

// Emits
const emit = defineEmits<ViewLeagueDrawerEmits>();

// Composables
const { getFullName } = useNameHelpers();

// Computed visibility for two-way binding
const isVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});
</script>

<style scoped>
.view-league-drawer :deep(.p-drawer-content) {
  padding: 1.5rem;
}
</style>
