# Table Cell Components Migration Guide

> **Priority**: High (Foundation)
> **Files**: StatusCell.vue, TeamCell.vue

---

## 1. StatusCell.vue

**Location**: `resources/app/js/components/common/tables/cells/StatusCell.vue`

### Current Implementation

Custom badge component with scoped CSS:

```vue
<template>
  <span :class="['status-cell', `status-cell--${status}`]">
    <span v-if="showDot" class="status-cell__dot" />
    {{ label }}
  </span>
</template>

<style scoped>
.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
}

.status-cell__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-cell--active,
.status-cell--completed {
  background: var(--green-dim);
  color: var(--green);
}

.status-cell--pending {
  background: var(--orange-dim);
  color: var(--orange);
}

.status-cell--inactive,
.status-cell--scheduled {
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.status-cell--error,
.status-cell--failed {
  background: var(--red-dim);
  color: var(--red);
}
</style>
```

### Target Implementation

Compose `StatusIndicator` component:

```vue
<template>
  <StatusIndicator
    :status="mappedStatus"
    :label="label"
    :show-dot="showDot"
    :size="size"
    :uppercase="uppercase"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StatusIndicator } from '@app/components/common/indicators';

type CellStatus =
  | 'active'
  | 'completed'
  | 'pending'
  | 'inactive'
  | 'scheduled'
  | 'error'
  | 'failed'
  | 'success'
  | 'warning';

interface Props {
  status: CellStatus;
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
  uppercase?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDot: true,
  size: 'md',
  uppercase: false,
});

// Map cell statuses to StatusIndicator statuses
const STATUS_MAP: Record<CellStatus, string> = {
  active: 'active',
  completed: 'success',
  success: 'success',
  pending: 'pending',
  warning: 'warning',
  scheduled: 'inactive',
  inactive: 'inactive',
  error: 'error',
  failed: 'error',
};

const mappedStatus = computed(() => STATUS_MAP[props.status] ?? 'inactive');
</script>
```

### Alternative: Deprecate StatusCell

Since `StatusIndicator` provides the same functionality, consider deprecating `StatusCell`:

```typescript
// StatusCell.vue - Add deprecation notice
/**
 * @deprecated Use StatusIndicator from @app/components/common/indicators instead
 * This component will be removed in the next major version.
 */
```

Migration path:
```vue
<!-- Before -->
<StatusCell status="active" label="Active" />

<!-- After -->
<StatusIndicator status="active" label="Active" />
```

---

## 2. TeamCell.vue

**Location**: `resources/app/js/components/common/tables/cells/TeamCell.vue`

### Current Implementation

Custom component with color dot or logo:

```vue
<template>
  <span class="team-cell">
    <img
      v-if="team.logo"
      :src="team.logo"
      :alt="team.name"
      class="team-cell__logo"
    />
    <span
      v-else
      class="team-cell__dot"
      :style="{ backgroundColor: team.color }"
    />
    <span class="team-cell__name">{{ team.name }}</span>
  </span>
</template>

<style scoped>
.team-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--bg-elevated);
  border-radius: 3px;
  font-size: 12px;
}

.team-cell__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.team-cell__logo {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}
</style>
```

### Target Implementation

Compose `TeamIndicator` component:

```vue
<template>
  <TeamIndicator
    :name="team.name"
    :color="team.color"
    :logo="team.logo"
    :show-name="showName"
    :size="size"
    :truncate="truncate"
    :max-width="maxWidth"
  />
</template>

<script setup lang="ts">
import { TeamIndicator } from '@app/components/common/indicators';

interface Team {
  name: string;
  color?: string;
  logo?: string;
}

interface Props {
  team: Team;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  truncate?: boolean;
  maxWidth?: string;
}

withDefaults(defineProps<Props>(), {
  showName: true,
  size: 'md',
  truncate: true,
  maxWidth: '120px',
});
</script>
```

### Alternative: Deprecate TeamCell

