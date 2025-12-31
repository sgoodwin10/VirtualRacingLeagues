# FormCharacterCount Component - Technical Blueprint Migration Plan

## Overview

This document outlines the plan to migrate the `FormCharacterCount` component from hardcoded Tailwind color classes to the Technical Blueprint design system using CSS custom properties.

**Component Location**: `/var/www/resources/app/js/components/common/forms/FormCharacterCount.vue`

**Design System**: Technical Blueprint (ideas2)

---

## 1. Summary of Changes

### What's Changing
- Remove hardcoded Tailwind color utility classes (`text-gray-500`, `text-orange-600`, `text-red-600`)
- Replace with CSS custom properties from the Technical Blueprint design system
- Maintain all existing functionality and prop interface
- Update styling to use scoped CSS with design system variables
- Keep the same component API (no breaking changes)

### Why This Change
- **Consistency**: Align with the new Technical Blueprint design system being implemented across the app
- **Maintainability**: Centralize color definitions - changes to the design system automatically propagate
- **Theming**: Enable future theming capabilities (dark mode, custom themes) through CSS variables
- **Design System Compliance**: Match the established color scheme for form validation states

### Design System Color Mapping
| Current State | Old Class | New CSS Variable | Color Value |
|--------------|-----------|------------------|-------------|
| Default | `text-gray-500` | `var(--text-muted)` | #6e7681 |
| Warning (90%+) | `text-orange-600` | `var(--orange)` | #f0883e |
| Error (over limit) | `text-red-600` | `var(--red)` | #f85149 |

---

## 2. Before/After Comparison

### Before (Current Implementation)

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  current: number;
  max: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const countClasses = computed(() => {
  const baseClasses = 'text-sm text-gray-500';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});

const isNearLimit = computed(() => props.current > props.max * 0.9);
const isOverLimit = computed(() => props.current > props.max);

const displayClasses = computed(() => {
  if (isOverLimit.value) return `${countClasses.value} text-red-600 font-medium`;
  if (isNearLimit.value) return `${countClasses.value} text-orange-600`;
  return countClasses.value;
});
</script>

<template>
  <small :class="displayClasses"> {{ props.current }}/{{ props.max }} characters </small>
</template>
```

**Issues with Current Implementation:**
- Hardcoded Tailwind colors don't align with Technical Blueprint
- No scoped styling
- Font weight applied only on error state (inconsistent)
- Mixing utility classes with computed logic

### After (Proposed Implementation)

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  current: number;
  max: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const isNearLimit = computed(() => props.current > props.max * 0.9);
const isOverLimit = computed(() => props.current > props.max);

const stateClass = computed(() => {
  if (isOverLimit.value) return 'character-count--error';
  if (isNearLimit.value) return 'character-count--warning';
  return '';
});
</script>

<template>
  <small :class="['character-count', stateClass, props.class]">
    {{ props.current }}/{{ props.max }} characters
  </small>
</template>

<style scoped>
.character-count {
  font-size: 0.875rem; /* 14px - text-sm equivalent */
  line-height: 1.25rem; /* 20px */
  color: var(--text-muted);
}

.character-count--warning {
  color: var(--orange);
}

.character-count--error {
  color: var(--red);
  font-weight: 500; /* font-medium equivalent */
}
</style>
```

**Improvements:**
- Clean separation of concerns (logic vs styling)
- Uses CSS custom properties from design system
- Scoped CSS prevents style leakage
- More maintainable and readable
- Simplified computed logic
- Consistent with Technical Blueprint patterns

---

## 3. Implementation Steps

### Step 1: Update Template
- [ ] Replace `:class="displayClasses"` with `:class="['character-count', stateClass, props.class]"`
- [ ] Add base class `character-count` for scoped styling
- [ ] Simplify spacing in template

### Step 2: Update Script Logic
- [ ] Remove `countClasses` computed property (no longer needed)
- [ ] Rename `displayClasses` to `stateClass` for clarity
- [ ] Simplify `stateClass` to return only state modifiers ('character-count--error', 'character-count--warning', '')
- [ ] Remove hardcoded Tailwind classes from script

### Step 3: Add Scoped Styles
- [ ] Add `<style scoped>` section
- [ ] Define `.character-count` base styles (font-size, line-height, default color)
- [ ] Define `.character-count--warning` modifier (orange color)
- [ ] Define `.character-count--error` modifier (red color + font-weight)
- [ ] Use CSS custom properties: `var(--text-muted)`, `var(--orange)`, `var(--red)`

### Step 4: Verify CSS Variables
- [ ] Confirm CSS variables are defined in `/var/www/resources/app/css/app.css`
- [ ] Verify color values match Technical Blueprint specification
- [ ] Test variable fallbacks if needed

