# Frontend Implementation Plan - Authentication Pages Redesign

## Overview

This document details the frontend implementation plan for updating authentication pages to the VRL Velocity design system.

**Agent**: `dev-fe-public`

---

## Task 0: Create VrlPasswordInput Component (Pre-requisite)

### File: `resources/public/js/components/common/forms/VrlPasswordInput.vue`

Create a new password input component with visibility toggle that matches the VRL Velocity design system.

### Component Features
- Password visibility toggle button (eye icon)
- Same styling as `VrlInput` (dark theme, cyan focus)
- Error state support
- Disabled state support
- Full accessibility (ARIA labels, keyboard navigation)

### Component Props
```typescript
interface Props {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string | string[];
  id?: string;
  name?: string;
  autocomplete?: string;
  required?: boolean;
}
```

### Component Template Structure
```vue
<template>
  <div class="relative">
    <input
      :id="props.id"
      :type="showPassword ? 'text' : 'password'"
      :name="props.name"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :required="props.required"
      :autocomplete="props.autocomplete"
      :class="inputClass"
      :aria-invalid="hasError ? 'true' : undefined"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      :aria-label="showPassword ? 'Hide password' : 'Show password'"
      :disabled="props.disabled"
      @click="toggleVisibility"
    >
      <PhEye v-if="!showPassword" :size="20" />
      <PhEyeSlash v-else :size="20" />
    </button>
  </div>
</template>
```

### Styling (Same as VrlInput)
```typescript
const inputClass = computed(() => {
  const baseClasses =
    'w-full px-4 py-3 pr-12 bg-[var(--bg-dark)] border rounded-[var(--radius)] text-[var(--text-primary)] font-body text-[0.9rem] transition-[var(--transition)] placeholder:text-[var(--text-muted)]';
  const borderClass = hasError.value ? 'border-[var(--red)]' : 'border-[var(--border)]';
  const focusClass = hasError.value
    ? 'focus:outline-none focus:border-[var(--red)] focus:shadow-[0_0_0_3px_var(--red-dim)]'
    : 'focus:outline-none focus:border-[var(--cyan)] focus:shadow-[0_0_0_3px_var(--cyan-dim)]';
  const disabledClass = props.disabled
    ? 'opacity-50 cursor-not-allowed bg-[var(--bg-elevated)]'
    : '';
  return `${baseClasses} ${borderClass} ${focusClass} ${disabledClass}`;
});
```

### Icons
Use Phosphor Icons:
- `PhEye` - Show password state
- `PhEyeSlash` - Hide password state

---

## Common Page Structure

All authentication pages will follow this consistent structure:

```vue
<template>
  <div class="min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)] overflow-x-hidden">
    <!-- Background Effects -->
    <BackgroundGrid />

    <!-- Navigation -->
    <LandingNav />

    <!-- Main Content -->
    <main class="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md mx-auto">
        <!-- Auth Card -->
        <div class="bg-[var(--bg-panel)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8">
          <!-- Page content -->
        </div>
      </div>
    </main>

    <!-- Footer -->
    <LandingFooter />
  </div>
</template>
```

---

## Task 1: Login Page (`LoginView.vue`)

### File: `resources/public/js/views/auth/LoginView.vue`

### Changes Required

#### 1.1 Import Updates
```typescript
// Add these imports
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import LandingNav from '@public/components/landing/LandingNav.vue';
import LandingFooter from '@public/components/landing/LandingFooter.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlPasswordInput from '@public/components/common/forms/VrlPasswordInput.vue';
import VrlCheckbox from '@public/components/common/forms/VrlCheckbox.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlFormGroup from '@public/components/common/forms/VrlFormGroup.vue';
import VrlFormLabel from '@public/components/common/forms/VrlFormLabel.vue';
import VrlFormError from '@public/components/common/forms/VrlFormError.vue';

// Remove these PrimeVue imports
// import InputText from 'primevue/inputtext';
// import Password from 'primevue/password';
// import Checkbox from 'primevue/checkbox';
// import Message from 'primevue/message';
```

#### 1.2 Template Structure
- Wrap content in dark-themed container
- Add `BackgroundGrid`, `LandingNav`, `LandingFooter`
- Replace PrimeVue inputs with VRL components
- Update heading with Orbitron font styling
- Update button styles with `VrlButton`
- Replace `Message` with `VrlAlert`
- Update link styles to use cyan accent

