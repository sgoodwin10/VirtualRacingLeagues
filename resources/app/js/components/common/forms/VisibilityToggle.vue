<script setup lang="ts">
import { computed } from 'vue';
import { PhGlobe, PhEyeSlash } from '@phosphor-icons/vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import type { LeagueVisibility } from '@app/types/league';

interface VisibilityOption {
  label: string;
  value: LeagueVisibility;
  icon: typeof PhGlobe | typeof PhEyeSlash;
  description: string;
  statusTitle: string;
  statusDescription: string;
}

interface Props {
  modelValue: LeagueVisibility;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  error: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: LeagueVisibility];
}>();

const selectedVisibility = computed({
  get: () => props.modelValue,
  set: (value: LeagueVisibility) => emit('update:modelValue', value),
});

const visibilityOptions: VisibilityOption[] = [
  {
    label: 'Public',
    value: 'public',
    icon: PhGlobe,
    description: 'Anyone can find and view your league',
    statusTitle: 'Discoverable in Search',
    statusDescription:
      'Your league will appear in search results and can be found by anyone looking to join a racing community.',
  },
  {
    label: 'Unlisted',
    value: 'unlisted',
    icon: PhEyeSlash,
    description: 'Hidden from search, accessible via link',
    statusTitle: 'Link Access Only',
    statusDescription:
      'Your league is hidden from search. Only people with a direct link can find and join your league.',
  },
];

const currentOption = computed(() => {
  return (
    visibilityOptions.find((opt) => opt.value === selectedVisibility.value) || visibilityOptions[0]
  );
});

function setVisibility(value: LeagueVisibility): void {
  selectedVisibility.value = value;
}
</script>

<template>
  <FormInputGroup>
    <FormLabel text="Visibility" />

    <div class="space-y-3">
      <!-- Segmented Control -->
      <div
        class="inline-flex gap-1 p-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg"
      >
        <button
          v-for="option in visibilityOptions"
          :key="option.value"
          type="button"
          :class="{
            'bg-[var(--cyan)] text-[var(--bg-dark)] shadow-sm': selectedVisibility === option.value,
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]':
              selectedVisibility !== option.value,
          }"
          class="flex items-center gap-2 px-4 py-2 rounded-md transition-all font-medium"
          @click="setVisibility(option.value)"
        >
          <component :is="option.icon" :size="16" weight="duotone" />
          <span>{{ option.label }}</span>
        </button>
      </div>

      <!-- Status Panel -->
      <div
        :class="{
          'border-[var(--green)] bg-[var(--green-dim)]': selectedVisibility === 'public',
          'border-[var(--orange)] bg-[var(--orange-dim)]': selectedVisibility === 'unlisted',
        }"
        class="flex items-start gap-3 p-3 border rounded-lg"
      >
        <!-- Icon Circle -->
        <div
          :class="{
            'bg-[var(--green)]': selectedVisibility === 'public',
            'bg-[var(--orange)]': selectedVisibility === 'unlisted',
          }"
          class="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
        >
          <component
            :is="currentOption.icon"
            :size="16"
            weight="bold"
            class="text-[var(--bg-dark)]"
          />
        </div>

        <!-- Status Text -->
        <div class="flex-1 min-w-0">
          <div
            :class="{
              'text-[var(--green)]': selectedVisibility === 'public',
              'text-[var(--orange)]': selectedVisibility === 'unlisted',
            }"
            class="font-semibold mb-0.5"
          >
            {{ currentOption.statusTitle }}
          </div>
          <p class="text-[var(--text-secondary)] leading-snug m-0">
            {{ currentOption.statusDescription }}
          </p>
        </div>
      </div>
    </div>

    <FormError :error="error" />
  </FormInputGroup>
</template>
