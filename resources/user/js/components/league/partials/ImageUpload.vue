<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import Button from 'primevue/button';
import Image from 'primevue/image';

interface Props {
  modelValue: File | null;
  existingImageUrl?: string | null;
  label: string;
  accept?: string;
  maxFileSize?: number;
  required?: boolean;
  error?: string;
  previewSize?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  existingImageUrl: null,
  accept: 'image/*',
  maxFileSize: 2000000, // 2MB default
  required: false,
  error: '',
  previewSize: 'small',
});

const emit = defineEmits<{
  'update:modelValue': [value: File | null];
  'remove-existing': [];
}>();

const fileUpload = ref();
const previewUrl = ref<string | null>(null);
const uploadError = ref<string>('');
const showExistingImage = ref(true);

const hasFile = computed(() => props.modelValue !== null);
const hasExistingImage = computed(() => props.existingImageUrl && showExistingImage.value);
const displayError = computed(() => props.error || uploadError.value);

const previewClasses = computed(() => {
  const sizeMap = {
    small: 'max-w-[150px] max-h-[150px]',
    medium: 'max-w-[300px] max-h-[200px]',
    large: 'max-w-[400px] max-h-[300px]',
  };
  return `${sizeMap[props.previewSize]} rounded-lg shadow-md border border-gray-200`;
});

// Watch for changes to modelValue to update preview
watch(
  () => props.modelValue,
  (newFile) => {
    if (newFile) {
      generatePreview(newFile);
      showExistingImage.value = false;
    } else {
      clearPreview();
    }
  },
  { immediate: true }
);

// Reset showExistingImage when existingImageUrl changes
watch(
  () => props.existingImageUrl,
  () => {
    if (props.existingImageUrl) {
      showExistingImage.value = true;
    }
  }
);

function generatePreview(file: File): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  previewUrl.value = URL.createObjectURL(file);
}

function clearPreview(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
}

function onSelect(event: FileUploadSelectEvent): void {
  uploadError.value = '';

  const files = event.files;
  const file = Array.isArray(files) ? files[0] : files;

  if (!file) {
    return;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please select a valid image file';
    return;
  }

  // Validate file size
  if (file.size > props.maxFileSize) {
    const maxSizeMB = (props.maxFileSize / 1000000).toFixed(1);
    uploadError.value = `File size must be less than ${maxSizeMB}MB`;
    return;
  }

  emit('update:modelValue', file);
}

function onClear(): void {
  uploadError.value = '';
  emit('update:modelValue', null);
  clearPreview();

  if (fileUpload.value) {
    fileUpload.value.clear();
  }
}

function removeFile(): void {
  onClear();
}

function removeExistingImage(): void {
  showExistingImage.value = false;
  emit('remove-existing');
}
</script>

<template>
  <div class="space-y-2">
    <label class="block font-medium">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Show existing image if present and no new file selected -->
    <div v-if="hasExistingImage && !hasFile" class="space-y-3">
      <div class="relative inline-block">
        <Image :src="existingImageUrl!" :alt="label" :class="previewClasses" preview />

        <Button
          icon="pi pi-times"
          severity="danger"
          size="small"
          rounded
          aria-label="Remove existing image"
          class="absolute top-2 right-2 shadow-lg"
          @click="removeExistingImage"
        />
      </div>

      <div class="flex items-center gap-2">
        <p class="text-sm text-gray-600">Current image</p>
        <Button
          label="Change Image"
          icon="pi pi-upload"
          size="small"
          outlined
          @click="removeExistingImage"
        />
      </div>
    </div>

    <!-- Show file upload when no existing image or after removing existing -->
    <div v-else-if="!hasFile" class="space-y-2">
      <FileUpload
        ref="fileUpload"
        mode="basic"
        :accept="accept"
        :max-file-size="maxFileSize"
        :auto="true"
        choose-label="Choose Image"
        :class="{ 'p-invalid': !!displayError }"
        @select="onSelect"
      />

      <p class="text-sm text-gray-600">
        Maximum file size: {{ (maxFileSize / 1000000).toFixed(1) }}MB
      </p>
    </div>

    <!-- Show new file preview -->
    <div v-else class="space-y-2">
      <div class="relative inline-block">
        <img v-if="previewUrl" :src="previewUrl" :alt="label" :class="previewClasses" />

        <Button
          icon="pi pi-times"
          severity="danger"
          size="small"
          rounded
          aria-label="Remove image"
          class="absolute top-2 right-2 shadow-lg"
          @click="removeFile"
        />
      </div>

      <p class="text-sm text-gray-600">{{ modelValue?.name }}</p>
    </div>

    <small v-if="displayError" class="text-red-500">{{ displayError }}</small>
  </div>
</template>
