# Social Authentication - Frontend Implementation Plan

## 1. Overview

This document outlines the frontend implementation plan for adding third-party social authentication (Discord, Google, Apple) to the Vue 3 public site. The implementation will provide users with alternative authentication methods while maintaining the existing email/password flow.

### Scope

- **Public Site** (`resources/public/js/`): Social login buttons on Login and Register views, OAuth callback handling
- **User Dashboard** (`resources/app/js/`): Account linking UI in Settings view (to be created)
- **Shared Types**: TypeScript interfaces for social auth data structures

### Key Features

1. Social login buttons on Login and Register pages
2. OAuth flow initiation and callback handling
3. Account linking/unlinking interface
4. Error handling for OAuth failures
5. Display of connected social accounts status
6. Loading states and user feedback
7. Accessibility compliance

---

## 2. New Components

### 2.1 SocialLoginButtons.vue

**Location**: `resources/public/js/components/auth/SocialLoginButtons.vue`

**Purpose**: Container component that renders a group of social login buttons with consistent spacing and divider.

**Props**:
```typescript
interface Props {
  mode?: 'login' | 'register' | 'link'; // Default: 'login'
  isDisabled?: boolean; // Default: false
  showDivider?: boolean; // Default: true
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'provider-click', provider: SocialProvider): void;
  (e: 'error', error: Error): void;
}
```

**Features**:
- Renders "Or continue with" divider text
- Displays all three social provider buttons in a grid
- Passes click events to parent
- Shows loading overlay when OAuth redirect is in progress
- Responsive layout (single column on mobile, grid on desktop)

**Structure**:
```vue
<template>
  <div class="social-login-container">
    <!-- Optional Divider -->
    <div v-if="showDivider" class="divider">
      <span>Or {{ mode === 'link' ? 'link with' : 'continue with' }}</span>
    </div>

    <!-- Social Buttons Grid -->
    <div class="social-buttons-grid">
      <SocialLoginButton
        v-for="provider in providers"
        :key="provider"
        :provider="provider"
        :mode="mode"
        :disabled="isDisabled || isLoading"
        @click="handleProviderClick(provider)"
      />
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <ProgressSpinner />
    </div>
  </div>
</template>
```

**Styling**:
- Grid layout: `grid-cols-1 md:grid-cols-3 gap-3`
- Divider: Gray line with centered text overlay
- Full width buttons with consistent height

---

### 2.2 SocialLoginButton.vue

**Location**: `resources/public/js/components/auth/SocialLoginButton.vue`

**Purpose**: Individual social provider button with brand-specific styling and icon.

**Props**:
```typescript
interface Props {
  provider: SocialProvider; // 'discord' | 'google' | 'apple'
  mode?: 'login' | 'register' | 'link'; // Default: 'login'
  disabled?: boolean; // Default: false
  loading?: boolean; // Default: false
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'click'): void;
}
```

**Features**:
- Brand-specific colors and icons for each provider
- Dynamic button text based on mode
- Loading spinner when `loading` prop is true
- Disabled state styling
- ARIA labels for accessibility
- Hover and focus states

**Provider Configurations**:
```typescript
const providerConfig: Record<SocialProvider, ProviderConfig> = {
  discord: {
    name: 'Discord',
    icon: 'pi pi-discord', // Or custom SVG
    backgroundColor: '#5865F2',
    hoverColor: '#4752C4',
    textColor: '#FFFFFF',
  },
  google: {
    name: 'Google',
    icon: 'pi pi-google', // Or custom SVG
    backgroundColor: '#FFFFFF',
    hoverColor: '#F8F9FA',
    textColor: '#3C4043',
    borderColor: '#DADCE0',
  },
  apple: {
    name: 'Apple',
    icon: 'pi pi-apple', // Or custom SVG
    backgroundColor: '#000000',
    hoverColor: '#1D1D1F',
    textColor: '#FFFFFF',
  },
};
```

**Button Text Logic**:
- `mode === 'login'`: "Continue with {Provider}"
- `mode === 'register'`: "Sign up with {Provider}"
- `mode === 'link'`: "Connect {Provider}"

**Structure**:
```vue
<template>
  <Button
    :label="buttonText"
    :icon="config.icon"
    :loading="loading"
    :disabled="disabled"
    :class="buttonClasses"
    :style="buttonStyles"
    :aria-label="`${buttonText}`"
    @click="$emit('click')"
  />
</template>
```

**Styling**:
- Custom background colors per provider (not PrimeVue severity)
- White border for Google button
- Consistent height: `h-12`
- Icon + text with proper spacing
- Smooth transitions on hover

---

### 2.3 LinkedAccounts.vue

**Location**: `resources/app/js/components/settings/LinkedAccounts.vue`

**Purpose**: Display and manage connected social accounts in user settings.

**Props**:
```typescript
interface Props {
  linkedAccounts: LinkedAccount[];
}
```

**Emits**:
```typescript
interface Emits {
  (e: 'link', provider: SocialProvider): void;
  (e: 'unlink', accountId: number): void;
  (e: 'refresh'): void;
}
```

**Features**:
- List of all social providers with connection status
- "Connect" button for unlinked accounts
- "Disconnect" button for linked accounts
- Confirmation dialog before unlinking
- Show linked date/time
- Display provider-specific icons
- Loading states during link/unlink operations
- Error handling with toast notifications

**Structure**:
```vue
<template>
  <div class="linked-accounts">
    <h3>Connected Accounts</h3>
    <p class="description">
      Link your social accounts for faster login. You can disconnect them at any time.
    </p>

    <div class="accounts-list">
      <div
        v-for="provider in allProviders"
        :key="provider"
        class="account-item"
      >
        <!-- Provider Info -->
        <div class="provider-info">
          <i :class="getProviderIcon(provider)" />
          <span>{{ getProviderName(provider) }}</span>
        </div>

        <!-- Connection Status & Actions -->
        <div class="account-actions">
          <template v-if="isLinked(provider)">
            <span class="linked-badge">Connected</span>
            <Button
              label="Disconnect"
              size="small"
              severity="danger"
              outlined
              @click="confirmUnlink(provider)"
            />
          </template>
          <template v-else>
            <Button
              label="Connect"
              size="small"
              severity="secondary"
              @click="$emit('link', provider)"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Unlink Confirmation Dialog -->
    <ConfirmDialog />
  </div>
</template>
```

**Data Management**:
- Computed property to check if each provider is linked
- Method to find linked account by provider
- Confirmation dialog uses PrimeVue `useConfirm()` composable

**Styling**:
- Card-based layout with clean separation
- Each account item has hover state
- Badges for connection status
- Responsive grid for mobile

---

### 2.4 OAuthCallback.vue

**Location**: `resources/public/js/views/auth/OAuthCallback.vue`

