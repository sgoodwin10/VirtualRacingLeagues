# League Components Migration Guide

> **Priority**: Medium
> **Files**: LeagueVisibilityTag.vue

---

## LeagueVisibilityTag.vue

**Location**: `resources/app/js/components/league/partials/LeagueVisibilityTag.vue`

### Current Implementation

Uses PrimeVue Tag with severity and custom classes:

```vue
<template>
  <Tag
    :value="visibility"
    :severity="visibilitySeverity"
    class="text-xs uppercase border"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

interface Props {
  visibility: 'public' | 'private' | 'unlisted';
}

const props = defineProps<Props>();

const visibilitySeverity = computed(() => {
  const map = {
    public: 'success',
    private: 'warning',
    unlisted: 'info',
  };
  return map[props.visibility];
});
</script>
```

### Target Implementation

```vue
<template>
  <StatusIndicator
    :status="mappedStatus"
    :label="visibility"
    :show-dot="showDot"
    uppercase
    size="sm"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StatusIndicator } from '@app/components/common/indicators';

interface Props {
  visibility: 'public' | 'private' | 'unlisted';
  showDot?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDot: false,
});

const VISIBILITY_MAP = {
  public: 'active',    // Green - visible to all
  private: 'warning',  // Orange - restricted access
  unlisted: 'inactive', // Muted - hidden from search
} as const;

const mappedStatus = computed(() => VISIBILITY_MAP[props.visibility]);
</script>
```

### Alternative: Use BaseBadge

If you prefer a non-status indicator approach:

```vue
<template>
  <BaseBadge
    :variant="variantMap[visibility]"
    size="sm"
    uppercase
  >
    <slot name="icon">
      <component :is="iconMap[visibility]" v-if="showIcon" />
    </slot>
    {{ visibility }}
  </BaseBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseBadge } from '@app/components/common/indicators';
import { PhGlobe, PhLock, PhEyeSlash } from '@phosphor-icons/vue';

interface Props {
  visibility: 'public' | 'private' | 'unlisted';
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: false,
});

const variantMap = {
  public: 'green',
  private: 'orange',
  unlisted: 'default',
} as const;

const iconMap = {
  public: PhGlobe,
  private: PhLock,
  unlisted: PhEyeSlash,
};
</script>
```

---

## Visibility Mapping Reference

| Visibility | Status | Color | Icon (optional) | Meaning |
|------------|--------|-------|-----------------|---------|
| `public` | `active` | Green | PhGlobe | Visible to everyone |
| `private` | `warning` | Orange | PhLock | Invite only |
| `unlisted` | `inactive` | Muted | PhEyeSlash | Not in search |

---

## Usage Locations

This component is used in:

1. **LeagueCard.vue** - Shows league visibility in card header
2. **LeagueHeader.vue** - Shows visibility in league detail header
3. **LeagueSettings.vue** - Shows current visibility setting

### LeagueCard.vue Update

```vue
<!-- Before -->
<LeagueVisibilityTag :visibility="league.visibility" />

<!-- After (no change needed if component is updated) -->
<LeagueVisibilityTag :visibility="league.visibility" />
```

### LeagueHeader.vue Update

```vue
<!-- Before -->
<LeagueVisibilityTag :visibility="league.visibility" />

<!-- After - with dot indicator -->
<LeagueVisibilityTag :visibility="league.visibility" :show-dot="true" />
```

---

## Step-by-Step Migration

1. **Import new component**:
   ```typescript
   import { StatusIndicator } from '@app/components/common/indicators';
   // or
   import { BaseBadge } from '@app/components/common/indicators';
   ```

2. **Remove PrimeVue Tag import**:
   ```typescript
   // Remove: import Tag from 'primevue/tag';
   ```

3. **Update template**:
   ```vue
   <StatusIndicator
     :status="mappedStatus"
     :label="visibility"
     :show-dot="showDot"
     uppercase
     size="sm"
   />
   ```

4. **Add status mapping**:
   ```typescript
   const VISIBILITY_MAP = {
     public: 'active',
     private: 'warning',
     unlisted: 'inactive',
   } as const;

   const mappedStatus = computed(() => VISIBILITY_MAP[props.visibility]);
   ```

5. **Update props if needed**:
   ```typescript
   interface Props {
     visibility: 'public' | 'private' | 'unlisted';
     showDot?: boolean;  // Add optional showDot prop
   }
   ```

---

## Testing Checklist

- [ ] Public visibility shows green indicator
- [ ] Private visibility shows orange indicator
- [ ] Unlisted visibility shows muted indicator
- [ ] Labels display in uppercase
- [ ] Status dot can be shown/hidden
- [ ] Component renders correctly in LeagueCard
- [ ] Component renders correctly in LeagueHeader
- [ ] Accessibility: Color is not the only indicator

---

## Files to Update

1. `resources/app/js/components/league/partials/LeagueVisibilityTag.vue`
2. `resources/app/js/components/league/__tests__/LeagueVisibilityTag.test.ts` (if exists)
3. No changes needed in consuming components (LeagueCard, LeagueHeader) if API stays the same

---

## Migration Notes

### Breaking Changes

None - the component API can remain the same:
- Input: `visibility` prop
- Output: Styled badge

### API Enhancement (Optional)

Consider adding:
- `showDot` prop for status indicator style
- `showIcon` prop for icon-enhanced badges
- `size` prop for different contexts
