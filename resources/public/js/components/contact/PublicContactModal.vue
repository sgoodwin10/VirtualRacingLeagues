<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import VrlModal from '@public/components/common/modals/VrlModal.vue';
import VrlFormGroup from '@public/components/common/forms/VrlFormGroup.vue';
import VrlFormLabel from '@public/components/common/forms/VrlFormLabel.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlFormError from '@public/components/common/forms/VrlFormError.vue';
import VrlSelect from '@public/components/common/forms/VrlSelect.vue';
import VrlTextarea from '@public/components/common/forms/VrlTextarea.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import { useToast } from '@public/composables/useToast';
import { useGtm } from '@public/composables/useGtm';
import { useContactForm } from '@public/composables/useContactForm';
import { contactService } from '@public/services/contactService';

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const toast = useToast();
const { trackFormSubmit } = useGtm();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const reasonOptions = [
  { label: 'I found an error', value: 'error' },
  { label: 'I have a question', value: 'question' },
  { label: 'I need help', value: 'help' },
  { label: 'Other', value: 'other' },
];

const form = reactive({
  name: '',
  email: '',
  reason: '',
  message: '',
});

const { errors, validateAll, clearError, clearErrors } = useContactForm(form);

const isSubmitting = ref(false);
const submitError = ref('');

const isFormValid = computed(() => {
  return form.name.trim() && form.email.trim() && form.reason && form.message.trim();
});

async function handleSubmit() {
  submitError.value = '';

  if (!validateAll()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await contactService.submit({
      name: form.name,
      email: form.email,
      reason: form.reason,
      message: form.message,
      source: 'public',
    });

    trackFormSubmit('contact_form', 'submit', {
      source: 'public',
      reason: form.reason,
    });

    toast.success("Thank you! We'll get back to you soon.", 'Message Sent');

    emit('success');
    handleClose();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    submitError.value = errorMessage;
    toast.error(errorMessage, 'Error');
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  isVisible.value = false;
}

// Reset form when modal opens
watch(isVisible, (newValue) => {
  if (newValue) {
    form.name = '';
    form.email = '';
    form.reason = '';
    form.message = '';
    submitError.value = '';
    clearErrors();
  }
});
</script>

<template>
  <VrlModal v-model:visible="isVisible" title="Contact Us" width="md" @close="handleClose">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Name Field -->
      <VrlFormGroup>
        <VrlFormLabel for="name" required>Your Name</VrlFormLabel>
        <VrlInput
          id="name"
          v-model="form.name"
          placeholder="Enter your name"
          :error="errors.name"
          @input="clearError('name')"
        />
        <VrlFormError :error="errors.name" />
      </VrlFormGroup>

      <!-- Email Field -->
      <VrlFormGroup>
        <VrlFormLabel for="email" required>Your Email</VrlFormLabel>
        <VrlInput
          id="email"
          v-model="form.email"
          type="email"
          placeholder="Enter your email"
          :error="errors.email"
          @input="clearError('email')"
        />
        <VrlFormError :error="errors.email" />
      </VrlFormGroup>

      <!-- Reason Dropdown -->
      <VrlFormGroup>
        <VrlFormLabel for="reason" required>Reason for Contact</VrlFormLabel>
        <VrlSelect
          id="reason"
          v-model="form.reason"
          :options="reasonOptions"
          placeholder="Select a reason"
          :error="errors.reason"
          @change="clearError('reason')"
        />
        <VrlFormError :error="errors.reason" />
      </VrlFormGroup>

      <!-- Message Textarea -->
      <VrlFormGroup>
        <VrlFormLabel for="message" required>Message</VrlFormLabel>
        <VrlTextarea
          id="message"
          v-model="form.message"
          :rows="5"
          placeholder="How can we help you?"
          :error="errors.message"
          :maxlength="2000"
          :show-character-count="true"
          @input="clearError('message')"
        />
        <VrlFormError :error="errors.message" />
      </VrlFormGroup>

      <!-- Error Message -->
      <div v-if="submitError" class="text-[var(--red)] text-sm mt-2">
        {{ submitError }}
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <VrlButton variant="ghost" :disabled="isSubmitting" @click="handleClose">
          Cancel
        </VrlButton>
        <VrlButton
          variant="primary"
          :loading="isSubmitting"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          Send Message
        </VrlButton>
      </div>
    </template>
  </VrlModal>
</template>
