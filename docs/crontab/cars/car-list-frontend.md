# Car List Import - Frontend Implementation Plan

## Overview

This document details the frontend implementation for the GT7 car management feature in the **Admin Dashboard**. The frontend will provide:

1. **Car List View** - Display all imported cars with filtering and pagination
2. **Brand List View** - Display all car brands/manufacturers
3. **Import Trigger** - Button to manually trigger car import
4. **Import Status** - Display import progress and results

---

## Components Architecture

### Location: `resources/admin/js/`

```
resources/admin/js/
├── views/
│   └── cars/
│       ├── CarListView.vue          # Main car list page
│       ├── CarBrandListView.vue     # Brand list page
│       └── components/
│           ├── CarTable.vue         # Car data table
│           ├── CarFilters.vue       # Filter controls
│           ├── BrandTable.vue       # Brand data table
│           └── ImportDialog.vue     # Import confirmation dialog
├── composables/
│   └── useCars.ts                   # Car-related composables
├── services/
│   └── carService.ts                # API calls for cars
├── stores/
│   └── carStore.ts                  # Pinia store for car state
└── types/
    └── car.ts                       # TypeScript interfaces
```

---

## Phase 1: TypeScript Types

### Location: `resources/admin/js/types/car.ts`

```typescript
export interface CarBrand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
}

export interface Car {
  id: number;
  platform_id: number;
  car_brand_id: number;
  brand_name: string;
  external_id: string;
  name: string;
  slug: string;
  car_group: string | null;
  year: number | null;
  image_url: string | null;
  is_active: boolean;
}

export interface CarFilters {
  search?: string;
  brand_id?: number;
  car_group?: string;
  year?: number;
  page: number;
  per_page: number;
}

export interface ImportResult {
  total_processed: number;
  created_count: number;
  updated_count: number;
  deactivated_count: number;
  error_count: number;
  errors: ImportError[];
  brands_created: number;
}

export interface ImportError {
  row: number;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}
```

---

## Phase 2: API Service

### Location: `resources/admin/js/services/carService.ts`

```typescript
import axios from 'axios';
import type { Car, CarBrand, CarFilters, ImportResult, PaginatedResponse } from '@admin/types/car';

const API_BASE = '/admin/api';

export const carService = {
  /**
   * Get paginated list of cars for a platform
   */
  async getCars(platformId: number, filters: CarFilters): Promise<PaginatedResponse<Car>> {
    const params = new URLSearchParams();
    params.append('page', String(filters.page));
    params.append('per_page', String(filters.per_page));

    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.brand_id) {
      params.append('brand_id', String(filters.brand_id));
    }
    if (filters.car_group) {
      params.append('car_group', filters.car_group);
    }
    if (filters.year) {
      params.append('year', String(filters.year));
    }

    const response = await axios.get(
      `${API_BASE}/platforms/${platformId}/cars?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Get all car brands
   */
  async getBrands(): Promise<CarBrand[]> {
    const response = await axios.get(`${API_BASE}/car-brands`);
    return response.data.data;
  },

  /**
   * Trigger car import for a platform
   */
  async triggerImport(platformId: number): Promise<ImportResult> {
    const response = await axios.post(
      `${API_BASE}/platforms/${platformId}/cars/import`
    );
    return response.data.data;
  },

  /**
   * Get unique car groups for filtering
   */
  async getGroups(platformId: number): Promise<string[]> {
    const response = await axios.get(
      `${API_BASE}/platforms/${platformId}/cars/groups`
    );
    return response.data.data;
  },
};
```

---

## Phase 3: Pinia Store

### Location: `resources/admin/js/stores/carStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { carService } from '@admin/services/carService';
import type { Car, CarBrand, CarFilters, ImportResult } from '@admin/types/car';

