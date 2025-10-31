# Frontend Implementation Guide - Platform-Based Driver Management

## Overview

This guide details the frontend implementation for dynamic platform-based driver management. Components dynamically render fields and columns based on a league's selected platforms using configuration fetched from the backend.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Views (LeagueDetail.vue)                                   │
│  - Fetches configurations on mount                          │
│  - Passes configs to child components                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Store (leagueStore.ts)                                     │
│  - Calls backend APIs                                       │
│  - Caches platform configurations                           │
│  - Exposes computed properties                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Components                                                 │
│  - DriverTable.vue: Dynamic columns via v-for               │
│  - DriverFormDialog.vue: Dynamic fields via v-for           │
│  - CSVImportDialog.vue: Dynamic headers & validation        │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
resources/app/js/
├── config/
│   └── platformColumnMapping.ts       # Platform-to-field mappings (fallback)
├── types/
│   ├── datatable.ts                   # Column/field config interfaces
│   ├── driver.ts                      # Driver interface
│   └── league.ts                      # League/Platform interfaces
├── stores/
│   └── leagueStore.ts                 # State management for platform configs
├── components/
│   └── driver/
│       ├── DriverTable.vue            # Dynamic DataTable
│       ├── DriverFormDialog.vue       # Dynamic Create/Edit form
│       ├── CSVImportDialog.vue        # Dynamic CSV import
│       └── __tests__/
│           ├── DriverTable.spec.ts
│           ├── DriverFormDialog.spec.ts
│           └── CSVImportDialog.spec.ts
└── views/
    └── LeagueDetail.vue               # Parent view (fetches configs)
```

---

## TypeScript Types

### `resources/app/js/types/datatable.ts` (NEW)

```typescript
export interface DriverColumnConfig {
  field: string;
  label: string;
  type: 'text' | 'number';
  sortable: boolean;
  filterable: boolean;
}

export interface DriverFormFieldConfig {
  field: string;
  label: string;
  type: 'text' | 'number';
  placeholder?: string;
  helpText?: string;
  validationRules?: string;
  required?: boolean;
}
```

### `resources/app/js/types/driver.ts` (UPDATE)

Ensure the Driver interface includes all platform fields:

```typescript
export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  driver_number: string | null;

  // Platform identifiers
  psn_id: string | null;
  gt7_id: string | null;
  iracing_id: string | null;
  iracing_customer_id: number | null;

  // Future platform fields...
  // acc_id: string | null;
  // rfactor2_id: string | null;

  created_at: string;
  updated_at: string;
}
```

---

## Config: Platform Column Mapping

### `resources/app/js/config/platformColumnMapping.ts` (NEW)

**Purpose**: Provides fallback mapping and type safety for platform fields.

```typescript
import type { Driver } from '@app/types/driver';

export interface PlatformFieldMapping {
  slug: string; // Matches Platform.slug from backend
  driverFieldKey: keyof Driver;
  label: string;
  type: 'text' | 'number';
  placeholder?: string;
  helpText?: string;
}

/**
 * Maps platform slugs to driver field keys.
 * Used as fallback if backend configuration is unavailable.
 */
export const PLATFORM_FIELD_MAPPINGS: PlatformFieldMapping[] = [
  {
    slug: 'gran-turismo-7',
    driverFieldKey: 'psn_id',
    label: 'PSN ID',
    type: 'text',
    placeholder: 'Enter PSN ID',
    helpText: 'PlayStation Network ID',
  },
  {
    slug: 'gran-turismo-7',
    driverFieldKey: 'gt7_id',
    label: 'GT7 ID',
    type: 'text',
    placeholder: 'Enter GT7 ID',
    helpText: 'Gran Turismo 7 Player ID',
  },
  {
    slug: 'iracing',
    driverFieldKey: 'iracing_id',
    label: 'iRacing ID',
    type: 'text',
    placeholder: 'Enter iRacing ID',
    helpText: 'iRacing Username',
  },
  {
    slug: 'iracing',
    driverFieldKey: 'iracing_customer_id',
    label: 'iRacing Customer ID',
    type: 'number',
    placeholder: 'Enter Customer ID',
    helpText: 'Numeric iRacing Customer ID',
  },
  // Add more as platforms are supported...
];

/**
 * Get field mappings for a specific platform slug.
 */
