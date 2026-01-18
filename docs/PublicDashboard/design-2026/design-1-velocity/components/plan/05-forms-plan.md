# VRL Velocity Design System - FORMS Components Plan

**Component Category**: Forms & Input Controls
**Planned Location**: `resources/public/js/components/common/forms/`
**CSS Location**: `resources/public/css/app.css` (forms section)
**Status**: Planning Phase
**Last Updated**: 2026-01-18

---

## Overview

This document outlines the comprehensive plan for implementing the VRL Velocity Design System form components for the public site. These components will provide a cohesive, accessible, and Vue 3-native implementation of all form input types and layout patterns shown in the design system.

### Design Philosophy

- **Composable & Modular**: Each form element is a standalone component that can be composed together
- **Accessibility First**: ARIA labels, keyboard navigation, and screen reader support
- **TypeScript Native**: Full type safety with proper interfaces and generics
- **v-model Integration**: All inputs use Vue's two-way binding pattern
- **PrimeVue Compatible**: Designed to integrate seamlessly with PrimeVue when needed
- **Validation Ready**: Built-in error state handling and validation feedback
- **Consistent Styling**: Adheres to VRL Velocity design tokens and patterns

---

## Components Summary

| Component | Priority | Complexity | Dependencies |
|-----------|----------|------------|--------------|
| VrlFormGroup | High | Low | None |
| VrlFormLabel | High | Low | None |
| VrlFormHelper | High | Low | None |
| VrlFormError | High | Low | None |
| VrlInput | High | Medium | VrlFormLabel, VrlFormError |
| VrlTextarea | High | Medium | VrlFormLabel, VrlCharacterCount |
| VrlSelect | High | Medium | VrlFormLabel, VrlFormError |
| VrlCheckbox | Medium | Medium | None |
| VrlToggle | Medium | Medium | None |
| VrlCharacterCount | Medium | Low | None |
| VrlInputGroup | Medium | Low | None |

---

## Detailed Component Specifications

### 1. VrlFormGroup.vue

**Purpose**: Wrapper component that provides consistent spacing between form fields.

**File Path**: `resources/public/js/components/common/forms/VrlFormGroup.vue`

**TypeScript Interface**:
```typescript
interface Props {
  // No props - purely layout wrapper
  class?: string;
}
```

**Slots**:
- `default`: Form field content

**Styling**:
```css
.form-group {
  margin-bottom: 1.5rem; /* 24px */
}
```

**Usage Example**:
```vue
<VrlFormGroup>
  <VrlFormLabel for="email" required>Email Address</VrlFormLabel>
  <VrlInput id="email" v-model="email" type="email" />
</VrlFormGroup>
```

**Testing Requirements**:
- Renders default slot content
- Applies correct margin-bottom spacing
- Supports custom class prop

**Accessibility Notes**:
- No specific ARIA requirements (purely layout)
- Should not interfere with child component accessibility

---

### 2. VrlFormLabel.vue

**Purpose**: Consistent form label styling with optional required indicator.

**File Path**: `resources/public/js/components/common/forms/VrlFormLabel.vue`

**TypeScript Interface**:
```typescript
interface Props {
  for?: string;          // Input ID to associate with
  required?: boolean;    // Show red asterisk
  class?: string;        // Additional CSS classes
}
```

**Slots**:
- `default`: Label text content

**Styling**:
```css
.form-label {
  display: block;
  font-family: var(--font-display); /* Orbitron */
  font-size: 0.75rem;              /* 12px */
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;            /* 8px */
  color: var(--text-secondary);
}

.form-label .required {
  color: var(--red);
  margin-left: 0.25rem;
}
```

**Usage Example**:
```vue
<VrlFormLabel for="username" required>Username</VrlFormLabel>

<!-- Alternative slot usage -->
<VrlFormLabel for="bio">
  Character Biography <span class="text-muted">(Optional)</span>
</VrlFormLabel>
```

**Testing Requirements**:
- Renders slot content correctly
- Shows red asterisk when `required` is true
- Correctly associates with input via `for` prop
- Applies Orbitron font family
- Matches design system font size and spacing

**Accessibility Notes**:
- Must use semantic `<label>` element
- `for` attribute creates explicit association with input
- Required indicator is visual only (inputs should have `required` attribute)

**Reference Implementation**:
- Review `/var/www/resources/app/js/components/common/forms/FormLabel.vue` for existing pattern
- Public version should align with Velocity design specs (Orbitron font, specific sizing)

---

### 3. VrlFormHelper.vue

**Purpose**: Display helper text below form inputs to provide additional context.

**File Path**: `resources/public/js/components/common/forms/VrlFormHelper.vue`

**TypeScript Interface**:
```typescript
interface Props {
  class?: string;  // Additional CSS classes
}
```

**Slots**:
- `default`: Helper text content

**Styling**:
```css
.form-helper {
  font-size: 0.75rem;       /* 12px */
  color: var(--text-muted);
  margin-top: 0.5rem;        /* 8px */
  display: block;
}
```

**Usage Example**:
```vue
<VrlInput v-model="leagueName" />
<VrlFormHelper>This will be displayed publicly on your league page</VrlFormHelper>
```

**Testing Requirements**:
- Renders slot content
- Applies correct font size and color
- Positioned correctly with margin-top
- Supports custom classes

**Accessibility Notes**:
- Should use `<small>` or `<p>` with appropriate ARIA if associated with input
- Parent component should link via `aria-describedby`

**Reference Implementation**:
- Review `/var/www/resources/app/js/components/common/forms/FormHelper.vue`

---

### 4. VrlFormError.vue

**Purpose**: Display validation error messages below form inputs.

**File Path**: `resources/public/js/components/common/forms/VrlFormError.vue`

**TypeScript Interface**:
```typescript
interface Props {
  error?: string | string[];  // Error message(s)
  class?: string;             // Additional CSS classes
}
```

**Computed Properties**:
- `errorMessage`: Returns first error from array or single error string

**Styling**:
```css
.form-error {
  font-size: 0.75rem;    /* 12px */
  color: var(--red);
  margin-top: 0.5rem;     /* 8px */
  display: block;
}
```

