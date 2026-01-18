# VRL Velocity Design System - Forms Usage Guide

Complete guide for using the VRL Velocity form components in the public dashboard.

## Table of Contents

1. [Overview](#overview)
2. [Installation & Imports](#installation--imports)
3. [Component Reference](#component-reference)
4. [Complete Examples](#complete-examples)
5. [Validation Patterns](#validation-patterns)
6. [Best Practices](#best-practices)

## Overview

The VRL Velocity Design System provides 11 form components built with Vue 3 Composition API and TypeScript:

### Foundation Components
- **VrlFormGroup** - Container for form fields with layout control
- **VrlFormLabel** - Accessible labels with required indicators
- **VrlFormHelper** - Helper text for additional guidance
- **VrlFormError** - Error message display
- **VrlCharacterCount** - Character counter with max length

### Input Components
- **VrlInput** - Single-line text input with variants
- **VrlTextarea** - Multi-line text input with auto-resize
- **VrlSelect** - Dropdown selection
- **VrlCheckbox** - Single checkbox with label
- **VrlToggle** - Toggle switch for boolean values
- **VrlInputGroup** - Input with prefix/suffix icons or text

## Installation & Imports

### Import Individual Components

```typescript
import { VrlInput, VrlFormGroup, VrlFormLabel } from '@public/components/common/forms';
```

### Import Types

```typescript
import type { SelectOption } from '@public/components/common/forms';
```

### All Available Imports

```typescript
// Components
import {
  VrlFormGroup,
  VrlFormLabel,
  VrlFormHelper,
  VrlFormError,
  VrlCharacterCount,
  VrlInput,
  VrlTextarea,
  VrlSelect,
  VrlCheckbox,
  VrlToggle,
  VrlInputGroup,
} from '@public/components/common/forms';

// Types
import type {
  SelectOption,
  InputType,
  ValidationState,
  FormFieldSize,
} from '@public/components/common/forms';
```

## Component Reference

### VrlFormGroup

Container component that provides consistent spacing and layout for form fields.

**Props:**
- `inline?: boolean` - Display label and input side by side (default: `false`)
- `class?: string` - Additional CSS classes

**Example:**
```vue
<VrlFormGroup>
  <VrlFormLabel for="email" required>Email Address</VrlFormLabel>
  <VrlInput id="email" type="email" v-model="form.email" />
  <VrlFormHelper>We'll never share your email</VrlFormHelper>
</VrlFormGroup>
```

### VrlFormLabel

Accessible label component with support for required field indicators.

**Props:**
- `for?: string` - Associates label with input ID
- `required?: boolean` - Shows required indicator (default: `false`)
- `class?: string` - Additional CSS classes

**Example:**
```vue
<VrlFormLabel for="username" required>Username</VrlFormLabel>
```

### VrlFormHelper

Helper text to provide additional context or instructions.

**Props:**
- `class?: string` - Additional CSS classes

**Example:**
```vue
<VrlFormHelper>Must be 8-20 characters long</VrlFormHelper>
```

### VrlFormError

Error message display with proper ARIA attributes for accessibility.

**Props:**
- `error?: string | string[]` - Error message(s) to display
- `id?: string` - ID for aria-describedby references
- `class?: string` - Additional CSS classes

**Example:**
```vue
<VrlFormError :error="errors.email" id="email-error" />
```

### VrlCharacterCount

Character counter with optional max length indicator.

**Props:**
- `current: number` - Current character count (required)
- `max?: number` - Maximum character count
- `class?: string` - Additional CSS classes

**Example:**
```vue
<VrlCharacterCount :current="bio.length" :max="500" />
```

### VrlInput

Single-line text input with multiple type support and validation states.

**Props:**
- `modelValue: string | number` - v-model binding (required)
- `type?: InputType` - Input type (default: `'text'`)
- `placeholder?: string` - Placeholder text
- `disabled?: boolean` - Disabled state (default: `false`)
- `readonly?: boolean` - Readonly state (default: `false`)
- `error?: string | string[]` - Error message(s)
- `id?: string` - Input ID
- `name?: string` - Input name attribute
- `required?: boolean` - Required field (default: `false`)
- `autocomplete?: string` - Autocomplete attribute
- `maxlength?: number` - Maximum length
- `class?: string` - Additional CSS classes

**Events:**
- `update:modelValue` - v-model update
- `input` - Native input event
- `change` - Native change event
- `blur` - Native blur event
- `focus` - Native focus event
- `keydown` - Native keydown event

**Example:**
```vue
<VrlInput
  v-model="form.username"
  id="username"
  type="text"
  placeholder="Enter username"
  :error="errors.username"
  required
  maxlength="20"
/>
```

### VrlTextarea

Multi-line text input with optional auto-resize and character counting.

**Props:**
- `modelValue: string` - v-model binding (required)
- `placeholder?: string` - Placeholder text
- `disabled?: boolean` - Disabled state (default: `false`)
- `readonly?: boolean` - Readonly state (default: `false`)
- `error?: string | string[]` - Error message(s)
- `id?: string` - Textarea ID
- `name?: string` - Textarea name attribute
- `required?: boolean` - Required field (default: `false`)
- `rows?: number` - Number of visible rows (default: `4`)
- `maxlength?: number` - Maximum length
- `autoResize?: boolean` - Enable auto-resize (default: `false`)
- `class?: string` - Additional CSS classes

**Events:**
- `update:modelValue` - v-model update
- `input` - Native input event
- `change` - Native change event
- `blur` - Native blur event
- `focus` - Native focus event

**Example:**
```vue
<VrlTextarea
  v-model="form.bio"
  id="bio"
  placeholder="Tell us about yourself"
  :rows="6"
  :maxlength="500"
  auto-resize
/>
```

### VrlSelect

Dropdown selection component with support for disabled options.

**Props:**
- `modelValue: string | number | null` - v-model binding (required)
- `options: SelectOption[]` - Array of options (required)
- `placeholder?: string` - Placeholder text
- `disabled?: boolean` - Disabled state (default: `false`)
- `error?: string | string[]` - Error message(s)
- `id?: string` - Select ID
- `name?: string` - Select name attribute
- `required?: boolean` - Required field (default: `false`)
- `class?: string` - Additional CSS classes

**Events:**
- `update:modelValue` - v-model update
- `change` - Native change event
- `blur` - Native blur event
- `focus` - Native focus event

**Example:**
```vue
<script setup lang="ts">
import type { SelectOption } from '@public/components/common/forms';

const countries: SelectOption[] = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'ca', disabled: true },
];
</script>

<template>
  <VrlSelect
    v-model="form.country"
    :options="countries"
    placeholder="Select a country"
    :error="errors.country"
    required
  />
</template>
```

### VrlCheckbox

Single checkbox component with integrated label.

**Props:**
- `modelValue: boolean` - v-model binding (required)
- `label?: string` - Checkbox label
- `disabled?: boolean` - Disabled state (default: `false`)
- `error?: string | string[]` - Error message(s)
- `id?: string` - Checkbox ID
- `name?: string` - Checkbox name attribute
- `required?: boolean` - Required field (default: `false`)
- `class?: string` - Additional CSS classes

**Events:**
- `update:modelValue` - v-model update
- `change` - Native change event

**Example:**
```vue
<VrlCheckbox
  v-model="form.termsAccepted"
  id="terms"
  label="I agree to the Terms of Service"
  required
  :error="errors.terms"
/>
```

### VrlToggle

Toggle switch component for boolean values.

**Props:**
- `modelValue: boolean` - v-model binding (required)
- `label?: string` - Toggle label
- `disabled?: boolean` - Disabled state (default: `false`)
- `id?: string` - Toggle ID
- `name?: string` - Toggle name attribute
- `class?: string` - Additional CSS classes

**Events:**
- `update:modelValue` - v-model update
- `change` - Change event with value

**Example:**
```vue
<VrlToggle
  v-model="form.notifications"
  id="notifications"
  label="Enable email notifications"
/>
```

### VrlInputGroup

Input component with prefix/suffix icons or text.

**Props:**
- `modelValue: string | number` - v-model binding (required)
- `type?: InputType` - Input type (default: `'text'`)
- `placeholder?: string` - Placeholder text
- `disabled?: boolean` - Disabled state (default: `false`)
- `readonly?: boolean` - Readonly state (default: `false`)
- `error?: string | string[]` - Error message(s)
- `id?: string` - Input ID
- `name?: string` - Input name attribute
- `required?: boolean` - Required field (default: `false`)
- `prefixIcon?: string` - Phosphor icon name for prefix
- `suffixIcon?: string` - Phosphor icon name for suffix
- `prefixText?: string` - Text for prefix
- `suffixText?: string` - Text for suffix
- `class?: string` - Additional CSS classes

**Events:**
- `update:modelValue` - v-model update
- `input` - Native input event
- `change` - Native change event
- `blur` - Native blur event
- `focus` - Native focus event
- `keydown` - Native keydown event

**Example:**
```vue
<!-- Icon prefix -->
<VrlInputGroup
  v-model="form.email"
  type="email"
  prefix-icon="envelope"
  placeholder="Email address"
/>

<!-- Text prefix/suffix -->
<VrlInputGroup
  v-model="form.price"
  type="number"
  prefix-text="$"
  suffix-text="USD"
  placeholder="0.00"
/>

<!-- Icon suffix -->
<VrlInputGroup
  v-model="form.search"
  type="search"
  suffix-icon="magnifying-glass"
  placeholder="Search..."
/>
```

## Complete Examples

### Registration Form Example

Complete registration form showing all components working together.

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  VrlFormGroup,
  VrlFormLabel,
  VrlFormHelper,
  VrlFormError,
  VrlCharacterCount,
  VrlInput,
  VrlTextarea,
  VrlSelect,
  VrlCheckbox,
  VrlToggle,
  VrlInputGroup,
} from '@public/components/common/forms';
import type { SelectOption } from '@public/components/common/forms';

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  country: null as string | null,
  bio: '',
  website: '',
  notifications: true,
  newsletter: false,
  termsAccepted: false,
});

const errors = ref<Record<string, string>>({});

const countries: SelectOption[] = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'ca' },
  { label: 'Australia', value: 'au' },
];

const validateForm = () => {
  errors.value = {};

  if (!form.username) {
    errors.value.username = 'Username is required';
  } else if (form.username.length < 3) {
    errors.value.username = 'Username must be at least 3 characters';
  }

  if (!form.email) {
    errors.value.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.value.email = 'Please enter a valid email address';
  }

  if (!form.password) {
    errors.value.password = 'Password is required';
  } else if (form.password.length < 8) {
    errors.value.password = 'Password must be at least 8 characters';
  }

  if (form.password !== form.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match';
  }

  if (!form.termsAccepted) {
    errors.value.terms = 'You must accept the Terms of Service';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
  if (validateForm()) {
    console.log('Form submitted:', form);
    // Submit to API
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold mb-8">Create Account</h1>

    <!-- Username -->
    <VrlFormGroup>
      <VrlFormLabel for="username" required>Username</VrlFormLabel>
      <VrlInput
        v-model="form.username"
        id="username"
        type="text"
        placeholder="Choose a username"
        :error="errors.username"
        :maxlength="20"
        required
        autocomplete="username"
      />
      <VrlCharacterCount :current="form.username.length" :max="20" />
      <VrlFormHelper>Must be 3-20 characters, letters and numbers only</VrlFormHelper>
    </VrlFormGroup>

    <!-- Email -->
    <VrlFormGroup>
      <VrlFormLabel for="email" required>Email Address</VrlFormLabel>
      <VrlInputGroup
        v-model="form.email"
        id="email"
        type="email"
        prefix-icon="envelope"
        placeholder="you@example.com"
        :error="errors.email"
        required
        autocomplete="email"
      />
      <VrlFormError :error="errors.email" id="email-error" />
    </VrlFormGroup>

    <!-- Password -->
    <VrlFormGroup>
      <VrlFormLabel for="password" required>Password</VrlFormLabel>
      <VrlInputGroup
        v-model="form.password"
        id="password"
        type="password"
        prefix-icon="lock"
        placeholder="Create a password"
        :error="errors.password"
        required
        autocomplete="new-password"
      />
      <VrlFormError :error="errors.password" id="password-error" />
      <VrlFormHelper>Must be at least 8 characters long</VrlFormHelper>
    </VrlFormGroup>

    <!-- Confirm Password -->
    <VrlFormGroup>
      <VrlFormLabel for="confirm-password" required>Confirm Password</VrlFormLabel>
      <VrlInputGroup
        v-model="form.confirmPassword"
        id="confirm-password"
        type="password"
        prefix-icon="lock"
        placeholder="Confirm your password"
        :error="errors.confirmPassword"
        required
        autocomplete="new-password"
      />
      <VrlFormError :error="errors.confirmPassword" id="confirm-password-error" />
    </VrlFormGroup>

    <!-- Country -->
    <VrlFormGroup>
      <VrlFormLabel for="country" required>Country</VrlFormLabel>
      <VrlSelect
        v-model="form.country"
        id="country"
        :options="countries"
        placeholder="Select your country"
        :error="errors.country"
        required
      />
      <VrlFormError :error="errors.country" id="country-error" />
    </VrlFormGroup>

    <!-- Bio (Optional) -->
    <VrlFormGroup>
      <VrlFormLabel for="bio">Bio</VrlFormLabel>
      <VrlTextarea
        v-model="form.bio"
        id="bio"
        placeholder="Tell us about yourself (optional)"
        :rows="4"
        :maxlength="500"
        auto-resize
      />
      <VrlCharacterCount :current="form.bio.length" :max="500" />
    </VrlFormGroup>

    <!-- Website (Optional) -->
    <VrlFormGroup>
      <VrlFormLabel for="website">Website</VrlFormLabel>
      <VrlInputGroup
        v-model="form.website"
        id="website"
        type="url"
        prefix-icon="globe"
        placeholder="https://example.com"
      />
      <VrlFormHelper>Your personal or professional website</VrlFormHelper>
    </VrlFormGroup>

    <!-- Notifications Toggle -->
    <VrlFormGroup>
      <VrlToggle
        v-model="form.notifications"
        id="notifications"
        label="Enable email notifications"
      />
      <VrlFormHelper>Receive updates about your account activity</VrlFormHelper>
    </VrlFormGroup>

    <!-- Newsletter Checkbox -->
    <VrlFormGroup>
      <VrlCheckbox
        v-model="form.newsletter"
        id="newsletter"
        label="Subscribe to newsletter"
      />
    </VrlFormGroup>

    <!-- Terms Checkbox (Required) -->
    <VrlFormGroup>
      <VrlCheckbox
        v-model="form.termsAccepted"
        id="terms"
        label="I agree to the Terms of Service and Privacy Policy"
        required
        :error="errors.terms"
      />
      <VrlFormError :error="errors.terms" id="terms-error" />
    </VrlFormGroup>

    <!-- Submit Button -->
    <div class="pt-4">
      <button
        type="submit"
        class="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
      >
        Create Account
      </button>
    </div>
  </form>
</template>
```

### Login Form Example

Simplified login form with email and password.

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  VrlFormGroup,
  VrlFormLabel,
  VrlFormError,
  VrlInput,
  VrlInputGroup,
  VrlCheckbox,
} from '@public/components/common/forms';

const form = reactive({
  email: '',
  password: '',
  remember: false,
});

const errors = ref<Record<string, string>>({});
const isLoading = ref(false);

const handleLogin = async () => {
  errors.value = {};

  if (!form.email) {
    errors.value.email = 'Email is required';
    return;
  }

  if (!form.password) {
    errors.value.password = 'Password is required';
    return;
  }

  isLoading.value = true;

  try {
    // Call login API
    console.log('Logging in:', form);
  } catch (error) {
    errors.value.general = 'Invalid email or password';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleLogin" class="max-w-md mx-auto space-y-6">
    <h1 class="text-3xl font-bold mb-8">Sign In</h1>

    <!-- General Error -->
    <VrlFormError v-if="errors.general" :error="errors.general" />

    <!-- Email -->
    <VrlFormGroup>
      <VrlFormLabel for="email" required>Email Address</VrlFormLabel>
      <VrlInputGroup
        v-model="form.email"
        id="email"
        type="email"
        prefix-icon="envelope"
        placeholder="you@example.com"
        :error="errors.email"
        required
        autocomplete="email"
      />
      <VrlFormError :error="errors.email" />
    </VrlFormGroup>

    <!-- Password -->
    <VrlFormGroup>
      <VrlFormLabel for="password" required>Password</VrlFormLabel>
      <VrlInputGroup
        v-model="form.password"
        id="password"
        type="password"
        prefix-icon="lock"
        placeholder="Enter your password"
        :error="errors.password"
        required
        autocomplete="current-password"
      />
      <VrlFormError :error="errors.password" />
    </VrlFormGroup>

    <!-- Remember Me -->
    <VrlFormGroup>
      <VrlCheckbox
        v-model="form.remember"
        id="remember"
        label="Remember me"
      />
    </VrlFormGroup>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="isLoading"
      class="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
    >
      {{ isLoading ? 'Signing in...' : 'Sign In' }}
    </button>

    <!-- Forgot Password Link -->
    <div class="text-center">
      <router-link to="/forgot-password" class="text-primary hover:underline">
        Forgot your password?
      </router-link>
    </div>
  </form>
</template>
```

### Settings Form Example

Settings form with toggles, checkboxes, and various inputs.

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  VrlFormGroup,
  VrlFormLabel,
  VrlFormHelper,
  VrlFormError,
  VrlInput,
  VrlTextarea,
  VrlSelect,
  VrlCheckbox,
  VrlToggle,
  VrlInputGroup,
} from '@public/components/common/forms';
import type { SelectOption } from '@public/components/common/forms';

const settings = reactive({
  displayName: 'John Doe',
  email: 'john@example.com',
  timezone: 'America/New_York',
  bio: 'Racing enthusiast and league organizer',
  emailNotifications: true,
  pushNotifications: false,
  weeklyDigest: true,
  marketingEmails: false,
  publicProfile: true,
});

const timezones: SelectOption[] = [
  { label: 'Eastern Time (ET)', value: 'America/New_York' },
  { label: 'Central Time (CT)', value: 'America/Chicago' },
  { label: 'Mountain Time (MT)', value: 'America/Denver' },
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
];

const errors = ref<Record<string, string>>({});
const isSaving = ref(false);

const handleSave = async () => {
  isSaving.value = true;

  try {
    // Save settings
    console.log('Saving settings:', settings);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    errors.value.general = 'Failed to save settings';
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-8">
    <h1 class="text-3xl font-bold">Settings</h1>

    <form @submit.prevent="handleSave" class="space-y-6">
      <!-- Profile Section -->
      <section>
        <h2 class="text-xl font-semibold mb-4">Profile</h2>

        <div class="space-y-6">
          <VrlFormGroup>
            <VrlFormLabel for="display-name" required>Display Name</VrlFormLabel>
            <VrlInput
              v-model="settings.displayName"
              id="display-name"
              type="text"
              placeholder="Your name"
              required
            />
          </VrlFormGroup>

          <VrlFormGroup>
            <VrlFormLabel for="email" required>Email Address</VrlFormLabel>
            <VrlInputGroup
              v-model="settings.email"
              id="email"
              type="email"
              prefix-icon="envelope"
              required
            />
          </VrlFormGroup>

          <VrlFormGroup>
            <VrlFormLabel for="timezone" required>Timezone</VrlFormLabel>
            <VrlSelect
              v-model="settings.timezone"
              id="timezone"
              :options="timezones"
              required
            />
            <VrlFormHelper>Used for displaying event times</VrlFormHelper>
          </VrlFormGroup>

          <VrlFormGroup>
            <VrlFormLabel for="bio">Bio</VrlFormLabel>
            <VrlTextarea
              v-model="settings.bio"
              id="bio"
              placeholder="Tell others about yourself"
              :rows="4"
              :maxlength="500"
              auto-resize
            />
          </VrlFormGroup>
        </div>
      </section>

      <!-- Notifications Section -->
      <section>
        <h2 class="text-xl font-semibold mb-4">Notifications</h2>

        <div class="space-y-4">
          <VrlFormGroup>
            <VrlToggle
              v-model="settings.emailNotifications"
              id="email-notifications"
              label="Email Notifications"
            />
            <VrlFormHelper>Receive notifications about your activity via email</VrlFormHelper>
          </VrlFormGroup>

          <VrlFormGroup>
            <VrlToggle
              v-model="settings.pushNotifications"
              id="push-notifications"
              label="Push Notifications"
            />
            <VrlFormHelper>Receive browser push notifications</VrlFormHelper>
          </VrlFormGroup>

          <VrlFormGroup>
            <VrlCheckbox
              v-model="settings.weeklyDigest"
              id="weekly-digest"
              label="Weekly Digest"
            />
            <VrlFormHelper>Get a summary of your activity every week</VrlFormHelper>
          </VrlFormGroup>

          <VrlFormGroup>
            <VrlCheckbox
              v-model="settings.marketingEmails"
              id="marketing-emails"
              label="Marketing Emails"
            />
            <VrlFormHelper>Receive news and promotional content</VrlFormHelper>
          </VrlFormGroup>
        </div>
      </section>

      <!-- Privacy Section -->
      <section>
        <h2 class="text-xl font-semibold mb-4">Privacy</h2>

        <VrlFormGroup>
          <VrlToggle
            v-model="settings.publicProfile"
            id="public-profile"
            label="Public Profile"
          />
          <VrlFormHelper>Make your profile visible to other users</VrlFormHelper>
        </VrlFormGroup>
      </section>

      <!-- Submit -->
      <div class="flex items-center gap-4 pt-4">
        <button
          type="submit"
          :disabled="isSaving"
          class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
        >
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>

        <button
          type="button"
          class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>
```

## Validation Patterns

### Manual Validation Approach

The VRL Velocity forms use a manual validation approach for maximum flexibility:

```typescript
const form = reactive({
  email: '',
  password: '',
});

const errors = ref<Record<string, string>>({});

const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
};

const validateForm = (): boolean => {
  errors.value = {};

  const emailError = validateEmail(form.email);
  if (emailError) errors.value.email = emailError;

  const passwordError = validatePassword(form.password);
  if (passwordError) errors.value.password = passwordError;

  return Object.keys(errors.value).length === 0;
};
```

### Real-time Validation

Validate fields on blur for better UX:

```vue
<script setup lang="ts">
const handleEmailBlur = () => {
  const error = validateEmail(form.email);
  if (error) {
    errors.value.email = error;
  } else {
    delete errors.value.email;
  }
};
</script>

<template>
  <VrlInput
    v-model="form.email"
    @blur="handleEmailBlur"
    :error="errors.email"
  />
</template>
```

### Async Validation

Example of async validation (e.g., checking username availability):

```typescript
const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const response = await fetch(`/api/check-username?username=${username}`);
  const data = await response.json();
  return data.available;
};

const handleUsernameBlur = async () => {
  if (!form.username) {
    errors.value.username = 'Username is required';
    return;
  }

  const available = await checkUsernameAvailability(form.username);
  if (!available) {
    errors.value.username = 'Username is already taken';
  } else {
    delete errors.value.username;
  }
};
```

### Server-side Validation

Handle server-side validation errors:

```typescript
const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Laravel validation errors format
      if (errorData.errors) {
        errors.value = errorData.errors;
      } else {
        errors.value.general = errorData.message || 'An error occurred';
      }
      return;
    }

    // Success - redirect or show success message
    console.log('Registration successful');
  } catch (error) {
    errors.value.general = 'Network error. Please try again.';
  }
};
```

## Best Practices

### Accessibility

1. **Always use labels**: Associate every input with a label using the `for` attribute
2. **Mark required fields**: Use the `required` prop on both label and input
3. **Provide helpful error messages**: Use `VrlFormError` with descriptive messages
4. **Use helper text**: Add context with `VrlFormHelper` for complex fields
5. **Autocomplete attributes**: Use appropriate `autocomplete` values for better UX

### User Experience

1. **Real-time feedback**: Validate on blur for immediate feedback
2. **Clear error messages**: Be specific about what's wrong and how to fix it
3. **Disable submit during processing**: Prevent double submissions
4. **Show loading states**: Use loading text/spinners during async operations
5. **Character counters**: Use `VrlCharacterCount` for length-limited fields

### Performance

1. **Debounce async validation**: Don't validate on every keystroke
2. **Lazy load large option lists**: Use virtual scrolling for very long selects
3. **Memoize validation functions**: Avoid unnecessary re-validation

### Code Organization

1. **Separate validation logic**: Keep validators in separate functions or composables
2. **Use reactive state**: Use `reactive()` for form data and `ref()` for errors
3. **Type your data**: Define TypeScript interfaces for form data
4. **Composables for complex forms**: Extract reusable form logic into composables

### Example Composable

```typescript
// composables/useForm.ts
import { ref, reactive } from 'vue';

export function useForm<T extends Record<string, any>>(initialValues: T) {
  const form = reactive({ ...initialValues });
  const errors = ref<Record<string, string>>({});
  const isSubmitting = ref(false);

  const setError = (field: string, message: string) => {
    errors.value[field] = message;
  };

  const clearError = (field: string) => {
    delete errors.value[field];
  };

  const clearAllErrors = () => {
    errors.value = {};
  };

  const reset = () => {
    Object.assign(form, initialValues);
    clearAllErrors();
  };

  return {
    form,
    errors,
    isSubmitting,
    setError,
    clearError,
    clearAllErrors,
    reset,
  };
}
```

## Need Help?

For additional information or support:
- Check component tests for more usage examples
- Review the Velocity design system documentation
- Refer to the PrimeVue documentation for advanced patterns
- Contact the development team for specific questions