**Purpose**: Handle OAuth redirect callbacks from social providers.

**Props**: None (uses route params and query strings)

**Features**:
- Extract authorization code from URL query params
- Display loading spinner during token exchange
- Handle success and error states
- Redirect to app subdomain on success
- Show error message and redirect to login on failure
- Support for both login/register and account linking flows

**Route Params**:
- `provider` (path param): The social provider name

**Query Params**:
- `code`: Authorization code from provider
- `state`: CSRF protection token
- `error`: Error code (if auth failed)
- `error_description`: Human-readable error message
- `mode`: 'login' | 'link' (indicates flow type)

**Flow Logic**:
```typescript
onMounted(async () => {
  const { provider } = route.params;
  const { code, state, error, error_description, mode } = route.query;

  // Handle OAuth errors
  if (error) {
    handleOAuthError(error, error_description);
    return;
  }

  // Validate state token (CSRF protection)
  if (!validateStateToken(state)) {
    showError('Invalid authentication request');
    return;
  }

  try {
    // Exchange code for user session
    if (mode === 'link') {
      await socialAuthService.linkAccount(provider, code, state);
      // Redirect to settings page
      window.location.href = getAppSubdomainUrl() + '/settings';
    } else {
      const user = await socialAuthService.callback(provider, code, state);
      authStore.setUser(user);
      // Redirect to app subdomain dashboard
      window.location.href = getAppSubdomainUrl();
    }
  } catch (err) {
    handleCallbackError(err);
  }
});
```

**Structure**:
```vue
<template>
  <div class="oauth-callback-container">
    <!-- Loading State -->
    <div v-if="isProcessing" class="callback-loading">
      <ProgressSpinner />
      <h2>Completing authentication...</h2>
      <p>Please wait while we connect your account.</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="callback-error">
      <Message severity="error">{{ errorMessage }}</Message>
      <Button
        label="Return to Login"
        @click="router.push({ name: 'login' })"
      />
    </div>
  </div>
</template>
```

**Error Handling**:
- `access_denied`: User cancelled OAuth flow
- `invalid_state`: CSRF token mismatch
- `server_error`: Provider error
- Network errors
- Duplicate account linking errors

**Styling**:
- Centered layout with spinner
- Full-screen overlay
- Clear error messages
- Branded coloring

---

## 3. View Modifications

### 3.1 LoginView.vue

**Location**: `resources/public/js/views/auth/LoginView.vue`

**Changes**:

1. **Import SocialLoginButtons**:
```typescript
import SocialLoginButtons from '@public/components/auth/SocialLoginButtons.vue';
```

2. **Add Social Login Section** (after traditional login form, before "Don't have an account?" link):
```vue
<!-- Social Login Options -->
<SocialLoginButtons
  mode="login"
  :is-disabled="isSubmitting"
  @provider-click="handleSocialLogin"
  @error="handleSocialError"
/>
```

3. **Add Handler Methods**:
```typescript
const handleSocialLogin = (provider: SocialProvider): void => {
  // Redirect to backend OAuth URL
  window.location.href = `/api/auth/${provider}/redirect`;
};

const handleSocialError = (error: Error): void => {
  errorMessage.value = error.message || 'Social login failed. Please try again.';
};
```

**Visual Layout**:
- Traditional login form at top
- SocialLoginButtons below form
- Divider with "Or continue with" text
- "Don't have an account?" link at bottom

---

### 3.2 RegisterView.vue

**Location**: `resources/public/js/views/auth/RegisterView.vue`

**Changes**:

1. **Import SocialLoginButtons**:
```typescript
import SocialLoginButtons from '@public/components/auth/SocialLoginButtons.vue';
```

2. **Reorder Layout** - Place social buttons FIRST (common UX pattern):
```vue
<!-- Social Registration Options -->
<SocialLoginButtons
  mode="register"
  :is-disabled="isSubmitting"
  @provider-click="handleSocialRegister"
  @error="handleSocialError"
/>

<!-- Divider -->
<div class="divider-reverse">
  <span>Or register with email</span>
</div>

<!-- Traditional Registration Form -->
<form @submit.prevent="handleSubmit">
  <!-- ... existing form fields ... -->
</form>
```

3. **Add Handler Methods**:
```typescript
const handleSocialRegister = (provider: SocialProvider): void => {
  // Redirect to backend OAuth URL
  window.location.href = `/api/auth/${provider}/redirect`;
};

const handleSocialError = (error: Error): void => {
  errorMessage.value = error.message || 'Social registration failed. Please try again.';
};
```

**Visual Layout**:
- SocialLoginButtons at top (encourages social auth)
- Divider with "Or register with email"
- Traditional registration form below
- "Already have an account?" link at bottom

---

### 3.3 New Settings View (User Dashboard)

**Location**: `resources/app/js/views/SettingsView.vue` (to be created)

**Purpose**: User settings page with account linking section.

**Structure**:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import LinkedAccounts from '@app/components/settings/LinkedAccounts.vue';
import { socialAuthService } from '@app/services/socialAuthService';
import type { LinkedAccount, SocialProvider } from '@app/types/social';

const toast = useToast();
const linkedAccounts = ref<LinkedAccount[]>([]);
const isLoading = ref(false);

onMounted(async () => {
  await fetchLinkedAccounts();
});

const fetchLinkedAccounts = async (): Promise<void> => {
  isLoading.value = true;
  try {
    linkedAccounts.value = await socialAuthService.getLinkedAccounts();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load linked accounts',
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

const handleLinkAccount = (provider: SocialProvider): void => {
  // Redirect to OAuth flow with mode=link
  window.location.href = `/api/auth/${provider}/redirect?mode=link`;
};

const handleUnlinkAccount = async (accountId: number): Promise<void> => {
  try {
    await socialAuthService.unlinkAccount(accountId);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Account disconnected successfully',
      life: 3000,
    });
    await fetchLinkedAccounts();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to disconnect account',
      life: 3000,
    });
  }
};
</script>

<template>
  <div class="settings-view">
    <h1>Account Settings</h1>

    <!-- Profile Section -->
    <section class="settings-section">
      <h2>Profile Information</h2>
      <!-- Profile edit form -->
    </section>

    <!-- Linked Accounts Section -->
    <section class="settings-section">
      <LinkedAccounts
        :linked-accounts="linkedAccounts"
        @link="handleLinkAccount"
        @unlink="handleUnlinkAccount"
        @refresh="fetchLinkedAccounts"
      />
    </section>

    <!-- Other Settings -->
  </div>