**Usage Example**:
```vue
<VrlInput v-model="email" :error="emailError" />
<VrlFormError :error="emailError" />

<!-- With array of errors -->
<VrlFormError :error="['Email is required', 'Must be valid email']" />
```

**Testing Requirements**:
- Renders first error from array
- Renders single error string
- Shows nothing when error is undefined/null/empty
- Applies red color from design system
- Supports custom classes

**Accessibility Notes**:
- Should use `role="alert"` for dynamic error messages
- Parent input should reference via `aria-describedby`
- Consider `aria-live="polite"` for screen reader announcements

**Reference Implementation**:
- Review `/var/www/resources/app/js/components/common/forms/FormError.vue`

---

### 5. VrlInput.vue

**Purpose**: Primary text input component with full validation support.

**File Path**: `resources/public/js/components/common/forms/VrlInput.vue`

**TypeScript Interface**:
```typescript
interface Props {
  modelValue: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'number' | 'search';
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: string | string[];
  id?: string;
  name?: string;
  autocomplete?: string;
  required?: boolean;
  maxlength?: number;
  minlength?: number;
  pattern?: string;
  class?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'input', event: Event): void;
}
```

**Computed Properties**:
- `hasError`: Boolean indicating if error exists
- `inputClasses`: Dynamic classes including error state

**Styling**:
```css
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;           /* 12px 16px */
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius);     /* 6px */
  color: var(--text-primary);
  font-family: var(--font-body);    /* Inter */
  font-size: 0.9rem;                /* 14.4px */
  transition: var(--transition);    /* all 0.3s ease */
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-input:focus {
  outline: none;
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-dim);
}

.form-input.error {
  border-color: var(--red);
}

.form-input.error:focus {
  box-shadow: 0 0 0 3px var(--red-dim);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--bg-elevated);
}

.form-input:read-only {
  opacity: 0.7;
  cursor: default;
}
```

**Usage Example**:
```vue
<VrlFormGroup>
  <VrlFormLabel for="email" required>Email</VrlFormLabel>
  <VrlInput
    id="email"
    v-model="formData.email"
    type="email"
    placeholder="driver@racing.com"
    :error="errors.email"
    required
  />
  <VrlFormError :error="errors.email" />
</VrlFormGroup>
```

**Testing Requirements**:
- v-model updates correctly
- Emits all events (update:modelValue, blur, focus, input)
- Error state applies correct styling
- Disabled state prevents input
- Readonly state allows focus but not editing
- Placeholder text displays correctly
- All input types render appropriately
- Focus ring uses cyan color from design system
- Error focus ring uses red color

**Accessibility Notes**:
- Use semantic `<input>` element
- Support all native HTML5 validation attributes
- `aria-invalid="true"` when error exists
- `aria-describedby` should reference error and helper text IDs
- `aria-required` mirrors required prop
- Label association via `id` and `for`

**PrimeVue Integration**:
- Consider using PrimeVue's `InputText` as base
- Override styling to match Velocity design
- Alternative: Pure HTML input with custom styling

---

### 6. VrlTextarea.vue

**Purpose**: Multi-line text input with optional character count.

**File Path**: `resources/public/js/components/common/forms/VrlTextarea.vue`

**TypeScript Interface**:
```typescript
interface Props {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: string | string[];
  id?: string;
  name?: string;
  rows?: number;
  maxlength?: number;
  minlength?: number;
  required?: boolean;
  showCharacterCount?: boolean;
  class?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'input', event: Event): void;
}
```

**Computed Properties**:
- `hasError`: Boolean indicating error state
- `characterCount`: Current length of modelValue
- `textareaClasses`: Dynamic classes including error state

**Styling**:
```css
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  resize: vertical;
  min-height: 120px;
  transition: var(--transition);
}

.form-textarea:focus {
  outline: none;
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-dim);
}

.form-textarea::placeholder {
  color: var(--text-muted);
}

.form-textarea.error {
  border-color: var(--red);
}

.form-textarea.error:focus {
  box-shadow: 0 0 0 3px var(--red-dim);
}

.form-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--bg-elevated);
}
```

**Usage Example**:
```vue
<VrlFormGroup>
  <VrlFormLabel for="description">League Description</VrlFormLabel>
  <VrlTextarea
    id="description"
    v-model="formData.description"
    placeholder="Enter description..."
    :maxlength="500"
    :rows="6"
    show-character-count
  />
  <VrlFormHelper>Describe your league and what makes it unique</VrlFormHelper>
</VrlFormGroup>
```

**Testing Requirements**:
- v-model updates on input
- Character count displays correctly when enabled
- Maxlength prevents additional input
- Rows prop sets initial height
- Resize vertical works
- Error state styling applies
- Disabled/readonly states work correctly
- All events emit properly

**Accessibility Notes**:
- Use semantic `<textarea>` element
- `aria-invalid` when error exists
- `aria-describedby` for helper/error text
- Character count should be announced by screen readers
- Consider `aria-live="polite"` for character count updates

**Component Integration**:
- Uses `VrlCharacterCount` component when `showCharacterCount` is true
- Character count should display in bottom-right

---

### 7. VrlSelect.vue

**Purpose**: Dropdown select input with custom styling.

**File Path**: `resources/public/js/components/common/forms/VrlSelect.vue`

**TypeScript Interface**:
```typescript
interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface Props {
  modelValue: string | number | null;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string | string[];
  id?: string;
  name?: string;
  required?: boolean;
  class?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string | number | null): void;
  (e: 'change', event: Event): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}
```

**Computed Properties**:
- `hasError`: Boolean for error state
- `selectClasses`: Dynamic classes

**Styling**:
```css
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 2.5rem;           /* Space for dropdown arrow */
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  cursor: pointer;
  appearance: none;                /* Remove default dropdown */
  transition: var(--transition);

  /* Custom dropdown arrow SVG */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%238b949e' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
}

.form-select:focus {
  outline: none;
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-dim);
}

.form-select.error {
  border-color: var(--red);
}

.form-select.error:focus {
  box-shadow: 0 0 0 3px var(--red-dim);
}

.form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--bg-elevated);
}
```

