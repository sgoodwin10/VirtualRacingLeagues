<script setup lang="ts">
import Textarea from 'primevue/textarea';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';

interface Props {
  raceNotes: string;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:raceNotes': [value: string];
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Race Notes</h3>
      <p class="text-[var(--text-secondary)] m-0">Add optional notes and comments</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <!-- Left Column (66% - 2 cols) -->
      <div class="lg:col-span-2">
        <FormInputGroup>
          <FormLabel for="race_notes" text="Race Notes" />
          <Textarea
            id="race_notes"
            :model-value="raceNotes"
            rows="4"
            placeholder="Additional race notes, special rules, etc."
            :disabled="disabled"
            class="w-full"
            @update:model-value="emit('update:raceNotes', $event)"
          />
          <FormOptionalText text="Additional race notes, special rules, etc." />
        </FormInputGroup>
      </div>

      <!-- Right Column (33% - 1 col) -->
      <div class="lg:col-span-1">
        <!-- Empty -->
      </div>
    </div>
  </div>
</template>
