# Competition Creation - Frontend Implementation Tasks

**Version**: 2.0
**Estimated Time**: 2.5 weeks
**Stack**: Vue 3 + TypeScript + PrimeVue 4 + Pinia

---

## 📋 Overview

This document provides step-by-step tasks for implementing the Competition frontend following Vue 3 Composition API patterns. Tasks are organized by implementation phase with clear acceptance criteria.

---

## Week 1: Foundation + Core Components (Days 1-7)

### Day 1: Type Definitions (3 hours)

#### Task 1.1: Create Competition Types
**File**: `resources/app/js/types/competition.ts`

```typescript
/**
 * Competition-related TypeScript types and interfaces
 */

// Platform reference (subset of full Platform type)
export interface CompetitionPlatform {
  id: number;
  name: string;
  slug: string;
}

// Status type
export type CompetitionStatus = 'active' | 'archived';

// Main Competition entity (from backend)
export interface Competition {
  id: number;
  league_id: number;
  name: string;
  slug: string;
  description: string | null;
  platform_id: number;
  platform?: CompetitionPlatform;
  logo_url: string; // Never null (backend resolves fallback)
  status: CompetitionStatus;
  is_active: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_user_id: number;
  stats: CompetitionStats;
}

// Statistics (computed on backend)
export interface CompetitionStats {
  total_seasons: number;
  active_seasons: number;
  total_drivers: number;
  total_races: number;
  next_race_date: string | null;
}

// Create request payload
export interface CreateCompetitionRequest {
  name: string;
  platform_id: number;
  description?: string;
  logo?: File;
}

// Update request payload
export interface UpdateCompetitionRequest {
  name?: string;
  description?: string | null;
  logo?: File | null;
}

// Form state (internal)
export interface CompetitionForm {
  name: string;
  description: string;
  platform_id: number | null;
  logo: File | null;
  logo_url: string | null; // Existing logo URL for edit mode
}

// Validation errors
export interface CompetitionFormErrors {
  name?: string;
  description?: string;
  platform_id?: string;
  logo?: string;
}

// Slug check response (from backend)
export interface SlugCheckResponse {
  available: boolean;
  slug: string;
  suggestion: string | null; // e.g., "gt3-championship-02"
}

// Filters (for future use)
export interface CompetitionFilters {
  status?: CompetitionStatus | 'all';
  platform_id?: number;
  search?: string;
}
```

**Acceptance Criteria**:
- ✅ All types exported
- ✅ JSDoc comments added
- ✅ No TypeScript errors
- ✅ Matches backend DTO structure

---

### Day 2: Service Layer (4 hours)

#### Task 2.1: Create Competition Service
**File**: `resources/app/js/services/competitionService.ts`