</template>
```

---

## 4. Router Changes

### 4.1 Public Site Router

**Location**: `resources/public/js/router/index.ts`

**New Routes**:

```typescript
{
  path: '/auth/:provider/callback',
  name: 'oauth-callback',
  component: () => import('@public/views/auth/OAuthCallback.vue'),
  meta: {
    title: 'Authenticating',
    isAuthRoute: true,
  },
  props: true,
}
```

**Route Guard Update**:
No changes needed - OAuth callback route is marked as `isAuthRoute: true`, so authenticated users redirecting from account linking will be sent to app subdomain automatically.

---

### 4.2 User Dashboard Router

**Location**: `resources/app/js/router/index.ts`

**New Routes**:

```typescript
{
  path: '/settings',
  name: 'settings',
  component: () => import('@app/views/SettingsView.vue'),
  meta: {
    title: 'Settings',
    requiresAuth: true,
  },
},
{
  path: '/auth/:provider/callback',
  name: 'oauth-link-callback',
  component: () => import('@app/views/auth/OAuthLinkCallback.vue'),
  meta: {
    title: 'Linking Account',
    requiresAuth: true,
  },
  props: true,
}
```

**Note**: The user dashboard callback view (`OAuthLinkCallback.vue`) is separate from the public callback view because:
1. It requires authentication
2. It handles account linking (not login)
3. It redirects back to settings page

---

## 5. Pinia Store Updates

### 5.1 Auth Store (Public)

**Location**: `resources/public/js/stores/authStore.ts`

**New State**:
```typescript
const socialAuthLoading = ref(false);
const socialAuthError = ref<string | null>(null);
```

**New Actions**:

```typescript
async function handleSocialCallback(
  provider: SocialProvider,
  code: string,
  state: string
): Promise<void> {
  socialAuthLoading.value = true;
  socialAuthError.value = null;

  try {
    const userData = await authService.socialCallback(provider, code, state);
    setUser(userData);

    // Redirect to app subdomain
    const appUrl = getAppSubdomainUrl();
    window.location.href = appUrl;
  } catch (error) {
    if (isAxiosError(error)) {
      socialAuthError.value = error.response?.data?.message || 'Social authentication failed';
    } else {
      socialAuthError.value = 'An unexpected error occurred';
    }
    throw error;
  } finally {
    socialAuthLoading.value = false;
  }
}

function clearSocialAuthError(): void {
  socialAuthError.value = null;
}
```

**Return Updated Object**:
```typescript
return {
  // ... existing state/getters/actions

  // Social auth state
  socialAuthLoading,
  socialAuthError,

  // Social auth actions
  handleSocialCallback,
  clearSocialAuthError,
};
```

---

### 5.2 Settings Store (User Dashboard)

**Location**: `resources/app/js/stores/settingsStore.ts` (to be created)

**Purpose**: Manage user settings including linked accounts.

**State**:
```typescript
const linkedAccounts = ref<LinkedAccount[]>([]);
const isLoadingAccounts = ref(false);
const linkingProvider = ref<SocialProvider | null>(null);
```

**Actions**:
```typescript
async function fetchLinkedAccounts(): Promise<void> {
  isLoadingAccounts.value = true;
  try {
    linkedAccounts.value = await socialAuthService.getLinkedAccounts();
  } finally {
    isLoadingAccounts.value = false;
  }
}

async function linkAccount(provider: SocialProvider, code: string, state: string): Promise<void> {
  linkingProvider.value = provider;
  try {
    const account = await socialAuthService.linkAccount(provider, code, state);
    linkedAccounts.value.push(account);
  } finally {
    linkingProvider.value = null;
  }
}

async function unlinkAccount(accountId: number): Promise<void> {
  await socialAuthService.unlinkAccount(accountId);
  linkedAccounts.value = linkedAccounts.value.filter(acc => acc.id !== accountId);
}
```

---

## 6. Service Layer

### 6.1 Social Auth Service (Public)

**Location**: `resources/public/js/services/socialAuthService.ts`

**Purpose**: Handle social authentication API calls for public site.

```typescript
import { apiClient, apiService } from '@public/services/api';
import type { User } from '@public/types/user';
import type { SocialProvider, OAuthCallbackResponse } from '@public/types/social';

class SocialAuthService {
  /**
   * Get OAuth redirect URL for a provider
   */
  getOAuthUrl(provider: SocialProvider, mode: 'login' | 'link' = 'login'): string {
    return `/api/auth/${provider}/redirect?mode=${mode}`;
  }

  /**
   * Handle OAuth callback and exchange code for session
   */
  async socialCallback(
    provider: SocialProvider,
    code: string,
    state: string,
    signal?: AbortSignal
  ): Promise<User> {
    await apiService.fetchCSRFToken();

    const response = await apiClient.post<{ data: { user: User } }>(
      `/auth/${provider}/callback`,
      { code, state },
      { signal }
    );

    return response.data.data.user;
  }

  /**
   * Validate state token (CSRF protection)
   */
  validateStateToken(state: string | null): boolean {
    if (!state) return false;

    const storedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');

    return storedState === state;
  }

  /**
   * Generate and store state token
   */
  generateStateToken(): string {
    const state = this.generateRandomString(32);
    sessionStorage.setItem('oauth_state', state);
    return state;
  }

