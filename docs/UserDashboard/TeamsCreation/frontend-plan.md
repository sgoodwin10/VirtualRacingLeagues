# Teams Creation Feature - Frontend Implementation Plan

## Overview
This plan follows the Vue 3 + TypeScript patterns established in this project. All implementation should follow the patterns documented in `.claude/guides/frontend/admin-dashboard-development-guide.md`.

**Agent to use:** `dev-fe-user`

**Key Dependencies:**
- Vue 3 with Composition API (`<script setup lang="ts">`)
- TypeScript (strict mode)
- PrimeVue 4 (Dropdown/Select for inline editor)
- Pinia for state management
- VueUse composables
- Vitest for testing

---

## Step 1: TypeScript Types

**File:** `resources/app/js/types/team.ts`

```typescript
/**
 * Team-related TypeScript types and interfaces
 */

/**
 * Team entity
 */
export interface Team {
  id: number;
  season_id: number;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create team request
 */
export interface CreateTeamRequest {
  name: string;
  logo?: File;
}

/**
 * Update team request
 */
export interface UpdateTeamRequest {
  name: string;
  logo?: File | null;
  remove_logo?: boolean;
}

/**
 * Team form state (internal)
 */
export interface TeamForm {
  name: string;
  logo: File | null;
  logo_url: string | null;
}

/**
 * Team form validation errors
 */
export interface TeamFormErrors {
  name?: string;
  logo?: string;
}

/**
 * Team select option (for driver assignment dropdown)
 */
export interface TeamOption {
  label: string;
  value: number | null; // null represents "Privateer"
  logo_url?: string | null;
}

/**
 * Driver count response
 */
export interface TeamDriverCountResponse {
  count: number;
}
```

**Update:** `resources/app/js/types/seasonDriver.ts`

Add to SeasonDriver interface:
```typescript
export interface SeasonDriver {
  // ... existing fields
  team_id: number | null;
  team_name: string | null;
  team_logo_url: string | null;
}
```

---

## Step 2: API Service

**File:** `resources/app/js/services/teamService.ts`

```typescript
import axios from 'axios';
import type {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamDriverCountResponse,
} from '@app/types/team';

/**
 * Team API Service
 */
class TeamService {
  private baseUrl = '/api/seasons';

  /**
   * Get all teams for a season
   */
  async getTeamsBySeasonId(seasonId: number): Promise<Team[]> {
    const response = await axios.get<{ data: Team[] }>(
      `${this.baseUrl}/${seasonId}/teams`
    );
    return response.data.data;
  }

  /**
   * Create a new team
   */
  async createTeam(seasonId: number, data: CreateTeamRequest): Promise<Team> {
    const formData = new FormData();
    formData.append('name', data.name);

    if (data.logo) {
      formData.append('logo', data.logo);
    }

    const response = await axios.post<{ data: Team }>(
      `${this.baseUrl}/${seasonId}/teams`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Update a team
   */
  async updateTeam(
    seasonId: number,
    teamId: number,
    data: UpdateTeamRequest
  ): Promise<Team> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('_method', 'PUT');

    if (data.logo) {
      formData.append('logo', data.logo);
    }

    if (data.remove_logo) {
      formData.append('remove_logo', '1');
    }

    const response = await axios.post<{ data: Team }>(
      `${this.baseUrl}/${seasonId}/teams/${teamId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Delete a team
   */
  async deleteTeam(seasonId: number, teamId: number): Promise<void> {
    await axios.delete(`${this.baseUrl}/${seasonId}/teams/${teamId}`);
  }

  /**
   * Get driver count for a team
   */
  async getDriverCount(seasonId: number, teamId: number): Promise<number> {
    const response = await axios.get<{ data: TeamDriverCountResponse }>(
      `${this.baseUrl}/${seasonId}/teams/${teamId}/driver-count`
    );
    return response.data.data.count;
  }

  /**
   * Assign/change driver's team
   */
  async assignDriverTeam(
    seasonId: number,
    driverId: number,
    teamId: number | null
  ): Promise<void> {
    await axios.put(`${this.baseUrl}/${seasonId}/drivers/${driverId}/team`, {
      team_id: teamId,
    });
  }
}