export const useCarStore = defineStore('car', () => {
  // State
  const cars = ref<Car[]>([]);
  const brands = ref<CarBrand[]>([]);
  const groups = ref<string[]>([]);
  const loading = ref(false);
  const importing = ref(false);
  const error = ref<string | null>(null);
  const lastImportResult = ref<ImportResult | null>(null);

  // Pagination
  const currentPage = ref(1);
  const perPage = ref(50);
  const total = ref(0);
  const lastPage = ref(1);

  // Filters
  const filters = ref<CarFilters>({
    page: 1,
    per_page: 50,
  });

  // Computed
  const totalPages = computed(() => lastPage.value);
  const hasNextPage = computed(() => currentPage.value < lastPage.value);
  const hasPrevPage = computed(() => currentPage.value > 1);

  // Actions
  async function fetchCars(platformId: number) {
    loading.value = true;
    error.value = null;

    try {
      const response = await carService.getCars(platformId, {
        ...filters.value,
        page: currentPage.value,
        per_page: perPage.value,
      });

      cars.value = response.data;
      total.value = response.total;
      lastPage.value = response.last_page;
    } catch (e) {
      error.value = 'Failed to load cars';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchBrands() {
    try {
      brands.value = await carService.getBrands();
    } catch (e) {
      console.error('Failed to load brands:', e);
    }
  }

  async function fetchGroups(platformId: number) {
    try {
      groups.value = await carService.getGroups(platformId);
    } catch (e) {
      console.error('Failed to load groups:', e);
    }
  }

  async function triggerImport(platformId: number) {
    importing.value = true;
    error.value = null;

    try {
      lastImportResult.value = await carService.triggerImport(platformId);
      // Refresh car list after import
      await fetchCars(platformId);
      await fetchBrands();
    } catch (e) {
      error.value = 'Import failed';
      console.error(e);
    } finally {
      importing.value = false;
    }
  }

  function setPage(page: number) {
    currentPage.value = page;
  }

  function setFilters(newFilters: Partial<CarFilters>) {
    filters.value = { ...filters.value, ...newFilters };
    currentPage.value = 1; // Reset to first page on filter change
  }

  function resetFilters() {
    filters.value = { page: 1, per_page: 50 };
    currentPage.value = 1;
  }

  return {
    // State
    cars,
    brands,
    groups,
    loading,
    importing,
    error,
    lastImportResult,
    currentPage,
    perPage,
    total,
    lastPage,
    filters,

    // Computed
    totalPages,
    hasNextPage,
    hasPrevPage,

    // Actions
    fetchCars,
    fetchBrands,
    fetchGroups,
    triggerImport,
    setPage,
    setFilters,
    resetFilters,
  };
});
```

---

## Phase 4: Components

### 4.1 Car List View

### Location: `resources/admin/js/views/cars/CarListView.vue`

```vue
<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCarStore } from '@admin/stores/carStore';
import CarTable from './components/CarTable.vue';
import CarFilters from './components/CarFilters.vue';
import ImportDialog from './components/ImportDialog.vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const carStore = useCarStore();
const toast = useToast();

const platformId = Number(route.params.platformId);

onMounted(async () => {
  await Promise.all([
    carStore.fetchCars(platformId),
    carStore.fetchBrands(),
    carStore.fetchGroups(platformId),
  ]);
});

watch(() => carStore.currentPage, () => {
  carStore.fetchCars(platformId);
});

watch(() => carStore.filters, () => {
  carStore.fetchCars(platformId);
}, { deep: true });

async function handleImport() {
  await carStore.triggerImport(platformId);

  if (carStore.lastImportResult) {
    const result = carStore.lastImportResult;
    toast.add({
      severity: result.error_count > 0 ? 'warn' : 'success',
      summary: 'Import Complete',
      detail: `Created: ${result.created_count}, Updated: ${result.updated_count}, Errors: ${result.error_count}`,
      life: 5000,
    });
  }
}
</script>

<template>
  <div class="car-list-view">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Platform Cars</h1>
      <Button
        label="Import Cars"
        icon="pi pi-download"
        :loading="carStore.importing"
        @click="handleImport"
      />
    </div>

    <Card class="mb-4">
      <template #content>
        <CarFilters
          :brands="carStore.brands"
          :groups="carStore.groups"
          :filters="carStore.filters"
          @update:filters="carStore.setFilters"
          @reset="carStore.resetFilters"
        />
      </template>
    </Card>

    <Card>
      <template #content>
        <CarTable
          :cars="carStore.cars"
          :loading="carStore.loading"
          :current-page="carStore.currentPage"
          :per-page="carStore.perPage"
          :total="carStore.total"
          :last-page="carStore.lastPage"
          @page-change="carStore.setPage"
        />
      </template>
    </Card>

    <ImportDialog
      v-if="carStore.lastImportResult"
      :result="carStore.lastImportResult"
    />
  </div>
</template>
```

### 4.2 Car Table Component

### Location: `resources/admin/js/views/cars/components/CarTable.vue`

```vue
<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Paginator from 'primevue/paginator';
import Tag from 'primevue/tag';
import type { Car } from '@admin/types/car';

interface Props {
  cars: Car[];
  loading: boolean;
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'page-change', page: number): void;
}>();

