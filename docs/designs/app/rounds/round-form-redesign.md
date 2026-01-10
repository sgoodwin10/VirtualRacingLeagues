# Round Form Modal Redesign

## Overview

Redesign `RoundFormDrawer.vue` to use the split modal layout pattern from `SeasonFormSplitModal.vue`.

## Current State

- Single-pane modal with all fields in one scrollable form
- Uses `BaseModal` with `width="4xl"`
- Sections: Round Details, Round Points (with inline points system)
- Points system embedded directly in the form

## Target State

Split modal layout with:
- Left sidebar navigation (200px)
- Right content area with section-based views
- Reusable `PointsSystemEditor` component

---

## Component Structure

```
resources/app/js/components/round/modals/
├── RoundFormModal.vue                    # Main modal (renamed from RoundFormDrawer)
└── partials/
    ├── RoundEditSidebar.vue              # Navigation sidebar
    └── sections/
        ├── BasicInfoSection.vue          # Round name, track selection, scheduled date
        └── PointsSection.vue             # Round points toggle + points system config

resources/app/js/components/common/forms/
└── PointsSystemEditor.vue                # Reusable points system component
```

---

## Section Breakdown

### 1. Basic Info Section
Fields:
- Round Name (optional text)
- Track Selection (autocomplete)
- Scheduled Date & Time

### 2. Points Section
Fields:
- Round Points toggle (enable/disable)
- Points System Editor (conditional on toggle)
- Fastest Lap Bonus
- Qualifying Pole Bonus
- Copy from Round 1 button

---

## New Components

### 1. PointsSystemEditor.vue (Reusable)

**Location**: `resources/app/js/components/common/forms/PointsSystemEditor.vue`

**Props**:
```ts
interface Props {
  modelValue: PointsSystemMap;       // { 1: 25, 2: 18, ... }
  disabled?: boolean;
  showCopyButton?: boolean;
  copyButtonLabel?: string;
}
```

**Emits**:
```ts
interface Emits {
  (e: 'update:modelValue', value: PointsSystemMap): void;
  (e: 'copy'): void;
}
```

**Features**:
- Grid of position inputs (P1, P2, etc.)
- Add/Remove position buttons
- Optional copy button slot

---

### 2. RoundEditSidebar.vue

**Location**: `resources/app/js/components/round/modals/partials/RoundEditSidebar.vue`

**Sections**:
| ID | Label | Icon | Required |
|----|-------|------|----------|
| basic | Basic Info | PhFileText | No |
| points | Points System | PhChartBar | No |

**Props**:
```ts
interface Props {
  activeSection: 'basic' | 'points';
  hasTrack: boolean;
  hasSchedule: boolean;
  hasPointsEnabled: boolean;
}
```

---

### 3. BasicInfoSection.vue

**Location**: `resources/app/js/components/round/modals/partials/sections/BasicInfoSection.vue`

**Fields**:
- Round Name (InputText)
- Track (AutoComplete with grouped suggestions)
- Scheduled Date & Time (DatePicker)

---

### 4. PointsSection.vue

**Location**: `resources/app/js/components/round/modals/partials/sections/PointsSection.vue`

**Fields**:
- Round Points Toggle (BaseToggleSwitch)
- PointsSystemEditor (conditional)
- Fastest Lap Bonus (Checkbox + InputNumber)
- Qualifying Pole Bonus (Checkbox + InputNumber)

---

## Existing Components to Reuse

| Component | Location |
|-----------|----------|
| BaseModal | `@app/components/common/modals/BaseModal.vue` |
| FormInputGroup | `@app/components/common/forms/FormInputGroup.vue` |
| FormLabel | `@app/components/common/forms/FormLabel.vue` |
| FormError | `@app/components/common/forms/FormError.vue` |
| FormOptionalText | `@app/components/common/forms/FormOptionalText.vue` |
| Button | `@app/components/common/buttons/Button.vue` |
| StyledInputNumber | `@app/components/common/forms/StyledInputNumber.vue` |
| BaseToggleSwitch | `@app/components/common/inputs/BaseToggleSwitch.vue` |

---

## Implementation Tasks

### Frontend (dev-fe-app)

1. **Create PointsSystemEditor.vue** - Reusable component
2. **Create RoundEditSidebar.vue** - Sidebar navigation
3. **Create BasicInfoSection.vue** - Basic info fields
4. **Create PointsSection.vue** - Points configuration
5. **Refactor RoundFormDrawer.vue** - Rename to RoundFormModal.vue, implement split layout
6. **Update imports** - Update parent components using RoundFormDrawer
7. **Write tests** - Unit tests for new components

### Backend (dev-be)

No backend changes required. Existing API endpoints and validation remain unchanged.

---

## Modal Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: Create Round / Edit Round: [number]                     │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                   │
│  Sidebar    │  Content Area                                     │
│  (200px)    │  (flex-1)                                         │
│             │                                                   │
│  ┌────────┐ │  ┌─────────────────────────────────────────────┐  │
│  │Basic   │ │  │ Section Title                               │  │
│  │Info    │ │  │ Section description                         │  │
│  ├────────┤ │  │                                             │  │
│  │Points  │ │  │ [Form fields...]                            │  │
│  │System  │ │  │                                             │  │
│  └────────┘ │  └─────────────────────────────────────────────┘  │
│             │                                                   │
├─────────────┴───────────────────────────────────────────────────┤
│ Footer: [Cancel] [Save Round]                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Changes Summary

| Action | File |
|--------|------|
| Create | `components/common/forms/PointsSystemEditor.vue` |
| Create | `components/round/modals/partials/RoundEditSidebar.vue` |
| Create | `components/round/modals/partials/sections/BasicInfoSection.vue` |
| Create | `components/round/modals/partials/sections/PointsSection.vue` |
| Rename | `RoundFormDrawer.vue` -> `RoundFormModal.vue` |
| Refactor | `RoundFormModal.vue` (split layout implementation) |
| Update | Parent components importing RoundFormDrawer |

---

## Notes

- Keep existing validation logic (`useRoundValidation`)
- Keep existing stores (`roundStore`, `trackStore`)
- Keep existing composables (`useTrackSearch`)
- Modal width: `6xl` (same as SeasonFormSplitModal)
- Hidden fields in current implementation will remain hidden
