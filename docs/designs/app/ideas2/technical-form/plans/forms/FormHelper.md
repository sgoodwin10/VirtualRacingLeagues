# FormHelper Component Migration Plan

## Overview

Migrate the `FormHelper.vue` component from Tailwind utility classes to the Technical Blueprint design system using CSS variables and standardized styling.

**Component Location**: `/var/www/resources/app/js/components/common/forms/FormHelper.vue`

---

## 1. Summary of Changes

### Current Implementation
- Uses Tailwind utility classes: `text-xs text-gray-500`
- Conditional class merging with user-provided classes
- Renders as `<small>` element
- Hardcoded color values via Tailwind

### New Implementation (Technical Blueprint)
- Uses CSS variable `--text-muted` (#6e7681)
- Fixed font size: 12px
- Top margin: 6px
- Scoped CSS class `.form-help`
- More consistent with design system
- Maintains custom class prop for flexibility

### Key Differences
1. **Color**: `text-gray-500` → `var(--text-muted)` (#6e7681)
2. **Font Size**: Tailwind `text-xs` (0.75rem/12px) → explicit 12px (same value, explicit)
3. **Spacing**: No margin → `margin-top: 6px`
4. **Approach**: Utility classes → CSS class with variables

---

## 2. Before/After Comparison

### Current Code

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  text?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: undefined,
  class: '',
});

