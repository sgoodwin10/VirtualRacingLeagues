<script setup lang="ts">
import type { TagVariant } from '@public/types/components';
import VrlTag from '@public/components/common/tags/VrlTag.vue';

/**
 * VrlTeamCell - Display team indicator using VrlTag component
 *
 * Shows team name or abbreviation using the existing VrlTag component
 * with optional color variant.
 *
 * @example
 * ```vue
 * <VrlTeamCell name="RSR" variant="cyan" />
 * ```
 */
interface VrlTeamCellProps {
  /** Team name or abbreviation (required) */
  name: string;

  /** Tag color variant */
  variant?: TagVariant;
}

withDefaults(defineProps<VrlTeamCellProps>(), {
  variant: 'default',
});
</script>

<template>
  <VrlTag :variant="variant" data-test="team-cell">
    {{ name }}
  </VrlTag>
</template>

<style scoped>
/* No additional styles needed - uses VrlTag component */
</style>
