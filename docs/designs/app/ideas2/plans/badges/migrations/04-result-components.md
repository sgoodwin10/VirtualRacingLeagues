# Result & Race Components Migration Guide

> **Priority**: Medium
> **Files**: RaceEventResultsSection.vue, ResultEntryTable.vue, CrossDivisionResultsSection.vue

---

## 1. RaceEventResultsSection.vue

**Location**: `resources/app/js/components/round/modals/RaceEventResultsSection.vue`

### Current Implementation

Multiple PrimeVue Tags with custom styling:

```vue
<template>
  <!-- Pole position -->
  <Tag
    class="text-xs bg-purple-200 text-purple-800"
    :pt="{ root: { style: 'padding: 0.15rem 0.4rem' } }"
  >P</Tag>

  <!-- Fastest lap -->
  <Tag
    class="text-xs bg-purple-500 text-white"
    :pt="{ root: { style: 'padding: 0.15rem 0.35rem' } }"
  >FL</Tag>

  <!-- DNF status -->
  <Tag severity="danger" class="text-xs">DNF</Tag>

  <!-- DNF in time column -->
  <Tag severity="danger" class="text-xs">DNF</Tag>
</template>
```

### Target Implementation

```vue
<template>
  <!-- Pole position -->
  <TagIndicator variant="purple" title="Pole Position">P</TagIndicator>

  <!-- Fastest lap -->
  <TagIndicator variant="purple" title="Fastest Lap">FL</TagIndicator>

  <!-- DNF status -->
  <StatusIndicator
    status="error"
    label="DNF"
    :show-dot="false"
    size="sm"
  />

  <!-- DNF in time column -->
  <StatusIndicator
    status="error"
    label="DNF"
    :show-dot="false"
    size="sm"
  />
</template>

<script setup lang="ts">
import { TagIndicator, StatusIndicator } from '@app/components/common/indicators';
</script>
```

---

## 2. ResultEntryTable.vue

**Location**: `resources/app/js/components/result/ResultEntryTable.vue`

### Current Implementation

```vue
<template>
  <!-- Fastest lap indicator -->
  <Tag
    class="text-xs bg-purple-500 text-white mr-1"
    :pt="{ root: { style: 'padding: 0.15rem 0.35rem' } }"
  >FL</Tag>
</template>
```

### Target Implementation

```vue
<template>
  <!-- Fastest lap indicator -->
  <TagIndicator
    variant="purple"
    title="Fastest Lap"
    class="mr-1"
  >FL</TagIndicator>
</template>

<script setup lang="ts">
import { TagIndicator } from '@app/components/common/indicators';
</script>
```

---

## 3. CrossDivisionResultsSection.vue

**Location**: `resources/app/js/components/round/modals/CrossDivisionResultsSection.vue`

### Current Implementation

Uses PrimeVue Tag with division colors from utility:

```vue
<template>
  <Tag
    :value="division.name"
    :class="getDivisionTagClass(index)"
  />
</template>

<script setup>
import { getDivisionTagClass } from '@app/utils/divisionColors';
// Returns classes like: '!bg-blue-200 !text-blue-800'
</script>
```

### Target Implementation

Option A: Use BaseBadge with computed variant:

```vue
<template>
  <BaseBadge
    :variant="getDivisionVariant(index)"
    size="sm"
  >
    {{ division.name }}
  </BaseBadge>
</template>

<script setup lang="ts">
import { BaseBadge } from '@app/components/common/indicators';

// Map division index to badge variants
const DIVISION_VARIANTS = ['cyan', 'green', 'purple', 'orange', 'red', 'default'];

function getDivisionVariant(index: number) {
  return DIVISION_VARIANTS[index % DIVISION_VARIANTS.length];
}
</script>
```

Option B: Use BaseBadge with custom color prop (requires component enhancement):

```vue
<template>
  <BaseBadge
    :custom-color="getDivisionColor(index)"
    size="sm"
  >
    {{ division.name }}
  </BaseBadge>
</template>

<script setup lang="ts">
import { BaseBadge } from '@app/components/common/indicators';

const DIVISION_COLORS = [
  { bg: 'rgba(88, 166, 255, 0.15)', text: '#58a6ff' },   // Cyan
  { bg: 'rgba(126, 231, 135, 0.15)', text: '#7ee787' }, // Green
  { bg: 'rgba(188, 140, 255, 0.15)', text: '#bc8cff' }, // Purple
  { bg: 'rgba(240, 136, 62, 0.15)', text: '#f0883e' },  // Orange
  { bg: 'rgba(248, 81, 73, 0.15)', text: '#f85149' },   // Red
  { bg: 'rgba(88, 166, 255, 0.15)', text: '#58a6ff' },  // Cyan (repeat)
];

function getDivisionColor(index: number) {
  return DIVISION_COLORS[index % DIVISION_COLORS.length];
}
</script>
```

---

## Racing-Specific Tag Reference