function onPageChange(event: { page: number }) {
  emit('page-change', event.page + 1); // PrimeVue uses 0-based indexing
}

function getGroupSeverity(carGroup: string | null): string {
  if (!carGroup) return 'secondary';

  const groupLower = carGroup.toLowerCase();
  if (groupLower.includes('gr.1')) return 'danger';
  if (groupLower.includes('gr.2')) return 'warning';
  if (groupLower.includes('gr.3')) return 'success';
  if (groupLower.includes('gr.4')) return 'info';
  if (groupLower.includes('gr.b')) return 'contrast';
  return 'secondary';
}
</script>

<template>
  <div>
    <DataTable
      :value="cars"
      :loading="loading"
      striped-rows
      responsive-layout="scroll"
    >
      <template #empty>
        No cars found.
      </template>

      <Column field="external_id" header="ID" style="width: 80px" />

      <Column field="name" header="Car Name" sortable>
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <img
              v-if="data.image_url"
              :src="data.image_url"
              :alt="data.name"
              class="w-12 h-8 object-cover rounded"
            />
            <span>{{ data.name }}</span>
          </div>
        </template>
      </Column>

      <Column field="brand_name" header="Brand" sortable />

      <Column field="car_group" header="Group" style="width: 120px">
        <template #body="{ data }">
          <Tag
            v-if="data.car_group"
            :value="data.car_group"
            :severity="getGroupSeverity(data.car_group)"
          />
          <span v-else class="text-gray-400">—</span>
        </template>
      </Column>

      <Column field="year" header="Year" style="width: 80px">
        <template #body="{ data }">
          <span v-if="data.year">{{ data.year }}</span>
          <span v-else class="text-gray-400">—</span>
        </template>
      </Column>

      <Column field="is_active" header="Status" style="width: 100px">
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? 'Active' : 'Inactive'"
            :severity="data.is_active ? 'success' : 'danger'"
          />
        </template>
      </Column>
    </DataTable>

    <Paginator
      v-if="total > perPage"
      :first="(currentPage - 1) * perPage"
      :rows="perPage"
      :total-records="total"
      :rows-per-page-options="[25, 50, 100]"
      @page="onPageChange"
    />
  </div>
