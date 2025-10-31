<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import Button from 'primevue/button';
import Image from 'primevue/image';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormHelper from '@app/components/common/forms/FormHelper.vue';

interface Dimensions {
  width: number;
  height: number;
}

interface Props {
  modelValue: File | null;
  existingImageUrl?: string | null;
  label: string;
  accept?: string;
  maxFileSize?: number;
  minDimensions?: Dimensions;
  recommendedDimensions?: Dimensions;
  required?: boolean;
  error?: string;
  previewSize?: 'small' | 'medium' | 'large';
  helperText?: string;
  labelText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  existingImageUrl: null,
  accept: 'image/*',
  maxFileSize: 2000000, // 2MB default
  minDimensions: undefined,
  recommendedDimensions: undefined,
  required: false,
  error: '',
  previewSize: 'small',
  helperText: '',
  labelText: '',
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
  { immediate: true },
);

// Reset showExistingImage when existingImageUrl changes
watch(
  () => props.existingImageUrl,
  () => {
    if (props.existingImageUrl) {
      showExistingImage.value = true;
    }
  },
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

async function onSelect(event: FileUploadSelectEvent): Promise<void> {
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

  // Validate dimensions if minDimensions specified
  if (props.minDimensions) {
    try {
      const dimensions = await getImageDimensions(file);
      if (
        dimensions.width < props.minDimensions.width ||
        dimensions.height < props.minDimensions.height
      ) {
        uploadError.value = `Image must be at least ${props.minDimensions.width}x${props.minDimensions.height}px`;
        return;
      }
    } catch {
      uploadError.value = 'Failed to validate image dimensions';
      return;
    }
  }

  emit('update:modelValue', file);
}

function getImageDimensions(file: File): Promise<Dimensions> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
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
    <div v-if="labelText" class="flex items-baseline gap-2">
      <FormLabel :text="label" :required="required" />
      <span v-if="!required" class="text-xs text-gray-500">(optional)</span>
    </div>

    <p v-if="helperText" class="text-xs text-gray-500 mt-1">{{ helperText }}</p>

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

      <FormHelper :text="`Maximum file size: ${(maxFileSize / 1000000).toFixed(1)}MB`" />
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
    </div>

    <FormError :error="displayError" />
  </div>
</template>
