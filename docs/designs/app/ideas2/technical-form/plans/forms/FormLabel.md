# FormLabel Component Migration Plan

## Migration to Technical Blueprint Design System

**Component**: `resources/app/js/components/common/forms/FormLabel.vue`
**Date**: 2025-12-27
**Design System**: Technical Blueprint (IBM Plex Mono + Inter)

---

## 1. Summary of Changes

The FormLabel component will be updated to use the new Technical Blueprint design system, replacing generic Tailwind classes with the standardized `.text-form-label` utility class that's already defined in `app.css`.

### Key Changes:
- Replace hardcoded Tailwind classes with `.text-form-label` utility
- Update base styling from gray-700 to use design system colors (--text-secondary)
- Update font from default sans to IBM Plex Mono monospace
- Update font size from 14px (text-sm) to 11px
- Add 0.5px letter-spacing for technical aesthetic
- Maintain all existing functionality (required asterisk, custom classes, etc.)

### Design System Alignment:
- **Typography**: IBM Plex Mono (monospace) instead of Inter/default sans
- **Font Size**: 11px (0.6875rem) instead of 14px
- **Font Weight**: 500 (medium) - no change
- **Letter Spacing**: 0.5px (new addition)
- **Color**: `var(--text-secondary)` (#8b949e) instead of gray-700
- **Display**: block - no change
- **Margin**: 8px bottom (mb-2) - no change

---

## 2. Before/After Comparison

### Current Implementation

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  for?: string;
  required?: boolean;
  text: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  for: undefined,
  required: false,
  class: '',
});

