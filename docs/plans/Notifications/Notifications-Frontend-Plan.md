# Notifications System - Frontend Plan

## Table of Contents
- [Overview](#overview)
- [App Dashboard Implementation](#app-dashboard-implementation)
- [Public Site Implementation](#public-site-implementation)
- [Admin Dashboard Implementation](#admin-dashboard-implementation)
- [Shared Components & Composables](#shared-components--composables)
- [GTM Event Tracking](#gtm-event-tracking)
- [Implementation Checklist](#implementation-checklist)

---

## Overview

This document details the Vue.js frontend implementation for the notifications system across all three applications:
- **App Dashboard** (`resources/app/js/`) - Floating contact button for authenticated users
- **Public Site** (`resources/public/js/`) - Footer contact link for visitors
- **Admin Dashboard** (`resources/admin/js/`) - Notification history and contact management

**Key Patterns to Follow:**
- Use existing modal components (`BaseModal` for App, `VrlModal` for Public)
- Use existing composables (`useToastError`, `useGtm`, `useConfirmDialog`)
- Follow established form validation patterns
- Use PrimeVue components consistently

---

## App Dashboard Implementation

### Agent: `dev-fe-app`

### 1. Floating Contact Button

**Location**: `resources/app/js/components/contact/ContactFloatingButton.vue`

```vue
<template>
  <div class="contact-floating-container">
    <!-- Floating Action Button -->
    <Button
      icon="pi pi-comment"
      rounded
      raised
      :severity="isOpen ? 'secondary' : 'primary'"
      size="large"
      aria-label="Contact Support"
      class="contact-fab"
      @click="openModal"
    />

    <!-- Contact Modal -->
    <ContactModal
      v-model:visible="isOpen"
      source="app"
      @success="handleSuccess"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import ContactModal from './ContactModal.vue';
import { useGtm } from '@app/composables/useGtm';

const isOpen = ref(false);
const { trackEvent } = useGtm();

function openModal() {
  isOpen.value = true;
  trackEvent('contact_form_open', { source: 'app' });
}

function handleSuccess() {
  // Toast handled in modal
}

function handleError() {
  // Toast handled in modal
}
</script>

<style scoped>
.contact-floating-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
}

.contact-fab {
  width: 3.5rem;
  height: 3.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.contact-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
</style>
```

### 2. Contact Modal

**Location**: `resources/app/js/components/contact/ContactModal.vue`

```vue
<template>
  <BaseModal
    v-model:visible="isVisible"
    header="Contact Support"
    :style="{ width: '500px' }"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="contact-form">
      <!-- Reason Dropdown -->
      <FormInputGroup>
        <FormLabel for="reason" required>Reason for contact</FormLabel>
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

      <!-- Message Textarea -->
      <FormInputGroup>
        <FormLabel for="message" required>Message</FormLabel>
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

      <!-- CC Myself Checkbox -->
      <FormInputGroup>
        <div class="flex items-center gap-2">
          <Checkbox
            id="ccUser"
            v-model="form.ccUser"
            binary
          />
          <label for="ccUser" class="cursor-pointer">
            Send me a copy at {{ userEmail }}
          </label>
        </div>
        <FormHelper>You'll receive a copy of this message for your records.</FormHelper>
      </FormInputGroup>

      <!-- Error Message -->
      <Message v-if="submitError" severity="error" :closable="false" class="mb-4">
        {{ submitError }}
      </Message>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          text
          :disabled="isSubmitting"
          @click="handleClose"
        />
        <Button
          label="Send Message"
          icon="pi pi-send"
          :loading="isSubmitting"
          :disabled="!isFormValid"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>

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
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useToastError } from '@app/composables/useToastError';
import { useGtm } from '@app/composables/useGtm';
import { useContactForm } from '@app/composables/useContactForm';
import { useUserStore } from '@app/stores/userStore';
import { contactService } from '@app/services/contactService';

interface Props {
  visible: boolean;
  source: 'app' | 'public';
}

const props = defineProps<Props>();
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

const { errors, isValid, validateAll, clearError, clearErrors } = useContactForm(form);

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
      name: userStore.user?.name ?? 'User',
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

    showSuccess('Message sent successfully! We\'ll get back to you soon.');
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

// Reset form when modal opens
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
```

### 3. Contact Form Validation Composable

**Location**: `resources/app/js/composables/useContactForm.ts`

```typescript
import { reactive, computed } from 'vue';

interface ContactForm {
  reason: string;
  message: string;
  name?: string;
  email?: string;
}

interface ContactErrors {
  reason: string;
  message: string;
  name: string;
  email: string;
}

export function useContactForm(form: ContactForm, requireUserInfo = false) {
  const errors = reactive<ContactErrors>({
    reason: '',
    message: '',
    name: '',
    email: '',
  });

  function validateReason(): boolean {
    errors.reason = '';
    if (!form.reason) {
      errors.reason = 'Please select a reason for contact';
      return false;
    }
    return true;
  }

  function validateMessage(): boolean {
    errors.message = '';
    if (!form.message.trim()) {
      errors.message = 'Message is required';
      return false;
    }
    if (form.message.length > 2000) {
      errors.message = 'Message must be 2000 characters or less';
      return false;
    }
    return true;
  }

  function validateName(): boolean {
    if (!requireUserInfo) return true;
    errors.name = '';
    if (!form.name?.trim()) {
      errors.name = 'Name is required';
      return false;
    }
    return true;
  }

  function validateEmail(): boolean {
    if (!requireUserInfo) return true;
    errors.email = '';
    if (!form.email?.trim()) {
      errors.email = 'Email is required';
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      errors.email = 'Please enter a valid email address';
      return false;
    }
    return true;
  }

  function validateAll(): boolean {
    const results = [
      validateReason(),
      validateMessage(),
      validateName(),
      validateEmail(),
    ];
    return results.every(Boolean);
  }

  function clearError(field: keyof ContactErrors): void {
    errors[field] = '';
  }

  function clearErrors(): void {
    errors.reason = '';
    errors.message = '';
    errors.name = '';
    errors.email = '';
  }

  const isValid = computed(() => {
    const baseValid = !!form.reason && !!form.message.trim();
    if (requireUserInfo) {
      return baseValid && !!form.name?.trim() && !!form.email?.trim();
    }
    return baseValid;
  });

  const hasErrors = computed(() => {
    return Object.values(errors).some(Boolean);
  });

  return {
    errors,
    isValid,
    hasErrors,
    validateAll,
    validateReason,
    validateMessage,
    validateName,
    validateEmail,
    clearError,
    clearErrors,
  };
}
```

### 4. Contact Service

**Location**: `resources/app/js/services/contactService.ts`

```typescript
import api from '@app/services/api';

export interface ContactFormData {
  name: string;
  email: string;
  reason: string;
  message: string;
  ccUser?: boolean;
  source: 'app' | 'public';
}

export interface ContactResponse {
  id: number;
  message: string;
}

export const contactService = {
  async submit(data: ContactFormData): Promise<ContactResponse> {
    const response = await api.post<ContactResponse>('/api/contact', {
      name: data.name,
      email: data.email,
      reason: data.reason,
      message: data.message,
      cc_user: data.ccUser ?? false,
      source: data.source,
    });
    return response.data;
  },
};
```

### 5. Integration in AppLayout

**Location**: Update `resources/app/js/components/layout/AppLayout.vue`

Add the floating contact button to the layout:

```vue
<template>
  <div class="app-layout">
    <!-- Existing layout content -->
    <AppSidebar />
    <main class="main-content">
      <AppHeader />
      <router-view />
    </main>

    <!-- Add floating contact button -->
    <ContactFloatingButton />

    <!-- Existing global components -->
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
// ... existing imports
import ContactFloatingButton from '@app/components/contact/ContactFloatingButton.vue';
</script>
```

---

## Public Site Implementation

### Agent: `dev-fe-public`

### 1. Contact Link in Footer

**Location**: Update `resources/public/js/components/layout/PublicFooter.vue`

```vue
<template>
  <footer class="public-footer">
    <div class="footer-content">
      <span>&copy; {{ currentYear }} {{ appName }}</span>
      <div class="footer-links">
        <button class="footer-link" @click="openContactModal">
          Contact Us
        </button>
        <!-- Other footer links -->
      </div>
    </div>

    <!-- Contact Modal -->
    <PublicContactModal
      v-model:visible="isContactOpen"
      @success="handleSuccess"
    />
  </footer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import PublicContactModal from '@public/components/contact/PublicContactModal.vue';
import { useGtm } from '@public/composables/useGtm';

const isContactOpen = ref(false);
const { trackEvent } = useGtm();

const currentYear = computed(() => new Date().getFullYear());
const appName = import.meta.env.VITE_APP_NAME || 'VRL';

function openContactModal() {
  isContactOpen.value = true;
  trackEvent('contact_form_open', { source: 'public' });
}

function handleSuccess() {
  // Optional: additional handling
}
</script>
```

### 2. Public Contact Modal

**Location**: `resources/public/js/components/contact/PublicContactModal.vue`

```vue
<template>
  <VrlModal
    v-model:visible="isVisible"
    header="Contact Us"
    width="md"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="contact-form space-y-4">
      <!-- Name Field -->
      <VrlFormGroup>
        <VrlLabel for="name" required>Your Name</VrlLabel>
        <VrlInput
          id="name"
          v-model="form.name"
          placeholder="Enter your name"
          :error="!!errors.name"
          @input="clearError('name')"
        />
        <VrlFormError :error="errors.name" />
      </VrlFormGroup>

      <!-- Email Field -->
      <VrlFormGroup>
        <VrlLabel for="email" required>Your Email</VrlLabel>
        <VrlInput
          id="email"
          v-model="form.email"
          type="email"
          placeholder="Enter your email"
          :error="!!errors.email"
          @input="clearError('email')"
        />
        <VrlFormError :error="errors.email" />
      </VrlFormGroup>

      <!-- Reason Dropdown -->
      <VrlFormGroup>
        <VrlLabel for="reason" required>Reason for Contact</VrlLabel>
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
        <VrlFormError :error="errors.reason" />
      </VrlFormGroup>

      <!-- Message Textarea -->
      <VrlFormGroup>
        <VrlLabel for="message" required>Message</VrlLabel>
        <Textarea
          id="message"
          v-model="form.message"
          rows="5"
          placeholder="How can we help you?"
          :class="{ 'p-invalid': errors.message }"
          class="w-full"
          maxlength="2000"
          @input="clearError('message')"
        />
        <div class="flex justify-between items-center mt-1">
          <VrlFormError :error="errors.message" />
          <span class="text-xs text-gray-400">{{ form.message.length }}/2000</span>
        </div>
      </VrlFormGroup>

      <!-- Error Message -->
      <Message v-if="submitError" severity="error" :closable="false">
        {{ submitError }}
      </Message>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Cancel"
          severity="secondary"
          text
          :disabled="isSubmitting"
          @click="handleClose"
        />
        <Button
          label="Send Message"
          icon="pi pi-send"
          :loading="isSubmitting"
          :disabled="!isFormValid"
          @click="handleSubmit"
        />
      </div>
    </template>
  </VrlModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import VrlModal from '@public/components/common/modals/VrlModal.vue';
import VrlFormGroup from '@public/components/common/forms/VrlFormGroup.vue';
import VrlLabel from '@public/components/common/forms/VrlLabel.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlFormError from '@public/components/common/forms/VrlFormError.vue';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useToast } from 'primevue/usetoast';
import { useGtm } from '@public/composables/useGtm';
import { useContactForm } from '@public/composables/useContactForm';
import { contactService } from '@public/services/contactService';

const props = defineProps<{
  visible: boolean;
}>();

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

const { errors, isValid, validateAll, clearError, clearErrors } = useContactForm(form, true);

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

    toast.add({
      severity: 'success',
      summary: 'Message Sent',
      detail: 'Thank you! We\'ll get back to you soon.',
      life: 5000,
    });

    emit('success');
    handleClose();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    submitError.value = errorMessage;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    });
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
```

### 3. Public Contact Service

**Location**: `resources/public/js/services/contactService.ts`

```typescript
import axios from 'axios';

export interface ContactFormData {
  name: string;
  email: string;
  reason: string;
  message: string;
  source: 'public';
}

export const contactService = {
  async submit(data: ContactFormData): Promise<void> {
    await axios.post('/api/contact', {
      name: data.name,
      email: data.email,
      reason: data.reason,
      message: data.message,
      source: data.source,
    });
  },
};
```

### 4. Copy useContactForm Composable

**Location**: `resources/public/js/composables/useContactForm.ts`

Copy the same composable from the app dashboard with `requireUserInfo = true` by default.

### 5. Copy useGtm Composable

**Location**: `resources/public/js/composables/useGtm.ts`

Copy the GTM composable from the app dashboard if not already present.

---

## Admin Dashboard Implementation

### Agent: `dev-fe-admin`

### 1. Notifications View

**Location**: `resources/admin/js/views/NotificationsView.vue`

```vue
<template>
  <div class="notifications-view">
    <PageHeader title="Notification History" />

    <!-- Filters -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Type Filter -->
          <div>
            <label class="block text-sm font-medium mb-1">Type</label>
            <Select
              v-model="filters.type"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              placeholder="All Types"
              class="w-full"
              show-clear
              @change="loadNotifications"
            />
          </div>

          <!-- Channel Filter -->
          <div>
            <label class="block text-sm font-medium mb-1">Channel</label>
            <Select
              v-model="filters.channel"
              :options="channelOptions"
              option-label="label"
              option-value="value"
              placeholder="All Channels"
              class="w-full"
              show-clear
              @change="loadNotifications"
            />
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium mb-1">Status</label>
            <Select
              v-model="filters.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="All Statuses"
              class="w-full"
              show-clear
              @change="loadNotifications"
            />
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium mb-1">Date Range</label>
            <Calendar
              v-model="filters.dateRange"
              selection-mode="range"
              placeholder="Select dates"
              class="w-full"
              date-format="yy-mm-dd"
              show-icon
              @date-select="loadNotifications"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Data Table -->
    <Card>
      <template #content>
        <DataTable
          :value="notifications"
          :loading="isLoading"
          :paginator="true"
          :rows="20"
          :total-records="totalRecords"
          :lazy="true"
          data-key="id"
          striped-rows
          @page="onPageChange"
        >
          <Column field="notification_type" header="Type" sortable>
            <template #body="{ data }">
              <Tag :value="data.notification_type" :severity="getTypeSeverity(data.notification_type)" />
            </template>
          </Column>

          <Column field="channel" header="Channel" sortable>
            <template #body="{ data }">
              <span class="flex items-center gap-2">
                <i :class="getChannelIcon(data.channel)" />
                {{ data.channel }}
              </span>
            </template>
          </Column>

          <Column field="recipient" header="Recipient" />

          <Column field="subject" header="Subject" />

          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>

          <Column field="sent_at" header="Sent At" sortable>
            <template #body="{ data }">
              {{ formatDate(data.sent_at) }}
            </template>
          </Column>

          <Column header="Actions" style="width: 100px">
            <template #body="{ data }">
              <Button
                icon="pi pi-eye"
                severity="secondary"
                text
                rounded
                @click="viewNotification(data)"
              />
            </template>
          </Column>

          <template #empty>
            <div class="text-center py-8 text-gray-500">
              No notifications found
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- Detail Dialog -->
    <NotificationDetailDialog
      v-model:visible="detailDialogVisible"
      :notification="selectedNotification"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import PageHeader from '@admin/components/common/PageHeader.vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import NotificationDetailDialog from '@admin/components/notifications/NotificationDetailDialog.vue';
import { notificationService } from '@admin/services/notificationService';
import { formatDate } from '@admin/utils/dateUtils';

interface NotificationLog {
  id: number;
  notification_type: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  metadata: Record<string, unknown>;
}

const notifications = ref<NotificationLog[]>([]);
const isLoading = ref(false);
const totalRecords = ref(0);
const currentPage = ref(1);

const filters = reactive({
  type: null as string | null,
  channel: null as string | null,
  status: null as string | null,
  dateRange: null as Date[] | null,
});

const typeOptions = [
  { label: 'Contact', value: 'contact' },
  { label: 'Registration', value: 'registration' },
  { label: 'Email Verification', value: 'email_verification' },
  { label: 'Password Reset', value: 'password_reset' },
  { label: 'System', value: 'system' },
];

const channelOptions = [
  { label: 'Email', value: 'email' },
  { label: 'Discord', value: 'discord' },
];

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Failed', value: 'failed' },
];

const detailDialogVisible = ref(false);
const selectedNotification = ref<NotificationLog | null>(null);

async function loadNotifications() {
  isLoading.value = true;
  try {
    const response = await notificationService.getAll({
      page: currentPage.value,
      per_page: 20,
      type: filters.type,
      channel: filters.channel,
      status: filters.status,
      date_from: filters.dateRange?.[0]?.toISOString(),
      date_to: filters.dateRange?.[1]?.toISOString(),
    });
    notifications.value = response.data;
    totalRecords.value = response.meta.total;
  } finally {
    isLoading.value = false;
  }
}

function onPageChange(event: { page: number }) {
  currentPage.value = event.page + 1;
  loadNotifications();
}

function viewNotification(notification: NotificationLog) {
  selectedNotification.value = notification;
  detailDialogVisible.value = true;
}

function getTypeSeverity(type: string): string {
  const map: Record<string, string> = {
    contact: 'info',
    registration: 'success',
    email_verification: 'warning',
    password_reset: 'warning',
    system: 'secondary',
  };
  return map[type] || 'secondary';
}

function getChannelIcon(channel: string): string {
  return channel === 'email' ? 'pi pi-envelope' : 'pi pi-discord';
}

function getStatusSeverity(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    sent: 'success',
    failed: 'danger',
  };
  return map[status] || 'secondary';
}

onMounted(() => {
  loadNotifications();
});
</script>
```

### 2. Notification Detail Dialog

**Location**: `resources/admin/js/components/notifications/NotificationDetailDialog.vue`

```vue
<template>
  <Dialog
    v-model:visible="isVisible"
    header="Notification Details"
    :style="{ width: '600px' }"
    modal
    :closable="true"
  >
    <div v-if="notification" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-gray-500">Type</label>
          <p class="font-medium">{{ notification.notification_type }}</p>
        </div>
        <div>
          <label class="text-sm text-gray-500">Channel</label>
          <p class="font-medium capitalize">{{ notification.channel }}</p>
        </div>
        <div>
          <label class="text-sm text-gray-500">Recipient</label>
          <p class="font-medium">{{ notification.recipient || 'N/A' }}</p>
        </div>
        <div>
          <label class="text-sm text-gray-500">Status</label>
          <Tag :value="notification.status" :severity="getStatusSeverity(notification.status)" />
        </div>
        <div>
          <label class="text-sm text-gray-500">Sent At</label>
          <p class="font-medium">{{ formatDateTime(notification.sent_at) }}</p>
        </div>
      </div>

      <Divider />

      <div v-if="notification.subject">
        <label class="text-sm text-gray-500">Subject</label>
        <p class="font-medium">{{ notification.subject }}</p>
      </div>

      <div v-if="notification.body">
        <label class="text-sm text-gray-500">Message</label>
        <div class="bg-gray-50 p-3 rounded-md mt-1 whitespace-pre-wrap text-sm">
          {{ notification.body }}
        </div>
      </div>

      <div v-if="notification.error_message">
        <label class="text-sm text-gray-500">Error</label>
        <div class="bg-red-50 text-red-700 p-3 rounded-md mt-1 text-sm">
          {{ notification.error_message }}
        </div>
      </div>

      <div v-if="notification.metadata && Object.keys(notification.metadata).length">
        <label class="text-sm text-gray-500">Metadata</label>
        <pre class="bg-gray-50 p-3 rounded-md mt-1 text-xs overflow-auto">{{ JSON.stringify(notification.metadata, null, 2) }}</pre>
      </div>
    </div>

    <template #footer>
      <Button label="Close" @click="isVisible = false" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import { formatDateTime } from '@admin/utils/dateUtils';

interface NotificationLog {
  id: number;
  notification_type: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  metadata: Record<string, unknown>;
}

const props = defineProps<{
  visible: boolean;
  notification: NotificationLog | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

function getStatusSeverity(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    sent: 'success',
    failed: 'danger',
  };
  return map[status] || 'secondary';
}
</script>
```

### 3. Contacts View

**Location**: `resources/admin/js/views/ContactsView.vue`

Similar structure to NotificationsView but for managing contact submissions:
- List all contacts with status badges
- View contact details
- Mark as read/responded/archived
- Filter by status, source, date

### 4. Notification Service

**Location**: `resources/admin/js/services/notificationService.ts`

```typescript
import api from '@admin/services/api';

interface NotificationFilters {
  page?: number;
  per_page?: number;
  type?: string | null;
  channel?: string | null;
  status?: string | null;
  date_from?: string | null;
  date_to?: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface NotificationLog {
  id: number;
  notification_type: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  metadata: Record<string, unknown>;
}

export const notificationService = {
  async getAll(filters: NotificationFilters): Promise<PaginatedResponse<NotificationLog>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) {
        params.append(key, String(value));
      }
    });

    const response = await api.get<PaginatedResponse<NotificationLog>>(
      `/admin/api/notifications?${params.toString()}`
    );
    return response.data;
  },

  async getById(id: number): Promise<NotificationLog> {
    const response = await api.get<NotificationLog>(`/admin/api/notifications/${id}`);
    return response.data;
  },
};
```

### 5. Contact Service (Admin)

**Location**: `resources/admin/js/services/contactService.ts`

```typescript
import api from '@admin/services/api';

export const contactService = {
  async getAll(filters): Promise<PaginatedResponse<Contact>> { /* ... */ },
  async getById(id: number): Promise<Contact> { /* ... */ },
  async markRead(id: number): Promise<Contact> { /* ... */ },
  async markResponded(id: number): Promise<Contact> { /* ... */ },
  async archive(id: number): Promise<void> { /* ... */ },
};
```

### 6. Router Updates

**Location**: Update `resources/admin/js/router/index.ts`

```typescript
// Add to children routes
{
  path: 'notifications',
  name: 'notifications',
  component: () => import('@admin/views/NotificationsView.vue'),
  meta: {
    title: 'Notification History',
    breadcrumb: [{ label: 'System' }, { label: 'Notifications' }],
    requiresAuth: true,
    requiredRole: 'admin' as AdminRole,
  },
},
{
  path: 'contacts',
  name: 'contacts',
  component: () => import('@admin/views/ContactsView.vue'),
  meta: {
    title: 'Contact Submissions',
    breadcrumb: [{ label: 'System' }, { label: 'Contacts' }],
    requiresAuth: true,
    requiredRole: 'admin' as AdminRole,
  },
},
```

### 7. Sidebar Updates

Add navigation items for Notifications and Contacts to the admin sidebar.

---

## Shared Components & Composables

### Components to Create/Copy

| Component | App Location | Public Location | Notes |
|-----------|--------------|-----------------|-------|
| ContactModal | `components/contact/ContactModal.vue` | N/A | App-specific with CC option |
| PublicContactModal | N/A | `components/contact/PublicContactModal.vue` | Public-specific with user info |
| ContactFloatingButton | `components/contact/ContactFloatingButton.vue` | N/A | App only |

### Composables to Create/Copy

| Composable | App Location | Public Location | Admin Location |
|------------|--------------|-----------------|----------------|
| useContactForm | `composables/useContactForm.ts` | `composables/useContactForm.ts` | N/A |
| useGtm | Already exists | Copy from app | Already exists |

### Services to Create

| Service | App Location | Public Location | Admin Location |
|---------|--------------|-----------------|----------------|
| contactService | `services/contactService.ts` | `services/contactService.ts` | `services/contactService.ts` |
| notificationService | N/A | N/A | `services/notificationService.ts` |

---

## GTM Event Tracking

### Events to Track

| Event Name | Trigger | Data |
|------------|---------|------|
| `contact_form_open` | Modal opens | `{ source: 'app' \| 'public' }` |
| `contact_form_submit` | Form submitted | `{ source, reason, cc_user? }` |
| `user_registered` | Registration complete | `{ method: 'email' }` |
| `password_reset_requested` | Reset email sent | `{}` |

### Implementation

Use existing `useGtm` composable:

```typescript
const { trackEvent, trackFormSubmit } = useGtm();

// When modal opens
trackEvent('contact_form_open', { source: 'app' });

// When form submits
trackFormSubmit('contact_form', 'submit', {
  source: 'app',
  reason: form.reason,
  cc_user: form.ccUser,
});
```

---

## Implementation Checklist

### App Dashboard (`dev-fe-app`)

- [ ] Create `ContactFloatingButton.vue` component
- [ ] Create `ContactModal.vue` component
- [ ] Create `useContactForm.ts` composable
- [ ] Create `contactService.ts` service
- [ ] Add `ContactFloatingButton` to `AppLayout.vue`
- [ ] Add GTM event tracking
- [ ] Write unit tests for composable
- [ ] Write component tests

### Public Site (`dev-fe-public`)

- [ ] Update `PublicFooter.vue` with contact link
- [ ] Create `PublicContactModal.vue` component
- [ ] Create/copy `useContactForm.ts` composable
- [ ] Create `contactService.ts` service
- [ ] Copy/create `useGtm.ts` if not exists
- [ ] Add Toast component to layout if not present
- [ ] Add GTM event tracking
- [ ] Write unit tests
- [ ] Write component tests

### Admin Dashboard (`dev-fe-admin`)

- [ ] Create `NotificationsView.vue` view
- [ ] Create `NotificationDetailDialog.vue` component
- [ ] Create `ContactsView.vue` view
- [ ] Create `ContactDetailDialog.vue` component
- [ ] Create `notificationService.ts` service
- [ ] Create `contactService.ts` service (admin version)
- [ ] Update router with new routes
- [ ] Update sidebar navigation
- [ ] Write component tests

---

## Agent Assignment Summary

| Application | Agent | Key Tasks |
|-------------|-------|-----------|
| App Dashboard | `dev-fe-app` | Floating button, contact modal, GTM tracking |
| Public Site | `dev-fe-public` | Footer link, contact modal, GTM tracking |
| Admin Dashboard | `dev-fe-admin` | Notifications view, contacts view, management UI |