  /**
   * Parse OAuth error from query params
   */
  parseOAuthError(error: string | null, description: string | null): string {
    const errorMessages: Record<string, string> = {
      access_denied: 'You cancelled the authentication process.',
      invalid_request: 'Invalid authentication request. Please try again.',
      unauthorized_client: 'Authentication service is not properly configured.',
      server_error: 'The authentication provider encountered an error.',
    };

    return errorMessages[error || ''] || description || 'Authentication failed.';
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const socialAuthService = new SocialAuthService();
```

---

### 6.2 Social Auth Service (User Dashboard)

**Location**: `resources/app/js/services/socialAuthService.ts`

**Purpose**: Handle social account linking API calls for authenticated users.

```typescript
import { apiClient } from '@app/services/api';
import type { LinkedAccount, SocialProvider } from '@app/types/social';

class SocialAuthService {
  /**
   * Get all linked accounts for current user
   */
  async getLinkedAccounts(signal?: AbortSignal): Promise<LinkedAccount[]> {
    const response = await apiClient.get<{ data: LinkedAccount[] }>(
      '/user/linked-accounts',
      { signal }
    );

    return response.data.data;
  }

  /**
   * Link a social account to current user
   */
  async linkAccount(
    provider: SocialProvider,
    code: string,
    state: string,
    signal?: AbortSignal
  ): Promise<LinkedAccount> {
    const response = await apiClient.post<{ data: LinkedAccount }>(
      `/user/linked-accounts/${provider}`,
      { code, state },
      { signal }
    );

    return response.data.data;
  }

  /**
   * Unlink a social account
   */
  async unlinkAccount(accountId: number, signal?: AbortSignal): Promise<void> {
    await apiClient.delete(`/user/linked-accounts/${accountId}`, { signal });
  }

  /**
   * Check if a provider is already linked
   */
  async isProviderLinked(provider: SocialProvider, signal?: AbortSignal): Promise<boolean> {
    try {
      const accounts = await this.getLinkedAccounts(signal);
      return accounts.some(acc => acc.provider === provider);
    } catch {
      return false;
    }
  }
}

export const socialAuthService = new SocialAuthService();
```

---

### 6.3 Update Existing Auth Service

**Location**: `resources/public/js/services/authService.ts`

**Add Social Auth Methods**:

```typescript
// ... existing methods ...

async socialCallback(
  provider: SocialProvider,
  code: string,
  state: string,
  signal?: AbortSignal
): Promise<User> {
  await this.fetchCSRFToken();

  const response = await apiClient.post<{ data: { user: User } }>(
    `/auth/${provider}/callback`,
    { code, state },
    { signal }
  );

  return response.data.data.user;
}
```

---

## 7. TypeScript Types

### 7.1 Social Authentication Types

**Location**: `resources/public/js/types/social.ts`

```typescript
/**
 * Supported social authentication providers
 */
export type SocialProvider = 'discord' | 'google' | 'apple';

/**
 * Social provider configuration
 */
export interface ProviderConfig {
  name: string;
  icon: string;
  backgroundColor: string;
  hoverColor: string;
  textColor: string;
  borderColor?: string;
}

/**
 * OAuth callback query parameters
 */
export interface OAuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  mode?: 'login' | 'link';
}

/**
 * OAuth callback response from backend
 */
export interface OAuthCallbackResponse {
  user: User;
  message?: string;
}

/**
 * Linked social account
 */
export interface LinkedAccount {
  id: number;
  provider: SocialProvider;
  provider_user_id: string;
  provider_email?: string;
  linked_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * OAuth error response
 */
export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}
```

---

### 7.2 Update User Type

**Location**: `resources/public/js/types/user.ts`

**Add Linked Accounts** (optional, if included in user response):

```typescript
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  email_verified_at: string | null;
  linked_accounts?: LinkedAccount[]; // Optional
}
```

---

### 7.3 App Dashboard Types

**Location**: `resources/app/js/types/social.ts`

```typescript
// Re-export types from public (for consistency)
export type { SocialProvider, LinkedAccount, ProviderConfig } from '@public/types/social';
```

---

## 8. UI/UX Considerations

### 8.1 Brand-Specific Button Styling

**Discord**:
- Background: `#5865F2` (Discord Blurple)
- Hover: `#4752C4`
- Text: White
- Icon: Discord logo

**Google**:
- Background: White
- Border: `#DADCE0` (1px solid)
- Hover: `#F8F9FA`
- Text: `#3C4043` (Google Gray)
- Icon: Google "G" logo

**Apple**:
- Background: `#000000`
- Hover: `#1D1D1F`
- Text: White
- Icon: Apple logo

### 8.2 Loading States

**During OAuth Redirect**:
1. Show loading spinner overlay on button clicked
2. Disable all other buttons
3. Display "Redirecting to {Provider}..." text

**During Callback Processing**:
1. Full-screen loading overlay with spinner
2. Message: "Completing authentication..."
3. Subtext: "Please wait while we connect your account."

**During Account Linking**:
1. Button shows loading spinner
2. Other buttons remain enabled (user can link multiple)
3. Toast notification on success

### 8.3 Error Message Display

**OAuth Errors** (on callback page):
- Large Message component with severity="error"
- Clear explanation of what went wrong
- Action button: "Return to Login" or "Try Again"

**API Errors** (during linking):
- Toast notification (top-right)
- Auto-dismiss after 5 seconds
- Allow manual dismiss

**Validation Errors**:
- Inline error messages below relevant input
- Red border on invalid input
- Clear on user interaction

### 8.4 Success Feedback

**After Successful Login**:
- Immediate redirect to app subdomain
- No intermediate success message (seamless UX)

**After Successful Account Linking**:
- Toast notification: "Account connected successfully"
- Update linked accounts list immediately
- Change button from "Connect" to "Disconnect"
- Show green badge: "Connected"

### 8.5 Responsive Design

**Desktop** (≥768px):
- Social buttons in 3-column grid
- Full-width buttons with icon + text
- Side-by-side layout for linked accounts

**Mobile** (<768px):
- Social buttons stacked vertically (1 column)
- Full-width buttons
- Stacked layout for linked accounts
- Larger touch targets (min 44px height)

### 8.6 Button Placement Strategy

**Login Page**:
- Traditional form first (familiarity)
- Social buttons below with divider
- Reasoning: Returning users expect email/password first

**Register Page**:
- Social buttons first (encourage adoption)
- Traditional form below with divider
- Reasoning: New users benefit from faster social registration

---

## 9. Accessibility

### 9.1 ARIA Labels

**Social Login Buttons**:
```vue
<Button
  :aria-label="`Continue with ${provider.name}`"
  role="button"
  :aria-disabled="disabled"
/>
```

**Linked Accounts List**:
```vue
<div role="list" aria-label="Connected social accounts">
  <div
    v-for="provider in allProviders"
    :key="provider"
    role="listitem"
  >
    <!-- ... -->
  </div>
</div>
```

**Loading States**:
```vue
<div role="status" aria-live="polite">
  <ProgressSpinner aria-label="Loading" />
  <span class="sr-only">Completing authentication, please wait</span>
</div>
```

### 9.2 Keyboard Navigation

- All buttons must be focusable with Tab
- Enter/Space keys trigger button clicks
- Focus visible indicator (blue outline)
- Logical tab order: email → password → remember → social buttons
- Escape key closes confirmation dialogs

### 9.3 Screen Reader Support

**Announcements**:
- Success: "Account connected successfully"
- Error: "Failed to connect account. {error message}"
- Loading: "Redirecting to authentication provider"

**Descriptive Text**:
- "Connect your {Provider} account for faster login"
- "Disconnect removes {Provider} login option"
- "You must have at least one login method (email or social)"

### 9.4 Color Contrast

- Ensure WCAG AA compliance (4.5:1 for normal text)
- Google button: Black text on white = high contrast ✓
- Discord button: White text on `#5865F2` = verify contrast
- Apple button: White text on black = high contrast ✓
- Error messages: Red with sufficient contrast

### 9.5 Focus Management

**OAuth Callback Page**:
- Auto-focus on "Return to Login" button on error
- Announce error message to screen readers

**Settings Page**:
- Focus remains on "Connect" button after linking
- Focus moves to "Disconnect" button after account links

---

## 10. Testing Plan

### 10.1 Component Unit Tests

#### SocialLoginButton.test.ts

**Location**: `resources/public/js/components/auth/__tests__/SocialLoginButton.test.ts`

