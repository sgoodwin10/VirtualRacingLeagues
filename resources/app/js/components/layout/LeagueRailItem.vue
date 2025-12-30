<script setup lang="ts">
interface Props {
  logoUrl?: string | null;
  name: string;
  active?: boolean;
  tooltip?: string;
}

withDefaults(defineProps<Props>(), {
  logoUrl: null,
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
    class="league-rail-item"
    :class="{ active }"
    :aria-label="tooltip"
    :aria-current="active ? 'page' : undefined"
    @click="$emit('click')"
  >
    <img v-if="logoUrl" :src="logoUrl" :alt="`${name} logo`" class="league-logo" />
    <div v-else class="league-placeholder">
      {{ name.charAt(0).toUpperCase() }}
    </div>
  </button>
</template>

<style scoped>
.league-rail-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--p-content-border-radius, 6px);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  padding: 0;
  overflow: hidden;
}

.league-rail-item:hover {
  transform: scale(1.05);
}

.league-rail-item.active::before {
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

.league-rail-item:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}

.league-logo {
  width: 80%;
  height: 80%;
  object-fit: cover;
  border-radius: var(--p-content-border-radius, 6px);
}

.league-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cyan-dim);
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: 700;
  border-radius: var(--p-content-border-radius, 6px);
}

.league-rail-item.active .league-placeholder {
  background: var(--cyan);
  color: var(--bg-panel);
}

.league-rail-item.active .league-logo {
  box-shadow: 0 0 0 2px var(--cyan);
}
</style>
