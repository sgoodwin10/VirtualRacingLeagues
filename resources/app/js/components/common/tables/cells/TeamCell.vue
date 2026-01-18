<script setup lang="ts">
interface Props {
  /** Team name */
  name: string;
  /** Team color for dot */
  color?: string;
  /** Team logo URL */
  logo?: string;
  /** Team logo URL */
  logoUrl?: string;
}

withDefaults(defineProps<Props>(), {
  color: undefined,
  logo: undefined,
  logoUrl: undefined,
});
</script>

<template>
  <span class="team-indicator">
    <img v-if="logo || logoUrl" :src="logo || logoUrl" :alt="name" class="team-logo" />
    <span v-else-if="color" class="dot" :style="{ backgroundColor: color }"></span>
    <span class="text-lg">{{ name }}</span>
  </span>
</template>

<style scoped>
.team-logo {
  width: 48px;
  height: 24px;
  border-radius: 2px;
  object-fit: contain;
  flex-shrink: 0;
  margin-right: 4px;
}
</style>
