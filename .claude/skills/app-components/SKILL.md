---
name: app-dashboard
description: Specialized frontend development for the app and public dashboards (resources/app and rssources/publi) using Vue 3, TypeScript, PrimeVue, and Pinia. Automatically invokes the dev-fe-app or dev-fe-public agent for comprehensive Vue expertise.
allowed-tools: Bash, Glob, Grep, Read, Edit, MultiEdit, Write, WebFetch, WebSearch, TodoWrite, Task, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# User Dashboard Development Skill

This skill activates specialized user dashboard development mode using the `dev-fe-app` agent.

## Automatic Agent Invocation

When this skill is activated, **immediately invoke the dev-fe-app agent** using the Task tool:

```
Task(subagent_type: "dev-fe-app", prompt: "[user's request]")
```

The dev-fe-app agent is an elite Vue.js architect with expertise in:
- Vue 3 Composition API with `<script setup lang="ts">`
- TypeScript (strict mode)
- PrimeVue 4 components
- Pinia state management
- Vue Router 4
- Vitest testing
- Tailwind CSS 4

# App Common Components Skill

> Expert skill for ensuring consistent component usage across the `resources/app` user dashboard.

## Purpose

This skill audits and updates Vue components in `resources/app` to ensure they use shared common components from `resources/app/js/components/common` instead of duplicating functionality or implementing inconsistent patterns.

## Expertise Areas

- **Tailwind CSS 4** - Utility-first styling with CSS variables
- **Vue 3 Composition API** - `<script setup lang="ts">` patterns
- **PrimeVue 4** - Component wrappers and passthrough API
- **Phosphor Icons** - Icon system with `@phosphor-icons/vue`
- **Common Components Library** - 67 reusable components

---

## Design System Quick Reference

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--cyan` | `#58a6ff` | Primary actions, links, focus states |
| `--green` | `#7ee787` | Success, positive actions |
| `--orange` | `#f0883e` | Warnings, caution states |
| `--red` | `#f85149` | Errors, destructive actions |
| `--purple` | `#bc8cff` | Special/premium states |

### Background Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-dark` | `#0d1117` | Page background |
| `--bg-panel` | `#161b22` | Sidebar, header |
| `--bg-card` | `#1c2128` | Cards, panels |
| `--bg-elevated` | `#21262d` | Hover states |

### Typography

| Class | Font | Usage |
|-------|------|-------|
| `font-mono` | IBM Plex Mono | Headers, labels, technical |
| `font-sans` | Inter | Body text, descriptions |

### Spacing Scale

Use Tailwind's default scale: `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px)

---

## Common Components Reference

### Layout Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `Breadcrumbs` | Navigation breadcrumbs | Custom breadcrumb markup |
| `HTag` | Dynamic h1-h6 headings | Raw `<h1>`, `<h2>`, etc. |
| `PageHeader` | Page title + description | Custom page headers |
| `ErrorBoundary` | Error catching wrapper | Try/catch in templates |
| `ResponsiveImage` | Lazy-loaded images | Raw `<img>` tags |

### Button Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `Button` | Primary button with variants | PrimeVue Button directly |
| `IconButton` | Icon-only button with tooltip | Button with manual tooltip |
| `AddButton` | Green "+" action button | Button with PhPlus icon |
| `DeleteButton` | Red trash action button | Button with PhTrash icon |
| `EditButton` | Ghost pencil action button | Button with PhPencil icon |
| `ViewButton` | Ghost eye action button | Button with PhEye icon |
| `ButtonGroup` | Grouped buttons | Manual flex containers |
| `FooterAddButton` | Dashed add item button | Custom dashed buttons |

**Button Props:**
```typescript
variant: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning'
size: 'sm' | 'default' | 'lg' | 'xl'
```

