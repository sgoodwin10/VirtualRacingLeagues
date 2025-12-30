<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Component } from 'vue';

interface Props {
  to: string;
  icon: Component;
  label: string;
  tag?: string | number;
  tagVariant?: 'default' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
  tag: undefined,
  tagVariant: 'default',
});

const route = useRoute();
const isActive = computed(() => route.path === props.to);
</script>

<template>
  <router-link :to="to" class="sidebar-link" :class="{ active: isActive }">
    <component :is="icon" :size="16" weight="regular" />
    <span>{{ label }}</span>
    <span v-if="tag" class="tag" :class="tagVariant">{{ tag }}</span>
  </router-link>
</template>

<style scoped>
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-md);
  font-weight: 500;
  transition: all 0.15s ease;
}

.sidebar-link:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.sidebar-link.active {
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