### Step 5: Testing
- [ ] Manual testing in DriverFormDialog component
- [ ] Test all three states: default, warning (90%+), error (over limit)
- [ ] Verify custom class prop still works
- [ ] Test responsive behavior
- [ ] Verify no visual regressions

### Step 6: Documentation
- [ ] Update component comments if needed
- [ ] Document CSS custom property dependencies
- [ ] Add to Technical Blueprint component documentation

---

## 4. Files That Use This Component

### Direct Usage
**File**: `/var/www/resources/app/js/components/driver/modals/DriverFormDialog.vue`

**Usage Context** (Line 403):
```vue
<div class="flex justify-between items-center">
  <FormHelper text="Notes specific to this league" />
  <FormCharacterCount :current="formData.league_notes?.length || 0" :max="500" />
</div>
```

**Usage Details:**
- Used in the "League-Specific Information" section
- Displays character count for `league_notes` textarea field
- Maximum character limit: 500
- Positioned alongside FormHelper component in a flex layout

### Import Statement (Line 18):
```typescript
import FormCharacterCount from '@app/components/common/forms/FormCharacterCount.vue';
```

### Test Coverage
**Search Results**: No test files found for FormCharacterCount
**Action Required**: Consider adding unit tests as part of this migration

---

## 5. Testing Considerations

### Unit Tests (Recommended - New)
Create: `/var/www/resources/app/js/components/common/forms/__tests__/FormCharacterCount.test.ts`

**Test Cases:**
```typescript
describe('FormCharacterCount', () => {
  describe('Visual States', () => {
    it('should render default state (under 90%)', () => {
      // Test: current=50, max=100
      // Verify: character-count class, no state modifier, correct text
    });

    it('should render warning state (90% or more)', () => {
      // Test: current=91, max=100
      // Verify: character-count--warning class applied
    });

    it('should render error state (over limit)', () => {
      // Test: current=101, max=100
      // Verify: character-count--error class applied
    });
  });

  describe('Props', () => {
    it('should display correct character count', () => {
      // Test: current=25, max=100
      // Verify: renders "25/100 characters"
    });

    it('should accept and apply custom class', () => {
      // Test: class="ml-2"
      // Verify: custom class is applied alongside base class
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero current value', () => {
      // Test: current=0, max=100
      // Verify: renders "0/100 characters", default state
    });

    it('should handle exact limit', () => {
      // Test: current=100, max=100
      // Verify: warning state (not error)
    });

    it('should calculate threshold correctly at boundary', () => {
      // Test: current=89, max=100 (89% - should be default)
      // Test: current=90, max=100 (90% - should be warning)
    });
  });

  describe('Accessibility', () => {
    it('should render as semantic <small> element', () => {
      // Verify: component uses <small> tag
    });

    it('should have readable text in all states', () => {
      // Verify: color contrast meets WCAG standards
      // Note: May need visual regression or manual check
    });
  });
});
```

### Integration Testing
**Location**: Test in DriverFormDialog component context

**Test Scenarios:**
1. **Normal typing flow**: Type into league_notes textarea and verify character count updates
2. **Warning threshold**: Type until 90% (450/500 characters) and verify orange color
3. **Over limit**: Type beyond 500 characters and verify red color + bold weight
4. **Clear field**: Clear textarea and verify count returns to "0/500 characters"
5. **Custom class propagation**: Verify any custom classes from parent are preserved

