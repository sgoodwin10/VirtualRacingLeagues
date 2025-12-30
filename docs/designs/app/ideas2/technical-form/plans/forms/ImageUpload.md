# ImageUpload Component - Technical Blueprint Migration Plan

## Overview

This document outlines the plan to migrate the `ImageUpload.vue` component from the current light theme design to the Technical Blueprint dark theme design system.

**Component Location**: `/var/www/resources/app/js/components/common/forms/ImageUpload.vue`

**Design System Reference**: `/var/www/resources/app/css/app.css` (Technical Blueprint CSS variables)

## Summary of Changes

The ImageUpload component currently uses light theme Tailwind classes (gray-200, gray-500) and light shadows. This migration will update all styling to use Technical Blueprint CSS variables for:

1. Border colors (gray-200 → --border)
2. Text colors (gray-500 → --text-secondary/--text-muted)
3. Shadow styling to match dark theme
4. Preview container styling
5. Optional text styling

**Note**: The sub-components (`FormLabel`, `FormError`, `FormHelper`) are being updated separately and their changes are not included in this plan.

## Current State Analysis

### Component Structure
- Uses PrimeVue `FileUpload` and `Image` components
- Has three rendering states:
  1. Existing image preview (with change/remove buttons)
  2. File upload interface (no image selected)
  3. New file preview (after selection)
- Includes validation for file type, size, and dimensions
- Supports customizable preview sizes (small/medium/large)

### Current Styling Issues
1. **Border Colors**: Uses `border-gray-200` (light theme)
2. **Text Colors**: Uses `text-gray-500` (light theme)
3. **Shadow Styling**: Uses `shadow-md` and `shadow-lg` (needs dark theme adjustment)
4. **Preview Container**: Light theme borders that don't match dark background
5. **Optional Text**: Light gray color that has poor contrast in dark theme

## Detailed Before/After Comparison

### 1. Preview Container Borders (Line 63)

**Before**:
```typescript
return `${sizeMap[props.previewSize]} rounded-lg shadow-md border border-gray-200`;
```

**After**:
```typescript
return `${sizeMap[props.previewSize]} rounded-lg shadow-md border border-[var(--border)]`;
```

