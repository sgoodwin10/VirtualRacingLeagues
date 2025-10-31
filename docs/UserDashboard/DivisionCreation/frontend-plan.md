# Divisions Feature - Frontend Implementation Plan

## Overview
This plan follows the Vue 3 + TypeScript patterns established in this project. All implementation should follow the patterns documented in `.claude/guides/frontend/admin-dashboard-development-guide.md`.

**Agent to use:** `dev-fe-user`

**Key Dependencies:**
- Vue 3 with Composition API (`<script setup lang="ts">`)
- TypeScript (strict mode)
- PrimeVue 4 (Dropdown/Select for inline editor, Textarea for description)
- Pinia for state management
- VueUse composables
- Vitest for testing

**Architecture Notes:**
- Divisions are nearly identical to Teams, with an additional `description` field
- Divisions are conditionally displayed based on `season.race_divisions_enabled` setting
- Inline division assignment in drivers table (similar to team assignment)
- 75/25 panel layout in Season Detail view (Drivers Table / Divisions Panel)

---

## Step 1: TypeScript Types

**File:** `resources/app/js/types/division.ts`

[See complete types implementation in agent output, including Division, CreateDivisionRequest, UpdateDivisionRequest, DivisionForm, DivisionFormErrors, DivisionOption, DivisionDriverCountResponse]

**Update:** `resources/app/js/types/seasonDriver.ts`

Add to SeasonDriver interface:
```typescript
export interface SeasonDriver {
  // ... existing fields
  division_id: number | null;
  division_name: string | null;
  division_logo_url: string | null;
}
```

---

## Step 2: API Service

**File:** `resources/app/js/services/divisionService.ts`

[See complete service implementation in agent output]

---

## Step 3: Pinia Store

**File:** `resources/app/js/stores/divisionStore.ts`

[See complete store implementation in agent output, including all state, getters, and actions]

---

## Step 4: Components

### 4.1 DivisionFormModal Component

**File:** `resources/app/js/components/season/divisions/DivisionFormModal.vue`

[See complete component implementation in agent output - includes name field, **description textarea**, and logo upload with validation]

**Key Features:**
- Name input (2-60 chars)
- **Description textarea (10-500 chars, REQUIRED)**
- Logo upload with preview
- Character counters for both name and description
- Real-time validation
- Edit mode population

### 4.2 DivisionsPanel Component

**File:** `resources/app/js/components/season/divisions/DivisionsPanel.vue`

[See complete component implementation in agent output]

**Key Features:**
- Shows "not enabled" message when `divisionsEnabled` is false
- DataTable with division name, logo, and description preview
- Add/Edit/Delete actions
- Delete confirmation with driver count
- Integrates with DivisionFormModal

### 4.3 Update SeasonDriversTable Component

**File:** `resources/app/js/components/season/SeasonDriversTable.vue` (updates)

[See complete updates in agent output]

**Key Updates:**
- Add `divisionsEnabled` prop
- Add division column with inline Select dropdown
- Show "No Division" option
- Display division logos in dropdown
- Auto-save on selection change

---

## Step 5: Update SeasonDetail View

**File:** `resources/app/js/views/SeasonDetail.vue` (updates)

**Option 1: 75/25 Layout (Recommended)**

[See complete layout implementation in agent output]

**Features:**
- 75% width for Drivers Table
- 25% width for Divisions Panel
- Load divisions when `race_divisions_enabled` is true
- Pass `divisionsEnabled` prop to SeasonDriversTable

---

## Step 6: Update SeasonHeader Component

**File:** `resources/app/js/components/season/SeasonHeader.vue` (updates)

[See stats update in agent output]

**Addition:**
- Show "Divisions: X" stat when `race_divisions_enabled` is true

---

## Step 7: Testing

### 7.1 DivisionFormModal Tests
[See test implementation in agent output]

**Key Tests:**
- Renders in create mode
- Name validation (min/max length)
- **Description validation (required, min 10, max 500 chars)**
- Populates form in edit mode
- Shows character counters

### 7.2 DivisionsPanel Tests
[See test implementation in agent output]

### 7.3 Division Store Tests
[See test implementation in agent output]

**Key Tests:**
- Fetches divisions successfully
- Creates division options with "No Division" first
- Handles errors gracefully
- Creates division successfully

---

## Step 8: Implementation Checklist

### Types
- [ ] Create `resources/app/js/types/division.ts`
- [ ] Update `resources/app/js/types/seasonDriver.ts` (add division fields)
- [ ] Update `resources/app/js/types/season.ts` (add `total_divisions` to SeasonStats)

### Services
- [ ] Create `resources/app/js/services/divisionService.ts`

### Store
- [ ] Create `resources/app/js/stores/divisionStore.ts`

### Components
- [ ] Create `resources/app/js/components/season/divisions/` directory
- [ ] Create `DivisionFormModal.vue`
- [ ] Create `DivisionsPanel.vue`
- [ ] Update `SeasonDriversTable.vue` (inline division editor)
- [ ] Update `SeasonHeader.vue` (add divisions stat)

