<script setup lang="ts">
import { computed, type Component } from 'vue';
import {
  PhPlus,
  PhEye,
  PhTrash,
  PhDotsThree,
  PhDotsThreeVertical,
  PhPencilSimple,
  PhGear,
  PhShareNetwork,
  PhX,
  PhStar,
} from '@phosphor-icons/vue';

interface Props {
  icon: string;
  variant?: 'angled' | 'rounded' | 'circular' | 'gold-outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  ariaLabel: string;
  disabled?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'angled',
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const iconMap: Record<string, Component> = {
  plus: PhPlus,
  eye: PhEye,
  trash: PhTrash,
  'dots-three': PhDotsThree,
  'dots-three-vertical': PhDotsThreeVertical,
  'pencil-simple': PhPencilSimple,
  gear: PhGear,
  'share-network': PhShareNetwork,
  x: PhX,
  star: PhStar,
};

const iconComponent = computed(() => {
  return iconMap[props.icon] || null;
});

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  return sizes[props.size];
});

const iconSizeClasses = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  return sizes[props.size];
});

const variantClasses = computed(() => {
  const variants = {
    angled:
      'bg-racing-safety text-racing-pit-white hover:bg-racing-safety-bright [clip-path:polygon(15%_0%,100%_0%,85%_100%,0%_100%)]',
    rounded: 'bg-racing-safety text-racing-pit-white hover:bg-racing-safety-bright rounded',
    circular:
      'bg-racing-safety text-racing-pit-white hover:bg-racing-safety-bright rounded-full shadow-md shadow-racing-safety/20',
    'gold-outline':
      'bg-transparent text-racing-gold border border-racing-gold hover:bg-racing-gold/10 rounded',
    ghost: 'hover:text-racing-gold rounded theme-text-muted theme-bg-tertiary',
    danger:
      'bg-transparent text-racing-danger border border-racing-danger/50 hover:bg-racing-danger/10 rounded',
  };
  return variants[props.variant];
});

const classes = computed(() => {
  return `flex items-center justify-center transition-all ${sizeClasses.value} ${variantClasses.value} ${props.class || ''}`;
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :class="classes"
    @click="handleClick"
  >
    <component :is="iconComponent" v-if="iconComponent" :class="iconSizeClasses" weight="bold" />
  </button>
</template>