</template>
```

### 4.3 Car Filters Component

### Location: `resources/admin/js/views/cars/components/CarFilters.vue`

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import type { CarBrand, CarFilters } from '@admin/types/car';

interface Props {
  brands: CarBrand[];
  groups: string[];
  filters: CarFilters;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:filters', filters: Partial<CarFilters>): void;
  (e: 'reset'): void;
}>();

const search = ref(props.filters.search || '');
const selectedBrand = ref<number | null>(props.filters.brand_id || null);
const selectedGroup = ref<string | null>(props.filters.car_group || null);

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>;
watch(search, (value) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit('update:filters', { search: value || undefined });
  }, 300);
});

watch(selectedBrand, (value) => {
  emit('update:filters', { brand_id: value || undefined });
});

watch(selectedGroup, (value) => {
  emit('update:filters', { car_group: value || undefined });
});

function handleReset() {
  search.value = '';
  selectedBrand.value = null;
  selectedGroup.value = null;
  emit('reset');
}
</script>

<template>
  <div class="flex flex-wrap gap-4 items-end">
    <div class="flex-1 min-w-[200px]">
      <label class="block text-sm font-medium mb-1">Search</label>
      <InputText
        v-model="search"
        placeholder="Search by car name..."
        class="w-full"
      />
    </div>

    <div class="w-48">
      <label class="block text-sm font-medium mb-1">Brand</label>
      <Dropdown
        v-model="selectedBrand"
        :options="brands"
        option-label="name"
        option-value="id"
        placeholder="All Brands"
        show-clear
        class="w-full"
      />
    </div>

    <div class="w-36">
      <label class="block text-sm font-medium mb-1">Group</label>
      <Dropdown
        v-model="selectedGroup"
        :options="groups"
        placeholder="All Groups"
        show-clear
        class="w-full"
      />
    </div>

    <Button
      label="Reset"
      icon="pi pi-refresh"
      severity="secondary"
      @click="handleReset"
    />
  </div>
</template>
```

### 4.4 Import Dialog Component

### Location: `resources/admin/js/views/cars/components/ImportDialog.vue`

```vue
<script setup lang="ts">
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import type { ImportResult } from '@admin/types/car';

interface Props {
  result: ImportResult;
}

defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: true });
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Import Results"
    :modal="true"
    :style="{ width: '600px' }"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-4 gap-4 text-center">
        <div class="p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">
            {{ result.created_count }}
          </div>
          <div class="text-sm text-green-700">Created</div>
        </div>

        <div class="p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">
            {{ result.updated_count }}
          </div>
          <div class="text-sm text-blue-700">Updated</div>
        </div>

        <div class="p-4 bg-orange-50 rounded-lg">
          <div class="text-2xl font-bold text-orange-600">
            {{ result.deactivated_count }}
          </div>
          <div class="text-sm text-orange-700">Deactivated</div>
        </div>

        <div class="p-4 bg-red-50 rounded-lg">
          <div class="text-2xl font-bold text-red-600">
            {{ result.error_count }}
          </div>
          <div class="text-sm text-red-700">Errors</div>
        </div>
      </div>

      <div class="flex gap-4">
        <Tag severity="info">
          Total Processed: {{ result.total_processed }}
        </Tag>
        <Tag severity="success">
          New Brands: {{ result.brands_created }}
        </Tag>
      </div>

      <div v-if="result.errors.length > 0">
        <h4 class="font-medium mb-2">Errors</h4>
        <DataTable
          :value="result.errors"
          :paginator="result.errors.length > 5"
          :rows="5"
          size="small"
        >
          <Column field="row" header="Row" style="width: 80px" />
          <Column field="message" header="Error Message" />
        </DataTable>
      </div>
    </div>
  </Dialog>
</template>
```

---

## Phase 5: Router Configuration

### Update: `resources/admin/js/router/index.ts`

Add these routes to the admin router:

```typescript
{
  path: '/admin/platforms/:platformId/cars',
  name: 'platform-cars',
  component: () => import('@admin/views/cars/CarListView.vue'),
  meta: { requiresAuth: true },
},
{
  path: '/admin/car-brands',
  name: 'car-brands',
  component: () => import('@admin/views/cars/CarBrandListView.vue'),
  meta: { requiresAuth: true },
},
```

---

## Phase 6: Navigation

### Add to Admin Sidebar

Add navigation items to the admin sidebar menu:

```typescript
{
  label: 'Platforms',
  icon: 'pi pi-server',
  items: [
    {
      label: 'GT7 Cars',
      icon: 'pi pi-car',
      to: '/admin/platforms/1/cars', // Assuming GT7 is platform ID 1
    },
    {
      label: 'Car Brands',
      icon: 'pi pi-tag',
      to: '/admin/car-brands',
    },
  ],
},
```

---

## Phase 7: Testing

### Location: `resources/admin/js/views/cars/__tests__/`

