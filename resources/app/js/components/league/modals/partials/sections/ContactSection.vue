<script setup lang="ts">
import InputText from 'primevue/inputtext';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import type { CreateLeagueForm, FormErrors } from '@app/types/league';

interface Props {
  form: CreateLeagueForm;
  errors: FormErrors;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:contactEmail': [value: string];
  'update:organizerName': [value: string];
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Contact Details</h3>
      <p class="text-[var(--text-secondary)] m-0">How members can reach you</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Contact Email -->
      <FormInputGroup>
        <FormLabel for="contact-email" text="Contact Email" />
        <InputText
          id="contact-email"
          :model-value="form.contact_email"
          type="email"
          size="small"
          placeholder="league@example.com"
          :class="{ 'p-invalid': !!errors.contact_email }"
          class="w-full"
          @update:model-value="emit('update:contactEmail', $event)"
        />
        <FormOptionalText text="Visible to league members for inquiries" />
        <FormError :error="errors.contact_email" />
      </FormInputGroup>

      <!-- Organizer Name -->
      <FormInputGroup>
        <FormLabel for="organizer-name" text="Contact Name" />
        <InputText
          id="organizer-name"
          :model-value="form.organizer_name"
          placeholder="Your name or organisation"
          maxlength="100"
          size="small"
          :class="{ 'p-invalid': !!errors.organizer_name }"
          class="w-full"
          @update:model-value="emit('update:organizerName', $event)"
        />
        <FormOptionalText text="Displayed as the league organiser" />
        <FormError :error="errors.organizer_name" />
      </FormInputGroup>
    </div>
  </div>
</template>