**Test Cases**:
```typescript
describe('SocialLoginButton', () => {
  it('renders with correct provider styling', () => {
    const wrapper = mount(SocialLoginButton, {
      props: { provider: 'discord' }
    });

    expect(wrapper.find('.p-button').classes()).toContain('discord-button');
    expect(wrapper.find('i').classes()).toContain('pi-discord');
  });

  it('displays correct text based on mode', () => {
    const loginWrapper = mount(SocialLoginButton, {
      props: { provider: 'google', mode: 'login' }
    });
    expect(loginWrapper.text()).toContain('Continue with Google');

    const registerWrapper = mount(SocialLoginButton, {
      props: { provider: 'google', mode: 'register' }
    });
    expect(registerWrapper.text()).toContain('Sign up with Google');

    const linkWrapper = mount(SocialLoginButton, {
      props: { provider: 'google', mode: 'link' }
    });
    expect(linkWrapper.text()).toContain('Connect Google');
  });

  it('emits click event when clicked', async () => {
    const wrapper = mount(SocialLoginButton, {
      props: { provider: 'apple' }
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(SocialLoginButton, {
      props: { provider: 'discord', disabled: true }
    });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('shows loading spinner when loading prop is true', () => {
    const wrapper = mount(SocialLoginButton, {
      props: { provider: 'google', loading: true }
    });

    expect(wrapper.findComponent({ name: 'ProgressSpinner' }).exists()).toBe(true);
  });

  it('has correct ARIA labels', () => {
    const wrapper = mount(SocialLoginButton, {
      props: { provider: 'discord', mode: 'login' }
    });

    expect(wrapper.find('button').attributes('aria-label')).toBe('Continue with Discord');
  });
});
```

---

#### SocialLoginButtons.test.ts

**Location**: `resources/public/js/components/auth/__tests__/SocialLoginButtons.test.ts`

**Test Cases**:
```typescript
describe('SocialLoginButtons', () => {
  it('renders all three provider buttons', () => {
    const wrapper = mount(SocialLoginButtons);

    const buttons = wrapper.findAllComponents(SocialLoginButton);
    expect(buttons).toHaveLength(3);
  });

  it('shows divider when showDivider is true', () => {
    const wrapper = mount(SocialLoginButtons, {
      props: { showDivider: true }
    });

    expect(wrapper.find('.divider').exists()).toBe(true);
    expect(wrapper.text()).toContain('Or continue with');
  });

  it('hides divider when showDivider is false', () => {
    const wrapper = mount(SocialLoginButtons, {
      props: { showDivider: false }
    });

    expect(wrapper.find('.divider').exists()).toBe(false);
  });

  it('emits provider-click event with correct provider', async () => {
    const wrapper = mount(SocialLoginButtons);

    const discordButton = wrapper.findAllComponents(SocialLoginButton)[0];
    await discordButton.vm.$emit('click');

    expect(wrapper.emitted('provider-click')).toHaveLength(1);
    expect(wrapper.emitted('provider-click')![0]).toEqual(['discord']);
  });

  it('disables all buttons when isDisabled is true', () => {
    const wrapper = mount(SocialLoginButtons, {
      props: { isDisabled: true }
    });

    const buttons = wrapper.findAllComponents(SocialLoginButton);
    buttons.forEach(button => {
      expect(button.props('disabled')).toBe(true);
    });
  });

  it('shows loading overlay during OAuth redirect', async () => {
    const wrapper = mount(SocialLoginButtons);

    // Simulate provider click
    const discordButton = wrapper.findAllComponents(SocialLoginButton)[0];
    await discordButton.vm.$emit('click');

    // Should show loading overlay
    expect(wrapper.find('.loading-overlay').exists()).toBe(true);
  });
});
```

---

#### LinkedAccounts.test.ts

**Location**: `resources/app/js/components/settings/__tests__/LinkedAccounts.test.ts`

**Test Cases**:
```typescript
describe('LinkedAccounts', () => {
  const mockLinkedAccounts: LinkedAccount[] = [
    {
      id: 1,
      provider: 'discord',
      provider_user_id: '123456',
      linked_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  it('displays all social providers', () => {
    const wrapper = mount(LinkedAccounts, {
      props: { linkedAccounts: [] }
    });

    expect(wrapper.text()).toContain('Discord');
    expect(wrapper.text()).toContain('Google');
    expect(wrapper.text()).toContain('Apple');
  });

  it('shows "Connected" badge for linked accounts', () => {
    const wrapper = mount(LinkedAccounts, {
      props: { linkedAccounts: mockLinkedAccounts }
    });

    const discordItem = wrapper.find('[data-provider="discord"]');
    expect(discordItem.text()).toContain('Connected');
  });

  it('shows "Connect" button for unlinked accounts', () => {
    const wrapper = mount(LinkedAccounts, {
      props: { linkedAccounts: mockLinkedAccounts }
    });

    const googleItem = wrapper.find('[data-provider="google"]');
    expect(googleItem.find('button').text()).toContain('Connect');
  });

  it('emits link event when Connect button clicked', async () => {
    const wrapper = mount(LinkedAccounts, {
      props: { linkedAccounts: [] }
    });

    const connectButton = wrapper.find('[data-provider="google"] button');
    await connectButton.trigger('click');

    expect(wrapper.emitted('link')).toHaveLength(1);
    expect(wrapper.emitted('link')![0]).toEqual(['google']);
  });

  it('shows confirmation dialog before unlinking', async () => {
    const wrapper = mount(LinkedAccounts, {
      props: { linkedAccounts: mockLinkedAccounts },
      global: {
        plugins: [PrimeVue],
      }
    });

    const disconnectButton = wrapper.find('[data-provider="discord"] .disconnect-btn');
    await disconnectButton.trigger('click');

    // Verify confirm dialog is shown
    expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(true);
  });

  it('emits unlink event after confirmation', async () => {
    const confirmMock = vi.fn((callback) => callback.accept());

    const wrapper = mount(LinkedAccounts, {
      props: { linkedAccounts: mockLinkedAccounts },
      global: {
        mocks: {
          $confirm: confirmMock,
        }
      }
    });

    const disconnectButton = wrapper.find('[data-provider="discord"] .disconnect-btn');
    await disconnectButton.trigger('click');

    expect(wrapper.emitted('unlink')).toHaveLength(1);
    expect(wrapper.emitted('unlink')![0]).toEqual([1]);
  });
});
```

---

#### OAuthCallback.test.ts

**Location**: `resources/public/js/views/auth/__tests__/OAuthCallback.test.ts`

