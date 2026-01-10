<script setup lang="ts">
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';

interface FormState {
  name: string;
  car_class: string;
  description: string;
  technical_specs: string;
}

interface FormErrors {
  name?: string;
  car_class?: string;
  description?: string;
  technical_specs?: string;
}

interface Props {
  form: FormState;
  errors: FormErrors;
  isSubmitting: boolean;
  slugPreview: string;
  slugStatus: 'checking' | 'available' | 'taken' | 'error' | 'timeout' | null;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:name': [value: string];
  'update:carClass': [value: string];
  'update:description': [value: string];
  'update:technicalSpecs': [value: string];
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Basic Information</h3>
      <p class="text-[var(--text-secondary)] m-0">Core season details and description</p>
    </div>

    <!-- Name Field -->
    <FormInputGroup>
      <FormLabel for="name" text="Season Name" :required="true" />
      <InputText
        id="name"
        :model-value="form.name"
        placeholder="e.g., Season 1, 2024 Winter Championship"
        size="small"
        :class="{ 'p-invalid': errors.name }"
        :disabled="isSubmitting"
        maxlength="100"
        class="w-full"
        @update:model-value="emit('update:name', $event)"
      />

      <!-- Slug Preview -->
      <div v-if="slugPreview" class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-[var(--green)]" />
        <span class="font-mono text-[var(--text-muted)]">
          /seasons/<span class="text-[var(--green)]">{{ slugPreview }}</span>
        </span>
      </div>

      <FormError :error="errors.name" />
    </FormInputGroup>

    <!-- Car Class -->
    <FormInputGroup>
      <FormLabel for="car_class" text="Car Class" />
      <InputText
        id="car_class"
        :model-value="form.car_class"
        placeholder="e.g., GT3, Formula 1, LMP1"
        size="small"
        :class="{ 'p-invalid': errors.car_class }"
        :disabled="isSubmitting"
        maxlength="150"
        class="w-full"
        @update:model-value="emit('update:carClass', $event)"
      />
      <div class="text-[var(--text-muted)] mt-1.5">Specify the car class used in this season</div>
      <FormError :error="errors.car_class" />
    </FormInputGroup>

    <div class="grid grid-cols-2 gap-4">
      <!-- Description -->
      <FormInputGroup>
        <FormLabel for="description" text="Description" />
        <Textarea
          id="description"
          class="w-full"
          :model-value="form.description"
          rows="3"
          placeholder="Describe this season, race format, rules..."
          :class="{ 'p-invalid': errors.description }"
          :disabled="isSubmitting"
          maxlength="2000"
          @update:model-value="emit('update:description', $event)"
        />
        <FormError :error="errors.description" />
      </FormInputGroup>

      <!-- Technical Specs -->
      <FormInputGroup>
        <FormLabel for="technical_specs" text="Technical Specifications" />
        <Textarea
          id="technical_specs"
          class="w-full"
          :model-value="form.technical_specs"
          rows="3"
          placeholder="Car setup rules, performance restrictions, BoP..."
          :class="{ 'p-invalid': errors.technical_specs }"
          :disabled="isSubmitting"
          maxlength="2000"
          @update:model-value="emit('update:technicalSpecs', $event)"
        />
        <FormError :error="errors.technical_specs" />
      </FormInputGroup>
    </div>
  </div>
</template>