### 7.1 CarListView.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import CarListView from '../CarListView.vue';
import { useCarStore } from '@admin/stores/carStore';

describe('CarListView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders car list view', () => {
    const wrapper = mount(CarListView, {
      global: {
        plugins: [createTestingPinia()],
        stubs: ['router-link', 'router-view'],
      },
    });

    expect(wrapper.find('h1').text()).toContain('Platform Cars');
  });

  it('fetches cars on mount', async () => {
    const wrapper = mount(CarListView, {
      global: {
        plugins: [createTestingPinia({ stubActions: false })],
        stubs: ['router-link', 'router-view'],
      },
    });

    const store = useCarStore();
    expect(store.fetchCars).toHaveBeenCalled();
  });

  it('shows import button', () => {
    const wrapper = mount(CarListView, {
      global: {
        plugins: [createTestingPinia()],
        stubs: ['router-link', 'router-view'],
      },
    });

    expect(wrapper.find('button').text()).toContain('Import');
  });
});
```

### 7.2 CarTable.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CarTable from '../components/CarTable.vue';

const mockCars = [
  {
    id: 1,
    platform_id: 1,
    car_brand_id: 1,
    brand_name: 'Ferrari',
    external_id: '123',
    name: '488 GT3',
    slug: 'ferrari-488-gt3',
    group: 'Gr.3',
    image_url: null,
    is_active: true,
  },
];

describe('CarTable', () => {
  it('renders car data', () => {
    const wrapper = mount(CarTable, {
      props: {
        cars: mockCars,
        loading: false,
        currentPage: 1,
        perPage: 50,
        total: 1,
        lastPage: 1,
      },
    });

    expect(wrapper.text()).toContain('488 GT3');
    expect(wrapper.text()).toContain('Ferrari');
    expect(wrapper.text()).toContain('Gr.3');
  });

  it('shows loading state', () => {
    const wrapper = mount(CarTable, {
      props: {
        cars: [],
        loading: true,
        currentPage: 1,
        perPage: 50,
        total: 0,
        lastPage: 1,
      },
    });

    expect(wrapper.find('.p-datatable-loading-overlay').exists()).toBe(true);
  });

  it('shows empty message when no cars', () => {
    const wrapper = mount(CarTable, {
      props: {
        cars: [],
        loading: false,
        currentPage: 1,
        perPage: 50,
        total: 0,
        lastPage: 1,
      },
    });

    expect(wrapper.text()).toContain('No cars found');
  });
});
```

---

## File Checklist

```
[ ] resources/admin/js/types/car.ts
[ ] resources/admin/js/services/carService.ts
[ ] resources/admin/js/stores/carStore.ts
[ ] resources/admin/js/views/cars/CarListView.vue
[ ] resources/admin/js/views/cars/CarBrandListView.vue
[ ] resources/admin/js/views/cars/components/CarTable.vue
[ ] resources/admin/js/views/cars/components/CarFilters.vue
[ ] resources/admin/js/views/cars/components/BrandTable.vue
[ ] resources/admin/js/views/cars/components/ImportDialog.vue
[ ] resources/admin/js/views/cars/__tests__/CarListView.test.ts
[ ] resources/admin/js/views/cars/__tests__/CarTable.test.ts
[ ] Update resources/admin/js/router/index.ts
[ ] Update admin sidebar navigation
```

---

## UI/UX Considerations

### Design Patterns
- Use PrimeVue DataTable for consistent table styling
- Use PrimeVue Toast for import result notifications
- Use PrimeVue Dialog for detailed import results
- Follow admin dashboard styling patterns

### Accessibility
- Proper labels on all form inputs
- Loading states clearly indicated
- Error messages prominently displayed
- Keyboard navigation support

### Responsive Design
- Table scrolls horizontally on small screens
- Filters stack vertically on mobile
- Pagination adapts to screen size

---

## Dependencies

All required dependencies are already in the project:
- Vue 3
- Pinia
- PrimeVue 4
- Vue Router 4
- Axios
- TypeScript
