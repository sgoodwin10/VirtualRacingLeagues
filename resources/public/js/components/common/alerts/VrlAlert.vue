<script setup lang="ts">
import { computed } from 'vue';
import { PhInfo, PhCheckCircle, PhWarning, PhXCircle, PhX } from '@phosphor-icons/vue';
import type { VrlAlertProps, VrlAlertEmits } from '../cards/types';

const props = withDefaults(defineProps<VrlAlertProps>(), {
  type: 'info',
  dismissible: false,
});

const emit = defineEmits<VrlAlertEmits>();

const defaultIcons = {
  info: PhInfo,
  success: PhCheckCircle,
  warning: PhWarning,
  error: PhXCircle,
};

const typeStyles = {
  info: {
    bg: 'bg-[var(--cyan-dim)]',
    border: 'border-[rgba(88,166,255,0.3)]',
    text: 'text-[var(--cyan)]',
  },
  success: {
    bg: 'bg-[var(--green-dim)]',
    border: 'border-[rgba(126,231,135,0.3)]',
    text: 'text-[var(--green)]',
  },
  warning: {
    bg: 'bg-[var(--orange-dim)]',
    border: 'border-[rgba(240,136,62,0.3)]',
    text: 'text-[var(--orange)]',
  },
  error: {
    bg: 'bg-[var(--red-dim)]',
    border: 'border-[rgba(248,81,73,0.3)]',
    text: 'text-[var(--red)]',
  },
};

const alertClasses = computed(() => {
  const style = typeStyles[props.type];
  const classes = [
    'px-5',
    'py-4',
    'rounded-[var(--radius)]',
    'flex',
    'items-start',
    'gap-3',
    'border',
    style.bg,
    style.border,
    style.text,
  ];
  if (props.class) {
    classes.push(props.class);
  }
  return classes.join(' ');
});

const iconClasses = computed(() => {
  return ['text-xl', 'flex-shrink-0'].join(' ');
});

const contentClasses = computed(() => {
  return ['flex-1'].join(' ');
});

const titleClasses = computed(() => {
  return ['font-[var(--font-display)]', 'text-[0.85rem]', 'font-semibold', 'mb-1'].join(' ');
});

const messageClasses = computed(() => {
  return ['text-[0.85rem]', 'opacity-90'].join(' ');
});

const dismissClasses = computed(() => {
  return [
    'flex-shrink-0',
    'p-1',
    'bg-transparent',
    'border-0',
    'cursor-pointer',
    'text-current',
    'transition-opacity',
    'duration-200',
    'ease-in-out',
    'hover:opacity-70',
  ].join(' ');
});

const iconComponent = computed(() => {
  return props.icon || defaultIcons[props.type];
});

const ariaLive = computed(() => {
  return props.type === 'error' ? 'assertive' : 'polite';
});

const dismissAriaLabel = computed(() => `Dismiss ${props.type} alert`);

const handleDismiss = () => {
  emit('dismiss');
};
</script>

<template>
  <div :class="alertClasses" role="alert" :aria-live="ariaLive" data-test="alert" :data-type="type">
    <div :class="iconClasses" aria-hidden="true" data-test="alert-icon">
      <slot name="icon">
        <component :is="iconComponent" :size="20" />
      </slot>
    </div>

    <div :class="contentClasses" data-test="alert-content">
      <div :class="titleClasses" data-test="alert-title">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <div v-if="message || $slots.default" :class="messageClasses" data-test="alert-message">
        <slot name="message">
          <slot>
            {{ message }}
          </slot>
        </slot>
      </div>
    </div>

    <button
      v-if="dismissible"
      :class="dismissClasses"
      :aria-label="dismissAriaLabel"
      data-test="alert-dismiss"
      @click="handleDismiss"
    >
      <PhX :size="16" />
    </button>
  </div>
</template>
