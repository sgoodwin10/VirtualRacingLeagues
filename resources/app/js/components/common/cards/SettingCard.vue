<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title: string;
  description: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const emit = defineEmits<Emits>();

defineSlots<{
  default(): unknown;
}>();

function toggle(): void {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
}
</script>

<template>
  <div
    data-testid="setting-card"
    class="flex items-start p-3.5 px-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-md cursor-pointer transition-all duration-150"
    :class="{
      'border-[var(--cyan)] bg-[var(--cyan-dim)]': modelValue,
      'opacity-60 cursor-not-allowed': disabled,
      'hover:border-[var(--cyan)]': !disabled && !modelValue,
      active: modelValue,
    }"
    @click="toggle"
  >
    <div
      class="w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 transition-all duration-150 mt-0.5 mr-3.5"
      :class="{
        'bg-[var(--cyan)] border-[var(--cyan)]': modelValue,
        'border-[var(--border)]': !modelValue,
      }"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        class="transition-opacity duration-150"
        :class="modelValue ? 'opacity-100' : 'opacity-0'"
        style="color: var(--bg-dark)"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <div class="flex-1">
      <div class="text-md text-form-label text-[var(--text-primary)] mb-0.5">{{ title }}</div>
      <div class="text-sm text-[var(--text-muted)]">{{ description }}</div>

      <!-- Nested Options Slot with Transition -->
      <Transition name="nested-expand">
        <div
          v-if="modelValue && $slots.default"
          data-testid="nested-options"
          class="nested-options mt-3 pt-3 border-t border-[var(--border)]"
          @click.stop
        >
          <slot />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Nested Expand Transition */
.nested-expand-enter-active,
.nested-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.nested-expand-enter-from,
.nested-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  margin-top: 0;
  border-top-width: 0;
}

.nested-expand-enter-to,
.nested-expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