**Usage Example**:
```vue
<VrlFormGroup>
  <VrlFormLabel for="platform" required>Racing Platform</VrlFormLabel>
  <VrlSelect
    id="platform"
    v-model="formData.platform"
    :options="platformOptions"
    placeholder="Select a platform"
    :error="errors.platform"
    required
  />
  <VrlFormError :error="errors.platform" />
</VrlFormGroup>

<script setup lang="ts">
const platformOptions = [
  { label: 'Gran Turismo 7', value: 'gt7' },
  { label: 'iRacing', value: 'iracing' },
  { label: 'Assetto Corsa Competizione', value: 'acc' },
  { label: 'F1 2024', value: 'f1-24', disabled: true }
];
</script>
```

**Testing Requirements**:
- v-model updates on selection
- Placeholder displays when no value selected
- Options render correctly from array
- Disabled options are not selectable
- Error state applies correct styling
- Custom dropdown arrow displays
- Keyboard navigation works (arrow keys, enter)
- All events emit correctly

**Accessibility Notes**:
- Use semantic `<select>` and `<option>` elements
- `aria-invalid` when error exists
- `aria-describedby` for error/helper text
- Label association via `for` and `id`
- Keyboard navigation should be native

**PrimeVue Alternative**:
- Consider PrimeVue `Dropdown` for advanced features (search, multi-select)
- For simple selects, native `<select>` with custom styling is sufficient

---

### 8. VrlCheckbox.vue

**Purpose**: Custom styled checkbox with label.

**File Path**: `resources/public/js/components/common/forms/VrlCheckbox.vue`

**TypeScript Interface**:
```typescript
interface Props {
  modelValue: boolean;
  label: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  value?: string | number;  // For use in checkbox groups
  class?: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', event: Event): void;
}
```

**Styling**:
```css
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;        /* 12px */
  cursor: pointer;
}

.checkbox-wrapper:has(input:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);  /* 4px */
  background: var(--bg-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  flex-shrink: 0;
}

.checkbox.checked {
  background: var(--cyan);
  border-color: var(--cyan);
}

.checkbox.checked::after {
  content: '✓';
  color: var(--bg-dark);
  font-size: 0.75rem;    /* 12px */
  font-weight: 700;
}

.checkbox-label {
  font-size: 0.9rem;     /* 14.4px */
  color: var(--text-primary);
  user-select: none;
}

/* Focus styles for keyboard navigation */
.checkbox-wrapper:has(input:focus-visible) .checkbox {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}
```

**Usage Example**:
```vue
<VrlCheckbox
  v-model="formData.notifications"
  label="Enable email notifications"
  id="notifications"
/>

<!-- Multiple checkboxes -->
<div class="flex flex-col gap-4">
  <VrlCheckbox v-model="settings.publicView" label="Allow public viewing" />
  <VrlCheckbox v-model="settings.trackLaps" label="Track lap times" />
  <VrlCheckbox v-model="settings.autoPoints" label="Auto-calculate points" />
</div>
```

**Testing Requirements**:
- v-model toggles on click
- Label click toggles checkbox
- Visual checkmark appears when checked
- Disabled state prevents toggling
- Keyboard navigation works (Space to toggle)
- Focus ring appears on keyboard focus
- Change event emits correctly

**Accessibility Notes**:
- Hide native checkbox with `position: absolute; opacity: 0;`
- Keep native input in DOM for accessibility
- Label wraps both native input and custom styling
- `aria-checked` reflects state
- Keyboard focus should be visible
- Space bar should toggle

**Implementation Pattern**:
```vue
<template>
  <label class="checkbox-wrapper">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
      class="sr-only"
    />
    <span class="checkbox" :class="{ checked: modelValue }"></span>
    <span class="checkbox-label">{{ label }}</span>
  </label>
</template>
```

---

### 9. VrlToggle.vue

**Purpose**: Toggle switch for boolean settings.

**File Path**: `resources/public/js/components/common/forms/VrlToggle.vue`

**TypeScript Interface**:
```typescript
interface Props {
  modelValue: boolean;
  label: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  class?: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', event: Event): void;
}
```

**Styling**:
```css
.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;        /* 12px */
  cursor: pointer;
}

.toggle-wrapper:has(input:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle {
  width: 44px;
  height: 24px;
  background: var(--bg-elevated);
  border-radius: var(--radius-pill);  /* 100px */
  position: relative;
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}

.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: var(--transition);
}

.toggle.active {
  background: var(--green-dim);
}

.toggle.active::after {
  left: 22px;           /* 44px - 20px - 2px = 22px */
  background: var(--green);
}

.toggle-label {
  font-size: 0.9rem;    /* 14.4px */
  color: var(--text-primary);
  user-select: none;
}

/* Focus styles */
.toggle-wrapper:has(input:focus-visible) .toggle {
  outline: 2px solid var(--green);
  outline-offset: 2px;
}
```

**Usage Example**:
```vue
<VrlToggle
  v-model="formData.isPublic"
  label="Public League"
  id="public-toggle"
/>

<!-- Multiple toggles -->
<div class="flex flex-col gap-4">
  <VrlToggle v-model="settings.publicLeague" label="Public League" />
  <VrlToggle v-model="settings.autoCalculate" label="Auto-calculate points" />
  <VrlToggle v-model="settings.emailNotifications" label="Email notifications" />
</div>
```

**Testing Requirements**:
- v-model toggles on click
- Knob animates smoothly to new position
- Active state shows green color
- Disabled state prevents toggling
- Keyboard navigation works (Space to toggle)
- Focus ring appears on keyboard focus
- Change event emits correctly

**Accessibility Notes**:
- Use `role="switch"` on the toggle element
- `aria-checked` reflects current state
- Hide native checkbox but keep in DOM
- Label association via wrapping or `for`/`id`
- Keyboard accessible (Space/Enter to toggle)

**Implementation Pattern**:
```vue
<template>
  <label class="toggle-wrapper">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
      class="sr-only"
      role="switch"
    />
    <span class="toggle" :class="{ active: modelValue }"></span>
    <span class="toggle-label">{{ label }}</span>
  </label>
</template>
```

**Difference from CompactToggle**:
- VrlToggle is simpler, no nested options
- CompactToggle has slots and layout variants
- VrlToggle follows Velocity design exactly (green active state)
- CompactToggle uses cyan for app dashboard

