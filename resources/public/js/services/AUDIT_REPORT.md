# Resources/Public Services Audit Report

**Date:** 2025-12-10 (Updated)
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

### 3. `/var/www/resources/public/js/services/publicApi.ts`

#### Exports:

- `publicApi` (instance of PublicApiService class)
- `ApiError` (custom error class)
- `NotFoundError` (extends ApiError)
- `NetworkError` (extends ApiError)
- `PaginationMeta` (interface)
- `PaginatedResponse<T>` (interface)
- `FetchLeaguesParams` (interface)

#### Class: PublicApiService

**Public Methods:**

1. `fetchLeagues(params?: FetchLeaguesParams): Promise<PaginatedResponse<PublicLeague>>` - ✅ USED
2. `fetchPlatforms(): Promise<Platform[]>` - ✅ USED
3. `fetchLeague(slug: string): Promise<PublicLeagueDetailResponse>` - ✅ USED
4. `fetchSeasonDetail(leagueSlug: string, seasonSlug: string, signal?: AbortSignal): Promise<PublicSeasonDetailResponse>` - ✅ USED

**Private Methods:**

- `handleError(error: unknown, context: string): never` - ✅ USED (centralized error handling)

#### Error Handling Classes:

**ApiError:**
- Base error class for all API errors
- Properties: `message`, `statusCode`, `originalError`

**NotFoundError (extends ApiError):**
- Thrown for 404 HTTP responses
- Automatically sets `statusCode: 404`

**NetworkError (extends ApiError):**
- Thrown when no response received from server (network failures)
- Automatically sets `statusCode: 0`
- Default message: "Network error occurred. Please check your connection."

#### Usage Analysis:

**publicApi.fetchLeagues()**
- `/var/www/resources/public/js/composables/usePublicLeagues.ts` - Fetches paginated league list
- `/var/www/resources/public/js/views/leagues/LeaguesView.vue` - Main leagues listing page

**publicApi.fetchPlatforms()**
- `/var/www/resources/public/js/composables/usePublicLeagues.ts` - Fetches platform filters
- `/var/www/resources/public/js/views/leagues/LeaguesView.vue` - Platform filter dropdown

**publicApi.fetchLeague()**
- `/var/www/resources/public/js/composables/usePublicLeagueDetail.ts` - Fetches league detail by slug
- `/var/www/resources/public/js/views/leagues/LeagueDetailView.vue` - League detail page

**publicApi.fetchSeasonDetail()**
- `/var/www/resources/public/js/composables/usePublicSeasonDetail.ts` - Fetches season detail
- `/var/www/resources/public/js/views/leagues/SeasonView.vue` - Season detail page

**Error Classes Usage:**
- All error classes are used internally by the service's centralized `handleError()` method
- Components can catch and handle specific error types (NotFoundError for 404 pages, NetworkError for offline states)

#### Recent Improvements (2025-12-10):

✅ **Centralized Error Handling**
- Replaced duplicate error handling blocks with a single `handleError()` method
- All API methods now use consistent error handling
- Error context messages are specific to each operation

✅ **Custom Error Types**
- Added `ApiError`, `NotFoundError`, and `NetworkError` classes
- Enables proper error type checking and handling in consuming code
- Distinguishes between different failure scenarios (404 vs network vs server errors)

✅ **Full Test Coverage**
- Comprehensive Vitest tests for all error scenarios
- Tests verify correct error types are thrown
- Tests validate error messages and status codes

---

## Files Using Services

### Direct Service Imports:

1. `/var/www/resources/public/js/services/authService.ts` - imports `apiService`, `apiClient`
2. `/var/www/resources/public/js/stores/authStore.ts` - imports `authService`
3. `/var/www/resources/public/js/views/auth/ForgotPasswordView.vue` - imports `authService`
4. `/var/www/resources/public/js/views/auth/ResetPasswordView.vue` - imports `authService`
5. `/var/www/resources/public/js/views/auth/__tests__/ForgotPasswordView.spec.ts` - imports `authService` (testing)
6. `/var/www/resources/public/js/views/auth/__tests__/ResetPasswordView.spec.ts` - imports `authService` (testing)
7. `/var/www/resources/public/js/composables/usePublicLeagues.ts` - imports `publicApi`
8. `/var/www/resources/public/js/composables/usePublicLeagueDetail.ts` - imports `publicApi`, `NotFoundError`
9. `/var/www/resources/public/js/composables/usePublicSeasonDetail.ts` - imports `publicApi`
10. `/var/www/resources/public/js/views/leagues/LeaguesView.vue` - imports `publicApi`
11. `/var/www/resources/public/js/views/leagues/LeagueDetailView.vue` - imports `publicApi`
12. `/var/www/resources/public/js/views/leagues/SeasonView.vue` - imports `publicApi`

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

3. ~~**Error Handling Enhancement**~~ ✅ **COMPLETED (publicApi.ts)**
   - ✅ Implemented centralized error handling in `publicApi.ts`
   - ✅ Added custom error classes (ApiError, NotFoundError, NetworkError)
   - ✅ Full test coverage for all error scenarios
   - Consider applying same pattern to `authService.ts` for consistency

4. **Type Export Consolidation**
   - `LoginCredentials`, `RegisterData` types are imported in multiple places
   - Consider a central types barrel export

### 🎯 Summary

- **Total Services:** 3
- **Total Exports:** 10 (apiService, apiClient, authService, publicApi, ApiError, NotFoundError, NetworkError, 3 interfaces)
- **Total Public Methods:** 12 (1 in ApiService, 7 in AuthService, 4 in PublicApiService)
- **Unused Exports:** 0
- **Unused Methods:** 0
- **Unused Internal Code:** 0

**Status:** 🟢 Healthy - All code is utilized and follows good architectural patterns

### 📝 Recent Changes

**2025-12-10:**
- ✅ Refactored `publicApi.ts` error handling
- ✅ Added custom error classes for better type safety
- ✅ Implemented centralized error handler method
- ✅ Added comprehensive test coverage for error scenarios
- ✅ Updated audit report with publicApi documentation
