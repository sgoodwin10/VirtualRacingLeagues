<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import StyledInputNumber from '@app/components/common/forms/StyledInputNumber.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import type { PlatformFormField } from '@app/types/league';

interface Props {
  nickname: string;
  discordId: string;
  status: string;
  firstName: string;
  lastName: string;
  platformFormFields: PlatformFormField[];
  formData: Record<string, string | number | undefined>;
  errors: {
    identifier?: string;
    status?: string;
    platform?: string;
  };
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:nickname': [value: string];
  'update:discord-id': [value: string];
  'update:status': [value: string];
  'update:first-name': [value: string];
  'update:last-name': [value: string];
  'update:platform-field': [field: string, value: string | number | undefined];
}>();

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Banned', value: 'banned' },
];
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Basic Information</h3>
      <p class="text-[var(--text-secondary)] m-0">Driver identification and status</p>
    </div>

    <!-- Nickname -->
    <FormInputGroup>
      <FormLabel for="nickname" text="Nickname" />
      <InputText
        id="nickname"
        :model-value="nickname"
        size="sm"
        placeholder="JSmith"
        :disabled="disabled"
        class="w-full"
        @update:model-value="emit('update:nickname', $event ?? '')"
      />
      <FormOptionalText text="In-game or preferred nickname" />
    </FormInputGroup>

    <!-- Status -->
    <FormInputGroup>
      <FormLabel for="status" text="Status" required />
      <Select
        id="status"
        :model-value="status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="Select status"
        :disabled="disabled"
        size="sm"
        fluid
        class="w-full"
        @update:model-value="emit('update:status', $event)"
      />
      <FormOptionalText :show-optional="false" text="Driver's current status in the league" />
      <FormError v-if="errors.status">
        {{ errors.status }}
      </FormError>
    </FormInputGroup>

    <!-- Name Fields -->
    <div class="grid grid-cols-2 gap-3">
      <FormInputGroup>
        <FormLabel for="first_name" text="First Name" />
        <InputText
          id="first_name"
          :model-value="firstName"
          size="sm"
          placeholder="John"
          :disabled="disabled"
          class="w-full"
          @update:model-value="emit('update:first-name', $event ?? '')"
        />
      </FormInputGroup>

      <FormInputGroup>
        <FormLabel for="last_name" text="Last Name" />
        <InputText
          id="last_name"
          :model-value="lastName"
          size="sm"
          placeholder="Smith"
          :disabled="disabled"
          class="w-full"
          @update:model-value="emit('update:last-name', $event ?? '')"
        />
      </FormInputGroup>
    </div>

    <!-- Platform IDs Section -->
    <div class="mt-6 pt-6 border-t border-[var(--border)]">
      <h4 class="text-sm font-semibold mb-3">Platform IDs</h4>

      <!-- Discord ID -->
      <FormInputGroup>
        <FormLabel for="discord_id" text="Discord ID" />
        <InputText
          id="discord_id"
          :model-value="discordId"
          size="sm"
          placeholder="Discord username or ID"
          :disabled="disabled"
          class="w-full"
          @update:model-value="emit('update:discord-id', $event ?? '')"
        />
        <FormOptionalText text="Discord identifier for communication" />
      </FormInputGroup>

      <!-- Identifier Error -->
      <FormError v-if="errors.identifier">
        {{ errors.identifier }}
      </FormError>

      <!-- Platform Error (shown at top if no platform values) -->
      <FormError v-if="errors.platform">
        {{ errors.platform }}
      </FormError>

      <!-- Dynamic Platform Fields -->
      <div v-if="platformFormFields.length > 0" class="space-y-4 mt-4">
        <FormInputGroup v-for="field in platformFormFields" :key="field.field">
          <FormLabel :for="field.field" :text="field.label" />
          <InputText
            v-if="field.type === 'text'"
            :id="field.field"
            :model-value="(formData[field.field] as string) || ''"
            :placeholder="field.placeholder || ''"
            :disabled="disabled"
            size="sm"
            class="w-full"
            @update:model-value="emit('update:platform-field', field.field, $event)"
          />
          <StyledInputNumber
            v-else-if="field.type === 'number'"
            :input-id="field.field"
            :model-value="(formData[field.field] as number | null | undefined) ?? undefined"
            :use-grouping="false"
            :placeholder="field.placeholder || ''"
            :disabled="disabled"
            class="w-full"
            @update:model-value="emit('update:platform-field', field.field, $event ?? undefined)"
          />
        </FormInputGroup>
      </div>
    </div>
  </div>
</template>
