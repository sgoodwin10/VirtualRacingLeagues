<script setup lang="ts">
/**
 * VrlBadge - Status and category badge component with multiple racing-themed variants
 *
 * @component
 * @example
 * ```vue
 * <VrlBadge variant="active" label="Live" :pulse="true" />
 * <VrlBadge variant="featured" label="Featured League" />
 * <VrlBadge variant="dnf" label="DNF" :rounded="false" />
 * <VrlBadge variant="platform" label="PC" />
 * ```
 */
import { computed } from 'vue';
import { PhStar, PhClock } from '@phosphor-icons/vue';

type BadgeVariant =
  | 'active'
  | 'featured'
  | 'upcoming'
  | 'completed'
  | 'private'
  | 'dnf'
  | 'dns'
  | 'fastest-lap'
  | 'pole'
  | 'penalty'
  | 'platform';

/**
 * Component props interface
 */
interface Props {
  /**
   * Badge visual variant
   * - active: Green for live/active status
   * - featured: Gold for featured items
   * - upcoming: Orange for upcoming events
   * - completed: Gray for completed items
   * - private: Pink for private leagues
   * - dnf: Red for Did Not Finish
   * - dns: Red for Did Not Start
   * - fastest-lap: Purple for fastest lap indicator
   * - pole: Gold for pole position
   * - penalty: Orange for penalty indicator
   * - platform: Gold background for platform tags
   * @default 'completed'
   */
  variant?: BadgeVariant;

  /**
   * Badge text label (required)
   */
  label: string;

  /**
   * Optional icon name (not currently used, placeholder for future)
   */
  icon?: string;

  /**
   * Show animated pulse indicator (auto-enabled for 'active' variant)
   * @default false
   */
  pulse?: boolean;

  /**
   * Override rounded styling
   * Auto-determined: rounded-full for status badges, rounded for race status
   */
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'completed',
  icon: undefined,
  pulse: false,
  rounded: undefined,
});

// Auto-determine rounded based on variant if not explicitly set
const isRounded = computed(() => {
  if (props.rounded !== undefined) return props.rounded;
  // Status badges are rounded-full, race status badges are just rounded
  return ['active', 'featured', 'upcoming', 'completed', 'private'].includes(props.variant);
});

// Badge styles based on variant
const badgeClasses = computed(() => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'gap-1.5',
    'font-display',
    'text-[10px]',
    'uppercase',
    'tracking-wider',
    'transition-all',
  ];

  // Rounded styling
  if (isRounded.value) {
    baseClasses.push('rounded-full', 'px-2.5 sm:px-3', 'py-1 sm:py-1.5');
  } else {
    baseClasses.push('rounded', 'px-2', 'py-1');
  }

  // Variant-specific styles
  const variantClasses: Record<BadgeVariant, string[]> = {
    active: ['bg-racing-success/10', 'text-racing-success'],
    featured: ['bg-racing-gold/10', 'text-racing-gold'],
    upcoming: ['bg-racing-warning/10', 'text-racing-warning'],
    completed: ['bg-racing-tarmac', 'text-racing-barrier'],
    private: ['bg-pink-500/20', 'text-pink-300', 'border', 'border-pink-500/30'],
    dnf: ['bg-racing-danger/20', 'text-racing-danger'],
    dns: ['bg-racing-dns/20', 'text-racing-dns'],
    'fastest-lap': ['bg-racing-fastest-lap/20', 'text-racing-fastest-lap'],
    pole: ['bg-racing-gold/20', 'text-racing-gold'],
    penalty: ['bg-racing-warning/20', 'text-racing-warning'],
    platform: ['bg-racing-gold', 'text-racing-carbon'],
  };

  return [...baseClasses, ...variantClasses[props.variant]];
});

// Show pulse indicator for active variant
const showPulse = computed(() => {
  return (props.pulse || props.variant === 'active') && isRounded.value;
});

// Show icon for featured/upcoming variants
const showIcon = computed(() => {
  return props.icon || ['featured', 'upcoming'].includes(props.variant);
});

const iconComponent = computed(() => {
  if (props.variant === 'featured') return PhStar;
  if (props.variant === 'upcoming') return PhClock;
  return null;
});
</script>

<template>
  <span :class="badgeClasses" role="status">
    <!-- Pulse indicator for active badges -->
    <span v-if="showPulse" class="w-1.5 h-1.5 bg-racing-success rounded-full animate-pulse" />

    <!-- Icon for featured/upcoming -->
    <component
      :is="iconComponent"
      v-if="showIcon && iconComponent"
      :weight="variant === 'featured' ? 'fill' : 'regular'"
      class="text-xs"
    />

    <!-- Label -->
    {{ label }}
  </span>
</template>
