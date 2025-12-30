<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** Position number (1, 2, 3, etc.) */
  position?: number | null | undefined;
  /** Zero-pad position (e.g., 01, 02, 03) */
  padded?: boolean;
  /** Custom width */
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  position: null,
  padded: true,
  width: '40px',
});

/**
 * Format position with optional padding
 */
const formattedPosition = computed(() => {
  if (props.position === null || props.position === undefined) return '—';
  return props.padded ? String(props.position).padStart(2, '0') : String(props.position);
});

/**
 * Get podium class based on position
 */
const positionClass = computed(() => {
  switch (props.position) {
    case 1:
      return 'pos p1';
    case 2:
      return 'pos p2';
    case 3:
      return 'pos p3';
    default:
      return 'pos';
  }
});
</script>

<template>
  <div :class="positionClass" :style="{ width }">
    {{ formattedPosition }}
  </div>
</template>

<style scoped>
.pos {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.pos.p1 {
  color: var(--yellow); /* Gold */
}

.pos.p2 {
  color: var(--text-muted); /* Silver */
}

.pos.p3 {
  color: var(--orange); /* Bronze */
}
</style>
