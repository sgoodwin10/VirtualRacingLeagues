<script setup lang="ts">
/**
 * VrlButton - Racing-themed button component with angled edges and multiple variants
 *
 * @component
 * @example
 * ```vue
 * <VrlButton variant="primary" size="md" @click="handleClick">
 *   Click Me
 * </VrlButton>
 *
 * <VrlButton variant="secondary" icon="plus" icon-pos="left">
 *   Add Item
 * </VrlButton>
 *
 * <VrlButton variant="danger" :loading="isLoading">
 *   Delete
 * </VrlButton>
 * ```
 */
import { computed, type Component } from 'vue';
import {
  PhPlus,
  PhEye,
  PhTrash,
  PhDotsThree,
  PhPencilSimple,
  PhGear,
  PhShareNetwork,
  PhX,
  PhStar,
  PhDiscordLogo,
  PhTwitterLogo,
  PhYoutubeLogo,
  PhCircleNotch,
} from '@phosphor-icons/vue';

/**
 * Component props interface
 */
interface Props {
  /**
   * Button visual style variant
   * - primary: Safety orange with angled clip-path and shine effect
   * - secondary: Gold outline with angled edge
   * - ghost: Transparent with hover effect
   * - text: Minimal text-only button
   * - danger: Red background for destructive actions
   * - danger-outline: Red outline variant
   * - social: Tertiary background for social links
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'danger' | 'danger-outline' | 'social';

  /**
   * Button size
   * - xs: 28px height, extra small padding
   * - sm: 34px height, small padding
   * - md: 40px height, medium padding (default)
   * - lg: 48px height, large padding
   * - xl: 56px height, extra large padding
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Phosphor icon name to display
   * Available icons: 'plus', 'eye', 'trash', 'dots-three', 'pencil-simple', 'gear',
   * 'share-network', 'x', 'star', 'discord-logo', 'twitter-logo', 'youtube-logo'
   */
  icon?: string;

  /**
   * Icon position relative to button text
   * @default 'left'
   */
  iconPos?: 'left' | 'right';

  /**
   * Show loading state (disables button and shows loading indicator)
   * @default false
   */
  loading?: boolean;

  /**
   * Disable button interaction
   * @default false
   */
  disabled?: boolean;

  /**
   * HTML button type attribute
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Additional CSS classes to apply
   */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  icon: undefined,
  iconPos: 'left',
  type: 'button',
  loading: false,
  disabled: false,
  class: undefined,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const iconMap: Record<string, Component> = {
  plus: PhPlus,
  eye: PhEye,
  trash: PhTrash,
  'dots-three': PhDotsThree,
  'pencil-simple': PhPencilSimple,
  gear: PhGear,
  'share-network': PhShareNetwork,
  x: PhX,
  star: PhStar,
  'discord-logo': PhDiscordLogo,
  'twitter-logo': PhTwitterLogo,
  'youtube-logo': PhYoutubeLogo,
};

const iconComponent = computed(() => {
  if (!props.icon) return null;
  return iconMap[props.icon] || null;
});

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-2.5 py-1.5 text-[9px] gap-1.5',
    sm: 'px-3.5 py-2 text-[10px] gap-2',
    md: 'px-5 py-2.5 text-xs gap-2 shadow-md',
    lg: 'px-6 py-3 text-sm gap-2.5 shadow-lg',
    xl: 'px-8 py-4 text-base gap-3 shadow-lg',
  };
  return sizes[props.size];
});

const iconSizeClasses = computed(() => {
  const sizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };
  return sizes[props.size];
});

const variantClasses = computed(() => {
  const variants = {
    primary:
      'bg-racing-safety text-racing-pit-white hover:bg-racing-safety-bright shadow-lg shadow-racing-safety/30 btn-shine [clip-path:polygon(0_0,100%_0,95%_100%,0%_100%)]',
    secondary:
      'bg-transparent text-racing-gold border border-racing-gold hover:bg-racing-gold/10 hover:border-racing-gold-bright hover:text-racing-gold-bright [clip-path:polygon(5%_0,100%_0,100%_100%,0%_100%)]',
    ghost: 'bg-transparent hover:text-racing-gold theme-text-muted theme-bg-tertiary',
    text: 'bg-transparent hover:text-racing-gold theme-text-muted',
    danger:
      'bg-racing-danger text-racing-pit-white hover:bg-red-500 shadow-lg shadow-racing-danger/20',
    'danger-outline':
      'bg-transparent text-racing-danger border border-racing-danger/50 hover:bg-racing-danger/10',
    social:
      'theme-bg-tertiary theme-text-muted hover:bg-racing-gold hover:text-racing-carbon transition-all',
  };
  return variants[props.variant];
});

const classes = computed(() => {
  const disabledClasses =
    props.disabled || props.loading ? 'disabled:opacity-50 disabled:cursor-not-allowed' : '';
  return `inline-flex items-center justify-center font-display uppercase tracking-wider transition-all ${sizeClasses.value} ${variantClasses.value} ${disabledClasses} ${props.class || ''}`;
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="classes" @click="handleClick">
    <!-- Loading spinner -->
    <PhCircleNotch
      v-if="loading"
      :class="[iconSizeClasses, 'animate-spin']"
      weight="bold"
      aria-hidden="true"
    />
    <!-- Left icon -->
    <component
      :is="iconComponent"
      v-else-if="iconComponent && iconPos === 'left'"
      :class="iconSizeClasses"
      weight="bold"
    />
    <slot />
    <!-- Right icon -->
    <component
      :is="iconComponent"
      v-if="iconComponent && iconPos === 'right' && !loading"
      :class="iconSizeClasses"
      weight="bold"
    />
  </button>
</template>

<style scoped>
/* Spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
