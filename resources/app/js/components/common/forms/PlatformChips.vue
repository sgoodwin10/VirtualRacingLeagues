<script setup lang="ts">
import { computed } from 'vue';
import { PhDesktop, PhGameController } from '@phosphor-icons/vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormHelper from '@app/components/common/forms/FormHelper.vue';
import type { Platform } from '@app/types/league';

interface Props {
  modelValue: number[];
  platforms: Platform[];
  error?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  error: '',
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number[]];
}>();

const selectedPlatformIds = computed({
  get: () => props.modelValue,
  set: (value: number[]) => emit('update:modelValue', value),
});

const hasError = computed(() => !!props.error);

/**
 * Toggle platform selection
 */
function togglePlatform(platformId: number): void {
  const currentSelected = [...selectedPlatformIds.value];
  const index = currentSelected.indexOf(platformId);

  if (index > -1) {
    // Remove platform
    currentSelected.splice(index, 1);
  } else {
    // Add platform
    currentSelected.push(platformId);
  }

  selectedPlatformIds.value = currentSelected;
}

/**
 * Check if platform is selected
 */
function isPlatformSelected(platformId: number): boolean {
  return selectedPlatformIds.value.includes(platformId);
}

/**
 * Get icon for platform based on name
 */
function getPlatformIcon(platform: Platform) {
  const name = platform.name.toLowerCase();

  if (name.includes('pc')) {
    return PhDesktop;
  }

  // PlayStation, Xbox, etc. use gamepad icon
  return PhGameController;
}
</script>

<template>
  <FormInputGroup>
    <FormLabel for="platforms" text="Platforms" :required="required" />

    <div class="flex flex-wrap gap-2">
      <button
        v-for="platform in platforms"
        :key="platform.id"
        type="button"
        :class="{
          'border-[var(--cyan)] bg-[var(--cyan-dim)] text-[var(--cyan)]': isPlatformSelected(
            platform.id,
          ),
          'border-[var(--border)] hover:border-[var(--cyan)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]':
            !isPlatformSelected(platform.id),
          'border-[var(--red)]': hasError && !isPlatformSelected(platform.id),
        }"
        class="flex items-center gap-2 px-3 py-2 border rounded-lg transition-all"
        @click="togglePlatform(platform.id)"
      >
        <component :is="getPlatformIcon(platform)" :size="16" weight="duotone" />
        <span class="text-sm font-medium">{{ platform.name }}</span>
      </button>
    </div>

    <FormHelper text="Select all platforms your league supports" />

    <FormError :error="error" />
  </FormInputGroup>
</template>
