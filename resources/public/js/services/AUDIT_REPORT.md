# Resources/Public Services Audit Report
**Date:** 2025-12-07
**Directory:** /var/www/resources/public/js/services

## Executive Summary

✅ **All services are actively used**
✅ **All exported functions and classes are being utilized**
✅ **No unused code detected**

## Services Found

### 1. `/var/www/resources/public/js/services/api.ts`

#### Exports:
- `apiService` (instance of ApiService class)
- `apiClient` (AxiosInstance from apiService.getClient())

#### Class: ApiService
**Public Methods:**
- `getClient(): AxiosInstance` - ✅ USED (exports apiClient)
- `fetchCSRFToken(): Promise<void>` - ✅ USED

**Private Methods:**
- `setupInterceptors(): void` - ✅ USED (called in constructor)
- `getCSRFToken(): string | null` - ✅ USED (called in interceptor)

#### Usage Analysis:

**apiService Usage:**
- `/var/www/resources/public/js/services/authService.ts` (lines 7, 12, 44, 52)
  - `apiService.fetchCSRFToken()` - Called before POST requests requiring CSRF token

**apiClient Usage:**
- `/var/www/resources/public/js/services/authService.ts` (lines 8, 14, 23, 32, 40, 45, 53)
  - `apiClient.post()` - Used for register, login, logout, resend email, forgot password, reset password
  - `apiClient.get()` - Used for checkAuth (/me endpoint)

**Internal Code:**
All private methods and interceptor setup code is used internally by the class.

---

### 2. `/var/www/resources/public/js/services/authService.ts`

#### Exports:
- `authService` (instance of AuthService class)

#### Class: AuthService
**Public Methods:**
1. `register(data: RegisterData, signal?: AbortSignal): Promise<void>` - ✅ USED
2. `login(credentials: LoginCredentials, signal?: AbortSignal): Promise<User>` - ✅ USED
3. `logout(signal?: AbortSignal): Promise<void>` - ✅ USED
4. `checkAuth(signal?: AbortSignal): Promise<User | null>` - ✅ USED
5. `resendVerificationEmail(signal?: AbortSignal): Promise<void>` - ✅ USED
6. `requestPasswordReset(email: string, signal?: AbortSignal): Promise<void>` - ✅ USED
7. `resetPassword(data: {...}, signal?: AbortSignal): Promise<void>` - ✅ USED

#### Usage Analysis:

**authService.register()**
- `/var/www/resources/public/js/stores/authStore.ts:32`

**authService.login()**
- `/var/www/resources/public/js/stores/authStore.ts:43`

**authService.logout()**
- `/var/www/resources/public/js/stores/authStore.ts:56`

**authService.checkAuth()**
- `/var/www/resources/public/js/stores/authStore.ts:74`

**authService.resendVerificationEmail()**
- `/var/www/resources/public/js/stores/authStore.ts:96`

**authService.requestPasswordReset()**
- `/var/www/resources/public/js/views/auth/ForgotPasswordView.vue:43`
- `/var/www/resources/public/js/views/auth/__tests__/ForgotPasswordView.spec.ts` (test mocks)

**authService.resetPassword()**
- `/var/www/resources/public/js/views/auth/ResetPasswordView.vue:63`
- `/var/www/resources/public/js/views/auth/__tests__/ResetPasswordView.spec.ts` (test mocks)

---

## Architecture Pattern Analysis

### Service Layer Architecture
The codebase follows a clean **3-tier architecture** for authentication:

```
Views (ForgotPasswordView, ResetPasswordView)
    ↓
authService (direct calls for password reset flows)
    ↓
apiClient/apiService (HTTP abstraction)
```

```
Views (LoginView, RegisterView, etc.)
    ↓
authStore (Pinia store)
    ↓
authService (business logic)
    ↓
apiClient/apiService (HTTP abstraction)
```

### Design Observations

**✅ Good Patterns:**
1. **Separation of Concerns**: API layer (`api.ts`) is separate from business logic (`authService.ts`)
2. **CSRF Protection**: Automatic CSRF token handling in interceptors
3. **Error Recovery**: 419 CSRF mismatch auto-retry logic
4. **TypeScript Safety**: Full type coverage with proper interfaces
5. **Abort Signal Support**: All methods support request cancellation
6. **Centralized HTTP Client**: Single axios instance with consistent configuration

**🔄 Mixed Usage Pattern:**
- Most auth operations go through `authStore` (good - centralized state management)
- Password reset flows call `authService` directly from views (acceptable - stateless operations)

---

## Files Using Services

### Direct Service Imports:
1. `/var/www/resources/public/js/services/authService.ts` - imports `apiService`, `apiClient`
2. `/var/www/resources/public/js/stores/authStore.ts` - imports `authService`
3. `/var/www/resources/public/js/views/auth/ForgotPasswordView.vue` - imports `authService`
4. `/var/www/resources/public/js/views/auth/ResetPasswordView.vue` - imports `authService`
5. `/var/www/resources/public/js/views/auth/__tests__/ForgotPasswordView.spec.ts` - imports `authService` (testing)
6. `/var/www/resources/public/js/views/auth/__tests__/ResetPasswordView.spec.ts` - imports `authService` (testing)

---

## Recommendations

### ✅ DO NOT REMOVE ANYTHING
All code in the services directory is actively used and necessary.

### 💡 Optional Improvements (NOT urgent)

1. **Consider Consolidating Password Reset Flow**
   - Currently `ForgotPasswordView` and `ResetPasswordView` call `authService` directly
   - Could add these methods to `authStore` for consistency (but not necessary)

2. **API Service Documentation**
   - Consider adding JSDoc comments to public methods
   - Document the CSRF retry behavior

3. **Error Handling Enhancement**
   - The `logout()` method in authService catches errors but always succeeds
   - Consider exposing error state for better UX

4. **Type Export Consolidation**
   - `LoginCredentials`, `RegisterData` types are imported in multiple places
   - Consider a central types barrel export

### 🎯 Summary
- **Total Services:** 2
- **Total Exports:** 3 (apiService, apiClient, authService)
- **Total Public Methods:** 8 (1 in ApiService, 7 in AuthService)
- **Unused Exports:** 0
- **Unused Methods:** 0
- **Unused Internal Code:** 0

**Status:** 🟢 Healthy - All code is utilized and follows good architectural patterns
