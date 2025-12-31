# Badge System Migration Plan

> **Technical Blueprint Design System - Badge Components**

## Overview

This plan outlines the migration of all badge, tag, and indicator components in `resources/app` to the new Technical Blueprint design system. The goal is to create a unified, consistent badge system with generic naming conventions.

---

## Design System Reference

### Color Palette (CSS Variables)

```css
/* Semantic Colors */
--cyan: #58a6ff;        /* Info, primary accent */
--cyan-dim: rgba(88, 166, 255, 0.15);
--green: #7ee787;       /* Success, active, online */
--green-dim: rgba(126, 231, 135, 0.15);
--orange: #f0883e;      /* Warning, pending */
--orange-dim: rgba(240, 136, 62, 0.15);
--red: #f85149;         /* Error, danger, failed */
--red-dim: rgba(248, 81, 73, 0.15);
--purple: #bc8cff;      /* Special, highlight */
--purple-dim: rgba(188, 140, 255, 0.15);
--yellow: #d29922;      /* Gold, first position */

/* Neutral */
--bg-elevated: #21262d;
--text-secondary: #8b949e;
--text-muted: #6e7681;
```

### Typography

- **Font Family**: `IBM Plex Mono` (monospace)
- **Font Size**: `10px` (compact), `11px` (standard), `12px` (large)
- **Font Weight**: `500` (medium), `600` (semibold), `700` (bold for positions)
- **Text Transform**: `uppercase` (for labels), `none` (for content)

### Spacing & Radius

- **Border Radius**: `3px` (compact), `4px` (standard), `6px` (large), `10px` (pill)
- **Padding**:
  - Compact: `2px 6px`
  - Standard: `4px 10px`
  - Large: `6px 12px`

---

## Component Architecture

### Component Hierarchy

```
resources/app/js/components/common/indicators/
├── BaseBadge.vue              # Core badge component
├── StatusIndicator.vue        # Status badge with optional dot
├── CountIndicator.vue         # Numeric count pill badge
├── TagIndicator.vue           # Compact tag for navigation
├── PositionIndicator.vue      # Racing position badge (1st, 2nd, 3rd)
├── TeamIndicator.vue          # Team name with color dot
├── VersionIndicator.vue       # Version number badge
└── index.ts                   # Barrel export
```

---

## Phase 1: Create Base Components

### Task 1.1: Create `BaseBadge.vue`

The foundational badge component that all other badges extend or compose.

**Location**: `resources/app/js/components/common/indicators/BaseBadge.vue`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'cyan' \| 'green' \| 'orange' \| 'red' \| 'purple'` | `'default'` | Color variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `uppercase` | `boolean` | `false` | Transform text to uppercase |
| `icon` | `string` | `undefined` | Optional Phosphor icon name |

**Styling**:
```css
.base-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
}