### Form Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `FormLabel` | Form field label | Raw `<label>` |
| `FormInputGroup` | Form field container | Manual grid/flex layouts |
| `FormHelper` | Helper text below fields | Custom `<small>` tags |
| `FormError` | Error message display | Custom error spans |
| `FormCharacterCount` | Character counter | Manual counting |
| `FormOptionalText` | "Optional" indicator | Custom optional labels |
| `CompactToggle` | Toggle with nested content | Manual toggle layouts |
| `VisibilityToggle` | Public/unlisted selector | Custom radio buttons |
| `PlatformChips` | Platform multi-select | Manual chip buttons |
| `ImageUpload` | File upload with preview | PrimeVue FileUpload directly |
| `StyledInputNumber` | Styled number input | PrimeVue InputNumber directly |
| `BaseToggleSwitch` | Green toggle switch | PrimeVue ToggleSwitch directly |

**FormInputGroup Layouts:**
```vue
<!-- Vertical (default) -->
<FormInputGroup layout="vertical">

<!-- 2-column grid -->
<FormInputGroup layout="horizontal" :columns="2">

<!-- 3-column grid -->
<FormInputGroup layout="horizontal" :columns="3">
```

### Card Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `Card` | Generic card container | Custom card divs |
| `CardHeader` | Card header with icon | Custom header markup |
| `CardBody` | Card body wrapper | Manual padding divs |
| `MetricCard` | Dashboard metric display | Custom metric cards |
| `InfoBox` | Info message box | Custom info divs |
| `NoteBox` | Note/documentation box | Custom note sections |
| `SettingCard` | Checkbox-style setting card | Custom setting toggles |
| `Alert` | Alert/notification banner | Custom alert divs |

**Alert Variants:**
```vue
<Alert variant="success" title="Saved" message="Changes saved successfully" dismissible />
<Alert variant="warning" title="Warning" message="This action cannot be undone" />
<Alert variant="error" title="Error" message="Something went wrong" />
<Alert variant="info" title="Info" message="For your information" />
```

### Indicator Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `BaseBadge` | Badge/tag component | Custom span badges |
| `StatusIndicator` | Status with colored dot | Custom status labels |
| `CountIndicator` | Count badge with overflow | Custom count spans |
| `PositionIndicator` | Race position (1st, 2nd, 3rd) | Custom position labels |
| `TagIndicator` | Small inline tag | Custom micro tags |
| `TeamIndicator` | Team logo + name | Custom team displays |
| `VersionIndicator` | Version tag (v1.0) | Custom version labels |

**StatusIndicator Statuses:**
```typescript
status: 'active' | 'pending' | 'inactive' | 'error' | 'success' | 'warning'
```

### List Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `ListContainer` | List wrapper with gap | Manual ul/div lists |
| `ListRow` | List item with slots | Custom list row divs |
| `ListRowIndicator` | Vertical status bar | Custom status bars |
| `ListRowStat` | Stat value + label | Custom stat displays |
| `ListRowStats` | Stats container | Manual stats layout |
| `ListSectionHeader` | Section divider | Custom section headers |

**ListRow Usage:**
```vue
<ListContainer>
  <ListRow status="active" clickable @click="handleClick">
    <template #content>Main content here</template>
    <template #stats>
      <ListRowStats>
        <ListRowStat :value="10" label="Points" />
      </ListRowStats>
    </template>
    <template #action>
      <EditButton @click="edit" />
    </template>
  </ListRow>
</ListContainer>
```

### Accordion Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `TechnicalAccordion` | Accordion wrapper | PrimeVue Accordion directly |
| `TechnicalAccordionPanel` | Accordion panel | PrimeVue AccordionPanel directly |
| `TechnicalAccordionHeader` | Header with status/icon | Custom accordion headers |
| `TechnicalAccordionContent` | Content wrapper | Manual content styling |
| `AccordionStatusIndicator` | Status bar for headers | Custom status bars |
| `AccordionBadge` | Badge in headers | Custom header badges |
| `AccordionIcon` | Icon container for headers | Custom icon wrappers |

