<script setup lang="ts">
/**
 * VrlCard - Versatile card component with multiple variants for different use cases
 *
 * @component
 * @example
 * ```vue
 * <!-- Basic card -->
 * <VrlCard>
 *   <p>Card content</p>
 * </VrlCard>
 *
 * <!-- Card with header and footer -->
 * <VrlCard variant="default">
 *   <template #header>
 *     <h3>Card Title</h3>
 *   </template>
 *   <p>Card body content</p>
 *   <template #footer>
 *     <VrlButton>Action</VrlButton>
 *   </template>
 * </VrlCard>
 *
 * <!-- Feature card with icon -->
 * <VrlCard variant="feature">
 *   <template #icon>
 *     <PhTrophy :size="24" />
 *   </template>
 *   <h4>Feature Title</h4>
 *   <p>Feature description</p>
 * </VrlCard>
 *
 * <!-- Stats card with gradient border -->
 * <VrlCard variant="stats">
 *   <VrlStatsCard label="Total Races" value="42" />
 * </VrlCard>
 * ```
 */
import { computed } from 'vue';

/**
 * Component props interface
 */
interface Props {
  /**
   * Card visual variant
   * - default: Basic card with standard styling
   * - league: Optimized for league header images
   * - stats: Gradient border effect
   * - feature: Animated top border on hover with icon support
   * @default 'default'
   */
  variant?: 'default' | 'league' | 'stats' | 'feature';

  /**
   * Enable hover effects and cursor pointer
   * @default true
   */
  hoverable?: boolean;

  /**
   * Additional CSS classes
   * @default ''
   */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: true,
  class: '',
});

const cardClasses = computed(() => {
  const baseClasses =
    'card-racing rounded transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';
  const hoverClasses = props.hoverable ? 'cursor-pointer group' : '';
  const variantClasses = {
    default: '',
    league: '',
    stats: 'gradient-border',
    feature: 'group relative',
  };

  return [baseClasses, hoverClasses, variantClasses[props.variant], props.class]
    .filter(Boolean)
    .join(' ');
});
</script>

<template>
  <div :class="cardClasses">
    <!-- Feature variant top border animation -->
    <div
      v-if="variant === 'feature'"
      class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-racing-gold to-racing-safety transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform"
    />

    <!-- Header slot -->
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>

    <!-- Icon slot for feature variant -->
    <div
      v-if="variant === 'feature' && $slots.icon"
      class="w-10 h-10 sm:w-12 sm:h-12 bg-racing-gold/10 rounded flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-racing-gold/20 transition-colors"
    >
      <slot name="icon" />
    </div>

    <!-- Default content slot -->
    <div class="card-body">
      <slot />
    </div>

    <!-- Footer slot -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.card-racing {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
}

.card-racing.group:hover,
.card-racing.cursor-pointer:hover {
  border-color: var(--card-hover-border);
  /* transform: translateY(-4px); */
  box-shadow: var(--shadow-card);
}

/* Gradient border effect for stats variant */
.gradient-border {
  position: relative;
  background: var(--bg-secondary);
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--card-hover-border), transparent 50%);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
</style>
