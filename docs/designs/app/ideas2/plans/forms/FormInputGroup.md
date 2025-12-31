# FormInputGroup Migration Plan

## Overview
This plan outlines the migration of `FormInputGroup.vue` component from the current Tailwind-based implementation to the new Technical Blueprint design system. The component currently provides vertical spacing for form field groups, but needs to be updated to support both vertical stacking and horizontal grid layouts.

## Current Implementation Analysis

### Current Component
**Location:** `/var/www/resources/app/js/components/common/forms/FormInputGroup.vue`

**Current Code:**
```vue
<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  spacing?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  spacing: undefined,
  class: '',
});

const containerClasses = computed(() => {
  const spacingClass = props.spacing ?? 'space-y-1';
  return props.class ? `${spacingClass} ${props.class}` : spacingClass;
});
</script>
```

**Current Behavior:**
- Provides a simple wrapper div with vertical spacing between child elements
- Default spacing is `space-y-1` (4px gap in Tailwind)
- Accepts custom spacing and additional classes via props
- Used as a wrapper for individual form fields (label + input + error/help text)

### New Design Requirements

**From forms.html:**
```css
.form-group {
  margin-bottom: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
```

**Key Changes:**
1. `.form-group` - Vertical spacing for individual form fields (18px bottom margin)
2. `.form-row` - Horizontal grid layout for side-by-side form fields (2 columns, 14px gap)

## Usage Analysis

### Files Using FormInputGroup (15 component files)

1. **Driver Management:**
   - `resources/app/js/components/driver/modals/DriverFormDialog.vue`
   - `resources/app/js/components/driver/modals/CSVImportDialog.vue`

2. **Round/Race Management:**
   - `resources/app/js/components/round/modals/RoundFormDrawer.vue`
   - `resources/app/js/components/round/modals/RaceFormDrawer.vue`

3. **Competition Management:**
   - `resources/app/js/components/competition/CompetitionFormDrawer.vue`
   - `resources/app/js/components/competition/CompetitionDeleteDialog.vue`

4. **Season Management:**
   - `resources/app/js/components/season/modals/SeasonFormDrawer.vue`
   - `resources/app/js/components/season/modals/SeasonDriverFormDialog.vue`
   - `resources/app/js/components/season/modals/SeasonDeleteDialog.vue`
   - `resources/app/js/components/season/divisions/DivisionFormModal.vue`
   - `resources/app/js/components/season/teams/TeamFormModal.vue`

5. **League Management:**
   - `resources/app/js/components/league/modals/LeagueWizardDrawer.vue`
   - `resources/app/js/components/league/partials/PlatformMultiSelect.vue`
   - `resources/app/js/components/league/partials/SocialMediaFields.vue`

### Common Usage Patterns

**Pattern 1: Single Field Wrapper**
```vue
<FormInputGroup>
  <FormLabel for="nickname" text="Nickname" />
  <InputText id="nickname" v-model="formData.nickname" />
  <FormError :error="errors.nickname" />
</FormInputGroup>
```

**Pattern 2: Multiple Fields in Grid (Current Implementation)**
```vue
<div class="grid grid-cols-2 gap-3">
  <FormInputGroup>
    <FormLabel for="first_name" text="First Name" />
    <InputText id="first_name" v-model="formData.first_name" />
  </FormInputGroup>
  <FormInputGroup>
    <FormLabel for="last_name" text="Last Name" />
    <InputText id="last_name" v-model="formData.last_name" />
  </FormInputGroup>
</div>
```

**Pattern 3: Dynamic Fields**
```vue
<FormInputGroup v-for="field in platformFormFields" :key="field.field">
  <FormLabel :for="field.field" :text="field.label" />
  <InputText :id="field.field" v-model="formData[field.field]" />
</FormInputGroup>
```

## Design Decision: Single Component vs. Separate Components

### Option A: Enhance FormInputGroup (RECOMMENDED)
Keep `FormInputGroup` as the primary component and add layout control via props.