```typescript
/**
 * Competition API Service
 * Handles all HTTP requests for competition management
 */

import { apiClient } from './api';
import type {
  Competition,
  CreateCompetitionRequest,
  UpdateCompetitionRequest,
  CompetitionFilters,
  SlugCheckResponse,
} from '@app/types/competition';
import type { AxiosResponse } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Get all competitions for a league
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
 * Get a specific competition
 */
export async function getCompetition(id: number): Promise<Competition> {
  const response: AxiosResponse<ApiResponse<Competition>> = await apiClient.get(
    `/competitions/${id}`,
  );
  return response.data.data;
}

/**
 * Create a new competition
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
 */
export async function updateCompetition(
  id: number,
  formData: FormData,
): Promise<Competition> {
  // Laravel method spoofing for PUT with multipart/form-data
  formData.append('_method', 'PUT');

  const response: AxiosResponse<ApiResponse<Competition>> = await apiClient.post(
    `/competitions/${id}`,
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
 * Archive a competition
 */
export async function archiveCompetition(id: number): Promise<void> {
  await apiClient.post(`/competitions/${id}/archive`);
}

/**
 * Delete a competition permanently
 */
export async function deleteCompetition(id: number): Promise<void> {
  await apiClient.delete(`/competitions/${id}`);
}

/**
 * Check slug availability
 */
export async function checkSlugAvailability(
  leagueId: number,
  name: string,
  excludeId?: number,
): Promise<SlugCheckResponse> {
  const response: AxiosResponse<ApiResponse<SlugCheckResponse>> = await apiClient.post(
    `/leagues/${leagueId}/competitions/check-slug`,
    { name, exclude_id: excludeId },
  );
  return response.data.data;
}

/**
 * Build FormData from form state (create)
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
 * Build FormData from form state (update)
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

**Unit Test**: `resources/app/js/services/__tests__/competitionService.test.ts`

**Test Cases**:
- ✅ Mock apiClient calls
- ✅ Test all service methods
- ✅ Test FormData builders
- ✅ Test error handling

---

### Day 3: State Management (4 hours)

#### Task 3.1: Create Competition Store
**File**: `resources/app/js/stores/competitionStore.ts`

```typescript
/**
 * Competition Store
 * Manages competition state and operations
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Competition, CompetitionForm, CompetitionFilters } from '@app/types/competition';
import {
  getLeagueCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  archiveCompetition,
  deleteCompetition,
  buildCompetitionFormData,
  buildUpdateCompetitionFormData,
} from '@app/services/competitionService';

export const useCompetitionStore = defineStore('competition', () => {
  // State
  const competitions = ref<Competition[]>([]);
  const currentCompetition = ref<Competition | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeCompetitions = computed(() =>
    competitions.value.filter((c) => c.is_active),
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
   */
  async function fetchCompetition(id: number): Promise<Competition> {
    loading.value = true;
    error.value = null;

    try {
      const competition = await getCompetition(id);
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
   */
  async function createNewCompetition(
    leagueId: number,
    form: CompetitionForm,
  ): Promise<Competition> {
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
   */
  async function updateExistingCompetition(
    id: number,
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

      const updatedCompetition = await updateCompetition(id, formData);

      // Update in local state
      const index = competitions.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        competitions.value[index] = updatedCompetition;
      }

      if (currentCompetition.value?.id === id) {
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
   * Archive a competition
   */
  async function archiveExistingCompetition(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await archiveCompetition(id);

      // Update local state
      const index = competitions.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        competitions.value[index].is_archived = true;
        competitions.value[index].is_active = false;
        competitions.value[index].status = 'archived';
        competitions.value[index].archived_at = new Date().toISOString();
      }

      if (currentCompetition.value?.id === id) {
        currentCompetition.value.is_archived = true;
        currentCompetition.value.is_active = false;
        currentCompetition.value.status = 'archived';
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
   */
  async function deleteExistingCompetition(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await deleteCompetition(id);

      // Remove from local state
      competitions.value = competitions.value.filter((c) => c.id !== id);

      if (currentCompetition.value?.id === id) {
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
   * Clear error
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

**Unit Test**: `resources/app/js/stores/__tests__/competitionStore.test.ts`

**Test Cases**:
- ✅ Initial state
- ✅ Fetch competitions
- ✅ Create competition
- ✅ Update competition
- ✅ Archive competition
- ✅ Delete competition
- ✅ Error handling
- ✅ Computed getters

---

### Day 4: Composables - Part 1 (3 hours)

#### Task 4.1: Platform Filtering Composable ⚠️ HIGH PRIORITY
**File**: `resources/app/js/composables/useLeaguePlatforms.ts`

```typescript
/**
 * League Platform Filtering Composable
 * Filters platforms to only those enabled for a specific league
 * REUSABLE: Competition creation, Driver management, Season creation (future)
 */

import { computed } from 'vue';
import { useLeagueStore } from '@app/stores/leagueStore';
import type { Platform } from '@app/types/platform';

export interface PlatformOption {
  id: number;
  name: string;
  slug: string;
}

export function useLeaguePlatforms(leagueId: number) {
  const leagueStore = useLeagueStore();

  /**
   * Get league's enabled platforms
   */
  const leaguePlatforms = computed((): Platform[] => {
    const league = leagueStore.leagues.find((l) => l.id === leagueId);
    if (!league || !league.platform_ids) {
      return [];
    }

    // Filter platforms to only those in league's platform_ids
    return leagueStore.platforms.filter((p) => league.platform_ids.includes(p.id));
  });

  /**
   * Formatted for PrimeVue Select
   */
  const platformOptions = computed((): PlatformOption[] => {
    return leaguePlatforms.value.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
    }));
  });

  /**
   * Check if a platform is available for the league
   */
  function isPlatformAvailable(platformId: number): boolean {
    return leaguePlatforms.value.some((p) => p.id === platformId);
  }

  /**
   * Get platform by ID (within league's platforms)
   */
  function getPlatformById(platformId: number): Platform | undefined {
    return leaguePlatforms.value.find((p) => p.id === platformId);
  }

  return {
    leaguePlatforms,
    platformOptions,
    isPlatformAvailable,
    getPlatformById,
  };
}
```

**Unit Test**: `resources/app/js/composables/__tests__/useLeaguePlatforms.test.ts`

**Test Cases**:
- ✅ Returns empty array if league not found
- ✅ Filters platforms correctly
- ✅ Returns formatted options for Select
- ✅ isPlatformAvailable works
- ✅ getPlatformById works

**Post-Implementation**: Refactor `ReadOnlyDriverTable.vue` to use this composable

---

#### Task 4.2: Validation Composable
**File**: `resources/app/js/composables/useCompetitionValidation.ts`

```typescript
/**
 * Competition Form Validation Composable
 * Client-side validation logic
 */

import { reactive, computed } from 'vue';
import type { CompetitionForm, CompetitionFormErrors } from '@app/types/competition';

export function useCompetitionValidation(form: CompetitionForm) {
  const errors = reactive<CompetitionFormErrors>({});

  /**
   * Validate name
   */
  function validateName(): string | undefined {
    if (!form.name || !form.name.trim()) {
      return 'Competition name is required';
    }
    if (form.name.trim().length < 3) {
      return 'Name must be at least 3 characters';
    }
    if (form.name.length > 100) {
      return 'Name must not exceed 100 characters';
    }
    return undefined;
  }

  /**
   * Validate platform
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
   * Validate logo
   */
  function validateLogo(): string | undefined {
    if (!form.logo) {
      return undefined; // Optional
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

**Unit Test**: `resources/app/js/composables/__tests__/useCompetitionValidation.test.ts`

---

### Days 5-6: Competition Form Drawer (12 hours)

#### Task 5.1: CompetitionFormDrawer Component
**File**: `resources/app/js/components/competition/CompetitionFormDrawer.vue`

**Pattern Reference**: `DriverFormDialog.vue` for structure, `LeagueWizardDrawer.vue` for footer styling

**Key Features**:
- Create and edit modes in one component
- Slug preview with availability check (debounced)
- Name change confirmation dialog
- Platform locked in edit mode
- Image upload with preview

**Component Structure**:
```vue
<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useLeaguePlatforms } from '@app/composables/useLeaguePlatforms';
import { useCompetitionValidation } from '@app/composables/useCompetitionValidation';
import { checkSlugAvailability } from '@app/services/competitionService';
import type { Competition, CompetitionForm, SlugCheckResponse } from '@app/types/competition';

// PrimeVue Components
import Drawer from 'primevue/drawer';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';

// Common Components
import DrawerHeader from '@app/components/common/DrawerHeader.vue';
import DrawerLoading from '@app/components/common/DrawerLoading.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import ImageUpload from '@app/components/common/forms/ImageUpload.vue';

// Props
interface Props {
  visible: boolean;
  leagueId: number;
  competition?: Competition | null;
  isEditMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  competition: null,
  isEditMode: false,
});

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'competition-saved', competition: Competition): void;
}

const emit = defineEmits<Emits>();

// Composables
const toast = useToast();
const competitionStore = useCompetitionStore();
const { platformOptions } = useLeaguePlatforms(props.leagueId);

// State
const form = reactive<CompetitionForm>({
  name: '',
  description: '',
  platform_id: null,
  logo: null,
  logo_url: null,
});

const originalName = ref(''); // For tracking name changes
const isSubmitting = ref(false);
const isLoadingData = ref(false);
const showNameChangeDialog = ref(false);

// Slug preview state
const slugPreview = ref('');
const slugStatus = ref<'checking' | 'available' | 'taken' | 'error' | null>(null);
const slugSuggestion = ref<string | null>(null);

// Validation
const { errors, validateAll, clearError } = useCompetitionValidation(form);

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const drawerTitle = computed(() => (props.isEditMode ? 'Edit Competition' : 'Create Competition'));
const drawerSubtitle = computed(() =>
  props.isEditMode ? 'Update competition details' : 'Create a new competition for your league',
);

const nameChanged = computed(() => {
  return props.isEditMode && form.name !== originalName.value;
});

const canSubmit = computed(() => {
  return (
    !isSubmitting.value &&
    form.name.trim().length >= 3 &&
    form.platform_id !== null &&
    !errors.name &&
    !errors.platform_id &&
    !errors.description &&
    !errors.logo
  );
});

// Slug checking (debounced)
const checkSlug = useDebounceFn(async () => {
  if (!form.name || form.name.trim().length < 3) {
    slugPreview.value = '';
    slugStatus.value = null;
    return;
  }

  slugStatus.value = 'checking';

  try {
    const result: SlugCheckResponse = await checkSlugAvailability(
      props.leagueId,
      form.name,
      props.competition?.id,
    );

    slugPreview.value = result.slug;
    slugStatus.value = result.available ? 'available' : 'taken';
    slugSuggestion.value = result.suggestion;
  } catch (error) {
    console.error('Slug check failed:', error);
    slugStatus.value = 'error';
  }
}, 500);

// Watch name changes for slug preview
watch(
  () => form.name,
  () => {
    clearError('name');
    checkSlug();
  },
);

// Watch drawer visibility
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.isEditMode && props.competition) {
        loadCompetitionData();
      } else {
        resetForm();
      }
    }
  },
);