export const teamService = new TeamService();
export default teamService;
```

---

## Step 3: Pinia Store

**File:** `resources/app/js/stores/teamStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Team, CreateTeamRequest, UpdateTeamRequest } from '@app/types/team';
import teamService from '@app/services/teamService';

export const useTeamStore = defineStore('team', () => {
  // State
  const teams = ref<Team[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const teamCount = computed(() => teams.value.length);

  const getTeamById = computed(() => {
    return (teamId: number) => teams.value.find((team) => team.id === teamId);
  });

  const teamOptions = computed(() => {
    const options = teams.value.map((team) => ({
      label: team.name,
      value: team.id,
      logo_url: team.logo_url,
    }));

    // Add "Privateer" option at the beginning
    return [
      {
        label: 'Privateer',
        value: null,
        logo_url: null,
      },
      ...options,
    ];
  });

  // Actions
  async function fetchTeams(seasonId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      teams.value = await teamService.getTeamsBySeasonId(seasonId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch teams';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createTeam(seasonId: number, data: CreateTeamRequest): Promise<Team> {
    loading.value = true;
    error.value = null;

    try {
      const team = await teamService.createTeam(seasonId, data);
      teams.value.push(team);
      return team;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create team';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTeam(
    seasonId: number,
    teamId: number,
    data: UpdateTeamRequest
  ): Promise<Team> {
    loading.value = true;
    error.value = null;

    try {
      const updatedTeam = await teamService.updateTeam(seasonId, teamId, data);

      // Update in store
      const index = teams.value.findIndex((t) => t.id === teamId);
      if (index !== -1) {
        teams.value[index] = updatedTeam;
      }

      return updatedTeam;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update team';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTeam(seasonId: number, teamId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await teamService.deleteTeam(seasonId, teamId);

      // Remove from store
      teams.value = teams.value.filter((t) => t.id !== teamId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete team';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getDriverCount(seasonId: number, teamId: number): Promise<number> {
    try {
      return await teamService.getDriverCount(seasonId, teamId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get driver count';
      throw err;
    }
  }

  async function assignDriverTeam(
    seasonId: number,
    driverId: number,
    teamId: number | null
  ): Promise<void> {
    try {
      await teamService.assignDriverTeam(seasonId, driverId, teamId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to assign team';
      throw err;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function $reset(): void {
    teams.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    teams,
    loading,
    error,

    // Getters
    teamCount,
    getTeamById,
    teamOptions,

    // Actions
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    getDriverCount,
    assignDriverTeam,
    clearError,
    $reset,
  };
});
```

---

## Step 4: Components

### 4.1 TeamFormModal Component

**File:** `resources/app/js/components/season/teams/TeamFormModal.vue`

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import type { Team, TeamForm, TeamFormErrors } from '@app/types/team';

import BaseModal from '@app/components/common/modals/BaseModal.vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Message from 'primevue/message';

interface Props {
  visible: boolean;
  team?: Team | null;
  seasonId: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved', team: Team): void;
}

const props = withDefaults(defineProps<Props>(), {
  team: null,
});

const emit = defineEmits<Emits>();
const toast = useToast();

// Form state
const form = ref<TeamForm>({
  name: '',
  logo: null,
  logo_url: null,
});

const errors = ref<TeamFormErrors>({});
const isSubmitting = ref(false);
const removeLogo = ref(false);

// Computed
const isEditMode = computed(() => !!props.team);
const modalTitle = computed(() => (isEditMode.value ? 'Edit Team' : 'Add Team'));
const isValid = computed(() => {
  return form.value.name.trim().length >= 2 && form.value.name.trim().length <= 60;
});

// Watch for prop changes
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm();
      if (props.team) {
        form.value.name = props.team.name;
        form.value.logo_url = props.team.logo_url;
      }
    }
  }
);

// Methods
function resetForm(): void {
  form.value = {
    name: '',
    logo: null,
    logo_url: null,
  };
  errors.value = {};
  isSubmitting.value = false;
  removeLogo.value = false;
}

function validateName(): void {
  const length = form.value.name.trim().length;

  if (length === 0) {
    errors.value.name = 'Team name is required';
  } else if (length < 2) {
    errors.value.name = 'Team name must be at least 2 characters';
  } else if (length > 60) {
    errors.value.name = 'Team name cannot exceed 60 characters';
  } else {
    delete errors.value.name;
  }
}

function handleLogoSelect(event: { files: File[] }): void {
  if (event.files && event.files.length > 0) {
    const file = event.files[0];

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      errors.value.logo = 'Logo cannot exceed 2MB';
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      errors.value.logo = 'Logo must be a JPG, PNG, or SVG file';
      return;
    }

    delete errors.value.logo;
    form.value.logo = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      form.value.logo_url = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

function handleRemoveLogo(): void {
  form.value.logo = null;
  form.value.logo_url = null;
  removeLogo.value = true;
}

async function handleSubmit(): Promise<void> {
  validateName();

  if (!isValid.value || Object.keys(errors.value).length > 0) {
    return;
  }

  isSubmitting.value = true;

  try {
    const data = {
      name: form.value.name.trim(),
      logo: form.value.logo || undefined,
      remove_logo: removeLogo.value,
    };

    // Emit saved event (parent will handle API call via store)
    emit('saved', data as any);

    toast.add({
      severity: 'success',
      summary: isEditMode.value ? 'Team Updated' : 'Team Created',
      detail: `${form.value.name} has been ${isEditMode.value ? 'updated' : 'created'}`,
      life: 3000,
    });

    handleClose();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to save team',
      life: 5000,
    });
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose(): void {
  emit('update:visible', false);
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :header="modalTitle"
    width="lg"
    :loading="isSubmitting"
    @update:visible="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Team Name -->
      <div class="space-y-2">
        <label for="team-name" class="block text-sm font-semibold text-gray-700">
          Team Name <span class="text-red-500">*</span>
        </label>
        <InputText
          id="team-name"
          v-model="form.name"
          class="w-full"
          :class="{ 'p-invalid': errors.name }"
          placeholder="Enter team name"
          :maxlength="60"
          @blur="validateName"
        />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
        <small v-else class="text-gray-500">{{ form.name.length }}/60 characters</small>
      </div>

      <!-- Team Logo -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700">Team Logo</label>

        <!-- Current Logo Preview -->
        <div v-if="form.logo_url && !form.logo" class="mb-4">
          <div class="flex items-center gap-4">
            <img :src="form.logo_url" alt="Team logo" class="w-20 h-20 object-contain" />
            <Button
              label="Remove Logo"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              outlined
              @click="handleRemoveLogo"
            />
          </div>
        </div>

        <!-- New Logo Preview -->
        <div v-else-if="form.logo_url && form.logo" class="mb-4">
          <div class="flex items-center gap-4">
            <img :src="form.logo_url" alt="Team logo preview" class="w-20 h-20 object-contain" />
            <Button
              label="Remove"
              icon="pi pi-times"
              severity="secondary"
              size="small"
              outlined
              @click="handleRemoveLogo"
            />
          </div>
        </div>

        <!-- File Upload -->
        <FileUpload
          v-if="!form.logo_url"
          mode="basic"
          accept="image/jpeg,image/png,image/svg+xml"
          :max-file-size="2097152"
          choose-label="Choose Logo"
          class="w-full"
          @select="handleLogoSelect"
        />

        <Message v-if="errors.logo" severity="error" :closable="false">
          {{ errors.logo }}
        </Message>

        <small class="text-gray-500 block">
          Optional. JPG, PNG, or SVG. Max 2MB.
        </small>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" severity="secondary" outlined @click="handleClose" />
        <Button
          :label="isEditMode ? 'Update' : 'Create'"
          :disabled="!isValid || isSubmitting"
          :loading="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </template>
  </BaseModal>
</template>
```

### 4.2 TeamsPanel Component

**File:** `resources/app/js/components/season/teams/TeamsPanel.vue`

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useTeamStore } from '@app/stores/teamStore';
import type { Team } from '@app/types/team';

import BasePanel from '@app/components/common/panels/BasePanel.vue';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';
import TeamFormModal from './TeamFormModal.vue';

interface Props {
  seasonId: number;
  teamChampionshipEnabled: boolean;
}

const props = defineProps<Props>();

const confirm = useConfirm();
const toast = useToast();
const teamStore = useTeamStore();

const showFormModal = ref(false);
const selectedTeam = ref<Team | null>(null);

const teams = computed(() => teamStore.teams);
const loading = computed(() => teamStore.loading);

onMounted(async () => {
  if (props.teamChampionshipEnabled) {
    await loadTeams();
  }
});

async function loadTeams(): Promise<void> {
  try {
    await teamStore.fetchTeams(props.seasonId);
  } catch (error) {
    console.error('Failed to load teams:', error);
  }
}

function handleAddTeam(): void {
  selectedTeam.value = null;
  showFormModal.value = true;
}

function handleEditTeam(team: Team): void {
  selectedTeam.value = team;
  showFormModal.value = true;
}

async function handleTeamSaved(data: any): Promise<void> {
  try {
    if (selectedTeam.value) {
      // Update
      await teamStore.updateTeam(props.seasonId, selectedTeam.value.id, data);
    } else {
      // Create
      await teamStore.createTeam(props.seasonId, data);
    }

    showFormModal.value = false;
  } catch (error) {
    console.error('Failed to save team:', error);
  }
}

async function handleDeleteTeam(team: Team): Promise<void> {
  try {
    // Get driver count
    const driverCount = await teamStore.getDriverCount(props.seasonId, team.id);

    const message =
      driverCount > 0
        ? `Delete ${team.name}? ${driverCount} ${driverCount === 1 ? 'driver' : 'drivers'} will become Privateer.`
        : `Delete ${team.name}?`;

    confirm.require({
      message,
      header: 'Delete Team',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptClass: 'p-button-danger',
      accept: async () => {
        try {
          await teamStore.deleteTeam(props.seasonId, team.id);

          toast.add({
            severity: 'success',
            summary: 'Team Deleted',
            detail: `${team.name} has been deleted`,
            life: 3000,
          });

          // Reload season drivers to reflect team changes
          // (parent component should listen for this event)
          // emit('team-deleted')
        } catch (error) {
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete team',
            life: 5000,
          });
        }
      },
    });
  } catch (error) {
    console.error('Failed to get driver count:', error);
  }
}
</script>

<template>
  <BasePanel header="Teams" class="h-full">
    <!-- Team Championship Disabled -->
    <Message v-if="!teamChampionshipEnabled" severity="info" :closable="false">
      Teams not enabled for this season
    </Message>

    <!-- Teams Management -->
    <div v-else class="space-y-4">
      <!-- Add Team Button -->
      <div class="flex justify-end">
        <Button
          label="Add Team"
          icon="pi pi-plus"
          size="small"
          @click="handleAddTeam"
        />
      </div>

      <!-- Teams Table -->
      <DataTable
        :value="teams"
        :loading="loading"
        striped-rows
        show-gridlines
        responsive-layout="scroll"
        :rows="10"
        paginator
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #empty>
          <div class="text-center py-8">
            <i class="pi pi-users text-4xl text-gray-400 mb-3"></i>
            <p class="text-gray-600">No teams created yet.</p>
          </div>
        </template>

        <template #loading>
          <div class="text-center py-8 text-gray-500">Loading teams...</div>
        </template>

        <!-- Team Name with Logo -->
        <Column field="name" header="Name">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <img
                v-if="data.logo_url"
                :src="data.logo_url"
                :alt="data.name"
                class="w-8 h-8 object-contain"
              />
              <span class="font-semibold">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <!-- Actions -->
        <Column header="Actions" :exportable="false">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                size="small"
                outlined
                @click="handleEditTeam(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                outlined
                @click="handleDeleteTeam(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Team Form Modal -->
    <TeamFormModal
      v-model:visible="showFormModal"
      :season-id="seasonId"
      :team="selectedTeam"
      @saved="handleTeamSaved"
    />

    <ConfirmDialog />
  </BasePanel>
</template>
```

### 4.3 Update SeasonDriversTable Component

**File:** `resources/app/js/components/season/SeasonDriversTable.vue` (updates)

Add to `<script setup>`:

```typescript
import { useTeamStore } from '@app/stores/teamStore';
import Select from 'primevue/select';

// Add prop
interface Props {
  // ... existing props
  teamChampionshipEnabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  // ... existing defaults
  teamChampionshipEnabled: false,
});

const teamStore = useTeamStore();

// Computed
const teamOptions = computed(() => teamStore.teamOptions);
const showTeamColumn = computed(() => props.teamChampionshipEnabled);

// Methods
async function handleTeamChange(driver: SeasonDriver, teamId: number | null): Promise<void> {
  try {
    await teamStore.assignDriverTeam(props.seasonId, driver.id, teamId);

    // Update local driver data
    driver.team_id = teamId;
    const team = teamStore.teams.find((t) => t.id === teamId);
    driver.team_name = team?.name || null;
    driver.team_logo_url = team?.logo_url || null;

    toast.add({
      severity: 'success',
      summary: 'Team Updated',
      detail: `${getDriverDisplayName(driver)}'s team has been updated`,
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update team assignment',
      life: 5000,
    });
  }
}
```

Update template - replace the existing team column:

```vue
<!-- Team Column (Inline Editor) -->
<Column v-if="showTeamColumn" field="team_name" header="Team">
  <template #body="{ data }">
    <Select
      v-model="data.team_id"
      :options="teamOptions"
      option-label="label"
      option-value="value"
      placeholder="Select team"
      class="w-full"
      @change="handleTeamChange(data, data.team_id)"
    >
      <template #value="{ value }">
        <div v-if="value === null" class="text-gray-500">Privateer</div>
        <div v-else class="flex items-center gap-2">
          <img
            v-if="data.team_logo_url"
            :src="data.team_logo_url"
            :alt="data.team_name"
            class="w-6 h-6 object-contain"
          />
          <span>{{ data.team_name }}</span>
        </div>
      </template>
      <template #option="{ option }">
        <div class="flex items-center gap-2">
          <img
            v-if="option.logo_url"
            :src="option.logo_url"
            :alt="option.label"
            class="w-6 h-6 object-contain"
          />
          <span>{{ option.label }}</span>
        </div>
      </template>
    </Select>
  </template>
</Column>
```

---

## Step 5: Update SeasonDetail View

**File:** `resources/app/js/views/SeasonDetail.vue` (updates)

Add to `<script setup>`:

```typescript
import { useTeamStore } from '@app/stores/teamStore';
import TeamsPanel from '@app/components/season/teams/TeamsPanel.vue';

const teamStore = useTeamStore();

// Update loadDrivers to also load teams
async function loadDrivers(): Promise<void> {
  try {
    await Promise.all([
      seasonDriverStore.fetchSeasonDrivers(seasonId.value),
      seasonDriverStore.fetchStats(seasonId.value),
      season.value?.team_championship_enabled
        ? teamStore.fetchTeams(seasonId.value)
        : Promise.resolve(),
    ]);
  } catch (error) {
    console.error('Failed to load drivers:', error);
  }
}
```

Update the Drivers tab template (around line 317):

```vue
<!-- Drivers Tab -->
<TabPanel value="drivers">
  <div class="space-y-6">
    <!-- Manage Drivers Button -->
    <div class="flex justify-between items-center">
      <h3 class="text-xl font-semibold">Season Drivers</h3>
      <Button
        label="Manage Drivers"
        icon="pi pi-users"
        :disabled="season.is_archived"
        @click="handleManageDrivers"
      />
    </div>

    <!-- 75/25 Layout: Drivers Table / Teams Panel -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Drivers Table (75%) -->
      <div class="lg:col-span-3">
        <SeasonDriversTable
          :season-id="seasonId"
          :platform-id="season.competition?.platform_id"
          :team-championship-enabled="season.team_championship_enabled"
          :loading="seasonDriverStore.loading"
          @edit="handleEditDriver"
        />
      </div>

      <!-- Teams Panel (25%) -->
      <div class="lg:col-span-1">
        <TeamsPanel
          :season-id="seasonId"
          :team-championship-enabled="season.team_championship_enabled"
        />
      </div>
    </div>
  </div>
</TabPanel>
```

---

## Step 6: Testing

### 6.1 TeamFormModal Tests

**File:** `resources/app/js/components/season/teams/__tests__/TeamFormModal.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TeamFormModal from '../TeamFormModal.vue';
import PrimeVue from 'primevue/config';

describe('TeamFormModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders in create mode', () => {
    const wrapper = mount(TeamFormModal, {
      global: {
        plugins: [PrimeVue],
      },
      props: {
        visible: true,
        seasonId: 1,
      },
    });

    expect(wrapper.find('input[id="team-name"]').exists()).toBe(true);
  });

  it('validates team name length', async () => {
    const wrapper = mount(TeamFormModal, {
      global: {
        plugins: [PrimeVue],
      },
      props: {
        visible: true,
        seasonId: 1,
      },
    });

    const input = wrapper.find('input[id="team-name"]');
    await input.setValue('A');
    await input.trigger('blur');

    expect(wrapper.text()).toContain('Team name must be at least 2 characters');
  });

  it('populates form in edit mode', () => {
    const team = {
      id: 1,
      season_id: 1,
      name: 'Test Team',
      logo_url: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const wrapper = mount(TeamFormModal, {
      global: {
        plugins: [PrimeVue],
      },
      props: {
        visible: true,
        seasonId: 1,
        team,
      },
    });

    const input = wrapper.find('input[id="team-name"]');
    expect((input.element as HTMLInputElement).value).toBe('Test Team');
  });
});
```

### 6.2 TeamsPanel Tests

**File:** `resources/app/js/components/season/teams/__tests__/TeamsPanel.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TeamsPanel from '../TeamsPanel.vue';
import PrimeVue from 'primevue/config';

describe('TeamsPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows disabled message when championship not enabled', () => {
    const wrapper = mount(TeamsPanel, {
      global: {
        plugins: [PrimeVue],
      },
      props: {
        seasonId: 1,
        teamChampionshipEnabled: false,
      },
    });

    expect(wrapper.text()).toContain('Teams not enabled for this season');
  });

  it('shows add team button when championship enabled', () => {
    const wrapper = mount(TeamsPanel, {
      global: {
        plugins: [PrimeVue],
      },
      props: {
        seasonId: 1,
        teamChampionshipEnabled: true,
      },
    });

    expect(wrapper.find('button').text()).toContain('Add Team');
  });
});
```

### 6.3 Team Store Tests

**File:** `resources/app/js/stores/__tests__/teamStore.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTeamStore } from '../teamStore';
import teamService from '@app/services/teamService';

vi.mock('@app/services/teamService');

describe('Team Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetches teams successfully', async () => {
    const mockTeams = [
      {
        id: 1,
        season_id: 1,
        name: 'Team A',
        logo_url: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    vi.mocked(teamService.getTeamsBySeasonId).mockResolvedValue(mockTeams);

    const store = useTeamStore();
    await store.fetchTeams(1);

    expect(store.teams).toEqual(mockTeams);
    expect(store.teamCount).toBe(1);
  });

  it('creates team with Privateer option first', async () => {
    const mockTeams = [
      {
        id: 1,
        season_id: 1,
        name: 'Team A',
        logo_url: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    vi.mocked(teamService.getTeamsBySeasonId).mockResolvedValue(mockTeams);

    const store = useTeamStore();
    await store.fetchTeams(1);

    const options = store.teamOptions;
    expect(options[0]).toEqual({
      label: 'Privateer',
      value: null,
      logo_url: null,
    });
    expect(options[1].label).toBe('Team A');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(teamService.getTeamsBySeasonId).mockRejectedValue(
      new Error('Network error')
    );

    const store = useTeamStore();

    await expect(store.fetchTeams(1)).rejects.toThrow('Network error');
    expect(store.error).toBe('Network error');
  });
});
```

---

## Step 7: Implementation Checklist

### Types
- [ ] Create `resources/app/js/types/team.ts`
- [ ] Update `resources/app/js/types/seasonDriver.ts` (add team fields)

### Services
- [ ] Create `resources/app/js/services/teamService.ts`

### Store
- [ ] Create `resources/app/js/stores/teamStore.ts`

### Components
- [ ] Create `resources/app/js/components/season/teams/` directory
- [ ] Create `TeamFormModal.vue`
- [ ] Create `TeamsPanel.vue`
- [ ] Update `SeasonDriversTable.vue` (inline team editor)

### Views
- [ ] Update `SeasonDetail.vue` (75/25 layout, load teams)

### Tests
- [ ] Create `resources/app/js/components/season/teams/__tests__/` directory
- [ ] Create `TeamFormModal.test.ts`
- [ ] Create `TeamsPanel.test.ts`
- [ ] Create `resources/app/js/stores/__tests__/teamStore.test.ts`
- [ ] Run all tests: `npm run test:user`

### Quality Checks
- [ ] Run type checking: `npm run type-check`
- [ ] Run linting: `npm run lint:user`
- [ ] Run formatting: `npm run format:user`
- [ ] Test in browser with hot reload

---

## Step 8: Manual Testing Checklist

### Team CRUD
- [ ] Create team without logo
- [ ] Create team with logo
- [ ] Edit team name only
- [ ] Edit team and add logo
- [ ] Edit team and replace logo
- [ ] Edit team and remove logo
- [ ] Delete team with no drivers
- [ ] Delete team with drivers (verify Privateer assignment)

### Driver Assignment
- [ ] Assign driver to team via inline dropdown
- [ ] Change driver from one team to another
- [ ] Set driver to Privateer
- [ ] Verify dropdown shows team logos
- [ ] Verify "Privateer" appears first in dropdown

### Conditional Display
- [ ] Verify team column hidden when `team_championship_enabled` is false
- [ ] Verify teams panel shows "not enabled" message when disabled
- [ ] Verify team column visible when enabled
- [ ] Verify teams panel shows table when enabled

### Edge Cases
- [ ] Test with season with no teams
- [ ] Test with season with many teams (pagination)
- [ ] Test team name at min length (2 chars)
- [ ] Test team name at max length (60 chars)
- [ ] Test logo file size validation (max 2MB)
- [ ] Test logo file type validation (JPG/PNG/SVG)
- [ ] Test network error handling
- [ ] Test concurrent team edits

---

## Notes

1. **PrimeVue 4 Select**: Use `Select` component (formerly `Dropdown`) for inline team editor
2. **Image Preview**: FileUpload + FileReader for logo preview before upload
3. **Privateer Option**: Always first in dropdown with `value: null`
4. **Grid Layout**: Use `grid-cols-1 lg:grid-cols-4` for responsive 75/25 split
5. **Toast Notifications**: Show success/error messages for all operations
6. **Confirm Dialog**: Show driver count in delete confirmation
7. **Loading States**: Show loading indicators during API calls
8. **Error Handling**: Display user-friendly error messages

## References

- Season Form Drawer: `resources/app/js/components/season/modals/SeasonFormDrawer.vue`
- Base Modal: `resources/app/js/components/common/modals/BaseModal.vue`
- Season Drivers Table: `resources/app/js/components/season/SeasonDriversTable.vue`
- Admin Frontend Guide: `.claude/guides/frontend/admin-dashboard-development-guide.md`
- PrimeVue Select (v4): Use Context7 for latest docs
