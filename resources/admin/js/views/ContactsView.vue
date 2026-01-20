<template>
  <div class="contacts-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Contact Submissions</h1>
      <p class="text-gray-600">Manage contact form submissions from users</p>
    </div>

    <!-- Initial Loading Skeleton -->
    <div v-if="initialLoading" class="space-y-6">
      <Card>
        <template #content>
          <Skeleton height="4rem" />
        </template>
      </Card>
      <Card>
        <template #content>
          <Skeleton height="20rem" />
        </template>
      </Card>
    </div>

    <!-- Main Content (after initial load) -->
    <div v-else>
      <!-- Filters Card -->
      <Card class="mb-6">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                v-model="filters.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="All Statuses"
                class="w-full"
                show-clear
                @change="loadContacts"
              />
            </div>

            <!-- Source Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <Select
                v-model="filters.source"
                :options="sourceOptions"
                option-label="label"
                option-value="value"
                placeholder="All Sources"
                class="w-full"
                show-clear
                @change="loadContacts"
              />
            </div>

            <!-- Date Range -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <DatePicker
                v-model="filters.dateRange"
                selection-mode="range"
                placeholder="Select dates"
                class="w-full"
                date-format="yy-mm-dd"
                show-icon
                icon="pi pi-calendar"
                @date-select="handleDateSelect"
              />
            </div>

            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <InputText v-model="searchQuery" placeholder="Search contacts..." class="w-full" />
            </div>
          </div>
        </template>
      </Card>

      <!-- Data Table Card -->
      <Card :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }">
        <template #content>
          <DataTable
            :value="contacts"
            :loading="loading"
            :paginator="true"
            :rows="20"
            :total-records="totalRecords"
            :lazy="true"
            data-key="id"
            striped-rows
            paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rows-per-page-options="[10, 20, 50]"
            current-page-report-template="Showing {first} to {last} of {totalRecords} contacts"
            @page="onPageChange"
          >
            <Column field="name" header="Name" sortable style="min-width: 180px">
              <template #body="{ data }">
                <span class="font-medium text-gray-900">{{ data.name }}</span>
              </template>
            </Column>

            <Column field="email" header="Email" sortable style="min-width: 220px">
              <template #body="{ data }">
                <span class="text-sm">{{ data.email }}</span>
              </template>
            </Column>

            <Column field="reason" header="Reason" sortable style="min-width: 140px">
              <template #body="{ data }">
                <Tag
                  :value="formatReasonLabel(data.reason)"
                  :severity="getReasonSeverity(data.reason)"
                />
              </template>
            </Column>

            <Column field="source" header="Source" sortable style="min-width: 100px">
              <template #body="{ data }">
                <Tag
                  :value="data.source"
                  :severity="data.source === 'app' ? 'info' : 'secondary'"
                  class="capitalize"
                />
              </template>
            </Column>

            <Column field="status" header="Status" sortable style="min-width: 120px">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
              </template>
            </Column>

            <Column field="created_at" header="Created At" sortable style="min-width: 180px">
              <template #body="{ data }">
                <span class="text-sm">{{ formatDate(data.created_at) }}</span>
              </template>
            </Column>

            <Column header="Actions" style="width: 200px">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button
                    v-tooltip.top="'View Details'"
                    icon="pi pi-eye"
                    severity="secondary"
                    text
                    rounded
                    @click="viewContact(data)"
                  />
                  <Button
                    v-if="data.status === 'new'"
                    v-tooltip.top="'Mark as Read'"
                    icon="pi pi-check"
                    severity="info"
                    text
                    rounded
                    @click="handleMarkRead(data)"
                  />
                  <Button
                    v-if="data.status === 'read'"
                    v-tooltip.top="'Mark as Responded'"
                    icon="pi pi-reply"
                    severity="success"
                    text
                    rounded
                    @click="handleMarkResponded(data)"
                  />
                  <Button
                    v-if="data.status !== 'archived'"
                    v-tooltip.top="'Archive'"
                    icon="pi pi-inbox"
                    severity="secondary"
                    text
                    rounded
                    @click="handleArchive(data)"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="text-center py-8 text-gray-500">
                <i class="pi pi-inbox text-4xl mb-3 block"></i>
                <p>No contact submissions found</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Detail Dialog -->
    <ContactDetailDialog
      v-model:visible="detailDialogVisible"
      :contact="selectedContact"
      @refresh="loadContacts"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Skeleton from 'primevue/skeleton';