---

### 10. VrlCharacterCount.vue

**Purpose**: Display character count for textarea with visual warnings.

**File Path**: `resources/public/js/components/common/forms/VrlCharacterCount.vue`

**TypeScript Interface**:
```typescript
interface Props {
  current: number;
  max: number;
  class?: string;
}
```

**Computed Properties**:
- `percentage`: `(current / max) * 100`
- `isNearLimit`: `percentage >= 90`
- `isAtLimit`: `percentage >= 100`
- `stateClass`: Returns warning/error class based on percentage

**Styling**:
```css
.form-char-count {
  font-size: 0.7rem;       /* 11.2px */
  color: var(--text-muted);
  text-align: right;
  margin-top: 0.25rem;      /* 4px */
  display: block;
}

.form-char-count.warning {
  color: var(--orange);
}

.form-char-count.error {
  color: var(--red);
  font-weight: 600;
}
```

**Usage Example**:
```vue
<VrlTextarea v-model="description" :maxlength="500" />
<VrlCharacterCount :current="description.length" :max="500" />

<!-- Inside VrlTextarea component -->
<VrlCharacterCount
  v-if="showCharacterCount && maxlength"
  :current="modelValue.length"
  :max="maxlength"
/>
```

**Testing Requirements**:
- Displays correct count format: "75 / 500"
- Warning color at 90% threshold
- Error color at 100% threshold
- Updates reactively as text changes
- Right-aligned text

**Accessibility Notes**:
- Consider `aria-live="polite"` for screen reader updates
- Should not be overly verbose (updates on every keystroke)
- Visual indicators supplement text

**Reference Implementation**:
- Review `/var/www/resources/app/js/components/common/forms/FormCharacterCount.vue`
- Adjust styling to match Velocity design (smaller font, specific colors)

---

### 11. VrlInputGroup.vue

**Purpose**: Layout component for grouping multiple inputs horizontally.

**File Path**: `resources/public/js/components/common/forms/VrlInputGroup.vue`

**TypeScript Interface**:
```typescript
interface Props {
  columns?: 2 | 3 | 4;    // Number of columns
  gap?: string;            // Custom gap (default: 1rem)
  class?: string;
}
```

**Slots**:
- `default`: Form field content

**Styling**:
```css
.input-group {
  display: grid;
  gap: 1rem;               /* 16px */
}

.input-group.columns-2 {
  grid-template-columns: repeat(2, 1fr);
}

.input-group.columns-3 {
  grid-template-columns: repeat(3, 1fr);
}

.input-group.columns-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* Responsive: Stack on mobile */
@media (max-width: 768px) {
  .input-group {
    grid-template-columns: 1fr !important;
  }
}
```

**Usage Example**:
```vue
<!-- Two-column layout -->
<VrlInputGroup :columns="2">
  <VrlFormGroup>
    <VrlFormLabel for="firstName">First Name</VrlFormLabel>
    <VrlInput id="firstName" v-model="formData.firstName" />
  </VrlFormGroup>

  <VrlFormGroup>
    <VrlFormLabel for="lastName">Last Name</VrlFormLabel>
    <VrlInput id="lastName" v-model="formData.lastName" />
  </VrlFormGroup>
</VrlInputGroup>

<!-- Three-column layout -->
<VrlInputGroup :columns="3">
  <div><!-- Field 1 --></div>
  <div><!-- Field 2 --></div>
  <div><!-- Field 3 --></div>
</VrlInputGroup>
```

**Testing Requirements**:
- Grid layout applies correctly
- Columns prop changes grid-template-columns
- Gap prop applies custom spacing
- Responsive behavior stacks on mobile
- Child elements render in slot

**Accessibility Notes**:
- Purely layout component, no ARIA requirements
- Ensure form fields inside maintain proper associations

**Responsive Behavior**:
- Desktop: Multi-column grid as specified
- Tablet (< 1024px): May reduce to 2 columns
- Mobile (< 768px): Single column stack

---

## CSS Architecture

### File Structure

**Primary CSS File**: `resources/public/css/app.css`

**Sections**:
```css
/* ============================================
   Form Components - VRL Velocity Design
   ============================================ */

/* Form Structure & Layout */
.form-group { }
.input-group { }

/* Form Labels */
.form-label { }

/* Text Inputs */
.form-input { }
.form-input:focus { }
.form-input.error { }
.form-input:disabled { }

/* Textarea */
.form-textarea { }

/* Select */
.form-select { }

/* Checkboxes */
.checkbox-wrapper { }
.checkbox { }
.checkbox.checked { }
.checkbox-label { }

/* Toggle Switches */
.toggle-wrapper { }
.toggle { }
.toggle.active { }
.toggle-label { }

/* Helper & Error Text */
.form-helper { }
.form-error { }
.form-char-count { }

/* Responsive */
@media (max-width: 768px) { }
```

### CSS Variables Used

```css
/* Colors */
--bg-dark: #0d1117;
--bg-panel: #161b22;
--bg-card: #1c2128;
--bg-elevated: #21262d;

--text-primary: #e6edf3;
--text-secondary: #8b949e;
--text-muted: #6e7681;

--border: #30363d;

--cyan: #58a6ff;
--green: #7ee787;
--red: #f85149;
--orange: #f0883e;

--cyan-dim: rgba(88, 166, 255, 0.15);
--green-dim: rgba(126, 231, 135, 0.15);
--red-dim: rgba(248, 81, 73, 0.15);

/* Typography */
--font-display: 'Orbitron', sans-serif;
--font-body: 'Inter', sans-serif;

/* Sizing */
--radius-sm: 4px;
--radius: 6px;
--radius-pill: 100px;

/* Transitions */
--transition: all 0.3s ease;
```

---

## Testing Strategy

### Unit Tests (Vitest)

**Test File Pattern**: `ComponentName.test.ts` alongside component file

**Required Test Coverage**:

1. **Component Rendering**
   - Mounts without errors
   - Renders slot content
   - Applies props correctly

2. **v-model Functionality**
   - Input updates modelValue
   - modelValue changes update input
   - Emits update:modelValue event