// Methods
function loadCompetitionData(): void {
  if (!props.competition) return;

  isLoadingData.value = true;

  form.name = props.competition.name;
  form.description = props.competition.description || '';
  form.platform_id = props.competition.platform_id;
  form.logo = null;
  form.logo_url = props.competition.logo_url;

  originalName.value = props.competition.name;

  isLoadingData.value = false;
}

function resetForm(): void {
  form.name = '';
  form.description = '';
  form.platform_id = null;
  form.logo = null;
  form.logo_url = null;
  originalName.value = '';
  slugPreview.value = '';
  slugStatus.value = null;
  slugSuggestion.value = null;
  errors.name = undefined;
  errors.platform_id = undefined;
  errors.description = undefined;
  errors.logo = undefined;
}

function handleCancel(): void {
  localVisible.value = false;
  resetForm();
}

async function handleSubmit(): Promise<void> {
  // If name changed in edit mode, show confirmation
  if (nameChanged.value) {
    showNameChangeDialog.value = true;
    return;
  }

  await submitForm();
}

async function submitForm(): Promise<void> {
  if (!validateAll()) {
    return;
  }

  isSubmitting.value = true;

  try {
    if (props.isEditMode && props.competition) {
      const updated = await competitionStore.updateExistingCompetition(props.competition.id, {
        name: form.name !== originalName.value ? form.name : undefined,
        description: form.description,
        logo: form.logo,
      });

      toast.add({
        severity: 'success',
        summary: 'Competition Updated',
        detail: 'Competition has been updated successfully',
        life: 3000,
      });

      emit('competition-saved', updated);
    } else {
      const created = await competitionStore.createNewCompetition(props.leagueId, form);

      toast.add({
        severity: 'success',
        summary: 'Competition Created!',
        detail: 'You can now create seasons for this competition.',
        life: 5000,
      });

      emit('competition-saved', created);
    }

    localVisible.value = false;
    resetForm();
  } catch (error: any) {
    console.error('Failed to save competition:', error);

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to save competition',
      life: 5000,
    });
  } finally {
    isSubmitting.value = false;
  }
}

function confirmNameChange(): void {
  showNameChangeDialog.value = false;
  submitForm();
}

function cancelNameChange(): void {
  showNameChangeDialog.value = false;
}
</script>

