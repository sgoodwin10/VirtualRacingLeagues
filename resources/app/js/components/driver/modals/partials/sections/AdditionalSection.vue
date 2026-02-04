<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import StyledInputNumber from '@app/components/common/forms/StyledInputNumber.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormHelper from '@app/components/common/forms/FormHelper.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import FormCharacterCount from '@app/components/common/forms/FormCharacterCount.vue';

interface Props {
  email: string;
  phone: string;
  driverNumber?: number | null;
  leagueNotes: string;
  errors: {
    email?: string;
    driver_number?: string;
  };
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  driverNumber: undefined,
  disabled: false,
});

const emit = defineEmits<{
  'update:email': [value: string];
  'update:phone': [value: string];
  'update:driver-number': [value: number | null | undefined];
  'update:league-notes': [value: string];
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Additional Information</h3>
      <p class="text-[var(--text-secondary)] m-0">Contact details, driver number, and notes</p>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <!-- Email -->
      <FormInputGroup>
        <FormLabel for="email" text="Email" />
        <InputText
          id="email"
          :model-value="email"
          type="email"
          size="sm"
          placeholder="john@example.com"
          :invalid="!!errors.email"
          :disabled="disabled"
          class="w-full"
          @update:model-value="emit('update:email', $event ?? '')"
        />
        <FormOptionalText text="Driver's email address" />
        <FormError v-if="errors.email">
          {{ errors.email }}
        </FormError>
      </FormInputGroup>

      <!-- Phone -->
      <FormInputGroup>
        <FormLabel for="phone" text="Phone" />
        <InputText
          id="phone"
          :model-value="phone"
          size="sm"
          placeholder="+1234567890"
          :disabled="disabled"
          class="w-full"
          @update:model-value="emit('update:phone', $event ?? '')"
        />
        <FormOptionalText text="Driver's phone number" />
      </FormInputGroup>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <!-- Driver Number -->
      <FormInputGroup>
        <FormLabel for="driver_number" text="Driver Number" />
        <StyledInputNumber
          :model-value="driverNumber"
          input-id="driver_number"
          :min="1"
          :max="999"
          :use-grouping="false"
          placeholder="5"
          :disabled="disabled"
          class="w-full"
          @update:model-value="emit('update:driver-number', $event ?? undefined)"
        />
        <FormHelper text="Between 1 and 999" />
        <FormError v-if="errors.driver_number">
          {{ errors.driver_number }}
        </FormError>
      </FormInputGroup>
    </div>

    <!-- League Notes -->
    <FormInputGroup>
      <FormLabel for="league_notes" text="League Notes" />
      <Textarea
        id="league_notes"
        :model-value="leagueNotes"
        rows="5"
        placeholder="Add any notes about this driver..."
        maxlength="500"
        :disabled="disabled"
        class="w-full"
        @update:model-value="emit('update:league-notes', $event)"
      />
      <div class="flex justify-between items-center">
        <FormHelper text="Notes specific to this league" />
        <FormCharacterCount :current="leagueNotes?.length || 0" :max="500" />
      </div>
    </FormInputGroup>
  </div>
</template>
