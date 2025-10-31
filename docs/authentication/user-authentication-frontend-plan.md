# User Authentication Frontend - Complete Implementation Plan

**Project:** Laravel 12 + Vue 3 Dual Dashboard Template
**Component:** Frontend (Vue 3 + TypeScript)
**Feature:** User Authentication System
**Agent:** `dev-fe-user` (Vue.js Frontend Expert)
**Date:** 2025-10-15

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [User Store (Pinia)](#2-user-store-pinia)
3. [Authentication Service](#3-authentication-service)
4. [Type Definitions](#4-type-definitions)
5. [Views](#5-views)
6. [Components](#6-components)
7. [Router Configuration](#7-router-configuration)
8. [Composables](#8-composables)
9. [Testing Strategy](#9-testing-strategy)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Architecture Overview

### File Structure

```
resources/app/
├── css/
│   └── app.css
└── js/
    ├── app.ts
    ├── router/
    │   └── index.ts (update with guards)
    ├── stores/
    │   └── userStore.ts (new)
    ├── services/
    │   ├── api.ts (update)
    │   └── authService.ts (new)
    ├── types/
    │   ├── auth.ts (new)
    │   └── user.ts (new)
    ├── views/
    │   └── auth/
    │       ├── Login.vue (new)
    │       ├── Register.vue (new)
    │       ├── VerifyEmail.vue (new)
    │       ├── ForgotPassword.vue (new)
    │       ├── ResetPassword.vue (new)
    │       └── Profile.vue (new)
    ├── components/
    │   └── layout/
    │       └── Header.vue (update)
    ├── composables/
    │   └── useAuthGuard.ts (new)
    └── __tests__/
        ├── stores/
        │   └── userStore.test.ts (new)
        ├── services/
        │   └── authService.test.ts (new)
        └── views/
            └── auth/
                ├── Login.test.ts (new)
                ├── Register.test.ts (new)
                └── Profile.test.ts (new)
```

### Key Differences from Admin Authentication

| Aspect | Admin | User |
|--------|-------|------|
| **Storage** | sessionStorage | localStorage |
| **Persistence** | Session only | Persistent |
| **Registration** | No | Yes (public) |
| **Email Verification** | No | Yes (required) |
| **Password Reset** | No | Yes (self-service) |
| **Roles** | Yes | No (future) |

---

## 2. User Store (Pinia)

### 2.1 Create User Store

**File:** `resources/app/js/stores/userStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@app/types/user';
import type { LoginCredentials, RegisterData } from '@app/types/auth';
import { authService } from '@app/services/authService';

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  const authCheckPromise = ref<Promise<boolean> | null>(null);

  // Getters
  const userName = computed((): string => user.value?.name || 'Guest');
  const userEmail = computed((): string => user.value?.email || '');
  const isEmailVerified = computed((): boolean => user.value?.email_verified_at !== null);

  // Actions
  async function register(data: RegisterData): Promise<void> {
    isLoading.value = true;
    try {
      await authService.register(data);
      // User is registered but not logged in yet (needs email verification)
    } finally {
      isLoading.value = false;
    }
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true;
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  }

  async function checkAuth(): Promise<boolean> {
    // Prevent concurrent auth checks
    if (authCheckPromise.value) {
      return authCheckPromise.value;
    }

    authCheckPromise.value = (async () => {
      try {
        const userData = await authService.checkAuth();

        if (userData) {
          setUser(userData);
          return true;
        } else {
          clearAuth();
          return false;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        clearAuth();
        return false;
      } finally {
        authCheckPromise.value = null;
      }
    })();

    return authCheckPromise.value;
  }

  async function resendVerificationEmail(): Promise<void> {
    await authService.resendVerificationEmail();
  }

  async function updateProfile(data: {
    name: string;
    email: string;
    password?: string;
    current_password?: string;
  }): Promise<void> {
    isLoading.value = true;
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } finally {
      isLoading.value = false;
    }
  }

  function setUser(userData: User): void {
    user.value = userData;
    isAuthenticated.value = true;
  }

  function clearAuth(): void {
    user.value = null;
    isAuthenticated.value = false;
  }

  return {
    // State
    user,
    isAuthenticated,
    isLoading,

    // Getters
    userName,
    userEmail,
    isEmailVerified,

    // Actions
    register,
    login,
    logout,
    checkAuth,
    resendVerificationEmail,
    updateProfile,
  };
}, {
  persist: {
    storage: localStorage,
    pick: ['user', 'isAuthenticated'],
  },
});
```

---

## 3. Authentication Service

### 3.1 Update API Service

**File:** `resources/app/js/services/api.ts`

Add CSRF token handling and auth interceptors (similar to admin):

```typescript
import axios, { type AxiosInstance, type AxiosError } from 'axios';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for CSRF token
    this.client.interceptors.request.use((config) => {
      if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
        const token = this.getCSRFToken();
        if (token && config.headers) {
          config.headers['X-CSRF-TOKEN'] = token;
          config.headers['X-XSRF-TOKEN'] = token;
        }
      }
      return config;
    });

    // Response interceptor for errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 419 CSRF token mismatch
        if (error.response?.status === 419) {
          await this.fetchCSRFToken();
          const originalRequest = error.config;
          if (originalRequest) {
            return this.client.request(originalRequest);
          }
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getCSRFToken(): string | null {
    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find(c => c.trim().startsWith('XSRF-TOKEN='));
    return xsrfCookie ? decodeURIComponent(xsrfCookie.split('=')[1]) : null;
  }

  async fetchCSRFToken(): Promise<void> {
    await this.client.get('/csrf-cookie');
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiService = new ApiService();
export const apiClient = apiService.getClient();
```

### 3.2 Create Auth Service

**File:** `resources/app/js/services/authService.ts`

```typescript
import { apiClient, apiService } from './api';
import type { User } from '@app/types/user';
import type { LoginCredentials, RegisterData } from '@app/types/auth';

class AuthService {
  async register(data: RegisterData, signal?: AbortSignal): Promise<void> {
    await apiService.fetchCSRFToken();
    await apiClient.post('/register', data, { signal });
  }

  async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<User> {
    await apiService.fetchCSRFToken();

    const response = await apiClient.post<{ data: { user: User } }>(
      '/login',
      credentials,
      { signal }
    );

    return response.data.data.user;
  }

  async logout(signal?: AbortSignal): Promise<void> {
    try {
      await apiClient.post('/logout', {}, { signal });
    } catch (error) {
      // Always clear local state even if API call fails
      console.error('Logout API error:', error);
    }
  }

  async checkAuth(signal?: AbortSignal): Promise<User | null> {
    try {
      const response = await apiClient.get<{ data: { user: User } }>(
        '/me',
        { signal }
      );
      return response.data.data.user;
    } catch (error) {
      return null;
    }
  }

  async resendVerificationEmail(signal?: AbortSignal): Promise<void> {
    await apiClient.post('/email/resend', {}, { signal });
  }

  async requestPasswordReset(email: string, signal?: AbortSignal): Promise<void> {
    await apiService.fetchCSRFToken();
    await apiClient.post('/forgot-password', { email }, { signal });
  }

  async resetPassword(
    data: { email: string; token: string; password: string; password_confirmation: string },
    signal?: AbortSignal
  ): Promise<void> {
    await apiService.fetchCSRFToken();
    await apiClient.post('/reset-password', data, { signal });
  }

  async updateProfile(
    data: {
      name: string;
      email: string;
      password?: string;
      password_confirmation?: string;
      current_password?: string;
    },
    signal?: AbortSignal
  ): Promise<User> {
    const response = await apiClient.put<{ data: { user: User } }>(
      '/profile',
      data,
      { signal }
    );

    return response.data.data.user;
  }
}

export const authService = new AuthService();
```

---

## 4. Type Definitions

### 4.1 User Type

**File:** `resources/app/js/types/user.ts`

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at?: string;
  updated_at?: string;
}
```

### 4.2 Auth Types

**File:** `resources/app/js/types/auth.ts`

```typescript
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}
```

---

## 5. Views

### 5.1 Register View

**File:** `resources/app/js/views/Register.vue`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';
import { useToast } from 'primevue/usetoast';
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@app/types/errors';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

// Form data
const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');

// Form state
const isSubmitting = ref(false);
const errorMessage = ref('');
const nameError = ref('');
const emailError = ref('');
const passwordError = ref('');

const isFormValid = computed(() => {
  return name.value.trim() !== '' &&
         email.value.trim() !== '' &&
         password.value.trim() !== '' &&
         passwordConfirmation.value.trim() !== '';
});

const validateName = (): boolean => {
  nameError.value = '';
  if (!name.value.trim()) {
    nameError.value = 'Name is required';
    return false;
  }
  return true;
};

const validateEmail = (): boolean => {
  emailError.value = '';
  if (!email.value.trim()) {
    emailError.value = 'Email is required';
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address';
    return false;
  }
  return true;
};

const validatePassword = (): boolean => {
  passwordError.value = '';
  if (!password.value.trim()) {
    passwordError.value = 'Password is required';
    return false;
  }
  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters';
    return false;
  }
  if (password.value !== passwordConfirmation.value) {
    passwordError.value = 'Passwords do not match';
    return false;
  }
  return true;
};

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  nameError.value = '';
  emailError.value = '';
  passwordError.value = '';

  const isNameValid = validateName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isNameValid || !isEmailValid || !isPasswordValid) {
    return;
  }

  isSubmitting.value = true;

  try {
    await userStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });

    toast.add({
      severity: 'success',
      summary: 'Registration Successful',
      detail: 'Please check your email to verify your account.',
      life: 5000,
    });

    router.push({ name: 'verify-email' });
  } catch (error: any) {
    if (isAxiosError(error) && hasValidationErrors(error)) {
      const errors = error.response?.data?.errors;
      if (errors?.name) nameError.value = errors.name[0];
      if (errors?.email) emailError.value = errors.email[0];
      if (errors?.password) passwordError.value = errors.password[0];
      errorMessage.value = error.response?.data?.message || 'Registration failed. Please check your input.';
    } else {
      errorMessage.value = getErrorMessage(error, 'Registration failed. Please try again.');
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p class="text-gray-600">Sign up to get started</p>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Registration Form -->
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Name Field -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <InputText
              id="name"
              v-model="name"
              type="text"
              placeholder="John Doe"
              :class="{ 'p-invalid': nameError }"
              class="w-full"
              :disabled="isSubmitting"
              @input="nameError = ''"
            />
            <small v-if="nameError" class="text-red-600 mt-1 block">
              {{ nameError }}
            </small>
          </div>

          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="john@example.com"
              :class="{ 'p-invalid': emailError }"
              class="w-full"
              :disabled="isSubmitting"
              autocomplete="email"
              @input="emailError = ''"
            />
            <small v-if="emailError" class="text-red-600 mt-1 block">
              {{ emailError }}
            </small>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :class="{ 'p-invalid': passwordError }"
              class="w-full"
              :disabled="isSubmitting"
              :toggle-mask="true"
              autocomplete="new-password"
              @input="passwordError = ''"
            />
            <small v-if="passwordError" class="text-red-600 mt-1 block">
              {{ passwordError }}
            </small>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label for="password-confirmation" class="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <Password
              id="password-confirmation"
              v-model="passwordConfirmation"
              placeholder="Confirm your password"
              class="w-full"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="new-password"
              @input="passwordError = ''"
            />
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Create Account"
            icon="pi pi-user-plus"
            :loading="isSubmitting"
            :disabled="!isFormValid || isSubmitting"
            class="w-full"
            severity="primary"
          />
        </form>

        <!-- Login Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Already have an account?
            <router-link
              to="/login"
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 5.2 Login View

**File:** `resources/app/js/views/Login.vue`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';
import { isAxiosError, hasValidationErrors, getErrorMessage } from '@app/types/errors';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Message from 'primevue/message';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// Form data
const email = ref('');
const password = ref('');
const remember = ref(false);

// Form state
const isSubmitting = ref(false);
const errorMessage = ref('');
const emailError = ref('');
const passwordError = ref('');

const isFormValid = computed(() => {
  return email.value.trim() !== '' && password.value.trim() !== '';
});

const validateEmail = (): boolean => {
  emailError.value = '';
  if (!email.value.trim()) {
    emailError.value = 'Email is required';
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address';
    return false;
  }
  return true;
};

const validatePassword = (): boolean => {
  passwordError.value = '';
  if (!password.value.trim()) {
    passwordError.value = 'Password is required';
    return false;
  }
  return true;
};

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  emailError.value = '';
  passwordError.value = '';

  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isEmailValid || !isPasswordValid) {
    return;
  }

  isSubmitting.value = true;

  try {
    await userStore.login({
      email: email.value,
      password: password.value,
      remember: remember.value,
    });

    // Redirect to return URL or home
    const returnUrl = route.query.redirect as string;
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.includes('/login')) {
      await router.replace(returnUrl);
    } else {
      await router.replace({ name: 'home' });
    }
  } catch (error: any) {
    if (isAxiosError(error)) {
      if (hasValidationErrors(error)) {
        errorMessage.value = 'Invalid email or password. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage.value = 'Invalid email or password. Please try again.';
      } else if (error.response?.status === 429) {
        errorMessage.value = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage.value = 'Server error. Please try again later.';
      } else {
        errorMessage.value = 'Login failed. Please try again.';
      }
    } else {
      errorMessage.value = getErrorMessage(error, 'Login failed. Please try again.');
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p class="text-gray-600">Sign in to your account</p>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Login Form -->
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="john@example.com"
              :class="{ 'p-invalid': emailError }"
              class="w-full"
              :disabled="isSubmitting"
              autocomplete="email"
              @input="emailError = ''"
            />
            <small v-if="emailError" class="text-red-600 mt-1 block">
              {{ emailError }}
            </small>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :class="{ 'p-invalid': passwordError }"
              class="w-full"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="current-password"
              @input="passwordError = ''"
            />
            <small v-if="passwordError" class="text-red-600 mt-1 block">
              {{ passwordError }}
            </small>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <Checkbox
                v-model="remember"
                input-id="remember"
                :binary="true"
                :disabled="isSubmitting"
              />
              <label for="remember" class="ml-2 text-sm text-gray-700 cursor-pointer">
                Remember me
              </label>
            </div>
            <router-link
              to="/forgot-password"
              class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot password?
            </router-link>
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Sign In"
            icon="pi pi-sign-in"
            :loading="isSubmitting"
            :disabled="!isFormValid || isSubmitting"
            class="w-full"
            severity="primary"
          />
        </form>

        <!-- Register Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <router-link
              to="/register"
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 5.3 Email Verification View

**File:** `resources/app/js/views/VerifyEmail.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@app/stores/userStore';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Message from 'primevue/message';

const userStore = useUserStore();
const toast = useToast();

const isResending = ref(false);

const resendVerification = async (): Promise<void> => {
  isResending.value = true;

  try {
    await userStore.resendVerificationEmail();

    toast.add({
      severity: 'success',
      summary: 'Email Sent',
      detail: 'A new verification link has been sent to your email address.',
      life: 5000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to resend verification email. Please try again.',
      life: 5000,
    });
  } finally {
    isResending.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <i class="pi pi-envelope text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p class="text-gray-600">
            We've sent a verification link to your email address.
            Please check your inbox and click the link to verify your account.
          </p>
        </div>

        <!-- Info Message -->
        <Message severity="info" :closable="false" class="mb-6">
          <p class="text-sm">
            Didn't receive the email? Check your spam folder or request a new verification link.
          </p>
        </Message>

        <!-- Resend Button -->
        <Button
          label="Resend Verification Email"
          icon="pi pi-refresh"
          :loading="isResending"
          :disabled="isResending"
          class="w-full"
          severity="primary"
          @click="resendVerification"
        />

        <!-- Back to Login -->
        <div class="mt-6 text-center">
          <router-link
            to="/login"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 5.4 Forgot Password View

**File:** `resources/app/js/views/ForgotPassword.vue`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { authService } from '@app/services/authService';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';

const toast = useToast();

const email = ref('');
const isSubmitting = ref(false);
const emailSent = ref(false);
const errorMessage = ref('');
const emailError = ref('');

const isFormValid = computed(() => email.value.trim() !== '');

const validateEmail = (): boolean => {
  emailError.value = '';
  if (!email.value.trim()) {
    emailError.value = 'Email is required';
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address';
    return false;
  }
  return true;
};

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  emailError.value = '';

  if (!validateEmail()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await authService.requestPasswordReset(email.value);
    emailSent.value = true;

    toast.add({
      severity: 'success',
      summary: 'Email Sent',
      detail: 'Password reset link has been sent to your email.',
      life: 5000,
    });
  } catch (error: any) {
    errorMessage.value = 'Failed to send reset link. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <i class="pi pi-lock text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p class="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <!-- Success Message -->
        <Message v-if="emailSent" severity="success" :closable="false" class="mb-6">
          Password reset link has been sent to your email. Please check your inbox.
        </Message>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Form -->
        <form v-if="!emailSent" class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="john@example.com"
              :class="{ 'p-invalid': emailError }"
              class="w-full"
              :disabled="isSubmitting"
              autocomplete="email"
              @input="emailError = ''"
            />
            <small v-if="emailError" class="text-red-600 mt-1 block">
              {{ emailError }}
            </small>
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Send Reset Link"
            icon="pi pi-send"
            :loading="isSubmitting"
            :disabled="!isFormValid || isSubmitting"
            class="w-full"
            severity="primary"
          />
        </form>

        <!-- Back to Login -->
        <div class="mt-6 text-center">
          <router-link
            to="/login"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 5.5 Reset Password View

**File:** `resources/app/js/views/ResetPassword.vue`

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '@app/services/authService';
import { useToast } from 'primevue/usetoast';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const email = ref('');
const token = ref('');
const password = ref('');
const passwordConfirmation = ref('');

const isSubmitting = ref(false);
const errorMessage = ref('');
const passwordError = ref('');

onMounted(() => {
  email.value = (route.query.email as string) || '';
  token.value = (route.query.token as string) || '';

  if (!email.value || !token.value) {
    errorMessage.value = 'Invalid reset link. Please request a new password reset.';
  }
});

const isFormValid = computed(() => {
  return password.value.trim() !== '' && passwordConfirmation.value.trim() !== '';
});

const validatePassword = (): boolean => {
  passwordError.value = '';
  if (!password.value.trim()) {
    passwordError.value = 'Password is required';
    return false;
  }
  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters';
    return false;
  }
  if (password.value !== passwordConfirmation.value) {
    passwordError.value = 'Passwords do not match';
    return false;
  }
  return true;
};

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  passwordError.value = '';

  if (!validatePassword()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await authService.resetPassword({
      email: email.value,
      token: token.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });

    toast.add({
      severity: 'success',
      summary: 'Password Reset Successful',
      detail: 'Your password has been reset. You can now log in with your new password.',
      life: 5000,
    });

    router.push({ name: 'login' });
  } catch (error: any) {
    errorMessage.value = 'Failed to reset password. The link may have expired. Please request a new reset link.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <i class="pi pi-key text-3xl text-blue-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p class="text-gray-600">Enter your new password below</p>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-6">
          {{ errorMessage }}
        </Message>

        <!-- Form -->
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your new password"
              :class="{ 'p-invalid': passwordError }"
              class="w-full"
              :disabled="isSubmitting"
              :toggle-mask="true"
              autocomplete="new-password"
              @input="passwordError = ''"
            />
            <small v-if="passwordError" class="text-red-600 mt-1 block">
              {{ passwordError }}
            </small>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label for="password-confirmation" class="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <Password
              id="password-confirmation"
              v-model="passwordConfirmation"
              placeholder="Confirm your new password"
              class="w-full"
              :disabled="isSubmitting"
              :feedback="false"
              :toggle-mask="true"
              autocomplete="new-password"
              @input="passwordError = ''"
            />
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Reset Password"
            icon="pi pi-check"
            :loading="isSubmitting"
            :disabled="!isFormValid || isSubmitting"
            class="w-full"
            severity="primary"
          />
        </form>

        <!-- Back to Login -->
        <div class="mt-6 text-center">
          <router-link
            to="/login"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 5.6 Profile View

**File:** `resources/app/js/views/Profile.vue`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@app/stores/userStore';
import { useToast } from 'primevue/usetoast';
import { isAxiosError, hasValidationErrors } from '@app/types/errors';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Card from 'primevue/card';

const userStore = useUserStore();
const toast = useToast();

// Form data
const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const currentPassword = ref('');

// Form state
const isSubmitting = ref(false);
const errorMessage = ref('');
const nameError = ref('');
const emailError = ref('');
const passwordError = ref('');
const currentPasswordError = ref('');

onMounted(() => {
  if (userStore.user) {
    name.value = userStore.user.name;
    email.value = userStore.user.email;
  }
});

const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  nameError.value = '';
  emailError.value = '';
  passwordError.value = '';
  currentPasswordError.value = '';

  // Validate name
  if (!name.value.trim()) {
    nameError.value = 'Name is required';
    return;
  }

  // Validate email
  if (!email.value.trim()) {
    emailError.value = 'Email is required';
    return;
  }

  // If changing password, validate it
  if (password.value || passwordConfirmation.value || currentPassword.value) {
    if (!currentPassword.value) {
      currentPasswordError.value = 'Current password is required to change password';
      return;
    }
    if (!password.value) {
      passwordError.value = 'New password is required';
      return;
    }
    if (password.value.length < 8) {
      passwordError.value = 'Password must be at least 8 characters';
      return;
    }
    if (password.value !== passwordConfirmation.value) {
      passwordError.value = 'Passwords do not match';
      return;
    }
  }

  isSubmitting.value = true;

  try {
    const updateData: any = {
      name: name.value,
      email: email.value,
    };

    if (password.value) {
      updateData.password = password.value;
      updateData.password_confirmation = passwordConfirmation.value;
      updateData.current_password = currentPassword.value;
    }

    await userStore.updateProfile(updateData);

    // Clear password fields
    password.value = '';
    passwordConfirmation.value = '';
    currentPassword.value = '';

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Profile updated successfully',
      life: 3000,
    });
  } catch (error: any) {
    if (isAxiosError(error) && hasValidationErrors(error)) {
      const errors = error.response?.data?.errors;
      if (errors?.name) nameError.value = errors.name[0];
      if (errors?.email) emailError.value = errors.email[0];
      if (errors?.password) passwordError.value = errors.password[0];
      if (errors?.current_password) currentPasswordError.value = errors.current_password[0];
      errorMessage.value = error.response?.data?.message || 'Failed to update profile';
    } else {
      errorMessage.value = 'Failed to update profile. Please try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <Card>
        <template #content>
          <!-- Error Message -->
          <Message v-if="errorMessage" severity="error" :closable="true" class="mb-6">
            {{ errorMessage }}
          </Message>

          <form class="space-y-6" @submit.prevent="handleSubmit">
            <!-- Name Field -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <InputText
                id="name"
                v-model="name"
                type="text"
                :class="{ 'p-invalid': nameError }"
                class="w-full"
                :disabled="isSubmitting"
              />
              <small v-if="nameError" class="text-red-600 mt-1 block">
                {{ nameError }}
              </small>
            </div>

            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <InputText
                id="email"
                v-model="email"
                type="email"
                :class="{ 'p-invalid': emailError }"
                class="w-full"
                :disabled="isSubmitting"
                autocomplete="email"
              />
              <small v-if="emailError" class="text-red-600 mt-1 block">
                {{ emailError }}
              </small>
              <small v-if="!userStore.isEmailVerified" class="text-orange-600 mt-1 block">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                Email not verified. Please check your inbox.
              </small>
            </div>

            <div class="border-t pt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              <p class="text-sm text-gray-600 mb-4">
                Leave blank if you don't want to change your password
              </p>

              <!-- Current Password -->
              <div class="mb-4">
                <label for="current-password" class="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <Password
                  id="current-password"
                  v-model="currentPassword"
                  placeholder="Enter current password"
                  :class="{ 'p-invalid': currentPasswordError }"
                  class="w-full"
                  :disabled="isSubmitting"
                  :feedback="false"
                  :toggle-mask="true"
                  autocomplete="current-password"
                />
                <small v-if="currentPasswordError" class="text-red-600 mt-1 block">
                  {{ currentPasswordError }}
                </small>
              </div>

              <!-- New Password -->
              <div class="mb-4">
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <Password
                  id="password"
                  v-model="password"
                  placeholder="Enter new password"
                  :class="{ 'p-invalid': passwordError }"
                  class="w-full"
                  :disabled="isSubmitting"
                  :toggle-mask="true"
                  autocomplete="new-password"
                />
                <small v-if="passwordError" class="text-red-600 mt-1 block">
                  {{ passwordError }}
                </small>
              </div>

              <!-- Confirm New Password -->
              <div>
                <label for="password-confirmation" class="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <Password
                  id="password-confirmation"
                  v-model="passwordConfirmation"
                  placeholder="Confirm new password"
                  class="w-full"
                  :disabled="isSubmitting"
                  :feedback="false"
                  :toggle-mask="true"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
              <Button
                type="submit"
                label="Update Profile"
                icon="pi pi-save"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                severity="primary"
              />
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>
```

---

## 6. Components

### 6.1 Update Header Component

**File:** `resources/app/js/components/layout/Header.vue`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';

const router = useRouter();
const userStore = useUserStore();
const userMenu = ref();

const menuItems = computed<MenuItem[]>(() => [
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => router.push({ name: 'profile' }),
  },
  {
    separator: true,
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: handleLogout,
  },
]);

const toggleUserMenu = (event: Event) => {
  userMenu.value.toggle(event);
};

async function handleLogout() {
  await userStore.logout();
  router.push({ name: 'home' });
}
</script>

<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center">
          <span class="text-xl font-bold text-blue-600">Your App</span>
        </router-link>

        <!-- Navigation -->
        <nav class="flex items-center gap-4">
          <!-- Unauthenticated: Show Login & Register -->
          <template v-if="!userStore.isAuthenticated">
            <Button
              label="Login"
              icon="pi pi-sign-in"
              severity="secondary"
              outlined
              @click="router.push({ name: 'login' })"
            />
            <Button
              label="Register"
              icon="pi pi-user-plus"
              severity="primary"
              @click="router.push({ name: 'register' })"
            />
          </template>

          <!-- Authenticated: Show User Dropdown -->
          <template v-else>
            <Button
              type="button"
              :label="userStore.userName"
              icon="pi pi-user"
              severity="secondary"
              outlined
              @click="toggleUserMenu"
            />
            <Menu ref="userMenu" :model="menuItems" :popup="true" />
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>
```

---

## 7. Router Configuration

### 7.1 Update Router with Guards

**File:** `resources/app/js/router/index.ts`

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';
import HomeView from '@app/views/HomeView.vue';
import Login from '@app/views/auth/Login.vue';
import Register from '@app/views/auth/Register.vue';
import VerifyEmail from '@app/views/auth/VerifyEmail.vue';
import ForgotPassword from '@app/views/auth/ForgotPassword.vue';
import ResetPassword from '@app/views/auth/ResetPassword.vue';
import Profile from '@app/views/auth/Profile.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Home',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        title: 'Login',
        isPublic: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: {
        title: 'Register',
        isPublic: true,
      },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: VerifyEmail,
      meta: {
        title: 'Verify Email',
        requiresAuth: true,
      },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPassword,
      meta: {
        title: 'Forgot Password',
        isPublic: true,
      },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPassword,
      meta: {
        title: 'Reset Password',
        isPublic: true,
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: {
        title: 'Profile',
        requiresAuth: true,
      },
    },
  ],
});

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  // Set page title
  const title = to.meta.title as string;
  document.title = title ? `${title} - Your App` : 'Your App';

  // Check if route is public
  const isPublicRoute = to.meta.isPublic === true;
  if (isPublicRoute) {
    // If already authenticated and going to login/register, redirect to home
    if ((to.name === 'login' || to.name === 'register') && userStore.isAuthenticated) {
      next({ name: 'home' });
      return;
    }
    next();
    return;
  }

  // Check if route requires authentication
  const requiresAuth = to.meta.requiresAuth === true;
  if (requiresAuth) {
    // Always check auth status to ensure it's current
    const isAuthenticated = await userStore.checkAuth();

    if (!isAuthenticated) {
      // Redirect to login with return URL
      next({
        name: 'login',
        query: { redirect: to.fullPath },
      });
      return;
    }
  }

  // Allow navigation
  next();
});

export default router;
```

---

## 8. Composables

### 8.1 Auth Guard Composable

**File:** `resources/app/js/composables/useAuthGuard.ts`

```typescript
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@app/stores/userStore';

export function useAuthGuard() {
  const router = useRouter();
  const userStore = useUserStore();

  const isAuthenticated = computed(() => userStore.isAuthenticated);
  const isEmailVerified = computed(() => userStore.isEmailVerified);

  const requireAuth = async (): Promise<boolean> => {
    const authenticated = await userStore.checkAuth();

    if (!authenticated) {
      router.push({
        name: 'login',
        query: { redirect: router.currentRoute.value.fullPath },
      });
      return false;
    }

    return true;
  };

  const requireVerified = async (): Promise<boolean> => {
    const authenticated = await requireAuth();

    if (!authenticated) {
      return false;
    }

    if (!isEmailVerified.value) {
      router.push({ name: 'verify-email' });
      return false;
    }

    return true;
  };

  return {
    isAuthenticated,
    isEmailVerified,
    requireAuth,
    requireVerified,
  };
}
```

---

## 9. Testing Strategy

### 9.1 User Store Tests

**File:** `resources/app/js/__tests__/stores/userStore.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@app/stores/userStore';
import { authService } from '@app/services/authService';

vi.mock('@app/services/authService');

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const userStore = useUserStore();

    expect(userStore.user).toBeNull();
    expect(userStore.isAuthenticated).toBe(false);
    expect(userStore.isLoading).toBe(false);
  });

  it('should set user on successful login', async () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };

    vi.mocked(authService.login).mockResolvedValue(mockUser);

    const userStore = useUserStore();
    await userStore.login({ email: 'john@example.com', password: 'password' });

    expect(userStore.user).toEqual(mockUser);
    expect(userStore.isAuthenticated).toBe(true);
  });

  it('should clear user on logout', async () => {
    const userStore = useUserStore();

    // Set initial user
    userStore.user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      email_verified_at: null,
    };
    userStore.isAuthenticated = true;

    await userStore.logout();

    expect(userStore.user).toBeNull();
    expect(userStore.isAuthenticated).toBe(false);
  });
});
```

### 9.2 Login View Tests

**File:** `resources/app/js/__tests__/views/auth/Login.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Login from '@app/views/auth/Login.vue';
import PrimeVue from 'primevue/config';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login },
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
  ],
});

