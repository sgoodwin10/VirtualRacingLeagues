<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'league' | 'stats' | 'feature';
  hoverable?: boolean;
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
    feature: 'group',
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
      class="h-0.5 bg-gradient-to-r from-racing-gold to-racing-safety transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
    />

    <!-- Header slot -->
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
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
  transform: translateY(-4px);
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
  background: linear-gradient(
    135deg,
    var(--racing-gold) 0%,
    var(--racing-safety) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.gradient-border:hover::before {
  opacity: 0.6;
}
</style>