export function getFieldsForPlatform(platformSlug: string): PlatformFieldMapping[] {
  return PLATFORM_FIELD_MAPPINGS.filter((mapping) => mapping.slug === platformSlug);
}

/**
 * Get field mappings for multiple platforms.
 */
export function getFieldsForPlatforms(platformSlugs: string[]): PlatformFieldMapping[] {
  const slugSet = new Set(platformSlugs.map((s) => s.toLowerCase()));
  return PLATFORM_FIELD_MAPPINGS.filter((mapping) => slugSet.has(mapping.slug.toLowerCase()));
}
```

---

## Store: League Store

### `resources/app/js/stores/leagueStore.ts` (UPDATE)

**Changes**:
1. Add state for platform configurations
2. Add actions to fetch configurations from backend
3. Add computed property for current league platforms

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { League, Platform } from '@app/types/league';
import type { DriverColumnConfig, DriverFormFieldConfig } from '@app/types/datatable';
import { leagueService } from '@app/services/leagueService';
import { useErrorToast } from '@app/composables/useErrorToast';

export const useLeagueStore = defineStore('league', () => {
  // Existing state
  const leagues = ref<League[]>([]);
  const currentLeague = ref<League | null>(null);
  const platforms = ref<Platform[]>([]);
  const timezones = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // NEW: Platform configuration state
  const platformColumns = ref<DriverColumnConfig[]>([]);
  const platformFormFields = ref<DriverFormFieldConfig[]>([]);
  const platformCsvHeaders = ref<string[]>([]);

  const { showError } = useErrorToast();

  // Existing computed
  const leagueCount = computed(() => leagues.value.length);

  // NEW: Computed property for current league platforms
  const currentLeaguePlatforms = computed(() => {
    return currentLeague.value?.platforms ?? [];
  });

  // Existing actions
  // ... fetchLeagues, createLeague, etc.

  // NEW: Fetch platform column configuration
  async function fetchPlatformColumns(leagueId: number): Promise<void> {
    try {
      const response = await leagueService.getDriverColumns(leagueId);
      platformColumns.value = response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch driver columns';
      showError(message);
      platformColumns.value = [];
    }
  }

  // NEW: Fetch platform form field configuration
  async function fetchPlatformFormFields(leagueId: number): Promise<void> {
    try {
      const response = await leagueService.getDriverFormFields(leagueId);
      platformFormFields.value = response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch form fields';
      showError(message);
      platformFormFields.value = [];
    }
  }

  // NEW: Fetch CSV template (triggers download)
  async function fetchCsvTemplate(leagueId: number): Promise<void> {
    try {
      const blob = await leagueService.downloadCsvTemplate(leagueId);

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `driver-template-league-${leagueId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to download CSV template';
      showError(message);
    }
  }

  return {
    // Existing
    leagues,
    currentLeague,
    platforms,
    timezones,
    loading,
    error,
    leagueCount,

    // NEW
    platformColumns,
    platformFormFields,
    platformCsvHeaders,
    currentLeaguePlatforms,
    fetchPlatformColumns,
    fetchPlatformFormFields,
    fetchCsvTemplate,

    // Existing actions...
  };
});
```

---

## Service: League Service

### `resources/app/js/services/leagueService.ts` (UPDATE)

Add new API methods:

```typescript
import api from './api';
import type { DriverColumnConfig, DriverFormFieldConfig } from '@app/types/datatable';