**Test Cases**:
```typescript
describe('OAuthCallback', () => {
  const mockRoute = {
    params: { provider: 'discord' },
    query: { code: 'auth_code_123', state: 'state_token_456' }
  };

  it('displays loading state initially', () => {
    const wrapper = mount(OAuthCallback, {
      global: {
        mocks: {
          $route: mockRoute,
        }
      }
    });

    expect(wrapper.find('.callback-loading').exists()).toBe(true);
    expect(wrapper.text()).toContain('Completing authentication');
  });

  it('calls socialAuthService.callback with correct params', async () => {
    const callbackMock = vi.fn().mockResolvedValue({ id: 1, email: 'user@example.com' });

    socialAuthService.callback = callbackMock;

    mount(OAuthCallback, {
      global: {
        mocks: {
          $route: mockRoute,
        }
      }
    });

    await nextTick();

    expect(callbackMock).toHaveBeenCalledWith(
      'discord',
      'auth_code_123',
      'state_token_456'
    );
  });

  it('redirects to app subdomain on success', async () => {
    const callbackMock = vi.fn().mockResolvedValue({ id: 1, email: 'user@example.com' });
    socialAuthService.callback = callbackMock;

    delete window.location;
    window.location = { href: '' } as any;

    mount(OAuthCallback, {
      global: {
        mocks: {
          $route: mockRoute,
        }
      }
    });

    await nextTick();
    await flushPromises();

    expect(window.location.href).toContain('app.virtualracingleagues.localhost');
  });

  it('displays error when OAuth error present in URL', () => {
    const errorRoute = {
      params: { provider: 'discord' },
      query: { error: 'access_denied', error_description: 'User cancelled' }
    };

    const wrapper = mount(OAuthCallback, {
      global: {
        mocks: {
          $route: errorRoute,
        }
      }
    });

    expect(wrapper.find('.callback-error').exists()).toBe(true);
    expect(wrapper.text()).toContain('cancelled');
  });

  it('displays error when callback fails', async () => {
    const callbackMock = vi.fn().mockRejectedValue(new Error('Network error'));
    socialAuthService.callback = callbackMock;

    const wrapper = mount(OAuthCallback, {
      global: {
        mocks: {
          $route: mockRoute,
        }
      }
    });

    await nextTick();
    await flushPromises();

    expect(wrapper.find('.callback-error').exists()).toBe(true);
  });

  it('validates state token', async () => {
    const validateMock = vi.fn().mockReturnValue(false);
    socialAuthService.validateStateToken = validateMock;

    const wrapper = mount(OAuthCallback, {
      global: {
        mocks: {
          $route: mockRoute,
        }
      }
    });

    await nextTick();

    expect(validateMock).toHaveBeenCalledWith('state_token_456');
    expect(wrapper.find('.callback-error').exists()).toBe(true);
  });
});
```

---

### 10.2 Integration Tests

#### Login Flow with Social Auth

**Location**: `resources/public/js/views/auth/__tests__/LoginView.integration.spec.ts`

**Test Cases**:
```typescript
describe('LoginView with Social Auth', () => {
  it('allows switching between traditional and social login', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router, pinia],
      }
    });

    // Fill traditional form
    await wrapper.find('#email').setValue('user@example.com');
    await wrapper.find('#password').setValue('password123');

    // Click social button instead
    const discordButton = wrapper.findComponent(SocialLoginButton);
    await discordButton.trigger('click');

    // Should redirect to OAuth URL
    expect(window.location.href).toContain('/auth/discord/redirect');
  });

  it('displays error from failed social login callback', async () => {
    router.push('/auth/discord/callback?error=access_denied');
    await router.isReady();

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router, pinia],
      }
    });

    await flushPromises();

    expect(wrapper.text()).toContain('cancelled');
  });
});
```

---

#### Settings Page Account Linking

**Location**: `resources/app/js/views/__tests__/SettingsView.integration.spec.ts`

**Test Cases**:
```typescript
describe('SettingsView Account Linking', () => {
  it('fetches linked accounts on mount', async () => {
    const getMock = vi.fn().mockResolvedValue({ data: { data: [] } });
    apiClient.get = getMock;

    const wrapper = mount(SettingsView, {
      global: {
        plugins: [router, pinia],
      }
    });

    await flushPromises();

    expect(getMock).toHaveBeenCalledWith('/user/linked-accounts');
  });

  it('links account successfully', async () => {
    const postMock = vi.fn().mockResolvedValue({
      data: {
        data: {
          id: 1,
          provider: 'google',
          linked_at: '2024-01-01T00:00:00Z',
        }
      }
    });
    apiClient.post = postMock;

    const wrapper = mount(SettingsView);

    // Simulate OAuth callback
    await wrapper.vm.handleLinkCallback('google', 'code_123', 'state_456');

    await flushPromises();

    expect(postMock).toHaveBeenCalledWith(
      '/user/linked-accounts/google',
      { code: 'code_123', state: 'state_456' }
    );

    // Verify account is added to list
    const linkedAccounts = wrapper.findComponent(LinkedAccounts);
    expect(linkedAccounts.props('linkedAccounts')).toHaveLength(1);
  });

  it('unlinks account after confirmation', async () => {
    const deleteMock = vi.fn().mockResolvedValue({});
    apiClient.delete = deleteMock;

    const wrapper = mount(SettingsView, {
      data() {
        return {
          linkedAccounts: [
            { id: 1, provider: 'discord', linked_at: '2024-01-01' }
          ]
        };
      }
    });

    const linkedAccountsComp = wrapper.findComponent(LinkedAccounts);
    await linkedAccountsComp.vm.$emit('unlink', 1);

    await flushPromises();

    expect(deleteMock).toHaveBeenCalledWith('/user/linked-accounts/1');
    expect(wrapper.vm.linkedAccounts).toHaveLength(0);
  });
});
```

---

### 10.3 E2E Test Scenarios (Playwright)

**Location**: `tests/e2e/social-auth.spec.ts`