**Pros:**
- Maintains backward compatibility with existing code
- Single source of truth for form field grouping
- Simpler mental model (one component, multiple modes)
- Less migration work required
- Consistent naming convention

**Cons:**
- Component becomes slightly more complex
- May need to update some existing usages to specify layout prop

### Option B: Create Separate FormRow Component
Create a new `FormRow.vue` component specifically for horizontal layouts.

**Pros:**
- Separation of concerns (vertical vs. horizontal)
- Very explicit component names
- No changes to existing FormInputGroup usages

**Cons:**
- Two components with overlapping responsibilities
- Developers need to choose between two components
- More maintenance overhead
- Inconsistent patterns in codebase (some places use grid divs, some use FormRow)

**RECOMMENDATION: Option A**
Enhance `FormInputGroup` with layout control. This approach is more maintainable and requires less code duplication.

## Implementation Plan

### Step 1: Create CSS Component File
**File:** `/var/www/resources/app/css/components/forms.css`

```css
/* Form Group - Individual form field wrapper */
.form-group {
  margin-bottom: 18px;
}

/* Form Row - Horizontal grid layout for side-by-side fields */
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

/* Form Row - 3 column variant */
.form-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

/* Form Row - 4 column variant */
.form-row-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .form-row,
  .form-row-3,
  .form-row-4 {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}
```

### Step 2: Import CSS in app.css
**File:** `/var/www/resources/app/css/app.css`

Add import statement:
```css
@import './components/forms.css';
```

### Step 3: Update FormInputGroup Component
**File:** `/var/www/resources/app/js/components/common/forms/FormInputGroup.vue`

**New Implementation:**
```vue
<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type LayoutMode = 'vertical' | 'horizontal';

interface Props {
  /**
   * Layout mode for the form group
   * @default 'vertical'
   */
  layout?: LayoutMode;

  /**
   * Number of columns for horizontal layout
   * @default 2
   */
  columns?: 2 | 3 | 4;

  /**
   * Legacy spacing prop - deprecated, use layout instead
   * @deprecated
   */
  spacing?: string;

  /**
   * Additional CSS classes
   */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'vertical',
  columns: 2,
  spacing: undefined,
  class: '',
});

const containerClasses = computed(() => {
  const classes: string[] = [];

  // Handle legacy spacing prop for backward compatibility
  if (props.spacing) {
    classes.push(props.spacing);
  } else {
    // Use new CSS classes based on layout mode
    if (props.layout === 'horizontal') {
      if (props.columns === 3) {
        classes.push('form-row-3');
      } else if (props.columns === 4) {
        classes.push('form-row-4');
      } else {
        classes.push('form-row');
      }
    } else {
      classes.push('form-group');
    }
  }

  // Add custom classes
  if (props.class) {
    classes.push(props.class);
  }

  return classes.join(' ');
});
</script>
```

