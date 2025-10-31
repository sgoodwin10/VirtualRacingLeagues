# Season Creation Frontend Implementation Plan (MVP)

**Version:** 2.0
**Last Updated:** October 23, 2025
**Status:** Approved - Ready for Implementation

---

## Stakeholder Confirmations

**All requirements and UX decisions have been confirmed by stakeholders. Key confirmations:**

### UI/UX Decisions (Confirmed)
- **Season Creation/Edit:** Uses a DRAWER (slide-out panel), consistent with league/competition creation
- **Same Drawer for Both:** Season creation and editing use the SAME drawer component
- **Driver Assignment:** Separate drawer for driver management (NOT inline)
- **Create Button Placement:** "Create Season" button appears in multiple locations (header, empty state, tabs)

### Image Handling (Confirmed)
- **Logo:** Inherits from competition by default, with option to upload custom (500x500px max, 2MB, PNG/JPG)
- **Banner:** Optional (1920x400px max, 5MB, PNG/JPG)
- **Display:** Show inherited logo with clear upload option to customize

### Validation & Business Rules (Confirmed)
- **Name Uniqueness:** Two seasons CAN have the same name in the same competition
- **Profanity Filtering:** NOT required - any name is allowed
- **Name Validation:** Length only (3-100 characters), no content restrictions

### Access Control (Confirmed)
- **Permissions:** Only league owners and users with league admin permissions can access season features
- **No View-Only Mode:** No separate view-only permission for MVP
- **All Routes Protected:** All season routes and components require league admin permission

### Season Lifecycle (Confirmed)
- **Archived Seasons:** Cannot be edited until restored (edit button disabled)
- **Soft Delete:** Deleted seasons are soft deleted (not permanently removed)
- **Driver Status:** Reserve drivers can be promoted to active at any time

---

## Table of Contents

