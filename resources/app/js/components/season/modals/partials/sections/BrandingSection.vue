<script setup lang="ts">
import ImageUpload from '@app/components/common/forms/ImageUpload.vue';

interface FormState {
  logo: File | null;
  logo_url: string | null;
  banner: File | null;
  banner_url: string | null;
}

interface Props {
  form: FormState;
  isSubmitting: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:logo': [value: File | null];
  'update:banner': [value: File | null];
  'remove-existing-logo': [];
  'remove-existing-banner': [];
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="mb-4">
      <h3 class="text-section-label mb-1">Branding Assets</h3>
      <p class="text-[var(--text-secondary)] m-0">Custom logo and banner for this season</p>
    </div>

    <!-- Info Banner -->
    <div
      class="flex items-start gap-3 p-3 bg-[var(--cyan-dim)] border border-[var(--cyan)] rounded-lg"
    >
      <i class="pi pi-info-circle text-[var(--cyan)] pt-0.5"></i>
      <p class="text-[var(--text-primary)] m-0">
        If not provided, the competition logo and banner will be inherited.
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
            label="Season Logo"
            :required="false"
            preview-size="small"
            helper-text="Square logo (500x500px recommended)"
            :max-file-size="2 * 1024 * 1024"
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
            label="Season Banner"
            :required="false"
            preview-size="large"
            helper-text="Banner image (1920x400px recommended)"
            :max-file-size="5 * 1024 * 1024"
            @update:model-value="emit('update:banner', $event)"
            @remove-existing="emit('remove-existing-banner')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