**Test Scenarios**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Social Authentication E2E', () => {
  test('complete Discord login flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://virtualracingleagues.localhost/login');

    // Click Discord button
    await page.click('[data-provider="discord"]');

    // Should redirect to Discord OAuth
    await expect(page).toHaveURL(/discord\.com\/oauth2\/authorize/);

    // Mock Discord authorization (in real test, use Discord's test mode)
    // ... authorize and get redirected back ...

    // Should redirect to app subdomain
    await expect(page).toHaveURL(/app\.virtualracingleagues\.localhost/);

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('link Google account in settings', async ({ page, context }) => {
    // Login first
    await page.goto('http://app.virtualracingleagues.localhost/login');
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to settings
    await page.goto('http://app.virtualracingleagues.localhost/settings');

    // Click "Connect Google"
    await page.click('[data-provider="google"] .connect-btn');

    // New tab/window opens for OAuth
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('[data-provider="google"] .connect-btn')
    ]);

    // Mock Google authorization
    // ... authorize ...

    // Should return to settings page
    await expect(page).toHaveURL(/\/settings/);

    // Verify Google account is now linked
    const googleItem = page.locator('[data-provider="google"]');
    await expect(googleItem.locator('.linked-badge')).toContainText('Connected');
  });

  test('handle OAuth cancellation gracefully', async ({ page }) => {
    await page.goto('http://virtualracingleagues.localhost/login');

    // Simulate OAuth error callback
    await page.goto(
      'http://virtualracingleagues.localhost/auth/discord/callback?error=access_denied'
    );

    // Should show error message
    await expect(page.locator('.callback-error')).toContainText('cancelled');

    // Click return to login
    await page.click('text=Return to Login');

    // Should navigate back to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('prevent unlinking last authentication method', async ({ page }) => {
    // Login with only social account
    await page.goto('http://app.virtualracingleagues.localhost/login');
    // ... login via Discord ...

    await page.goto('http://app.virtualracingleagues.localhost/settings');

    // Try to disconnect Discord (only auth method)
    await page.click('[data-provider="discord"] .disconnect-btn');

    // Should show warning dialog
    await expect(page.locator('.p-confirm-dialog')).toContainText(
      'at least one login method'
    );

    // Cancel button should be present
    await expect(page.locator('.p-confirm-dialog .p-button-secondary')).toBeVisible();
  });
});
```

---

### 10.4 Service Layer Tests

#### SocialAuthService.test.ts

**Location**: `resources/public/js/services/__tests__/socialAuthService.test.ts`

**Test Cases**:
```typescript
describe('SocialAuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('getOAuthUrl', () => {
    it('returns correct URL for login mode', () => {
      const url = socialAuthService.getOAuthUrl('discord', 'login');
      expect(url).toBe('/api/auth/discord/redirect?mode=login');
    });

    it('returns correct URL for link mode', () => {
      const url = socialAuthService.getOAuthUrl('google', 'link');
      expect(url).toBe('/api/auth/google/redirect?mode=link');
    });
  });

  describe('generateStateToken', () => {
    it('generates random 32-character string', () => {
      const state = socialAuthService.generateStateToken();
      expect(state).toHaveLength(32);
    });

    it('stores token in sessionStorage', () => {
      const state = socialAuthService.generateStateToken();
      expect(sessionStorage.getItem('oauth_state')).toBe(state);
    });
  });

  describe('validateStateToken', () => {
    it('returns true for matching state', () => {
      sessionStorage.setItem('oauth_state', 'test_state_123');
      const result = socialAuthService.validateStateToken('test_state_123');
      expect(result).toBe(true);
    });

    it('returns false for non-matching state', () => {
      sessionStorage.setItem('oauth_state', 'test_state_123');
      const result = socialAuthService.validateStateToken('wrong_state');
      expect(result).toBe(false);
    });

    it('removes state token after validation', () => {
      sessionStorage.setItem('oauth_state', 'test_state_123');
      socialAuthService.validateStateToken('test_state_123');
      expect(sessionStorage.getItem('oauth_state')).toBeNull();
    });
  });

  describe('parseOAuthError', () => {
    it('returns user-friendly message for access_denied', () => {
      const message = socialAuthService.parseOAuthError('access_denied', null);
      expect(message).toContain('cancelled');
    });

    it('returns description if error code not recognized', () => {
      const message = socialAuthService.parseOAuthError(
        'unknown_error',
        'Custom error message'
      );
      expect(message).toBe('Custom error message');
    });

    it('returns generic message if no error or description', () => {
      const message = socialAuthService.parseOAuthError(null, null);
      expect(message).toBe('Authentication failed.');
    });
  });

  describe('socialCallback', () => {
    it('calls API with correct parameters', async () => {
      const postMock = vi.fn().mockResolvedValue({
        data: {
          data: {
            user: { id: 1, email: 'user@example.com' }
          }
        }
      });
      apiClient.post = postMock;

      await socialAuthService.socialCallback('discord', 'code_123', 'state_456');

      expect(postMock).toHaveBeenCalledWith(
        '/auth/discord/callback',
        { code: 'code_123', state: 'state_456' },
        expect.any(Object)
      );
    });

    it('returns user data on success', async () => {
      const mockUser = { id: 1, email: 'user@example.com', first_name: 'John', last_name: 'Doe' };
      const postMock = vi.fn().mockResolvedValue({
        data: { data: { user: mockUser } }
      });
      apiClient.post = postMock;

      const user = await socialAuthService.socialCallback('google', 'code_123', 'state_456');

      expect(user).toEqual(mockUser);
    });
  });
});
```

---

## 11. Implementation Phases

### Phase 1: Core Components & Types (Week 1)

**Tasks**:
1. Create TypeScript types (`social.ts`)
2. Build `SocialLoginButton.vue` component
3. Build `SocialLoginButtons.vue` component
4. Write unit tests for both components
5. Create provider configuration constants

**Deliverables**:
- Fully tested, reusable social button components
- Type-safe interfaces for social auth data

---

### Phase 2: Public Site Integration (Week 1-2)

**Tasks**:
1. Create `socialAuthService.ts`
2. Update `authStore.ts` with social auth actions
3. Modify `LoginView.vue` to include social buttons
4. Modify `RegisterView.vue` to include social buttons
5. Create `OAuthCallback.vue` view
6. Add OAuth callback route
7. Write integration tests for login/register flows

**Deliverables**:
- Working social login on public site
- OAuth callback handling
- Error handling for OAuth failures

---

### Phase 3: User Dashboard Integration (Week 2)

**Tasks**:
1. Create `SettingsView.vue` in user dashboard
2. Create `LinkedAccounts.vue` component
3. Create user dashboard `socialAuthService.ts`
4. Create `settingsStore.ts` (optional)
5. Add settings route
6. Create `OAuthLinkCallback.vue` view
7. Write integration tests for account linking

**Deliverables**:
- Settings page with linked accounts section
- Account linking/unlinking functionality
- User feedback via toasts

---

### Phase 4: Polish & Accessibility (Week 3)

**Tasks**:
1. Implement all ARIA labels and roles
2. Test keyboard navigation
3. Test screen reader compatibility
4. Verify color contrast ratios
5. Add loading states and animations
6. Implement error recovery flows
7. Write E2E tests with Playwright

**Deliverables**:
- WCAG AA compliant UI
- Smooth UX with loading states
- Comprehensive E2E test coverage

---

### Phase 5: Edge Cases & Error Handling (Week 3-4)

**Tasks**:
1. Handle duplicate account linking attempts
2. Prevent unlinking last auth method
3. Handle expired OAuth states
4. Implement rate limiting feedback
5. Test network failure scenarios
6. Add retry mechanisms
7. Write edge case tests

**Deliverables**:
- Robust error handling
- User-friendly error messages
- Graceful degradation

---

## 12. Dependencies & Prerequisites

### Backend API Endpoints Required

Before frontend implementation, the following backend endpoints must be available:

**Public Site Endpoints**:
```
GET  /api/auth/{provider}/redirect          - Initiate OAuth flow
POST /api/auth/{provider}/callback          - Handle OAuth callback
```

**User Dashboard Endpoints**:
```
GET    /api/user/linked-accounts             - Get linked accounts
POST   /api/user/linked-accounts/{provider}  - Link account
DELETE /api/user/linked-accounts/{id}        - Unlink account
```

### Environment Variables

```env
# OAuth Provider Configuration
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx
DISCORD_REDIRECT_URI=http://virtualracingleagues.localhost/api/auth/discord/callback

GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://virtualracingleagues.localhost/api/auth/google/callback

APPLE_CLIENT_ID=xxx
APPLE_CLIENT_SECRET=xxx
APPLE_REDIRECT_URI=http://virtualracingleagues.localhost/api/auth/apple/callback
```

### PrimeVue Icons

Verify PrimeVue 4 includes social provider icons, or install custom icon library:

```bash
npm install @phosphor-icons/vue
```

Or use custom SVG icons stored in `/resources/public/js/assets/icons/`.

### State Management

SessionStorage is used for OAuth state tokens (CSRF protection). Ensure browser supports sessionStorage (all modern browsers do).

---

## 13. Success Criteria

### Functional Requirements

- ✅ Users can log in with Discord, Google, or Apple
- ✅ Users can register with social accounts
- ✅ Authenticated users can link/unlink social accounts
- ✅ OAuth errors are handled gracefully
- ✅ State tokens prevent CSRF attacks
- ✅ Users cannot unlink their only authentication method

### Non-Functional Requirements

- ✅ All components pass TypeScript type checking
- ✅ Unit test coverage ≥80%
- ✅ Integration tests cover all critical paths
- ✅ E2E tests validate complete user flows
- ✅ WCAG AA accessibility compliance
- ✅ Mobile responsive (tested on 320px - 1920px)
- ✅ Loading states provide user feedback within 200ms

### User Experience Goals

- ✅ Social login is faster than traditional email/password
- ✅ OAuth errors display clear, actionable messages
- ✅ Account linking feels seamless (no page reloads except OAuth redirect)
- ✅ Buttons are visually distinct and brand-appropriate
- ✅ Keyboard navigation works flawlessly

---

## 14. Future Enhancements (Out of Scope)

The following features are NOT included in this implementation plan but may be considered for future iterations:

1. **Additional Providers**: GitHub, Twitter/X, Microsoft, Facebook
2. **Multi-Account Linking**: Link multiple accounts from same provider
3. **Account Merging**: Merge duplicate accounts created via different methods
4. **Profile Data Sync**: Sync profile picture, bio from social accounts
5. **Social Sharing**: Share achievements, scores to social platforms
6. **OAuth Refresh Tokens**: Keep social connections alive long-term
7. **Admin Dashboard**: Manage user social account linkings
8. **Analytics**: Track social login usage, conversion rates
9. **Progressive Enhancement**: Partial functionality if JavaScript disabled
10. **Two-Factor Authentication**: Require 2FA for unlinking accounts

---

## 15. File Structure Summary

```
resources/
├── public/
│   └── js/
│       ├── components/
│       │   └── auth/
│       │       ├── SocialLoginButton.vue
│       │       ├── SocialLoginButtons.vue
│       │       └── __tests__/
│       │           ├── SocialLoginButton.test.ts
│       │           └── SocialLoginButtons.test.ts
│       ├── services/
│       │   ├── socialAuthService.ts
│       │   └── __tests__/
│       │       └── socialAuthService.test.ts
│       ├── stores/
│       │   └── authStore.ts (updated)
│       ├── types/
│       │   ├── social.ts (new)
│       │   └── user.ts (updated)
│       ├── views/
│       │   └── auth/
│       │       ├── LoginView.vue (updated)
│       │       ├── RegisterView.vue (updated)
│       │       ├── OAuthCallback.vue (new)
│       │       └── __tests__/
│       │           ├── LoginView.integration.spec.ts
│       │           ├── RegisterView.integration.spec.ts
│       │           └── OAuthCallback.test.ts
│       └── router/
│           └── index.ts (updated)
├── app/
│   └── js/
│       ├── components/
│       │   └── settings/
│       │       ├── LinkedAccounts.vue (new)
│       │       └── __tests__/
│       │           └── LinkedAccounts.test.ts
│       ├── services/
│       │   └── socialAuthService.ts (new)
│       ├── stores/
│       │   └── settingsStore.ts (new, optional)
│       ├── types/
│       │   └── social.ts (new)
│       ├── views/
│       │   ├── SettingsView.vue (new)
│       │   └── auth/
│       │       └── OAuthLinkCallback.vue (new)
│       └── router/
│           └── index.ts (updated)
└── tests/
    └── e2e/
        └── social-auth.spec.ts (new)
```

---

## 16. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OAuth provider downtime | High | Low | Show fallback message, allow email login |
| CSRF token mismatch | Medium | Medium | Clear error message, retry mechanism |
| Account already linked | Medium | Medium | Detect duplicate, show appropriate error |
| User cancels OAuth flow | Low | High | Graceful handling, return to login page |
| Session expires during OAuth | Medium | Low | Refresh session before redirect |
| Mobile OAuth redirect fails | High | Low | Test thoroughly on mobile browsers |
| Provider changes OAuth API | High | Low | Monitor provider changelogs, version APIs |

---

## 17. Documentation Requirements

After implementation, the following documentation must be created or updated:

1. **User Guide**: How to link/unlink social accounts
2. **Developer Docs**: Social auth architecture overview
3. **API Docs**: Backend endpoint specifications (separate doc)
4. **Troubleshooting Guide**: Common OAuth errors and solutions
5. **Security Docs**: CSRF protection, state token management
6. **Testing Docs**: How to run social auth tests locally

---

## 18. Monitoring & Analytics (Post-Launch)

Track the following metrics to measure success:

- **Adoption Rate**: % of new users choosing social login
- **Conversion Rate**: Social login vs. email registration completion
- **Error Rate**: % of OAuth flows that fail
- **Provider Popularity**: Which providers are most used
- **Account Linking Rate**: % of users linking multiple accounts
- **Support Tickets**: Social auth related issues

---

## Conclusion

This comprehensive frontend implementation plan provides a complete roadmap for adding Discord, Google, and Apple social authentication to the Vue 3 public site. The plan prioritizes:

1. **Type Safety**: Full TypeScript coverage
2. **Reusability**: Modular, composable components
3. **Accessibility**: WCAG AA compliance
4. **Testing**: Unit, integration, and E2E tests
5. **User Experience**: Smooth OAuth flows with clear feedback
6. **Maintainability**: Well-organized code structure

By following this plan phase-by-phase, the implementation will be systematic, testable, and production-ready.