const helperClasses = computed(() => {
  const baseClasses = 'text-xs text-gray-500';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <small v-if="props.text" :class="helperClasses">
    {{ props.text }}
  </small>
</template>
```

### New Code

```vue
<script setup lang="ts">
interface Props {
  text?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: undefined,
  class: '',
});
</script>

<template>
  <small v-if="props.text" :class="['form-help', props.class]">
    {{ props.text }}
  </small>
</template>

<style scoped>
.form-help {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}
</style>
```

### Changes Breakdown

1. **Removed** computed property `helperClasses` (no longer needed)
2. **Simplified** template class binding to array syntax
3. **Added** scoped `<style>` block with `.form-help` class
4. **Uses** CSS variable `--text-muted` for color
5. **Explicit** margin-top spacing (6px)

---

## 3. Implementation Steps

### Step 1: Update Component Template
- Replace `:class="helperClasses"` with `:class="['form-help', props.class]`
- Remove the computed import from Vue (no longer needed)

### Step 2: Remove Computed Property
- Delete the `helperClasses` computed property
- Simplify the script setup section

### Step 3: Add Scoped Styles
- Add `<style scoped>` section at the end of the file
- Define `.form-help` class with:
  - `font-size: 12px`
  - `color: var(--text-muted)`
  - `margin-top: 6px`

### Step 4: Verify CSS Variable Availability
- Ensure `--text-muted` is defined in `/var/www/resources/app/css/app.css`
- If not present, add to `:root` selector:
  ```css
  :root {
    --text-muted: #6e7681;
  }
  ```

### Step 5: Test Visual Consistency
- Test component in all usage contexts (see section 4 below)
- Verify spacing and color match design specifications
- Ensure custom class prop still works correctly

---

## 4. Files Using This Component

The FormHelper component is used in **4 files** across the app:

### 4.1 ImageUpload.vue
**Location**: `/var/www/resources/app/js/components/common/forms/ImageUpload.vue`

**Usage Context**:
- Line 234: Displays maximum file size information
  ```vue
  <FormHelper :text="`Maximum file size: ${(maxFileSize / 1000000).toFixed(1)}MB`" />
  ```

**Impact**:
- Will add 6px top margin above helper text
- Color will change to `#6e7681` (design system muted text)
- Verify spacing within file upload flow

### 4.2 PlatformMultiSelect.vue
**Location**: `/var/www/resources/app/js/components/league/partials/PlatformMultiSelect.vue`

**Usage Context**:
- Line 52: Provides guidance text for platform selection
  ```vue
  <FormHelper text="Select all platforms your league supports" />
  ```

**Impact**:
- Will add 6px top margin between MultiSelect and helper text
- Used within `FormInputGroup`, verify vertical spacing
- Ensure it doesn't conflict with FormError component

### 4.3 CSVImportDialog.vue
**Location**: `/var/www/resources/app/js/components/driver/modals/CSVImportDialog.vue`

**Usage Context**:
- Line 285: Instructions with custom class
  ```vue
  <FormHelper
    text="Paste your CSV data below. The CSV must include headers and at least the following columns:"
    class="text-blue-800"
  />
  ```
- Line 329: Standard helper text
  ```vue
  <FormHelper text="Paste your CSV data including the header row" />
  ```

**Impact**:
- First usage has custom color class `text-blue-800` (will override base color)
- Verify custom class still works correctly
- Ensure margin doesn't disrupt instruction box layout
- Second usage is standard - verify spacing below Textarea

### 4.4 DriverFormDialog.vue
**Location**: `/var/www/resources/app/js/components/driver/modals/DriverFormDialog.vue`

**Usage Context**:
- Line 385: Helper for driver number input
  ```vue
  <FormHelper text="Between 1 and 999" />
  ```
- Line 402: Helper for league notes textarea
  ```vue
  <FormHelper text="Notes specific to this league" />
  ```

**Impact**:
- Line 385: Used with InputNumber, verify spacing with FormError below
- Line 402: Used in flex container with FormCharacterCount
  ```vue
  <div class="flex justify-between items-center">
    <FormHelper text="Notes specific to this league" />
    <FormCharacterCount :current="formData.league_notes?.length || 0" :max="500" />
  </div>
  ```
  - Verify flex layout still works with `margin-top: 6px`
  - May need to remove margin in this specific context or adjust parent container

---

## 5. Testing Considerations

### 5.1 Unit Tests

**Test File**: `/var/www/resources/app/js/components/common/forms/__tests__/FormHelper.test.ts` (create if doesn't exist)

**Test Cases**:

1. **Rendering**
   - Should render when text prop is provided
   - Should not render when text prop is undefined/empty
   - Should render as `<small>` element

2. **Styling**
   - Should apply `.form-help` class
   - Should merge custom classes correctly
   - Should apply scoped styles (font-size, color, margin)

3. **Props**
   - Should display correct text content
   - Should handle optional text prop
   - Should apply custom class prop

**Example Test Suite**:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormHelper from '../FormHelper.vue';

describe('FormHelper', () => {
  it('renders helper text when text prop is provided', () => {
    const wrapper = mount(FormHelper, {
      props: { text: 'This is helper text' },
    });
    expect(wrapper.text()).toBe('This is helper text');
    expect(wrapper.find('small').exists()).toBe(true);
  });

  it('does not render when text prop is undefined', () => {
    const wrapper = mount(FormHelper);
    expect(wrapper.find('small').exists()).toBe(false);
  });

  it('applies form-help class', () => {
    const wrapper = mount(FormHelper, {
      props: { text: 'Helper' },
    });
    expect(wrapper.classes()).toContain('form-help');
  });

  it('merges custom classes correctly', () => {
    const wrapper = mount(FormHelper, {
      props: {
        text: 'Helper',
        class: 'text-blue-800 font-bold'
      },
    });
    expect(wrapper.classes()).toContain('form-help');
    expect(wrapper.classes()).toContain('text-blue-800');
    expect(wrapper.classes()).toContain('font-bold');
  });

  it('applies correct styles', () => {
    const wrapper = mount(FormHelper, {
      props: { text: 'Helper' },
    });
    const element = wrapper.find('small').element as HTMLElement;
    const styles = window.getComputedStyle(element);
    expect(styles.fontSize).toBe('12px');
    expect(styles.marginTop).toBe('6px');
  });
});
```

### 5.2 Visual Regression Testing

**Manual Testing Checklist**:

- [ ] Test in ImageUpload component (file size text)
- [ ] Test in PlatformMultiSelect (platform instruction)
- [ ] Test in CSVImportDialog (both usages, especially custom color)
- [ ] Test in DriverFormDialog (driver number and notes)
- [ ] Verify spacing above helper text (6px margin)
- [ ] Verify text color matches `--text-muted` (#6e7681)
- [ ] Verify custom class prop still works (CSVImportDialog blue text)
- [ ] Verify responsive behavior across screen sizes
- [ ] Test in different form layouts (grid, flex, stacked)

### 5.3 Integration Testing

**Test Scenarios**:

1. **FormInputGroup Context**
   - Verify helper text appears correctly below inputs
   - Check spacing with FormError component
   - Ensure no visual conflicts

2. **Flex Container Context (DriverFormDialog line 402)**
   - Test flex layout with FormCharacterCount
   - May need to add special handling for this case
   - Consider: Does `margin-top: 6px` affect flex alignment?

3. **Custom Color Override (CSVImportDialog)**
   - Verify `class="text-blue-800"` still applies correct color
   - Ensure color override works as expected
   - Test that base styles don't conflict

4. **Empty State**
   - Verify component doesn't render when text is undefined
   - Check that no extra spacing appears

### 5.4 Browser Compatibility

- [ ] Test CSS variable support (modern browsers)
- [ ] Verify scoped styles work correctly
- [ ] Test custom class merging in different browsers
- [ ] Check margin rendering consistency

### 5.5 Accessibility Testing

- [ ] Verify `<small>` element is semantically appropriate
- [ ] Check text contrast ratio with `#6e7681` on backgrounds
- [ ] Ensure helper text is associated with form inputs
- [ ] Test with screen readers

---

## 6. Migration Risks & Mitigation

### Risk 1: Margin Addition May Break Layouts
**Risk Level**: Medium

**Description**: Adding `margin-top: 6px` may cause spacing issues in tightly packed layouts or flex containers.

**Affected Areas**:
- DriverFormDialog line 402 (flex container with FormCharacterCount)
- Any custom layouts using FormHelper

**Mitigation**:
1. Test all usages visually before/after
2. If needed, add utility class option to disable margin:
   ```vue
   <FormHelper text="..." class="!mt-0" />
   ```
3. Document expected spacing behavior
4. Consider adding `no-margin` prop if issues persist

### Risk 2: Custom Class Override Behavior
**Risk Level**: Low

**Description**: Array class binding may behave differently than string concatenation.

**Affected Areas**:
- CSVImportDialog with `class="text-blue-800"`

**Mitigation**:
1. Test custom class applications thoroughly
2. Verify CSS specificity rules work as expected
3. Document that custom classes override base styles

### Risk 3: CSS Variable Not Defined
**Risk Level**: Low

**Description**: If `--text-muted` isn't defined in app.css, text will be invisible/broken.

**Affected Areas**:
- All usages

**Mitigation**:
1. Verify CSS variable exists in `/var/www/resources/app/css/app.css` BEFORE deployment
2. Add fallback color if needed: `color: var(--text-muted, #6e7681);`
3. Add CSS variable to design system documentation

### Risk 4: Visual Inconsistency During Rollout
**Risk Level**: Low

**Description**: If other form components (FormLabel, FormError) aren't migrated simultaneously, visual inconsistency may occur.

**Affected Areas**:
- All form components

**Mitigation**:
1. Coordinate migration with other form components
2. Follow design system migration order
3. Document migration status of related components

---

## 7. Rollout Plan

### Phase 1: Preparation
1. Verify `--text-muted` exists in app.css
2. Create component tests
3. Review all usage contexts
4. Take screenshots of current state

### Phase 2: Implementation
1. Update FormHelper.vue component
2. Run unit tests
3. Run type checking: `npm run type-check`
4. Run linting: `npm run lint:app`

### Phase 3: Testing
1. Manual visual testing in all 4 usage contexts
2. Run full test suite: `npm run test:app`
3. Cross-browser testing
4. Accessibility review

### Phase 4: Deployment
1. Commit changes
2. Update related documentation
3. Monitor for visual issues
4. Address any edge cases discovered

---

## 8. Related Components

These components should be migrated in a coordinated manner:

1. **FormLabel.vue** - Form field labels (uses similar design system)
2. **FormError.vue** - Error messages (uses `--red` color)
3. **FormInputGroup.vue** - Container for form fields
4. **FormCharacterCount.vue** - Character counter (often used with FormHelper)

**Recommended Migration Order**:
1. FormHelper (this component)
2. FormLabel
3. FormError
4. FormInputGroup
5. FormCharacterCount

---

## 9. Success Criteria

Migration is complete when:

- [ ] Component uses `.form-help` CSS class with design system variables
- [ ] All 4 usage contexts render correctly
- [ ] Custom class prop works as expected (CSVImportDialog blue text)
- [ ] Spacing is consistent (6px margin-top)
- [ ] Text color matches `--text-muted` (#6e7681)
- [ ] Unit tests pass 100%
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Visual regression testing complete
- [ ] Accessibility standards met
- [ ] Documentation updated

---

## 10. Rollback Plan

If issues are discovered after deployment:

1. **Immediate Rollback**:
   ```bash
   git revert <commit-hash>
   npm run build
   ```

2. **Partial Rollback** (if only specific usages are broken):
   - Add `!important` flags to override styles temporarily
   - Use custom classes to restore old behavior
   - Document as technical debt

3. **Debug Process**:
   - Identify which usage context is broken
   - Check browser console for CSS errors
   - Verify CSS variable is loaded
   - Check class specificity conflicts

---

## 11. Future Enhancements

After successful migration, consider:

1. **Variant Support**: Add variants like `info`, `warning`, `success`
2. **Icon Support**: Allow optional icons before text
3. **Slot Support**: Allow rich HTML content instead of plain text
4. **Accessibility**: Add ARIA attributes for better screen reader support
5. **Animation**: Subtle fade-in for dynamic helper text

---

## Appendix A: CSS Variable Reference

```css
/* From forms.html Technical Blueprint */
:root {
  --text-muted: #6e7681;
  --text-secondary: #8b949e;
  --text-primary: #e6edf3;
}
```

## Appendix B: Component API

**Props**:
- `text?: string` - Helper text to display
- `class?: string` - Additional CSS classes to apply

**Slots**: None

**Events**: None

**Example Usage**:
```vue
<!-- Basic usage -->
<FormHelper text="This is helper text" />

<!-- With custom class -->
<FormHelper text="Custom colored text" class="text-blue-800" />

<!-- Dynamic text -->
<FormHelper :text="`Maximum size: ${maxSize}MB`" />
```
