# Round Creation - Frontend Implementation Plan

**Version:** 1.0
**Last Updated:** October 25, 2025
**Framework:** Vue 3 + TypeScript + PrimeVue 4

---

## Table of Contents

1. [Overview](#overview)
2. [Type Definitions](#type-definitions)
3. [API Services](#api-services)
4. [Pinia Stores](#pinia-stores)
5. [Composables](#composables)
6. [Components](#components)
7. [Routing](#routing)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Checklist](#implementation-checklist)

---

## Overview

This document provides complete frontend implementation details following Vue 3 Composition API patterns and established codebase conventions (reference: Division and Season implementations).

### Technology Stack

- **Vue 3** - Composition API with `<script setup lang="ts">`
- **TypeScript** - Strict mode
- **Pinia** - State management
- **PrimeVue 4** - UI components (Aura theme)
- **Tailwind CSS 4** - Utility-first styling
- **VueUse** - Composition utilities
- **Vitest** - Unit testing
- **date-fns** - Date formatting

### File Organization

```
resources/app/js/
├── components/
│   └── round/
│       ├── RoundsPanel.vue                 # Main panel with rounds list
│       ├── RoundAccordionItem.vue          # Single round in accordion
│       ├── RaceListItem.vue                # Race display within round
│       └── modals/
│           ├── RoundFormDrawer.vue         # Create/edit round drawer
│           └── RaceFormDrawer.vue          # Create/edit race drawer
├── services/
│   ├── roundService.ts                     # Round API calls
│   ├── raceService.ts                      # Race API calls
│   ├── trackService.ts                     # Track search API calls
│   └── raceSettingsService.ts              # Platform settings API calls
├── stores/
│   ├── roundStore.ts                       # Round state management
│   ├── raceStore.ts                        # Race state management
│   ├── trackStore.ts                       # Track data cache
│   └── raceSettingsStore.ts                # Platform settings cache
├── composables/
│   ├── useRoundValidation.ts               # Round form validation
│   ├── useRaceValidation.ts                # Race form validation
│   └── useTrackSearch.ts                   # Track search logic
├── types/
│   ├── round.ts                            # Round types
│   ├── race.ts                             # Race types
│   └── track.ts                            # Track types
└── views/
    └── SeasonDetail.vue                    # (Modified) Add Rounds tab
```

---

## Type Definitions

### 1. Round Types

**Location:** `resources/app/js/types/round.ts`

```typescript
// Main entity (matches backend RoundData DTO)
export interface Round {
  id: number;
  season_id: number;
  round_number: number;
  name: string | null;
  slug: string;
  scheduled_at: string; // ISO 8601 format
  timezone: string;
  platform_track_id: number;
  track_layout: string | null;
  track_conditions: string | null;
  technical_notes: string | null;
  stream_url: string | null;
  internal_notes: string | null;
  status: RoundStatus;
  status_label: string;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type RoundStatus = 'scheduled' | 'pre_race' | 'in_progress' | 'completed' | 'cancelled';

// Create payload (matches backend CreateRoundData DTO)
export interface CreateRoundRequest {
  round_number: number;
  name?: string;
  scheduled_at: string; // 'YYYY-MM-DD HH:mm:ss'
  platform_track_id: number;
  track_layout?: string;
  track_conditions?: string;
  technical_notes?: string;
  stream_url?: string;
  internal_notes?: string;
}

// Update payload (matches backend UpdateRoundData DTO)
export interface UpdateRoundRequest {
  round_number?: number;
  name?: string;
  scheduled_at?: string;
  platform_track_id?: number;
  track_layout?: string;
  track_conditions?: string;
  technical_notes?: string;
  stream_url?: string;
  internal_notes?: string;
}

// Form state (internal component state)
export interface RoundForm {
  round_number: number;
  name: string;
  scheduled_at: Date | null;
  platform_track_id: number | null;
  track_layout: string;
  track_conditions: string;
  technical_notes: string;
  stream_url: string;
  internal_notes: string;
}

// Form errors
export interface RoundFormErrors {
  round_number?: string;
  name?: string;
  scheduled_at?: string;
  platform_track_id?: string;
  track_layout?: string;
  track_conditions?: string;
  technical_notes?: string;
  stream_url?: string;
  internal_notes?: string;
}

// Next round number response
export interface NextRoundNumberResponse {
  next_round_number: number;
}
```

---

### 2. Race Types

**Location:** `resources/app/js/types/race.ts`

```typescript
// Main entity (matches backend RaceData DTO)
export interface Race {
  id: number;
  round_id: number;
  race_number: number;
  name: string | null;
  race_type: RaceType | null;
  qualifying_format: QualifyingFormat;
  qualifying_length: number | null;
  qualifying_tire: string | null;
  grid_source: GridSource;
  grid_source_race_id: number | null;
  length_type: RaceLengthType;
  length_value: number;
  extra_lap_after_time: boolean;
  weather: string | null;
  tire_restrictions: string | null;
  fuel_usage: string | null;
  damage_model: string | null;
  track_limits_enforced: boolean;
  false_start_detection: boolean;
  collision_penalties: boolean;
  mandatory_pit_stop: boolean;
  minimum_pit_time: number | null;
  assists_restrictions: string | null;
  race_divisions: boolean;
  points_system: PointsSystemMap;
  bonus_points: BonusPoints | null;
  dnf_points: number;
  dns_points: number;
  race_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type RaceType = 'sprint' | 'feature' | 'endurance' | 'qualifying' | 'custom';
export type QualifyingFormat = 'standard' | 'time_trial' | 'none' | 'previous_race';
export type GridSource = 'qualifying' | 'previous_race' | 'reverse_previous' | 'championship' | 'reverse_championship' | 'manual';
export type RaceLengthType = 'laps' | 'time';

export interface PointsSystemMap {
  [position: number]: number; // 1: 25, 2: 18, etc.
}

export interface BonusPoints {
  pole?: number;
  fastest_lap?: number;
  fastest_lap_top_10_only?: boolean;
  most_positions_gained?: number;
  leading_most_laps?: number;
}

// Create payload
export interface CreateRaceRequest {
  race_number: number;
  name?: string;
  race_type?: RaceType;
  qualifying_format: QualifyingFormat;
  qualifying_length?: number;
  qualifying_tire?: string;
  grid_source: GridSource;
  grid_source_race_id?: number;
  length_type: RaceLengthType;
  length_value: number;
  extra_lap_after_time: boolean;
  weather?: string;
  tire_restrictions?: string;
  fuel_usage?: string;
  damage_model?: string;
  track_limits_enforced: boolean;
  false_start_detection: boolean;
  collision_penalties: boolean;
  mandatory_pit_stop: boolean;
  minimum_pit_time?: number;
  assists_restrictions?: string;
  race_divisions: boolean;
  points_system: PointsSystemMap;
  bonus_points?: BonusPoints;
  dnf_points: number;
  dns_points: number;
  race_notes?: string;
}

// Update payload
export interface UpdateRaceRequest extends Partial<CreateRaceRequest> {}

// Form state
export interface RaceForm {
  race_number: number;
  name: string;
  race_type: RaceType | null;
  qualifying_format: QualifyingFormat;
  qualifying_length: number;
  qualifying_tire: string;
  grid_source: GridSource;
  grid_source_race_id: number | null;
  length_type: RaceLengthType;
  length_value: number;
  extra_lap_after_time: boolean;
  weather: string;
  tire_restrictions: string;
  fuel_usage: string;
  damage_model: string;
  track_limits_enforced: boolean;
  false_start_detection: boolean;
  collision_penalties: boolean;
  mandatory_pit_stop: boolean;
  minimum_pit_time: number;
  assists_restrictions: string;
  race_divisions: boolean;
  points_template: 'f1' | 'custom';
  points_system: PointsSystemMap;
  bonus_pole: boolean;
  bonus_pole_points: number;
  bonus_fastest_lap: boolean;
  bonus_fastest_lap_points: number;
  bonus_fastest_lap_top_10: boolean;
  dnf_points: number;
  dns_points: number;
  race_notes: string;
}

// Form errors
export interface RaceFormErrors {
  race_number?: string;
  name?: string;
  qualifying_length?: string;
  length_value?: string;
  minimum_pit_time?: string;
  points_system?: string;
  // ... other fields
}

// Platform settings configuration
export interface PlatformSettingOption {
  value: string;
  label: string;
}

export interface PlatformRaceSettings {
  weather_conditions: PlatformSettingOption[];
  tire_restrictions: PlatformSettingOption[];
  fuel_usage: PlatformSettingOption[];
  damage_model: PlatformSettingOption[];
}
```

---

### 3. Track Types

**Location:** `resources/app/js/types/track.ts`

```typescript
export interface Track {
  id: number;
  platform_id: number;
  platform_track_location_id: number;
  name: string;
  slug: string;
  is_reverse: boolean;
  image_path: string | null;
  length_meters: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;

  // Relationships (if eager loaded)
  location?: TrackLocation;
}

export interface TrackLocation {
  id: number;
  name: string;
  slug: string;
  country: string;
  is_active: boolean;
  sort_order: number;
}

// For search/filter
export interface TrackSearchParams {
  platform_id: number;
  search?: string;
  is_active?: boolean;
}
```

---

## API Services

### 1. Round Service

**Location:** `resources/app/js/services/roundService.ts`

```typescript
import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type {
  Round,
  CreateRoundRequest,
  UpdateRoundRequest,
  NextRoundNumberResponse,
} from '@app/types/round';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// GET all rounds for a season
export async function getRounds(seasonId: number): Promise<Round[]> {
  const response: AxiosResponse<ApiResponse<Round[]>> = await apiClient.get(
    `/seasons/${seasonId}/rounds`
  );
  return response.data.data;
}

// GET single round
export async function getRound(roundId: number): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.get(
    `/rounds/${roundId}`
  );
  return response.data.data;
}

// POST create round
export async function createRound(
  seasonId: number,
  data: CreateRoundRequest
): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.post(
    `/seasons/${seasonId}/rounds`,
    data
  );
  return response.data.data;
}

// PUT update round
export async function updateRound(
  roundId: number,
  data: UpdateRoundRequest
): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.put(
    `/rounds/${roundId}`,
    data
  );
  return response.data.data;
}

// DELETE round
export async function deleteRound(roundId: number): Promise<void> {
  await apiClient.delete(`/rounds/${roundId}`);
}

// GET next round number suggestion
export async function getNextRoundNumber(seasonId: number): Promise<number> {
  const response: AxiosResponse<ApiResponse<NextRoundNumberResponse>> = await apiClient.get(
    `/seasons/${seasonId}/rounds/next-number`
  );
  return response.data.data.next_round_number;
}
```

---

### 2. Race Service

**Location:** `resources/app/js/services/raceService.ts`

```typescript
import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type { Race, CreateRaceRequest, UpdateRaceRequest } from '@app/types/race';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// GET all races for a round
export async function getRaces(roundId: number): Promise<Race[]> {
  const response: AxiosResponse<ApiResponse<Race[]>> = await apiClient.get(
    `/rounds/${roundId}/races`
  );
  return response.data.data;
}

// GET single race
export async function getRace(raceId: number): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.get(
    `/races/${raceId}`
  );
  return response.data.data;
}

// POST create race
export async function createRace(
  roundId: number,
  data: CreateRaceRequest
): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.post(
    `/rounds/${roundId}/races`,
    data
  );
  return response.data.data;
}

// PUT update race
export async function updateRace(
  raceId: number,
  data: UpdateRaceRequest
): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.put(
    `/races/${raceId}`,
    data
  );
  return response.data.data;
}

// DELETE race
export async function deleteRace(raceId: number): Promise<void> {
  await apiClient.delete(`/races/${raceId}`);
}
```

---

### 3. Track Service

**Location:** `resources/app/js/services/trackService.ts`

```typescript
import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type { Track, TrackSearchParams } from '@app/types/track';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// GET tracks with filters
export async function getTracks(params: TrackSearchParams): Promise<Track[]> {
  const response: AxiosResponse<ApiResponse<Track[]>> = await apiClient.get('/tracks', {
    params,
  });
  return response.data.data;
}

// GET single track
export async function getTrack(trackId: number): Promise<Track> {
  const response: AxiosResponse<ApiResponse<Track>> = await apiClient.get(
    `/tracks/${trackId}`
  );
  return response.data.data;
}
```

---

### 4. Race Settings Service

**Location:** `resources/app/js/services/raceSettingsService.ts`

```typescript
import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type { PlatformRaceSettings } from '@app/types/race';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// GET race settings for platform
export async function getRaceSettings(platformId: number): Promise<PlatformRaceSettings> {
  const response: AxiosResponse<ApiResponse<PlatformRaceSettings>> = await apiClient.get(
    `/platforms/${platformId}/race-settings`
  );
  return response.data.data;
}
```

---

## Pinia Stores

### 1. Round Store

**Location:** `resources/app/js/stores/roundStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Round, CreateRoundRequest, UpdateRoundRequest } from '@app/types/round';
import {
  getRounds,
  getRound,
  createRound,
  updateRound,
  deleteRound,
  getNextRoundNumber,
} from '@app/services/roundService';

export const useRoundStore = defineStore('round', () => {
  // State
  const rounds = ref<Round[]>([]);
  const currentRound = ref<Round | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const getRoundById = computed(() => {
    return (id: number) => rounds.value.find((r) => r.id === id);
  });

  const getRoundsBySeasonId = computed(() => {
    return (seasonId: number) => rounds.value.filter((r) => r.season_id === seasonId);
  });

  const scheduledRounds = computed(() => {
    return rounds.value.filter((r) => r.status === 'scheduled');
  });

  const completedRounds = computed(() => {
    return rounds.value.filter((r) => r.status === 'completed');
  });

  // Actions
  async function fetchRounds(seasonId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      rounds.value = await getRounds(seasonId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load rounds';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRound(roundId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      currentRound.value = await getRound(roundId);

      // Update in list if exists
      const index = rounds.value.findIndex((r) => r.id === roundId);
      if (index !== -1) {
        rounds.value[index] = currentRound.value;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load round';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createNewRound(
    seasonId: number,
    data: CreateRoundRequest
  ): Promise<Round> {
    loading.value = true;
    error.value = null;
    try {
      const newRound = await createRound(seasonId, data);
      rounds.value.push(newRound);
      return newRound;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create round';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateExistingRound(
    roundId: number,
    data: UpdateRoundRequest
  ): Promise<Round> {
    loading.value = true;
    error.value = null;
    try {
      const updated = await updateRound(roundId, data);

      const index = rounds.value.findIndex((r) => r.id === roundId);
      if (index !== -1) {
        rounds.value[index] = updated;
      }

      if (currentRound.value?.id === roundId) {
        currentRound.value = updated;
      }

      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update round';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteExistingRound(roundId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await deleteRound(roundId);
      rounds.value = rounds.value.filter((r) => r.id !== roundId);

      if (currentRound.value?.id === roundId) {
        currentRound.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete round';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchNextRoundNumber(seasonId: number): Promise<number> {
    try {
      return await getNextRoundNumber(seasonId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get next round number';
      throw err;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function resetStore(): void {
    rounds.value = [];
    currentRound.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    rounds,
    currentRound,
    loading,
    error,

    // Getters
    getRoundById,
    getRoundsBySeasonId,
    scheduledRounds,
    completedRounds,

    // Actions
    fetchRounds,
    fetchRound,
    createNewRound,
    updateExistingRound,
    deleteExistingRound,
    fetchNextRoundNumber,
    clearError,
    resetStore,
  };
});
```

---

### 2. Race Store

**Location:** `resources/app/js/stores/raceStore.ts`

Similar pattern to roundStore, manages race state.

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Race, CreateRaceRequest, UpdateRaceRequest } from '@app/types/race';
import { getRaces, getRace, createRace, updateRace, deleteRace } from '@app/services/raceService';

export const useRaceStore = defineStore('race', () => {
  const races = ref<Race[]>([]);
  const currentRace = ref<Race | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getRaceById = computed(() => {
    return (id: number) => races.value.find((r) => r.id === id);
  });

  const getRacesByRoundId = computed(() => {
    return (roundId: number) => races.value.filter((r) => r.round_id === roundId);
  });

  async function fetchRaces(roundId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      races.value = await getRaces(roundId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load races';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createNewRace(roundId: number, data: CreateRaceRequest): Promise<Race> {
    loading.value = true;
    error.value = null;
    try {
      const newRace = await createRace(roundId, data);
      races.value.push(newRace);
      return newRace;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create race';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ... similar methods for update, delete

  return {
    races,
    currentRace,
    loading,
    error,
    getRaceById,
    getRacesByRoundId,
    fetchRaces,
    createNewRace,
    // ...
  };
});
```

---

### 3. Track Store

**Location:** `resources/app/js/stores/trackStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Track, TrackSearchParams } from '@app/types/track';
import { getTracks, getTrack } from '@app/services/trackService';

export const useTrackStore = defineStore('track', () => {
  const tracks = ref<Track[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getTrackById = computed(() => {
    return (id: number) => tracks.value.find((t) => t.id === id);
  });

  async function fetchTracks(params: TrackSearchParams): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      tracks.value = await getTracks(params);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tracks';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function searchTracks(platformId: number, search: string): Promise<Track[]> {
    loading.value = true;
    error.value = null;
    try {
      const results = await getTracks({ platform_id: platformId, search });
      return results;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search tracks';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    tracks,
    loading,
    error,
    getTrackById,
    fetchTracks,
    searchTracks,
  };
});
```

---

### 4. Race Settings Store

**Location:** `resources/app/js/stores/raceSettingsStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PlatformRaceSettings } from '@app/types/race';
import { getRaceSettings } from '@app/services/raceSettingsService';

export const useRaceSettingsStore = defineStore('raceSettings', () => {
  // Cache settings by platform ID
  const settingsCache = ref<Map<number, PlatformRaceSettings>>(new Map());
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRaceSettings(platformId: number): Promise<PlatformRaceSettings> {
    // Return cached if available
    if (settingsCache.value.has(platformId)) {
      return settingsCache.value.get(platformId)!;
    }

    loading.value = true;
    error.value = null;
    try {
      const settings = await getRaceSettings(platformId);
      settingsCache.value.set(platformId, settings);
      return settings;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load race settings';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearCache(): void {
    settingsCache.value.clear();
  }

  return {
    settingsCache,
    loading,
    error,
    fetchRaceSettings,
    clearCache,
  };
});
```

---

## Composables

### 1. Round Validation

**Location:** `resources/app/js/composables/useRoundValidation.ts`

```typescript
import { reactive } from 'vue';
import type { RoundForm, RoundFormErrors } from '@app/types/round';

export function useRoundValidation(form: RoundForm) {
  const errors = reactive<RoundFormErrors>({});

  function validateRoundNumber(): string | undefined {
    if (!form.round_number) {
      return 'Round number is required';
    }
    if (form.round_number < 1 || form.round_number > 99) {
      return 'Round number must be between 1 and 99';
    }
    return undefined;
  }

  function validateName(): string | undefined {
    if (!form.name) {
      return undefined; // Optional field
    }
    if (form.name.trim().length < 3) {
      return 'Name must be at least 3 characters';
    }
    if (form.name.length > 100) {
      return 'Name cannot exceed 100 characters';
    }
    return undefined;
  }

  function validateScheduledAt(): string | undefined {
    if (!form.scheduled_at) {
      return 'Date and time is required';
    }
    return undefined;
  }

  function validatePlatformTrackId(): string | undefined {
    if (!form.platform_track_id) {
      return 'Track selection is required';
    }
    return undefined;
  }

  function validateStreamUrl(): string | undefined {
    if (!form.stream_url) {
      return undefined; // Optional
    }

    try {
      new URL(form.stream_url);
      return undefined;
    } catch {
      return 'Please enter a valid URL';
    }
  }

  function validateTechnicalNotes(): string | undefined {
    if (form.technical_notes && form.technical_notes.length > 2000) {
      return 'Technical notes cannot exceed 2000 characters';
    }
    return undefined;
  }

  function validateAll(): boolean {
    errors.round_number = validateRoundNumber();
    errors.name = validateName();
    errors.scheduled_at = validateScheduledAt();
    errors.platform_track_id = validatePlatformTrackId();
    errors.stream_url = validateStreamUrl();
    errors.technical_notes = validateTechnicalNotes();

    return !Object.values(errors).some((error) => error !== undefined);
  }

  function clearErrors(): void {
    Object.keys(errors).forEach((key) => {
      delete errors[key as keyof RoundFormErrors];
    });
  }

  return {
    errors,
    validateRoundNumber,
    validateName,
    validateScheduledAt,
    validatePlatformTrackId,
    validateStreamUrl,
    validateTechnicalNotes,
    validateAll,
    clearErrors,
  };
}
```

---

### 2. Race Validation

**Location:** `resources/app/js/composables/useRaceValidation.ts`

Similar pattern for race form validation.

---

### 3. Track Search

**Location:** `resources/app/js/composables/useTrackSearch.ts`

```typescript
import { ref, computed } from 'vue';
import { useTrackStore } from '@app/stores/trackStore';
import type { Track } from '@app/types/track';
import { debounce } from 'lodash-es';

export function useTrackSearch(platformId: number) {
  const trackStore = useTrackStore();
  const searchQuery = ref('');
  const searchResults = ref<Track[]>([]);
  const searching = ref(false);

  const performSearch = debounce(async (query: string) => {
    if (!query || query.length < 2) {
      searchResults.value = [];
      return;
    }

    searching.value = true;
    try {
      searchResults.value = await trackStore.searchTracks(platformId, query);
    } catch (err) {
      console.error('Track search failed:', err);
      searchResults.value = [];
    } finally {
      searching.value = false;
    }
  }, 300);

  async function search(query: string): Promise<void> {
    searchQuery.value = query;
    await performSearch(query);
  }

  function clearSearch(): void {
    searchQuery.value = '';
    searchResults.value = [];
  }

  return {
    searchQuery,
    searchResults,
    searching,
    search,
    clearSearch,
  };
}
```

---

## Components

### 1. RoundsPanel Component

**Location:** `resources/app/js/components/round/RoundsPanel.vue`

**Purpose:** Display rounds list in accordion format on Season Detail page

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoundStore } from '@app/stores/roundStore';
import { useRaceStore } from '@app/stores/raceStore';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import BasePanel from '@app/components/common/panels/BasePanel.vue';
import RoundFormDrawer from './modals/RoundFormDrawer.vue';
import RaceFormDrawer from './modals/RaceFormDrawer.vue';
import Button from 'primevue/button';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Skeleton from 'primevue/skeleton';
import Message from 'primevue/message';
import type { Round } from '@app/types/round';

interface Props {
  seasonId: number;
  platformId: number;
}

const props = defineProps<Props>();

const roundStore = useRoundStore();
const raceStore = useRaceStore();
const toast = useToast();
const confirm = useConfirm();

const showRoundDrawer = ref(false);
const showRaceDrawer = ref(false);
const editingRound = ref<Round | null>(null);
const selectedRoundId = ref<number | null>(null);

const isLoading = computed(() => roundStore.loading);
const rounds = computed(() => roundStore.getRoundsBySeasonId(props.seasonId));

onMounted(async () => {
  await loadRounds();
});

async function loadRounds(): Promise<void> {
  try {
    await roundStore.fetchRounds(props.seasonId);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load rounds',
      life: 3000,
    });
  }
}

function openCreateRoundDrawer(): void {
  editingRound.value = null;
  showRoundDrawer.value = true;
}

function openEditRoundDrawer(round: Round): void {
  editingRound.value = round;
  showRoundDrawer.value = true;
}

function closeRoundDrawer(): void {
  showRoundDrawer.value = false;
  editingRound.value = null;
}

async function handleRoundSaved(): Promise<void> {
  closeRoundDrawer();
  await loadRounds();
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: editingRound.value ? 'Round updated successfully' : 'Round created successfully',
    life: 3000,
  });
}

function openCreateRaceDrawer(roundId: number): void {
  selectedRoundId.value = roundId;
  showRaceDrawer.value = true;
}

function closeRaceDrawer(): void {
  showRaceDrawer.value = false;
  selectedRoundId.value = null;
}

async function handleRaceSaved(): Promise<void> {
  closeRaceDrawer();
  if (selectedRoundId.value) {
    await raceStore.fetchRaces(selectedRoundId.value);
  }
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Race created successfully',
    life: 3000,
  });
}

function confirmDeleteRound(round: Round): void {
  confirm.require({
    message: `Delete round ${round.round_number}${round.name ? ` - ${round.name}` : ''}?`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deleteRound(round.id);
    },
  });
}

async function deleteRound(roundId: number): Promise<void> {
  try {
    await roundStore.deleteExistingRound(roundId);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Round deleted successfully',
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete round',
      life: 3000,
    });
  }
}

function getRaces(roundId: number) {
  return raceStore.getRacesByRoundId(roundId);
}
</script>

<template>
  <BasePanel>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-lg font-semibold">Rounds</h3>
        <Button
          label="Create Round"
          icon="pi pi-plus"
          @click="openCreateRoundDrawer"
          size="small"
        />
      </div>
    </template>

    <div v-if="isLoading" class="space-y-3">
      <Skeleton height="4rem" />
      <Skeleton height="4rem" />
      <Skeleton height="4rem" />
    </div>

    <Message v-else-if="rounds.length === 0" severity="info">
      No rounds created yet. Click "Create Round" to get started.
    </Message>

    <Accordion v-else :value="[]" class="space-y-2">
      <AccordionPanel v-for="round in rounds" :key="round.id" :value="round.id">
        <AccordionHeader>
          <div class="flex items-center justify-between w-full pr-4">
            <div>
              <span class="font-semibold">Round {{ round.round_number }}</span>
              <span v-if="round.name" class="ml-2">- {{ round.name }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">{{ round.status_label }}</span>
              <Button
                icon="pi pi-pencil"
                size="small"
                text
                @click.stop="openEditRoundDrawer(round)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                @click.stop="confirmDeleteRound(round)"
              />
            </div>
          </div>
        </AccordionHeader>

        <AccordionContent>
          <div class="space-y-3">
            <!-- Round details -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="font-medium">Date:</span>
                {{ formatDate(round.scheduled_at) }}
              </div>
              <div>
                <span class="font-medium">Track:</span>
                Track {{ round.platform_track_id }}
              </div>
            </div>

            <!-- Races section -->
            <div class="border-t pt-3">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium">Races</h4>
                <Button
                  label="Add Race"
                  icon="pi pi-plus"
                  size="small"
                  @click="openCreateRaceDrawer(round.id)"
                />
              </div>

              <div v-if="getRaces(round.id).length === 0" class="text-sm text-gray-500">
                No races added yet
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="race in getRaces(round.id)"
                  :key="race.id"
                  class="p-3 bg-gray-50 rounded"
                >
                  <div class="font-medium">
                    Race {{ race.race_number }}
                    <span v-if="race.name">- {{ race.name }}</span>
                  </div>
                  <div class="text-sm text-gray-600">
                    {{ race.length_value }}
                    {{ race.length_type === 'laps' ? 'laps' : 'minutes' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </BasePanel>

  <!-- Drawers -->
  <RoundFormDrawer
    v-model:visible="showRoundDrawer"
    :season-id="seasonId"
    :platform-id="platformId"
    :editing-round="editingRound"
    @saved="handleRoundSaved"
    @cancel="closeRoundDrawer"
  />

  <RaceFormDrawer
    v-if="selectedRoundId"
    v-model:visible="showRaceDrawer"
    :round-id="selectedRoundId"
    :platform-id="platformId"
    @saved="handleRaceSaved"
    @cancel="closeRaceDrawer"
  />
</template>
```

---

### 2. RoundFormDrawer Component

**Location:** `resources/app/js/components/round/modals/RoundFormDrawer.vue`

**Purpose:** Create/edit round form in bottom drawer

```vue
<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue';
import { useRoundStore } from '@app/stores/roundStore';
import { useTrackStore } from '@app/stores/trackStore';
import { useRoundValidation } from '@app/composables/useRoundValidation';
import { format } from 'date-fns';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Textarea from 'primevue/textarea';
import AutoComplete from 'primevue/autocomplete';
import FormLabel from '@app/components/common/forms/FormLabel.vue';
import FormError from '@app/components/common/forms/FormError.vue';
import type { Round, RoundForm, CreateRoundRequest, UpdateRoundRequest } from '@app/types/round';
import type { Track } from '@app/types/track';

interface Props {
  visible: boolean;
  seasonId: number;
  platformId: number;
  editingRound?: Round | null;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const roundStore = useRoundStore();
const trackStore = useTrackStore();

const form = reactive<RoundForm>({
  round_number: 1,
  name: '',
  scheduled_at: null,
  platform_track_id: null,
  track_layout: '',
  track_conditions: '',
  technical_notes: '',
  stream_url: '',
  internal_notes: '',
});

const { errors, validateAll, clearErrors } = useRoundValidation(form);

const saving = ref(false);
const trackSearchQuery = ref('');
const trackSearchResults = ref<Track[]>([]);
const selectedTrack = ref<Track | null>(null);

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

watch(() => props.visible, async (visible) => {
  if (visible) {
    clearErrors();
    if (props.editingRound) {
      loadRoundIntoForm(props.editingRound);
    } else {
      await loadNextRoundNumber();
      resetForm();
    }
  }
});

async function loadNextRoundNumber(): Promise<void> {
  try {
    form.round_number = await roundStore.fetchNextRoundNumber(props.seasonId);
  } catch (error) {
    console.error('Failed to load next round number', error);
  }
}

function loadRoundIntoForm(round: Round): void {
  form.round_number = round.round_number;
  form.name = round.name || '';
  form.scheduled_at = new Date(round.scheduled_at);
  form.platform_track_id = round.platform_track_id;
  form.track_layout = round.track_layout || '';
  form.track_conditions = round.track_conditions || '';
  form.technical_notes = round.technical_notes || '';
  form.stream_url = round.stream_url || '';
  form.internal_notes = round.internal_notes || '';
}

function resetForm(): void {
  form.name = '';
  form.scheduled_at = null;
  form.platform_track_id = null;
  form.track_layout = '';
  form.track_conditions = '';
  form.technical_notes = '';
  form.stream_url = '';
  form.internal_notes = '';
  selectedTrack.value = null;
}

async function searchTracks(event: { query: string }): Promise<void> {
  try {
    trackSearchResults.value = await trackStore.searchTracks(props.platformId, event.query);
  } catch (error) {
    console.error('Track search failed:', error);
    trackSearchResults.value = [];
  }
}

function onTrackSelect(track: Track): void {
  form.platform_track_id = track.id;
  selectedTrack.value = track;
}

async function handleSave(): Promise<void> {
  if (!validateAll()) {
    return;
  }

  saving.value = true;
  try {
    const payload: CreateRoundRequest | UpdateRoundRequest = {
      round_number: form.round_number,
      name: form.name || undefined,
      scheduled_at: form.scheduled_at ? format(form.scheduled_at, 'yyyy-MM-dd HH:mm:ss') : '',
      platform_track_id: form.platform_track_id!,
      track_layout: form.track_layout || undefined,
      track_conditions: form.track_conditions || undefined,
      technical_notes: form.technical_notes || undefined,
      stream_url: form.stream_url || undefined,
      internal_notes: form.internal_notes || undefined,
    };

    if (props.editingRound) {
      await roundStore.updateExistingRound(props.editingRound.id, payload);
    } else {
      await roundStore.createNewRound(props.seasonId, payload as CreateRoundRequest);
    }

    emit('saved');
    localVisible.value = false;
  } catch (error) {
    console.error('Failed to save round:', error);
  } finally {
    saving.value = false;
  }
}

function handleCancel(): void {
  emit('cancel');
  localVisible.value = false;
}
</script>

<template>
  <Drawer v-model:visible="localVisible" position="bottom" class="h-[90vh]">
    <template #header>
      <h2 class="text-xl font-semibold">
        {{ editingRound ? 'Edit Round' : 'Create Round' }}
      </h2>
    </template>

    <div class="space-y-6">
      <!-- Round Number -->
      <div>
        <FormLabel for="round_number" required>Round Number</FormLabel>
        <InputNumber
          id="round_number"
          v-model="form.round_number"
          :min="1"
          :max="99"
          :invalid="!!errors.round_number"
          class="w-full"
        />
        <FormError :error="errors.round_number" />
      </div>

      <!-- Round Name -->
      <div>
        <FormLabel for="name">Round Name (optional)</FormLabel>
        <InputText
          id="name"
          v-model="form.name"
          :invalid="!!errors.name"
          placeholder="e.g., Season Opener, Grand Finale"
          class="w-full"
        />
        <FormError :error="errors.name" />
      </div>

      <!-- Scheduled Date/Time -->
      <div>
        <FormLabel for="scheduled_at" required>Date & Time</FormLabel>
        <DatePicker
          id="scheduled_at"
          v-model="form.scheduled_at"
          show-time
          hour-format="12"
          :invalid="!!errors.scheduled_at"
          class="w-full"
        />
        <FormError :error="errors.scheduled_at" />
      </div>

      <!-- Track Selection -->
      <div>
        <FormLabel for="track" required>Track</FormLabel>
        <AutoComplete
          id="track"
          v-model="selectedTrack"
          :suggestions="trackSearchResults"
          option-label="name"
          placeholder="Search tracks..."
          @complete="searchTracks"
          @item-select="onTrackSelect"
          :invalid="!!errors.platform_track_id"
          class="w-full"
        >
          <template #option="{ option }">
            <div>
              <div class="font-medium">{{ option.name }}</div>
              <div class="text-sm text-gray-500">
                {{ option.location?.country }} • {{ option.length_meters }}m
              </div>
            </div>
          </template>
        </AutoComplete>
        <FormError :error="errors.platform_track_id" />
      </div>

      <!-- Track Layout -->
      <div>
        <FormLabel for="track_layout">Track Layout (optional)</FormLabel>
        <InputText
          id="track_layout"
          v-model="form.track_layout"
          placeholder="e.g., GP Layout, Indy Layout"
          class="w-full"
        />
      </div>

      <!-- Track Conditions -->
      <div>
        <FormLabel for="track_conditions">Track Conditions (optional)</FormLabel>
        <InputText
          id="track_conditions"
          v-model="form.track_conditions"
          placeholder="e.g., Wet track, 15°C ambient"
          class="w-full"
        />
      </div>

      <!-- Technical Notes -->
      <div>
        <FormLabel for="technical_notes">Technical Notes (optional)</FormLabel>
        <Textarea
          id="technical_notes"
          v-model="form.technical_notes"
          rows="3"
          placeholder="BOP settings, tire restrictions, fuel limits, etc..."
          class="w-full"
        />
        <FormError :error="errors.technical_notes" />
      </div>

      <!-- Stream URL -->
      <div>
        <FormLabel for="stream_url">Stream/Broadcast Link (optional)</FormLabel>
        <InputText
          id="stream_url"
          v-model="form.stream_url"
          :invalid="!!errors.stream_url"
          placeholder="https://twitch.tv/..."
          class="w-full"
        />
        <FormError :error="errors.stream_url" />
      </div>

      <!-- Internal Notes -->
      <div>
        <FormLabel for="internal_notes">Internal Notes (optional)</FormLabel>
        <Textarea
          id="internal_notes"
          v-model="form.internal_notes"
          rows="3"
          placeholder="Internal notes for stewards/organizers..."
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          @click="handleCancel"
          :disabled="saving"
        />
        <Button
          :label="editingRound ? 'Update Round' : 'Create Round'"
          @click="handleSave"
          :loading="saving"
        />
      </div>
    </template>
  </Drawer>
</template>
```

---

### 3. RaceFormDrawer Component

**Location:** `resources/app/js/components/round/modals/RaceFormDrawer.vue`

**Purpose:** Create/edit race configuration in bottom drawer

Similar structure to RoundFormDrawer but with race-specific fields:
- Race details (number, name, type)
- Qualifying configuration
- Grid source selection
- Race length
- Platform settings (dropdowns populated from race settings store)
- Points system (template select + custom table)
- Bonus points checkboxes

This will be the most complex form component. Use PrimeVue Accordion to group sections.

---

## Routing

### Integration with SeasonDetail View

**Location:** `resources/app/js/views/SeasonDetail.vue`

Add new tab for Rounds:

```vue
<TabView>
  <TabPanel header="Overview">...</TabPanel>
  <TabPanel header="Drivers">...</TabPanel>
  <TabPanel header="Teams">...</TabPanel>
  <TabPanel header="Divisions">...</TabPanel>
  <TabPanel header="Rounds">
    <RoundsPanel :season-id="seasonId" :platform-id="season.platform_id" />
  </TabPanel>
</TabView>
```

No new routes required - rounds management happens within SeasonDetail view.

---

## Testing Strategy

### 1. Store Tests

**Location:** `resources/app/js/stores/__tests__/roundStore.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRoundStore } from '../roundStore';
import * as roundService from '@app/services/roundService';

vi.mock('@app/services/roundService');

describe('roundStore', () => {
  let store: ReturnType<typeof useRoundStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useRoundStore();
    vi.clearAllMocks();
  });

  describe('fetchRounds', () => {
    it('fetches rounds successfully', async () => {
      const mockRounds = [
        { id: 1, season_id: 1, round_number: 1, name: 'Round 1' },
        { id: 2, season_id: 1, round_number: 2, name: 'Round 2' },
      ];

      vi.mocked(roundService.getRounds).mockResolvedValue(mockRounds as any);

      await store.fetchRounds(1);

      expect(store.rounds).toEqual(mockRounds);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('handles fetch error', async () => {
      vi.mocked(roundService.getRounds).mockRejectedValue(new Error('Network error'));

      await expect(store.fetchRounds(1)).rejects.toThrow();
      expect(store.error).toBe('Network error');
    });
  });

  describe('createNewRound', () => {
    it('creates round and adds to store', async () => {
      const mockRound = { id: 3, season_id: 1, round_number: 3, name: 'Round 3' };
      vi.mocked(roundService.createRound).mockResolvedValue(mockRound as any);

      const result = await store.createNewRound(1, {} as any);

      expect(result).toEqual(mockRound);
      expect(store.rounds).toContainEqual(mockRound);
    });
  });

  // ... more tests
});
```

---

### 2. Component Tests

**Location:** `resources/app/js/components/round/__tests__/RoundsPanel.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import RoundsPanel from '../RoundsPanel.vue';

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}));

vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: vi.fn() }),
}));

describe('RoundsPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders correctly', () => {
    const wrapper = mount(RoundsPanel, {
      props: { seasonId: 1, platformId: 1 },
      global: {
        stubs: {
          BasePanel: { template: '<div><slot name="header" /><slot /></div>' },
          Button: true,
          Accordion: true,
        },
      },
    });

    expect(wrapper.find('h3').text()).toBe('Rounds');
  });

  // ... more tests
});
```

---

## Implementation Checklist

### Phase 3: Frontend Foundation (Round)

- [ ] **Type Definitions**
  - [ ] `round.ts` with all interfaces
  - [ ] `track.ts` with all interfaces

- [ ] **API Services**
  - [ ] `roundService.ts` with all methods
  - [ ] `trackService.ts` with search methods

- [ ] **Pinia Stores**
  - [ ] `roundStore.ts` with state/getters/actions
  - [ ] `trackStore.ts` with search functionality
  - [ ] Store tests for roundStore
  - [ ] Store tests for trackStore

- [ ] **Composables**
  - [ ] `useRoundValidation.ts` with all validators
  - [ ] `useTrackSearch.ts` with debounced search

- [ ] **Components**
  - [ ] `RoundsPanel.vue` with accordion UI
  - [ ] `RoundFormDrawer.vue` with full form
  - [ ] Component tests for RoundsPanel
  - [ ] Component tests for RoundFormDrawer

- [ ] **View Integration**
  - [ ] Add Rounds tab to `SeasonDetail.vue`
  - [ ] Pass season_id and platform_id props
  - [ ] Test navigation and data flow

- [ ] **Verification**
  - [ ] Run `npm run type-check` (passes)
  - [ ] Run `npm run test:user` (all pass)
  - [ ] Run `npm run lint:user` (passes)
  - [ ] Manual testing in browser

---

### Phase 4: Frontend Race Configuration

- [ ] **Type Definitions**
  - [ ] `race.ts` with all interfaces
  - [ ] Platform settings types

- [ ] **API Services**
  - [ ] `raceService.ts` with all methods
  - [ ] `raceSettingsService.ts` for platform configs

- [ ] **Pinia Stores**
  - [ ] `raceStore.ts` with state/getters/actions
  - [ ] `raceSettingsStore.ts` with caching
  - [ ] Store tests

- [ ] **Composables**
  - [ ] `useRaceValidation.ts` with complex validation

- [ ] **Components**
  - [ ] `RaceFormDrawer.vue` with sections:
    - [ ] Basic details section
    - [ ] Qualifying section
    - [ ] Grid source section
    - [ ] Race length section
    - [ ] Platform settings section (dynamic dropdowns)
    - [ ] Points system section (template + custom table)
    - [ ] Bonus points section
  - [ ] `RaceListItem.vue` for display in accordion
  - [ ] Component tests

- [ ] **Integration**
  - [ ] Integrate RaceFormDrawer into RoundsPanel
  - [ ] Load platform settings on mount
  - [ ] Handle race creation flow
  - [ ] Test full create round → add race flow

- [ ] **Verification**
  - [ ] Type checking passes
  - [ ] All tests pass
  - [ ] Linting passes
  - [ ] Manual E2E testing

---

### Final Frontend Verification

- [ ] Full user flow tested (create round → add races → edit → delete)
- [ ] All loading states work correctly
- [ ] All error states display properly
- [ ] Form validation prevents invalid submissions
- [ ] Toast notifications appear correctly
- [ ] Responsive design works (mobile/tablet/desktop)
- [ ] Keyboard navigation works
- [ ] Accessibility audit passes
- [ ] No console errors
- [ ] Performance is acceptable (no lag)

---

## Notes

1. **Date Formatting**: Use `date-fns` for consistent formatting
2. **Track Search**: Debounce at 300ms to avoid excessive API calls
3. **Platform Settings**: Cache in store, fetch once per platform
4. **Points System**: F1 template as default, allow custom table editing
5. **Grid Source**: Filter dropdown based on available previous races
6. **Division Flag**: Show info message explaining separate results when enabled
7. **Form State**: Track unsaved changes, warn before closing drawer
8. **Optimistic Updates**: Consider updating UI before API confirmation for better UX

---

**End of Frontend Implementation Plan**
