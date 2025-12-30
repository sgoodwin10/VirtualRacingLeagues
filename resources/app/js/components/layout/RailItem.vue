<script setup lang="ts">
import type { Component } from 'vue';

interface Props {
  icon: Component;
  active?: boolean;
  tooltip?: string;
}

withDefaults(defineProps<Props>(), {
  active: false,
  tooltip: '',
});

defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    v-tooltip.right="tooltip"
    class="rail-item"
    :class="{ active }"
    :aria-label="tooltip"
    :aria-current="active ? 'page' : undefined"
    @click="$emit('click')"
  >
    <component :is="icon" :size="20" weight="regular" />
  </button>
</template>

<style scoped>
.rail-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: var(--p-content-border-radius, 6px);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.rail-item:hover {
  color: var(--text-secondary);
  background: var(--bg-elevated);
}

.rail-item.active {
  color: var(--cyan);
  background: var(--cyan-dim);
}

.rail-item.active::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--cyan);
  border-radius: 0 2px 2px 0;
}

.rail-item:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}
</style>
