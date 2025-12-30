# Form Components Migration Plan - Technical Blueprint Design System

**Date:** 2025-12-27
**Design Reference:** `/var/www/docs/designs/app/ideas2/technical-form/forms.html`
**Target Directory:** `/var/www/resources/app/js/components/common/forms/`

---

## Overview

This directory contains detailed migration plans for updating all form components to use the Technical Blueprint design system. The forms.html design specifies a GitHub-inspired dark theme with:

- **Typography**: IBM Plex Mono for labels, Inter for inputs
- **Colors**: Dark backgrounds (#0d1117, #1c2128), muted text (#6e7681, #8b949e), cyan accents (#58a6ff)
- **Validation**: Red (#f85149) for errors, Green (#7ee787) for success, Orange (#f0883e) for warnings
- **Sizing**: 11px labels, 13px inputs, 12px helper text

---

## Component Plans

| Component | Plan File | Status | Priority | Est. Effort |
|-----------|-----------|--------|----------|-------------|
| FormLabel | [FormLabel.md](./FormLabel.md) | Ready | High | 2.5 hours |
| FormError | [FormError.md](./FormError.md) | Ready | High | 1.5 hours |
| FormHelper | [FormHelper.md](./FormHelper.md) | Ready | High | 2 hours |
| FormInputGroup | [FormInputGroup.md](./FormInputGroup.md) | Ready | High | 10-14 days |
| FormCharacterCount | [FormCharacterCount.md](./FormCharacterCount.md) | Ready | Medium | 1.5 hours |
| FormOptionalText | [FormOptionalText.md](./FormOptionalText.md) | Ready | Medium | 2 hours |
| ImageUpload | [ImageUpload.md](./ImageUpload.md) | Ready | Medium | 1.5 hours |
| Form CSS | [FormCSS.md](./FormCSS.md) | Ready | High | 7 hours |

---

## Summary of Changes

### Components

| Component | Key Changes |
|-----------|-------------|
| **FormLabel** | `text-sm text-gray-700` → `.text-form-label` (11px, mono font, --text-secondary) |
| **FormError** | `text-red-500` → `var(--red)` (#f85149), add scoped CSS |
| **FormHelper** | `text-gray-500` → `var(--text-muted)` (#6e7681), add 6px margin |
| **FormInputGroup** | Add `layout` prop for horizontal/vertical modes, `.form-group` and `.form-row` classes |
| **FormCharacterCount** | Use CSS variables for states: --text-muted, --orange, --red |
| **FormOptionalText** | Use --text-muted for text, --text-secondary for "Optional:" prefix |
| **ImageUpload** | `border-gray-200` → `var(--border)`, `text-gray-500` → `var(--text-muted)` |

### CSS Additions

| Addition | Description |
|----------|-------------|
| **forms.css** | New CSS file with native form element classes |
| **PrimeVue overrides** | Update input backgrounds from --bg-elevated to --bg-dark |
| **Toggle Switch** | Custom .toggle-switch component |
| **Form Tabs** | Custom .tabs/.tab components |

---

## Component Usage Analysis

| Component | Files Using | Instances |
|-----------|-------------|-----------|
| FormLabel | 16 files | 50+ |
| FormError | 12 files | Multiple |
| FormHelper | 4 files | 5+ |
| FormInputGroup | 15 files | Multiple |
| FormCharacterCount | 1 file | 1 |
| FormOptionalText | 7 files | 26+ |
| ImageUpload | 5 files | Multiple |

---

## Implementation Order

### Phase 1: Foundation (CSS Variables & Utilities)
1. **FormCSS.md** - Create forms.css with base classes
2. **Update PrimeVue overrides** in app.css

### Phase 2: Core Components (Most Used)
3. **FormLabel.md** - 16 files depend on this
4. **FormError.md** - 12 files depend on this
5. **FormInputGroup.md** - 15 files depend on this

### Phase 3: Supporting Components
6. **FormHelper.md** - 4 files depend on this
7. **FormOptionalText.md** - 7 files depend on this
8. **FormCharacterCount.md** - 1 file depends on this

### Phase 4: Complex Components
9. **ImageUpload.md** - 5 files depend on this

---

## Design System Alignment

### Colors (Already in app.css)

```css
:root {
  /* Text Colors */
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;

  /* Border Colors */
  --border: #30363d;

  /* Semantic Colors */
  --cyan: #58a6ff;
  --green: #7ee787;
  --orange: #f0883e;
  --red: #f85149;
}
```

### Typography Utilities (Already in app.css)

```css
.text-form-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}
```

---

## Testing Strategy

### Unit Tests
- Each component has tests specified in its plan
- Use Vitest with @vue/test-utils
- Test class applications, props, states

### Visual Testing
- Manual testing in all consuming components
- Verify colors match design system
- Check responsive behavior

### Accessibility
- WCAG AA color contrast
- Keyboard navigation
- Screen reader support

---

## Risk Assessment

### Low Risk
- CSS-only changes don't affect functionality
- Backward compatible (same props interfaces)
- Non-breaking additions

### Medium Risk
- FormInputGroup adds new props (but maintains backward compatibility)
- Visual changes may need design review

### Mitigation
- Phased rollout
- Visual regression testing
- Rollback plans in each component plan

---

## Total Estimated Effort

| Category | Effort |
|----------|--------|
| Component updates | ~12 hours |
| Form CSS additions | 7 hours |
| FormInputGroup (full migration) | 10-14 days |
| Testing & QA | 5-8 hours |
| **Total (excluding FormInputGroup full migration)** | ~25 hours |

---

## Quick Reference

### Common Patterns After Migration

**Form Label:**
```vue
<FormLabel for="email" text="Email Address" required />
<!-- Renders with: IBM Plex Mono, 11px, #8b949e, 0.5px letter-spacing -->
```

**Form Input Group (Vertical):**
```vue
<FormInputGroup>
  <FormLabel for="name" text="Name" />
  <InputText id="name" v-model="name" />
  <FormError :error="errors.name" />
</FormInputGroup>
```

**Form Input Group (Horizontal):**
```vue
<FormInputGroup layout="horizontal" :columns="2">
  <div>
    <FormLabel for="first" text="First Name" />
    <InputText id="first" v-model="firstName" />
  </div>
  <div>
    <FormLabel for="last" text="Last Name" />
    <InputText id="last" v-model="lastName" />
  </div>
</FormInputGroup>
```

**Error Display:**
```vue
<FormError :error="errors.field" />
<!-- Renders with: 12px, #f85149, 6px margin-top -->
```

**Helper Text:**
```vue
<FormHelper text="We'll never share your email" />
<!-- Renders with: 12px, #6e7681, 6px margin-top -->
```

---

## Files Created

```
docs/designs/app/ideas2/technical-form/plans/forms/
├── README.md                  # This overview document
├── FormLabel.md              # FormLabel migration plan
├── FormError.md              # FormError migration plan
├── FormHelper.md             # FormHelper migration plan
├── FormInputGroup.md         # FormInputGroup migration plan
├── FormCharacterCount.md     # FormCharacterCount migration plan
├── FormOptionalText.md       # FormOptionalText migration plan
├── ImageUpload.md            # ImageUpload migration plan
└── FormCSS.md                # Form CSS additions plan
```

---

## Next Steps

1. Review all plan documents
2. Get design approval on color/sizing choices
3. Begin Phase 1 implementation (FormCSS)
4. Proceed through phases in order
5. Run tests after each component update
6. Monitor for visual regressions

---

**Plan Status:** Complete
**Ready for Implementation:** Yes
**Requires Design Review:** Recommended but not blocking
