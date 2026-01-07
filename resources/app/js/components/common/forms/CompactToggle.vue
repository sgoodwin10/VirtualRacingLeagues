<script setup lang="ts">
/**
 * CompactToggle Component
 *
 * A versatile toggle switch with multiple layout configurations and optional nested content.
 *
 * ARCHITECTURE NOTE - Intentional Duplication:
 * This component contains what appears to be duplicated toggle switch markup across different
 * layout modes. This is intentional for the following reasons:
 *
 * 1. **Different Layout Contexts**: Each layout (labelPosition + slotPosition combination) has
 *    slightly different wrapper structures, spacing, and positioning requirements.
 *
 * 2. **Different Wrapper Elements**: Some layouts use flex containers, others use inline-flex,
 *    and the positioning of the toggle relative to the label varies significantly.
 *
 * 3. **Performance**: Extracting the toggle switch into a computed property or component would
 *    require dynamic class bindings and additional complexity without meaningful benefit.
 *
 * 4. **Maintainability**: While it looks redundant, each instance is actually context-specific.
 *    Changing one layout should not affect others, and this structure makes that explicit.
 *
 * The toggle switch markup is ~15 lines, used 4 times = 60 lines of "duplication".
 * The alternative (computed template strings or extracted components) would require similar
 * line count plus additional abstraction complexity.
 *
 * If you're considering refactoring this, ensure the new approach:
 * - Maintains all current layout modes and their specific styling
 * - Doesn't add unnecessary runtime overhead
 * - Doesn't complicate the already complex conditional rendering logic
 */

