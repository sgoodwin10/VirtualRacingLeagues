# MVP Frontend Implementation Plan: League-Level Driver Management

**Version:** 1.0 MVP
**Last Updated:** October 18, 2025
**Application:** User Dashboard (`app.virtualracingleagues.localhost`)
**Base Path:** `resources/user/js/`

---

## Table of Contents

1. [Overview](#overview)
2. [Type Definitions](#type-definitions)
3. [Services Layer](#services-layer)
4. [State Management](#state-management)
5. [Component Specifications](#component-specifications)
6. [UI/UX Details](#uiux-details)
7. [Testing Strategy](#testing-strategy)
8. [Implementation Steps](#implementation-steps)

---

## Overview

This plan details the **simplified MVP frontend** for league-level driver management. The focus is on core CRUD operations with a streamlined user interface.

### MVP Features

- ✅ View drivers in a league (DataTable with pagination)
- ✅ Add single driver via form dialog
- ✅ Edit driver (league-specific: number, status, notes)
- ✅ Remove driver with confirmation
- ✅ Simple CSV import via textarea paste
- ✅ Basic search and status filter

### Removed from MVP

- ❌ File upload for CSV
- ❌ CSV preview with conflict resolution
- ❌ Multi-league indicators
- ❌ Global driver editing dialog
- ❌ Advanced filters
- ❌ Bulk actions dropdown
- ❌ Driver action menu (use inline buttons)
- ❌ Participation history

---

## Type Definitions

### File: `resources/user/js/types/driver.ts`

```typescript
/**
 * MVP Driver Types (Simplified)
 */

export type DriverStatus = 'active' | 'inactive' | 'banned';

/**
 * League Driver (includes global driver data)
 */
export interface LeagueDriver {
  id: number; // league_drivers.id
  league_id: number;
  driver_id: number;

  // League-specific data
  driver_number: number | null;
  status: DriverStatus;
  league_notes: string | null;
  added_to_league_at: string;
  updated_at: string;

  // Global driver data (nested)
  driver_global_id: number;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  display_name: string;

  // Platform IDs (simplified to 3)
  psn_id: string | null;
  gt7_id: string | null;
  iracing_id: string | null;
  iracing_customer_id: number | null;

  // Contact
  email: string | null;
  phone: string | null;
}

/**
 * Create driver form data
 */
export interface CreateDriverData {
  // Names (at least first OR last required)
  first_name?: string;
  last_name?: string;
  nickname?: string;

  // Platform IDs (at least ONE required)
  psn_id?: string;
  gt7_id?: string;
  iracing_id?: string;
  iracing_customer_id?: number;

  // Contact (optional)
  email?: string;
  phone?: string;

  // League-specific
  driver_number?: number;
  status?: DriverStatus;
  league_notes?: string;
}

/**
 * Update league driver data
 */
export interface UpdateLeagueDriverData {
  driver_number?: number;
  status?: DriverStatus;
  league_notes?: string;
}

/**
 * CSV import data (simplified)
 */
export interface CSVImportData {
  csv_content: string;
  mark_all_active?: boolean;
  skip_invalid_rows?: boolean;
}

/**
 * CSV import result
 */
export interface CSVImportResult {
  total_rows: number;
  created_count: number;
  skipped_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

/**
 * Driver statistics (simplified)
 */
export interface DriverStatistics {
  total: number;
  active: number;
  inactive: number;
  banned: number;
}

/**
 * API response for driver list
 */
export interface DriverListResponse {
  drivers: LeagueDriver[];
  statistics: DriverStatistics;
}
```

---

## Services Layer

### File: `resources/user/js/services/driverService.ts`

```typescript
/**
 * Driver API Service (Simplified)
 */

import { apiClient } from './api';
import type {
  LeagueDriver,
  DriverListResponse,
  CreateDriverData,
  UpdateLeagueDriverData,
  CSVImportData,
  CSVImportResult,
} from '@user/types/driver';
import type { AxiosResponse } from 'axios';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Get all drivers in a league
 */
export async function getLeagueDrivers(
  leagueId: number,
  signal?: AbortSignal
): Promise<DriverListResponse> {
  const response: AxiosResponse<ApiResponse<DriverListResponse>> =
    await apiClient.get(`/leagues/${leagueId}/drivers`, { signal });
  return response.data.data;
}

/**
 * Create driver and add to league
 */
export async function createDriver(
  leagueId: number,
  data: CreateDriverData,
  signal?: AbortSignal
): Promise<LeagueDriver> {
  const response: AxiosResponse<ApiResponse<LeagueDriver>> =
    await apiClient.post(`/leagues/${leagueId}/drivers`, data, { signal });
  return response.data.data;
}

/**
 * Update league-specific driver data
 */
export async function updateLeagueDriver(
  leagueId: number,
  driverId: number,
  data: UpdateLeagueDriverData,
  signal?: AbortSignal
): Promise<LeagueDriver> {
  const response: AxiosResponse<ApiResponse<LeagueDriver>> =
    await apiClient.put(`/leagues/${leagueId}/drivers/${driverId}`, data, { signal });
  return response.data.data;
}

/**
 * Remove driver from league
 */
export async function removeDriverFromLeague(
  leagueId: number,
  driverId: number,
  signal?: AbortSignal
): Promise<void> {
  await apiClient.delete(`/leagues/${leagueId}/drivers/${driverId}`, { signal });
}

/**
 * Import drivers from CSV
 */
export async function importDriversFromCSV(
  leagueId: number,
  data: CSVImportData,
  signal?: AbortSignal
): Promise<CSVImportResult> {
  const response: AxiosResponse<ApiResponse<CSVImportResult>> =
    await apiClient.post(`/leagues/${leagueId}/drivers/import-csv`, data, { signal });
  return response.data.data;
}
```

---

## State Management

### File: `resources/user/js/stores/driverStore.ts`

```typescript
/**
 * Driver Store (Simplified for MVP)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  LeagueDriver,
  DriverStatistics,
  DriverListResponse,
  CreateDriverData,
  UpdateLeagueDriverData,
  CSVImportData,
  CSVImportResult,
} from '@user/types/driver';
import * as driverService from '@user/services/driverService';

export const useDriverStore = defineStore('driver', () => {
  // State
  const drivers = ref<LeagueDriver[]>([]);
  const statistics = ref<DriverStatistics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Search/filter state
  const searchQuery = ref('');
  const statusFilter = ref<'all' | 'active' | 'inactive' | 'banned'>('all');

  // Getters
  const totalDrivers = computed(() => statistics.value?.total || 0);
  const activeDrivers = computed(() => statistics.value?.active || 0);
  const inactiveDrivers = computed(() => statistics.value?.inactive || 0);
  const bannedDrivers = computed(() => statistics.value?.banned || 0);
  const hasDrivers = computed(() => drivers.value.length > 0);

  const filteredDrivers = computed(() => {
    let filtered = drivers.value;

    // Apply status filter
    if (statusFilter.value !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter.value);
    }

    // Apply search
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.display_name.toLowerCase().includes(query) ||
          d.psn_id?.toLowerCase().includes(query) ||
          d.gt7_id?.toLowerCase().includes(query) ||
          d.iracing_id?.toLowerCase().includes(query) ||
          d.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  // Actions

  /**
   * Fetch all drivers for a league
   */
  async function fetchDrivers(leagueId: number, signal?: AbortSignal): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response: DriverListResponse = await driverService.getLeagueDrivers(
        leagueId,
        signal
      );

      drivers.value = response.drivers;
      statistics.value = response.statistics;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drivers';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create driver and add to league
   */
  async function createDriver(
    leagueId: number,
    data: CreateDriverData,
    signal?: AbortSignal
  ): Promise<LeagueDriver> {
    loading.value = true;
    error.value = null;

    try {
      const driver = await driverService.createDriver(leagueId, data, signal);
      drivers.value.unshift(driver);

      // Update statistics
      if (statistics.value) {
        statistics.value.total += 1;
        if (driver.status === 'active') statistics.value.active += 1;
        if (driver.status === 'inactive') statistics.value.inactive += 1;
        if (driver.status === 'banned') statistics.value.banned += 1;
      }

      return driver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create driver';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update league-specific driver data
   */
  async function updateDriver(
    leagueId: number,
    driverId: number,
    data: UpdateLeagueDriverData,
    signal?: AbortSignal
  ): Promise<LeagueDriver> {
    loading.value = true;
    error.value = null;

    try {
      const updatedDriver = await driverService.updateLeagueDriver(
        leagueId,
        driverId,
        data,
        signal
      );

      // Update in local state
      const index = drivers.value.findIndex((d) => d.id === driverId);
      if (index !== -1) {
        const oldStatus = drivers.value[index].status;
        drivers.value[index] = updatedDriver;

        // Update statistics if status changed
        if (statistics.value && oldStatus !== updatedDriver.status) {
          if (oldStatus === 'active') statistics.value.active -= 1;
          if (oldStatus === 'inactive') statistics.value.inactive -= 1;
          if (oldStatus === 'banned') statistics.value.banned -= 1;

          if (updatedDriver.status === 'active') statistics.value.active += 1;
          if (updatedDriver.status === 'inactive') statistics.value.inactive += 1;
          if (updatedDriver.status === 'banned') statistics.value.banned += 1;
        }
      }

      return updatedDriver;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update driver';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Remove driver from league
   */
  async function removeDriver(
    leagueId: number,
    driverId: number,
    signal?: AbortSignal
  ): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await driverService.removeDriverFromLeague(leagueId, driverId, signal);

      // Remove from local state
      const driver = drivers.value.find((d) => d.id === driverId);
      drivers.value = drivers.value.filter((d) => d.id !== driverId);

      // Update statistics
      if (statistics.value && driver) {
        statistics.value.total -= 1;
        if (driver.status === 'active') statistics.value.active -= 1;
        if (driver.status === 'inactive') statistics.value.inactive -= 1;
        if (driver.status === 'banned') statistics.value.banned -= 1;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove driver';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Import drivers from CSV
   */
  async function importDrivers(
    leagueId: number,
    data: CSVImportData,
    signal?: AbortSignal
  ): Promise<CSVImportResult> {
    loading.value = true;
    error.value = null;

    try {
      const result = await driverService.importDriversFromCSV(leagueId, data, signal);

      // Refresh driver list after import
      await fetchDrivers(leagueId, signal);

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import drivers';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set search query
   */
  function setSearch(query: string): void {
    searchQuery.value = query;
  }

  /**
   * Set status filter
   */
  function setStatusFilter(status: 'all' | 'active' | 'inactive' | 'banned'): void {
    statusFilter.value = status;
  }

  /**
   * Reset state
   */
  function reset(): void {
    drivers.value = [];
    statistics.value = null;
    loading.value = false;
    error.value = null;
    searchQuery.value = '';
    statusFilter.value = 'all';
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    drivers,
    statistics,
    loading,
    error,
    searchQuery,
    statusFilter,

    // Getters
    totalDrivers,
    activeDrivers,
    inactiveDrivers,
    bannedDrivers,
    hasDrivers,
    filteredDrivers,

    // Actions
    fetchDrivers,
    createDriver,
    updateDriver,
    removeDriver,
    importDrivers,
    setSearch,
    setStatusFilter,
    reset,
    clearError,
  };
});
```

---

## Component Specifications

### Component Hierarchy (Simplified)

```
LeagueDetail.vue (existing)
└── DriverManagementDrawer.vue (NEW)
    ├── DriverStatsCard.vue (NEW)
    ├── DriverTable.vue (NEW)
    │   └── DriverStatusBadge.vue (NEW)
    ├── DriverFormDialog.vue (NEW)
    └── CSVImportDialog.vue (NEW - simplified)
```

---

### 1. DriverManagementDrawer.vue

**Path:** `resources/user/js/components/driver/DriverManagementDrawer.vue`

**Purpose:** Main container - bottom drawer with driver list and actions

**Template:**

```vue
<template>
  <Drawer
    v-model:visible="localVisible"
    position="bottom"
    :style="{ height: '80vh' }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h2 class="text-2xl font-bold">{{ leagueName }} - Drivers</h2>
          <p class="text-sm text-gray-600">Manage your league roster</p>
        </div>
        <Button icon="pi pi-times" text rounded severity="secondary" @click="close" />
      </div>
    </template>

    <div class="space-y-6">
      <!-- Statistics -->
      <DriverStatsCard :statistics="driverStore.statistics" />

      <!-- Action Toolbar -->
      <div class="flex gap-3">
        <Button
          label="Add Driver"
          icon="pi pi-plus"
          severity="success"
          @click="openAddDialog"
        />
        <Button
          label="Import CSV"
          icon="pi pi-upload"
          severity="info"
          outlined
          @click="openImportDialog"
        />
      </div>

      <!-- Driver Table -->
      <DriverTable
        :drivers="driverStore.filteredDrivers"
        :loading="driverStore.loading"
        @edit="handleEdit"
        @remove="handleRemove"
      />
    </div>

    <!-- Dialogs -->
    <DriverFormDialog
      v-model:visible="showDriverDialog"
      :league-id="leagueId"
      :driver="selectedDriver"
      @submit="handleDriverSubmit"
    />

    <CSVImportDialog
      v-model:visible="showImportDialog"
      :league-id="leagueId"
      @import="handleImport"
    />
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useDriverStore } from '@user/stores/driverStore';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import DriverStatsCard from './DriverStatsCard.vue';
import DriverTable from './DriverTable.vue';
import DriverFormDialog from './DriverFormDialog.vue';
import CSVImportDialog from './CSVImportDialog.vue';
import type { LeagueDriver, CreateDriverData, UpdateLeagueDriverData, CSVImportData } from '@user/types/driver';

interface Props {
  visible: boolean;
  leagueId: number;
  leagueName: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const driverStore = useDriverStore();
const toast = useToast();
const confirm = useConfirm();

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const showDriverDialog = ref(false);
const showImportDialog = ref(false);
const selectedDriver = ref<LeagueDriver | null>(null);

// Load drivers when drawer opens
watch(() => props.visible, async (visible) => {
  if (visible) {
    await driverStore.fetchDrivers(props.leagueId);
  } else {
    driverStore.reset();
  }
});

function openAddDialog() {
  selectedDriver.value = null;
  showDriverDialog.value = true;
}

function openImportDialog() {
  showImportDialog.value = true;
}

function handleEdit(driver: LeagueDriver) {
  selectedDriver.value = driver;
  showDriverDialog.value = true;
}

function handleRemove(driver: LeagueDriver) {
  confirm.require({
    message: `Remove ${driver.display_name} from this league?`,
    header: 'Confirm Removal',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Remove',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await driverStore.removeDriver(props.leagueId, driver.id);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Driver removed from league',
          life: 3000,
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error instanceof Error ? error.message : 'Failed to remove driver',
          life: 5000,
        });
      }
    },
  });
}

async function handleDriverSubmit(data: CreateDriverData | UpdateLeagueDriverData) {
  try {
    if (selectedDriver.value) {
      // Update
      await driverStore.updateDriver(props.leagueId, selectedDriver.value.id, data as UpdateLeagueDriverData);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Driver updated successfully',
        life: 3000,
      });
    } else {
      // Create
      await driverStore.createDriver(props.leagueId, data as CreateDriverData);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Driver added successfully',
        life: 3000,
      });
    }
    showDriverDialog.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to save driver',
      life: 5000,
    });
  }
}

async function handleImport(data: CSVImportData) {
  try {
    const result = await driverStore.importDrivers(props.leagueId, data);

    if (result.error_count > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Import Completed with Errors',
        detail: `${result.created_count} drivers imported, ${result.error_count} errors`,
        life: 5000,
      });
    } else {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${result.created_count} drivers imported successfully`,
        life: 3000,
      });
    }

    showImportDialog.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to import drivers',
      life: 5000,
    });
  }
}

function close() {
  localVisible.value = false;
}
</script>
```

---

### 2. DriverTable.vue

**Path:** `resources/user/js/components/driver/DriverTable.vue`

**Purpose:** DataTable with search, filter, and inline actions

**Template:**

```vue
<template>
  <div class="space-y-4">
    <!-- Search and Filter -->
    <div class="flex flex-col md:flex-row gap-4">
      <span class="p-input-icon-left flex-1">
        <i class="pi pi-search" />
        <InputText
          :model-value="driverStore.searchQuery"
          placeholder="Search drivers..."
          class="w-full"
          @input="driverStore.setSearch(($event.target as HTMLInputElement).value)"
        />
      </span>
      <Dropdown
        :model-value="driverStore.statusFilter"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        placeholder="All Statuses"
        class="w-full md:w-48"
        @change="driverStore.setStatusFilter($event.value)"
      />
    </div>

    <!-- DataTable -->
    <DataTable
      :value="drivers"
      :loading="loading"
      striped-rows
      responsive-layout="scroll"
    >
      <!-- Driver Number -->
      <Column field="driver_number" header="#" style="width: 80px">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.driver_number || '-' }}</span>
        </template>
      </Column>

      <!-- Status -->
      <Column field="status" header="Status" style="width: 120px">
        <template #body="{ data }">
          <DriverStatusBadge :status="data.status" />
        </template>
      </Column>

      <!-- Name -->
      <Column field="display_name" header="Name">
        <template #body="{ data }">
          <div>
            <div class="font-medium">{{ data.display_name }}</div>
            <div v-if="data.nickname" class="text-sm text-gray-500">
              "{{ data.nickname }}"
            </div>
          </div>
        </template>
      </Column>

      <!-- Platform ID -->
      <Column header="Platform ID">
        <template #body="{ data }">
          <span v-if="data.psn_id">PSN: {{ data.psn_id }}</span>
          <span v-else-if="data.gt7_id">GT7: {{ data.gt7_id }}</span>
          <span v-else-if="data.iracing_id">iRacing: {{ data.iracing_id }}</span>
          <span v-else>-</span>
        </template>
      </Column>

      <!-- Email -->
      <Column field="email" header="Email">
        <template #body="{ data }">
          {{ data.email || '-' }}
        </template>
      </Column>

      <!-- Actions -->
      <Column header="Actions" style="width: 140px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              icon="pi pi-pencil"
              size="small"
              outlined
              @click="$emit('edit', data)"
            />
            <Button
              icon="pi pi-trash"
              size="small"
              outlined
              severity="danger"
              @click="$emit('remove', data)"
            />
          </div>
        </template>
      </Column>

      <!-- Empty state -->
      <template #empty>
        <div class="text-center py-12">
          <i class="pi pi-users text-6xl text-gray-400 mb-4"></i>
          <p class="text-xl text-gray-600">No drivers found</p>
          <p class="text-gray-500">Add drivers to start building your roster</p>
        </div>
      </template>

      <!-- Loading -->
      <template #loading>
        <div class="space-y-2">
          <Skeleton v-for="i in 10" :key="i" height="3rem" />
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { useDriverStore } from '@user/stores/driverStore';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import DriverStatusBadge from './DriverStatusBadge.vue';
import type { LeagueDriver } from '@user/types/driver';

