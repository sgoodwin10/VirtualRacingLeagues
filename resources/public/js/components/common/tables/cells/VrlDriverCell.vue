<script setup lang="ts">
/**
 * VrlDriverCell - Display driver information with avatar and team
 *
 * Shows driver name with optional team/subtitle.
 * Follows VRL Velocity design system styling.
 *
 * @example
 * ```vue
 * <VrlDriverCell
 *   name="Max Velocity"
 *   team="Red Storm Racing"
 * />
 * ```
 */
interface VrlDriverCellProps {
  /** Driver name (required) */
  name: string;

  /** Team name or subtitle */
  team?: string;
}

defineProps<VrlDriverCellProps>();
</script>

<template>
  <div class="flex items-center gap-3" data-test="driver-cell">
    <!-- Driver Info -->
    <div>
      <div class="font-medium text-[var(--text-primary)]" data-test="driver-name">
        {{ name }}
      </div>
      <div v-if="team" class="text-xs text-[var(--text-muted)]" data-test="driver-team">
        {{ team }}
      </div>
    </div>
  </div>
</template>