interface Props {
  modelValue: boolean;
  label: string;
  disabled?: boolean;
  slotPosition?: 'inline' | 'below';
  labelPosition?: 'beside' | 'above';
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  slotPosition: 'below',
  labelPosition: 'beside',
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
  <div>
    <!-- Label Above Layout -->
    <template v-if="labelPosition === 'above'">
      <!-- Inline: Two columns - toggle column + slot column -->
      <template v-if="slotPosition === 'inline'">
        <div class="flex items-start gap-3">
          <!-- Column 1: Label + Toggle -->
          <div class="flex-shrink-0">
            <label
              class="block text-xs text-form-label text-[var(--text-muted)] tracking-widest mb-2"
              >{{ label }}</label
            >
            <div
              data-testid="compact-toggle"
              class="inline-flex items-center justify-center p-2.5 px-3 bg-[var(--bg-dark)] border border-[var(--border)] rounded-md cursor-pointer transition-all duration-150"
              :class="{
                'border-[var(--cyan)]': modelValue,
                'opacity-60 cursor-not-allowed': disabled,
                'hover:border-[var(--cyan)]': !disabled && !modelValue,
                active: modelValue,
              }"
              @click="toggle"
            >
              <!-- Toggle Switch -->
              <div
                class="relative w-10 h-5.5 rounded-full border-2 transition-all duration-200 flex-shrink-0"
                :class="{
                  'bg-[var(--cyan)] border-[var(--cyan)]': modelValue,
                  'bg-[var(--bg-elevated)] border-[var(--border)]': !modelValue,
                }"
              >
                <div
                  class="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
                  :class="{
                    'left-[18px] bg-[var(--bg-dark)]': modelValue,
                    'left-0.5 bg-[var(--text-muted)]': !modelValue,
                  }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Column 2: Inline Slot Content (shown when enabled) -->
          <Transition name="inline-fade">
            <div
              v-if="modelValue && $slots.default"
              data-testid="compact-inline-options"
              class="flex-1"
              @click.stop
            >
              <slot />
            </div>
          </Transition>
        </div>
      </template>

      <!-- Below: Label above toggle, slot content below -->
      <template v-else>
        <label class="block text-xs text-[var(--text-muted)] tracking-widest uppercase mb-2">{{
          label
        }}</label>
        <div
          data-testid="compact-toggle"
          class="inline-flex items-center justify-center p-2.5 px-3 bg-[var(--bg-dark)] border border-[var(--border)] rounded-md cursor-pointer transition-all duration-150"
          :class="{
            'border-[var(--cyan)]': modelValue,
            'opacity-60 cursor-not-allowed': disabled,
            'hover:border-[var(--cyan)]': !disabled && !modelValue,
            active: modelValue,
          }"
          @click="toggle"
        >
          <!-- Toggle Switch -->
          <div
            class="relative w-10 h-5.5 rounded-full border-2 transition-all duration-200 flex-shrink-0"
            :class="{
              'bg-[var(--cyan)] border-[var(--cyan)]': modelValue,
              'bg-[var(--bg-elevated)] border-[var(--border)]': !modelValue,
            }"
          >
            <div
              class="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
              :class="{
                'left-[18px] bg-[var(--bg-dark)]': modelValue,
                'left-0.5 bg-[var(--text-muted)]': !modelValue,
              }"
            ></div>
          </div>
        </div>

        <!-- Below Layout - Nested Options with Transition -->
        <Transition name="nested-expand">
          <div
            v-if="modelValue && $slots.default"
            data-testid="compact-nested-options"
            class="mt-3"
            @click.stop
          >
            <slot />
          </div>
        </Transition>
      </template>
    </template>

    <!-- Label Beside Layout (default) -->
    <template v-else>
      <div
        v-if="slotPosition === 'below'"
        data-testid="compact-toggle"
        class="flex items-center justify-between p-2.5 px-3 bg-[var(--bg-dark)] border border-[var(--border)] rounded-md cursor-pointer transition-all duration-150"
        :class="{
          'border-[var(--cyan)]': modelValue,
          'opacity-60 cursor-not-allowed': disabled,
          'hover:border-[var(--cyan)]': !disabled && !modelValue,
          active: modelValue,
        }"
        @click="toggle"
      >
        <span class="text-xs text-[var(--text-secondary)]">{{ label }}</span>

        <!-- Toggle Switch -->
        <div
          class="relative w-10 h-5.5 rounded-full border-2 transition-all duration-200 flex-shrink-0"
          :class="{
            'bg-[var(--cyan)] border-[var(--cyan)]': modelValue,
            'bg-[var(--bg-elevated)] border-[var(--border)]': !modelValue,
          }"
        >
          <div
            class="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
            :class="{
              'left-[18px] bg-[var(--bg-dark)]': modelValue,
              'left-0.5 bg-[var(--text-muted)]': !modelValue,
            }"
          ></div>
        </div>
      </div>

      <!-- Inline Layout -->
      <div v-else class="flex flex-row">
        <div
          data-testid="compact-toggle"
          class="flex items-center justify-between p-2.5 px-3 bg-[var(--bg-dark)] border border-[var(--border)] rounded-md cursor-pointer transition-all duration-150 flex-shrink-0"
          :class="{
            'border-[var(--cyan)]': modelValue,
            'opacity-60 cursor-not-allowed': disabled,
            'hover:border-[var(--cyan)]': !disabled && !modelValue,
            active: modelValue,
          }"
          @click="toggle"
        >
          <span class="text-xs text-[var(--text-secondary)]">{{ label }}</span>

          <!-- Toggle Switch -->
          <div
            class="relative w-10 h-5.5 rounded-full border-2 transition-all duration-200 flex-shrink-0 ml-3"
            :class="{
              'bg-[var(--cyan)] border-[var(--cyan)]': modelValue,
              'bg-[var(--bg-elevated)] border-[var(--border)]': !modelValue,
            }"
          >
            <div
              class="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
              :class="{
                'left-[18px] bg-[var(--bg-dark)]': modelValue,
                'left-0.5 bg-[var(--text-muted)]': !modelValue,
              }"
            ></div>
          </div>
        </div>

        <!-- Inline Slot Content (shown when enabled) -->
        <Transition name="inline-fade">
          <div
            v-if="modelValue && $slots.default"
            data-testid="compact-inline-options"
            class="flex-1"
            @click.stop
          >
            <slot />
          </div>
        </Transition>
      </div>

      <!-- Below Layout - Nested Options with Transition -->
      <Transition name="nested-expand">
        <div
          v-if="slotPosition === 'below' && modelValue && $slots.default"
          data-testid="compact-nested-options"
          class="mt-3"
          @click.stop
        >
          <slot />
        </div>
      </Transition>
    </template>
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
  margin-top: 0;
}

.nested-expand-enter-to,
.nested-expand-leave-from {
  opacity: 1;
  max-height: 300px;
}

/* Inline Fade Transition */
.inline-fade-enter-active,
.inline-fade-leave-active {
  transition: opacity 0.2s ease;
}

.inline-fade-enter-from,
.inline-fade-leave-to {
  opacity: 0;
}

.inline-fade-enter-to,
.inline-fade-leave-from {
  opacity: 1;
}
</style>
