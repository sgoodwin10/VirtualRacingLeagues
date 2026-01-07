<script setup lang="ts">
import { ref, computed } from 'vue';
import { PhUpload, PhX } from '@phosphor-icons/vue';

interface Props {
  modelValue: File | null;
  existingImageUrl?: string | null;
  label: string;
  aspectRatio?: 'square' | 'wide';
  recommendedSize?: string;
  maxFileSize?: number;
  accept?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  existingImageUrl: null,
  aspectRatio: 'square',
  recommendedSize: '',
  maxFileSize: 5 * 1024 * 1024,
  accept: 'image/png,image/jpeg,image/jpg',
  disabled: false,
});

interface Emits {
  (e: 'update:modelValue', value: File | null): void;
  (e: 'remove-existing'): void;
}

const emit = defineEmits<Emits>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const error = ref<string | null>(null);

const hasImage = computed(() => {
  return previewUrl.value !== null || props.existingImageUrl !== null;
});

const displayUrl = computed(() => {
  return previewUrl.value || props.existingImageUrl;
});

function openFilePicker(): void {
  if (!props.disabled && fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function onFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  error.value = null;

  // Validate file size
  if (file.size > props.maxFileSize) {
    error.value = `File size must be less than ${formatFileSize(props.maxFileSize)}`;
    return;
  }

  // Validate file type
  const acceptedTypes = props.accept.split(',').map((type) => type.trim());
  if (!acceptedTypes.includes(file.type)) {
    error.value = 'Invalid file type';
    return;
  }

  // Create preview URL
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string;
  };
  reader.onerror = () => {
    error.value = 'Failed to read file';
    console.error('FileReader error: Failed to read file');
  };
  reader.readAsDataURL(file);

  emit('update:modelValue', file);
}

function removeImage(): void {
  previewUrl.value = null;
  error.value = null;

  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }

  if (props.existingImageUrl) {
    emit('remove-existing');
  }

  emit('update:modelValue', null);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <div class="w-full">
    <div
      data-testid="upload-box"
      class="flex flex-col items-center justify-center bg-card border-2 border-dashed border-[--border] rounded-md transition-all duration-150 min-h-[100px] relative"
      :class="[
        aspectRatio === 'square' ? 'aspect-square' : 'aspect-video max-h-[200px]',
        hasImage ? 'p-0 border-solid cursor-default' : 'p-5 cursor-pointer',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
        !hasImage && !disabled ? 'hover:border-[--cyan] hover:bg-[--cyan-dim]' : '',
      ]"
      :data-aspect="aspectRatio"
      :data-disabled="disabled || undefined"
      @click="!hasImage && openFilePicker()"
    >
      <!-- Empty State: Upload prompt -->
      <template v-if="!hasImage">
        <div
          data-testid="upload-icon"
          class="w-8 h-8 flex items-center justify-center bg-elevated rounded-full text-[--text-muted] mb-2.5"
        >
          <PhUpload :size="18" />
        </div>
        <div class="text-xs text-[--text-secondary] mb-0.5 font-medium">{{ label }}</div>
        <div v-if="recommendedSize" class="text-[10px] text-[--text-muted]">
          {{ recommendedSize }}
        </div>
        <input
          ref="fileInputRef"
          type="file"
          :accept="accept"
          :disabled="disabled"
          class="hidden"
          @change="onFileSelect"
        />
      </template>

      <!-- Preview State: Image with remove button -->
      <template v-else>
        <div class="relative w-full h-full overflow-hidden rounded">
          <img
            data-testid="preview-image"
            :src="displayUrl || ''"
            :alt="label"
            class="w-full h-full object-cover block"
          />
          <button
            type="button"
            data-testid="remove-btn"
            class="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-[--bg-dark] border border-[--border] rounded text-[--text-muted] transition-all duration-150 hover:text-[--red] hover:border-[--red] disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="disabled"
            @click.stop="removeImage"
          >
            <PhX :size="14" />
          </button>
        </div>
      </template>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="flex items-center gap-1.5 mt-2 text-xs text-[--red]">
      <i class="pi pi-exclamation-circle text-sm" />
      <span>{{ error }}</span>
    </div>
  </div>
</template>
