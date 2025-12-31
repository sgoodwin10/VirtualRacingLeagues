# Season & Competition Components Migration Guide

> **Priority**: Medium
> **Files**: SeasonCard.vue, CompetitionCard.vue, CompetitionHeader.vue

---

## 1. SeasonCard.vue

**Location**: `resources/app/js/components/season/SeasonCard.vue`

### Current Implementation

Uses PrimeVue Chip with severity prop:

```vue
<template>
  <!-- Season status -->
  <Chip
    :label="season.status"
    :severity="statusSeverity"
  />

  <!-- Car class -->
  <Chip :label="season.carClass" />
</template>

<script setup>
const statusSeverity = computed(() => {
  const map = {
    active: 'success',
    completed: 'info',
    archived: 'warn',
    setup: 'secondary',
  };
  return map[season.status];
});
</script>
```

### Target Implementation

```vue
<template>
  <!-- Season status -->
  <StatusIndicator
    :status="mappedStatus"
    :label="season.status"
    uppercase
  />

  <!-- Car class -->
  <BaseBadge variant="purple" size="sm">
    {{ season.carClass }}
  </BaseBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StatusIndicator, BaseBadge } from '@app/components/common/indicators';

const STATUS_MAP = {
  active: 'active',
  completed: 'success',
  archived: 'inactive',
  setup: 'pending',
} as const;

const mappedStatus = computed(() => STATUS_MAP[props.season.status] ?? 'inactive');
</script>
```

### Status Mapping Reference

| Season Status | StatusIndicator Status | Color |
|--------------|----------------------|-------|
| `active` | `active` | Green |
| `completed` | `success` | Green |
| `archived` | `inactive` | Muted |
| `setup` | `pending` | Orange |

---

## 2. CompetitionCard.vue

**Location**: `resources/app/js/components/competition/CompetitionCard.vue`

### Current Implementation

Uses multiple PrimeVue Tags:

```vue
<template>
  <!-- Archived badge -->
  <Tag v-if="competition.isArchived" value="Archived" severity="secondary" class="text-xs" />

  <!-- Season archived badge -->
  <Tag v-if="season.isArchived" value="Archived" severity="secondary" class="text-xs" />

  <!-- Season status badge -->
  <Tag
    :value="season.status"
    :severity="season.isActive ? 'success' : 'warn'"
    class="text-xs"
  />
</template>
```

### Target Implementation

```vue
<template>
  <!-- Archived badge -->
  <StatusIndicator
    v-if="competition.isArchived"
    status="inactive"
    label="Archived"
    :show-dot="false"
    size="sm"
    uppercase
  />

  <!-- Season archived badge -->
  <StatusIndicator
    v-if="season.isArchived"
    status="inactive"
    label="Archived"
    :show-dot="false"
    size="sm"
    uppercase
  />

  <!-- Season status badge -->
  <StatusIndicator
    :status="season.isActive ? 'active' : 'pending'"
    :label="season.status"
    size="sm"
    uppercase
  />
</template>

<script setup lang="ts">
import { StatusIndicator } from '@app/components/common/indicators';
</script>
```

---

## 3. CompetitionHeader.vue

**Location**: `resources/app/js/components/competition/CompetitionHeader.vue`

### Current Implementation

Uses PrimeVue Chip for platform name:

```vue
<template>
  <Chip>
    <template #default>
      {{ platform.name }}
    </template>
  </Chip>
</template>
```

### Target Implementation

```vue
<template>
  <BaseBadge variant="cyan" size="md">
    {{ platform.name }}
  </BaseBadge>
</template>

<script setup lang="ts">
import { BaseBadge } from '@app/components/common/indicators';
</script>
```

---

## Step-by-Step Migration

### SeasonCard.vue

1. **Import new components**:
   ```typescript
   import { StatusIndicator, BaseBadge } from '@app/components/common/indicators';
   ```

2. **Remove PrimeVue Chip import**:
   ```typescript
   // Remove: import Chip from 'primevue/chip';
   ```

3. **Update status badge**:
   ```vue
   <StatusIndicator
     :status="statusMap[season.status]"
     :label="season.status"
     uppercase
   />
   ```

4. **Update car class badge**:
   ```vue
   <BaseBadge variant="purple" size="sm">
     {{ season.carClass }}
   </BaseBadge>
   ```

### CompetitionCard.vue

1. **Import StatusIndicator**:
   ```typescript
   import { StatusIndicator } from '@app/components/common/indicators';
   ```

2. **Replace Tag components**:
   - Archived → `StatusIndicator` with `status="inactive"`
   - Active → `StatusIndicator` with `status="active"`
   - Setup/Warn → `StatusIndicator` with `status="pending"`

### CompetitionHeader.vue

1. **Import BaseBadge**:
   ```typescript
   import { BaseBadge } from '@app/components/common/indicators';
   ```

2. **Replace Chip with BaseBadge**:
   ```vue
   <BaseBadge variant="cyan">
     {{ platform.name }}
   </BaseBadge>
   ```

---

## Testing Checklist

### SeasonCard.vue
- [ ] Active seasons show green status
- [ ] Completed seasons show green status
- [ ] Archived seasons show muted status
- [ ] Setup seasons show orange status
- [ ] Car class badge displays correctly
- [ ] Labels display in uppercase

### CompetitionCard.vue
- [ ] Archived competitions show muted badge
- [ ] Active seasons show green status
- [ ] Setup seasons show orange status
- [ ] Multiple badges display correctly together

### CompetitionHeader.vue
- [ ] Platform name displays in cyan badge
- [ ] Badge is properly sized and positioned

---

## Files to Update

1. `resources/app/js/components/season/SeasonCard.vue`
2. `resources/app/js/components/competition/CompetitionCard.vue`
3. `resources/app/js/components/competition/CompetitionHeader.vue`
4. `resources/app/js/components/season/__tests__/SeasonCard.test.ts`
5. `resources/app/js/components/competition/__tests__/CompetitionCard.test.ts`