<template>
  <Drawer v-model:visible="localVisible" position="right" class="w-full md:w-[40rem]">
    <template #header>
      <DrawerHeader :title="drawerTitle" :subtitle="drawerSubtitle" />
    </template>

    <DrawerLoading v-if="isLoadingData" message="Loading competition..." />

    <div v-else class="p-6 space-y-4">
      <!-- Name Field -->
      <FormInputGroup>
        <FormLabel for="name" text="Competition Name" required />
        <InputText
          id="name"
          v-model="form.name"
          placeholder="e.g., Sunday Night Racing, GT3 Championship"
          :class="{ 'p-invalid': errors.name }"
          :disabled="isSubmitting"
          maxlength="100"
        />
        <FormError :error="errors.name" />

        <!-- Slug Preview -->
        <div v-if="slugPreview" class="mt-2 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-600">URL:</span>
            <code class="text-xs bg-gray-100 px-2 py-1 rounded">
              /leagues/.../competitions/{{ slugPreview }}
            </code>

            <span v-if="slugStatus === 'checking'" class="text-blue-500">
              <i class="pi pi-spinner pi-spin"></i>
            </span>
            <span v-else-if="slugStatus === 'available'" class="text-green-600">
              <i class="pi pi-check-circle"></i> Available
            </span>
            <span v-else-if="slugStatus === 'taken'" class="text-orange-600">
              <i class="pi pi-exclamation-triangle"></i> Taken (will use: {{ slugSuggestion }})
            </span>
          </div>
        </div>
      </FormInputGroup>

      <!-- Platform Selection -->
      <FormInputGroup>
        <FormLabel for="platform_id" text="Platform" required />
        <Select
          id="platform_id"
          v-model="form.platform_id"
          :options="platformOptions"
          option-label="name"
          option-value="id"
          placeholder="Select a platform"
          :class="{ 'p-invalid': errors.platform_id }"
          :disabled="isEditMode || isSubmitting"
        />

        <!-- Platform locked message in edit mode -->
        <Message v-if="isEditMode" severity="info" :closable="false" class="mt-2">
          Platform cannot be changed after creation
        </Message>

        <FormError :error="errors.platform_id" />
      </FormInputGroup>

      <!-- Description -->
      <FormInputGroup>
        <FormLabel for="description" text="Description" optional />
        <Textarea
          id="description"
          v-model="form.description"
          rows="5"
          placeholder="Describe this competition, typical race format, skill level..."
          :class="{ 'p-invalid': errors.description }"
          :disabled="isSubmitting"
          maxlength="1000"
        />
        <FormError :error="errors.description" />
      </FormInputGroup>

      <!-- Logo Upload -->
      <FormInputGroup>
        <FormLabel for="logo" text="Competition Logo" optional />
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

      <!-- Info Message -->
      <Message severity="info" :closable="false">
        <i class="pi pi-info-circle mr-2"></i>
        Car restrictions, race types, and other details will be configured when you create seasons.
      </Message>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="bg-tertiary shadow-reverse border-t border-gray-200 p-4">
        <div class="flex justify-between">
          <Button
            label="Cancel"
            severity="danger"
            class="bg-white"
            outlined
            :disabled="isSubmitting"
            @click="handleCancel"
          />

          <Button
            :label="isEditMode ? 'Save Changes' : 'Create Competition'"
            :loading="isSubmitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          />
        </div>
      </div>
    </template>
  </Drawer>

  <!-- Name Change Confirmation Dialog -->
  <Dialog
    v-model:visible="showNameChangeDialog"
    :modal="true"
    :closable="false"
    :style="{ width: '32rem' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle text-orange-500 text-2xl"></i>
        <span class="text-xl font-semibold">Update Competition Name?</span>
      </div>
    </template>

    <div class="py-4">
      <p class="mb-4">Changing the name will update the public URL:</p>

      <div class="bg-gray-50 p-3 rounded mb-4 space-y-2">
        <div>
          <span class="text-sm font-semibold text-gray-600">Old:</span>
          <code class="block text-xs mt-1 text-gray-700">
            /leagues/.../competitions/{{ slugPreview || 'old-slug' }}
          </code>
        </div>
        <div>
          <span class="text-sm font-semibold text-gray-600">New:</span>
          <code class="block text-xs mt-1 text-blue-700">
            /leagues/.../competitions/{{ slugPreview }}
          </code>
        </div>
      </div>

      <Message severity="warn" :closable="false">
        Existing bookmarks and shared links will break.
      </Message>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" outlined @click="cancelNameChange" />
        <Button label="Continue" severity="warning" @click="confirmNameChange" />
      </div>
    </template>
  </Dialog>
</template>
```

**Acceptance Criteria**:
- ✅ Create mode works
- ✅ Edit mode works
- ✅ Platform locked in edit mode
- ✅ Slug preview shows and updates
- ✅ Slug availability check works
- ✅ Name change confirmation shows
- ✅ Image upload works
- ✅ Validation works
- ✅ Toast notifications show

**Component Test**: `resources/app/js/components/competition/__tests__/CompetitionFormDrawer.test.ts`

---

### Day 7: Display Components (4 hours)

#### Task 7.1: CompetitionCard Component
**File**: `resources/app/js/components/competition/CompetitionCard.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Competition } from '@app/types/competition';

import Card from 'primevue/card';
import Chip from 'primevue/chip';
import Button from 'primevue/button';

interface Props {
  competition: Competition;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'archive'): void;
}

const emit = defineEmits<Emits>();

const router = useRouter();

const cardClasses = computed(() => ({
  'opacity-60': props.competition.is_archived,
}));

function handleView(): void {
  router.push({
    name: 'competition-detail',
    params: {
      leagueId: props.competition.league_id,
      competitionId: props.competition.id,
    },
  });
}
</script>

