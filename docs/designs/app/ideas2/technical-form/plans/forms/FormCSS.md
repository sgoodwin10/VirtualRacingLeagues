# Form CSS Implementation Plan

**Date:** 2025-12-27
**Design Reference:** `/var/www/docs/designs/app/ideas2/technical-form/forms.html`
**Current Stylesheet:** `/var/www/resources/app/css/app.css`

---

## 1. Analysis of Current Form CSS in app.css

### What We Already Have

The current `app.css` contains:

#### Existing CSS Variables
- All color variables match forms.html design (cyan, green, orange, red, etc.)
- Typography variables: `--font-mono`, `--font-sans`
- Border radius: `--radius: 6px`
- Background colors: `--bg-dark`, `--bg-panel`, `--bg-card`, `--bg-elevated`
- Semantic colors and dim variants: `--cyan-dim`, `--red-dim`, etc.

#### Existing Typography Utilities
- `.text-form-label` - 11px/500/0.5px tracking (MATCHES forms.html `.form-label`)
- `.text-body` - 14px/400/Inter (for help text)
- `.text-body-small` - 13px/400/Inter (alternative)

#### Existing PrimeVue Input Overrides (Lines 656-676)
```css
.p-inputtext,
.p-inputnumber-input,
.p-textarea {
  background-color: var(--bg-elevated);
  border-color: var(--border);
  color: var(--text-primary);
}

.p-inputtext:focus,
.p-inputnumber-input:focus,
.p-textarea:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 0 0.2rem var(--cyan-dim);
}
```

