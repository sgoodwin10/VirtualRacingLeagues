<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :closable="true"
    :style="{ width: '700px' }"
    :draggable="false"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <i class="pi pi-envelope text-blue-600 text-xl"></i>
        <span class="font-semibold text-lg">Contact Submission Details</span>
      </div>
    </template>

    <div v-if="contact" class="space-y-6">
      <!-- Status and Source -->
      <div class="flex items-center gap-3 pb-4 border-b border-gray-200">
        <Tag :value="contact.status" :severity="getStatusSeverity(contact.status)" />
        <Tag
          :value="contact.source"
          :severity="contact.source === 'app' ? 'info' : 'secondary'"
          class="capitalize"
        />
        <Tag
          :value="formatReasonLabel(contact.reason)"
          :severity="getReasonSeverity(contact.reason)"
        />
      </div>

      <!-- Contact Information Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Name</label>
          <p class="font-medium text-gray-900">{{ contact.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Email</label>
          <a
            :href="`mailto:${contact.email}`"
            class="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {{ contact.email }}
          </a>
        </div>

        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-600 mb-1">Submitted</label>
          <p class="text-gray-900">{{ formatDateTime(contact.created_at) }}</p>
        </div>
      </div>

      <Divider />

      <!-- Message Section -->
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-2">Message</label>
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
          <p class="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
            {{ contact.message }}
          </p>
        </div>
      </div>

      <!-- Additional Options -->
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <i :class="contact.cc_user ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ contact.cc_user ? 'User requested a copy' : 'No copy requested' }}</span>
      </div>

      <!-- Metadata Section -->
      <div v-if="contact.metadata && Object.keys(contact.metadata).length > 0">
        <label class="block text-sm font-medium text-gray-600 mb-2">Additional Information</label>
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
          <pre class="text-xs font-mono text-gray-700 whitespace-pre-wrap">{{
            JSON.stringify(contact.metadata, null, 2)
          }}</pre>
        </div>
      </div>

      <!-- Timestamps Section -->
      <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Created</label>
          <p class="text-sm text-gray-700">{{ formatDateTime(contact.created_at) }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Updated</label>
          <p class="text-sm text-gray-700">{{ formatDateTime(contact.updated_at) }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <!-- Action Buttons -->
        <div class="flex gap-2">
          <Button
            v-if="contact && contact.status === 'new'"
            label="Mark as Read"
            icon="pi pi-check"
            severity="info"
            size="small"
            :loading="isUpdating"
            @click="handleMarkRead"
          />
          <Button
            v-if="contact && contact.status === 'read'"
            label="Mark as Responded"
            icon="pi pi-reply"
            severity="success"
            size="small"
            :loading="isUpdating"
            @click="handleMarkResponded"
          />
          <Button
            v-if="contact && contact.status !== 'archived'"
            label="Archive"
            icon="pi pi-inbox"
            severity="secondary"
            size="small"
            :loading="isUpdating"
            @click="handleArchive"
          />
        </div>

        <!-- Close Button -->
        <Button label="Close" severity="secondary" size="small" @click="handleClose" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { useErrorToast } from '@admin/composables/useErrorToast';
import { contactService } from '@admin/services/contactService';
import type { Contact } from '@admin/types/contact';

interface Props {
  visible: boolean;
  contact: Contact | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  refresh: [];
}>();

// Composables
const { formatDate: formatDateTime } = useDateFormatter();
const { showErrorToast, showSuccessToast } = useErrorToast();

// State
const isUpdating = ref(false);

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

/**
 * Format reason for display
 */
const formatReasonLabel = (reason: string): string => {
  return reason.charAt(0).toUpperCase() + reason.slice(1);
};

/**
 * Get severity color for reason
 */
const getReasonSeverity = (reason: string): string => {
  const severityMap: Record<string, string> = {
    error: 'danger',
    question: 'info',
    help: 'warn',
    other: 'secondary',
  };
  return severityMap[reason] || 'secondary';
};

/**
 * Get severity color for status
 */
const getStatusSeverity = (status: string): string => {
  const severityMap: Record<string, string> = {
    new: 'warn',
    read: 'info',
    responded: 'success',
    archived: 'secondary',
  };
  return severityMap[status] || 'secondary';
};

/**
 * Mark contact as read
 */
const handleMarkRead = async (): Promise<void> => {
  if (!props.contact) return;

  isUpdating.value = true;
  try {
    await contactService.markRead(props.contact.id);
    showSuccessToast('Contact marked as read');
    emit('refresh');
    handleClose();
  } catch (error) {
    showErrorToast(error, 'Failed to mark contact as read');
  } finally {
    isUpdating.value = false;
  }
};

/**
 * Mark contact as responded
 */
const handleMarkResponded = async (): Promise<void> => {
  if (!props.contact) return;

  isUpdating.value = true;
  try {
    await contactService.markResponded(props.contact.id);
    showSuccessToast('Contact marked as responded');
    emit('refresh');
    handleClose();
  } catch (error) {
    showErrorToast(error, 'Failed to mark contact as responded');
  } finally {
    isUpdating.value = false;
  }
};

/**
 * Archive contact
 */
const handleArchive = async (): Promise<void> => {
  if (!props.contact) return;

  isUpdating.value = true;
  try {
    await contactService.archive(props.contact.id);
    showSuccessToast('Contact archived');
    emit('refresh');
    handleClose();
  } catch (error) {
    showErrorToast(error, 'Failed to archive contact');
  } finally {
    isUpdating.value = false;
  }
};

/**
 * Handle dialog close
 */
const handleClose = (): void => {
  isVisible.value = false;
};
</script>

<style scoped>
/* ContactDetailDialog specific styles */
</style>