### Visual Regression Testing
**Manual Checks:**
- [ ] Default state color matches `var(--text-muted)` (#6e7681)
- [ ] Warning state color matches `var(--orange)` (#f0883e)
- [ ] Error state color matches `var(--red)` (#f85149)
- [ ] Font size is consistent with design system (14px / 0.875rem)
- [ ] Line height provides adequate spacing (20px / 1.25rem)
- [ ] Font weight on error is visually medium weight (500)

**Screenshot Comparison:**
- Before: Current gray-500, orange-600, red-600
- After: Design system colors via CSS variables
- Compare side-by-side for any visual differences

### Browser Compatibility
- [ ] Test in Chrome (CSS variable support)
- [ ] Test in Firefox (CSS variable support)
- [ ] Test in Safari (CSS variable support)
- [ ] Test in Edge (CSS variable support)
- [ ] Verify graceful degradation if variables not supported (unlikely, but good practice)

### Accessibility Testing
- [ ] Screen reader announces character count correctly
- [ ] Color is not the only indicator of state (text shows count)
- [ ] Color contrast meets WCAG AA standards
  - Default: #6e7681 on white background (check ratio)
  - Warning: #f0883e on white background (check ratio)
  - Error: #f85149 on white background (check ratio)
- [ ] Text remains readable when zoomed to 200%

---

## 6. Potential Risks & Mitigations

### Risk 1: CSS Variables Not Defined
**Risk**: Component fails to display colors if CSS variables are missing
**Mitigation**:
- Verify variables exist in `/var/www/resources/app/css/app.css` before deployment
- Add fallback colors if needed: `color: var(--text-muted, #6e7681);`
- Include CSS variable check in pre-deployment checklist

### Risk 2: Visual Regression
**Risk**: New colors may differ slightly from current Tailwind colors
**Mitigation**:
- Compare before/after screenshots
- Verify design system colors are intentional changes
- Get design approval if colors differ significantly

### Risk 3: Custom Class Prop Interaction
**Risk**: Custom classes from parent may conflict with new scoped styles
**Mitigation**:
- Test with actual usage in DriverFormDialog
- Ensure custom classes are applied last in array: `['character-count', stateClass, props.class]`
- Document any known conflicts

### Risk 4: Lack of Test Coverage
**Risk**: No existing tests means regression could go unnoticed
**Mitigation**:
- Add comprehensive unit tests before making changes
- Include visual regression checks in manual testing
- Test in actual component context (DriverFormDialog)

---

## 7. Rollout Plan

### Phase 1: Preparation
1. Verify CSS variables exist in design system
2. Review current usage in DriverFormDialog
3. Create unit tests for component
4. Document current visual appearance (screenshots)

### Phase 2: Implementation
1. Update component code following implementation steps
2. Run unit tests (all passing)
3. Manual testing in DriverFormDialog
4. Visual comparison with screenshots

### Phase 3: Validation
1. Code review by team member
2. Design review (color accuracy)
3. Accessibility audit (WCAG compliance)
4. Cross-browser testing

### Phase 4: Deployment
1. Merge to main branch
2. Deploy to staging environment
3. Smoke test in staging
4. Deploy to production
5. Monitor for any reported issues

---

## 8. Success Criteria

- [ ] Component uses CSS custom properties instead of hardcoded Tailwind classes
- [ ] All three states (default, warning, error) render with correct colors
- [ ] Custom class prop continues to work as expected
- [ ] No visual regressions in DriverFormDialog
- [ ] Unit tests achieve >90% code coverage
- [ ] Accessibility standards maintained (WCAG AA)
- [ ] No console errors or warnings
- [ ] Documentation updated

---

## 9. Follow-Up Tasks

### Immediate
- [ ] Implement changes outlined in this plan
- [ ] Add unit tests
- [ ] Update component in DriverFormDialog

### Future Enhancements
- [ ] Consider adding `variant` prop for different sizing (small, medium, large)
- [ ] Add `aria-live` attribute for screen reader announcements when count changes
- [ ] Explore animation transitions between states
- [ ] Document component in Storybook (if applicable)
- [ ] Audit other form components for similar migrations

### Related Components to Migrate
Based on the pattern, these components should also be reviewed:
- FormLabel (already migrated - verify consistency)
- FormError (already migrated - verify consistency)
- FormHelper (already migrated - verify consistency)
- FormInputGroup (check if migration needed)

---

## 10. References

- **Technical Blueprint Documentation**: `/var/www/docs/designs/app/ideas2/technical-form/`
- **Design System Colors**: Technical Blueprint color scheme
- **Component Location**: `/var/www/resources/app/js/components/common/forms/FormCharacterCount.vue`
- **Usage Example**: `/var/www/resources/app/js/components/driver/modals/DriverFormDialog.vue:403`
- **CSS Variables Location**: `/var/www/resources/app/css/app.css`

---

## Appendix A: Code Snippets

### Proposed Full Implementation

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  current: number;
  max: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const isNearLimit = computed(() => props.current > props.max * 0.9);
const isOverLimit = computed(() => props.current > props.max);

const stateClass = computed(() => {
  if (isOverLimit.value) return 'character-count--error';
  if (isNearLimit.value) return 'character-count--warning';
  return '';
});
</script>

<template>
  <small :class="['character-count', stateClass, props.class]">
    {{ props.current }}/{{ props.max }} characters
  </small>
</template>

<style scoped>
.character-count {
  font-size: 0.875rem; /* 14px - text-sm equivalent */
  line-height: 1.25rem; /* 20px */
  color: var(--text-muted);
}

.character-count--warning {
  color: var(--orange);
}

.character-count--error {
  color: var(--red);
  font-weight: 500; /* font-medium equivalent */
}
</style>
```

### Required CSS Variables (Verify in app.css)

```css
:root {
  --text-muted: #6e7681;
  --orange: #f0883e;
  --red: #f85149;
}
```

---

**Document Version**: 1.0
**Created**: 2025-12-27
**Last Updated**: 2025-12-27
**Author**: Technical Blueprint Migration Team
**Status**: Ready for Implementation