interface Props {
  drivers: LeagueDriver[];
  loading: boolean;
}

interface Emits {
  (e: 'edit', driver: LeagueDriver): void;
  (e: 'remove', driver: LeagueDriver): void;
}

defineProps<Props>();
defineEmits<Emits>();

const driverStore = useDriverStore();

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Banned', value: 'banned' },
];
</script>
```

---

### 3. DriverFormDialog.vue

**Path:** `resources/user/js/components/driver/DriverFormDialog.vue`

**Purpose:** Add/Edit driver form (single mode - creates new or updates league-specific)

**Template Structure:**

```vue
<template>
  <Dialog
    v-model:visible="localVisible"
    :header="dialogTitle"
    :style="{ width: '600px' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    modal
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Name fields (if creating) -->
      <div v-if="!driver" class="space-y-4">
        <h3 class="font-semibold">Basic Information</h3>
        <!-- First Name, Last Name, Nickname -->
      </div>

      <!-- Platform IDs (if creating) -->
      <div v-if="!driver" class="space-y-4">
        <h3 class="font-semibold">Platform IDs</h3>
        <!-- PSN ID, GT7 ID, iRacing ID -->
      </div>

      <!-- League-specific fields -->
      <div class="space-y-4">
        <h3 class="font-semibold">League Settings</h3>
        <!-- Driver Number, Status, Notes -->
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <Button label="Cancel" severity="secondary" outlined @click="localVisible = false" />
        <Button type="submit" :label="submitLabel" :loading="isSubmitting" />
      </div>
    </form>
  </Dialog>
