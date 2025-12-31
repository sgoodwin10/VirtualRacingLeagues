<script setup lang="ts">
export interface VersionIndicatorProps {
  version?: string;
  variant?: 'success' | 'info' | 'warning';
}

const props = withDefaults(defineProps<VersionIndicatorProps>(), {
  version: '',
  variant: 'success',
});

const variantClasses: Record<NonNullable<VersionIndicatorProps['variant']>, string> = {
  success: 'bg-[var(--green-dim)] text-[var(--green)]',
  info: 'bg-[var(--cyan-dim)] text-[var(--cyan)]',
  warning: 'bg-[var(--orange-dim)] text-[var(--orange)]',
};
</script>

<template>
  <span
    class="inline-block rounded-[3px] px-[6px] py-[2px] font-mono text-[10px] font-medium"
    :class="variantClasses[props.variant]"
  >
    {{ props.version }}
  </span>
</template>