<template>
  <Card :class="cardClasses" class="competition-card cursor-pointer" @click="handleView">
    <template #header>
      <img
        :src="competition.logo_url"
        :alt="competition.name"
        class="w-full h-48 object-cover"
      />
    </template>

    <template #title>
      <div class="flex justify-between items-start">
        <span>{{ competition.name }}</span>
        <Chip
          v-if="competition.is_archived"
          label="Archived"
          severity="secondary"
          size="small"
        />
      </div>
    </template>

    <template #subtitle>
      <Chip
        v-if="competition.platform"
        :label="competition.platform.name"
        icon="pi pi-gamepad"
      />
    </template>

    <template #content>
      <p v-if="competition.description" class="text-gray-600 text-sm mb-4 line-clamp-2">
        {{ competition.description }}
      </p>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <span class="text-xs text-gray-500">Seasons</span>
          <p class="font-semibold">{{ competition.stats.total_seasons }}</p>
        </div>
        <div>
          <span class="text-xs text-gray-500">Drivers</span>
          <p class="font-semibold">{{ competition.stats.total_drivers }}</p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <Button label="View" icon="pi pi-eye" outlined @click.stop="handleView" />
        <Button
          label="Edit"
          icon="pi pi-pencil"
          outlined
          @click.stop="emit('edit')"
        />
      </div>
    </template>
  </Card>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
```

---

#### Task 7.2: CompetitionList Component
**File**: `resources/app/js/components/competition/CompetitionList.vue`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCompetitionStore } from '@app/stores/competitionStore';
import type { Competition } from '@app/types/competition';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';

import CompetitionCard from './CompetitionCard.vue';
import CompetitionFormDrawer from './CompetitionFormDrawer.vue';
import CompetitionDeleteDialog from './CompetitionDeleteDialog.vue';

interface Props {
  leagueId: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'competition-created', competition: Competition): void;
  (e: 'competition-updated', competition: Competition): void;
  (e: 'competition-deleted', competitionId: number): void;
}

const emit = defineEmits<Emits>();

const competitionStore = useCompetitionStore();
const toast = useToast();

const showCreateDrawer = ref(false);
const showEditDrawer = ref(false);
const showDeleteDialog = ref(false);
const editingCompetition = ref<Competition | null>(null);
const deletingCompetition = ref<Competition | null>(null);

onMounted(async () => {
  await competitionStore.fetchCompetitions(props.leagueId);
});

function handleCreateClick(): void {
  showCreateDrawer.value = true;
}

function handleEditClick(competition: Competition): void {
  editingCompetition.value = competition;
  showEditDrawer.value = true;
}

function handleDeleteClick(competition: Competition): void {
  deletingCompetition.value = competition;
  showDeleteDialog.value = true;
}

function handleArchiveClick(competition: Competition): void {
  // Archive functionality
  competitionStore.archiveExistingCompetition(competition.id);

  toast.add({
    severity: 'success',
    summary: 'Competition Archived',
    detail: 'Competition has been archived successfully',
    life: 3000,
  });
}

function handleCompetitionCreated(competition: Competition): void {
  emit('competition-created', competition);
}

function handleCompetitionUpdated(competition: Competition): void {
  emit('competition-updated', competition);
}

function handleCompetitionDeleted(competitionId: number): void {
  emit('competition-deleted', competitionId);
}
</script>

<template>
  <div class="competition-list">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Competitions</h2>
      <Button
        label="New Competition"
        icon="pi pi-plus"
        @click="handleCreateClick"
      />
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="competitionStore.loading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <Skeleton v-for="i in 6" :key="i" height="20rem" />
    </div>

    <!-- Empty state -->
    <Card v-else-if="competitionStore.competitions.length === 0">
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-flag text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-semibold mb-2">No Competitions Yet</h3>
          <p class="text-gray-600 mb-4">
            Create your first competition to start organizing races.
          </p>
          <Button
            label="Create Your First Competition"
            icon="pi pi-plus"
            @click="handleCreateClick"
          />
        </div>
      </template>
    </Card>

    <!-- Competition cards grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CompetitionCard
        v-for="comp in competitionStore.competitions"
        :key="comp.id"
        :competition="comp"
        @edit="handleEditClick(comp)"
        @delete="handleDeleteClick(comp)"
        @archive="handleArchiveClick(comp)"
      />
    </div>

    <!-- Create Drawer -->
    <CompetitionFormDrawer
      v-model:visible="showCreateDrawer"
      :league-id="leagueId"
      @competition-saved="handleCompetitionCreated"
    />

    <!-- Edit Drawer -->
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
</template>
```

---

## Week 2: Delete Dialog + Integration (Days 8-11)

### Day 8: 2-Step Delete Dialog (4 hours)

#### Task 8.1: CompetitionDeleteDialog Component
**File**: `resources/app/js/components/competition/CompetitionDeleteDialog.vue`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useToast } from 'primevue/usetoast';
import type { Competition } from '@app/types/competition';

import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Message from 'primevue/message';
import InputText from 'primevue/inputtext';
import FormInputGroup from '@app/components/common/forms/FormInputGroup.vue';
import FormLabel from '@app/components/common/forms/FormLabel.vue';

interface Props {
  visible: boolean;
  competition: Competition | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'confirmed', competitionId: number): void;
}

const emit = defineEmits<Emits>();

const competitionStore = useCompetitionStore();
const toast = useToast();

const step = ref<'suggest-archive' | 'confirm-delete'>('suggest-archive');
const confirmationText = ref('');
const isDeleting = ref(false);

const localVisible = computed({
  get: () => props.visible,
  set: (value) => {
    emit('update:visible', value);
    if (!value) {
      // Reset on close
      step.value = 'suggest-archive';
      confirmationText.value = '';
    }
  },
});

const canDelete = computed(() => confirmationText.value === 'DELETE');