```typescript
// TeamCell.vue - Add deprecation notice
/**
 * @deprecated Use TeamIndicator from @app/components/common/indicators instead
 * This component will be removed in the next major version.
 */
```

Migration path:
```vue
<!-- Before -->
<TeamCell :team="driver.team" />

<!-- After -->
<TeamIndicator
  :name="driver.team.name"
  :color="driver.team.color"
  :logo="driver.team.logo"
/>
```

---

## DataTable Integration

### With StatusCell (Before)

```vue
<DataTable :value="items">
  <Column header="Status">
    <template #body="{ data }">
      <StatusCell :status="data.status" :label="data.statusLabel" />
    </template>
  </Column>
</DataTable>
```

### With StatusIndicator (After)

```vue
<DataTable :value="items">
  <Column header="Status">
    <template #body="{ data }">
      <StatusIndicator
        :status="data.status"
        :label="data.statusLabel"
        size="sm"
      />
    </template>
  </Column>
</DataTable>
```

### With TeamCell (Before)

```vue
<DataTable :value="drivers">
  <Column header="Team">
    <template #body="{ data }">
      <TeamCell :team="data.team" />
    </template>
  </Column>
</DataTable>
```

### With TeamIndicator (After)

```vue
<DataTable :value="drivers">
  <Column header="Team">
    <template #body="{ data }">
      <TeamIndicator
        :name="data.team.name"
        :color="data.team.color"
        :logo="data.team.logo"
        size="sm"
      />
    </template>
  </Column>
</DataTable>
```

---

## Step-by-Step Migration

### StatusCell.vue

**Option A: Wrap StatusIndicator (maintains backward compatibility)**

1. Update imports:
   ```typescript
   import { StatusIndicator } from '@app/components/common/indicators';
   ```

2. Replace template with StatusIndicator composition

3. Add deprecation notice in JSDoc

**Option B: Find and replace all usages**

1. Search for all `<StatusCell` usages
2. Replace with `<StatusIndicator`
3. Update imports in each file
4. Delete StatusCell.vue

### TeamCell.vue

**Option A: Wrap TeamIndicator (maintains backward compatibility)**

1. Update imports:
   ```typescript
   import { TeamIndicator } from '@app/components/common/indicators';
   ```

2. Replace template with TeamIndicator composition

3. Add deprecation notice in JSDoc

**Option B: Find and replace all usages**

1. Search for all `<TeamCell` usages
2. Replace with `<TeamIndicator`
3. Update imports in each file
4. Delete TeamCell.vue

---

## Testing Checklist

### StatusCell.vue → StatusIndicator
- [ ] All status types render with correct colors
- [ ] Dot visibility can be toggled
- [ ] Labels display correctly
- [ ] Size variants work
- [ ] Uppercase modifier works
- [ ] No visual regression in tables

### TeamCell.vue → TeamIndicator
- [ ] Team name displays correctly
- [ ] Color dot shows team color
- [ ] Logo displays when provided
- [ ] Logo fallback to dot works
- [ ] Truncation works for long names
- [ ] Size variants work
- [ ] No visual regression in tables

---

## Files to Update

### StatusCell Migration
1. `resources/app/js/components/common/tables/cells/StatusCell.vue`
2. All files importing StatusCell (search: `from.*StatusCell`)
3. `resources/app/js/components/common/tables/cells/__tests__/StatusCell.test.ts`

### TeamCell Migration
1. `resources/app/js/components/common/tables/cells/TeamCell.vue`
2. All files importing TeamCell (search: `from.*TeamCell`)
3. `resources/app/js/components/common/tables/cells/__tests__/TeamCell.test.ts`

---

## Deprecation Timeline

1. **Phase 1** (Current): Update components to compose new indicators
2. **Phase 2** (Next minor): Add console warnings in development
3. **Phase 3** (Next major): Remove deprecated components

```typescript
// Example deprecation warning
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATED] StatusCell is deprecated. Use StatusIndicator from @app/components/common/indicators instead.'
  );
}
```
