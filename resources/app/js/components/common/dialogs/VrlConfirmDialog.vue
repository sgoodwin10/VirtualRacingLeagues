<script setup lang="ts">
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import { Button } from '@app/components/common/buttons';
import type { Component } from 'vue';

/**
 * VrlConfirmDialog Props Interface
 *
 * A custom confirmation dialog component that wraps PrimeVue Dialog
 * with consistent styling and custom button components
 */
interface Props {
  /** Controls the visibility of the dialog */
  visible: boolean;

  /** Dialog header text */
  header?: string;

  /** Main message content */
  message?: string;

  /** Icon component to display in header (Phosphor icon) */
  icon?: Component;

  /** Icon color (CSS color value or CSS variable) */
  iconColor?: string;

  /** Icon background color (CSS color value or CSS variable) */
  iconBgColor?: string;

  /** Confirm button label */
  acceptLabel?: string;

  /** Cancel button label */
  rejectLabel?: string;

  /** Confirm button variant */
  acceptVariant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';

  /** Cancel button variant */
  rejectVariant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';

  /** Whether the confirm button is in loading state */
  loading?: boolean;

  /** Whether to disable both buttons */
  disabled?: boolean;

  /** Whether to show the dialog as a modal (with backdrop) */
  modal?: boolean;

  /** Whether the dialog can be closed with X button */
  closable?: boolean;

  /** Whether clicking outside the modal closes it */
  dismissableMask?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  header: 'Confirm',
  message: undefined,
  icon: undefined,
  iconColor: 'var(--orange)',
  iconBgColor: 'var(--orange-dim)',
  acceptLabel: 'Confirm',
  rejectLabel: 'Cancel',
  acceptVariant: 'danger',
  rejectVariant: 'secondary',
  loading: false,
  disabled: false,
  modal: true,
  closable: true,
  dismissableMask: false,
});

/**
 * VrlConfirmDialog Emits Interface
 */
interface Emits {
  /** Emitted when the visible state should be updated */
  (e: 'update:visible', value: boolean): void;

  /** Emitted when the confirm button is clicked */
  (e: 'accept'): void;

  /** Emitted when the cancel button is clicked */
  (e: 'reject'): void;

  /** Emitted when the dialog is hidden (by any means) */
  (e: 'hide'): void;
}

const emit = defineEmits<Emits>();

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const handleAccept = (): void => {
  if (!props.disabled && !props.loading) {
    emit('accept');
  }
};

const handleReject = (): void => {
  if (!props.disabled && !props.loading) {
    emit('reject');
    localVisible.value = false;
  }
};

const handleHide = (): void => {
  emit('hide');
};
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    :modal="modal"
    :closable="closable"
    :dismissable-mask="dismissableMask"
    :style="{ width: '32rem' }"
    :pt="{
      root: { class: 'rounded-sm' },
      header: { class: 'rounded-t-sm p-4' },
      content: { class: 'p-0' },
      footer: { class: 'rounded-b-sm p-4' },
    }"
    @hide="handleHide"
  >
    <!-- Header -->
    <template #header>
      <slot name="header">
        <div class="flex items-center gap-3">
          <div
            v-if="icon"
            class="w-9 h-9 flex items-center justify-center rounded-lg border"
            :style="{
              backgroundColor: iconBgColor,
              borderColor: iconColor,
            }"
          >
            <component :is="icon" :size="18" weight="duotone" :style="{ color: iconColor }" />
          </div>
          <span class="font-mono font-semibold tracking-wide text-[var(--text-primary)]">
            {{ header }}
          </span>
        </div>
      </slot>
    </template>

    <!-- Content -->
    <div class="py-4 px-6">
      <slot>
        <p v-if="message" class="text-[var(--text-primary)] m-0">{{ message }}</p>
      </slot>
    </div>

    <!-- Footer -->
    <template #footer>
      <slot name="footer">
        <div class="flex gap-3 justify-end">
          <Button
            :label="rejectLabel"
            :variant="rejectVariant"
            :disabled="disabled || loading"
            @click="handleReject"
          />
          <Button
            :label="acceptLabel"
            :variant="acceptVariant"
            :loading="loading"
            :disabled="disabled"
            @click="handleAccept"
          />
        </div>
      </slot>
    </template>
  </Dialog>
</template>
