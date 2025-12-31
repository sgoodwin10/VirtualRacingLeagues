# FormError Component Migration Plan

## Overview
Migrate the FormError component from Tailwind utility classes to the Technical Blueprint design system, using CSS custom properties for consistent error messaging across the application.

## Summary of Changes
- Replace Tailwind utility classes with Technical Blueprint CSS custom properties
- Update font-size from `text-sm` (12px via Tailwind) to explicit `12px` matching design spec
- Replace `text-red-500` with `var(--red)` (#f85149) for consistent color usage
- Update margin-top from `mt-1` (4px) to `6px` matching design spec
- Maintain backwards compatibility with custom class prop

## Before/After Comparison

### Current Implementation
```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  error?: string | string[];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  error: undefined,
  class: '',
});

const errorMessage = computed(() => {
  if (!props.error) return null;
  return Array.isArray(props.error) ? props.error[0] : props.error;
});

const errorClasses = computed(() => {
  const baseClasses = 'text-sm text-red-500 mt-1';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <small v-if="errorMessage" :class="errorClasses">
    {{ errorMessage }}
  </small>
</template>
```

**Styling:**
- Uses Tailwind utilities: `text-sm text-red-500 mt-1`
- Font size: 12px (via `text-sm`)
- Color: #ef4444 (Tailwind's `red-500`)
- Margin top: 4px (via `mt-1`)

### New Implementation
```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  error?: string | string[];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  error: undefined,
  class: '',
});

const errorMessage = computed(() => {
  if (!props.error) return null;
  return Array.isArray(props.error) ? props.error[0] : props.error;
});
</script>

<template>
  <small v-if="errorMessage" :class="['form-error', props.class]">
    {{ errorMessage }}
  </small>
</template>

<style scoped>
.form-error {
  font-size: 12px;
  color: var(--red);
  margin-top: 6px;
  display: block;
}
</style>
```

**Styling:**
- Uses Technical Blueprint CSS class: `form-error`
- Font size: 12px (explicit)
- Color: #f85149 (via `var(--red)`)
- Margin top: 6px (explicit)
- Display: block (ensures margin-top works correctly)

## Key Differences

### Color Values
- **Before**: Tailwind `red-500` = #ef4444
- **After**: Technical Blueprint `--red` = #f85149
- **Visual Impact**: Slightly brighter, more vibrant red matching GitHub's error color

### Spacing
- **Before**: `mt-1` = 4px
- **After**: 6px
- **Visual Impact**: Slightly more breathing room between input and error message

### Font Size
- **Before**: `text-sm` = 12px (via Tailwind v4 custom config)
- **After**: 12px (explicit)
- **Visual Impact**: No change, but removes dependency on Tailwind config

## Implementation Steps

### 1. Update Component File
- **File**: `/var/www/resources/app/js/components/common/forms/FormError.vue`
- **Changes**:
  - Remove `errorClasses` computed property
  - Update template to use `form-error` class
  - Add scoped styles with `.form-error` definition
  - Maintain `class` prop for custom overrides

### 2. Verify CSS Variables
- **File**: `/var/www/resources/app/css/app.css`
- **Verification**: Confirm `--red: #f85149` exists in `:root` (line 192)
- **Status**: Already defined, no changes needed

### 3. Test Visual Regression
- Verify error messages appear correctly in all forms
- Check color matches design spec (#f85149)
- Verify spacing (6px margin-top)
- Test custom class prop still works

## Files Using This Component

The FormError component is imported and used in **12 component files**:

### Form Components (1)
1. `/var/www/resources/app/js/components/common/forms/ImageUpload.vue`

### Driver Management (1)
2. `/var/www/resources/app/js/components/driver/modals/DriverFormDialog.vue`

### League Components (3)
3. `/var/www/resources/app/js/components/league/modals/LeagueWizardDrawer.vue`
4. `/var/www/resources/app/js/components/league/partials/PlatformMultiSelect.vue`
5. `/var/www/resources/app/js/components/league/partials/SocialMediaFields.vue`

### Competition Components (1)
6. `/var/www/resources/app/js/components/competition/CompetitionFormDrawer.vue`

### Season Components (4)
7. `/var/www/resources/app/js/components/season/modals/SeasonFormDrawer.vue`
8. `/var/www/resources/app/js/components/season/modals/SeasonDriverFormDialog.vue`
9. `/var/www/resources/app/js/components/season/divisions/DivisionFormModal.vue`
10. `/var/www/resources/app/js/components/season/teams/TeamFormModal.vue`

### Round Components (2)
11. `/var/www/resources/app/js/components/round/modals/RoundFormDrawer.vue`
12. `/var/www/resources/app/js/components/round/modals/RaceFormDrawer.vue`

### Usage Pattern
All usages follow the same pattern:
```vue
<FormError :error="errors.fieldName" />
```

Some components may pass custom classes:
```vue
<FormError :error="errors.fieldName" class="custom-class" />
```

## Testing Considerations

### Visual Testing
1. **Color Accuracy**
   - Verify error text color is #f85149 (not Tailwind's #ef4444)
   - Test in both light and dark contexts (component is dark-themed)

2. **Spacing**
   - Verify 6px margin-top from input to error message
   - Test in various form layouts (drawers, modals, inline forms)

3. **Typography**
   - Verify 12px font size renders correctly
   - Test with various error message lengths
   - Verify text wraps properly for long messages

### Functional Testing
1. **Error Display**
   - Test with single string errors
   - Test with array of errors (should display first)
   - Test with undefined/null (should not render)

2. **Custom Classes**
   - Verify custom class prop still works
   - Test combining `form-error` with custom classes
   - Ensure custom classes don't break base styling

3. **Form Integration**
   - Test in LeagueWizardDrawer (complex multi-step form)
   - Test in ImageUpload (file upload context)
   - Test in all 12 component files listed above

### Unit Testing
1. **Component Props**
   ```typescript
   it('displays single error message', () => {
     const wrapper = mount(FormError, {
       props: { error: 'This field is required' }
     });
     expect(wrapper.text()).toBe('This field is required');
     expect(wrapper.find('.form-error').exists()).toBe(true);
   });

   it('displays first error from array', () => {
     const wrapper = mount(FormError, {
       props: { error: ['Error 1', 'Error 2'] }
     });
     expect(wrapper.text()).toBe('Error 1');
   });

   it('does not render when no error', () => {
     const wrapper = mount(FormError, {
       props: { error: undefined }
     });
     expect(wrapper.find('.form-error').exists()).toBe(false);
   });

   it('applies custom classes', () => {
     const wrapper = mount(FormError, {
       props: { error: 'Error', class: 'custom-class' }
     });
     expect(wrapper.classes()).toContain('form-error');
     expect(wrapper.classes()).toContain('custom-class');
   });
   ```

2. **Styling Tests**
   ```typescript
   it('has correct CSS class', () => {
     const wrapper = mount(FormError, {
       props: { error: 'Error message' }
     });
     expect(wrapper.find('.form-error').exists()).toBe(true);
   });
   ```

### Browser Testing
- Test in Chrome, Firefox, Safari
- Verify color rendering consistency
- Test at different zoom levels

### Accessibility Testing
1. **Screen Readers**
   - Verify `<small>` element is read correctly
   - Test with ARIA labels from parent form fields

2. **Color Contrast**
   - Verify #f85149 on dark backgrounds meets WCAG AA standards
   - Test against `--bg-dark`, `--bg-panel`, `--bg-card`

3. **Keyboard Navigation**
   - Error should be announced when field is focused
   - Error should be associated with form control

## Rollback Plan
If issues are discovered:
1. Revert to previous version using git
2. Original file uses Tailwind utilities (no CSS variables)
3. No breaking changes to consuming components (API stays the same)

## Notes
- This component is used extensively (12 files), so thorough testing is critical
- The custom `class` prop must remain functional for flexibility
- Consider creating a Vitest test file if one doesn't exist
- The change is purely presentational - no logic changes required
- Color change is subtle but brings consistency with Technical Blueprint

## Related Components
- `FormLabel.vue` - Form label styling (may need similar migration)
- `FormInputGroup.vue` - Groups form fields with labels/errors
- `FormOptionalText.vue` - Optional field helper text

## Design System Alignment
This migration aligns FormError with the Technical Blueprint design system:
- Uses CSS custom properties instead of Tailwind utilities
- Matches GitHub-inspired error color (#f85149)
- Follows established spacing patterns (6px)
- Maintains semantic `<small>` element for accessibility
- Scoped styles prevent global CSS pollution