export const leagueService = {
  // Existing methods...

  /**
   * Get driver column configuration for a league's DataTable.
   */
  async getDriverColumns(leagueId: number): Promise<{ data: DriverColumnConfig[] }> {
    const response = await api.get(`/leagues/${leagueId}/driver-columns`);
    return response.data;
  },

  /**
   * Get driver form field configuration for Create/Edit forms.
   */
  async getDriverFormFields(leagueId: number): Promise<{ data: DriverFormFieldConfig[] }> {
    const response = await api.get(`/leagues/${leagueId}/driver-form-fields`);
    return response.data;
  },

  /**
   * Download CSV template with dynamic headers.
   */
  async downloadCsvTemplate(leagueId: number): Promise<Blob> {
    const response = await api.get(`/leagues/${leagueId}/drivers/csv-template`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
```

---

## Component: DriverTable

### `resources/app/js/components/driver/DriverTable.vue` (UPDATE)

**Changes**:
1. Remove hardcoded platform column logic
2. Accept `platformColumns` prop
3. Use `v-for` to render dynamic columns

```vue
<script setup lang="ts">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import type { Driver } from '@app/types/driver';
import type { DriverColumnConfig } from '@app/types/datatable';

interface Props {
  drivers: Driver[];
  loading?: boolean;
  platformColumns?: DriverColumnConfig[]; // NEW
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  platformColumns: () => [],
});

const emit = defineEmits<{
  edit: [driver: Driver];
  delete: [driver: Driver];
}>();

// REMOVED: Old hardcoded platform detection
// const hasPlatform = computed(() => { ... });
</script>

<template>
  <DataTable
    :value="drivers"
    :loading="loading"
    stripedRows
    paginator
    :rows="10"
    dataKey="id"
    responsiveLayout="scroll"
  >
    <!-- Base columns (hardcoded) -->
    <Column field="driver_number" header="#" sortable />

    <Column field="first_name" header="First Name" sortable />

    <Column field="last_name" header="Last Name" sortable />

    <Column field="email" header="Email" sortable />

    <!-- Dynamic platform columns (NEW) -->
    <Column
      v-for="col in platformColumns"
      :key="col.field"
      :field="col.field"
      :header="col.label"
      :sortable="col.sortable"
    >
      <template #body="{ data }">
        <span>{{ data[col.field] || '-' }}</span>
      </template>
    </Column>

    <!-- Actions column -->
    <Column header="Actions" :exportable="false">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            icon="pi pi-pencil"
            size="small"
            outlined
            @click="emit('edit', data)"
          />
          <Button
            icon="pi pi-trash"
            size="small"
            outlined
            severity="danger"
            @click="emit('delete', data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
```

---

## Component: DriverFormDialog

### `resources/app/js/components/driver/DriverFormDialog.vue` (UPDATE)

**Changes**:
1. Accept `platformFormFields` prop
2. Use `v-for` to render dynamic platform fields
3. Initialize form data based on fields

```vue
<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import type { Driver } from '@app/types/driver';
import type { DriverFormFieldConfig } from '@app/types/datatable';

interface Props {
  visible: boolean;
  driver?: Driver | null;
  loading?: boolean;
  platformFormFields?: DriverFormFieldConfig[]; // NEW
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  driver: null,
  loading: false,
  platformFormFields: () => [],
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [data: Partial<Driver>];
}>();

const formData = ref<Partial<Driver>>({});

const isEditMode = computed(() => !!props.driver);

const dialogTitle = computed(() => (isEditMode.value ? 'Edit Driver' : 'Add Driver'));

// Initialize form data when dialog opens or driver changes
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.driver) {
        formData.value = { ...props.driver };
      } else {
        formData.value = {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          driver_number: '',
        };

        // Initialize platform fields dynamically
        props.platformFormFields.forEach((field) => {
          formData.value[field.field as keyof Driver] = null;
        });
      }
    }
  },
  { immediate: true }
);

function handleSave() {
  emit('save', formData.value);
}