3. **Validation States**
   - Error prop applies error styling
   - Error classes added to input
   - Error messages display

4. **Disabled/Readonly States**
   - Disabled prevents interaction
   - Readonly allows focus, prevents editing
   - Correct opacity and cursor styles

5. **Accessibility**
   - ARIA attributes present
   - Label associations work
   - Keyboard navigation functional

6. **Events**
   - All emitted events fire correctly
   - Event payloads are correct

**Example Test Structure**:
```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VrlInput from './VrlInput.vue';

describe('VrlInput', () => {
  it('renders with default props', () => {
    const wrapper = mount(VrlInput, {
      props: { modelValue: '' }
    });
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('updates modelValue on input', async () => {
    const wrapper = mount(VrlInput, {
      props: { modelValue: '' }
    });

    await wrapper.find('input').setValue('test');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test']);
  });

  it('applies error styling when error prop is present', () => {
    const wrapper = mount(VrlInput, {
      props: { modelValue: '', error: 'Invalid input' }
    });
    expect(wrapper.find('input').classes()).toContain('error');
  });

  it('prevents input when disabled', async () => {
    const wrapper = mount(VrlInput, {
      props: { modelValue: '', disabled: true }
    });
    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
  });
});
```

### Integration Tests

**Scenarios**:
1. Complete form submission flow
2. Validation error display
3. Character count updates
4. Input group responsive behavior

### Visual Regression Tests

**Tool**: Playwright or Chromatic

**Scenarios**:
- Default state
- Focused state
- Error state
- Disabled state
- Filled state
- Dark mode (already default)

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

**Required Features**:

1. **Keyboard Navigation**
   - All inputs focusable via Tab
   - Checkbox/toggle toggleable with Space
   - Select navigable with arrow keys
   - Focus visible indicator (cyan ring)

2. **Screen Reader Support**
   - Semantic HTML elements (`<input>`, `<label>`, `<select>`, etc.)
   - ARIA labels where needed
   - `aria-invalid` for error states
   - `aria-describedby` linking errors/helpers
   - `aria-required` for required fields

3. **Visual Indicators**
   - Required fields marked with red asterisk
   - Error states use color + icon + text
   - Focus states have visible outline
   - Disabled states have reduced opacity + cursor change

4. **Color Contrast**
   - Text on backgrounds meets 4.5:1 ratio
   - Error text meets 4.5:1 ratio
   - Placeholder text meets 4.5:1 ratio (AA for large text)

5. **Touch Targets**
   - Minimum 44x44px for interactive elements
   - Checkboxes/toggles meet size requirements
   - Labels are clickable (larger hit area)

### ARIA Patterns

**Text Input**:
```html
<label for="email">Email</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="email-helper email-error"
/>
<small id="email-helper">We'll never share your email</small>
<small id="email-error" role="alert">Invalid email format</small>
```

**Checkbox**:
```html
<label>
  <input type="checkbox" aria-checked="false" />
  <span>Enable notifications</span>
</label>
```

**Toggle Switch**:
```html
<label>
  <input type="checkbox" role="switch" aria-checked="true" />
  <span>Public League</span>
</label>
```

---

## PrimeVue Integration Strategy

### When to Use PrimeVue

**Recommended for**:
- Complex components (Dropdown with search, multi-select)
- Date/time pickers (Calendar)
- Auto-complete inputs
- Rich text editors

**Not recommended for**:
- Simple text inputs (overhead not worth it)
- Basic checkboxes/toggles
- Basic selects with < 10 options

### Integration Pattern

**Example**: Using PrimeVue InputText

```vue
<script setup lang="ts">
import InputText from 'primevue/inputtext';

interface Props {
  modelValue: string;
  error?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <InputText
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :class="['form-input', { error: error }]"
    :invalid="!!error"
  />
</template>

<style scoped>
/* Override PrimeVue styles to match Velocity design */
:deep(.p-inputtext) {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
}

:deep(.p-inputtext:focus) {
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px var(--cyan-dim);
}
</style>
```

### Styling Overrides

**PrimeVue uses CSS variables**, so we can override globally:

```css
/* In app.css */
:root {
  --p-primary-color: var(--cyan);
  --p-surface-0: var(--bg-dark);
  --p-surface-50: var(--bg-panel);
  --p-surface-100: var(--bg-card);
  --p-text-color: var(--text-primary);
  --p-border-color: var(--border);
  --p-focus-ring-color: var(--cyan);
}
```

---

## Implementation Phases

### Phase 1: Foundation Components (Priority: High)
**Timeline**: Week 1

- [ ] VrlFormGroup
- [ ] VrlFormLabel
- [ ] VrlFormHelper
- [ ] VrlFormError
- [ ] CSS base styles setup

**Deliverables**:
- 4 components with tests
- Base CSS in app.css
- Documentation for each component

---

### Phase 2: Input Components (Priority: High)
**Timeline**: Week 2

- [ ] VrlInput
- [ ] VrlTextarea
- [ ] VrlCharacterCount
- [ ] VrlSelect

**Deliverables**:
- 4 components with full v-model support
- Comprehensive tests (min 80% coverage)
- Error state handling
- Integration with Phase 1 components

---

### Phase 3: Interactive Controls (Priority: Medium)
**Timeline**: Week 3

- [ ] VrlCheckbox
- [ ] VrlToggle
- [ ] VrlInputGroup

**Deliverables**:
- 3 components with custom styling
- Keyboard navigation support
- Accessibility compliance testing
- Responsive behavior

---

### Phase 4: Integration & Polish (Priority: Medium)
**Timeline**: Week 4

- [ ] Complete form examples
- [ ] Validation integration (consider VeeValidate)
- [ ] PrimeVue component wrappers (if needed)
- [ ] Performance optimization
- [ ] Visual regression tests
- [ ] Documentation site updates

**Deliverables**:
- Working form examples in demo views
- Performance benchmarks
- Complete accessibility audit
- Developer documentation

---

## Form Validation Strategy

### Recommended Approach: VeeValidate

**Why VeeValidate**:
- Vue 3 Composition API native
- TypeScript support
- Schema-based validation (Yup, Zod)
- Minimal boilerplate
- Works with custom components