| Tag | Meaning | Component | Variant |
|-----|---------|-----------|---------|
| `P` | Pole Position | `TagIndicator` | `purple` |
| `FL` | Fastest Lap | `TagIndicator` | `purple` |
| `DNF` | Did Not Finish | `StatusIndicator` | `error` |
| `DSQ` | Disqualified | `StatusIndicator` | `error` |
| `DNS` | Did Not Start | `StatusIndicator` | `inactive` |
| `PEN` | Penalty | `TagIndicator` | `warning` |

---

## Step-by-Step Migration

### RaceEventResultsSection.vue

1. **Import new components**:
   ```typescript
   import { TagIndicator, StatusIndicator } from '@app/components/common/indicators';
   ```

2. **Replace Pole Position Tag**:
   ```vue
   <!-- Before -->
   <Tag class="text-xs bg-purple-200 text-purple-800" :pt="...">P</Tag>

   <!-- After -->
   <TagIndicator variant="purple" title="Pole Position">P</TagIndicator>
   ```

3. **Replace Fastest Lap Tag**:
   ```vue
   <!-- Before -->
   <Tag class="text-xs bg-purple-500 text-white" :pt="...">FL</Tag>

   <!-- After -->
   <TagIndicator variant="purple" title="Fastest Lap">FL</TagIndicator>
   ```

4. **Replace DNF Tags**:
   ```vue
   <!-- Before -->
   <Tag severity="danger" class="text-xs">DNF</Tag>

   <!-- After -->
   <StatusIndicator status="error" label="DNF" :show-dot="false" size="sm" />
   ```

### ResultEntryTable.vue

1. **Import TagIndicator**:
   ```typescript
   import { TagIndicator } from '@app/components/common/indicators';
   ```

2. **Replace FL Tag**:
   ```vue
   <!-- Before -->
   <Tag class="text-xs bg-purple-500 text-white mr-1" :pt="...">FL</Tag>

   <!-- After -->
   <TagIndicator variant="purple" class="mr-1">FL</TagIndicator>
   ```

### CrossDivisionResultsSection.vue

1. **Import BaseBadge**:
   ```typescript
   import { BaseBadge } from '@app/components/common/indicators';
   ```

2. **Update division colors utility or use variant mapping**:
   ```typescript
   const DIVISION_VARIANTS = ['cyan', 'green', 'purple', 'orange', 'red', 'default'];

   function getDivisionVariant(index: number) {
     return DIVISION_VARIANTS[index % DIVISION_VARIANTS.length];
   }
   ```

3. **Replace Tag with BaseBadge**:
   ```vue
   <!-- Before -->
   <Tag :value="division.name" :class="getDivisionTagClass(index)" />

   <!-- After -->
   <BaseBadge :variant="getDivisionVariant(index)" size="sm">
     {{ division.name }}
   </BaseBadge>
   ```

---

## Testing Checklist

### RaceEventResultsSection.vue
- [ ] Pole position (P) tag displays with purple styling
- [ ] Fastest lap (FL) tag displays with purple styling
- [ ] DNF status displays with red/error styling
- [ ] Tags have appropriate title/tooltip attributes
- [ ] Multiple tags display correctly in results row

### ResultEntryTable.vue
- [ ] Fastest lap indicator displays correctly
- [ ] Proper spacing with adjacent elements

### CrossDivisionResultsSection.vue
- [ ] Division badges show distinct colors
- [ ] Colors cycle predictably for many divisions
- [ ] Badge size is appropriate in table context

---

## Files to Update

1. `resources/app/js/components/round/modals/RaceEventResultsSection.vue`
2. `resources/app/js/components/result/ResultEntryTable.vue`
3. `resources/app/js/components/round/modals/CrossDivisionResultsSection.vue`
4. `resources/app/js/utils/divisionColors.ts` (may need updating or deprecation)
5. Related test files

---

## Division Colors Refactoring

Consider creating a dedicated utility for division colors that aligns with the design system:

```typescript
// resources/app/js/utils/divisionIndicators.ts

export type DivisionVariant = 'cyan' | 'green' | 'purple' | 'orange' | 'red' | 'default';

const DIVISION_VARIANTS: DivisionVariant[] = [
  'cyan',
  'green',
  'purple',
  'orange',
  'red',
  'default',
];

export function getDivisionVariant(index: number): DivisionVariant {
  return DIVISION_VARIANTS[index % DIVISION_VARIANTS.length];
}

export function getDivisionColor(index: number): { bg: string; text: string } {
  const colors = [
    { bg: 'var(--cyan-dim)', text: 'var(--cyan)' },
    { bg: 'var(--green-dim)', text: 'var(--green)' },
    { bg: 'var(--purple-dim)', text: 'var(--purple)' },
    { bg: 'var(--orange-dim)', text: 'var(--orange)' },
    { bg: 'var(--red-dim)', text: 'var(--red)' },
    { bg: 'var(--bg-elevated)', text: 'var(--text-secondary)' },
  ];
  return colors[index % colors.length];
}
```
