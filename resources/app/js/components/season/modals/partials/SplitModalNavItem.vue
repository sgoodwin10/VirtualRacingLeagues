<script setup lang="ts">
import type { Component } from 'vue';

interface Props {
  label: string;
  icon: Component;
  active: boolean;
  badge?: string | number;
  badgeActive?: boolean;
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  badge: undefined,
  badgeActive: false,
  compact: false,
});

interface Emits {
  (e: 'click'): void;
}

const emit = defineEmits<Emits>();

function handleClick(): void {
  emit('click');
}
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 text-[--text-secondary] text-sm bg-transparent border-none w-full text-left hover:bg-elevated hover:text-[--text-primary]"
    :class="{
      'bg-[--cyan-dim] text-[--cyan] hover:bg-[--cyan-dim] hover:text-[--cyan]': active,
      'justify-center px-2': compact,
    }"
    @click="handleClick"
  >
    <component :is="icon" :size="16" class="flex-shrink-0" />
    <span v-if="!compact" class="sm:inline" :class="{ hidden: compact }">{{ label }}</span>
    <span
      v-if="badge !== undefined"
      class="ml-auto font-mono text-xs px-1.5 py-0.5 rounded-sm font-medium"
      :class="badgeActive ? 'bg-[--green-dim] text-[--green]' : 'bg-highlight text-[--text-muted]'"
    >
      {{ badge }}
    </span>
  </button>
</template>