**Example Integration**:
```vue
<script setup lang="ts">
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});

const { handleSubmit, errors } = useForm({
  validationSchema: schema,
});

const { value: email } = useField('email');
const { value: password } = useField('password');

const onSubmit = handleSubmit((values) => {
  console.log('Form submitted:', values);
});
</script>

<template>
  <form @submit="onSubmit">
    <VrlFormGroup>
      <VrlFormLabel for="email" required>Email</VrlFormLabel>
      <VrlInput id="email" v-model="email" type="email" :error="errors.email" />
      <VrlFormError :error="errors.email" />
    </VrlFormGroup>

    <VrlFormGroup>
      <VrlFormLabel for="password" required>Password</VrlFormLabel>
      <VrlInput id="password" v-model="password" type="password" :error="errors.password" />
      <VrlFormError :error="errors.password" />
    </VrlFormGroup>

    <button type="submit">Submit</button>
  </form>
</template>
```

### Alternative: Manual Validation

For simple forms, manual validation:

```typescript
const formData = reactive({
  email: '',
  password: '',
});

const errors = reactive({
  email: '',
  password: '',
});

function validateEmail(): boolean {
  if (!formData.email) {
    errors.email = 'Email is required';
    return false;
  }
  if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Invalid email format';
    return false;
  }
  errors.email = '';
  return true;
}

function validateForm(): boolean {
  return validateEmail() && validatePassword();
}
```

---

## Performance Considerations

### Bundle Size

**Estimated Sizes** (gzipped):
- VrlFormGroup: ~0.5 KB
- VrlFormLabel: ~0.8 KB
- VrlInput: ~2 KB
- VrlTextarea: ~2.5 KB
- VrlSelect: ~2 KB
- VrlCheckbox: ~1.5 KB
- VrlToggle: ~1.5 KB
- **Total**: ~11 KB

**Optimization Strategies**:
- Tree-shaking via Vite
- Lazy load validation libraries
- Async component loading for complex forms

### Rendering Performance

**Optimizations**:
- Use `v-once` for static labels
- Debounce character count updates
- Avoid unnecessary re-renders with `computed` properties
- Use `shallowRef` for form state when appropriate

### Accessibility Performance

**Screen Reader Optimization**:
- Use `aria-live="polite"` (not "assertive") for non-critical updates
- Debounce character count announcements
- Batch ARIA attribute updates

---

## Browser Support

**Target Browsers**:
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari (iOS): Last 2 versions
- Chrome Mobile (Android): Last 2 versions

**Polyfills Required**:
- None (Vue 3 handles modern browser targets)

**Progressive Enhancement**:
- Native HTML5 validation as fallback
- CSS fallbacks for custom properties
- Focus-visible polyfill for older browsers

---

## Migration from Admin Dashboard Components

### Components to Reference

**Existing App Dashboard Components** (`resources/app/js/components/common/forms/`):

1. `FormLabel.vue` → VrlFormLabel
2. `FormError.vue` → VrlFormError
3. `FormHelper.vue` → VrlFormHelper
4. `FormCharacterCount.vue` → VrlCharacterCount
5. `CompactToggle.vue` → VrlToggle (simplified)

### Key Differences

**Styling**:
- App dashboard: Tailwind utility classes
- Public site: CSS classes from Velocity design system
- Font: App uses Inter, Public uses Orbitron for labels

**Color Palette**:
- App dashboard: Various accent colors
- Public site: Specific Velocity colors (cyan, green, red)

**Complexity**:
- CompactToggle has nested slots and layout variants
- VrlToggle should be simpler, following design system exactly

### Code Reuse Strategy

**What to Reuse**:
- Component structure and TypeScript interfaces
- v-model implementation patterns
- Event handling logic
- Accessibility patterns

**What to Change**:
- All CSS classes to match Velocity design
- Color references to use Velocity variables
- Font families (Orbitron for labels)
- Simplify complex components where design allows

---

## Documentation Requirements

### Component Documentation

Each component must have:

1. **README.md** (in component directory or inline docs)
   - Purpose and use cases
   - Props table with types and defaults
   - Events table
   - Slots table
   - Usage examples
   - Accessibility notes

2. **TypeScript JSDoc Comments**
   - Interface documentation
   - Prop descriptions
   - Emit descriptions

3. **Storybook Stories** (optional but recommended)
   - Default state
   - All prop variants
   - Error states
   - Disabled states

### Usage Examples

**Create**: `docs/PublicDashboard/design-2026/design-1-velocity/components/forms-usage.md`

Include:
- Registration form example
- Login form example
- Settings form example
- Multi-step form example
- Validation examples

---

## Dependencies

### Required NPM Packages

**Already Installed** (check `package.json`):
- `vue` (^3.x)
- `vue-router` (^4.x)
- `vite` (^7.x)

**Recommended to Add**:
- `vee-validate` (^4.x) - Form validation
- `yup` or `zod` - Schema validation
- `@vueuse/core` - Composition utilities (likely already installed)

**PrimeVue** (already installed):
- `primevue` (^4.x)
- Check for latest version compatibility

### Development Dependencies

- `@vue/test-utils` (testing)
- `vitest` (testing)
- `@vitest/ui` (testing UI)
- `jsdom` (DOM testing environment)
- `@types/node` (TypeScript types)

---

## Risk Assessment

### Potential Challenges

1. **Accessibility Compliance**
   - Risk: Missing ARIA attributes or incorrect keyboard navigation
   - Mitigation: Use axe-core for automated testing, manual testing with screen readers

2. **Cross-Browser Consistency**
   - Risk: Custom checkbox/toggle styling may differ across browsers
   - Mitigation: Extensive browser testing, use of CSS reset/normalize

3. **Performance with Large Forms**
   - Risk: Many reactive inputs may cause re-render issues
   - Mitigation: Use `shallowRef`, debounce, and lazy validation

4. **PrimeVue Integration Conflicts**
   - Risk: PrimeVue styles may conflict with custom styles
   - Mitigation: Use scoped styles, CSS specificity, or CSS modules

5. **Mobile UX**
   - Risk: Form inputs may not be optimized for touch
   - Mitigation: Proper touch target sizing, mobile-first testing

### Mitigation Strategies