</template>
```

*(Full implementation follows DriverFormDialog pattern from full plan but simplified - single mode only)*

---

### 4. CSVImportDialog.vue (Simplified)

**Path:** `resources/user/js/components/driver/CSVImportDialog.vue`

**Purpose:** Simple CSV import via textarea paste

**Template:**

```vue
<template>
  <Dialog
    v-model:visible="localVisible"
    header="Import Drivers from CSV"
    :style="{ width: '700px' }"
    :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    modal
  >
    <div class="space-y-6">
      <!-- Format Example -->
      <Message severity="info" :closable="false">
        <strong>CSV Format:</strong><br />
        FirstName,LastName,PSN_ID,Email,DriverNumber<br />
        John,Smith,JohnSmith77,john@email.com,5
      </Message>

      <!-- Textarea -->
      <div>
        <label class="block font-semibold mb-2">Paste CSV Data</label>
        <Textarea
          v-model="csvContent"
          rows="15"
          class="w-full font-mono text-sm"
          placeholder="FirstName,LastName,PSN_ID,Email,DriverNumber&#10;John,Smith,JohnSmith77,john@email.com,5&#10;Jane,Doe,JaneDoe_GT,jane@email.com,7"
        />
      </div>

      <!-- Options -->
      <div class="space-y-2">
        <div class="flex items-center">
          <Checkbox v-model="markAllActive" binary input-id="mark-active" />
          <label for="mark-active" class="ml-2">Mark all as Active</label>
        </div>
        <div class="flex items-center">
          <Checkbox v-model="skipInvalid" binary input-id="skip-invalid" />
          <label for="skip-invalid" class="ml-2">Skip invalid rows</label>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <Button label="Cancel" severity="secondary" outlined @click="close" />
        <Button
          label="Import"
          :loading="isImporting"
          :disabled="!csvContent.trim()"
          @click="handleImport"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import type { CSVImportData } from '@user/types/driver';