### Views
- [ ] Update `SeasonDetail.vue` (75/25 layout, load divisions)

### Tests
- [ ] Create `resources/app/js/components/season/divisions/__tests__/` directory
- [ ] Create `DivisionFormModal.test.ts`
- [ ] Create `DivisionsPanel.test.ts`
- [ ] Create `resources/app/js/stores/__tests__/divisionStore.test.ts`
- [ ] Run all tests: `npm run test:user`

### Quality Checks
- [ ] Run type checking: `npm run type-check`
- [ ] Run linting: `npm run lint:user`
- [ ] Run formatting: `npm run format:user`
- [ ] Test in browser with hot reload

---

## Step 9: Manual Testing Checklist

### Division CRUD
- [ ] Create division without logo (with valid description)
- [ ] Create division with logo
- [ ] Edit division name only
- [ ] Edit division description only
- [ ] Edit division and add logo
- [ ] Edit division and replace logo
- [ ] Edit division and remove logo
- [ ] Delete division with no drivers
- [ ] Delete division with drivers (verify "No Division" assignment)

### Driver Assignment
- [ ] Assign driver to division via inline dropdown
- [ ] Change driver from one division to another
- [ ] Set driver to "No Division"
- [ ] Verify dropdown shows division logos
- [ ] Verify "No Division" appears first in dropdown

### Conditional Display
- [ ] Verify division column hidden when `race_divisions_enabled` is false
- [ ] Verify divisions panel shows "not enabled" message when disabled
- [ ] Verify division column visible when enabled
- [ ] Verify divisions panel shows table when enabled
- [ ] Verify divisions chip appears in SeasonHeader when enabled
- [ ] Verify divisions stat appears in SeasonHeader when enabled

### Form Validation
- [ ] Test name validation: min 2 chars
- [ ] Test name validation: max 60 chars
- [ ] Test description validation: required
- [ ] Test description validation: min 10 chars
- [ ] Test description validation: max 500 chars
- [ ] Test logo file size validation (max 2MB)
- [ ] Test logo file type validation (JPG/PNG/SVG)

### Edge Cases
- [ ] Test with season with no divisions
- [ ] Test with season with many divisions (pagination)
- [ ] Test division name at min length (2 chars)
- [ ] Test division name at max length (60 chars)
- [ ] Test description at min length (10 chars)
- [ ] Test description at max length (500 chars)
- [ ] Test network error handling
- [ ] Test concurrent division edits

### Integration
- [ ] Test with both teams AND divisions enabled
- [ ] Verify drivers table shows both Team and Division columns
- [ ] Test assigning both team and division to same driver
- [ ] Verify SeasonHeader shows both stats when both enabled

---

## Notes

1. **Description Field**: Required field with 10-500 character validation (shown in table as truncated preview)
2. **PrimeVue 4 Components**: Use `Select` for inline editor, `Textarea` for description field
3. **Image Preview**: FileUpload + FileReader for logo preview before upload
4. **No Division Option**: Always first in dropdown with `value: null`
5. **Grid Layout**: Use `grid-cols-1 lg:grid-cols-4` for responsive 75/25 split (matching Teams pattern)
6. **Toast Notifications**: Show success/error messages for all operations
7. **Confirm Dialog**: Show driver count in delete confirmation
8. **Loading States**: Show loading indicators during API calls
9. **Error Handling**: Display user-friendly error messages
10. **Conditional Rendering**: Divisions are completely hidden when `race_divisions_enabled` is false
11. **Dual Feature Support**: When both teams and divisions are enabled, both columns appear in drivers table

## UI/UX Decisions

### Layout Choice: 75/25 Panel (Recommended)
Following the Teams pattern, use the 75/25 split with:
- Drivers Table (75%) on the left
- Divisions Panel (25%) on the right
- Benefits: Quick access, visual consistency, easier management

### Column Display
- When `team_championship_enabled` = true: Show Team column
- When `race_divisions_enabled` = true: Show Division column
- When both enabled: Show both columns (Team, then Division)
- Order: Name, Discord ID, Platform Fields, Team, Division, Actions

### Table Row Display in DivisionsPanel
Display division name + logo in first column, with description as a truncated preview below the name (using `line-clamp-1` utility). Full description visible in edit modal.

## References

- Teams Frontend Plan: `docs/UserDashboard/TeamsCreation/frontend-plan.md`
- Season Form Drawer: `resources/app/js/components/season/modals/SeasonFormDrawer.vue`
- Base Modal: `resources/app/js/components/common/modals/BaseModal.vue`
- Season Drivers Table: `resources/app/js/components/season/SeasonDriversTable.vue`
- Season Header: `resources/app/js/components/season/SeasonHeader.vue`
- Admin Frontend Guide: `.claude/guides/frontend/admin-dashboard-development-guide.md`
- PrimeVue Select (v4): Use Context7 for latest docs
- PrimeVue Textarea (v4): Use Context7 for latest docs