- **Early prototyping** of complex components
- **Continuous accessibility testing** (automated + manual)
- **Regular code reviews** focusing on performance
- **User testing** with actual forms
- **Fallback to native inputs** if custom styling causes issues

---

## Success Criteria

### Definition of Done

Each component is complete when:

1. ✅ **Functionality**
   - v-model works correctly
   - All props function as documented
   - All events emit correctly
   - Error states display properly

2. ✅ **Testing**
   - Unit tests pass (min 80% coverage)
   - Accessibility tests pass (axe-core)
   - Visual regression tests pass
   - Manual testing complete

3. ✅ **Documentation**
   - Component README written
   - TypeScript interfaces documented
   - Usage examples provided
   - Accessibility notes included

4. ✅ **Code Quality**
   - ESLint passes
   - TypeScript strict mode passes
   - Prettier formatting applied
   - Code review approved

5. ✅ **Design Compliance**
   - Matches Velocity design system
   - Colors, fonts, spacing correct
   - Responsive behavior verified
   - Dark mode works (default theme)

---

## Future Enhancements

### Post-MVP Features

1. **Advanced Input Types**
   - VrlDatePicker (PrimeVue Calendar)
   - VrlTimePicker
   - VrlColorPicker
   - VrlFileUpload (with preview)

2. **Complex Components**
   - VrlMultiSelect
   - VrlAutocomplete
   - VrlTagInput
   - VrlRichTextEditor

3. **Form Layouts**
   - VrlFormWizard (multi-step forms)
   - VrlFormSection (collapsible sections)
   - VrlFieldArray (dynamic field lists)

4. **Validation Enhancements**
   - Async validation (API checks)
   - Cross-field validation
   - Custom validation rules UI
   - Real-time validation feedback

5. **UX Improvements**
   - Auto-save drafts
   - Confirmation dialogs for destructive actions
   - Form progress indicators
   - Inline editing mode

---

## References

### Design System
- HTML Reference: `/var/www/docs/PublicDashboard/design-2026/design-1-velocity/components/index.html` (lines 2136-2249)
- CSS Variables: Lines 14-61 of index.html
- Form CSS: Lines 884-1059 of index.html

### Existing Implementations
- App Forms CSS: `/var/www/resources/app/css/components/forms.css`
- App Components: `/var/www/resources/app/js/components/common/forms/`

