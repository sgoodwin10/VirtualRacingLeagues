<script setup lang="ts">
interface Props {
  /** Team name */
  name: string;
  /** Team color for dot */
  color?: string;
  /** Team logo URL */
  logo?: string;
}

withDefaults(defineProps<Props>(), {
  color: undefined,
  logo: undefined,
});
</script>

<template>
  <span class="team-indicator">
    <img v-if="logo" :src="logo" :alt="name" class="team-logo" />
    <span v-else-if="color" class="dot" :style="{ backgroundColor: color }"></span>
    <span>{{ name }}</span>
  </span>
</template>

<style scoped>
.team-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: var(--bg-elevated);
  border-radius: 3px;
  font-size: 12px;
  color: var(--text-secondary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.team-logo {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  object-fit: cover;
  flex-shrink: 0;
}
</style>
