<template>
  <span class="team-indicator">
    <span class="team-indicator__dot" :style="{ backgroundColor: color }"></span>
    <img v-if="logo" :src="logo" :alt="name" class="team-indicator__logo" />
    <span v-if="showName && name" class="team-indicator__name">{{ name }}</span>
  </span>
</template>

<script setup lang="ts">
interface TeamIndicatorProps {
  name?: string;
  color?: string;
  logo?: string;
  showName?: boolean;
}

withDefaults(defineProps<TeamIndicatorProps>(), {
  name: '',
  color: '#58a6ff',
  logo: undefined,
  showName: true,
});
</script>

<style scoped>
.team-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
}

.team-indicator__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.team-indicator__logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.team-indicator__name {
  white-space: nowrap;
}
</style>