### External Resources
- [Vue 3 Forms Guide](https://vuejs.org/guide/essentials/forms.html)
- [VeeValidate Documentation](https://vee-validate.logaretm.com/v4/)
- [PrimeVue Form Components](https://primevue.org/inputtext/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices - Forms](https://www.w3.org/WAI/ARIA/apg/patterns/)

---

## Approval & Sign-off

**Plan Author**: Claude Code (VRL Architecture Assistant)
**Plan Date**: 2026-01-18
**Version**: 1.0

**Required Reviews**:
- [ ] Frontend Lead - Design system compliance
- [ ] UX Designer - Accessibility & usability
- [ ] Tech Lead - Architecture & performance
- [ ] Product Owner - Feature completeness

**Approval Status**: Pending Review

---

## Appendix A: Complete Usage Example

### Registration Form

```vue
<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import VrlFormGroup from '@public/components/common/forms/VrlFormGroup.vue';
import VrlFormLabel from '@public/components/common/forms/VrlFormLabel.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlTextarea from '@public/components/common/forms/VrlTextarea.vue';
import VrlSelect from '@public/components/common/forms/VrlSelect.vue';
import VrlCheckbox from '@public/components/common/forms/VrlCheckbox.vue';
import VrlToggle from '@public/components/common/forms/VrlToggle.vue';
import VrlFormError from '@public/components/common/forms/VrlFormError.vue';
import VrlFormHelper from '@public/components/common/forms/VrlFormHelper.vue';
import VrlInputGroup from '@public/components/common/forms/VrlInputGroup.vue';

const router = useRouter();

const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  platform: null,
  bio: '',
  agreeToTerms: false,
  newsletter: false,
});

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  platform: '',
});

const platformOptions = [
  { label: 'Gran Turismo 7', value: 'gt7' },
  { label: 'iRacing', value: 'iracing' },
  { label: 'Assetto Corsa Competizione', value: 'acc' },
  { label: 'F1 2024', value: 'f1-24' },
];

function validateForm(): boolean {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });

  let isValid = true;

  // Validate first name
  if (!formData.firstName) {
    errors.firstName = 'First name is required';
    isValid = false;
  }

  // Validate last name
  if (!formData.lastName) {
    errors.lastName = 'Last name is required';
    isValid = false;
  }

  // Validate email
  if (!formData.email) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Invalid email format';
    isValid = false;
  }

  // Validate password
  if (!formData.password) {
    errors.password = 'Password is required';
    isValid = false;
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
    isValid = false;
  }

  // Validate confirm password
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
    isValid = false;
  }

  // Validate platform
  if (!formData.platform) {
    errors.platform = 'Please select a racing platform';
    isValid = false;
  }

  return isValid;
}

async function handleSubmit(): Promise<void> {
  if (!validateForm()) {
    return;
  }

  try {
    // API call to register user
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-8">
    <h1 class="text-3xl font-display mb-8">Create Your Account</h1>

    <form @submit.prevent="handleSubmit">
      <!-- Name Fields -->
      <VrlInputGroup :columns="2">
        <VrlFormGroup>
          <VrlFormLabel for="firstName" required>First Name</VrlFormLabel>
          <VrlInput
            id="firstName"
            v-model="formData.firstName"
            placeholder="John"
            :error="errors.firstName"
            autocomplete="given-name"
            required
          />
          <VrlFormError :error="errors.firstName" />
        </VrlFormGroup>

        <VrlFormGroup>
          <VrlFormLabel for="lastName" required>Last Name</VrlFormLabel>
          <VrlInput
            id="lastName"
            v-model="formData.lastName"
            placeholder="Doe"
            :error="errors.lastName"
            autocomplete="family-name"
            required
          />
          <VrlFormError :error="errors.lastName" />
        </VrlFormGroup>
      </VrlInputGroup>

      <!-- Email -->
      <VrlFormGroup>
        <VrlFormLabel for="email" required>Email Address</VrlFormLabel>
        <VrlInput
          id="email"
          v-model="formData.email"
          type="email"
          placeholder="driver@racing.com"
          :error="errors.email"
          autocomplete="email"
          required
        />
        <VrlFormError :error="errors.email" />
        <VrlFormHelper>We'll never share your email with anyone</VrlFormHelper>
      </VrlFormGroup>

      <!-- Password Fields -->
      <VrlInputGroup :columns="2">
        <VrlFormGroup>
          <VrlFormLabel for="password" required>Password</VrlFormLabel>
          <VrlInput
            id="password"
            v-model="formData.password"
            type="password"
            :error="errors.password"
            autocomplete="new-password"
            required
          />
          <VrlFormError :error="errors.password" />
        </VrlFormGroup>

        <VrlFormGroup>
          <VrlFormLabel for="confirmPassword" required>Confirm Password</VrlFormLabel>
          <VrlInput
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            :error="errors.confirmPassword"
            autocomplete="new-password"
            required
          />
          <VrlFormError :error="errors.confirmPassword" />
        </VrlFormGroup>
      </VrlInputGroup>

      <!-- Platform Select -->
      <VrlFormGroup>
        <VrlFormLabel for="platform" required>Primary Racing Platform</VrlFormLabel>
        <VrlSelect
          id="platform"
          v-model="formData.platform"
          :options="platformOptions"
          placeholder="Select your primary platform"
          :error="errors.platform"
          required
        />
        <VrlFormError :error="errors.platform" />
      </VrlFormGroup>

      <!-- Bio Textarea -->
      <VrlFormGroup>
        <VrlFormLabel for="bio">Driver Bio</VrlFormLabel>
        <VrlTextarea
          id="bio"
          v-model="formData.bio"
          placeholder="Tell us about your racing experience..."
          :maxlength="500"
          :rows="6"
          show-character-count
        />
        <VrlFormHelper>Share your racing background and favorite cars</VrlFormHelper>
      </VrlFormGroup>

      <!-- Terms Checkbox -->
      <VrlFormGroup>
        <VrlCheckbox
          v-model="formData.agreeToTerms"
          label="I agree to the Terms of Service and Privacy Policy"
          id="terms"
        />
      </VrlFormGroup>

      <!-- Newsletter Toggle -->
      <VrlFormGroup>
        <VrlToggle
          v-model="formData.newsletter"
          label="Receive newsletter and race updates"
          id="newsletter"
        />
      </VrlFormGroup>

      <!-- Submit Button -->
      <button
        type="submit"
        class="btn btn-primary w-full"
        :disabled="!formData.agreeToTerms"
      >
        Create Account
      </button>
    </form>
  </div>
</template>
```

---

## Appendix B: Accessibility Checklist

### Per-Component Checklist

#### VrlInput
- [ ] Uses semantic `<input>` element
- [ ] Label association via `for`/`id` or wrapping
- [ ] `aria-invalid` when error present
- [ ] `aria-describedby` links to error/helper text
- [ ] `aria-required` when required
- [ ] Placeholder text has sufficient contrast
- [ ] Focus ring visible and meets 3:1 contrast
- [ ] Keyboard navigable (Tab to focus)
- [ ] Screen reader announces errors on change

#### VrlTextarea
- [ ] Uses semantic `<textarea>` element
- [ ] All VrlInput accessibility requirements
- [ ] Character count announced to screen readers
- [ ] Resize handle accessible via keyboard (native)

#### VrlSelect
- [ ] Uses semantic `<select>` and `<option>` elements
- [ ] All VrlInput accessibility requirements
- [ ] Keyboard navigation (arrow keys, Enter, Escape)
- [ ] Selected option announced to screen readers
- [ ] Disabled options not selectable

#### VrlCheckbox
- [ ] Native `<input type="checkbox">` in DOM (visually hidden)
- [ ] `aria-checked` reflects state
- [ ] Space bar toggles checkbox
- [ ] Label click toggles checkbox
- [ ] Focus visible on keyboard focus
- [ ] Change announced to screen readers

#### VrlToggle
- [ ] Native `<input type="checkbox">` with `role="switch"`
- [ ] `aria-checked` reflects state
- [ ] Space/Enter toggles switch
- [ ] Label click toggles switch
- [ ] Focus visible on keyboard focus
- [ ] State change announced as "on" or "off"

### Global Form Accessibility
- [ ] Logical tab order (top to bottom, left to right)
- [ ] Error summary at top of form (optional)
- [ ] Required fields clearly marked
- [ ] Error messages associated with inputs
- [ ] Submit button keyboard accessible
- [ ] Form validation doesn't rely on color alone
- [ ] Loading states announced to screen readers
- [ ] Success/error messages have `role="alert"` or `role="status"`

---

## Appendix C: CSS Variables Reference

```css
/* Copy this to resources/public/css/app.css */

:root {
  /* ==========================================
     VRL Velocity Design System - CSS Variables
     ========================================== */

  /* Background Colors */
  --bg-dark: #0d1117;
  --bg-panel: #161b22;
  --bg-card: #1c2128;
  --bg-elevated: #21262d;
  --bg-highlight: #272d36;

  /* Text Colors */
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;

  /* Border Colors */
  --border: #30363d;
  --border-muted: #21262d;

  /* Accent Colors */
  --cyan: #58a6ff;
  --green: #7ee787;
  --orange: #f0883e;
  --red: #f85149;
  --purple: #bc8cff;
  --yellow: #d29922;

  /* Dim Variants (with transparency) */
  --cyan-dim: rgba(88, 166, 255, 0.15);
  --green-dim: rgba(126, 231, 135, 0.15);
  --orange-dim: rgba(240, 136, 62, 0.15);
  --red-dim: rgba(248, 81, 73, 0.15);
  --purple-dim: rgba(188, 140, 255, 0.15);
  --yellow-dim: rgba(210, 153, 34, 0.15);

  /* Typography */
  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Spacing & Sizing */
  --radius-sm: 4px;
  --radius: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 100px;

  /* Transitions */
  --transition: all 0.3s ease;
}
```

---

**END OF PLAN DOCUMENT**