interface Props {
  visible: boolean;
  leagueId: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'import', data: CSVImportData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const csvContent = ref('');
const markAllActive = ref(true);
const skipInvalid = ref(true);
const isImporting = ref(false);

function handleImport() {
  const data: CSVImportData = {
    csv_content: csvContent.value,
    mark_all_active: markAllActive.value,
    skip_invalid_rows: skipInvalid.value,
  };

  emit('import', data);
}

function close() {
  csvContent.value = '';
  localVisible.value = false;
}
</script>
```

---

### 5. DriverStatusBadge.vue

**Path:** `resources/user/js/components/driver/DriverStatusBadge.vue`

```vue
<template>
  <Chip :label="statusLabel" :class="statusClass" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Chip from 'primevue/chip';
import type { DriverStatus } from '@user/types/driver';

interface Props {
  status: DriverStatus;
}

const props = defineProps<Props>();

const statusLabel = computed(() => {
  const labels: Record<DriverStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    banned: 'Banned',
  };
  return labels[props.status];
});

const statusClass = computed(() => {
  const classes: Record<DriverStatus, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    banned: 'bg-red-100 text-red-800',
  };
  return classes[props.status];
});
</script>
```

---

### 6. DriverStatsCard.vue

**Path:** `resources/user/js/components/driver/DriverStatsCard.vue`

```vue
<template>
  <Card v-if="statistics" class="bg-blue-50 border-blue-200">
    <template #content>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p class="text-sm text-gray-600 mb-1">Total</p>
          <p class="text-3xl font-bold text-blue-600">{{ statistics.total }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 mb-1">Active</p>
          <p class="text-3xl font-bold text-green-600">{{ statistics.active }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 mb-1">Inactive</p>
          <p class="text-3xl font-bold text-gray-600">{{ statistics.inactive }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 mb-1">Banned</p>
          <p class="text-3xl font-bold text-red-600">{{ statistics.banned }}</p>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card';
import type { DriverStatistics } from '@user/types/driver';

interface Props {
  statistics: DriverStatistics | null;
}

defineProps<Props>();
</script>
```

---

## UI/UX Details

### Bottom Drawer
- Position: `bottom`
- Height: `80vh`
- Backdrop: Click to close
- Header: League name + close button

### DataTable
- Striped rows
- Responsive layout
- Search: Debounced (300ms)
- Filter: Status dropdown
- Actions: Inline Edit/Delete buttons
- Empty state: Icon + message

### Form Validation
- At least first OR last name
- At least one platform ID
- Driver number: 1-999 (optional)
- Email: valid format (optional)

### CSV Import
- Textarea only (no file upload)
- Format example shown
- Simple validation on submit
- Error list with row numbers

### Notifications
- Success: Green toast, 3s
- Error: Red toast, 5s
- Warning: Orange toast, 5s

---

## Testing Strategy

### Unit Tests
- `driverStore.test.ts` - All store actions and getters
- `driverService.test.ts` - All API calls

### Component Tests
- `DriverManagementDrawer.test.ts` - Opens, loads drivers, actions
- `DriverTable.test.ts` - Renders, search, filter, emits
- `DriverFormDialog.test.ts` - Validation, submit
- `CSVImportDialog.test.ts` - Paste, import

---

## Implementation Steps

### Phase 1: Foundation (Days 1-2)
1. ✅ Create `driver.ts` types
2. ✅ Create `driverService.ts`
3. ✅ Create `driverStore.ts`
4. ✅ Write service tests
5. ✅ Write store tests

### Phase 2: Components (Days 3-4)
6. ✅ Create `DriverStatusBadge.vue`
7. ✅ Create `DriverStatsCard.vue`
8. ✅ Create `DriverTable.vue`
9. ✅ Create `DriverFormDialog.vue`
10. ✅ Create `CSVImportDialog.vue`
11. ✅ Create `DriverManagementDrawer.vue`

### Phase 3: Integration (Day 5)
12. ✅ Update `LeagueDetail.vue`
13. ✅ End-to-end testing
14. ✅ Bug fixes and polish

---

**Document Version:** 1.0 MVP
**Last Updated:** October 18, 2025
**Status:** Ready for Implementation
**Estimated Time:** 5 days