describe('Login.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should render login form', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [router, PrimeVue],
      },
    });

    expect(wrapper.find('h1').text()).toContain('Welcome Back');
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it('should validate email field', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [router, PrimeVue],
      },
    });

    const emailInput = wrapper.find('input[type="email"]');
    await emailInput.setValue('invalid-email');

    const submitButton = wrapper.find('button[type="submit"]');
    await submitButton.trigger('submit');

    // Should show validation error
    expect(wrapper.text()).toContain('valid email');
  });
});
```

---

## 10. Implementation Checklist

### Store & Services
- [ ] Create `userStore.ts` with all actions and getters
- [ ] Update `api.ts` with CSRF token handling
- [ ] Create `authService.ts` with all methods
- [ ] Configure Pinia persistence for user store

### Type Definitions
- [ ] Create `user.ts` type definition
- [ ] Create `auth.ts` type definitions
- [ ] Create error types and helpers

### Views
- [ ] Create `Login.vue` with validation
- [ ] Create `Register.vue` with validation
- [ ] Create `VerifyEmail.vue`
- [ ] Create `ForgotPassword.vue`
- [ ] Create `ResetPassword.vue`
- [ ] Create `Profile.vue` with update functionality

### Components
- [ ] Update `Header.vue` with dynamic auth UI
- [ ] Add user dropdown menu

### Router
- [ ] Add all auth routes
- [ ] Implement route guards
- [ ] Configure meta fields

### Composables
- [ ] Create `useAuthGuard.ts` composable

### Testing
- [ ] Write tests for `userStore`
- [ ] Write tests for `authService`
- [ ] Write tests for `Login.vue`
- [ ] Write tests for `Register.vue`
- [ ] Write tests for `Profile.vue`
- [ ] Ensure TypeScript strict mode passes
- [ ] Ensure all Vitest tests pass

### Integration
- [ ] Test complete registration flow
- [ ] Test complete login flow
- [ ] Test email verification flow
- [ ] Test password reset flow
- [ ] Test profile update flow
- [ ] Test route guards
- [ ] Test logout flow

---

## Next Steps

1. Review this plan with the `dev-fe-user` agent
2. Implement each section sequentially
3. Test each feature thoroughly
4. Integrate with backend API
5. Document any deviations or issues

---

**Agent:** `dev-fe-user`
**Prepared by:** Claude Code
**Last Updated:** 2025-10-15