1. [Overview](#overview)
2. [Key Architecture Changes](#key-architecture-changes)
3. [Component Structure](#component-structure)
4. [Views](#views)
5. [Services](#services)
6. [Stores (Pinia)](#stores-pinia)
7. [Types (TypeScript)](#types-typescript)
8. [Composables](#composables)
9. [Router Routes](#router-routes)
10. [UI/UX Flow](#uiux-flow)
11. [PrimeVue Components](#primevue-components)
12. [Form Validation](#form-validation)
13. [Integration Points](#integration-points)
14. [Testing Strategy](#testing-strategy)
15. [Implementation Order](#implementation-order)

---

## Overview

This document outlines the frontend implementation plan for the **Season Creation MVP** feature in the user dashboard. The MVP focuses on creating seasons, managing season information, and assigning drivers from the league's existing driver pool to seasons.

### Critical Change from Original Documentation

**IMPORTANT**: The documentation initially planned for drivers to be added directly to seasons. However, **drivers are already implemented at the league level**. Therefore, the season-driver management feature must allow:

- Viewing all drivers that belong to the league
- Selecting drivers from the league's driver pool
- Adding/removing drivers to/from a season
- Managing season-specific driver metadata (status: active/reserve/withdrawn, notes)

This is a **season-driver assignment** feature, NOT a driver creation feature.

### MVP Scope

**IN SCOPE:**
- Season creation form (single-page, not wizard)
- Season detail view with tabs (Overview, Drivers, Settings)
- Season-driver assignment UI (select from league drivers)
- Season-driver management (add/remove, update status, notes)
- Image uploads (logo, banner)
- Edit season functionality
- Basic validation

**OUT OF SCOPE FOR MVP:**
- Divisions UI (future feature)
- Teams UI (future feature)
- Rounds UI (future feature)
- CSV import UI (future feature)
- Bulk operations (future feature)
- Drag and drop (future feature)

---

## Key Architecture Changes

### 1. Driver Management Pattern

**Existing Pattern (League Level):**
```
League
  └─ Drivers (global, managed via DriverManagementDrawer)
      └─ Driver (can be in multiple leagues)
```

**New Pattern (Season Level):**
```
Season
  └─ Season-Drivers (pivot relationship)
      └─ References existing League Driver
      └─ Season-specific metadata (status, notes)
```

### 2. Data Flow

```
LeagueDetail View
  └─ Competition created
      └─ CompetitionDetail View
          └─ Season created (NEW)
              └─ SeasonDetail View (NEW)
                  └─ Assign drivers from league (NEW)
```

### 3. Store Responsibilities

- **driverStore**: Manages league-level drivers (existing)
- **seasonStore**: Manages season CRUD operations (NEW)
- **seasonDriverStore**: Manages season-driver assignments (NEW)

---

## Component Structure

### 1. Season Creation Components

#### `SeasonFormDrawer.vue`
**Location:** `resources/app/js/components/season/SeasonFormDrawer.vue`

**Purpose:** Create and edit seasons (uses the same drawer for both operations)

**Props:**
```typescript
interface Props {
  visible: boolean;
  competitionId: number;
  season?: Season | null; // For edit mode
  isEditMode?: boolean;
}
```

**Emits:**
```typescript
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'season-saved', season: Season): void;
}
```

**Key Features:**
- Single-page form (not wizard)
- Fields: name, car_class, description, technical_specs, team_championship_enabled
- Image uploads:
  - Logo: Inherits from competition by default with option to upload custom (500x500px max, 2MB, PNG/JPG)
  - Banner: Optional (1920x400px max, 5MB, PNG/JPG)
- Slug preview with availability check
- Validation feedback (no profanity filtering)
- Platform display (locked from competition, inherited and read-only)
- Responsive layout (2/3 left column, 1/3 right column)
- Accessible only to league owners and users with league admin permissions

**Dependencies:**
- PrimeVue: `Drawer`, `InputText`, `Textarea`, `InputSwitch`, `Button`, `Message`, `Tabs`
- Common: `DrawerHeader`, `DrawerLoading`, `FormLabel`, `FormError`, `FormInputGroup`, `ImageUpload`
- Services: `seasonService.ts`
- Stores: `seasonStore`

---

#### `SeasonHeader.vue`
**Location:** `resources/app/js/components/season/SeasonHeader.vue`

**Purpose:** Display season header with logo, banner, and action buttons

**Props:**
```typescript
interface Props {
  season: Season;
}
```

**Emits:**
```typescript
interface Emits {
  (e: 'edit'): void;
  (e: 'back-to-competition'): void;
}
```

**Key Features:**
- Banner image with fallback gradient
- Logo with fallback to competition logo (inherits if season has no custom logo)
- Season name and metadata
- Status badges (setup/active/completed/archived)
- Edit button (visible only to league owners and admin users), Back button
- Breadcrumbs
- Archived seasons: Edit button disabled (must restore before editing)

**Pattern:** Similar to `CompetitionHeader.vue`

---

#### `SeasonSettings.vue`
**Location:** `resources/app/js/components/season/SeasonSettings.vue`

**Purpose:** Manage season settings and dangerous operations

**Props:**
```typescript
interface Props {
  season: Season;
}
```

**Emits:**
```typescript
interface Emits {
  (e: 'updated'): void;
  (e: 'archived'): void;
  (e: 'deleted'): void;
}
```

**Key Features:**
- Team championship toggle
- Archive season (with confirmation, prevents editing until restored)
- Delete season (with confirmation, soft delete)
- Status change
- Accessible only to league owners and users with league admin permissions

**Pattern:** Similar to `CompetitionSettings.vue`

---

### 2. Season-Driver Management Components

#### `SeasonDriverManagementDrawer.vue`
**Location:** `resources/app/js/components/season/SeasonDriverManagementDrawer.vue`

**Purpose:** Manage drivers assigned to a season (separate drawer, not inline UI)

**Props:**
```typescript
interface Props {
  visible: boolean;
  seasonId: number;
  seasonName: string;
  leagueId: number; // To fetch league drivers
}
```

**Emits:**
```typescript
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}
```

**Key Features:**
- Two-panel layout:
  - **Left panel:** Available league drivers (not yet in season)
  - **Right panel:** Drivers already in season
- Search and filter available drivers
- Add driver button (per driver) in left panel
- Remove driver button (per driver) in right panel
- Edit driver status/notes in right panel
- Accessible only to league owners and users with league admin permissions
- Reserve drivers can be promoted to active status at any time

**Dependencies:**
- PrimeVue: `Drawer`, `Button`, `InputText`, `IconField`
- Components: `AvailableDriversTable.vue`, `SeasonDriversTable.vue`, `SeasonDriverFormDialog.vue`
- Stores: `driverStore` (league drivers), `seasonDriverStore` (season drivers)

**Pattern:** Inspired by `DriverManagementDrawer.vue` but with dual-panel layout

---

#### `AvailableDriversTable.vue`
**Location:** `resources/app/js/components/season/AvailableDriversTable.vue`

**Purpose:** Display league drivers that are NOT in the season

**Props:**
```typescript
interface Props {
  drivers: LeagueDriver[]; // From league
  loading?: boolean;
  seasonId: number;
}
```

**Emits:**
```typescript
interface Emits {
  (e: 'add-driver', driver: LeagueDriver): void;
}
```

**Key Features:**
- PrimeVue DataTable
- Columns: Name, Platform IDs, Actions (Add button)
- Search/filter
- Pagination
- Empty state: "All league drivers are already in this season"

---

#### `SeasonDriversTable.vue`
**Location:** `resources/app/js/components/season/SeasonDriversTable.vue`

**Purpose:** Display drivers assigned to the season with season-specific data

**Props:**
```typescript
interface Props {
  seasonDrivers: SeasonDriver[];
  loading?: boolean;
}
```

**Emits:**
```typescript
interface Emits {
  (e: 'edit-driver', seasonDriver: SeasonDriver): void;
  (e: 'remove-driver', seasonDriver: SeasonDriver): void;
}
```

**Key Features:**
- PrimeVue DataTable
- Columns: Name, Platform IDs, Status (badge), Notes (truncated), Actions (Edit, Remove)
- Status badges: active (green), reserve (blue), withdrawn (orange)
- Pagination
- Empty state: "No drivers assigned yet. Add drivers from your league."

---

#### `SeasonDriverFormDialog.vue`
**Location:** `resources/app/js/components/season/modals/SeasonDriverFormDialog.vue`

**Purpose:** Add driver to season or edit season-specific driver metadata

**Props:**
```typescript
interface Props {
  visible: boolean;
  mode: 'add' | 'edit';
  driver?: LeagueDriver; // When adding
  seasonDriver?: SeasonDriver; // When editing
  seasonId: number;
}
```

**Emits:**
```typescript
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data: SeasonDriverRequest): void;
  (e: 'cancel'): void;
}
```

**Form Fields:**
- Driver display (read-only): Name, Platform IDs
- Status: Dropdown (active/reserve/withdrawn)
- Notes: Textarea (internal notes, season-specific)

**Key Features:**
- Simple dialog (not drawer)
- Validation
- Read-only driver information display
- Focus on season-specific metadata only

**Pattern:** Similar to `DriverFormDialog.vue` but simplified

---

#### `ReadOnlySeasonDriverTable.vue`
**Location:** `resources/app/js/components/season/ReadOnlySeasonDriverTable.vue`

**Purpose:** Display season drivers in read-only mode (for Season Overview tab)

**Props:**
```typescript
interface Props {
  seasonDrivers: SeasonDriver[];
  loading?: boolean;
  seasonId: number;
}
```

**Key Features:**
- No edit/remove actions
- View button only (opens read-only modal)
- Used in Season Detail Overview tab
- Compact display

**Pattern:** Similar to `ReadOnlyDriverTable.vue`

---

### 3. Common Components (Reused)

- `DrawerHeader.vue` - Drawer headers
- `DrawerLoading.vue` - Loading states
- `FormLabel.vue` - Form field labels
- `FormError.vue` - Validation errors
- `FormInputGroup.vue` - Form field containers
- `FormOptionalText.vue` - Optional field hints
- `ImageUpload.vue` - Image upload with preview
- `BasePanel.vue` - Consistent panel styling
- `Breadcrumbs.vue` - Navigation breadcrumbs

---

## Views

### 1. `SeasonDetail.vue`
**Location:** `resources/app/js/views/SeasonDetail.vue`

**Route:** `/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId`

**Purpose:** Main season detail view with tabs

**Access Control:** Requires league owner or league admin permission

**Structure:**
```
SeasonDetail
  ├─ Breadcrumbs
  ├─ SeasonHeader
  │   ├─ Banner image
  │   ├─ Logo
  │   ├─ Season name
  │   └─ Action buttons (Edit, Back)
  ├─ Tabs
  │   ├─ Overview Tab
  │   │   ├─ Season Information Panel
  │   │   │   ├─ Competition name
  │   │   │   ├─ Platform (locked)
  │   │   │   ├─ Car class
  │   │   │   ├─ Team championship status
  │   │   │   ├─ Created/Updated dates
  │   │   │   └─ Current status
  │   │   ├─ Description Panel
  │   │   │   └─ Rich text display
  │   │   ├─ Technical Specs Panel
  │   │   │   └─ Rich text display
  │   │   └─ Drivers Panel
  │   │       ├─ Quick stats (total, active, reserve, withdrawn)
  │   │       ├─ ReadOnlySeasonDriverTable
  │   │       └─ "Manage Drivers" button
  │   ├─ Drivers Tab
  │   │   ├─ Quick stats cards
  │   │   │   ├─ Total Drivers
  │   │   │   ├─ Active
  │   │   │   ├─ Reserve
  │   │   │   └─ Withdrawn
  │   │   ├─ SeasonDriversTable (full management)
  │   │   └─ "Add Drivers" button
  │   └─ Settings Tab
  │       └─ SeasonSettings component
  ├─ SeasonFormDrawer (edit mode)
  └─ SeasonDriverManagementDrawer
```

**Empty State (No Drivers):**
```
┌─────────────────────────────────────────────┐
│         🏁 Let's Get Started                │
│                                             │
│  No drivers assigned to this season yet.   │
│  Add drivers from your league to begin.    │
│                                             │
│  [Add Drivers from League]                 │
└─────────────────────────────────────────────┘
```

**Data Loading:**
- Load season data on mount
- Load season-driver assignments on mount
- Load league drivers for driver management drawer (lazy load)

**State Management:**
```typescript
const season = ref<Season | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('overview');
const showEditDrawer = ref(false);
const showDriverDrawer = ref(false);
```

---

## Services

### 1. `seasonService.ts`
**Location:** `resources/app/js/services/seasonService.ts`

**API Endpoints:**

```typescript
/**
 * Get all seasons for a competition
 */
export async function getSeasons(
  competitionId: number,
  params?: SeasonQueryParams
): Promise<PaginatedSeasonsResponse>

/**
 * Get a single season by ID
 */
export async function getSeasonById(
  seasonId: number
): Promise<Season>

/**
 * Create a new season
 */
export async function createSeason(
  competitionId: number,
  data: CreateSeasonRequest
): Promise<Season>

/**
 * Update season
 */
export async function updateSeason(
  seasonId: number,
  data: UpdateSeasonRequest
): Promise<Season>

/**
 * Archive season
 */
export async function archiveSeason(
  seasonId: number
): Promise<Season>

/**
 * Delete season
 */
export async function deleteSeason(
  seasonId: number
): Promise<void>

/**
 * Check slug availability
 */
export async function checkSeasonSlugAvailability(
  competitionId: number,
  name: string,
  excludeSeasonId?: number
): Promise<SlugCheckResponse>
```

**HTTP Methods:**
- GET `/api/competitions/{competitionId}/seasons` - List seasons
- GET `/api/seasons/{seasonId}` - Get season
- POST `/api/competitions/{competitionId}/seasons` - Create season
- PUT `/api/seasons/{seasonId}` - Update season
- POST `/api/seasons/{seasonId}/archive` - Archive season
- DELETE `/api/seasons/{seasonId}` - Delete season
- POST `/api/competitions/{competitionId}/seasons/check-slug` - Check slug

**Error Handling:**
- Use `apiClient.ts` wrapper
- Throw errors with descriptive messages
- Handle 404, 422 validation errors, 403 authorization

---

### 2. `seasonDriverService.ts`
**Location:** `resources/app/js/services/seasonDriverService.ts`

**API Endpoints:**

```typescript
/**
 * Get all season-driver assignments for a season
 */
export async function getSeasonDrivers(
  seasonId: number,
  params?: SeasonDriverQueryParams
): Promise<PaginatedSeasonDriversResponse>

/**
 * Get available league drivers (not in season)
 */
export async function getAvailableDrivers(
  seasonId: number,
  leagueId: number,
  params?: DriverQueryParams
): Promise<PaginatedDriversResponse>

/**
 * Add driver to season
 */
export async function addDriverToSeason(
  seasonId: number,
  data: AddDriverToSeasonRequest
): Promise<SeasonDriver>

/**
 * Update season-driver metadata
 */
export async function updateSeasonDriver(
  seasonId: number,
  driverId: number,
  data: UpdateSeasonDriverRequest
): Promise<SeasonDriver>

/**
 * Remove driver from season
 */
export async function removeDriverFromSeason(
  seasonId: number,
  driverId: number
): Promise<void>

/**
 * Get season-driver statistics
 */
export async function getSeasonDriverStats(
  seasonId: number
): Promise<SeasonDriverStats>
```

**HTTP Methods:**
- GET `/api/seasons/{seasonId}/drivers` - List season drivers
- GET `/api/seasons/{seasonId}/available-drivers?league_id={leagueId}` - Available drivers
- POST `/api/seasons/{seasonId}/drivers` - Add driver to season
- PUT `/api/seasons/{seasonId}/drivers/{driverId}` - Update season-driver
- DELETE `/api/seasons/{seasonId}/drivers/{driverId}` - Remove driver from season
- GET `/api/seasons/{seasonId}/drivers/stats` - Driver statistics

---

## Stores (Pinia)

### 1. `seasonStore.ts`
**Location:** `resources/app/js/stores/seasonStore.ts`

**State:**
```typescript
{
  seasons: Ref<Season[]>,
  currentSeason: Ref<Season | null>,
  loading: Ref<boolean>,
  error: Ref<string | null>,

  // Pagination
  currentPage: Ref<number>,
  perPage: Ref<number>,
  totalSeasons: Ref<number>,
  lastPage: Ref<number>,

  // Filters
  searchQuery: Ref<string>,
  statusFilter: Ref<SeasonStatus | 'all'>,
}
```

**Getters:**
```typescript
{
  activeSeasons: ComputedRef<Season[]>,
  archivedSeasons: ComputedRef<Season[]>,
  seasonStats: ComputedRef<SeasonStoreStats>,
  hasNextPage: ComputedRef<boolean>,
  hasPreviousPage: ComputedRef<boolean>,
}
```

**Actions:**
```typescript
{
  // Fetch operations
  fetchSeasons(competitionId: number, params?: SeasonQueryParams): Promise<void>,
  fetchSeason(seasonId: number): Promise<Season>,

  // CRUD operations
  createNewSeason(competitionId: number, data: CreateSeasonRequest): Promise<Season>,
  updateExistingSeason(seasonId: number, data: UpdateSeasonRequest): Promise<Season>,
  archiveExistingSeason(seasonId: number): Promise<Season>,
  deleteExistingSeason(seasonId: number): Promise<void>,

  // Filters and pagination
  setSearchQuery(query: string): void,
  setStatusFilter(status: SeasonStatus | 'all'): void,
  nextPage(): void,
  previousPage(): void,
  goToPage(page: number): void,

  // Utility
  resetFilters(): void,
  clearError(): void,
  resetStore(): void,
}
```

**Pattern:** Similar to `competitionStore.ts`

---

### 2. `seasonDriverStore.ts`
**Location:** `resources/app/js/stores/seasonDriverStore.ts`

**State:**
```typescript
{
  // Season drivers (assigned to season)
  seasonDrivers: Ref<SeasonDriver[]>,

  // Available drivers (league drivers not in season)
  availableDrivers: Ref<LeagueDriver[]>,

  // Loading states
  loading: Ref<boolean>,
  loadingAvailable: Ref<boolean>,
  error: Ref<string | null>,

  // Statistics
  stats: Ref<SeasonDriverStats | null>,

  // Pagination for season drivers
  currentPage: Ref<number>,
  perPage: Ref<number>,
  totalDrivers: Ref<number>,
  lastPage: Ref<number>,

  // Pagination for available drivers
  availablePage: Ref<number>,
  availablePerPage: Ref<number>,
  totalAvailable: Ref<number>,
  availableLastPage: Ref<number>,

  // Filters
  searchQuery: Ref<string>,
  statusFilter: Ref<SeasonDriverStatus | 'all'>,
  availableSearchQuery: Ref<string>,
}
```

**Getters:**
```typescript
{
  activeDrivers: ComputedRef<SeasonDriver[]>,
  reserveDrivers: ComputedRef<SeasonDriver[]>,
  withdrawnDrivers: ComputedRef<SeasonDriver[]>,
  driverCount: ComputedRef<number>,
  hasDrivers: ComputedRef<boolean>,
}
```

**Actions:**
```typescript
{
  // Fetch season drivers
  fetchSeasonDrivers(seasonId: number, params?: SeasonDriverQueryParams): Promise<void>,

  // Fetch available drivers
  fetchAvailableDrivers(seasonId: number, leagueId: number, params?: DriverQueryParams): Promise<void>,

  // Fetch statistics
  fetchStats(seasonId: number): Promise<void>,

  // Add driver to season
  addDriverToSeason(seasonId: number, data: AddDriverToSeasonRequest): Promise<SeasonDriver>,

  // Update season-driver
  updateSeasonDriver(seasonId: number, driverId: number, data: UpdateSeasonDriverRequest): Promise<SeasonDriver>,

  // Remove driver from season
  removeDriverFromSeason(seasonId: number, driverId: number): Promise<void>,

  // Filters
  setSearchQuery(query: string): void,
  setStatusFilter(status: SeasonDriverStatus | 'all'): void,
  setAvailableSearchQuery(query: string): void,

  // Pagination
  nextPage(): void,
  previousPage(): void,
  goToPage(page: number): void,
  nextAvailablePage(): void,
  previousAvailablePage(): void,
  goToAvailablePage(page: number): void,

  // Utility
  resetFilters(): void,
  clearError(): void,
  resetStore(): void,
}
```

---

## Types (TypeScript)

### 1. `season.ts`
**Location:** `resources/app/js/types/season.ts`

```typescript
/**
 * Season status
 */
export type SeasonStatus = 'setup' | 'active' | 'completed' | 'archived';

/**
 * Competition reference (subset)
 */
export interface SeasonCompetition {
  id: number;
  name: string;
  slug: string;
  platform_id: number;
  platform?: {
    id: number;
    name: string;
    slug: string;
  };
}

/**
 * Main Season entity
 */
export interface Season {
  id: number;
  competition_id: number;
  competition?: SeasonCompetition;

  // Basic info
  name: string;
  slug: string;
  car_class: string | null;
  description: string | null;
  technical_specs: string | null;

  // Branding
  logo_url: string; // Never null (resolves to competition logo if not set)
  has_own_logo: boolean;
  banner_url: string | null;
  has_own_banner: boolean;

  // Settings
  team_championship_enabled: boolean;

  // Status
  status: SeasonStatus;
  is_active: boolean;
  is_archived: boolean;
  is_deleted: boolean;

  // Dates
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Owner
  created_by_user_id: number;

  // Statistics (computed on backend)
  stats: SeasonStats;
}

/**
 * Season statistics
 */
export interface SeasonStats {
  total_drivers: number;
  active_drivers: number;
  reserve_drivers: number;
  withdrawn_drivers: number;
  total_divisions: number;
  total_teams: number;
  total_rounds: number;
  completed_rounds: number;
  next_round_date: string | null;
}

/**
 * Create season request
 */
export interface CreateSeasonRequest {
  name: string;
  car_class?: string;
  description?: string;
  technical_specs?: string;
  logo?: File;
  banner?: File;
  team_championship_enabled?: boolean;
}

/**
 * Update season request
 */
export interface UpdateSeasonRequest {
  name?: string;
  car_class?: string | null;
  description?: string | null;
  technical_specs?: string | null;
  logo?: File | null;
  banner?: File | null;
  team_championship_enabled?: boolean;
}

/**
 * Season form state (internal)
 */
export interface SeasonForm {
  name: string;
  car_class: string;
  description: string;
  technical_specs: string;
  logo: File | null;
  logo_url: string | null;
  banner: File | null;
  banner_url: string | null;
  team_championship_enabled: boolean;
}

/**
 * Season form validation errors
 */
export interface SeasonFormErrors {
  name?: string;
  car_class?: string;
  description?: string;
  technical_specs?: string;
  logo?: string;
  banner?: string;
}

/**
 * Slug check response
 */
export interface SlugCheckResponse {
  available: boolean;
  slug: string;
  suggestion: string | null;
}

/**
 * Query parameters for fetching seasons
 */
export interface SeasonQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: SeasonStatus | 'all';
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Paginated seasons response
 */
export interface PaginatedSeasonsResponse {
  data: Season[];
  meta: PaginationMeta;
}
```

---

### 2. `seasonDriver.ts`
**Location:** `resources/app/js/types/seasonDriver.ts`

```typescript
import type { Driver } from './driver';

/**
 * Season-driver status
 */
export type SeasonDriverStatus = 'active' | 'reserve' | 'withdrawn';

/**
 * Season-driver pivot entity
 */
export interface SeasonDriver {
  id: number; // Pivot table ID
  season_id: number;
  driver_id: number;

  // Season-specific metadata
  status: SeasonDriverStatus;
  notes: string | null; // Internal notes

  // Assignments (nullable, can be assigned later)
  division_id: number | null;
  team_id: number | null;

  // Dates
  added_at: string;
  updated_at: string;

  // Nested driver object
  driver: Driver;
}

/**
 * Add driver to season request
 */
export interface AddDriverToSeasonRequest {
  driver_id: number;
  status?: SeasonDriverStatus; // Default: 'active'
  notes?: string;
  division_id?: number;
  team_id?: number;
}

/**
 * Update season-driver request
 */
export interface UpdateSeasonDriverRequest {
  status?: SeasonDriverStatus;
  notes?: string | null;
  division_id?: number | null;
  team_id?: number | null;
}

/**
 * Season-driver form (for add/edit dialog)
 */
export interface SeasonDriverForm {
  status: SeasonDriverStatus;
  notes: string;
}

/**
 * Season-driver form errors
 */
export interface SeasonDriverFormErrors {
  status?: string;
  notes?: string;
}

/**
 * Season-driver statistics
 */
export interface SeasonDriverStats {
  total: number;
  active: number;
  reserve: number;
  withdrawn: number;
  unassigned_to_division: number;
  unassigned_to_team: number;
}

/**
 * Query parameters for fetching season drivers
 */
export interface SeasonDriverQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: SeasonDriverStatus | 'all';
  division_id?: number;
  team_id?: number;
}

/**
 * Paginated season drivers response
 */
export interface PaginatedSeasonDriversResponse {
  data: SeasonDriver[];
  meta: PaginationMeta;
}
```

---

## Composables

### 1. `useSeasonValidation.ts`
**Location:** `resources/app/js/composables/useSeasonValidation.ts`

**Purpose:** Validate season form fields

```typescript
export function useSeasonValidation(form: SeasonForm) {
  const errors = reactive<SeasonFormErrors>({});

  const validateName = (): boolean => {
    if (!form.name || form.name.trim().length < 3) {
      errors.name = 'Season name must be at least 3 characters';
      return false;
    }
    if (form.name.length > 100) {
      errors.name = 'Season name must not exceed 100 characters';
      return false;
    }
    // No profanity filtering - any name is allowed
    errors.name = undefined;
    return true;
  };

  const validateCarClass = (): boolean => {
    if (form.car_class && form.car_class.length > 150) {
      errors.car_class = 'Car class must not exceed 150 characters';
      return false;
    }
    errors.car_class = undefined;
    return true;
  };

  const validateDescription = (): boolean => {
    if (form.description && form.description.length > 2000) {
      errors.description = 'Description must not exceed 2000 characters';
      return false;
    }
    errors.description = undefined;
    return true;
  };

  const validateTechnicalSpecs = (): boolean => {
    if (form.technical_specs && form.technical_specs.length > 2000) {
      errors.technical_specs = 'Technical specs must not exceed 2000 characters';
      return false;
    }
    errors.technical_specs = undefined;
    return true;
  };

  const validateLogo = (): boolean => {
    if (form.logo) {
      if (form.logo.size > 2 * 1024 * 1024) {
        errors.logo = 'Logo must be less than 2MB';
        return false;
      }
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(form.logo.type)) {
        errors.logo = 'Logo must be PNG or JPEG';
        return false;
      }
    }
    errors.logo = undefined;
    return true;
  };

  const validateBanner = (): boolean => {
    if (form.banner) {
      if (form.banner.size > 5 * 1024 * 1024) {
        errors.banner = 'Banner must be less than 5MB';
        return false;
      }
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(form.banner.type)) {
        errors.banner = 'Banner must be PNG or JPEG';
        return false;
      }
    }
    errors.banner = undefined;
    return true;
  };

  const validateAll = (): boolean => {
    return (
      validateName() &&
      validateCarClass() &&
      validateDescription() &&
      validateTechnicalSpecs() &&
      validateLogo() &&
      validateBanner()
    );
  };

  const clearError = (field: keyof SeasonFormErrors): void => {
    errors[field] = undefined;
  };

  return {
    errors,
    validateName,
    validateCarClass,
    validateDescription,
    validateTechnicalSpecs,
    validateLogo,
    validateBanner,
    validateAll,
    clearError,
  };
}
```

---

### 2. `useSeasonDriverValidation.ts`
**Location:** `resources/app/js/composables/useSeasonDriverValidation.ts`

**Purpose:** Validate season-driver form fields

```typescript
export function useSeasonDriverValidation(form: SeasonDriverForm) {
  const errors = reactive<SeasonDriverFormErrors>({});

  const validateStatus = (): boolean => {
    if (!form.status) {
      errors.status = 'Status is required';
      return false;
    }
    if (!['active', 'reserve', 'withdrawn'].includes(form.status)) {
      errors.status = 'Invalid status';
      return false;
    }
    errors.status = undefined;
    return true;
  };

  const validateNotes = (): boolean => {
    if (form.notes && form.notes.length > 1000) {
      errors.notes = 'Notes must not exceed 1000 characters';
      return false;
    }
    errors.notes = undefined;
    return true;
  };

  const validateAll = (): boolean => {
    return validateStatus() && validateNotes();
  };

  const clearError = (field: keyof SeasonDriverFormErrors): void => {
    errors[field] = undefined;
  };

  return {
    errors,
    validateStatus,
    validateNotes,
    validateAll,
    clearError,
  };
}
```

---

## Router Routes

**Add to:** `resources/app/js/router/index.ts`

```typescript
{
  path: '/leagues/:leagueId/competitions/:competitionId/seasons/:seasonId',
  name: 'season-detail',
  component: () => import('@app/views/SeasonDetail.vue'),
  meta: {
    title: 'Season Details',
    requiresAuth: true,
    requiresLeagueAdmin: true, // Only league owners and admin users
  },
}
```

**Route Parameters:**
- `leagueId` - League ID (for breadcrumbs and driver fetching)
- `competitionId` - Competition ID (for breadcrumbs and context)
- `seasonId` - Season ID (primary identifier)

---

## UI/UX Flow

### 1. Create Season Flow

```
CompetitionDetail View
  └─ Click "Create Season" button
      └─ SeasonFormDrawer opens
          ├─ Fill in form
          │   ├─ Name (required)
          │   ├─ Car class (optional)
          │   ├─ Description (optional)
          │   ├─ Technical specs (optional)
          │   ├─ Logo (optional, inherits from competition)
          │   ├─ Banner (optional)
          │   └─ Team championship toggle (default: off)
          ├─ Slug preview updates as user types
          ├─ Validation feedback in real-time
          └─ Click "Create Season"
              ├─ Success → Toast notification
              ├─ Redirect to SeasonDetail view
              └─ Empty state: "Add drivers to get started"
```

---

### 2. Add Drivers to Season Flow

```
SeasonDetail View (Drivers Tab)
  └─ Click "Add Drivers" button
      └─ SeasonDriverManagementDrawer opens
          ├─ Left Panel: Available League Drivers
          │   ├─ Search/filter
          │   ├─ List of drivers NOT in season
          │   └─ "Add" button per driver
          ├─ Right Panel: Season Drivers
          │   ├─ List of drivers IN season
          │   ├─ Shows status badges
          │   ├─ "Edit" button (opens SeasonDriverFormDialog)
          │   └─ "Remove" button (with confirmation)
          └─ Click "Add" on a driver
              └─ SeasonDriverFormDialog opens
                  ├─ Show driver info (read-only)
                  ├─ Set status (active/reserve/withdrawn)
                  ├─ Add notes (optional)
                  └─ Click "Add to Season"
                      ├─ Success → Toast notification
                      ├─ Driver moves to right panel
                      └─ Left panel refreshes
```

---

### 3. Edit Season-Driver Flow

```
SeasonDetail View (Drivers Tab)
  └─ SeasonDriversTable
      └─ Click "Edit" on a driver
          └─ SeasonDriverFormDialog opens (edit mode)
              ├─ Show driver info (read-only)
              ├─ Edit status
              ├─ Edit notes
              └─ Click "Save Changes"
                  ├─ Success → Toast notification
                  └─ Table refreshes
```

---

### 4. Remove Driver from Season Flow

```
SeasonDetail View (Drivers Tab)
  └─ SeasonDriversTable
      └─ Click "Remove" on a driver
          └─ Confirmation dialog
              ├─ "Are you sure you want to remove [Driver Name] from this season?"
              ├─ Click "Remove"
              │   ├─ Success → Toast notification
              │   └─ Table refreshes
              └─ Click "Cancel" → Dialog closes
```

---

## PrimeVue Components

### Primary Components Used

1. **Drawer** - `SeasonFormDrawer`, `SeasonDriverManagementDrawer`
2. **DataTable** - All driver tables
3. **Dialog** - `SeasonDriverFormDialog`, confirmation dialogs
4. **InputText** - Text inputs
5. **Textarea** - Multi-line inputs
6. **Select** - Dropdowns (status selection)
7. **InputSwitch** - Toggle (team championship)
8. **Button** - All actions
9. **Message** - Info/warning messages
10. **Toast** - Success/error notifications
11. **ConfirmDialog** - Delete/remove confirmations
12. **Tabs/TabList/Tab/TabPanels/TabPanel** - Season detail tabs
13. **Card** - Content containers
14. **Chip** - Status badges
15. **Skeleton** - Loading states
16. **IconField/InputIcon** - Search inputs

### Status Badge Styles

```typescript
// Season status
const seasonStatusSeverity = computed(() => {
  switch (season.value?.status) {
    case 'setup': return 'info';
    case 'active': return 'success';
    case 'completed': return 'warning';
    case 'archived': return 'danger';
    default: return 'info';
  }
});

// Season-driver status
const driverStatusSeverity = (status: SeasonDriverStatus) => {
  switch (status) {
    case 'active': return 'success';
    case 'reserve': return 'info';
    case 'withdrawn': return 'warning';
    default: return 'info';
  }
};
```

---

## Form Validation

### Season Form Validation Rules

| Field | Required | Min Length | Max Length | Type | Notes |
|-------|----------|------------|------------|------|-------|
| name | Yes | 3 | 100 | string | Any characters allowed (no profanity filtering) |
| car_class | No | 0 | 150 | string | Plain text |
| description | No | 0 | 2000 | string | Rich text (future: TipTap) |
| technical_specs | No | 0 | 2000 | string | Rich text (future: TipTap) |
| logo | No | - | 2MB | File | PNG/JPG, 500x500px max, inherits from competition by default |
| banner | No | - | 5MB | File | PNG/JPG, 1920x400px max |
| team_championship_enabled | No | - | - | boolean | Default: false |

**Important Notes:**
- Two seasons CAN have the same name within the same competition (no uniqueness constraint)
- Name validation does NOT include profanity filtering
- Logo inherits from competition if not provided (shown with upload option)

### Season-Driver Form Validation Rules

| Field | Required | Min Length | Max Length | Type | Notes |
|-------|----------|------------|------------|------|-------|
| status | Yes | - | - | enum | active/reserve/withdrawn |
| notes | No | 0 | 1000 | string | Internal notes |

### Validation Timing

- **Real-time:** Validate on blur and on input (debounced)
- **Submit:** Validate all fields before submitting
- **Backend errors:** Display validation errors from backend (422 responses)

---

## Integration Points

### 1. CompetitionDetail View

**Add to:** `resources/app/js/views/CompetitionDetail.vue`

**Changes:**
- Add "Create Season" button in multiple locations:
  - Header area (primary action)
  - Empty state (when no seasons exist)
  - Seasons tab header
- Add `SeasonFormDrawer` component (same drawer for create and edit)
- Add `SeasonList` component (displays seasons for competition)
- Handle `@season-saved` event from drawer
- Show/hide "Create Season" buttons based on league admin permission

**Empty State:**
```vue
<template>
  <TabPanel value="seasons">
    <!-- If no seasons -->
    <Card v-if="!competitionStore.hasSeasons(competitionId)">
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-flag text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-semibold mb-2">Ready to Race?</h3>
          <p class="text-gray-600 mb-4">
            Create your first season to start organizing races.
          </p>
          <Button
            label="Create First Season"
            icon="pi pi-plus"
            @click="handleCreateSeason"
          />
        </div>
      </template>
    </Card>

    <!-- If seasons exist -->
    <SeasonList
      v-else
      :competition-id="competitionId"
      @season-created="handleSeasonCreated"
      @season-updated="handleSeasonUpdated"
      @season-deleted="handleSeasonDeleted"
    />
  </TabPanel>
</template>
```

---

### 2. LeagueDetail View

**No changes required** - Existing driver management at league level remains unchanged.

---

### 3. Navigation/Breadcrumbs

**Breadcrumb chain:**
```
Dashboard > Leagues > [League Name] > [Competition Name] > [Season Name]
```

**Implementation in SeasonDetail.vue:**
```typescript
const breadcrumbItems = computed((): BreadcrumbItem[] => [
  { label: 'Dashboard', to: { name: 'home' }, icon: 'pi-home' },
  { label: 'Leagues', to: { name: 'leagues' } },
  {
    label: season.value?.competition?.league?.name || 'League',
    to: { name: 'league-detail', params: { id: leagueId.value } }
  },
  {
    label: season.value?.competition?.name || 'Competition',
    to: { name: 'competition-detail', params: {
      leagueId: leagueId.value,
      competitionId: competitionId.value
    }}
  },
  { label: season.value?.name || 'Season Details' }
]);
```

---

## Testing Strategy

### 1. Component Tests (Vitest + @vue/test-utils)

**Files to test:**
- `SeasonFormDrawer.test.ts`
- `SeasonHeader.test.ts`
- `SeasonSettings.test.ts`
- `SeasonDriverManagementDrawer.test.ts`
- `AvailableDriversTable.test.ts`
- `SeasonDriversTable.test.ts`
- `SeasonDriverFormDialog.test.ts`

**Test scenarios:**
- Component renders correctly
- Props are passed correctly
- Events are emitted correctly
- Form validation works
- Empty states display
- Loading states display
- Error states display
- User interactions trigger correct actions

**Example test structure:**
```typescript
describe('SeasonFormDrawer', () => {
  it('renders in create mode', () => {});
  it('renders in edit mode with data', () => {});
  it('validates required fields', () => {});
  it('shows slug preview', () => {});
  it('emits season-saved event on submit', () => {});
  it('displays validation errors', () => {});
  it('handles logo upload', () => {});
  it('handles banner upload', () => {});
});
```

---

### 2. Store Tests

**Files to test:**
- `seasonStore.test.ts`
- `seasonDriverStore.test.ts`

**Test scenarios:**
- State initializes correctly
- Actions update state correctly
- Getters return computed values correctly
- API calls are made with correct parameters
- Error handling works
- Pagination works
- Filters work

---

### 3. Service Tests

**Files to test:**
- `seasonService.test.ts`
- `seasonDriverService.test.ts`

**Test scenarios:**
- API endpoints are called correctly
- Request payloads are formatted correctly
- Responses are parsed correctly
- Errors are thrown correctly

---

### 4. Composable Tests

**Files to test:**
- `useSeasonValidation.test.ts`
- `useSeasonDriverValidation.test.ts`

**Test scenarios:**
- Validation rules are enforced
- Error messages are set correctly
- ClearError works
- ValidateAll works

---

### 5. View Tests

**Files to test:**
- `SeasonDetail.test.ts`

**Test scenarios:**
- View loads season data on mount
- Tabs switch correctly
- Empty states display
- Loading states display
- Error states display
- Breadcrumbs render correctly
- Actions trigger correct handlers

---

### 6. E2E Tests (Playwright) - Optional for MVP

**Test scenarios:**
- Create season end-to-end
- Edit season end-to-end
- Add driver to season end-to-end
- Remove driver from season end-to-end
- Edit season-driver end-to-end

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. Create TypeScript types (`season.ts`, `seasonDriver.ts`)
2. Create services (`seasonService.ts`, `seasonDriverService.ts`)
3. Create stores (`seasonStore.ts`, `seasonDriverStore.ts`)
4. Create composables (`useSeasonValidation.ts`, `useSeasonDriverValidation.ts`)
5. Add router route for `SeasonDetail`

**Completion Criteria:**
- All types defined
- All services implemented
- All stores implemented
- All composables implemented
- Route added
- Unit tests for stores and services pass

---

### Phase 2: Season CRUD (Week 2)
1. Create `SeasonFormDrawer.vue`
2. Create `SeasonHeader.vue`
3. Create `SeasonSettings.vue`
4. Create `SeasonDetail.vue` (shell with tabs)
5. Integrate `SeasonFormDrawer` into `CompetitionDetail.vue`
6. Create `SeasonList.vue` component

**Completion Criteria:**
- Can create season from CompetitionDetail
- Can view season in SeasonDetail
- Can edit season
- Can archive/delete season
- All season CRUD operations work
- Component tests pass
- TypeScript checks pass
- Linter passes

---

### Phase 3: Season-Driver Management (Week 3)
1. Create `SeasonDriverFormDialog.vue`
2. Create `AvailableDriversTable.vue`
3. Create `SeasonDriversTable.vue`
4. Create `SeasonDriverManagementDrawer.vue`
5. Create `ReadOnlySeasonDriverTable.vue`
6. Integrate into `SeasonDetail.vue`

**Completion Criteria:**
- Can view available league drivers
- Can add driver to season
- Can remove driver from season
- Can edit season-driver metadata (status, notes)
- Can view season drivers in Overview tab
- All season-driver operations work
- Component tests pass
- TypeScript checks pass
- Linter passes

---

### Phase 4: Polish & Testing (Week 4)
1. Add empty states throughout
2. Add loading skeletons
3. Add error handling
4. Improve UX (animations, transitions)
5. Add toast notifications
6. Add confirmation dialogs
7. Write comprehensive tests
8. Fix bugs
9. Refactor as needed
10. Documentation

**Completion Criteria:**
- All tests pass (100% coverage target)
- TypeScript checks pass
- Linter passes
- Prettier run
- No console errors
- Accessible (keyboard navigation, screen reader support)
- Responsive design works on mobile/tablet/desktop
- Performance is acceptable (no lag, fast load times)

---

## Notes and Considerations

### 1. Image Handling

**Logo:**
- Inherits from competition by default
- Display inherited logo with option to upload custom logo
- Maximum size: 500x500px, 2MB
- Formats: PNG, JPG
- Backend resolves fallback, frontend receives `logo_url` (never null) and `has_own_logo` (boolean)

**Banner:**
- Optional
- Maximum size: 1920x400px, 5MB
- Formats: PNG, JPG
- If not provided → show gradient background
- Frontend handles fallback display

---

### 2. Platform Locking

Season inherits platform from competition. Platform is **locked** (read-only, inherited) in SeasonFormDrawer.

Display platform prominently in the form but clearly indicate it is inherited from the competition and cannot be changed at the season level.

---

### 3. Driver Assignment Strategy

**Key Implementation:**
- Drivers are NOT created at the season level
- Drivers are fetched from the league (using existing `driverStore`)
- Season-driver management is about **assignments**, not creation
- Driver assignment UI is in a **separate drawer** (not inline)

**UI Pattern:**
- Use a separate drawer with two panels (like a transfer list)
- Left: Available drivers (league drivers not in season)
- Right: Assigned drivers (season drivers)
- Buttons to move drivers between panels
- Reserve drivers can be promoted to active status at any time

---

### 4. Empty States

Empty states should be **actionable** and **instructive**:
- Show icon
- Explain what's missing
- Provide clear CTA button
- Give context (e.g., "Add drivers from your league to begin")

---

### 5. Slug Handling

- Generate slug from name
- Check availability in real-time (debounced)
- Show preview
- If taken, suggest alternative (e.g., "winter-2025-02")
- Backend handles uniqueness within competition
- Note: Season names do NOT need to be unique (two seasons can have the same name), but slugs must be unique

---

### 6. Validation Strategy

- **Client-side:** Instant feedback, better UX
- **Server-side:** Final authority, security
- Display backend validation errors (422 responses)
- Use PrimeVue's invalid state styling
- **No profanity filtering** - any season name is allowed
- Name uniqueness is NOT enforced (two seasons can have identical names)

---

### 7. Accessibility

- All forms must be keyboard navigable
- Use semantic HTML
- Add ARIA labels where needed
- Ensure color contrast meets WCAG AA standards
- Test with screen reader

---

### 8. Performance

- Lazy load SeasonDetail view
- Debounce search inputs (300ms)
- Paginate large driver lists
- Use PrimeVue's virtual scrolling for very large lists (future enhancement)
- Optimize image uploads (compress on client before upload)

---

### 9. Error Handling

**Network errors:**
- Show toast notification
- Provide retry button
- Log to console for debugging

**Validation errors:**
- Show inline errors below fields
- Highlight invalid fields (red border)
- Focus first invalid field

**Authorization errors:**
- Redirect to login if 401
- Show "Access denied" message if 403

---

### 10. State Management Best Practices

- Use Pinia composition stores
- Keep stores focused (separation of concerns)
- Use getters for computed state
- Reset store state when component unmounts
- Clear errors after displaying

---

### 11. Access Control and Permissions

**Permission Requirements:**
- All season creation, editing, and management features require league admin permission
- Only league owners and users with league admin permissions can:
  - Create seasons
  - Edit seasons
  - Delete/archive seasons
  - Manage season drivers
  - Access season settings
- Archived seasons cannot be edited (must be restored first)
- Deleted seasons are soft deleted

**Implementation:**
- Add `requiresLeagueAdmin` meta to routes
- Add permission checks in components (hide/disable buttons for non-admin users)
- Backend enforces permissions on all API endpoints

---

## Future Enhancements (Post-MVP)

1. **Divisions UI** - Create and manage divisions, assign drivers to divisions
2. **Teams UI** - Create and manage teams, assign drivers to teams
3. **Rounds UI** - Create race calendar, configure rounds
4. **CSV Import** - Bulk import drivers from CSV
5. **Bulk Operations** - Bulk update driver statuses
6. **Drag & Drop** - Drag drivers between status groups
7. **Rich Text Editor** - TipTap for description and technical specs
8. **Season Templates** - Clone season structure from previous season
9. **Season Registration** - Public registration flow for drivers
10. **Driver Invitations** - Email invitations to join season

---

## Conclusion

This implementation plan has been **approved by stakeholders** and is **ready for implementation**. All UX decisions, business rules, and technical requirements have been confirmed.

The plan prioritizes:

1. **Confirmed UX Patterns** - Uses drawer for create/edit, separate drawer for driver assignment
2. **Reusing existing patterns** - Follows established conventions from Competition and Driver management
3. **Separation of concerns** - Clear boundaries between components, services, stores
4. **Type safety** - Full TypeScript coverage
5. **Testability** - Designed for comprehensive unit and integration testing
6. **User experience** - Intuitive flows, clear CTAs, helpful empty states
7. **Access control** - Proper permission checks for league admin users
8. **Accessibility** - WCAG compliant, keyboard navigable
9. **Performance** - Lazy loading, pagination, debouncing
10. **Maintainability** - Clean code, well-documented, follows Vue 3 best practices

**Implementation can begin immediately** following the phased approach outlined in the Implementation Order section.