.base-badge--default {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.base-badge--cyan {
  background: var(--cyan-dim);
  color: var(--cyan);
}
/* ... other variants */
```

---

### Task 1.2: Create `StatusIndicator.vue`

For displaying system states (active, pending, offline, error).

**Location**: `resources/app/js/components/common/indicators/StatusIndicator.vue`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `'active' \| 'pending' \| 'inactive' \| 'error' \| 'success' \| 'warning'` | `'inactive'` | Status type |
| `showDot` | `boolean` | `true` | Show status dot indicator |
| `label` | `string` | `undefined` | Custom label (auto-generated from status if omitted) |
| `size` | `'sm' \| 'md'` | `'md'` | Size variant |

**Status Mapping**:
```typescript
const STATUS_MAP = {
  active: { color: 'green', label: 'Active' },
  success: { color: 'green', label: 'Success' },
  pending: { color: 'orange', label: 'Pending' },
  warning: { color: 'orange', label: 'Warning' },
  inactive: { color: 'default', label: 'Inactive' },
  error: { color: 'red', label: 'Error' },
} as const;
```

---

### Task 1.3: Create `CountIndicator.vue`

For notification counts and numeric indicators.

**Location**: `resources/app/js/components/common/indicators/CountIndicator.vue`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number \| string` | `0` | The count to display |
| `variant` | `'cyan' \| 'orange' \| 'red'` | `'cyan'` | Color variant |
| `max` | `number` | `99` | Max number before showing `99+` |

**Styling**:
```css
.count-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;
}
```

---

### Task 1.4: Create `TagIndicator.vue`

Compact tags for sidebar navigation and inline labels.

**Location**: `resources/app/js/components/common/indicators/TagIndicator.vue`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'cyan' \| 'warning' \| 'success' \| 'danger'` | `'cyan'` | Color variant |
| `size` | `'xs' \| 'sm'` | `'sm'` | Size variant |

**Styling**:
```css
.tag-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  border-radius: 3px;
}
```

---

### Task 1.5: Create `PositionIndicator.vue`

For racing positions with podium styling.

**Location**: `resources/app/js/components/common/indicators/PositionIndicator.vue`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `number` | `1` | The position number |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |

**Position Colors**:
```typescript
const POSITION_COLORS = {
  1: { bg: '#d29922', text: '#0d1117' },  // Gold
  2: { bg: '#c0c0c0', text: '#0d1117' },  // Silver
  3: { bg: '#cd7f32', text: '#0d1117' },  // Bronze
  default: { bg: 'var(--bg-elevated)', text: 'var(--text-secondary)' },
};
```

---

### Task 1.6: Create `TeamIndicator.vue`

Team name with color dot identifier.

**Location**: `resources/app/js/components/common/indicators/TeamIndicator.vue`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | `''` | Team name |
| `color` | `string` | `'#58a6ff'` | Team color (hex) |
| `logo` | `string` | `undefined` | Optional logo URL |
| `showName` | `boolean` | `true` | Whether to show team name |

---

### Task 1.7: Create `VersionIndicator.vue`

For displaying version numbers.

**Location**: `resources/app/js/components/common/indicators/VersionIndicator.vue`

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `version` | `string` | `''` | Version string (e.g., 'v1.0.0') |
| `variant` | `'success' \| 'info' \| 'warning'` | `'success'` | Color variant |

---

### Task 1.8: Create Barrel Export

**Location**: `resources/app/js/components/common/indicators/index.ts`

```typescript
export { default as BaseBadge } from './BaseBadge.vue';
export { default as StatusIndicator } from './StatusIndicator.vue';
export { default as CountIndicator } from './CountIndicator.vue';
export { default as TagIndicator } from './TagIndicator.vue';
export { default as PositionIndicator } from './PositionIndicator.vue';
export { default as TeamIndicator } from './TeamIndicator.vue';
export { default as VersionIndicator } from './VersionIndicator.vue';
```

---

## Phase 2: Migration Tasks

### Files to Update

Based on the audit, the following files require updates:

#### 2.1 Driver Components

| File | Current Implementation | New Component |
|------|----------------------|---------------|
| `components/driver/DriverStatusBadge.vue` | PrimeVue Chip with Tailwind | `StatusIndicator` |
| `components/driver/ViewDriverModal.vue` | Inline Tailwind badges | `BaseBadge`, `StatusIndicator` |

**Migration Notes**:
- Replace `DriverStatusBadge.vue` with `StatusIndicator`
- Update `ViewDriverModal.vue` to use `StatusIndicator` for active status, `BaseBadge` for division/season badges

---

#### 2.2 Season Components

| File | Current Implementation | New Component |
|------|----------------------|---------------|
| `components/season/SeasonCard.vue` | PrimeVue Chip x2 | `StatusIndicator`, `BaseBadge` |

**Migration Notes**:
- Season status → `StatusIndicator` (map: active→active, completed→success, archived→inactive, setup→pending)
- Car class → `BaseBadge` with `variant="purple"`

---

#### 2.3 Competition Components

| File | Current Implementation | New Component |
|------|----------------------|---------------|
| `components/competition/CompetitionHeader.vue` | PrimeVue Chip | `BaseBadge` |
| `components/competition/CompetitionCard.vue` | PrimeVue Tag x3 | `StatusIndicator`, `BaseBadge` |

---

#### 2.4 League Components

| File | Current Implementation | New Component |
|------|----------------------|---------------|
| `components/league/partials/LeagueVisibilityTag.vue` | PrimeVue Tag | `StatusIndicator` |

**Migration Notes**:
- Public → `StatusIndicator` with `status="success"`, `label="Public"`
- Private → `StatusIndicator` with `status="warning"`, `label="Private"`
- Unlisted → `StatusIndicator` with `status="inactive"`, `label="Unlisted"`

---

#### 2.5 Round/Result Components

| File | Current Implementation | New Component |
|------|----------------------|---------------|
| `components/round/modals/CrossDivisionResultsSection.vue` | PrimeVue Tag with division colors | `BaseBadge` with custom color prop |
| `components/round/modals/RaceEventResultsSection.vue` | PrimeVue Tag x4 | `BaseBadge`, `StatusIndicator` |
| `components/result/ResultEntryTable.vue` | PrimeVue Tag | `TagIndicator` |

**Migration Notes**:
- Pole position (P) → `TagIndicator` with `variant="purple"`
- Fastest lap (FL) → `TagIndicator` with custom purple styling
- DNF → `StatusIndicator` with `status="error"`, `label="DNF"`

---

#### 2.6 Accordion Components

| File | Current Implementation | New Component |
|------|----------------------|---------------|
| `components/common/accordions/AccordionBadge.vue` | Custom component | Keep but refactor to use design tokens |
| `components/common/accordions/AccordionStatusIndicator.vue` | Custom component | Refactor to align with design system |

---

#### 2.7 Table Cell Components

| File | Current Implementation | New Component |
|------|----------------------|---------------|
| `components/common/tables/cells/StatusCell.vue` | Custom component | Refactor to compose `StatusIndicator` |
| `components/common/tables/cells/TeamCell.vue` | Custom component | Refactor to compose `TeamIndicator` |

---

#### 2.8 List Components

| File | Current Implementation | New Component |
|------|----------------------|---------------|
| `components/common/lists/ListRowIndicator.vue` | Custom vertical bar | Keep (different purpose - vertical indicator) |

---

#### 2.9 Social Media Components

| File | Current Implementation | New Component |
|------|----------------------|---------------|
| `components/league/partials/LeagueSocialMediaPanel.vue` | Inline icon badges | Consider extracting to `IconBadge` if pattern repeats |

---

## Phase 3: Implementation Order

### Priority 1 - Core Components (Foundation)

1. `BaseBadge.vue` - All other badges depend on this
2. `StatusIndicator.vue` - Most frequently used
3. `CountIndicator.vue` - Used in navigation
4. `TagIndicator.vue` - Used for inline labels

### Priority 2 - Specialized Components

5. `PositionIndicator.vue` - Racing-specific
6. `TeamIndicator.vue` - Racing-specific
7. `VersionIndicator.vue` - Utility

### Priority 3 - Migration (High Impact)

8. Update `StatusCell.vue` to compose `StatusIndicator`
9. Update `DriverStatusBadge.vue` to use `StatusIndicator`
10. Update `LeagueVisibilityTag.vue` to use `StatusIndicator`

### Priority 4 - Migration (Medium Impact)

11. Update `SeasonCard.vue`
12. Update `CompetitionCard.vue`
13. Update `CompetitionHeader.vue`

### Priority 5 - Migration (Lower Impact)

14. Update `ViewDriverModal.vue`
15. Update `RaceEventResultsSection.vue`
16. Update `ResultEntryTable.vue`
17. Update `CrossDivisionResultsSection.vue`

### Priority 6 - Refactor Existing Custom Components

18. Align `AccordionBadge.vue` with design tokens
19. Align `AccordionStatusIndicator.vue` with design tokens
20. Update `TeamCell.vue` to compose `TeamIndicator`

---

## Phase 4: Testing Strategy

### Unit Tests Required

Each new component requires:

1. **Rendering tests** - All variants render correctly
2. **Props tests** - Props affect output as expected
3. **Slot tests** - Default slot renders content
4. **Accessibility tests** - Proper ARIA attributes
5. **Snapshot tests** - Visual regression protection

### Test File Locations

```
resources/app/js/components/common/indicators/__tests__/
├── BaseBadge.test.ts
├── StatusIndicator.test.ts
├── CountIndicator.test.ts
├── TagIndicator.test.ts
├── PositionIndicator.test.ts
├── TeamIndicator.test.ts
└── VersionIndicator.test.ts
```

---

## Phase 5: Documentation

### Storybook Stories (Optional)

If Storybook is added:
- Create stories for each component
- Document all variants and states
- Provide usage examples

### Component Documentation

Each component should have:
- JSDoc comments on props
- Usage examples in component file header
- Link to design system reference

---

## CSS Variables Required

Ensure these variables are defined in the app's CSS:

```css
:root {
  /* Colors */
  --cyan: #58a6ff;
  --cyan-dim: rgba(88, 166, 255, 0.15);
  --green: #7ee787;
  --green-dim: rgba(126, 231, 135, 0.15);
  --orange: #f0883e;
  --orange-dim: rgba(240, 136, 62, 0.15);
  --red: #f85149;
  --red-dim: rgba(248, 81, 73, 0.15);
  --purple: #bc8cff;
  --purple-dim: rgba(188, 140, 255, 0.15);
  --yellow: #d29922;

  /* Backgrounds */
  --bg-elevated: #21262d;

  /* Text */
  --text-secondary: #8b949e;
  --text-muted: #6e7681;

  /* Typography */
  --font-mono: 'IBM Plex Mono', 'SF Mono', monospace;
}
```

---

## Appendix A: Component Mapping Quick Reference

| Old Pattern | New Component | Notes |
|-------------|--------------|-------|
| `<Chip>` with severity | `<StatusIndicator>` | Use status prop |
| `<Tag>` with severity | `<BaseBadge>` | Use variant prop |
| Inline Tailwind badge | `<BaseBadge>` | Use variant prop |
| Driver status badge | `<StatusIndicator>` | With showDot |
| League visibility | `<StatusIndicator>` | Custom labels |
| Position number | `<PositionIndicator>` | 1-3 have special colors |
| Team with color | `<TeamIndicator>` | Pass color prop |
| Notification count | `<CountIndicator>` | With max overflow |
| Navigation tag | `<TagIndicator>` | Compact variant |
| Version number | `<VersionIndicator>` | Success variant |

---

## Appendix B: Deprecation Plan

After migration is complete:

1. Mark old components as deprecated with `@deprecated` JSDoc
2. Add console warnings in development mode
3. Set deprecation timeline (e.g., remove in next major version)
4. Update all imports to use new components
5. Remove deprecated components after timeline

---

## Success Criteria

- [ ] All 7 core indicator components created
- [ ] All components have unit tests with 80%+ coverage
- [ ] All existing badge/tag usages migrated
- [ ] Design system CSS variables in place
- [ ] No PrimeVue Tag/Chip components remain for badges
- [ ] Visual consistency across all badge types
- [ ] TypeScript types exported for all props
