<script setup lang="ts">
import { computed } from 'vue';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Editor from 'primevue/editor';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormOptionalText from '@app/components/common/forms/FormOptionalText.vue';
import PlatformChips from '@app/components/common/forms/PlatformChips.vue';
import VisibilityToggle from '@app/components/common/forms/VisibilityToggle.vue';
import type { CreateLeagueForm, FormErrors, Platform, Timezone } from '@app/types/league';

interface Props {
  form: CreateLeagueForm;
  errors: FormErrors;
  platforms: Platform[];
  timezones: Timezone[];
  isCheckingSlug: boolean;
  slugAvailable: boolean | null;
  generatedSlug: string;
  suggestedSlug: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:name': [value: string];
  'update:tagline': [value: string];
  'update:platformIds': [value: number[]];
  'update:description': [value: string];
  'update:visibility': [value: string];
  'update:timezone': [value: string];
  'blur:name': [];
}>();

const timezoneOptions = computed(() => {
  return props.timezones.map((tz) => ({
    label: tz.label,
    value: tz.value,
  }));
});
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Basic Information</h3>
      <p class="text-[var(--text-secondary)] m-0">Core league details and identity</p>
    </div>

    <!-- League Name -->
    <FormInputGroup>
      <FormLabel for="league-name" text="League Name" :required="true" />
      <InputText
        id="league-name"
        :model-value="form.name"
        size="small"
        placeholder="Enter your league name"
        :class="{ 'p-invalid': !!errors.name }"
        class="w-full"
        @update:model-value="(value) => emit('update:name', value as string)"
        @blur="emit('blur:name')"
      />

      <!-- Slug Preview -->
      <div class="flex flex-col gap-1">
        <!-- Checking status -->
        <div v-if="isCheckingSlug" class="flex items-center gap-2">
          <i class="pi pi-spin pi-spinner text-[var(--text-secondary)]"></i>
          <small class="text-[var(--text-secondary)]">Checking availability...</small>
        </div>

        <!-- Available - show the slug that will be used -->
        <div v-else-if="slugAvailable === true && generatedSlug" class="flex items-center gap-2">
          <i class="pi pi-check-circle text-[var(--green)]"></i>
          <small class="text-[var(--green)]">
            League URL: <span class="font-mono font-semibold">{{ generatedSlug }}</span>
          </small>
        </div>

        <!-- Not available - show the suggested unique slug -->
        <div v-else-if="slugAvailable === false && suggestedSlug" class="flex items-center gap-2">
          <i class="pi pi-info-circle text-[var(--orange)]"></i>
          <small class="text-[var(--orange)]">
            Name taken. League will use URL:
            <span class="font-mono font-semibold">{{ suggestedSlug }}</span>
          </small>
        </div>
      </div>

      <FormError :error="errors.name" />
    </FormInputGroup>

    <!-- Tagline -->
    <FormInputGroup>
      <FormLabel for="tagline" text="Tagline" />
      <InputText
        id="tagline"
        :model-value="form.tagline"
        size="small"
        placeholder="A short, catchy phrase describing your league"
        maxlength="150"
        :class="{ 'p-invalid': !!errors.tagline }"
        class="w-full"
        @update:model-value="(value) => emit('update:tagline', value as string)"
      />
      <FormOptionalText text="A brief one-liner about your league (max 150 characters)" />
      <FormError :error="errors.tagline" />
    </FormInputGroup>

    <!-- Platforms -->
    <PlatformChips
      :model-value="form.platform_ids"
      :platforms="platforms"
      :error="errors.platform_ids"
      :required="true"
      @update:model-value="emit('update:platformIds', $event)"
    />

    <!-- Description -->
    <FormInputGroup>
      <FormLabel for="description" text="Description" />
      <Editor
        id="description"
        :model-value="form.description"
        editor-style="height: 120px"
        :class="{ 'p-invalid': !!errors.description }"
        @update:model-value="emit('update:description', $event)"
      >
        <template #toolbar>
          <span class="ql-formats">
            <button class="ql-bold" type="button"></button>
            <button class="ql-italic" type="button"></button>
            <button class="ql-underline" type="button"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-list" value="ordered" type="button"></button>
            <button class="ql-list" value="bullet" type="button"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-link" type="button"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-clean" type="button"></button>
          </span>
        </template>
      </Editor>
      <FormOptionalText text="Tell potential members what your league is all about" />
      <FormError :error="errors.description" />
    </FormInputGroup>

    <!-- Visibility -->
    <VisibilityToggle
      :model-value="form.visibility"
      :error="errors.visibility"
      @update:model-value="emit('update:visibility', $event)"
    />

    <!-- Timezone -->
    <FormInputGroup>
      <FormLabel for="timezone" text="Timezone" />
      <Select
        id="timezone"
        :model-value="form.timezone"
        :options="timezoneOptions"
        option-label="label"
        option-value="value"
        placeholder="Select timezone"
        :filter="true"
        size="small"
        :class="{ 'p-invalid': !!errors.timezone }"
        class="w-full"
        @update:model-value="emit('update:timezone', $event)"
      />
      <FormOptionalText text="Used for scheduling events and race times" />
      <FormError :error="errors.timezone" />
    </FormInputGroup>
  </div>
</template>