#### 1.3 Specific Elements

**Heading:**
```vue
<h1 class="text-display-h2 text-center mb-2">Sign In</h1>
<p class="text-body-secondary text-center mb-8">Welcome back to Virtual Racing Leagues</p>
```

**Email Field:**
```vue
<VrlFormGroup>
  <VrlFormLabel for="email" :required="true">Email Address</VrlFormLabel>
  <VrlInput
    id="email"
    v-model="email"
    type="email"
    placeholder="john@example.com"
    :error="emailError"
    :disabled="isSubmitting"
    autocomplete="email"
    @input="emailError = ''"
  />
  <VrlFormError v-if="emailError" :message="emailError" />
</VrlFormGroup>
```

**Password Field:**
```vue
<VrlFormGroup>
  <VrlFormLabel for="password" :required="true">Password</VrlFormLabel>
  <VrlPasswordInput
    id="password"
    v-model="password"
    placeholder="Enter your password"
    :error="passwordError"
    :disabled="isSubmitting"
    autocomplete="current-password"
    @input="passwordError = ''"
  />
  <VrlFormError v-if="passwordError" :message="passwordError" />
</VrlFormGroup>
```

**Remember Me & Forgot Password:**
```vue
<div class="flex items-center justify-between mb-6">
  <VrlCheckbox v-model="remember" label="Remember me" :disabled="isSubmitting" />
  <router-link
    to="/forgot-password"
    class="text-[0.85rem] text-[var(--text-secondary)] hover:text-[var(--cyan)] transition-colors"
  >
    Forgot password?
  </router-link>
</div>
```

**Submit Button:**
```vue
<VrlButton
  type="submit"
  variant="primary"
  size="lg"
  :disabled="!isFormValid || isSubmitting"
  :loading="isSubmitting"
  class="w-full"
>
  {{ isSubmitting ? 'Signing In...' : 'Sign In' }}
</VrlButton>
```

**Error Alert:**
```vue
<VrlAlert v-if="errorMessage" type="error" :message="errorMessage" class="mb-6" />
```

**Register Link:**
```vue
<p class="text-center text-body-secondary mt-6">
  Don't have an account?
  <router-link to="/register" class="text-[var(--cyan)] hover:underline font-medium">
    Sign up
  </router-link>
</p>
```

---

## Task 2: Register Page (`RegisterView.vue`)

### File: `resources/public/js/views/auth/RegisterView.vue`

### Changes Required

#### 2.1 Import Updates
Same as Login page, plus keep the `usePasswordValidation` composable.

#### 2.2 Template Structure
Similar to Login with additional fields:
- First Name
- Last Name
- Email
- Password (with requirements display)
- Confirm Password

#### 2.3 Specific Elements

**Heading:**
```vue
<h1 class="text-display-h2 text-center mb-2">Create Account</h1>
<p class="text-body-secondary text-center mb-8">Join Virtual Racing Leagues today</p>
```

**Name Fields (Side by Side on Desktop):**
```vue
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <VrlFormGroup>
    <VrlFormLabel for="first-name" :required="true">First Name</VrlFormLabel>
    <VrlInput
      id="first-name"
      v-model="firstName"
      type="text"
      placeholder="John"
      :error="firstNameError"
      :disabled="isSubmitting"
      @input="firstNameError = ''"
    />
    <VrlFormError v-if="firstNameError" :message="firstNameError" />
  </VrlFormGroup>

  <VrlFormGroup>
    <VrlFormLabel for="last-name" :required="true">Last Name</VrlFormLabel>
    <VrlInput
      id="last-name"
      v-model="lastName"
      type="text"
      placeholder="Doe"
      :error="lastNameError"
      :disabled="isSubmitting"
      @input="lastNameError = ''"
    />
    <VrlFormError v-if="lastNameError" :message="lastNameError" />
  </VrlFormGroup>
</div>
```

**Password Requirements Display:**
```vue
<div v-if="password && passwordErrors.length > 0" class="mt-3 p-3 bg-[var(--bg-card)] rounded-[var(--radius)] border border-[var(--border)]">
  <p class="text-[0.75rem] text-[var(--text-secondary)] font-display tracking-wider uppercase mb-2">Password must:</p>
  <ul class="space-y-1">
    <li
      v-for="error in passwordErrors"
      :key="error"
      class="text-[0.8rem] text-[var(--red)] flex items-start gap-2"
    >
      <span class="text-[var(--red)]">•</span>
      <span>{{ error }}</span>
    </li>
  </ul>
</div>

<div v-if="password && isPasswordValid" class="mt-3 flex items-center gap-2">
  <span class="text-[var(--green)]">✓</span>
  <span class="text-[0.8rem] text-[var(--green)]">Password meets all requirements</span>
</div>
```

