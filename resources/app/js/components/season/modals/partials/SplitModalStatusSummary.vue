<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  divisionsEnabled: boolean;
  teamsEnabled: boolean;
  dropRoundsEnabled: boolean;
  tiebreakersEnabled: boolean;
  collapsible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: false,
});

const isCollapsed = ref(props.collapsible);

function toggleCollapse(): void {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value;
  }
}
</script>

<template>
  <div class="p-4 border-t border-[--border] bg-dark">
    <button
      v-if="collapsible"
      type="button"
      class="flex items-center justify-between w-full bg-transparent border-0 p-0 mb-3 cursor-pointer"
      @click="toggleCollapse"
    >
      <span class="text-sidebar-label text-[--cyan]">//Active Settings</span>
      <i class="pi" :class="isCollapsed ? 'pi-chevron-down' : 'pi-chevron-up'" />
    </button>
    <div v-else class="flex items-center justify-between w-full mb-3">
      <span class="text-sidebar-label text-[--cyan]">//Active Settings</span>
    </div>

    <Transition name="expand">
      <div v-show="!collapsible || !isCollapsed" class="flex flex-col">
        <div class="flex items-center justify-between py-2 border-b border-[--border] text-xs">
          <span class="text-[--text-muted]">Divisions</span>
          <span
            class="font-mono"
            :class="divisionsEnabled ? 'text-[--green]' : 'text-[--text-muted]'"
          >
            {{ divisionsEnabled ? 'ON' : 'OFF' }}
          </span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-[--border] text-xs">
          <span class="text-[--text-muted]">Teams</span>
          <span class="font-mono" :class="teamsEnabled ? 'text-[--green]' : 'text-[--text-muted]'">
            {{ teamsEnabled ? 'ON' : 'OFF' }}
          </span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-[--border] text-xs">
          <span class="text-[--text-muted]">Drop Rounds</span>
          <span
            class="font-mono"
            :class="dropRoundsEnabled ? 'text-[--green]' : 'text-[--text-muted]'"
          >
            {{ dropRoundsEnabled ? 'ON' : 'OFF' }}
          </span>
        </div>
        <div
          class="flex items-center justify-between py-2 border-b border-[--border] last:border-b-0 text-xs"
        >
          <span class="text-[--text-muted]">Tiebreakers</span>
          <span
            class="font-mono"
            :class="tiebreakersEnabled ? 'text-[--green]' : 'text-[--text-muted]'"
          >
            {{ tiebreakersEnabled ? 'ON' : 'OFF' }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Expand Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