**Accordion Usage:**
```vue
<TechnicalAccordion v-model="activePanel" gap="sm">
  <TechnicalAccordionPanel value="0">
    <TechnicalAccordionHeader
      title="Section Title"
      status="active"
      :icon="PhGear"
      iconVariant="cyan"
    />
    <TechnicalAccordionContent padding="md">
      Content here
    </TechnicalAccordionContent>
  </TechnicalAccordionPanel>
</TechnicalAccordion>
```

### Table Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `TechDataTable` | Data table wrapper | PrimeVue DataTable directly |

**TechDataTable Features:**
- Podium highlighting (gold/silver/bronze for positions 1-3)
- Custom paginator with record info
- Row reordering support
- Empty and loading state slots

### Modal Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `BaseModal` | Modal dialog wrapper | PrimeVue Dialog directly |
| `BaseModalHeader` | Modal header | Custom header divs |
| `DrawerHeader` | Drawer-style header | Custom drawer headers |
| `DrawerLoading` | Loading spinner for drawers | Custom loading states |

**BaseModal Widths:**
```typescript
width: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full'
```

### Panel Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `BasePanel` | Collapsible panel | PrimeVue Panel directly |

### Helper Components

| Component | Purpose | Use Instead Of |
|-----------|---------|----------------|
| `InfoItem` | Icon + text display | Custom icon-text layouts |

---

## Audit Checklist

When reviewing a component in `resources/app`, check for:

### 1. Button Usage
- [ ] Uses `Button` instead of raw PrimeVue Button
- [ ] Uses action buttons (`AddButton`, `DeleteButton`, `EditButton`, `ViewButton`) for common actions
- [ ] Uses `IconButton` for icon-only buttons with tooltips
- [ ] Uses `ButtonGroup` for grouped buttons

### 2. Form Usage
- [ ] Uses `FormLabel` for all form labels
- [ ] Uses `FormInputGroup` for field grouping
- [ ] Uses `FormError` for validation errors
- [ ] Uses `FormHelper` for helper text
- [ ] Uses `StyledInputNumber` instead of PrimeVue InputNumber
- [ ] Uses `BaseToggleSwitch` instead of PrimeVue ToggleSwitch
- [ ] Uses `ImageUpload` instead of PrimeVue FileUpload

### 3. Card/Container Usage
- [ ] Uses `Card` for card containers
- [ ] Uses `MetricCard` for dashboard metrics
- [ ] Uses `Alert` for notifications/messages
- [ ] Uses `InfoBox` or `NoteBox` for informational content

### 4. List Usage
- [ ] Uses `ListContainer` + `ListRow` for list layouts
- [ ] Uses `ListRowStat` for statistics in rows
- [ ] Uses `ListSectionHeader` for section dividers

### 5. Status/Badge Usage
- [ ] Uses `StatusIndicator` for status displays
- [ ] Uses `BaseBadge` for badges/tags
- [ ] Uses `PositionIndicator` for race positions

### 6. Modal/Overlay Usage
- [ ] Uses `BaseModal` instead of PrimeVue Dialog
- [ ] Uses `BasePanel` instead of PrimeVue Panel
- [ ] Uses `TechnicalAccordion` instead of PrimeVue Accordion

### 7. Typography
- [ ] Uses `HTag` for dynamic headings
- [ ] Uses `PageHeader` for page titles
- [ ] Uses CSS classes from app.css (`.page-title`, `.section-header`, etc.)

### 8. Accessibility
- [ ] All interactive elements have `aria-label` or visible text
- [ ] Focus states are visible
- [ ] Color is not the only indicator

---

## Common Anti-Patterns

### DO NOT:

```vue
<!-- Raw PrimeVue components -->
<PrimeButton label="Save" />
<PrimeDialog :visible="show" />
<PrimeDataTable :value="data" />

<!-- Manual button styling -->
<button class="bg-cyan-500 hover:bg-cyan-600 px-4 py-2">Save</button>

<!-- Inline status styling -->
<span class="text-green-500">Active</span>

<!-- Manual form layouts -->
<div class="flex flex-col gap-2">
  <label class="text-sm">Name</label>
  <input />
</div>

<!-- Custom list markup -->
<ul>
  <li v-for="item in items">{{ item.name }}</li>
</ul>
```

