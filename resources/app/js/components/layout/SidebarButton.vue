<script setup lang="ts">
import type { Component } from 'vue';

interface Props {
  icon: Component;
  label: string;
  tag?: string | number;
  tagVariant?: 'default' | 'warning';
}

interface Emits {
  (e: 'click'): void;
}

withDefaults(defineProps<Props>(), {
  tag: undefined,
  tagVariant: 'default',
});

const emit = defineEmits<Emits>();

function handleClick(): void {
  emit('click');
}
</script>

<template>
  <button type="button" class="sidebar-button" @click="handleClick">
    <component :is="icon" :size="16" weight="regular" />
    <span>{{ label }}</span>
    <span v-if="tag" class="tag" :class="tagVariant">{{ tag }}</span>
  </button>
</template>

<style scoped>
.sidebar-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-md);
  font-weight: 500;
  transition: all 0.15s ease;
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}

.sidebar-button:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.tag {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  padding: 2px 6px;
  background: var(--cyan-dim);
  color: var(--cyan);
  border-radius: 3px;
}

.tag.warning {
  background: var(--orange-dim);
  color: var(--orange);
}
</style>
