# Competition Creation - Frontend Implementation Plan

**Version:** 1.0
**Last Updated:** January 2025
**Application:** User Dashboard (`app.virtualracingleagues.localhost`)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Type Definitions](#type-definitions)
4. [Service Layer](#service-layer)
5. [Store Management](#store-management)
6. [Components Architecture](#components-architecture)
7. [Views & Routing](#views--routing)
8. [User Flows](#user-flows)
9. [Form Validation Strategy](#form-validation-strategy)
10. [Testing Strategy](#testing-strategy)
11. [Implementation Order](#implementation-order)
12. [Questions & Ambiguities](#questions--ambiguities)

---

## Overview

### Feature Summary

The Competition Creation feature allows users to create platform-specific racing competitions within their leagues. A competition is a container for seasons and represents a specific racing series (e.g., "Sunday Night Racing", "GT3 Championship").

### Key Design Principles

- **Minimal Form Fields**: Only name, platform, description, and logo (v1 approach)
- **Platform Immutability**: Platform cannot be changed after creation
- **Progressive Enhancement**: Guide users to create seasons after competition creation
- **Consistent Patterns**: Follow existing League and Driver management patterns
- **Drawer-Based Forms**: Use PrimeVue Drawer for create/edit forms
- **Toast Notifications**: Provide user feedback via PrimeVue Toast
- **Type Safety**: Full TypeScript coverage

### Related Backend Documentation

- Backend API endpoints will be defined in User Backend Guide
- Follow DDD patterns (Domain, Application, Infrastructure layers)
- RESTful API: `/api/leagues/{leagueId}/competitions`

---

## Architecture Summary

### Component Hierarchy

```
LeagueDetail.vue (existing)
  └─ Competitions Tab/Section
      ├─ CompetitionList.vue (list view with cards)
      │   ├─ CompetitionCard.vue (individual competition card)
      │   │   └─ CompetitionCardMenu.vue (actions menu)
      │   └─ EmptyCompetitionState.vue (when no competitions)
      │
      ├─ CompetitionFormDrawer.vue (create/edit drawer)
      │   ├─ DrawerHeader (common component)
      │   ├─ CompetitionFormContent.vue (form fields)
      │   │   ├─ FormLabel (common)
      │   │   ├─ FormError (common)
      │   │   ├─ FormInputGroup (common)
      │   │   └─ ImageUpload (common)
      │   └─ CompetitionFormActions.vue (submit/cancel buttons)
      │
      ├─ CompetitionDeleteDialog.vue (confirmation dialog)
      │
      └─ CompetitionSuccessModal.vue (post-creation success screen)

CompetitionDetail.vue (new view)
  ├─ CompetitionHeader.vue (header with logo, name, platform)
  ├─ CompetitionTabs.vue (Overview | Seasons | Drivers | Settings)
  ├─ CompetitionOverview.vue (overview tab content)
  ├─ CompetitionSeasons.vue (seasons tab - future)
  ├─ CompetitionDrivers.vue (drivers tab - future)
  └─ CompetitionSettings.vue (settings tab)
      ├─ CompetitionSettingsForm.vue (edit competition details)
      ├─ CompetitionArchiveSection.vue (archive competition)
      └─ CompetitionDeleteSection.vue (danger zone)
```

### File Structure

```
resources/user/js/
├── types/
│   └── competition.ts                    # TypeScript types
├── services/
│   └── competitionService.ts             # API service layer
├── stores/
│   └── competitionStore.ts               # Pinia store
├── composables/
│   ├── useCompetitionValidation.ts       # Form validation logic
│   └── useCompetitionSlug.ts             # Slug generation (if needed)
├── components/
│   └── competition/
│       ├── CompetitionList.vue
│       ├── CompetitionCard.vue
│       ├── CompetitionCardMenu.vue
│       ├── EmptyCompetitionState.vue
│       ├── CompetitionFormDrawer.vue
│       ├── CompetitionFormContent.vue
│       ├── CompetitionFormActions.vue
│       ├── CompetitionDeleteDialog.vue
│       ├── CompetitionSuccessModal.vue
│       ├── CompetitionHeader.vue
│       ├── CompetitionTabs.vue
│       ├── CompetitionOverview.vue
│       ├── CompetitionSettings.vue
│       ├── CompetitionSettingsForm.vue
│       ├── CompetitionArchiveSection.vue
│       ├── CompetitionDeleteSection.vue
│       └── __tests__/
│           ├── CompetitionList.test.ts
│           ├── CompetitionCard.test.ts
│           ├── CompetitionFormDrawer.test.ts
│           └── competitionStore.test.ts
├── views/
│   └── CompetitionDetail.vue              # Competition detail page
└── router/
    └── index.ts                           # Route definitions (update)
```

---

## Type Definitions

### Location: `resources/user/js/types/competition.ts`

```typescript
/**
 * Competition-related TypeScript types and interfaces
 */

/**
 * Platform reference interface (subset of League Platform)
 */
export interface CompetitionPlatform {
  id: number;
  name: string;
  slug: string;
}

/**
 * Competition status options
 */
export type CompetitionStatus = 'active' | 'archived';

/**
 * Competition entity (from backend)
 */
export interface Competition {
  id: number;
  league_id: number;
  name: string;
  slug: string;
  description: string | null;
  platform_id: number;
  platform?: CompetitionPlatform; // Eager loaded platform data
  logo_url: string | null;
  status: CompetitionStatus;
  is_archived: boolean;
  archived_at: string | null;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;

  // Stats (optional - from backend aggregations)
  stats?: CompetitionStats;
}

/**
 * Competition statistics
 */
export interface CompetitionStats {
  total_seasons: number;
  active_seasons: number;
  total_drivers: number;
  total_races: number;
  next_race_date?: string | null;
}

/**
 * Request payload for creating a competition
 */
export interface CreateCompetitionRequest {
  name: string;                    // 3-100 characters, required
  description?: string;            // 0-1000 characters, optional
  platform_id: number;             // Required
  logo?: File;                     // Optional file upload
}

/**
 * Request payload for updating a competition
 */
export interface UpdateCompetitionRequest {
  name?: string;                   // 3-100 characters
  description?: string | null;     // 0-1000 characters, can be cleared
  logo?: File | null;              // New logo or null to remove
}

/**
 * Form data for competition creation/edit (internal state)
 */
export interface CompetitionForm {
  name: string;
  description: string;
  platform_id: number | null;
  logo: File | null;
  logo_url: string | null;         // Existing logo URL (for edit mode)
}

/**
 * Form validation errors
 */
export interface CompetitionFormErrors {
  name?: string;
  description?: string;
  platform_id?: string;
  logo?: string;
}

/**
 * Archive competition request
 */
export interface ArchiveCompetitionRequest {
  // No payload needed - backend handles archiving
}

/**
 * Delete competition confirmation
 */
export interface DeleteCompetitionConfirmation {
  confirmation_text: string;       // Must be "DELETE"
}

/**
 * Competition list filters
 */
export interface CompetitionFilters {
  status?: CompetitionStatus | 'all';
  platform_id?: number;
  search?: string;
}

/**
 * Slug check response (if backend provides slug validation)
 */
export interface CompetitionSlugCheckResponse {
  available: boolean;
  slug: string;
  suggestion: string | null;
}
```

### Integration with Existing Types

Update `resources/user/js/types/league.ts` to include competitions:

```typescript
/**
 * League interface with competitions count
 */
export interface League {
  // ... existing fields
  competitions_count?: number;     // Add optional count
}
```

---

## Service Layer

### Location: `resources/user/js/services/competitionService.ts`

```typescript
/**
 * Competition API Service
 * Handles all HTTP requests related to competition management within leagues
 */

import { apiClient } from './api';
import type {
  Competition,
  CreateCompetitionRequest,
  UpdateCompetitionRequest,
  ArchiveCompetitionRequest,
  DeleteCompetitionConfirmation,
  CompetitionFilters,
} from '@user/types/competition';
import type { AxiosResponse } from 'axios';

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Get all competitions for a league
 * @param leagueId - League ID
 * @param filters - Optional filters (status, platform, search)
 */
export async function getLeagueCompetitions(
  leagueId: number,
  filters?: CompetitionFilters,
): Promise<Competition[]> {
  const response: AxiosResponse<ApiResponse<Competition[]>> = await apiClient.get(
    `/leagues/${leagueId}/competitions`,
    { params: filters },
  );
  return response.data.data;
}

/**
 * Get a specific competition by ID
 * @param leagueId - League ID
 * @param competitionId - Competition ID
 */
export async function getCompetition(
  leagueId: number,
  competitionId: number,
): Promise<Competition> {
  const response: AxiosResponse<ApiResponse<Competition>> = await apiClient.get(
    `/leagues/${leagueId}/competitions/${competitionId}`,
  );
  return response.data.data;
}

/**
 * Create a new competition
 * @param leagueId - League ID
 * @param formData - FormData containing competition info and logo
 */
export async function createCompetition(
  leagueId: number,
  formData: FormData,
): Promise<Competition> {
  const response: AxiosResponse<ApiResponse<Competition>> = await apiClient.post(
    `/leagues/${leagueId}/competitions`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data.data;
}

/**
 * Update an existing competition
 * @param leagueId - League ID
 * @param competitionId - Competition ID
 * @param formData - FormData containing updates
 */
export async function updateCompetition(
  leagueId: number,
  competitionId: number,
  formData: FormData,
): Promise<Competition> {
  // Laravel method spoofing for PUT with multipart/form-data
  formData.append('_method', 'PUT');

  const response: AxiosResponse<ApiResponse<Competition>> = await apiClient.post(
    `/leagues/${leagueId}/competitions/${competitionId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data.data;
}

/**
 * Archive a competition (soft delete, preserves data)
 * @param leagueId - League ID
 * @param competitionId - Competition ID
 */
export async function archiveCompetition(
  leagueId: number,
  competitionId: number,
): Promise<void> {
  await apiClient.post(`/leagues/${leagueId}/competitions/${competitionId}/archive`);
}

/**
 * Delete a competition permanently (hard delete)
 * @param leagueId - League ID
 * @param competitionId - Competition ID
 * @param confirmation - Confirmation object with "DELETE" text
 */
export async function deleteCompetition(
  leagueId: number,
  competitionId: number,
  confirmation: DeleteCompetitionConfirmation,
): Promise<void> {
  await apiClient.delete(`/leagues/${leagueId}/competitions/${competitionId}`, {
    data: confirmation,
  });
}

/**
 * Build FormData from CompetitionForm for creation
 * @param form - Competition form data
 */
export function buildCompetitionFormData(form: {
  name: string;
  description: string;
  platform_id: number;
  logo: File | null;
}): FormData {
  const formData = new FormData();

  formData.append('name', form.name);
  formData.append('platform_id', form.platform_id.toString());

  if (form.description) {
    formData.append('description', form.description);
  }

  if (form.logo) {
    formData.append('logo', form.logo);
  }

  return formData;
}

/**
 * Build FormData from CompetitionForm for update
 * @param form - Competition update form data
 */
export function buildUpdateCompetitionFormData(form: {
  name?: string;
  description?: string | null;
  logo?: File | null;
}): FormData {
  const formData = new FormData();

  if (form.name !== undefined) {
    formData.append('name', form.name);
  }

  if (form.description !== undefined) {
    formData.append('description', form.description || '');
  }

  if (form.logo !== undefined && form.logo !== null) {
    formData.append('logo', form.logo);
  }

  return formData;
}
```

---

## Store Management

### Location: `resources/user/js/stores/competitionStore.ts`

```typescript
/**
 * Competition Store
 * Manages competition-related state and operations within leagues
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Competition,
  CompetitionFilters,
  CompetitionForm,
} from '@user/types/competition';
import {
  getLeagueCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  archiveCompetition,
  deleteCompetition,
  buildCompetitionFormData,
  buildUpdateCompetitionFormData,
} from '@user/services/competitionService';

export const useCompetitionStore = defineStore('competition', () => {
  // State
  const competitions = ref<Competition[]>([]);
  const currentCompetition = ref<Competition | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeCompetitions = computed(() =>
    competitions.value.filter((c) => !c.is_archived),
  );

  const archivedCompetitions = computed(() =>
    competitions.value.filter((c) => c.is_archived),
  );

  const competitionsByPlatform = computed(() => {
    const grouped: Record<number, Competition[]> = {};
    competitions.value.forEach((comp) => {
      if (!grouped[comp.platform_id]) {
        grouped[comp.platform_id] = [];
      }
      grouped[comp.platform_id].push(comp);
    });
    return grouped;
  });

  // Actions

  /**
   * Fetch all competitions for a league
   * @param leagueId - League ID
   * @param filters - Optional filters
   */
  async function fetchCompetitions(
    leagueId: number,
    filters?: CompetitionFilters,
  ): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      competitions.value = await getLeagueCompetitions(leagueId, filters);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load competitions';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a specific competition
   * @param leagueId - League ID
   * @param competitionId - Competition ID
   */
  async function fetchCompetition(leagueId: number, competitionId: number): Promise<Competition> {
    loading.value = true;
    error.value = null;

    try {
      const competition = await getCompetition(leagueId, competitionId);
      currentCompetition.value = competition;
      return competition;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load competition';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new competition
   * @param leagueId - League ID
   * @param form - Competition form data
   */
  async function createNewCompetition(leagueId: number, form: CompetitionForm): Promise<Competition> {
    if (!form.platform_id) {
      throw new Error('Platform is required');
    }

    loading.value = true;
    error.value = null;

    try {
      const formData = buildCompetitionFormData({
        name: form.name,
        description: form.description,
        platform_id: form.platform_id,
        logo: form.logo,
      });

      const competition = await createCompetition(leagueId, formData);
      competitions.value.push(competition);
      currentCompetition.value = competition;
      return competition;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create competition';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing competition
   * @param leagueId - League ID
   * @param competitionId - Competition ID
   * @param form - Update form data
   */
  async function updateExistingCompetition(
    leagueId: number,
    competitionId: number,
    form: Partial<CompetitionForm>,
  ): Promise<Competition> {
    loading.value = true;
    error.value = null;

    try {
      const formData = buildUpdateCompetitionFormData({
        name: form.name,
        description: form.description,
        logo: form.logo,
      });

      const updatedCompetition = await updateCompetition(leagueId, competitionId, formData);

      // Update in local state
      const index = competitions.value.findIndex((c) => c.id === competitionId);
      if (index !== -1) {
        competitions.value[index] = updatedCompetition;
      }

      // Update current competition if it's the one being edited
      if (currentCompetition.value?.id === competitionId) {
        currentCompetition.value = updatedCompetition;
      }

      return updatedCompetition;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update competition';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Archive a competition (soft delete)
   * @param leagueId - League ID
   * @param competitionId - Competition ID
   */
  async function archiveExistingCompetition(leagueId: number, competitionId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await archiveCompetition(leagueId, competitionId);

      // Update local state to mark as archived
      const index = competitions.value.findIndex((c) => c.id === competitionId);
      if (index !== -1) {
        competitions.value[index].is_archived = true;
        competitions.value[index].archived_at = new Date().toISOString();
      }

      if (currentCompetition.value?.id === competitionId) {
        currentCompetition.value.is_archived = true;
        currentCompetition.value.archived_at = new Date().toISOString();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive competition';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a competition permanently
   * @param leagueId - League ID
   * @param competitionId - Competition ID
   * @param confirmationText - Must be "DELETE"
   */
  async function deleteExistingCompetition(
    leagueId: number,
    competitionId: number,
    confirmationText: string,
  ): Promise<void> {
    if (confirmationText !== 'DELETE') {
      throw new Error('Confirmation text must be "DELETE"');
    }

    loading.value = true;
    error.value = null;

    try {
      await deleteCompetition(leagueId, competitionId, { confirmation_text: confirmationText });

      // Remove from local state
      competitions.value = competitions.value.filter((c) => c.id !== competitionId);

      if (currentCompetition.value?.id === competitionId) {
        currentCompetition.value = null;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete competition';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear error message
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Clear current competition
   */
  function clearCurrentCompetition(): void {
    currentCompetition.value = null;
  }

  return {
    // State
    competitions,
    currentCompetition,
    loading,
    error,

    // Getters
    activeCompetitions,
    archivedCompetitions,
    competitionsByPlatform,

    // Actions
    fetchCompetitions,
    fetchCompetition,
    createNewCompetition,
    updateExistingCompetition,
    archiveExistingCompetition,
    deleteExistingCompetition,
    clearError,
    clearCurrentCompetition,
  };
});
```

---

## Components Architecture

### 1. CompetitionList.vue

**Purpose**: Display a list of competitions for a league with create/edit/delete actions.

**Location**: `resources/user/js/components/competition/CompetitionList.vue`

**Props**:
```typescript
interface Props {
  leagueId: number;
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'competition-created', competition: Competition): void;
  (e: 'competition-updated', competition: Competition): void;
  (e: 'competition-deleted', competitionId: number): void;
}
```

**State**:
- `showCreateDrawer: boolean`
- `showEditDrawer: boolean`
- `showDeleteDialog: boolean`
- `editingCompetition: Competition | null`
- `deletingCompetition: Competition | null`

**Composables/Stores**:
- `useCompetitionStore()`
- `useLeagueStore()` (for platform list)
- `useToast()` (PrimeVue)

**Methods**:
- `handleCreateClick()` - Opens create drawer
- `handleEditClick(competition)` - Opens edit drawer
- `handleDeleteClick(competition)` - Opens delete dialog
- `handleCompetitionCreated(competition)` - Emit event + show success
- `handleCompetitionUpdated(competition)` - Emit event + toast
- `handleCompetitionDeleted(competitionId)` - Emit event + toast

**Template Structure**:
```vue
<div class="competition-list">
  <!-- Header with "New Competition" button -->
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">Competitions</h2>
    <Button @click="handleCreateClick">+ New Competition</Button>
  </div>

  <!-- Empty state if no competitions -->
  <EmptyCompetitionState v-if="competitions.length === 0" @create="handleCreateClick" />

  <!-- Competition cards grid -->
  <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <CompetitionCard
      v-for="comp in competitions"
      :key="comp.id"
      :competition="comp"
      @edit="handleEditClick"
      @delete="handleDeleteClick"
      @view="navigateToCompetition"
    />
  </div>

  <!-- Create/Edit Drawer -->
  <CompetitionFormDrawer
    v-model:visible="showCreateDrawer"
    :league-id="leagueId"
    @competition-saved="handleCompetitionCreated"
  />

  <CompetitionFormDrawer
    v-model:visible="showEditDrawer"
    :league-id="leagueId"
    :competition="editingCompetition"
    is-edit-mode
    @competition-saved="handleCompetitionUpdated"
  />

  <!-- Delete Dialog -->
  <CompetitionDeleteDialog
    v-model:visible="showDeleteDialog"
    :competition="deletingCompetition"
    @confirmed="handleCompetitionDeleted"
  />
</div>
```

**PrimeVue Components Used**:
- Button
- Card (via CompetitionCard)
- Skeleton (for loading states)

---

### 2. CompetitionCard.vue

**Purpose**: Display a single competition card with quick actions.

**Location**: `resources/user/js/components/competition/CompetitionCard.vue`

**Props**:
```typescript
interface Props {
  competition: Competition;
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'view'): void;
  (e: 'edit'): void;
  (e: 'delete'): void;
}
```

**Composables**:
- `useImageUrl()` - For logo handling
- `useDateFormatter()` - For date display

**Template Structure**:
```vue
<Card class="competition-card">
  <template #header>
    <img :src="logoUrl" :alt="competition.name" class="w-full h-48 object-cover" />
  </template>

  <template #title>
    <div class="flex justify-between items-start">
      <span>{{ competition.name }}</span>
      <CompetitionCardMenu @edit="emit('edit')" @delete="emit('delete')" />
    </div>
  </template>

  <template #subtitle>
    <Chip :label="competition.platform?.name" icon="pi pi-gamepad" />
  </template>

  <template #content>
    <p v-if="competition.description" class="text-gray-600">{{ competition.description }}</p>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-2 mt-4">
      <div>
        <span class="text-sm text-gray-500">Seasons</span>
        <p class="font-bold">{{ competition.stats?.total_seasons || 0 }}</p>
      </div>
      <div>
        <span class="text-sm text-gray-500">Drivers</span>
        <p class="font-bold">{{ competition.stats?.total_drivers || 0 }}</p>
      </div>
    </div>

    <!-- Next race indicator -->
    <div v-if="competition.stats?.next_race_date" class="mt-4">
      <span class="text-sm text-gray-500">Next race:</span>
      <p>{{ formatDate(competition.stats.next_race_date) }}</p>
    </div>
  </template>

  <template #footer>
    <div class="flex gap-2">
      <Button label="View" @click="emit('view')" outlined />
      <Button label="Manage" @click="emit('view')" />
    </div>
  </template>
</Card>
```

**PrimeVue Components Used**:
- Card
- Chip
- Button
- Menu (via CompetitionCardMenu)

---

### 3. CompetitionFormDrawer.vue

**Purpose**: Drawer form for creating or editing competitions.

**Location**: `resources/user/js/components/competition/CompetitionFormDrawer.vue`

**Props**:
```typescript
interface Props {
  visible: boolean;
  leagueId: number;
  competition?: Competition | null;  // For edit mode
  isEditMode?: boolean;
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'competition-saved', competition: Competition): void;
}
```

**State**:
```typescript
const form = reactive<CompetitionForm>({
  name: '',
  description: '',
  platform_id: null,
  logo: null,
  logo_url: null,
});

const errors = reactive<CompetitionFormErrors>({});
const isSubmitting = ref(false);
const isLoadingData = ref(false);
```

**Composables/Stores**:
- `useCompetitionStore()`
- `useLeagueStore()` (for platform list)
- `useToast()`
- `useCompetitionValidation()` (custom composable)

**Watchers**:
```typescript
watch(() => props.visible, async (visible) => {
  if (visible) {
    await loadPlatforms();
    if (props.isEditMode && props.competition) {
      loadCompetitionData();
    } else {
      resetForm();
    }
  }
});
```

**Methods**:
- `loadPlatforms()` - Fetch platform list
- `loadCompetitionData()` - Pre-fill form in edit mode
- `validateForm()` - Client-side validation
- `handleSubmit()` - Submit form
- `handleCancel()` - Close drawer
- `resetForm()` - Clear form state

**Validation Rules**:
- Name: 3-100 characters, required
- Platform: Required (only in create mode)
- Description: 0-1000 characters, optional
- Logo: PNG/JPG, max 2MB, min 200x200, recommended 500x500

**Template Structure**:
```vue
<Drawer v-model:visible="localVisible" position="right" class="w-full md:w-[40rem]">
  <DrawerHeader
    :title="isEditMode ? 'Edit Competition' : 'Create Competition'"
    :subtitle="isEditMode ? 'Update competition details' : 'Create a new competition'"
    @close="handleCancel"
  />

  <DrawerLoading v-if="isLoadingData" />

  <div v-else class="p-6">
    <!-- Competition Name -->
    <FormInputGroup label="Competition Name" required error-id="name">
      <InputText
        v-model="form.name"
        placeholder="e.g., Sunday Night Racing, GT3 Championship"
        :class="{ 'p-invalid': errors.name }"
        :disabled="isSubmitting"
        maxlength="100"
      />
      <template #hint>
        <span class="text-sm text-gray-500">{{ form.name.length }}/100 characters</span>
      </template>
      <FormError :error="errors.name" />
    </FormInputGroup>

    <!-- Platform Selection (disabled in edit mode) -->
    <FormInputGroup label="Platform" required error-id="platform_id">
      <Select
        v-model="form.platform_id"
        :options="platformOptions"
        option-label="name"
        option-value="id"
        placeholder="Select a platform"
        :class="{ 'p-invalid': errors.platform_id }"
        :disabled="isEditMode || isSubmitting"
      />
      <template #hint v-if="isEditMode">
        <Message severity="info" :closable="false">
          Platform cannot be changed after creation
        </Message>
      </template>
      <FormError :error="errors.platform_id" />
    </FormInputGroup>

    <!-- Description -->
    <FormInputGroup label="Description" optional error-id="description">
      <Textarea
        v-model="form.description"
        rows="5"
        placeholder="Describe this competition, typical race format, skill level..."
        :class="{ 'p-invalid': errors.description }"
        :disabled="isSubmitting"
        maxlength="1000"
      />
      <template #hint>
        <span class="text-sm text-gray-500">{{ form.description.length }}/1000 characters</span>
      </template>
      <FormError :error="errors.description" />
    </FormInputGroup>

    <!-- Logo Upload -->
    <FormInputGroup label="Competition Logo" optional error-id="logo">
      <ImageUpload
        v-model="form.logo"
        :existing-image-url="form.logo_url"
        accept="image/png,image/jpeg,image/jpg"
        :max-size="2 * 1024 * 1024"
        :min-dimensions="{ width: 200, height: 200 }"
        :recommended-dimensions="{ width: 500, height: 500 }"
        fallback-text="If not uploaded, league logo will be used"
      />
      <FormError :error="errors.logo" />
    </FormInputGroup>

    <!-- Info message about season configuration -->
    <Message severity="info" :closable="false" class="mt-4">
      <PhInfo class="mr-2" />
      Car restrictions, race types, and other details will be configured when you create seasons.
    </Message>
  </div>

  <!-- Footer Actions -->
  <template #footer>
    <div class="flex gap-2 justify-end p-6 border-t">
      <Button label="Cancel" @click="handleCancel" outlined :disabled="isSubmitting" />
      <Button
        :label="isEditMode ? 'Save Changes' : 'Create Competition'"
        @click="handleSubmit"
        :loading="isSubmitting"
        :disabled="!canSubmit"
      />
    </div>
  </template>
</Drawer>
```

**PrimeVue Components Used**:
- Drawer
- InputText
- Select
- Textarea
- Button
- Message
- Custom: DrawerHeader, DrawerLoading, FormInputGroup, FormError, ImageUpload

---

### 4. EmptyCompetitionState.vue

**Purpose**: Empty state when league has no competitions.

**Location**: `resources/user/js/components/competition/EmptyCompetitionState.vue`

**Props**:
```typescript
interface Props {
  // No props needed - purely presentational
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'create'): void;
}
```

**Template Structure**:
```vue
<Card class="text-center py-12">
  <template #content>
    <PhFlagCheckered :size="64" class="mx-auto text-gray-400 mb-4" />
    <h3 class="text-xl font-bold mb-2">No Competitions Yet</h3>
    <p class="text-gray-600 mb-6">
      Create your first competition to start organizing races, managing drivers, and tracking results.
    </p>
    <Button
      label="Create Your First Competition"
      icon="pi pi-plus"
      @click="emit('create')"
      size="large"
    />
  </template>
</Card>
```

**PrimeVue Components Used**:
- Card
- Button

---

### 5. CompetitionSuccessModal.vue

**Purpose**: Success screen shown after competition creation with CTA to create first season.

**Location**: `resources/user/js/components/competition/CompetitionSuccessModal.vue`

**Props**:
```typescript
interface Props {
  visible: boolean;
  competition: Competition | null;
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'create-season'): void;
  (e: 'edit-competition'): void;
  (e: 'go-to-league'): void;
}
```

**Template Structure**:
```vue
<Dialog v-model:visible="localVisible" :modal="true" :closable="true" :style="{ width: '40rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <PhCheckCircle :size="32" weight="fill" class="text-green-500" />
      <span class="text-2xl font-bold">Competition Created!</span>
    </div>
  </template>

  <div class="text-center py-4">
    <!-- Competition Logo -->
    <img
      v-if="competition?.logo_url"
      :src="competition.logo_url"
      :alt="competition.name"
      class="w-24 h-24 mx-auto rounded-lg mb-4 object-cover"
    />

    <!-- Competition Name & Platform -->
    <h3 class="text-xl font-bold mb-2">{{ competition?.name }}</h3>
    <Chip
      :label="competition?.platform?.name"
      icon="pi pi-gamepad"
      class="mb-4"
    />

    <!-- Success Message -->
    <p class="text-gray-600 mb-6">
      Your competition is ready. Now create your first season to start racing!
    </p>

    <!-- Primary CTA -->
    <Button
      label="Create First Season"
      icon="pi pi-arrow-right"
      icon-pos="right"
      @click="emit('create-season')"
      size="large"
      class="mb-4"
    />

    <!-- Secondary Actions -->
    <div class="flex flex-col gap-2">
      <Button
        label="Edit Competition Details"
        @click="emit('edit-competition')"
        outlined
        text
      />
      <Button
        label="Back to League Dashboard"
        @click="emit('go-to-league')"
        outlined
        text
      />
    </div>
  </div>
</Dialog>
```

**PrimeVue Components Used**:
- Dialog
- Button
- Chip

---

### 6. CompetitionDeleteDialog.vue

**Purpose**: Confirmation dialog for competition deletion with "DELETE" text input.

**Location**: `resources/user/js/components/competition/CompetitionDeleteDialog.vue`

**Props**:
```typescript
interface Props {
  visible: boolean;
  competition: Competition | null;
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'confirmed', competitionId: number): void;
}
```

**State**:
```typescript
const confirmationText = ref('');
const isDeleting = ref(false);
```

**Computed**:
```typescript
const canDelete = computed(() => confirmationText.value === 'DELETE');
```

**Template Structure**:
```vue
<Dialog v-model:visible="localVisible" :modal="true" :style="{ width: '40rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <PhWarning :size="32" weight="fill" class="text-red-500" />
      <span class="text-xl font-bold">Delete Competition</span>
    </div>
  </template>

  <div class="py-4">
    <Message severity="error" :closable="false" class="mb-4">
      <strong>DANGER ZONE</strong>
    </Message>

    <p class="mb-4">
      Deleting <strong>{{ competition?.name }}</strong> will permanently remove:
    </p>

    <ul class="list-disc pl-6 mb-4 space-y-2">
      <li>All seasons in this competition</li>
      <li>All race results and standings</li>
      <li>All driver associations</li>
      <li>All historical data</li>
    </ul>

    <Message severity="warn" :closable="false" class="mb-4">
      This action CANNOT be undone!
    </Message>

    <FormInputGroup label='Type "DELETE" to confirm' required>
      <InputText
        v-model="confirmationText"
        placeholder="DELETE"
        :disabled="isDeleting"
        @keyup.enter="handleConfirm"
      />
    </FormInputGroup>
  </div>

  <template #footer>
    <div class="flex gap-2 justify-end">
      <Button label="Cancel" @click="handleCancel" outlined :disabled="isDeleting" />
      <Button
        label="Delete Competition"
        severity="danger"
        @click="handleConfirm"
        :loading="isDeleting"
        :disabled="!canDelete"
      />
    </div>
  </template>
</Dialog>
```

**PrimeVue Components Used**:
- Dialog
- Message
- InputText
- Button

---

### 7. CompetitionHeader.vue

**Purpose**: Header section for competition detail view.

**Location**: `resources/user/js/components/competition/CompetitionHeader.vue`

**Props**:
```typescript
interface Props {
  competition: Competition;
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'edit'): void;
  (e: 'back-to-league'): void;
}
```

**Template Structure**:
```vue
<div class="competition-header bg-white shadow-sm p-6 mb-6">
  <!-- Back button -->
  <Button
    icon="pi pi-arrow-left"
    label="Back to League"
    text
    @click="emit('back-to-league')"
    class="mb-4"
  />

  <div class="flex items-start gap-6">
    <!-- Competition Logo -->
    <img
      :src="logoUrl"
      :alt="competition.name"
      class="w-24 h-24 rounded-lg object-cover"
    />

    <!-- Competition Info -->
    <div class="flex-1">
      <div class="flex justify-between items-start mb-2">
        <h1 class="text-3xl font-bold">{{ competition.name }}</h1>
        <Button icon="pi pi-cog" label="Edit" @click="emit('edit')" outlined />
      </div>

      <!-- Platform Badge -->
      <Chip
        :label="competition.platform?.name"
        icon="pi pi-gamepad"
        class="mb-2"
      />

      <!-- Description -->
      <p v-if="competition.description" class="text-gray-600 mb-4">
        {{ competition.description }}
      </p>

      <!-- Stats -->
      <div class="flex gap-6">
        <div>
          <span class="text-sm text-gray-500">Seasons</span>
          <p class="text-xl font-bold">{{ competition.stats?.total_seasons || 0 }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">Drivers</span>
          <p class="text-xl font-bold">{{ competition.stats?.total_drivers || 0 }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">Races</span>
          <p class="text-xl font-bold">{{ competition.stats?.total_races || 0 }}</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

**PrimeVue Components Used**:
- Button
- Chip

---

## Views & Routing

### 1. CompetitionDetail.vue

**Purpose**: Main view for competition detail page with tabs.

**Location**: `resources/user/js/views/CompetitionDetail.vue`

**Route**: `/leagues/:leagueId/competitions/:competitionId`

**State**:
```typescript
const route = useRoute();
const router = useRouter();
const toast = useToast();
const competitionStore = useCompetitionStore();

const competition = ref<Competition | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('overview');
const showEditDrawer = ref(false);

const leagueId = computed(() => parseInt(route.params.leagueId as string, 10));
const competitionId = computed(() => parseInt(route.params.competitionId as string, 10));
```

**Lifecycle**:
```typescript
onMounted(async () => {
  await loadCompetition();
});

async function loadCompetition() {
  isLoading.value = true;
  error.value = null;

  try {
    competition.value = await competitionStore.fetchCompetition(
      leagueId.value,
      competitionId.value,
    );
  } catch (err) {
    error.value = 'Failed to load competition';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load competition',
      life: 5000,
    });
  } finally {
    isLoading.value = false;
  }
}
```

**Template Structure**:
```vue
<div class="container mx-auto px-4 py-8">
  <!-- Loading skeleton -->
  <Skeleton v-if="isLoading" height="400px" />

  <!-- Error state -->
  <Message v-else-if="error" severity="error">
    {{ error }}
  </Message>

  <!-- Competition content -->
  <div v-else-if="competition">
    <!-- Header -->
    <CompetitionHeader
      :competition="competition"
      @edit="showEditDrawer = true"
      @back-to-league="router.push({ name: 'league-detail', params: { id: leagueId } })"
    />

    <!-- Tabs -->
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="overview">Overview</Tab>
        <Tab value="seasons">Seasons</Tab>
        <Tab value="drivers">Drivers</Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="overview">
          <CompetitionOverview :competition="competition" />
        </TabPanel>

        <TabPanel value="seasons">
          <CompetitionSeasons :competition="competition" />
        </TabPanel>

        <TabPanel value="drivers">
          <CompetitionDrivers :competition="competition" />
        </TabPanel>

        <TabPanel value="settings">
          <CompetitionSettings
            :competition="competition"
            @updated="loadCompetition"
            @archived="handleArchived"
            @deleted="handleDeleted"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Edit Drawer -->
    <CompetitionFormDrawer
      v-model:visible="showEditDrawer"
      :league-id="leagueId"
      :competition="competition"
      is-edit-mode
      @competition-saved="handleCompetitionUpdated"
    />
  </div>
</div>
```

**PrimeVue Components Used**:
- Skeleton
- Message
- Tabs, TabList, Tab, TabPanels, TabPanel
- Custom: CompetitionHeader, CompetitionOverview, CompetitionSeasons, CompetitionDrivers, CompetitionSettings

---

### 2. Update LeagueDetail.vue

**Purpose**: Add competitions section/tab to existing league detail view.

**Location**: `resources/user/js/views/LeagueDetail.vue` (update existing)

**Changes**:
1. Add "Competitions" tab alongside existing tabs
2. Import and render `CompetitionList.vue`
3. Handle competition creation success flow

**Template Addition**:
```vue
<!-- Inside existing TabList -->
<Tab value="competitions">Competitions</Tab>

<!-- Inside TabPanels -->
<TabPanel value="competitions">
  <CompetitionList
    :league-id="leagueIdNumber"
    @competition-created="handleCompetitionCreated"
  />
</TabPanel>
```

**Methods Addition**:
```typescript
function handleCompetitionCreated(competition: Competition) {
  // Show success modal with option to create season
  showCompetitionSuccessModal.value = true;
  createdCompetition.value = competition;
}

function handleCreateSeason() {
  // Navigate to season creation (future feature)
  router.push({
    name: 'competition-detail',
    params: {
      leagueId: leagueId.value,
      competitionId: createdCompetition.value.id,
    },
  });
}
```

---

### 3. Router Configuration

**Location**: `resources/user/js/router/index.ts`

**New Routes**:
```typescript
{
  path: '/leagues/:leagueId/competitions/:competitionId',
  name: 'competition-detail',
  component: () => import('@user/views/CompetitionDetail.vue'),
  meta: {
    title: 'Competition Details',
    requiresAuth: true,
  },
}
```

---

## User Flows

### Flow 1: Create Competition (First Competition)

1. User navigates to League Detail page (`/leagues/:id`)
2. User clicks "Competitions" tab
3. Empty state is shown with "Create Your First Competition" button
4. User clicks button → `CompetitionFormDrawer` opens
5. User fills form:
   - Name: "Sunday Night Racing"
   - Platform: "Gran Turismo 7"
   - Description: "Weekly GT3 racing every Sunday at 7 PM"
   - Logo: Uploads image (optional)
6. User clicks "Create Competition"
7. Client-side validation runs
8. API request sent to backend
9. Backend creates competition with slug generation
10. Success! `CompetitionSuccessModal` appears
11. User sees:
    - Competition name and logo
    - Platform badge
    - "Create First Season" button (primary CTA)
    - "Edit Competition Details" link
    - "Back to League Dashboard" link
12. User clicks "Create First Season" → Navigate to season creation (future feature)

### Flow 2: Create Competition (Additional Competition)

1. User is on League Detail → Competitions tab
2. Existing competitions shown in grid
3. User clicks "+ New Competition" button (top right)
4. `CompetitionFormDrawer` opens
5. User fills form
6. User clicks "Create Competition"
7. Competition created and added to list
8. Toast notification: "Competition created successfully!"
9. Drawer closes
10. New competition card appears in grid

### Flow 3: Edit Competition

1. User is on Competitions list
2. User clicks overflow menu (3 dots) on competition card
3. User selects "Edit" from menu
4. `CompetitionFormDrawer` opens in edit mode
5. Form pre-filled with current competition data
6. Platform field is disabled (cannot change)
7. User updates name, description, or logo
8. User clicks "Save Changes"
9. API request sent
10. Competition updated in store
11. Toast notification: "Competition updated successfully!"
12. Drawer closes
13. Competition card reflects changes

### Flow 4: View Competition Detail

1. User clicks "View" or "Manage" button on competition card
2. Navigate to `/leagues/:leagueId/competitions/:competitionId`
3. Competition detail page loads
4. Header shows competition info
5. Tabs: Overview | Seasons | Drivers | Settings
6. Overview tab is active by default
7. Empty state shown if no seasons: "Create Your First Season" CTA

### Flow 5: Delete Competition

1. User is on Competition Detail → Settings tab
2. User scrolls to "Danger Zone"
3. User clicks "Delete Competition" button
4. `CompetitionDeleteDialog` appears
5. Dialog shows warning about permanent deletion
6. User types "DELETE" in confirmation field
7. User clicks "Delete Competition" button
8. API request sent
9. Competition deleted from backend
10. Toast notification: "Competition deleted"
11. Navigate back to League Detail → Competitions tab
12. Competition removed from list

### Flow 6: Archive Competition

1. User is on Competition Detail → Settings tab
2. User clicks "Archive Competition" button
3. Confirm dialog appears
4. User confirms
5. API request sent
6. Competition archived (soft delete)
7. Toast notification: "Competition archived"
8. Competition marked as archived in UI
9. Option to restore (future feature)

---

## Form Validation Strategy

### Client-Side Validation

Use a composable for reusable validation logic.

**Location**: `resources/user/js/composables/useCompetitionValidation.ts`

```typescript
import { reactive, computed } from 'vue';
import type { CompetitionForm, CompetitionFormErrors } from '@user/types/competition';

export function useCompetitionValidation(form: CompetitionForm) {
  const errors = reactive<CompetitionFormErrors>({});

  /**
   * Validate competition name
   */
  function validateName(): string | undefined {
    if (!form.name || !form.name.trim()) {
      return 'Competition name is required';
    }
    if (form.name.trim().length < 3) {
      return 'Competition name must be at least 3 characters';
    }
    if (form.name.length > 100) {
      return 'Competition name must not exceed 100 characters';
    }
    return undefined;
  }

  /**
   * Validate platform selection
   */
  function validatePlatform(): string | undefined {
    if (!form.platform_id) {
      return 'Platform is required';
    }
    return undefined;
  }

  /**
   * Validate description
   */
  function validateDescription(): string | undefined {
    if (form.description && form.description.length > 1000) {
      return 'Description must not exceed 1000 characters';
    }
    return undefined;
  }

  /**
   * Validate logo file
   */
  function validateLogo(): string | undefined {
    if (!form.logo) {
      return undefined; // Optional field
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(form.logo.type)) {
      return 'Logo must be PNG or JPG format';
    }

    // Check file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (form.logo.size > maxSize) {
      return 'Logo must be less than 2MB';
    }

    return undefined;
  }

  /**
   * Validate all fields
   */
  function validateAll(): boolean {
    errors.name = validateName();
    errors.platform_id = validatePlatform();
    errors.description = validateDescription();
    errors.logo = validateLogo();

    return !errors.name && !errors.platform_id && !errors.description && !errors.logo;
  }

  /**
   * Clear all errors
   */
  function clearErrors(): void {
    errors.name = undefined;
    errors.platform_id = undefined;
    errors.description = undefined;
    errors.logo = undefined;
  }

  /**
   * Clear specific error
   */
  function clearError(field: keyof CompetitionFormErrors): void {
    errors[field] = undefined;
  }

  const isValid = computed(() => {
    return !errors.name && !errors.platform_id && !errors.description && !errors.logo;
  });

  const hasErrors = computed(() => {
    return !!(errors.name || errors.platform_id || errors.description || errors.logo);
  });

  return {
    errors,
    isValid,
    hasErrors,
    validateName,
    validatePlatform,
    validateDescription,
    validateLogo,
    validateAll,
    clearErrors,
    clearError,
  };
}
```

### Backend Validation

Backend will use Laravel Form Request validation:
- Name: `required|string|min:3|max:100`
- Platform: `required|exists:platforms,id` (create only)
- Description: `nullable|string|max:1000`
- Logo: `nullable|image|mimes:png,jpg,jpeg|max:2048|dimensions:min_width=200,min_height=200`

Backend will return validation errors in format:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name field is required."],
    "platform_id": ["The selected platform is invalid."]
  }
}
```

Frontend will map these errors to the `errors` reactive object.

---

## Testing Strategy

### Unit Tests

**Test Coverage**:
1. **Store Tests** (`competitionStore.test.ts`)
   - Test all actions (create, update, fetch, delete, archive)
   - Test computed getters (activeCompetitions, archivedCompetitions)
   - Test error handling
   - Test state mutations

2. **Service Tests** (`competitionService.test.ts`)
   - Mock apiClient
   - Test all service methods
   - Test request/response transformations
   - Test error scenarios

3. **Composable Tests** (`useCompetitionValidation.test.ts`)
   - Test validation rules
   - Test error state management
   - Test edge cases (empty strings, max lengths, etc.)

4. **Component Tests**:
   - `CompetitionCard.test.ts` - Render, emit events, display data
   - `CompetitionList.test.ts` - Empty state, list rendering, actions
   - `CompetitionFormDrawer.test.ts` - Form submission, validation, edit mode
   - `CompetitionDeleteDialog.test.ts` - Confirmation logic
   - `CompetitionSuccessModal.test.ts` - Modal display, CTA actions

**Example Test (Store)**:
```typescript
// resources/user/js/stores/__tests__/competitionStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCompetitionStore } from '../competitionStore';
import * as competitionService from '@user/services/competitionService';

vi.mock('@user/services/competitionService');

describe('Competition Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with empty state', () => {
    const store = useCompetitionStore();

    expect(store.competitions).toEqual([]);
    expect(store.currentCompetition).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('fetches competitions successfully', async () => {
    const mockCompetitions = [
      { id: 1, name: 'GT3 Series', platform_id: 1, league_id: 1 },
      { id: 2, name: 'F1 Championship', platform_id: 2, league_id: 1 },
    ];

    vi.mocked(competitionService.getLeagueCompetitions).mockResolvedValue(mockCompetitions);

    const store = useCompetitionStore();
    await store.fetchCompetitions(1);

    expect(store.competitions).toEqual(mockCompetitions);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('handles fetch error', async () => {
    vi.mocked(competitionService.getLeagueCompetitions).mockRejectedValue(
      new Error('Network error'),
    );

    const store = useCompetitionStore();

    await expect(store.fetchCompetitions(1)).rejects.toThrow('Network error');
    expect(store.error).toBe('Network error');
  });

  it('creates competition successfully', async () => {
    const mockCompetition = {
      id: 1,
      name: 'GT3 Series',
      platform_id: 1,
      league_id: 1,
    };

    vi.mocked(competitionService.createCompetition).mockResolvedValue(mockCompetition);

    const store = useCompetitionStore();
    const form = {
      name: 'GT3 Series',
      description: '',
      platform_id: 1,
      logo: null,
      logo_url: null,
    };

    const result = await store.createNewCompetition(1, form);

    expect(result).toEqual(mockCompetition);
    expect(store.competitions).toContain(mockCompetition);
    expect(store.currentCompetition).toEqual(mockCompetition);
  });
});
```

**Example Test (Component)**:
```typescript
// resources/user/js/components/competition/__tests__/CompetitionCard.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CompetitionCard from '../CompetitionCard.vue';
import type { Competition } from '@user/types/competition';

describe('CompetitionCard', () => {
  const mockCompetition: Competition = {
    id: 1,
    name: 'GT3 Championship',
    slug: 'gt3-championship',
    description: 'Weekly GT3 racing',
    platform_id: 1,
    platform: { id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' },
    logo_url: '/images/logo.png',
    status: 'active',
    is_archived: false,
    archived_at: null,
    league_id: 1,
    created_by_user_id: 1,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    stats: {
      total_seasons: 2,
      active_seasons: 1,
      total_drivers: 45,
      total_races: 10,
    },
  };

  it('renders competition name', () => {
    const wrapper = mount(CompetitionCard, {
      props: { competition: mockCompetition },
    });

    expect(wrapper.text()).toContain('GT3 Championship');
  });

  it('displays platform badge', () => {
    const wrapper = mount(CompetitionCard, {
      props: { competition: mockCompetition },
    });

    expect(wrapper.text()).toContain('Gran Turismo 7');
  });

  it('emits view event when View button clicked', async () => {
    const wrapper = mount(CompetitionCard, {
      props: { competition: mockCompetition },
    });

    await wrapper.find('[data-test="view-button"]').trigger('click');

    expect(wrapper.emitted('view')).toBeTruthy();
  });

  it('displays stats correctly', () => {
    const wrapper = mount(CompetitionCard, {
      props: { competition: mockCompetition },
    });

    expect(wrapper.text()).toContain('2'); // seasons
    expect(wrapper.text()).toContain('45'); // drivers
  });
});
```

### Integration Tests (Future - Vitest Component Testing)

- Test full user flows (create → success modal → navigate)
- Test drawer open/close with state persistence
- Test error handling and recovery

### E2E Tests (Playwright - Future)

- Test complete competition creation flow
- Test competition editing with image upload
- Test competition deletion with confirmation
- Test navigation between league and competition views

---

## Implementation Order

### Phase 1: Foundation (Week 1)

1. **Types** (`competition.ts`)
   - Define all TypeScript interfaces
   - Integrate with existing type system

2. **Service Layer** (`competitionService.ts`)
   - Implement all API methods
   - Add request/response transformations
   - Write unit tests

3. **Store** (`competitionStore.ts`)
   - Implement Pinia store with all actions
   - Add computed getters
   - Write unit tests

4. **Composables** (`useCompetitionValidation.ts`)
   - Implement validation logic
   - Write unit tests

### Phase 2: Core Components (Week 2)

5. **CompetitionFormDrawer.vue**
   - Implement create/edit form
   - Add validation
   - Handle image upload
   - Write component tests

6. **CompetitionCard.vue**
   - Implement card display
   - Add actions menu
   - Write component tests

7. **CompetitionList.vue**
   - Implement list view
   - Add empty state
   - Integrate create/edit/delete flows
   - Write component tests

8. **EmptyCompetitionState.vue**
   - Implement empty state
   - Write component tests

### Phase 3: Additional Components (Week 3)

9. **CompetitionSuccessModal.vue**
   - Implement success screen
   - Add CTAs
   - Write component tests

10. **CompetitionDeleteDialog.vue**
    - Implement delete confirmation
    - Add "DELETE" text validation
    - Write component tests

11. **CompetitionHeader.vue**
    - Implement header display
    - Add edit action
    - Write component tests

### Phase 4: Views & Integration (Week 4)

12. **CompetitionDetail.vue** (new view)
    - Implement detail view
    - Add tabs structure
    - Integrate header component
    - Add routing

13. **Update LeagueDetail.vue**
    - Add Competitions tab
    - Integrate CompetitionList
    - Handle success flow

14. **Router Updates**
    - Add competition detail route
    - Test navigation

### Phase 5: Settings & Advanced Features (Week 5)

15. **CompetitionSettings.vue**
    - Implement settings tab
    - Add archive functionality
    - Add delete functionality

16. **CompetitionOverview.vue**
    - Implement overview tab
    - Add empty state for seasons
    - Add "Create Season" CTA

### Phase 6: Polish & Testing (Week 6)

17. **Integration Testing**
    - Test all user flows
    - Test error scenarios
    - Test edge cases

18. **Accessibility**
    - Add ARIA labels
    - Test keyboard navigation
    - Test screen reader compatibility

19. **Performance**
    - Optimize image loading
    - Add loading states
    - Test with large datasets

20. **Documentation**
    - Update component documentation
    - Add usage examples
    - Create developer guide

### Dependencies

- **Blocks Phase 2**: Backend API must be ready (Phase 1)
- **Blocks Phase 4**: Core components must be complete (Phase 2-3)
- **Blocks Phase 5**: Detail view must be ready (Phase 4)

---

## Questions & Ambiguities

### 1. Competition Logo Fallback Hierarchy

**Question**: If competition has no logo, should it fall back to league logo or platform icon?

**Recommendation**:
```
1. Competition logo (if uploaded)
2. League logo (fallback)
3. Default platform icon (system default)
```

**Needs Clarification**: Confirm with backend team that league logo URL is accessible from competition context.

---

### 2. Competition Listing in League Detail

**Question**: Should competitions be shown in a tab or a separate section on the league detail page?

**Options**:
- **Option A**: Add "Competitions" tab alongside drivers/settings tabs (recommended)
- **Option B**: Add competitions section below league header (more prominent)

**Recommendation**: Option A (tab) - keeps consistent with driver management pattern.

---

### 3. Competition Statistics

**Question**: Should competition stats (total seasons, drivers, races) be:
- Computed in backend and sent with competition data? (recommended)
- Fetched separately via additional API call?
- Computed on frontend from season data?

**Recommendation**: Computed in backend and eager-loaded with competition data for performance.

---

### 4. Competition Slug Generation

**Question**: Should frontend generate/preview slug or leave it entirely to backend?

**Options**:
- **Option A**: Backend generates slug on save (simpler, recommended)
- **Option B**: Frontend previews slug like league creation (more complex, better UX)

**Recommendation**: Option A for v1 - backend generates slug from name with uniqueness check.

---

### 5. Platform List Source

**Question**: Should competition creation fetch platforms separately or reuse from league store?

**Recommendation**: Reuse platforms from `leagueStore` since they're already fetched. No need for separate API call.

```typescript
// In CompetitionFormDrawer
const leagueStore = useLeagueStore();
await leagueStore.fetchPlatforms(); // Cached if already loaded

const platformOptions = computed(() => leagueStore.platforms);
```

---

### 6. Competition Archive vs Delete

**Question**: Should we implement both archive AND delete, or just one?

**Recommendation**:
- **Archive**: Soft delete, hides from active lists, preserves data, can be restored later
- **Delete**: Hard delete with confirmation, permanently removes all data

Implement both:
- Archive for temporary removal (Settings → "Archive Competition" button)
- Delete for permanent removal (Settings → Danger Zone → "Delete Competition" button)

---

### 7. Success Modal Flow

**Question**: After creating competition, should we:
- Show success modal → user chooses next action (recommended)
- Auto-navigate to competition detail page
- Stay on league page with toast notification

**Recommendation**: Show success modal with "Create First Season" as primary CTA. This guides users to the next logical step.

---

### 8. Competition Empty State (No Seasons)

**Question**: When viewing a competition with no seasons, what should the overview tab show?

**Recommendation**:
```vue
<div class="text-center py-12">
  <PhFlag :size="64" class="text-gray-400 mb-4" />
  <h3 class="text-xl font-bold mb-2">Ready to Race?</h3>
  <p class="text-gray-600 mb-6">
    Create your first season to start organizing races, managing drivers, and tracking results.
  </p>
  <Button label="Create Your First Season" icon="pi pi-plus" @click="createSeason" />
</div>
```

---

### 9. Platform Field in Edit Mode

**Question**: Should platform field be:
- Hidden completely in edit mode?
- Shown but disabled with info message? (recommended)

**Recommendation**: Show but disabled with message "Platform cannot be changed after creation". This provides context and prevents confusion.

---

### 10. Image Upload Component Reuse

**Question**: Can we reuse the existing `ImageUpload` component from league creation?

**Answer**: Yes! The `ImageUpload` component in `resources/user/js/components/common/forms/ImageUpload.vue` is already designed to be reusable. Just pass different props:

```vue
<ImageUpload
  v-model="form.logo"
  :existing-image-url="form.logo_url"
  accept="image/png,image/jpeg,image/jpg"
  :max-size="2 * 1024 * 1024"
  :min-dimensions="{ width: 200, height: 200 }"
  :recommended-dimensions="{ width: 500, height: 500 }"
  fallback-text="If not uploaded, league logo will be used"
/>
```

---

### 11. Breadcrumb Navigation

**Question**: Should we add breadcrumbs for competition detail page?

**Recommendation**: Yes, add breadcrumbs:
```
League Dashboard > [League Name] > Competitions > [Competition Name]
```

Use existing `Breadcrumbs.vue` component from `resources/user/js/components/common/Breadcrumbs.vue`.

---

### 12. Loading States

**Question**: What loading states should we implement?

**Recommendation**:
- **Initial load**: Skeleton screens (PrimeVue Skeleton component)
- **Form submission**: Button loading spinner + disabled state
- **List loading**: Skeleton cards
- **Empty search results**: "No competitions found" message

---

### 13. Error Handling

**Question**: How should we handle different error types?

**Recommendation**:
- **Network errors**: Toast notification + retry button
- **Validation errors**: Inline field errors
- **404 Not Found**: Message component with "Competition not found"
- **403 Forbidden**: Redirect to league list with error toast
- **500 Server Error**: Toast notification with generic message

---

### 14. Competition Filters

**Question**: Should we add filters to competition list (by platform, status, etc.)?

**Recommendation**: Not in v1. Add in future iteration if users request it. For now, simple list sorted by created date (newest first).

---

### 15. Mobile Responsiveness

**Question**: How should competition cards display on mobile?

**Recommendation**:
- Desktop: 3 columns grid
- Tablet: 2 columns grid
- Mobile: 1 column (stacked)

Use Tailwind responsive classes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

### 16. Permissions & Authorization

**Question**: Should frontend check user permissions before showing edit/delete buttons?

**Recommendation**: Yes, check against league ownership:
```typescript
const canEdit = computed(() => {
  return league.value?.owner_user_id === userStore.user?.id;
});
```

Backend will also enforce permissions. Frontend checks are for UX only.

---

### 17. Keyboard Shortcuts

**Question**: Should we implement keyboard shortcuts (e.g., Cmd+K to create competition)?

**Recommendation**: Not in v1. Add in future iteration for power users.

---

### 18. Toast Notification Durations

**Question**: How long should toast notifications display?

**Recommendation**:
- Success: 3000ms (3 seconds)
- Error: 5000ms (5 seconds)
- Info: 3000ms (3 seconds)

---

### 19. Form Dirty State

**Question**: Should we warn users about unsaved changes when closing drawer?

**Recommendation**: Yes, implement dirty state tracking:
```typescript
const isDirty = computed(() => {
  // Compare current form state with initial/saved state
  return JSON.stringify(form) !== JSON.stringify(initialForm);
});

function handleCancel() {
  if (isDirty.value) {
    // Show confirmation dialog
    showUnsavedChangesDialog.value = true;
  } else {
    closeDrawer();
  }
}
```

---

### 20. Analytics/Tracking

**Question**: Should we add analytics events for competition creation/editing?

**Recommendation**: Add analytics hooks in future iteration. For now, focus on core functionality.

---

## Summary

This frontend implementation plan provides a comprehensive roadmap for building the Competition Creation feature in the User Dashboard. The plan follows established patterns from the existing League and Driver management features, ensuring consistency and maintainability.

**Key Highlights**:
- Full TypeScript type safety
- Reusable components and composables
- Comprehensive validation (client + server)
- Testing strategy for all layers
- Clear implementation order with dependencies
- PrimeVue 4 components throughout
- Follows Vue 3 Composition API patterns
- Mobile-responsive design
- Accessible UI with ARIA labels
- Error handling and loading states

**Next Steps**:
1. Review and confirm backend API contracts
2. Resolve questions/ambiguities with team
3. Begin Phase 1 implementation (types, services, store)
4. Set up component stubs for parallel frontend/backend development
5. Create mock data for development/testing

---

**Related Documentation**:
- [Competition Creation Requirements](/var/www/docs/UserDashboard/03_competition_creation.md)
- [User Dashboard Development Guide](/.claude/guides/frontend/user-dashboard-development-guide.md)
- [User Backend Guide](/.claude/guides/backend/user-backend-guide.md)
