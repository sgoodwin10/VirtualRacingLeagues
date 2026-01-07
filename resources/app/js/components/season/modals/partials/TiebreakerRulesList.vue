<script setup lang="ts">
import { computed } from 'vue';
import draggable from 'vuedraggable';
import Message from 'primevue/message';
import type { SeasonTiebreakerRule } from '@app/types/season';

interface Props {
  modelValue: SeasonTiebreakerRule[];
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
});

interface Emits {
  (e: 'update:modelValue', value: SeasonTiebreakerRule[]): void;
  (e: 'retry'): void;
}

const emit = defineEmits<Emits>();

const localRules = computed({
  get: () => props.modelValue,
  set: (value: SeasonTiebreakerRule[]) => emit('update:modelValue', value),
});
</script>

<template>
  <div class="w-full">
    <!-- Error State -->
    <div v-if="error" class="flex flex-col gap-3">
      <Message severity="error" :closable="false">
        {{ error }}
      </Message>
      <button
        type="button"
        class="self-start px-3 py-2 bg-[--cyan-dim] text-[--cyan] border border-[--cyan] rounded-md transition-all duration-150 hover:bg-[--cyan] hover:text-[--bg-dark] font-medium text-xs"
        @click="emit('retry')"
      >
        Retry
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="loading"
      class="flex flex-col items-center justify-center p-6 gap-3 text-[--orange]"
    >
      <i class="pi pi-spinner pi-spin text-2xl" />
      <span class="text-md text-[--text-muted]">Loading tiebreaker rules...</span>
    </div>

    <!-- Empty State -->
    <Message v-else-if="modelValue.length === 0" severity="warn" :closable="false">
      No tiebreaker rules available
    </Message>

    <!-- Rules List with Drag and Drop -->
    <!-- TODO: Add keyboard accessibility for drag-and-drop (arrow keys for reordering) -->
    <draggable
      v-else
      v-model="localRules"
      item-key="id"
      handle=".drag-handle"
      ghost-class="dragging-ghost"
      chosen-class="dragging-chosen"
      drag-class="dragging-active"
      class="flex flex-col gap-1.5"
    >
      <template #item="{ element, index }">
        <div
          class="drag-handle flex items-center p-2.5 px-3 bg-dark border border-[var(--border-muted)] rounded-md cursor-grab transition-all duration-150 gap-3 hover:border-[var(--cyan)] active:cursor-grabbing"
        >
          <!-- Position Badge -->
          <div
            class="w-[22px] h-[22px] flex items-center justify-center bg-[--orange] rounded font-mono text-xs font-semibold text-[--bg-dark] shrink-0"
          >
            {{ index + 1 }}
          </div>

          <!-- Rule Details -->
          <div class="flex-1 min-w-0">
            <div class="text-md font-medium text-[--text-primary] mb-0.5">
              {{ element.rule_name }}
            </div>
            <div
              v-if="element.rule_description"
              class="text-xs text-[var(--text-muted)] leading-snug"
            >
              {{ element.rule_description }}
            </div>
          </div>

          <!-- Drag Handle Icon -->
          <div class="text-[--text-muted] shrink-0 flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<style scoped>
/* Drag and drop visual feedback */
.dragging-ghost {
  opacity: 0.5;
  background: var(--bg-elevated);
  border-color: var(--cyan) !important;
}

.dragging-chosen {
  border-color: var(--cyan) !important;
}

.dragging-active {
  opacity: 0.8;
  transform: scale(1.02);
}
</style>