import Toast from 'primevue/toast';
import ContactDetailDialog from '@admin/components/contacts/ContactDetailDialog.vue';
import { contactService } from '@admin/services/contactService';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { useErrorToast } from '@admin/composables/useErrorToast';
import type {
  Contact,
  ContactStatus,
  ContactSource,
  ContactStatusOption,
  ContactSourceOption,
} from '@admin/types/contact';

// Composables
const { formatDate } = useDateFormatter();
const { showErrorToast, showSuccessToast } = useErrorToast();

// State
const contacts = ref<Contact[]>([]);
const loading = ref(false);
const initialLoading = ref(true);
const totalRecords = ref(0);
const currentPage = ref(1);
const searchQuery = ref('');

// Filters
const filters = reactive({
  status: null as ContactStatus | null,
  source: null as ContactSource | null,
  dateRange: null as Date[] | null,
});

// Filter options
const statusOptions: ContactStatusOption[] = [
  { label: 'New', value: 'new' },
  { label: 'Read', value: 'read' },
  { label: 'Responded', value: 'responded' },
  { label: 'Archived', value: 'archived' },
];

const sourceOptions: ContactSourceOption[] = [
  { label: 'App', value: 'app' },
  { label: 'Public', value: 'public' },
];

// Modal state
const detailDialogVisible = ref(false);
const selectedContact = ref<Contact | null>(null);

/**
 * Load contacts from API
 */
const loadContacts = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await contactService.getAll({
      page: currentPage.value,
      per_page: 20,
      status: filters.status,
      source: filters.source,
      date_from: filters.dateRange?.[0]?.toISOString().split('T')[0],
      date_to: filters.dateRange?.[1]?.toISOString().split('T')[0],
      search: searchQuery.value.trim() || null,
    });

    contacts.value = response.data;
    totalRecords.value = response.total;
  } catch (error) {
    showErrorToast(error, 'Failed to load contacts');
  } finally {
    loading.value = false;
  }
};

/**
 * Debounced load for search
 */
const debouncedLoadContacts = useDebounceFn(() => {
  currentPage.value = 1; // Reset to first page on search
  loadContacts();
}, 500);

/**
 * Watch search query changes
 */
watch(searchQuery, () => {
  debouncedLoadContacts();
});

/**
 * Handle page change event
 */
const onPageChange = (event: { page: number }): void => {
  currentPage.value = event.page + 1;
  loadContacts();
};

/**
 * Handle date range selection
 */
const handleDateSelect = (): void => {
  // Only load when both dates are selected
  if (filters.dateRange && filters.dateRange.length === 2 && filters.dateRange[1]) {
    loadContacts();
  }
};

/**
 * View contact details
 */
const viewContact = (contact: Contact): void => {
  selectedContact.value = contact;
  detailDialogVisible.value = true;
};

/**
 * Mark contact as read
 */
const handleMarkRead = async (contact: Contact): Promise<void> => {
  try {
    await contactService.markRead(contact.id);
    showSuccessToast('Contact marked as read');
    await loadContacts();
  } catch (error) {
    showErrorToast(error, 'Failed to mark contact as read');
  }
};

/**
 * Mark contact as responded
 */
const handleMarkResponded = async (contact: Contact): Promise<void> => {
  try {
    await contactService.markResponded(contact.id);
    showSuccessToast('Contact marked as responded');
    await loadContacts();
  } catch (error) {
    showErrorToast(error, 'Failed to mark contact as responded');
  }
};

/**
 * Archive contact
 */
const handleArchive = async (contact: Contact): Promise<void> => {
  try {
    await contactService.archive(contact.id);
    showSuccessToast('Contact archived');
    await loadContacts();
  } catch (error) {
    showErrorToast(error, 'Failed to archive contact');
  }
};

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

// Load data on mount
onMounted(async () => {
  await loadContacts();
  initialLoading.value = false;
});
</script>

<style scoped>
/* ContactsView specific styles */
</style>
