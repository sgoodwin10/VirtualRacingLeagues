<script setup lang="ts">
import { computed } from 'vue';
import { PhPlus } from '@phosphor-icons/vue';
import type { Component } from 'vue';

interface Props {
  label: string;
  icon?: Component;
  disabled?: boolean;
  variant?: 'default' | 'elevated';
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  disabled: false,
  variant: 'default',
});

const iconComponent = computed(() => props.icon ?? PhPlus);

interface Emits {
  (e: 'click', event: MouseEvent): void;
}

const emit = defineEmits<Emits>();

function handleClick(event: MouseEvent): void {
  if (!props.disabled) {
    emit('click', event);
  }
}
</script>

<template>
  <div class="footer-add-button-wrapper">
    <button
      type="button"
      :disabled="disabled"
      :class="[
        'footer-add-button',
        {
          'footer-add-button--default': variant === 'default',
          'footer-add-button--elevated': variant === 'elevated',
          'footer-add-button--disabled': disabled,
        },
      ]"
      @click.stop="handleClick"
    >
      <component :is="iconComponent" :size="14" weight="bold" class="footer-add-button__icon" />
      <span class="footer-add-button__label">{{ label }}</span>
    </button>
  </div>
</template>

<style scoped>
.footer-add-button-wrapper {
  margin-top: 8px;
}

.footer-add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius, 6px);
  border: 1px dashed var(--border);
  background-color: var(--bg-card);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.footer-add-button--elevated {
  background-color: var(--bg-elevated);
}

.footer-add-button:hover:not(:disabled) {
  border-color: var(--cyan);
  background-color: var(--cyan-dim);
  color: var(--cyan);
}

.footer-add-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer-add-button__icon {
  color: inherit;
  flex-shrink: 0;
}

.footer-add-button__label {
  color: inherit;
}
</style>
