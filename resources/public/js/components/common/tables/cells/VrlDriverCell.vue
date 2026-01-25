<script setup lang="ts">
import { computed } from 'vue';

/**
 * VrlDriverCell - Display driver information with avatar and team
 *
 * Shows driver name with optional avatar (image or initials) and team/subtitle.
 * Follows VRL Velocity design system styling.
 *
 * @example
 * ```vue
 * <VrlDriverCell
 *   name="Max Velocity"
 *   team="Red Storm Racing"
 *   avatar-url="https://example.com/avatar.jpg"
 * />
 * ```
 */
interface VrlDriverCellProps {
  /** Driver name (required) */
  name: string;

  /** Team name or subtitle */
  team?: string;

  /** Custom initials (auto-generated if not provided) */
  initials?: string;

  /** Avatar image URL */
  avatarUrl?: string;

  /** Show/hide avatar */
  showAvatar?: boolean;
}

const props = withDefaults(defineProps<VrlDriverCellProps>(), {
  team: undefined,
  initials: undefined,
  avatarUrl: undefined,
  showAvatar: true,
});

/**
 * Generate initials from driver name
 */
const generatedInitials = computed(() => {
  if (props.initials) return props.initials;

  const parts = props.name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0]?.substring(0, 2).toUpperCase() ?? '';
  }
  const firstInitial = parts[0]?.[0] ?? '';
  const lastInitial = parts[parts.length - 1]?.[0] ?? '';
  return (firstInitial + lastInitial).toUpperCase();
});
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