**Login Link:**
```vue
<p class="text-center text-body-secondary mt-6">
  Already have an account?
  <router-link to="/login" class="text-[var(--cyan)] hover:underline font-medium">
    Sign in
  </router-link>
</p>
```

---

## Task 3: Forgot Password Page (`ForgotPasswordView.vue`)

### File: `resources/public/js/views/auth/ForgotPasswordView.vue`

### Changes Required

#### 3.1 Import Updates
```typescript
import BackgroundGrid from '@public/components/landing/BackgroundGrid.vue';
import LandingNav from '@public/components/landing/LandingNav.vue';
import LandingFooter from '@public/components/landing/LandingFooter.vue';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
import VrlInput from '@public/components/common/forms/VrlInput.vue';
import VrlAlert from '@public/components/common/alerts/VrlAlert.vue';
import VrlFormGroup from '@public/components/common/forms/VrlFormGroup.vue';
import VrlFormLabel from '@public/components/common/forms/VrlFormLabel.vue';
import VrlFormError from '@public/components/common/forms/VrlFormError.vue';
```

#### 3.2 Specific Elements

**Heading:**
```vue
<h1 class="text-display-h2 text-center mb-2">Forgot Password?</h1>
<p class="text-body-secondary text-center mb-8">
  Enter your email address and we'll send you a link to reset your password.
</p>
```

**Success State:**
```vue
<VrlAlert
  v-if="emailSent"
  type="success"
  title="Email Sent"
  message="Password reset link has been sent to your email. Please check your inbox."
  class="mb-6"
/>
```

**Back to Login Link:**
```vue
<div class="text-center mt-6">
  <router-link
    to="/login"
    class="text-[var(--text-secondary)] hover:text-[var(--cyan)] transition-colors inline-flex items-center gap-2"
  >
    <span>←</span>
    <span>Back to login</span>
  </router-link>
</div>
```

---

## Task 4: Reset Password Page (`ResetPasswordView.vue`)

### File: `resources/public/js/views/auth/ResetPasswordView.vue`

### Changes Required

#### 4.1 Import Updates
Same as Forgot Password page, plus keep the `usePasswordValidation` composable.

#### 4.2 Specific Elements

**Heading:**
```vue
<h1 class="text-display-h2 text-center mb-2">Reset Password</h1>
<p class="text-body-secondary text-center mb-8">Enter your new password below.</p>
```

**Invalid Link Error:**
```vue
<VrlAlert
  v-if="!email || !token"
  type="error"
  title="Invalid Reset Link"
  message="This reset link is invalid or has expired. Please request a new password reset."
  class="mb-6"
/>
```

**Password fields with requirements (same as Register page)**

---

## Implementation Order

1. **VrlPasswordInput Component** - Create the reusable password input with toggle
2. **Login Page** - Most commonly used, establish patterns
3. **Register Page** - More complex with multiple fields
4. **Forgot Password Page** - Simple form
5. **Reset Password Page** - Similar to Register password section

---

## Testing Checklist

For each page:

- [ ] Visual appearance matches HomeView design
- [ ] Form validation works correctly
- [ ] Error messages display properly
- [ ] Success states display properly
- [ ] Submit button states (enabled/disabled/loading) work
- [ ] Links navigate correctly
- [ ] Page is responsive on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility maintained
- [ ] Authentication flow still functions (login redirects to app subdomain)
- [ ] No TypeScript errors
- [ ] No console errors

---

## Password Input Decision

**Decision**: Create a new `VrlPasswordInput` component (Option 3)

This component will:
- Provide password visibility toggle (eye icon)
- Match the VRL Velocity design system styling
- Be reusable across all auth pages
- Support error states and accessibility

See **Task 0** at the top of this document for implementation details.

---

## Notes

- All existing script logic (validation, API calls, error handling) remains unchanged
- Only template and styling changes are required
- The `useAuthStore` and `authService` continue to work as-is
- Toast notifications from PrimeVue can be kept (they appear as overlays)