async function handleArchive(): Promise<void> {
  if (!props.competition) return;

  try {
    await competitionStore.archiveExistingCompetition(props.competition.id);

    toast.add({
      severity: 'success',
      summary: 'Competition Archived',
      detail: 'Competition has been archived successfully',
      life: 3000,
    });

    localVisible.value = false;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to archive competition',
      life: 5000,
    });
  }
}

function continueToDelete(): void {
  step.value = 'confirm-delete';
}

async function handleConfirmDelete(): Promise<void> {
  if (!canDelete.value || !props.competition) return;

  isDeleting.value = true;

  try {
    await competitionStore.deleteExistingCompetition(props.competition.id);

    toast.add({
      severity: 'success',
      summary: 'Competition Deleted',
      detail: 'Competition has been permanently deleted',
      life: 3000,
    });

    emit('confirmed', props.competition.id);
    localVisible.value = false;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to delete competition',
      life: 5000,
    });
  } finally {
    isDeleting.value = false;
  }
}

function handleCancel(): void {
  localVisible.value = false;
}
</script>

<template>
  <Dialog v-model:visible="localVisible" :modal="true" :style="{ width: '40rem' }">
    <template #header>
      <div class="flex items-center gap-3">
        <i class="pi pi-trash text-red-500 text-2xl"></i>
        <span class="text-xl font-bold">Delete Competition</span>
      </div>
    </template>

    <!-- Step 1: Suggest Archive -->
    <div v-if="step === 'suggest-archive'" class="py-4">
      <Message severity="info" :closable="false" class="mb-4">
        <strong>💡 Consider Archiving Instead</strong>
      </Message>

      <p class="mb-4">
        Archiving preserves all your data and allows you to review it later.
      </p>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <!-- Archive Option -->
        <div class="border rounded-lg p-4">
          <h4 class="font-semibold mb-2">🗄️ Archive</h4>
          <ul class="text-sm space-y-1">
            <li class="flex items-start">
              <i class="pi pi-check text-green-600 mr-2 mt-0.5"></i>
              <span>Preserves all data</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check text-green-600 mr-2 mt-0.5"></i>
              <span>Can review later</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check text-green-600 mr-2 mt-0.5"></i>
              <span>Hidden from active lists</span>
            </li>
          </ul>
        </div>

        <!-- Delete Option -->
        <div class="border rounded-lg p-4 border-red-300 bg-red-50">
          <h4 class="font-semibold mb-2 text-red-700">🗑️ Delete</h4>
          <ul class="text-sm space-y-1 text-red-600">
            <li class="flex items-start">
              <i class="pi pi-times mr-2 mt-0.5"></i>
              <span>Permanent removal</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-times mr-2 mt-0.5"></i>
              <span>Cannot undo</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-times mr-2 mt-0.5"></i>
              <span>All data lost</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Step 2: Confirm Delete -->
    <div v-else-if="step === 'confirm-delete'" class="py-4">
      <Message severity="error" :closable="false" class="mb-4">
        <strong>⚠️ DANGER ZONE</strong>
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

      <FormInputGroup>
        <FormLabel for="confirm" text='Type "DELETE" to confirm' required />
        <InputText
          id="confirm"
          v-model="confirmationText"
          placeholder="DELETE"
          :disabled="isDeleting"
        />
      </FormInputGroup>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancel" outlined @click="handleCancel" :disabled="isDeleting" />

        <!-- Step 1 buttons -->
        <template v-if="step === 'suggest-archive'">
          <Button label="Archive Instead" severity="secondary" @click="handleArchive" />
          <Button
            label="Continue to Delete"
            severity="danger"
            outlined
            @click="continueToDelete"
          />
        </template>

        <!-- Step 2 button -->
        <Button
          v-else
          label="Delete Competition"
          severity="danger"
          @click="handleConfirmDelete"
          :loading="isDeleting"
          :disabled="!canDelete"
        />
      </div>
    </template>
  </Dialog>
</template>
```

---

### Days 9-10: Integration with LeagueDetail (6 hours)

#### Task 9.1: Add Competitions Tab to LeagueDetail
**File**: `resources/app/js/views/LeagueDetail.vue`

**Changes Required**:

1. Import CompetitionList component
2. Add "Competitions" tab
3. Handle competition creation (optional success handling)

```vue
<script setup lang="ts">
// ... existing imports
import CompetitionList from '@app/components/competition/CompetitionList.vue';
import type { Competition } from '@app/types/competition';

// ... existing code

function handleCompetitionCreated(competition: Competition): void {
  // Optional: Could navigate to competition detail or just show toast
  // For now, toast is shown in CompetitionList
}
</script>

<template>
  <div class="league-detail">
    <!-- ... existing header code ... -->

    <!-- Tabs -->
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="overview">Overview</Tab>
        <Tab value="drivers">Drivers</Tab>
        <Tab value="competitions">Competitions</Tab> <!-- NEW -->
        <Tab value="settings">Settings</Tab>
      </TabList>

      <TabPanels>
        <!-- ... existing tab panels ... -->

        <!-- NEW: Competitions Tab -->
        <TabPanel value="competitions">
          <CompetitionList
            :league-id="leagueIdNumber"
            @competition-created="handleCompetitionCreated"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
