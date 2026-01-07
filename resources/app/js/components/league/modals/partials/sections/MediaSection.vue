<script setup lang="ts">
import ImageUpload from '@app/components/common/forms/ImageUpload.vue';
import type { CreateLeagueForm, FormErrors } from '@app/types/league';

interface Props {
  form: CreateLeagueForm;
  errors: FormErrors;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:logo': [value: File | null];
  'update:banner': [value: File | null];
  'update:headerImage': [value: File | null];
  'remove-existing-logo': [];
  'remove-existing-banner': [];
  'remove-existing-header': [];
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Media Assets</h3>
      <p class="text-[var(--text-secondary)] m-0">Visual branding for your league</p>
    </div>

    <!-- Info Banner -->
    <div
      class="flex items-start gap-3 p-3 bg-[var(--cyan-dim)] border border-[var(--cyan)] rounded-lg"
    >
      <i class="pi pi-info-circle text-[var(--cyan)] pt-0.5"></i>
      <p class="text-[var(--text-primary)] m-0">
        All media assets are optional. Default placeholders will be used if not provided.
      </p>
    </div>

    <div class="space-y-4">
      <!-- Row 1: Logo and Banner -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Logo Upload -->
        <div
          class="lg:col-span-1 rounded-md border border-[var(--border)] content-center p-4 bg-[var(--bg-card)]"
        >
          <ImageUpload
            :model-value="form.logo"
            :existing-image-url="form.logo_url ?? null"
            label="League Logo"
            :required="false"
            :error="errors.logo"
            preview-size="small"
            helper-text="Square logo (400x400px recommended)"
            @update:model-value="emit('update:logo', $event)"
            @remove-existing="emit('remove-existing-logo')"
          />
        </div>

        <!-- Banner Upload -->
        <div
          class="lg:col-span-2 rounded-md border border-[var(--border)] content-center p-4 bg-[var(--bg-card)]"
        >
          <ImageUpload
            :model-value="form.banner"
            :existing-image-url="form.banner_url ?? null"
            label="League Banner"
            :required="false"
            :error="errors.banner"
            preview-size="large"
            helper-text="Banner image (200-800px wide, 32-100px tall)"
            @update:model-value="emit('update:banner', $event)"
            @remove-existing="emit('remove-existing-banner')"
          />
        </div>
      </div>

      <!-- Row 2: Header Image (Background) -->
      <div class="rounded-md border border-[var(--border)] content-center p-4 bg-[var(--bg-card)]">
        <ImageUpload
          :model-value="form.header_image"
          :existing-image-url="form.header_image_url ?? null"
          label="League Background Image"
          :required="false"
          :error="errors.header_image"
          preview-size="large"
          helper-text="Banner image (1200x400px recommended)"
          @update:model-value="emit('update:headerImage', $event)"
          @remove-existing="emit('remove-existing-header')"
        />
      </div>
    </div>
  </div>
</template>
