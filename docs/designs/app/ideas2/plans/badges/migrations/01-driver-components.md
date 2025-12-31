# Driver Components Migration Guide

> **Priority**: High
> **Files**: DriverStatusBadge.vue, ViewDriverModal.vue

---

## 1. DriverStatusBadge.vue

**Location**: `resources/app/js/components/driver/DriverStatusBadge.vue`

### Current Implementation

Uses PrimeVue Chip with Tailwind color classes:

```vue
<template>
  <Chip
    :label="statusLabel"
    :class="statusClass"
  />
</template>

<script setup>
// Maps status to Tailwind classes
const statusClasses = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  banned: 'bg-red-100 text-red-800',
};
</script>
```

### Target Implementation

Replace with `StatusIndicator`:

```vue
<template>
  <StatusIndicator
    :status="mappedStatus"
    :label="statusLabel"
    :show-dot="showDot"
    uppercase
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StatusIndicator } from '@app/components/common/indicators';

interface Props {
  status: 'active' | 'inactive' | 'banned';
  showDot?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDot: true,
});

const STATUS_MAP = {
  active: { status: 'active' as const, label: 'Active' },
  inactive: { status: 'inactive' as const, label: 'Inactive' },
  banned: { status: 'error' as const, label: 'Banned' },
};

const mappedStatus = computed(() => STATUS_MAP[props.status].status);
const statusLabel = computed(() => STATUS_MAP[props.status].label);
</script>
```

### Alternative: Deprecate and Replace

Consider deprecating `DriverStatusBadge.vue` entirely and using `StatusIndicator` directly:

```vue
<!-- Before -->
<DriverStatusBadge :status="driver.status" />

<!-- After -->
<StatusIndicator
  :status="driver.status === 'banned' ? 'error' : driver.status"
  :label="driver.status"
  uppercase
/>
```

---

## 2. ViewDriverModal.vue

**Location**: `resources/app/js/components/driver/ViewDriverModal.vue`

### Current Implementation

Multiple inline Tailwind badges:

```vue
<!-- Active status dot -->
<span class="w-2 h-2 rounded-full bg-green-500"></span>

<!-- Division badge -->
<span class="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
  {{ division.name }}
</span>

<!-- Season badge -->
<span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
  {{ season.name }}
</span>

<!-- Points badge -->
<span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-500 text-white">
  {{ points }} pts
</span>
```

### Target Implementation

```vue
<template>
  <!-- Active status -->
  <StatusIndicator
    :status="driver.isActive ? 'active' : 'inactive'"
    :show-dot="true"
    size="sm"
  />

  <!-- Division badge -->
  <BaseBadge variant="purple" size="sm" uppercase>
    {{ division.name }}
  </BaseBadge>

  <!-- Season badge -->
  <BaseBadge variant="cyan" size="sm">
    {{ season.name }}
  </BaseBadge>

  <!-- Points badge -->
  <BaseBadge variant="green" size="sm">
    {{ points }} pts
  </BaseBadge>
</template>

<script setup lang="ts">
import { StatusIndicator, BaseBadge } from '@app/components/common/indicators';
</script>
```

### Step-by-Step Migration

1. **Import new components**:
   ```typescript
   import { StatusIndicator, BaseBadge } from '@app/components/common/indicators';
   ```

2. **Replace active status dot**:
   ```vue
   <!-- Before -->
   <span class="w-2 h-2 rounded-full bg-green-500"></span>

   <!-- After -->
   <StatusIndicator
     :status="driver.isActive ? 'active' : 'inactive'"
     :show-dot="true"
     :label="driver.isActive ? 'Active' : 'Inactive'"
     size="sm"
   />
   ```

3. **Replace division badge**:
   ```vue
   <!-- Before -->
   <span class="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
     {{ division.name }}
   </span>

   <!-- After -->
   <BaseBadge variant="purple" size="sm">
     {{ division.name }}
   </BaseBadge>
   ```

4. **Replace season badge**:
   ```vue
   <!-- Before -->
   <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
     {{ season.name }}
   </span>

   <!-- After -->
   <BaseBadge variant="cyan" size="sm">
     {{ season.name }}
   </BaseBadge>
   ```

5. **Replace points badge**:
   ```vue
   <!-- Before -->
   <span class="px-2 py-0.5 rounded text-xs font-semibold bg-green-500 text-white">
     {{ points }} pts
   </span>

   <!-- After -->
   <BaseBadge variant="green" size="sm">
     {{ points }} pts
   </BaseBadge>
   ```

---

## Testing Checklist

- [ ] DriverStatusBadge shows correct colors for active, inactive, banned
- [ ] DriverStatusBadge dot visibility can be toggled
- [ ] ViewDriverModal active status displays correctly
- [ ] ViewDriverModal division badges render with purple styling
- [ ] ViewDriverModal season badges render with cyan styling
- [ ] ViewDriverModal points badge renders with green styling
- [ ] All badges are accessible (color contrast, text labels)
- [ ] Visual regression test passes

---

## Files to Update

1. `resources/app/js/components/driver/DriverStatusBadge.vue`
2. `resources/app/js/components/driver/ViewDriverModal.vue`
3. `resources/app/js/components/driver/__tests__/DriverStatusBadge.test.ts`
4. `resources/app/js/components/driver/__tests__/ViewDriverModal.test.ts`