```

**Test Integration**:
1. Navigate to league detail
2. Click "Competitions" tab
3. Verify empty state shows
4. Create first competition
5. Verify card displays
6. Edit competition
7. Archive competition
8. Delete competition

---

### Day 11: Routing + Detail View Structure (4 hours)

#### Task 11.1: Add Competition Detail Route
**File**: `resources/app/js/router/index.ts`

```typescript
{
  path: '/leagues/:leagueId/competitions/:competitionId',
  name: 'competition-detail',
  component: () => import('@app/views/CompetitionDetail.vue'),
  meta: {
    title: 'Competition Details',
    requiresAuth: true,
  },
}
```

---

#### Task 11.2: CompetitionDetail View (Basic)
**File**: `resources/app/js/views/CompetitionDetail.vue`

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useCompetitionStore } from '@app/stores/competitionStore';
import type { Competition } from '@app/types/competition';

import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import Message from 'primevue/message';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

import CompetitionHeader from '@app/components/competition/CompetitionHeader.vue';
import CompetitionSettings from '@app/components/competition/CompetitionSettings.vue';
import CompetitionFormDrawer from '@app/components/competition/CompetitionFormDrawer.vue';

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

onMounted(async () => {
  await loadCompetition();
});

async function loadCompetition(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    competition.value = await competitionStore.fetchCompetition(competitionId.value);
  } catch (err: any) {
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

function handleEdit(): void {
  showEditDrawer.value = true;
}

function handleBackToLeague(): void {
  router.push({ name: 'league-detail', params: { id: leagueId.value } });
}

function handleCompetitionUpdated(updated: Competition): void {
  competition.value = updated;
}

function handleArchived(): void {
  loadCompetition();
}

function handleDeleted(): void {
  toast.add({
    severity: 'success',
    summary: 'Competition Deleted',
    detail: 'Redirecting to league dashboard...',
    life: 3000,
  });

  setTimeout(() => {
    handleBackToLeague();
  }, 1500);
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading skeleton -->
    <Skeleton v-if="isLoading" height="30rem" />

    <!-- Error state -->
    <Message v-else-if="error" severity="error">
      {{ error }}
    </Message>

    <!-- Competition content -->
    <div v-else-if="competition">
      <!-- Archived banner -->
      <Message
        v-if="competition.is_archived"
        severity="warn"
        :closable="false"
        class="mb-4"
      >
        <div class="flex items-center justify-between">
          <span>
            <strong>🗄️ Archived Competition</strong> - This competition is read-only.
          </span>
          <span class="text-sm text-gray-600">(Restore coming in next update)</span>
        </div>
      </Message>

      <!-- Header -->
      <CompetitionHeader
        :competition="competition"
        @edit="handleEdit"
        @back-to-league="handleBackToLeague"
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
            <!-- Simple empty state for now -->
            <Card>
              <template #content>
                <div class="text-center py-8">
                  <i class="pi pi-flag text-6xl text-gray-400 mb-4"></i>
                  <h3 class="text-xl font-semibold mb-2">Ready to Race?</h3>
                  <p class="text-gray-600 mb-4">
                    Create your first season to start organizing races.
                  </p>
                  <Button label="Create First Season" disabled />
                  <p class="text-sm text-gray-500 mt-2">(Season feature coming soon)</p>
                </div>
              </template>
            </Card>
          </TabPanel>

          <TabPanel value="seasons">
            <Message severity="info">Season management coming in next update</Message>
          </TabPanel>

          <TabPanel value="drivers">
            <Message severity="info">Driver management coming in next update</Message>
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
</template>
```

---

## Week 2-3: Detail View Components (Days 12-15)

### Day 12: CompetitionHeader Component (3 hours)

#### Task 12.1: CompetitionHeader
**File**: `resources/app/js/components/competition/CompetitionHeader.vue`

```vue
<script setup lang="ts">
import type { Competition } from '@app/types/competition';

import Button from 'primevue/button';
import Chip from 'primevue/chip';

interface Props {
  competition: Competition;
}

defineProps<Props>();

interface Emits {
  (e: 'edit'): void;
  (e: 'back-to-league'): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
  <div class="competition-header bg-white shadow-sm rounded-lg p-6 mb-6">
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
        :src="competition.logo_url"
        :alt="competition.name"
        class="w-24 h-24 rounded-lg object-cover"
      />

      <!-- Competition Info -->
      <div class="flex-1">
        <div class="flex justify-between items-start mb-2">
          <h1 class="text-3xl font-bold">{{ competition.name }}</h1>
          <Button
            icon="pi pi-cog"
            label="Edit"
            outlined
            :disabled="competition.is_archived"
            @click="emit('edit')"
          />
        </div>

        <!-- Platform Badge -->
        <Chip
          v-if="competition.platform"
          :label="competition.platform.name"
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
            <p class="text-xl font-bold">{{ competition.stats.total_seasons }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Drivers</span>
            <p class="text-xl font-bold">{{ competition.stats.total_drivers }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Races</span>
            <p class="text-xl font-bold">{{ competition.stats.total_races }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

### Day 13: CompetitionSettings Component (4 hours)

#### Task 13.1: CompetitionSettings
**File**: `resources/app/js/components/competition/CompetitionSettings.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useCompetitionStore } from '@app/stores/competitionStore';
import { useToast } from 'primevue/usetoast';
import type { Competition } from '@app/types/competition';

import Card from 'primevue/card';
import Button from 'primevue/button';
import Message from 'primevue/message';

import CompetitionDeleteDialog from './CompetitionDeleteDialog.vue';

interface Props {
  competition: Competition;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'updated'): void;
  (e: 'archived'): void;
  (e: 'deleted'): void;
}

const emit = defineEmits<Emits>();

const competitionStore = useCompetitionStore();
const toast = useToast();

const showDeleteDialog = ref(false);
const isArchiving = ref(false);

async function handleArchive(): Promise<void> {
  isArchiving.value = true;

  try {
    await competitionStore.archiveExistingCompetition(props.competition.id);

    toast.add({
      severity: 'success',
      summary: 'Competition Archived',
      detail: 'Competition has been archived successfully',
      life: 3000,
    });

    emit('archived');
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to archive competition',
      life: 5000,
    });
  } finally {
    isArchiving.value = false;
  }
}