### Step 4: Create TypeScript Type Definitions
**File:** `/var/www/resources/app/js/types/forms.ts` (create if doesn't exist)

```typescript
export type FormLayoutMode = 'vertical' | 'horizontal';

export interface FormInputGroupProps {
  layout?: FormLayoutMode;
  columns?: 2 | 3 | 4;
  spacing?: string;
  class?: string;
}
```

### Step 5: Update Component Index
**File:** `/var/www/resources/app/js/components/common/forms/index.ts` (create if doesn't exist)

```typescript
export { default as FormInputGroup } from './FormInputGroup.vue';
export { default as FormLabel } from './FormLabel.vue';
export { default as FormError } from './FormError.vue';
export { default as FormHelper } from './FormHelper.vue';
export { default as FormCharacterCount } from './FormCharacterCount.vue';
export { default as FormOptionalText } from './FormOptionalText.vue';
export { default as ImageUpload } from './ImageUpload.vue';
```

## Migration Strategy for Existing Components

### Strategy 1: Non-Breaking (Recommended for Initial Rollout)
**Keep existing code working, gradually migrate:**

All existing usages continue to work due to backward compatibility. New code can use the enhanced API.

**No immediate changes required for:**
- Single field wrappers (work as-is with new `.form-group` class)
- Components using legacy `spacing` prop (still supported)

**Recommended updates for horizontal layouts:**

**Before:**
```vue
<div class="grid grid-cols-2 gap-3">
  <FormInputGroup>
    <FormLabel for="first_name" text="First Name" />
    <InputText id="first_name" v-model="formData.first_name" />
  </FormInputGroup>
  <FormInputGroup>
    <FormLabel for="last_name" text="Last Name" />
    <InputText id="last_name" v-model="formData.last_name" />
  </FormInputGroup>
</div>
```

**After:**
```vue
<FormInputGroup layout="horizontal" :columns="2">
  <div>
    <FormLabel for="first_name" text="First Name" />
    <InputText id="first_name" v-model="formData.first_name" />
  </div>
  <div>
    <FormLabel for="last_name" text="Last Name" />
    <InputText id="last_name" v-model="formData.last_name" />
  </div>
</FormInputGroup>
```

**Benefits:**
- Cleaner markup (no manual grid classes)
- Consistent spacing with design system
- Responsive behavior built-in

### Strategy 2: Components to Update Immediately

**High Priority (use horizontal layout):**
1. `DriverFormDialog.vue` - Multiple grid layouts for name fields, contact fields
2. `LeagueWizardDrawer.vue` - May have side-by-side fields
3. `SeasonFormDrawer.vue` - Complex forms with multiple layouts

**Low Priority (keep as-is initially):**
- Simple forms with only vertical fields
- Components using dynamic v-for rendering

## Testing Plan

### Unit Tests
**File:** `/var/www/resources/app/js/components/common/forms/__tests__/FormInputGroup.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormInputGroup from '../FormInputGroup.vue';

describe('FormInputGroup', () => {
  describe('Vertical Layout (default)', () => {
    it('renders with form-group class by default', () => {
      const wrapper = mount(FormInputGroup, {
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
    });

    it('renders with explicit vertical layout', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'vertical' },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
    });
  });

  describe('Horizontal Layout', () => {
    it('renders with form-row class for 2 columns', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'horizontal', columns: 2 },
        slots: {
          default: '<div>Field 1</div><div>Field 2</div>',
        },
      });

      expect(wrapper.classes()).toContain('form-row');
    });

    it('renders with form-row-3 class for 3 columns', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'horizontal', columns: 3 },
        slots: {
          default: '<div>1</div><div>2</div><div>3</div>',
        },
      });

      expect(wrapper.classes()).toContain('form-row-3');
    });

    it('renders with form-row-4 class for 4 columns', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'horizontal', columns: 4 },
        slots: {
          default: '<div>1</div><div>2</div><div>3</div><div>4</div>',
        },
      });

      expect(wrapper.classes()).toContain('form-row-4');
    });
  });

  describe('Backward Compatibility', () => {
    it('supports legacy spacing prop', () => {
      const wrapper = mount(FormInputGroup, {
        props: { spacing: 'space-y-4' },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('space-y-4');
    });

    it('prioritizes spacing prop over layout when both provided', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          spacing: 'custom-spacing',
          layout: 'horizontal'
        },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('custom-spacing');
      expect(wrapper.classes()).not.toContain('form-row');
    });
  });

  describe('Custom Classes', () => {
    it('applies additional custom classes', () => {
      const wrapper = mount(FormInputGroup, {
        props: {
          layout: 'vertical',
          class: 'custom-class another-class'
        },
        slots: {
          default: '<input type="text" />',
        },
      });

      expect(wrapper.classes()).toContain('form-group');
      expect(wrapper.classes()).toContain('custom-class');
      expect(wrapper.classes()).toContain('another-class');
    });
  });

  describe('Slot Content', () => {
    it('renders slot content correctly', () => {
      const wrapper = mount(FormInputGroup, {
        slots: {
          default: '<input type="text" id="test-input" />',
        },
      });

      expect(wrapper.html()).toContain('<input type="text" id="test-input"');
    });

    it('renders multiple slot children', () => {
      const wrapper = mount(FormInputGroup, {
        props: { layout: 'horizontal' },
        slots: {
          default: `
            <div class="field-1">Field 1</div>
            <div class="field-2">Field 2</div>
          `,
        },
      });

      expect(wrapper.html()).toContain('field-1');
      expect(wrapper.html()).toContain('field-2');
    });
  });
});
```

### Integration Tests

Test in actual forms to ensure proper rendering and spacing:

1. **DriverFormDialog.vue** - Test grid layout with 2 columns
2. **LeagueWizardDrawer.vue** - Test complex multi-section forms
3. **SeasonFormDrawer.vue** - Test mixed vertical and horizontal layouts

### Visual Regression Testing

1. Take screenshots of forms before migration
2. Compare with screenshots after migration
3. Verify spacing matches design specifications:
   - Vertical: 18px bottom margin
   - Horizontal: 14px gap between columns
   - Mobile: Should stack vertically

### Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

Verify:
- Grid layouts render correctly
- Responsive behavior works (stacks on mobile)
- No layout shifts or visual regressions

## Files to Update

### Must Update
1. `/var/www/resources/app/css/components/forms.css` (create)
2. `/var/www/resources/app/css/app.css` (add import)
3. `/var/www/resources/app/js/components/common/forms/FormInputGroup.vue` (update component)
4. `/var/www/resources/app/js/components/common/forms/__tests__/FormInputGroup.test.ts` (create tests)

### Should Update (High Priority - Complex Grids)
5. `/var/www/resources/app/js/components/driver/modals/DriverFormDialog.vue`
6. `/var/www/resources/app/js/components/league/modals/LeagueWizardDrawer.vue`
7. `/var/www/resources/app/js/components/season/modals/SeasonFormDrawer.vue`

### Can Update Later (Low Priority - Simple Forms)
8. `/var/www/resources/app/js/components/round/modals/RoundFormDrawer.vue`
9. `/var/www/resources/app/js/components/round/modals/RaceFormDrawer.vue`
10. `/var/www/resources/app/js/components/competition/CompetitionFormDrawer.vue`
11. `/var/www/resources/app/js/components/competition/CompetitionDeleteDialog.vue`
12. `/var/www/resources/app/js/components/season/modals/SeasonDriverFormDialog.vue`
13. `/var/www/resources/app/js/components/season/modals/SeasonDeleteDialog.vue`
14. `/var/www/resources/app/js/components/season/divisions/DivisionFormModal.vue`
15. `/var/www/resources/app/js/components/season/teams/TeamFormModal.vue`
16. `/var/www/resources/app/js/components/driver/modals/CSVImportDialog.vue`
17. `/var/www/resources/app/js/components/league/partials/PlatformMultiSelect.vue`
18. `/var/www/resources/app/js/components/league/partials/SocialMediaFields.vue`

## Rollout Plan

### Phase 1: Foundation (Week 1)
1. Create CSS component file with form styles
2. Update FormInputGroup component with new layout prop
3. Add backward compatibility for legacy spacing prop
4. Write comprehensive unit tests
5. Update component documentation

### Phase 2: High-Priority Migration (Week 2)
1. Update DriverFormDialog.vue (most complex grids)
2. Update LeagueWizardDrawer.vue
3. Update SeasonFormDrawer.vue
4. Test each component thoroughly
5. Visual regression testing

### Phase 3: Low-Priority Migration (Week 3)
1. Update remaining components one by one
2. Test each update
3. Document any issues or edge cases

### Phase 4: Cleanup (Week 4)
1. Remove manual grid classes from all components
2. Consider deprecating spacing prop (console warning)
3. Update documentation
4. Team review and feedback

## Risks and Mitigation

### Risk 1: Breaking Existing Layouts
**Mitigation:**
- Maintain backward compatibility with spacing prop
- Phased rollout with thorough testing
- Keep old grid classes working until full migration

### Risk 2: Spacing Inconsistencies
**Mitigation:**
- Clear CSS specifications (18px vertical, 14px horizontal)
- Visual regression testing
- Design review before rollout

### Risk 3: Mobile Responsiveness Issues
**Mitigation:**
- Built-in responsive behavior in CSS
- Mobile browser testing
- Media query fallbacks

### Risk 4: Developer Confusion
**Mitigation:**
- Clear documentation with examples
- JSDoc comments in component
- Team training/walkthrough

## Success Criteria

1. All tests pass (unit, integration, visual)
2. No visual regressions in any form component
3. Consistent spacing across all forms (18px vertical, 14px gap horizontal)
4. Responsive behavior works on mobile
5. Backward compatibility maintained
6. Performance metrics unchanged
7. TypeScript types are complete and accurate
8. Code coverage > 90% for FormInputGroup

## Documentation Updates Required

1. Component documentation (JSDoc comments)
2. Storybook examples (if applicable)
3. Team wiki/README with migration guide
4. CHANGELOG.md entry
5. Example usage patterns for new developers

## Before/After Comparison

### Before (Current Implementation)

**Component Usage:**
```vue
<!-- Vertical fields -->
<FormInputGroup spacing="space-y-1">
  <FormLabel for="name" text="Name" />
  <InputText id="name" v-model="name" />
</FormInputGroup>

<!-- Horizontal layout (manual grid) -->
<div class="grid grid-cols-2 gap-3">
  <FormInputGroup>
    <FormLabel for="first" text="First Name" />
    <InputText id="first" v-model="first" />
  </FormInputGroup>
  <FormInputGroup>
    <FormLabel for="last" text="Last Name" />
    <InputText id="last" v-model="last" />
  </FormInputGroup>
</div>
```

**CSS:**
- Uses Tailwind utility classes
- No custom CSS component
- Spacing: 4px vertical (space-y-1), 12px horizontal (gap-3)

### After (New Implementation)

**Component Usage:**
```vue
<!-- Vertical fields -->
<FormInputGroup>
  <FormLabel for="name" text="Name" />
  <InputText id="name" v-model="name" />
</FormInputGroup>

<!-- Horizontal layout (built-in) -->
<FormInputGroup layout="horizontal" :columns="2">
  <div>
    <FormLabel for="first" text="First Name" />
    <InputText id="first" v-model="first" />
  </div>
  <div>
    <FormLabel for="last" text="Last Name" />
    <InputText id="last" v-model="last" />
  </div>
</FormInputGroup>

<!-- 3-column layout -->
<FormInputGroup layout="horizontal" :columns="3">
  <div>Field 1</div>
  <div>Field 2</div>
  <div>Field 3</div>
</FormInputGroup>
```

**CSS:**
- Custom CSS component in `components/forms.css`
- Design system values: 18px vertical, 14px horizontal gap
- Responsive behavior built-in (mobile stacking)
- Consistent with Technical Blueprint aesthetic

## Timeline Estimate

- **Phase 1:** 2-3 days (foundation + tests)
- **Phase 2:** 3-4 days (high-priority migration)
- **Phase 3:** 4-5 days (remaining components)
- **Phase 4:** 1-2 days (cleanup + documentation)

**Total:** 10-14 days for complete migration

## Notes

- The enhanced FormInputGroup approach is cleaner and more maintainable than creating separate components
- Backward compatibility ensures no breaking changes during migration
- The layout prop provides a clear API for controlling form field layouts
- CSS-based responsive behavior is more reliable than multiple component variants
- This pattern can be extended to other layout needs (e.g., 3-column, 4-column grids)