### DO:

```vue
<!-- Common components -->
<Button variant="primary" label="Save" />
<BaseModal :visible="show" />
<TechDataTable :value="data" />

<!-- Pre-styled buttons -->
<AddButton @click="add" />
<DeleteButton @click="remove" />

<!-- Status components -->
<StatusIndicator status="active" label="Active" />

<!-- Form components -->
<FormInputGroup>
  <div>
    <FormLabel text="Name" />
    <InputText v-model="name" />
  </div>
</FormInputGroup>

<!-- List components -->
<ListContainer>
  <ListRow v-for="item in items" :key="item.id">
    {{ item.name }}
  </ListRow>
</ListContainer>
```

---

## Import Patterns

Always use the `@app` alias:

```typescript
// Buttons
import Button from '@app/components/common/buttons/Button.vue';
import { AddButton, DeleteButton, EditButton, ViewButton } from '@app/components/common/buttons';

// Forms
import { FormLabel, FormInputGroup, FormError, FormHelper } from '@app/components/common/forms';

// Cards
import Card from '@app/components/common/cards/Card.vue';
import MetricCard from '@app/components/common/cards/MetricCard.vue';
import Alert from '@app/components/common/cards/Alert.vue';

// Lists
import { ListContainer, ListRow, ListRowStat } from '@app/components/common/lists';

// Indicators
import StatusIndicator from '@app/components/common/indicators/StatusIndicator.vue';
import BaseBadge from '@app/components/common/indicators/BaseBadge.vue';

// Modals
import BaseModal from '@app/components/common/modals/BaseModal.vue';

// Tables
import TechDataTable from '@app/components/common/tables/TechDataTable.vue';

// Accordion
import {
  TechnicalAccordion,
  TechnicalAccordionPanel,
  TechnicalAccordionHeader,
  TechnicalAccordionContent
} from '@app/components/common/accordion';

// Icons (Phosphor)
import { PhPlus, PhTrash, PhPencil, PhEye, PhGear } from '@phosphor-icons/vue';
```

---

## File Organization

```
resources/app/js/components/
├── common/                    # Shared components (67 total)
│   ├── accordion/            # Accordion system
│   ├── buttons/              # Button components
│   ├── cards/                # Card components
│   ├── forms/                # Form components
│   ├── helpers/              # Helper components
│   ├── indicators/           # Status/badge components
│   ├── layout/               # Layout components
│   ├── lists/                # List components
│   ├── modals/               # Modal components
│   ├── panels/               # Panel components
│   ├── tables/               # Table components
│   └── toggle/               # Toggle components
├── layout/                    # App layout (IconRail, Sidebar, etc.)
└── [feature]/                 # Feature-specific components
```

---

## Running an Audit

To audit a component file:

1. **Read the component** - Understand what it does
2. **Check imports** - Are common components imported?
3. **Review template** - Identify replaceable patterns
4. **List changes** - Document what should change
5. **Apply updates** - Replace with common components
6. **Test** - Ensure functionality is preserved

### Example Audit Output

```
FILE: resources/app/js/views/Dashboard.vue

ISSUES FOUND:
1. Line 45: Raw <h2> should use <HTag :level="2">
2. Line 67: PrimeVue Button should use common Button
3. Line 89: Manual status span should use StatusIndicator
4. Line 102: Custom card div should use Card component

RECOMMENDATIONS:
- Import HTag, Button, StatusIndicator, Card from common
- Replace identified elements with common components
- Maintain existing functionality and styling
```

---

## Related Documentation
- [PrimeVue Usage Guide](/.claude/guides/design/app-public/primevue-usage.md)
- [User Dashboard CSS](/resources/app/css/app.css)