**Rationale**: `border-gray-200` (#e5e7eb) is too light for dark backgrounds. `var(--border)` (#30363d) provides proper contrast.

---

### 2. Optional Text Styling (Line 191)

**Before**:
```html
<span v-if="!required" class="text-xs text-gray-500">(optional)</span>
```

**After**:
```html
<span v-if="!required" class="text-xs text-[var(--text-muted)]">(optional)</span>
```

**Rationale**: `text-gray-500` (#6b7280) doesn't match Technical Blueprint. `var(--text-muted)` (#6e7681) is the designated muted text color.

---

### 3. Helper Text Styling (Line 233)

**Before**:
```html
<p v-if="helperText" class="text-xs text-gray-500 mt-1">{{ helperText }}</p>
```

**After**:
```html
<p v-if="helperText" class="text-xs text-[var(--text-muted)] mt-1">{{ helperText }}</p>
```

**Rationale**: Consistent with other muted text elements. Uses Technical Blueprint muted text color.

---

### 4. Upload Container Border (Line 646, 660, 675 - in parent components)

**Current Usage in Parent Components**:
```html
<!-- LeagueWizardDrawer.vue -->
<div class="lg:col-span-1 rounded-md border border-gray-200 content-center p-2">
  <ImageUpload ... />
</div>

<!-- CompetitionFormDrawer.vue -->
<div class="rounded-md border border-gray-200 content-center p-2">
  <ImageUpload ... />
</div>
```

**Recommendation for Parent Components**:
These wrapper divs should also be updated to use `border-[var(--border)]` for consistency. However, these changes are outside the scope of this component migration and should be tracked separately.

**Impact**: The component itself doesn't control these wrapper borders, so no changes needed in ImageUpload.vue for this.

---

### 5. Shadow Styling Analysis

**Current Usage**:
- Line 63: `shadow-md` on preview images
- Line 205, 248: `shadow-lg` on remove buttons

**Decision**: **NO CHANGE NEEDED**

**Rationale**:
- Tailwind v4 shadow utilities work well in dark themes
- The shadows provide depth and are already appropriately styled
- The Technical Blueprint design system doesn't override shadow utilities
- Custom shadows are defined in app.css but standard shadows are sufficient here

---

## Implementation Steps

### Step 1: Update Preview Container Borders (Line 63)
```typescript
// In previewClasses computed property
const previewClasses = computed(() => {
  const sizeMap = {
    small: 'max-w-[150px] max-h-[150px]',
    medium: 'max-w-[300px] max-h-[200px]',
    large: 'max-w-[400px] max-h-[300px]',
  };
  // Change: border-gray-200 → border-[var(--border)]
  return `${sizeMap[props.previewSize]} rounded-lg shadow-md border border-[var(--border)]`;
});
```

### Step 2: Update Optional Text Color (Line 191)
```html
<!-- Change: text-gray-500 → text-[var(--text-muted)] -->
<span v-if="!required" class="text-xs text-[var(--text-muted)]">(optional)</span>
```

### Step 3: Update Helper Text Color (Line 233)
```html
<!-- Change: text-gray-500 → text-[var(--text-muted)] -->
<p v-if="helperText" class="text-xs text-[var(--text-muted)] mt-1">{{ helperText }}</p>
```

### Step 4: Verify No Other Changes Needed
- Review shadow usage (NO CHANGE)
- Review spacing/layout (NO CHANGE)
- Review PrimeVue component integration (NO CHANGE)

---

## Files Affected

### Primary File
- `/var/www/resources/app/js/components/common/forms/ImageUpload.vue`

### Parent Components Using ImageUpload (5 components)
These files use ImageUpload and may need wrapper border updates (separate task):

1. `/var/www/resources/app/js/components/league/modals/LeagueWizardDrawer.vue`
   - Line 647: Logo upload wrapper
   - Line 661: Banner upload wrapper
   - Line 676: Header image upload wrapper

2. `/var/www/resources/app/js/components/competition/CompetitionFormDrawer.vue`
   - Line 428: Logo upload wrapper

3. `/var/www/resources/app/js/components/season/modals/SeasonFormDrawer.vue`
   - Logo upload wrapper (exact line TBD)

4. `/var/www/resources/app/js/components/season/divisions/DivisionFormModal.vue`
   - Logo upload wrapper (exact line TBD)

5. `/var/www/resources/app/js/components/season/teams/TeamFormModal.vue`
   - Logo upload wrapper (exact line TBD)

### Test Files to Update (5 test files)
1. `/var/www/resources/app/js/components/common/forms/__tests__/ImageUpload.test.ts`
2. `/var/www/resources/app/js/components/league/modals/__tests__/LeagueWizardDrawer.test.ts` (if exists)
3. `/var/www/resources/app/js/components/season/modals/__tests__/SeasonFormDrawer-TiebreakerRules.test.ts`
4. `/var/www/resources/app/js/components/season/modals/__tests__/SeasonFormDrawer-TeamSettings.test.ts`
5. `/var/www/resources/app/js/components/season/divisions/__tests__/DivisionFormModal.test.ts`
6. `/var/www/resources/app/js/components/season/teams/__tests__/TeamFormModal.test.ts`

---

## Testing Considerations

### Unit Tests
1. **Component Rendering Tests**
   - Verify component renders with new CSS classes
   - Test all three rendering states (existing, upload, preview)
   - Verify optional text renders with correct color
   - Verify helper text renders with correct color

2. **Visual Regression Tests**
   - Preview container has correct border color
   - Text colors match design system
   - Shadows render appropriately in dark theme

3. **Accessibility Tests**
   - Verify color contrast meets WCAG AA standards
   - Test with screen readers
   - Verify keyboard navigation still works

### Integration Tests
1. **Parent Component Integration**
   - Test in LeagueWizardDrawer context
   - Test in CompetitionFormDrawer context
   - Test in SeasonFormDrawer context
   - Verify image upload/remove flow works

2. **File Upload Validation**
   - Test file type validation
   - Test file size validation
   - Test dimension validation
   - Test error message display (ensure error colors work in dark theme)

### Manual Testing Checklist
- [ ] Preview images have visible borders in dark theme
- [ ] Optional text is readable and properly styled
- [ ] Helper text is readable and properly styled
- [ ] Existing image preview works (with border)
- [ ] New file preview works (with border)
- [ ] Upload interface is visible and styled correctly
- [ ] Remove buttons are visible and functional
- [ ] Error messages display correctly in dark theme
- [ ] Component works in all parent contexts

---

## CSS Variables Reference

### Used in This Migration
```css
/* Border Colors */
--border: #30363d;           /* Used for preview container borders */

/* Text Colors */
--text-muted: #6e7681;       /* Used for optional and helper text */
```

### Available But Not Used
```css
/* Background Colors */
--bg-dark: #0d1117;
--bg-panel: #161b22;
--bg-card: #1c2128;
--bg-elevated: #21262d;
--bg-highlight: #272d36;

/* Text Colors */
--text-primary: #e6edf3;
--text-secondary: #8b949e;

/* Semantic Colors */
--cyan: #58a6ff;
--green: #7ee787;
--red: #f85149;
```

---

## Dependencies

### Must Be Updated First
None - this component can be updated independently.

### Sub-Components (Separate Migration)
- `FormLabel.vue` - Separate migration plan
- `FormError.vue` - Separate migration plan
- `FormHelper.vue` - Separate migration plan

### Should Be Updated After (Recommended)
- Parent component wrapper borders (5 components listed above)

---

## Risks and Considerations

### Low Risk
- **Breaking Changes**: None - only CSS class changes
- **Functionality Impact**: None - no behavioral changes
- **TypeScript Impact**: None - no type changes
- **Props/Emits Impact**: None - interface unchanged

### Accessibility Concerns
- **Color Contrast**: New colors must meet WCAG AA standards
  - `--text-muted` (#6e7681) on `--bg-card` (#1c2128): **Verify contrast ratio**
  - `--border` (#30363d) on `--bg-card` (#1c2128): **Verify visibility**

### Browser Compatibility
- CSS variables are supported in all modern browsers
- Tailwind v4 arbitrary values (`text-[var(--text-muted)]`) are fully supported
- No polyfills needed

---

## Rollout Plan

### Phase 1: Component Update
1. Update ImageUpload.vue with new CSS classes
2. Run unit tests and fix any failures
3. Perform manual testing in isolation

### Phase 2: Integration Testing
1. Test in all 5 parent components
2. Verify visual consistency across contexts
3. Test file upload/validation flow

### Phase 3: Parent Component Updates (Optional)
1. Update wrapper borders in parent components
2. Test integration again
3. Verify visual consistency

### Phase 4: Documentation
1. Update component documentation (if exists)
2. Add design system notes
3. Document CSS variable usage

---

## Success Criteria

- [ ] All CSS classes updated to use Technical Blueprint variables
- [ ] Component renders correctly in dark theme
- [ ] Text is readable (meets WCAG AA contrast standards)
- [ ] Borders are visible and appropriately styled
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing confirms visual consistency
- [ ] No regression in file upload functionality
- [ ] Accessibility maintained (keyboard nav, screen readers)
- [ ] Works correctly in all 5 parent components

---

## Estimated Effort

- **Component Update**: 15 minutes
- **Unit Test Updates**: 15 minutes
- **Integration Testing**: 30 minutes
- **Manual Testing**: 15 minutes
- **Total**: ~1.5 hours

---

## Notes

### PrimeVue Component Styling
The PrimeVue `FileUpload` and `Image` components are styled globally in `app.css`. These global styles already use Technical Blueprint variables, so no component-specific changes are needed.

### Wrapper Border Pattern
A common pattern in parent components is to wrap ImageUpload in a bordered container:
```html
<div class="rounded-md border border-gray-200 content-center p-2">
  <ImageUpload ... />
</div>
```

This wrapper pattern should be updated separately in each parent component to use `border-[var(--border)]`.

### Design System Consistency
After this migration, ImageUpload will be consistent with:
- FormLabel (using --text-secondary for labels)
- FormError (using --red for errors)
- FormHelper (using --text-muted for helper text)
- Button components (using Technical Blueprint colors)

---

## Related Documents

- [Technical Blueprint Design System](/var/www/docs/designs/app/ideas2/technical-form/README.md)
- [FormLabel Migration Plan](/var/www/docs/designs/app/ideas2/technical-form/plans/forms/FormLabel.md)
- [FormError Migration Plan](/var/www/docs/designs/app/ideas2/technical-form/plans/forms/FormError.md)
- [FormHelper Migration Plan](/var/www/docs/designs/app/ideas2/technical-form/plans/forms/FormHelper.md)

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-27 | Claude | Initial plan created |