**NOTE:** Current implementation uses `--bg-elevated` (#21262d) for inputs.
**Design uses:** `--bg-dark` (#0d1117) for stronger contrast against card backgrounds.

### What We DON'T Have Yet

#### Missing Native Form Element Styles
- `.form-group` - form field wrapper with margin
- `.form-label` - explicit class for labels
- `.form-input` - native input styling
- `.form-select` - select dropdown with custom arrow
- `.form-textarea` - textarea styling
- `.form-checkbox` - checkbox wrapper with label
- `.form-row` - two-column grid layout for forms
- `.form-help` - help text styling
- `.form-error` - error message styling
- Input state classes: `.error`, `.success`

#### Missing Toggle Switch Component
- `.toggle-switch` - custom toggle switch container
- `.toggle-knob` - toggle switch knob
- `.toggle-switch.active` - active state

#### Missing Tab Component
- `.tabs` - tab container
- `.tab` - individual tab button
- `.tab.active` - active tab state

#### Missing Utility Classes
- No utility for disabled state styling
- No form validation state utilities

---

## 2. New CSS Classes/Utilities Needed

### Priority 1: Core Form Elements (Required for all forms)

#### Form Structure
```css
/* Form field wrapper - provides consistent spacing */
.form-group {
  margin-bottom: 18px;
}

/* Two-column form layout */
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
```

#### Native Form Labels (for non-PrimeVue usage)
```css
.form-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
```

**NOTE:** This duplicates `.text-form-label` but provides explicit class for label elements.
**Decision:** Keep both - `.text-form-label` is utility, `.form-label` is component class.

#### Native Text Inputs (for non-PrimeVue usage)
```css
.form-input {
  width: 100%;
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-dark);  /* KEY DIFFERENCE from PrimeVue */
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.15s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-dim);
}

.form-input::placeholder {
  color: var(--text-muted);
}
```

#### Native Select Dropdowns (for non-PrimeVue usage)
```css
.form-select {
  width: 100%;
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,...");  /* Chevron down icon */
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.form-select:focus {
  outline: none;
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-dim);
}
```

#### Native Textarea (for non-PrimeVue usage)
```css
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-dim);
}
```

#### Validation States
```css
/* Error state for inputs */
.form-input.error {
  border-color: var(--red);
}

.form-input.error:focus {
  box-shadow: 0 0 0 3px var(--red-dim);
}

/* Success state for inputs */
.form-input.success {
  border-color: var(--green);
}

/* Error message text */
.form-error {
  font-size: 12px;
  color: var(--red);
  margin-top: 6px;
}

/* Help text */
.form-help {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}
```

#### Checkbox Component
```css
.form-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.form-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--cyan);
}

.form-checkbox span {
  font-size: 13px;
  color: var(--text-secondary);
}
```

### Priority 2: Custom Components

#### Toggle Switch
```css
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-elevated);
  border-radius: 12px;
  border: 2px solid var(--border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-switch:hover {
  border-color: var(--cyan);
}

.toggle-switch .toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toggle-switch.active {
  background: var(--cyan);
  border-color: var(--cyan);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(20px);
  background: var(--bg-dark);
}
```

#### Form Section Tabs
```css
.tabs {
  display: flex;
  gap: 2px;
  background: var(--bg-panel);
  padding: 4px;
  border-radius: var(--radius);
  margin-bottom: 20px;
}

.tab {
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab:hover {
  color: var(--text-secondary);
}

.tab.active {
  background: var(--bg-card);
  color: var(--text-primary);
}
```

---

## 3. File Organization Strategy

### Recommendation: Create Separate `forms.css` File

**Reasoning:**
1. Form styles are substantial (200+ lines when complete)
2. Logical separation from buttons, navigation, etc.
3. Easier maintenance and discovery
4. Follows existing pattern (already have `buttons.css`)

### File Structure
```
resources/app/css/
├── app.css                 # Main entry, imports, theme variables
├── components/
│   ├── buttons.css         # Existing - button components
│   └── forms.css           # NEW - form components
└── ...
```

### Import Statement to Add to app.css
```css
@import './components/forms.css';
```

**Location in app.css:** Line 9, after buttons.css import

### Alternative: Add to app.css Directly

If we prefer to keep everything in one file:
- Add new form styles after the Typography Utilities section (after line 564)
- Create a new comment section: `/* Form Components & Utilities */`
- Total addition: ~200 lines to app.css

**Current app.css size:** 822 lines
**With forms added:** ~1022 lines (still manageable)

**Recommendation:** Use separate `forms.css` file for better organization as we scale.

---

## 4. PrimeVue Component Overrides Needed

### Issue: Background Color Mismatch

**Current PrimeVue inputs use:**
```css
background-color: var(--bg-elevated);  /* #21262d - lighter */
```

**Design specifies:**
```css
background: var(--bg-dark);  /* #0d1117 - darker */
```

**Impact:** Forms.html design uses darker input backgrounds for stronger contrast against card backgrounds (`--bg-card: #1c2128`). Current implementation has less contrast.

### Required Changes to PrimeVue Overrides

#### Option A: Update Existing Overrides (Lines 656-676)
```css
.p-inputtext,
.p-inputnumber-input,
.p-textarea {
  background-color: var(--bg-dark);  /* CHANGED from --bg-elevated */
  border-color: var(--border);
  color: var(--text-primary);
  padding: 10px 12px;  /* ADD - match native inputs */
  font-size: 13px;      /* ADD - match native inputs */
}

.p-inputtext::placeholder,
.p-inputnumber-input::placeholder,
.p-textarea::placeholder {
  color: var(--text-muted);
}

.p-inputtext:focus,
.p-inputnumber-input:focus,
.p-textarea:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-dim);  /* CHANGED from 0.2rem to 3px for consistency */
}
```

#### PrimeVue Select/Dropdown Override
```css
.p-select,
.p-dropdown {
  background-color: var(--bg-dark);
  border-color: var(--border);
}

.p-select:focus,
.p-dropdown:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-dim);
}

.p-select-panel,
.p-dropdown-panel {
  background-color: var(--bg-elevated);
  border-color: var(--border);
}

.p-select-option:hover,
.p-dropdown-option:hover {
  background-color: var(--bg-highlight);
  color: var(--text-primary);
}
```

#### PrimeVue Checkbox Override
```css
.p-checkbox {
  width: 16px;
  height: 16px;
}

.p-checkbox .p-checkbox-box {
  background-color: var(--bg-dark);
  border-color: var(--border);
}

.p-checkbox .p-checkbox-box:hover {
  border-color: var(--cyan);
}

.p-checkbox.p-checked .p-checkbox-box {
  background-color: var(--cyan);
  border-color: var(--cyan);
}

.p-checkbox-label {
  font-size: 13px;
  color: var(--text-secondary);
}
```

#### PrimeVue InputSwitch (Toggle) Override
```css
.p-inputswitch {
  width: 44px;
  height: 24px;
}

.p-inputswitch .p-inputswitch-slider {
  background: var(--bg-elevated);
  border: 2px solid var(--border);
}

.p-inputswitch:hover .p-inputswitch-slider {
  border-color: var(--cyan);
}

.p-inputswitch.p-checked .p-inputswitch-slider {
  background: var(--cyan);
  border-color: var(--cyan);
}

.p-inputswitch .p-inputswitch-slider:before {
  background: var(--text-muted);
  width: 16px;
  height: 16px;
}

.p-inputswitch.p-checked .p-inputswitch-slider:before {
  background: var(--bg-dark);
  transform: translateX(20px);
}
```

#### PrimeVue Error State Overrides
```css
/* PrimeVue inputs with invalid state */
.p-inputtext.p-invalid,
.p-inputnumber-input.p-invalid,
.p-textarea.p-invalid,
.p-select.p-invalid,
.p-dropdown.p-invalid {
  border-color: var(--red);
}

.p-inputtext.p-invalid:focus,
.p-inputnumber-input.p-invalid:focus,
.p-textarea.p-invalid:focus,
.p-select.p-invalid:focus,
.p-dropdown.p-invalid:focus {
  box-shadow: 0 0 0 3px var(--red-dim);
}

/* Success state (not in PrimeVue by default, custom class) */
.p-inputtext.p-valid,
.p-inputnumber-input.p-valid,
.p-textarea.p-valid {
  border-color: var(--green);
}
```

#### PrimeVue Form Field Error Messages
```css
.p-error {
  font-size: 12px;
  color: var(--red);
  margin-top: 6px;
}

/* Small helper text under inputs */
.p-component + small,
.p-inputtext + small,
.p-inputnumber + small,
.p-textarea + small {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
  display: block;
}
```

### PrimeVue vs Native: When to Use What?

| Use PrimeVue | Use Native HTML |
|--------------|-----------------|
| Complex dropdowns (multi-select, search) | Simple text inputs |
| Date/time pickers (Calendar) | Basic textareas |
| Advanced validation UI | Simple checkboxes |
| InputSwitch (better than toggle) | Radio buttons |
| AutoComplete components | Number inputs |
| Password with strength meter | Hidden inputs |

**Guideline:** Use PrimeVue for complex interactions, native for simple form fields.

---

## 5. Implementation Steps

### Phase 1: Create Form CSS File (1 hour)

**Step 1.1:** Create `/var/www/resources/app/css/components/forms.css`

**Step 1.2:** Add file header and structure:
```css
/* ============================================
   Form Components - Technical Blueprint
   ============================================ */

/* Form Structure & Layout */
/* Form Labels */
/* Text Inputs */
/* Select Dropdowns */
/* Textareas */
/* Checkboxes */
/* Validation States */
/* Custom Components - Toggle Switch */
/* Custom Components - Tabs */
```

**Step 1.3:** Copy and adapt form styles from forms.html:
- `.form-group` - field wrapper
- `.form-label` - label styling
- `.form-input` - text input
- `.form-select` - select dropdown
- `.form-textarea` - textarea
- `.form-checkbox` - checkbox wrapper
- `.form-row` - grid layout
- `.form-help` - help text
- `.form-error` - error message
- `.error`, `.success` - state classes
- `.toggle-switch` - toggle component
- `.tabs`, `.tab` - tab component

**Step 1.4:** Add import to `app.css` line 9:
```css
@import './components/buttons.css';
@import './components/forms.css';  /* NEW */
```

### Phase 2: Update PrimeVue Overrides (1 hour)

**Step 2.1:** Update existing input overrides (lines 656-676):
- Change `background-color: var(--bg-elevated)` to `var(--bg-dark)`
- Update focus box-shadow to use `3px` instead of `0.2rem`
- Add padding and font-size to match native inputs

**Step 2.2:** Add new PrimeVue component overrides after line 676:
- `.p-select`, `.p-dropdown` - select components
- `.p-checkbox` - checkbox styling
- `.p-inputswitch` - toggle switch
- `.p-invalid` states for validation
- `.p-error` for error messages

**Step 2.3:** Add form-specific utilities to app.css:
- Disabled state styling (if needed)
- Form validation state utilities

### Phase 3: Testing & Verification (2 hours)

**Step 3.1:** Create test view: `/var/www/resources/app/js/views/test/FormStylesTest.vue`
```vue
<template>
  <div class="p-4">
    <h1 class="text-page-title mb-4">//FORM STYLES TEST</h1>

    <!-- Native HTML Forms Section -->
    <section class="mb-8">
      <h2 class="text-section-header mb-4">Native HTML Forms</h2>
      <!-- Test all native form components -->
    </section>

    <!-- PrimeVue Forms Section -->
    <section>
      <h2 class="text-section-header mb-4">PrimeVue Components</h2>
      <!-- Test all PrimeVue form components -->
    </section>
  </div>
</template>
```

**Step 3.2:** Test checklist:
- [ ] Native text inputs render with `--bg-dark` background
- [ ] Native selects show custom chevron icon
- [ ] Native textareas resize vertically
- [ ] Native checkboxes use cyan accent color
- [ ] Toggle switch animates smoothly
- [ ] Tabs switch between active/inactive states
- [ ] Error states show red border + red message
- [ ] Success states show green border
- [ ] Help text displays below inputs
- [ ] Form rows create proper two-column layout
- [ ] PrimeVue InputText matches native styling
- [ ] PrimeVue Dropdown matches native select
- [ ] PrimeVue Textarea matches native textarea
- [ ] PrimeVue Checkbox styled correctly
- [ ] PrimeVue InputSwitch matches toggle design
- [ ] PrimeVue invalid state shows error styling
- [ ] Focus states show cyan glow (3px)
- [ ] All components work on dark card backgrounds
- [ ] Typography matches design (11px labels, 13px inputs)

**Step 3.3:** Cross-browser testing:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

**Step 3.4:** Accessibility testing:
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader labels work
- [ ] Error messages announced

### Phase 4: Documentation (1 hour)

**Step 4.1:** Update component library docs

**Step 4.2:** Create form usage guide:
- When to use native vs PrimeVue
- Validation pattern examples
- Accessibility best practices
- Common form layouts

**Step 4.3:** Add code examples to docs

### Phase 5: Integration with Existing Components (2 hours)

**Step 5.1:** Audit existing forms in codebase:
```bash
# Find all form components
grep -r "InputText\|Dropdown\|Textarea\|Checkbox" resources/app/js/components/
```

**Step 5.2:** Update existing forms to use new styles:
- Review each form component
- Apply new PrimeVue overrides
- Add error/help text where needed
- Ensure accessibility

**Step 5.3:** Test updated components:
- CompetitionFormDrawer
- SeasonFormDrawer
- DriverFormDialog
- All other form dialogs/drawers

---

## 6. Potential Issues & Solutions

### Issue 1: PrimeVue Component Specificity

**Problem:** PrimeVue's internal CSS might override our custom styles.

**Solution:** Use `!important` sparingly, or increase specificity:
```css
/* Higher specificity without !important */
.p-component.p-inputtext {
  background-color: var(--bg-dark);
}
```

### Issue 2: Toggle Switch vs InputSwitch

**Problem:** We have custom `.toggle-switch` and PrimeVue's `InputSwitch`.

**Solution:**
- Use `.toggle-switch` for non-interactive UI displays
- Use `<InputSwitch>` for actual form controls
- Keep both styled consistently

### Issue 3: Focus Glow Inconsistency

**Problem:** Design uses `3px` shadow, PrimeVue default uses `0.2rem` (3.2px at base font).

**Solution:** Standardize all focus states to `3px`:
```css
box-shadow: 0 0 0 3px var(--cyan-dim);
```

### Issue 4: Background Contrast

**Problem:** `--bg-dark` inputs on `--bg-card` backgrounds might lack contrast for borders.

**Solution:** Current `--border: #30363d` provides sufficient contrast. If issues arise:
```css
.form-input {
  border: 1px solid var(--border);
  /* Add subtle inner shadow for depth */
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}
```

### Issue 5: Disabled State Styling

**Problem:** Design doesn't explicitly show disabled states.

**Solution:** Create disabled state that maintains design consistency:
```css
.form-input:disabled,
.p-inputtext:disabled {
  background-color: var(--bg-elevated);
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}
```

---

## 7. Migration Strategy for Existing Forms

### Step 1: Identify All Form Components
```bash
# Find all components using forms
find resources/app/js/components -name "*.vue" -exec grep -l "InputText\|Dropdown\|Textarea" {} \;
```

### Step 2: Categorize by Complexity
- **Simple forms** (1-3 fields): CompetitionDeleteDialog
- **Medium forms** (4-8 fields): DriverFormDialog
- **Complex forms** (9+ fields, multi-step): LeagueWizardDrawer, SeasonFormDrawer

### Step 3: Migration Order (Low Risk to High Risk)
1. Test components first (verify styles work)
2. Simple dialogs/modals
3. Medium complexity forms
4. Complex wizards/drawers

### Step 4: Testing Each Migration
- [ ] Visual regression (compare before/after screenshots)
- [ ] Functional testing (form submission works)
- [ ] Validation testing (error states display)
- [ ] Accessibility testing (keyboard, screen readers)

---

## 8. Performance Considerations

### CSS File Size Impact
- **Current app.css:** ~822 lines
- **New forms.css:** ~200 lines
- **Updated PrimeVue overrides:** ~150 lines
- **Total increase:** ~350 lines (minimal performance impact)

### Optimization Strategies
1. **Use CSS variables** - already implemented, allows theming
2. **Avoid deep nesting** - keep selectors flat (max 3 levels)
3. **Group selectors** - combine similar styles
4. **Minimize specificity** - avoid unnecessary `!important`

### Build Process
- Vite will handle CSS bundling and minification
- No additional build config needed
- PostCSS already configured for Tailwind

---

## 9. Accessibility Checklist

### Form Labels
- [ ] All inputs have associated labels (explicit `for` attribute or wrapping)
- [ ] Labels use semantic HTML (`<label>` element)
- [ ] Labels visible and descriptive

### Keyboard Navigation
- [ ] Tab order is logical
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (cyan outline)
- [ ] Enter/Space triggers buttons/checkboxes

### Screen Reader Support
- [ ] Error messages have `role="alert"` or `aria-live="polite"`
- [ ] Required fields indicated with `aria-required="true"`
- [ ] Invalid fields have `aria-invalid="true"`
- [ ] Help text associated with `aria-describedby`

### Color Contrast
- [ ] Error text (red) meets WCAG AA (4.5:1)
- [ ] Help text (muted) meets WCAG AA
- [ ] Input text (primary) meets WCAG AAA (7:1)
- [ ] Focus indicators visible to all users

### Form Validation
- [ ] Error messages descriptive and actionable
- [ ] Errors announced to screen readers
- [ ] Success states indicated (not just color)
- [ ] Required fields clearly marked

---

## 10. Timeline & Resources

### Estimated Total Time: 7 hours

| Phase | Time | Priority |
|-------|------|----------|
| Phase 1: Create forms.css | 1h | High |
| Phase 2: Update PrimeVue overrides | 1h | High |
| Phase 3: Testing & verification | 2h | High |
| Phase 4: Documentation | 1h | Medium |
| Phase 5: Integration | 2h | Medium |

### Resource Requirements
- 1 Frontend Developer
- Access to design system (forms.html)
- Testing environments (Chrome, Firefox, Safari)
- Screen reader for accessibility testing

### Dependencies
- None (forms.css is standalone)
- No breaking changes to existing code
- Compatible with current Tailwind v4 setup

---

## 11. Rollout Plan

### Phase A: Non-Breaking Addition (Safe)
1. Add `forms.css` file
2. Update PrimeVue overrides
3. Test in isolated test view
4. Deploy to staging
5. Monitor for issues

### Phase B: Gradual Migration (Controlled)
1. Update 1 simple form component
2. Test thoroughly
3. Deploy to production
4. Monitor user feedback
5. Repeat for next component

### Phase C: Full Adoption (Complete)
1. Migrate remaining form components
2. Remove old inconsistent styles
3. Update documentation
4. Train team on new patterns

---

## 12. Success Criteria

### Visual Consistency
- [ ] All forms match Technical Blueprint design
- [ ] Consistent spacing, colors, typography
- [ ] Error/success states uniform across components

### Functionality
- [ ] No regression in form submission
- [ ] Validation works as expected
- [ ] All interactions smooth and responsive

### Developer Experience
- [ ] Clear documentation
- [ ] Easy to apply styles (just add classes)
- [ ] PrimeVue components work out of the box

### User Experience
- [ ] Improved visual hierarchy
- [ ] Clear error messaging
- [ ] Accessible to all users
- [ ] Fast and responsive interactions

---

## 13. Next Steps After Implementation

### 1. Expand Form Component Library
- File upload components
- Multi-select with tags
- Date range picker
- Color picker
- Rich text editor integration

### 2. Advanced Validation Patterns
- Real-time validation
- Async validation (API checks)
- Cross-field validation
- Conditional required fields

### 3. Form Layout Utilities
- `.form-grid` - complex grid layouts
- `.form-inline` - inline form fields
- `.form-compact` - tighter spacing for dense UIs
- `.form-wizard` - multi-step form layout

### 4. Form State Management
- Composable for form state (`useForm`)
- Validation composable (`useFormValidation`)
- Dirty/pristine state tracking
- Auto-save functionality

---

## Conclusion

This implementation will provide a complete, consistent form system matching the Technical Blueprint design. The separation into `forms.css` keeps code organized, while comprehensive PrimeVue overrides ensure all form components look and behave consistently.

**Recommendation:** Proceed with separate `forms.css` file approach for better maintainability and scalability.

**Risk Level:** Low - non-breaking changes, additive only
**Impact:** High - unified form UX across entire application
**Effort:** Medium - 7 hours total implementation time