function handleCancel() {
  emit('update:visible', false);
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="dialogTitle"
    modal
    :style="{ width: '600px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <form @submit.prevent="handleSave" class="flex flex-col gap-4">
      <!-- Base fields (hardcoded) -->
      <div class="field">
        <label for="first_name" class="font-semibold">First Name *</label>
        <InputText
          id="first_name"
          v-model="formData.first_name"
          required
          class="w-full"
          placeholder="Enter first name"
        />
      </div>

      <div class="field">
        <label for="last_name" class="font-semibold">Last Name *</label>
        <InputText
          id="last_name"
          v-model="formData.last_name"
          required
          class="w-full"
          placeholder="Enter last name"
        />
      </div>

      <div class="field">
        <label for="email" class="font-semibold">Email</label>
        <InputText
          id="email"
          v-model="formData.email"
          type="email"
          class="w-full"
          placeholder="Enter email address"
        />
      </div>

      <div class="field">
        <label for="phone" class="font-semibold">Phone</label>
        <InputText
          id="phone"
          v-model="formData.phone"
          class="w-full"
          placeholder="Enter phone number"
        />
      </div>

      <div class="field">
        <label for="driver_number" class="font-semibold">Driver Number</label>
        <InputText
          id="driver_number"
          v-model="formData.driver_number"
          class="w-full"
          placeholder="Enter driver number"
        />
      </div>

      <!-- Dynamic platform fields (NEW) -->
      <div
        v-for="field in platformFormFields"
        :key="field.field"
        class="field"
      >
        <label :for="field.field" class="font-semibold">
          {{ field.label }}
        </label>

        <InputText
          v-if="field.type === 'text'"
          :id="field.field"
          v-model="formData[field.field]"
          class="w-full"
          :placeholder="field.placeholder"
        />

        <InputNumber
          v-else-if="field.type === 'number'"
          :id="field.field"
          v-model="formData[field.field]"
          class="w-full"
          :placeholder="field.placeholder"
        />

        <small v-if="field.helpText" class="text-gray-600">
          {{ field.helpText }}
        </small>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          outlined
          @click="handleCancel"
          :disabled="loading"
        />
        <Button
          label="Save"
          @click="handleSave"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>
</template>
```

---

## Component: CSVImportDialog

### `resources/app/js/components/driver/CSVImportDialog.vue` (UPDATE)

**Changes**:
1. Add "Download Template" button
2. Validate uploaded CSV headers against expected headers
3. Display platform compatibility errors

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Message from 'primevue/message';
import { useLeagueStore } from '@app/stores/leagueStore';

interface Props {
  visible: boolean;
  leagueId: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'import-complete': [];
}>();

const leagueStore = useLeagueStore();
const uploadedFile = ref<File | null>(null);
const validationErrors = ref<Array<{ row: number; error: string }>>([]);
const headerErrors = ref<string[]>([]);

const hasErrors = computed(() => {
  return validationErrors.value.length > 0 || headerErrors.value.length > 0;
});

async function handleDownloadTemplate() {
  await leagueStore.fetchCsvTemplate(props.leagueId);
}

function handleFileSelect(event: any) {
  const files = event.files;
  if (files && files.length > 0) {
    uploadedFile.value = files[0];
    validateCsvHeaders(files[0]);
  }
}

async function validateCsvHeaders(file: File) {
  // Read CSV headers from uploaded file
  const text = await file.text();
  const lines = text.split('\n');
  const uploadedHeaders = lines[0].split(',').map((h) => h.trim());

  // Get expected headers from store
  const expectedHeaders = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Driver Number',
    ...leagueStore.platformCsvHeaders,
  ];

  // Validate
  const missingHeaders = expectedHeaders.filter((h) => !uploadedHeaders.includes(h));
  const extraHeaders = uploadedHeaders.filter((h) => !expectedHeaders.includes(h));

  headerErrors.value = [];

  if (missingHeaders.length > 0) {
    headerErrors.value.push(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  if (extraHeaders.length > 0) {
    headerErrors.value.push(`Unexpected headers: ${extraHeaders.join(', ')}`);
  }
}

async function handleImport() {
  if (!uploadedFile.value) return;

  try {
    // Call import API (existing logic)
    // Handle platform compatibility errors from backend
    const response = await driverService.importCsv(props.leagueId, uploadedFile.value);

    if (response.errors) {
      validationErrors.value = response.errors;
    } else {
      emit('import-complete');
      emit('update:visible', false);
    }
  } catch (err: any) {
    if (err.response?.data?.errors) {
      validationErrors.value = err.response.data.errors;
    }
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Import Drivers from CSV"
    modal
    :style="{ width: '600px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4">
      <!-- Download template button -->
      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
          Download the CSV template with the correct headers for this league's platforms.
        </p>
        <Button
          label="Download Template"
          icon="pi pi-download"
          outlined
          size="small"
          @click="handleDownloadTemplate"
        />
      </div>

      <!-- File upload -->
      <FileUpload
        mode="basic"
        accept=".csv"
        :maxFileSize="1000000"
        chooseLabel="Choose CSV File"
        @select="handleFileSelect"
      />

      <!-- Header validation errors -->
      <Message
        v-for="(error, index) in headerErrors"
        :key="index"
        severity="error"
        :closable="false"
      >
        {{ error }}
      </Message>

      <!-- Row validation errors -->
      <div v-if="validationErrors.length > 0" class="max-h-60 overflow-y-auto">
        <Message
          v-for="(error, index) in validationErrors"
          :key="index"
          severity="error"
          :closable="false"
        >
          Row {{ error.row }}: {{ error.error }}
        </Message>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          outlined
          @click="emit('update:visible', false)"
        />
        <Button
          label="Import"
          @click="handleImport"
          :disabled="!uploadedFile || hasErrors"
        />
      </div>
    </template>
  </Dialog>
</template>
```

---

## Parent View: LeagueDetail

### `resources/app/js/views/LeagueDetail.vue` (UPDATE)

**Changes**:
1. Fetch platform configurations on mount
2. Pass configurations to child components

```vue
<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useLeagueStore } from '@app/stores/leagueStore';
import { useDriverStore } from '@app/stores/driverStore';
import DriverTable from '@app/components/driver/DriverTable.vue';
import DriverFormDialog from '@app/components/driver/DriverFormDialog.vue';
import CSVImportDialog from '@app/components/driver/CSVImportDialog.vue';

const route = useRoute();
const leagueStore = useLeagueStore();
const driverStore = useDriverStore();

const leagueId = computed(() => Number(route.params.id));

onMounted(async () => {
  // Fetch league data
  await leagueStore.fetchLeague(leagueId.value);

  // NEW: Fetch platform configurations
  await Promise.all([
    leagueStore.fetchPlatformColumns(leagueId.value),
    leagueStore.fetchPlatformFormFields(leagueId.value),
  ]);

  // Fetch drivers
  await driverStore.fetchDrivers(leagueId.value);
});
</script>

<template>
  <div class="league-detail">
    <h1>{{ leagueStore.currentLeague?.name }}</h1>

    <!-- Pass platform configurations to components -->
    <DriverTable
      :drivers="driverStore.drivers"
      :loading="driverStore.loading"
      :platform-columns="leagueStore.platformColumns"
      @edit="handleEditDriver"
      @delete="handleDeleteDriver"
    />

    <DriverFormDialog
      v-model:visible="showDriverForm"
      :driver="selectedDriver"
      :platform-form-fields="leagueStore.platformFormFields"
      @save="handleSaveDriver"
    />

    <CSVImportDialog
      v-model:visible="showCsvImport"
      :league-id="leagueId"
      @import-complete="handleImportComplete"
    />
  </div>
</template>
```

---

## Testing

### Store Tests

**Location**: `resources/app/js/stores/__tests__/leagueStore.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLeagueStore } from '../leagueStore';
import { leagueService } from '@app/services/leagueService';

vi.mock('@app/services/leagueService');

describe('leagueStore - Platform Configuration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('fetches platform columns successfully', async () => {
    const mockColumns = [
      { field: 'psn_id', label: 'PSN ID', type: 'text', sortable: true },
      { field: 'gt7_id', label: 'GT7 ID', type: 'text', sortable: true },
    ];

    vi.mocked(leagueService.getDriverColumns).mockResolvedValue({ data: mockColumns });

    const store = useLeagueStore();
    await store.fetchPlatformColumns(1);

    expect(store.platformColumns).toEqual(mockColumns);
  });

  it('fetches platform form fields successfully', async () => {
    const mockFields = [
      {
        field: 'psn_id',
        label: 'PSN ID',
        type: 'text',
        placeholder: 'Enter PSN ID',
        helpText: 'PlayStation Network ID',
      },
    ];

    vi.mocked(leagueService.getDriverFormFields).mockResolvedValue({ data: mockFields });

    const store = useLeagueStore();
    await store.fetchPlatformFormFields(1);

    expect(store.platformFormFields).toEqual(mockFields);
  });

  it('computes currentLeaguePlatforms correctly', () => {
    const store = useLeagueStore();
    store.currentLeague = {
      id: 1,
      name: 'Test League',
      platforms: [
        { id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' },
        { id: 2, name: 'iRacing', slug: 'iracing' },
      ],
    };

    expect(store.currentLeaguePlatforms).toHaveLength(2);
    expect(store.currentLeaguePlatforms[0].name).toBe('Gran Turismo 7');
  });
});
```

### Component Tests

**Location**: `resources/app/js/components/driver/__tests__/DriverTable.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DriverTable from '../DriverTable.vue';
import DataTable from 'primevue/datatable';

describe('DriverTable', () => {
  it('renders dynamic platform columns', () => {
    const platformColumns = [
      { field: 'psn_id', label: 'PSN ID', type: 'text', sortable: true },
      { field: 'gt7_id', label: 'GT7 ID', type: 'text', sortable: true },
    ];

    const wrapper = mount(DriverTable, {
      props: {
        drivers: [],
        platformColumns,
      },
      global: {
        components: { DataTable },
      },
    });

    // Should render 2 platform columns
    expect(wrapper.html()).toContain('PSN ID');
    expect(wrapper.html()).toContain('GT7 ID');
  });

  it('does not render platform columns when none provided', () => {
    const wrapper = mount(DriverTable, {
      props: {
        drivers: [],
        platformColumns: [],
      },
      global: {
        components: { DataTable },
      },
    });

    expect(wrapper.html()).not.toContain('PSN ID');
    expect(wrapper.html()).not.toContain('GT7 ID');
  });
});
```

**Location**: `resources/app/js/components/driver/__tests__/DriverFormDialog.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DriverFormDialog from '../DriverFormDialog.vue';

describe('DriverFormDialog', () => {
  it('renders dynamic platform form fields', () => {
    const platformFormFields = [
      {
        field: 'psn_id',
        label: 'PSN ID',
        type: 'text',
        placeholder: 'Enter PSN ID',
        helpText: 'PlayStation Network ID',
      },
    ];

    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        platformFormFields,
      },
    });

    expect(wrapper.html()).toContain('PSN ID');
    expect(wrapper.html()).toContain('PlayStation Network ID');
  });

  it('initializes form data with platform fields', async () => {
    const platformFormFields = [
      { field: 'psn_id', label: 'PSN ID', type: 'text' },
      { field: 'gt7_id', label: 'GT7 ID', type: 'text' },
    ];

    const wrapper = mount(DriverFormDialog, {
      props: {
        visible: true,
        platformFormFields,
      },
    });

    // Should have initialized psn_id and gt7_id to null
    expect(wrapper.vm.formData).toHaveProperty('psn_id');
    expect(wrapper.vm.formData).toHaveProperty('gt7_id');
  });
});
```

---

## Adding New Platforms (Frontend)

To support a new platform (e.g., Assetto Corsa Competizione):

1. **Update Driver interface** (`types/driver.ts`):
   ```typescript
   export interface Driver {
     // ... existing fields
     acc_id: string | null; // NEW
   }
   ```

2. **Update platform mapping config** (`config/platformColumnMapping.ts`):
   ```typescript
   {
     slug: 'assetto-corsa-competizione',
     driverFieldKey: 'acc_id',
     label: 'ACC ID',
     type: 'text',
     placeholder: 'Enter ACC ID',
     helpText: 'Assetto Corsa Competizione Player ID',
   },
   ```

3. **No component changes needed!** Components render dynamically based on backend configuration.

---

## Example User Flow

1. User navigates to `app.virtualracingleagues.localhost/leagues/1`
2. `LeagueDetail.vue` mounts:
   - Fetches league data
   - Fetches platform columns
   - Fetches platform form fields
3. User sees `DriverTable` with columns: Driver #, Name, Email, **PSN ID**, **GT7 ID** (if league uses GT7)
4. User clicks "Add Driver":
   - `DriverFormDialog` opens
   - Shows base fields + **PSN ID**, **GT7 ID** fields
5. User clicks "Import CSV":
   - `CSVImportDialog` opens
   - User clicks "Download Template"
   - Downloads CSV with headers: `First Name, Last Name, Email, PSN ID, GT7 ID`
6. User uploads CSV with iRacing column:
   - Validation error: "Unexpected headers: iRacing ID"
7. User uploads CSV with driver missing PSN/GT7 IDs:
   - Validation error: "Row 5: Driver must have at least one platform ID for: Gran Turismo 7"

---

## Performance Considerations

- **Configuration Caching**: Store caches platform configurations, no re-fetching on navigation
- **Lazy Loading**: Only fetch configurations when needed (on league detail view)
- **Minimal Re-renders**: Using `v-for` with `:key` ensures efficient DOM updates
- **Type Safety**: TypeScript prevents runtime errors from incorrect field access
