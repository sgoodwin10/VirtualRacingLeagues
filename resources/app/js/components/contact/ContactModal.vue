<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import BaseModal from '@app/components/common/modals/BaseModal.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormHelper from '@app/components/common/forms/FormHelper.vue';
import FormCharacterCount from '@app/components/common/forms/FormCharacterCount.vue';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Button from '@app/components/common/buttons/Button.vue';
import { PhPaperPlaneTilt } from '@phosphor-icons/vue';
import Message from 'primevue/message';
import { useToastError } from '@app/composables/useToastError';
import { useGtm } from '@app/composables/useGtm';
import { useContactForm } from '@app/composables/useContactForm';
import { useUserStore } from '@app/stores/userStore';
import { contactService } from '@app/services/contactService';

interface Props {
  visible: boolean;
  source?: 'app' | 'public';
}

const props = withDefaults(defineProps<Props>(), {
  source: 'app',
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
  error: [error: string];
}>();

const userStore = useUserStore();
const { showSuccess, showError } = useToastError();
const { trackFormSubmit } = useGtm();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const userEmail = computed(() => userStore.user?.email ?? '');
const userName = computed(() => userStore.userName);

const reasonOptions = [
  { label: 'I found an error', value: 'error' },
  { label: 'I have a question', value: 'question' },
  { label: 'I need help', value: 'help' },
  { label: 'Other', value: 'other' },
];

const form = reactive({
  reason: '',
  message: '',
  ccUser: true,
});

const { errors, validateAll, clearError, clearErrors } = useContactForm(form);

const isSubmitting = ref(false);
const submitError = ref('');

const isFormValid = computed(() => form.reason && form.message.trim());

async function handleSubmit() {
  submitError.value = '';

  if (!validateAll()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await contactService.submit({
      name: userName.value,
      email: userEmail.value,
      reason: form.reason,
      message: form.message,
      ccUser: form.ccUser,
      source: props.source,
    });

    trackFormSubmit('contact_form', 'submit', {
      source: props.source,
      reason: form.reason,
      cc_user: form.ccUser,
    });

    showSuccess("Message sent successfully! We'll get back to you soon.");
    emit('success');
    handleClose();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    submitError.value = errorMessage;
    showError(errorMessage);
    emit('error', errorMessage);
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  isVisible.value = false;
}

watch(isVisible, (newValue) => {
  if (newValue) {
    form.reason = '';
    form.message = '';
    form.ccUser = true;
    submitError.value = '';
    clearErrors();
  }
});
</script>

<template>
  <BaseModal v-model:visible="isVisible" header="Contact Support" width="lg" @hide="handleClose">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <FormInputGroup>
        <FormLabel for="reason" required text="Reason for contact" />
        <Select
          id="reason"
          v-model="form.reason"
          :options="reasonOptions"
          option-label="label"
          option-value="value"
          placeholder="Select a reason"
          :class="{ 'p-invalid': errors.reason }"
          class="w-full"
          @change="clearError('reason')"
        />
        <FormError :error="errors.reason" />
      </FormInputGroup>

      <FormInputGroup>
        <FormLabel for="message" required text="Message" />
        <Textarea
          id="message"
          v-model="form.message"
          rows="5"
          placeholder="Describe your issue or question..."
          :class="{ 'p-invalid': errors.message }"
          class="w-full"
          maxlength="2000"
          @input="clearError('message')"
        />
        <div class="flex justify-between items-center mt-1">
          <FormError :error="errors.message" />
          <FormCharacterCount :current="form.message.length" :max="2000" />
        </div>
      </FormInputGroup>

      <FormInputGroup>
        <div class="flex items-center gap-2">
          <Checkbox id="ccUser" v-model="form.ccUser" binary />
          <label for="ccUser" class="cursor-pointer"> Send me a copy at {{ userEmail }} </label>
        </div>
        <FormHelper text="You'll receive a copy of this message for your records." />
      </FormInputGroup>

      <Message v-if="submitError" severity="error" :closable="false" class="mb-4">
        {{ submitError }}
      </Message>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" variant="ghost" :disabled="isSubmitting" @click="handleClose" />
        <Button
          label="Send Message"
          variant="primary"
          :icon="PhPaperPlaneTilt"
          :loading="isSubmitting"
          :disabled="!isFormValid"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