const labelClasses = computed(() => {
  const baseClasses = 'block text-sm font-medium text-gray-700 mb-2';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <label :for="props.for" :class="labelClasses">
    {{ props.text }}
    <span v-if="props.required" class="text-red-500">*</span>
  </label>
</template>
```

**Current Computed Styles**:
- `block` - Display as block element
- `text-sm` - Font size 12px (0.75rem)
- `font-medium` - Font weight 500
- `text-gray-700` - Gray color (not design system aligned)
- `mb-2` - Margin bottom 8px

### New Implementation

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  for?: string;
  required?: boolean;
  text: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  for: undefined,
  required: false,
  class: '',
});

const labelClasses = computed(() => {
  const baseClasses = 'block text-form-label mb-2';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <label :for="props.for" :class="labelClasses">
    {{ props.text }}
    <span v-if="props.required" class="text-red-500">*</span>
  </label>
</template>
```

**New Computed Styles** (via `.text-form-label`):
- `block` - Display as block element (unchanged)
- `text-form-label` - Applies:
  - `font-family: var(--font-mono)` - IBM Plex Mono
  - `font-size: 0.6875rem` - 11px
  - `font-weight: 500` - Medium (unchanged)
  - `letter-spacing: 0.5px` - Technical aesthetic
  - `color: var(--text-secondary)` - #8b949e
- `mb-2` - Margin bottom 8px (unchanged)

### Visual Changes:
1. **Font Family**: Sans-serif → IBM Plex Mono (monospace)
2. **Font Size**: 12px → 11px (slightly smaller, more compact)
3. **Letter Spacing**: 0px → 0.5px (slight spread for readability)
4. **Color**: Gray-700 → --text-secondary (#8b949e, lighter gray)

---

## 3. Implementation Steps

### Step 1: Update the Component
**File**: `/var/www/resources/app/js/components/common/forms/FormLabel.vue`

**Action**: Replace the `labelClasses` computed property

**Change**:
```typescript
// OLD
const labelClasses = computed(() => {
  const baseClasses = 'block text-sm font-medium text-gray-700 mb-2';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});

// NEW
const labelClasses = computed(() => {
  const baseClasses = 'block text-form-label mb-2';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
```

**Verification**:
- The `.text-form-label` class is already defined in `/var/www/resources/app/css/app.css` (lines 496-502)
- No additional CSS changes needed

### Step 2: Create Component Tests
**File**: `/var/www/resources/app/js/components/common/forms/__tests__/FormLabel.test.ts` (new file)

**Action**: Create comprehensive test suite

**Test Coverage**:
1. Component renders correctly
2. Text prop displays correctly
3. Required asterisk shows when required=true
4. Required asterisk hidden when required=false
5. For attribute binds correctly
6. Custom classes are applied
7. Design system classes are present (text-form-label)

### Step 3: Visual Regression Testing
**Action**: Manual testing of all components using FormLabel

**Test in**:
1. League wizard form fields
2. Driver management dialogs
3. Round/Race form drawers
4. Competition forms
5. Season forms
6. Image upload component

### Step 4: Validate Typography Rendering
**Action**: Verify monospace font loads and renders correctly

**Checks**:
- IBM Plex Mono font loads (check Network tab)
- Letter spacing renders at 0.5px
- Font size is visually 11px
- Color matches --text-secondary (#8b949e)

### Step 5: Accessibility Verification
**Action**: Ensure accessibility is maintained

**Checks**:
- Label-input associations work (for attribute)
- Screen readers announce labels correctly
- Required fields announced correctly
- Contrast ratios meet WCAG AA standards (test with --text-secondary)

### Step 6: Run Quality Checks
**Action**: Execute all code quality tools

```bash
# TypeScript type checking
npm run type-check

# Run tests
npm run test:app

# Lint code
npm run lint:app

# Format code
npm run format:app
```

---

## 4. Files Using This Component

**Total Usage**: 16 files across the application

### Component Files (16 files):

1. **League Components** (4 files):
   - `/var/www/resources/app/js/components/league/modals/LeagueWizardDrawer.vue` (7 instances)
   - `/var/www/resources/app/js/components/league/partials/SocialMediaFields.vue` (6 instances)
   - `/var/www/resources/app/js/components/league/partials/PlatformMultiSelect.vue` (1 instance)
   - `/var/www/resources/app/js/components/league/partials/LeagueSocialMediaPanel.vue` (2 instances)

2. **Driver Components** (2 files):
   - `/var/www/resources/app/js/components/driver/modals/DriverFormDialog.vue` (10 instances)
   - `/var/www/resources/app/js/components/driver/modals/CSVImportDialog.vue` (1 instance)

3. **Round Components** (2 files):
   - `/var/www/resources/app/js/components/round/modals/RoundFormDrawer.vue` (12 instances)
   - `/var/www/resources/app/js/components/round/modals/RaceFormDrawer.vue` (multiple instances)

4. **Season Components** (5 files):
   - `/var/www/resources/app/js/components/season/modals/SeasonFormDrawer.vue` (multiple instances)
   - `/var/www/resources/app/js/components/season/modals/SeasonDeleteDialog.vue` (used)
   - `/var/www/resources/app/js/components/season/modals/SeasonDriverFormDialog.vue` (used)
   - `/var/www/resources/app/js/components/season/divisions/DivisionFormModal.vue` (used)
   - `/var/www/resources/app/js/components/season/teams/TeamFormModal.vue` (used)

5. **Competition Components** (2 files):
   - `/var/www/resources/app/js/components/competition/CompetitionFormDrawer.vue` (multiple instances)
   - `/var/www/resources/app/js/components/competition/CompetitionDeleteDialog.vue` (used)

6. **Common/Form Components** (1 file):
   - `/var/www/resources/app/js/components/common/forms/ImageUpload.vue` (1 instance)

### Usage Patterns Identified:

**Common Usage Pattern 1 - Basic Label**:
```vue
<FormLabel for="field-id" text="Field Label" />
```

**Common Usage Pattern 2 - Required Field**:
```vue
<FormLabel for="field-id" text="Field Label" :required="true" />
```

**Common Usage Pattern 3 - No Input Association** (display only):
```vue
<FormLabel text="Display Text" />
```

---

## 5. Testing Considerations

### Unit Testing

**Create**: `/var/www/resources/app/js/components/common/forms/__tests__/FormLabel.test.ts`

**Test Suite**:

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormLabel from '../FormLabel.vue';

describe('FormLabel', () => {
  describe('Rendering', () => {
    it('renders the label text', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' }
      });
      expect(wrapper.text()).toContain('Test Label');
    });

    it('renders as a label element', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' }
      });
      expect(wrapper.element.tagName).toBe('LABEL');
    });
  });

  describe('Design System Integration', () => {
    it('applies text-form-label utility class', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' }
      });
      expect(wrapper.classes()).toContain('text-form-label');
    });

    it('applies block display class', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' }
      });
      expect(wrapper.classes()).toContain('block');
    });

    it('applies bottom margin class', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' }
      });
      expect(wrapper.classes()).toContain('mb-2');
    });
  });

  describe('Required Field Indicator', () => {
    it('shows asterisk when required is true', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', required: true }
      });
      const asterisk = wrapper.find('span');
      expect(asterisk.exists()).toBe(true);
      expect(asterisk.text()).toBe('*');
      expect(asterisk.classes()).toContain('text-red-500');
    });

    it('hides asterisk when required is false', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', required: false }
      });
      expect(wrapper.find('span').exists()).toBe(false);
    });

    it('hides asterisk by default', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' }
      });
      expect(wrapper.find('span').exists()).toBe(false);
    });
  });

  describe('Input Association', () => {
    it('binds for attribute when provided', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', for: 'test-input' }
      });
      expect(wrapper.attributes('for')).toBe('test-input');
    });

    it('does not have for attribute when not provided', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label' }
      });
      expect(wrapper.attributes('for')).toBeUndefined();
    });
  });

  describe('Custom Classes', () => {
    it('applies custom classes', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', class: 'custom-class' }
      });
      expect(wrapper.classes()).toContain('custom-class');
    });

    it('preserves base classes when custom classes applied', () => {
      const wrapper = mount(FormLabel, {
        props: { text: 'Test Label', class: 'custom-class' }
      });
      expect(wrapper.classes()).toContain('text-form-label');
      expect(wrapper.classes()).toContain('block');
      expect(wrapper.classes()).toContain('mb-2');
      expect(wrapper.classes()).toContain('custom-class');
    });
  });

  describe('Props Validation', () => {
    it('accepts all valid props', () => {
      const wrapper = mount(FormLabel, {
        props: {
          for: 'test-id',
          required: true,
          text: 'Test Label',
          class: 'custom-class'
        }
      });
      expect(wrapper.exists()).toBe(true);
    });
  });
});
```

**Expected Test Results**: All tests pass (15 tests total)

### Visual Regression Testing

**Manual Testing Checklist**:

- [ ] League Wizard - All 7 labels render correctly
- [ ] Driver Form Dialog - All 10 labels render correctly
- [ ] Round Form Drawer - All 12 labels render correctly
- [ ] Race Form Drawer - All labels render correctly
- [ ] Season Form Drawer - All labels render correctly
- [ ] Competition Form - All labels render correctly
- [ ] Image Upload - Label renders correctly
- [ ] Social Media Fields - All 6 labels render correctly

**Visual Checks**:
- [ ] Font is monospace (IBM Plex Mono)
- [ ] Font size appears smaller (11px vs 12px)
- [ ] Letter spacing is slightly wider
- [ ] Color is slightly lighter gray
- [ ] Required asterisks still visible and red
- [ ] No layout shifts or breaks

### Integration Testing

**Test Scenarios**:

1. **Form Submission Flow**:
   - Labels associate correctly with inputs
   - Required field validation works
   - Error states display correctly with labels

2. **Responsive Behavior**:
   - Labels wrap correctly on small screens
   - Spacing remains consistent
   - Required asterisks stay inline

3. **Accessibility**:
   - Screen reader announces labels
   - Keyboard navigation works
   - Focus indicators visible

### Browser Testing

**Test Browsers**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Device Testing**:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

### Performance Testing

**Metrics to Monitor**:
- Font loading time (IBM Plex Mono)
- Rendering performance (no regression)
- Bundle size (should be unchanged)

---

## 6. Risk Assessment

### Low Risk:
- **CSS Utility Class Already Exists**: The `.text-form-label` class is already defined and tested in app.css
- **No Breaking Changes**: Component interface remains identical (same props, same events)
- **Backward Compatible**: Custom classes still work via props
- **Non-Critical Component**: Doesn't affect business logic or data

### Potential Issues:

1. **Font Loading Delay**:
   - **Risk**: IBM Plex Mono might not load immediately
   - **Mitigation**: Font is preloaded in app.blade.php, fallback fonts defined

2. **Visual Density Change**:
   - **Risk**: Smaller font (11px) might affect UX
   - **Mitigation**: Design system tested and approved, consistent with other labels

3. **Color Contrast**:
   - **Risk**: --text-secondary might have lower contrast than gray-700
   - **Mitigation**: Test with accessibility tools, design system should meet WCAG AA

4. **Layout Shift**:
   - **Risk**: Font change might cause minor layout shifts
   - **Mitigation**: Visual regression testing, margin remains same (mb-2)

---

## 7. Rollback Plan

If issues are discovered:

1. **Immediate Rollback**:
   ```typescript
   // Revert to original implementation
   const labelClasses = computed(() => {
     const baseClasses = 'block text-sm font-medium text-gray-700 mb-2';
     return props.class ? `${baseClasses} ${props.class}` : baseClasses;
   });
   ```

2. **Version Control**:
   - Git commit before changes
   - Git tag for easy revert
   - Document rollback in commit message

3. **Communication**:
   - Notify team of rollback
   - Document reasons for rollback
   - Plan remediation

---

## 8. Success Criteria

### Functional Success:
- ✅ All tests pass (unit, integration, e2e)
- ✅ TypeScript compiles without errors
- ✅ Linting passes
- ✅ All 16 components using FormLabel work correctly

### Visual Success:
- ✅ Labels use IBM Plex Mono font
- ✅ Font size is 11px
- ✅ Letter spacing is 0.5px
- ✅ Color is --text-secondary (#8b949e)
- ✅ No layout breaks or shifts

### Accessibility Success:
- ✅ WCAG AA contrast ratios met
- ✅ Screen readers announce labels correctly
- ✅ Keyboard navigation works
- ✅ Required fields announced

### Performance Success:
- ✅ No performance regression
- ✅ Font loads quickly
- ✅ Bundle size unchanged

---

## 9. Timeline Estimate

| Task | Estimated Time |
|------|---------------|
| Update component code | 5 minutes |
| Create unit tests | 30 minutes |
| Run quality checks | 10 minutes |
| Visual regression testing | 30 minutes |
| Accessibility testing | 20 minutes |
| Browser/device testing | 30 minutes |
| Documentation | 15 minutes |
| **Total** | **~2.5 hours** |

---

## 10. Follow-up Actions

After successful implementation:

1. **Monitor for Issues**:
   - Watch for user feedback
   - Monitor error logs
   - Check analytics for UX impact

2. **Documentation Updates**:
   - Update component documentation
   - Add to design system examples
   - Document in migration guide

3. **Team Communication**:
   - Notify team of changes
   - Share design system usage
   - Provide migration examples

4. **Future Improvements**:
   - Consider creating FormField wrapper component
   - Standardize error/helper text styling
   - Create form layout patterns

---

## Appendix A: CSS Utility Class Definition

**Source**: `/var/www/resources/app/css/app.css` (lines 496-502)

```css
/* Form Label - 11px/500/0.5px tracking */
.text-form-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}
```

**CSS Variables Used**:
```css
--font-mono: 'IBM Plex Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
--text-secondary: #8b949e;
```

---

## Appendix B: Example Usage

### Before Migration:
```vue
<FormLabel for="email" text="Email Address" required />
<!-- Renders with: text-sm (12px), font-medium (500), text-gray-700, sans-serif -->
```

### After Migration:
```vue
<FormLabel for="email" text="Email Address" required />
<!-- Renders with: 11px, font-weight 500, #8b949e, IBM Plex Mono, 0.5px letter-spacing -->
```

### Custom Class Example (still works):
```vue
<FormLabel for="email" text="Email Address" class="mb-4" required />
<!-- Custom margin overrides default mb-2, all other styles from .text-form-label apply -->
```

---

**Plan Status**: Ready for Implementation
**Requires Approval**: No (low risk, non-breaking change)
**Estimated Completion**: 2025-12-27