function handleDelete(): void {
  showDeleteDialog.value = true;
}

function handleCompetitionDeleted(competitionId: number): void {
  emit('deleted');
}
</script>

<template>
  <div class="competition-settings space-y-6">
    <!-- Archive Section -->
    <Card v-if="!competition.is_archived">
      <template #title>🗄️ Archive Competition</template>
      <template #content>
        <p class="text-gray-600 mb-4">
          Archive this competition when the series has ended but you want to preserve all
          historical data. Archived competitions:
        </p>
        <ul class="list-disc pl-6 mb-4 space-y-1 text-gray-600">
          <li>Hidden from active lists</li>
          <li>Read-only (cannot be edited)</li>
          <li>Can be reviewed later</li>
          <li>Preserve all seasons, races, and results</li>
        </ul>

        <Button
          label="Archive Competition"
          severity="secondary"
          :loading="isArchiving"
          @click="handleArchive"
        />
      </template>
    </Card>

    <!-- Danger Zone -->
    <Card>
      <template #title>
        <span class="text-red-600">⚠️ Danger Zone</span>
      </template>
      <template #content>
        <Message severity="error" :closable="false" class="mb-4">
          <strong>PERMANENT DELETION</strong>
        </Message>

        <p class="text-gray-600 mb-4">
          Deleting this competition will permanently remove all seasons, races, results, and
          historical data. This action cannot be undone.
        </p>

        <Button
          label="Delete Competition"
          severity="danger"
          @click="handleDelete"
        />
      </template>
    </Card>

    <CompetitionDeleteDialog
      v-model:visible="showDeleteDialog"
      :competition="competition"
      @confirmed="handleCompetitionDeleted"
    />
  </div>
</template>
```

---

### Days 14-15: Testing & Polish (8 hours)

#### Task 14.1: Component Tests

Write tests for:
- ✅ CompetitionFormDrawer.test.ts
- ✅ CompetitionCard.test.ts
- ✅ CompetitionList.test.ts
- ✅ CompetitionDeleteDialog.test.ts
- ✅ competitionStore.test.ts
- ✅ useLeaguePlatforms.test.ts

#### Task 14.2: E2E Tests (Playwright)

**File**: `tests/e2e/competition-management.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Competition Management', () => {
  test('can create competition', async ({ page }) => {
    // Login
    // Navigate to league
    // Click Competitions tab
    // Click New Competition
    // Fill form
    // Submit
    // Verify card appears
  });

  test('can edit competition', async ({ page }) => {
    // ... test edit flow
  });

  test('shows name change warning', async ({ page }) => {
    // ... test name change confirmation
  });

  test('2-step delete flow works', async ({ page }) => {
    // ... test delete with archive suggestion
  });
});
```

#### Task 14.3: Manual Testing Checklist

Test all flows:
- ✅ Create competition (with logo)
- ✅ Create competition (without logo, check fallback)
- ✅ Edit competition name (verify warning)
- ✅ Edit competition description
- ✅ Edit competition logo
- ✅ Try to change platform (verify disabled)
- ✅ Delete competition (archive path)
- ✅ Delete competition (delete path)
- ✅ Archive competition
- ✅ Slug preview shows correctly
- ✅ Slug availability check works
- ✅ Platform dropdown filters to league platforms
- ✅ Navigation works (league → competition → back)
- ✅ All toast notifications show

---

## Frontend Complete Checklist

### Foundation
- ✅ Types defined
- ✅ Service layer implemented
- ✅ Store implemented
- ✅ useLeaguePlatforms composable
- ✅ useCompetitionValidation composable
- ✅ All composable tests pass

### Components
- ✅ CompetitionFormDrawer (create/edit)
- ✅ CompetitionCard
- ✅ CompetitionList
- ✅ CompetitionDeleteDialog (2-step)
- ✅ CompetitionHeader
- ✅ CompetitionSettings
- ✅ All component tests pass

### Views & Integration
- ✅ CompetitionDetail view
- ✅ LeagueDetail updated (Competitions tab)
- ✅ Routing configured
- ✅ Navigation works

### Features
- ✅ Create competition with slug preview
- ✅ Edit competition with name change warning
- ✅ Delete competition with archive suggestion
- ✅ Archive competition
- ✅ Platform locked after creation
- ✅ Logo upload works
- ✅ Logo fallback displayed
- ✅ Validation works
- ✅ Error handling works

### Quality
- ✅ No TypeScript errors
- ✅ 80%+ test coverage
- ✅ E2E tests pass
- ✅ Manual testing complete
- ✅ Responsive design works

---

## Time Summary

- **Week 1**: Foundation (7 days)
- **Week 2**: Integration (4 days)
- **Week 3**: Detail View + Testing (5 days)

**Total**: ~2.5 weeks

---

## Next Steps

Frontend complete! Competition feature is now fully functional from league dashboard to detail view.

**Future Enhancements** (v3):
- Archive restore functionality
- Advanced filtering
- Competition templates
- Bulk operations
- Manager role support

---

## Refactoring Notes

**Post-Implementation Refactoring**:

1. **Extract Driver Table Platform Filter** (1 hour)
   - Refactor `ReadOnlyDriverTable.vue` to use `useLeaguePlatforms`
   - Test existing Driver functionality still works

2. **Shared Empty State Component** (30 mins)
   - Create `EmptyState.vue` component
   - Reuse across Competition, Driver, etc.

3. **Form Components** (if needed)
   - Extract common patterns to shared form components
   - Document in component library

---

**Document Complete!** Ready to start frontend implementation.
