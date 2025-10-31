# User Authentication System - Complete Implementation Plan

**Project:** Laravel 12 + Vue 3 Dual Dashboard Template
**Feature:** Complete User Authentication System
**Date:** 2025-10-15
**Version:** 1.0.0

---

## Overview

This plan outlines the complete implementation of a user authentication system for the **User Dashboard** (frontend at `/`, backend at `/api`). The system will include:

1. **User Registration** - New user signup with email verification
2. **User Login** - Authentication with session management and "Remember Me"
3. **Email Verification** - Email confirmation for new registrations
4. **Password Reset** - Forgot password flow with email notifications
5. **Profile Management** - Edit user profile information
6. **Logout** - Session termination
7. **Header Navigation Updates** - Dynamic login/register/profile UI

---

## Architecture Overview

### Backend (Laravel)
- **Domain-Driven Design (DDD)** - Following established DDD patterns
- **Bounded Context:** `User` (already exists, will be extended)
- **Authentication Guard:** `web` (default Laravel guard for users)
- **API Prefix:** `/api` (user-facing API)
- **Email Service:** Laravel Mail with Mailpit (Docker container)
- **Session Storage:** Database sessions with optional "Remember Me" cookie

### Frontend (Vue 3)
- **Dashboard:** User Dashboard (`resources/app/`)
- **Router:** Vue Router 4 with route guards
- **State Management:** Pinia store (`userStore`)
- **UI Components:** PrimeVue 4 with Aura theme
- **Path Alias:** `@app/`

---

## Reference Implementation

The **Admin Authentication System** serves as a reference implementation. Key differences:

| Aspect | Admin Authentication | User Authentication |
|--------|---------------------|---------------------|
| **Guard** | `auth:admin` | `auth:web` |
| **API Prefix** | `/admin/api` | `/api` |
| **Base Path** | `/admin` | `/` |
| **Store** | `useAdminStore()` | `useUserStore()` |
| **Roles** | super_admin, admin, moderator | None (future: user roles) |
| **Persistence** | sessionStorage | localStorage |
| **Registration** | No (admins created by super_admin) | Yes (public registration) |
| **Email Verification** | No | Yes (required) |
| **Password Reset** | No (admin-initiated) | Yes (self-service) |

---

## Feature Breakdown

### 1. User Registration
- **Frontend:** Registration form with validation
- **Backend:** Registration endpoint with email verification trigger
- **Email:** Welcome email with verification link
- **Flow:** Register → Verification Email → Verify Email → Login

### 2. User Login
- **Frontend:** Login form with "Remember Me" option
- **Backend:** Authentication endpoint with session creation
- **Session:** Database sessions with optional persistent cookie
- **Flow:** Login → Session Created → Redirect to Dashboard/Home

### 3. Email Verification
- **Frontend:** Verification notice view, resend verification link
- **Backend:** Verification endpoint, resend endpoint
- **Email:** Verification email with signed URL
- **Middleware:** `verified` middleware to protect routes
- **Flow:** Click Email Link → Verify → Redirect to Home

### 4. Password Reset (Forgot Password)
- **Frontend:** Forgot password form, reset password form
- **Backend:** Request reset link endpoint, reset password endpoint
- **Email:** Password reset email with token link
- **Flow:** Request Reset → Email Sent → Click Link → Reset Password → Login

### 5. Profile Management
- **Frontend:** Edit profile form (name, email, password)
- **Backend:** Update profile endpoint with validation
- **Email:** Email change confirmation (optional)
- **Flow:** Edit Profile → Validate → Update → Success Message

### 6. Logout
- **Frontend:** Logout action in dropdown menu
- **Backend:** Logout endpoint to destroy session
- **Flow:** Logout → Clear Session → Redirect to Home

### 7. Header Navigation Updates
- **Unauthenticated:** Show "Login" and "Register" buttons
- **Authenticated:** Show user dropdown with "Profile" and "Logout"
- **Dynamic:** Reactive based on `userStore.isAuthenticated`

---

## Implementation Phases

### Phase 1: Backend Implementation (DDD Architecture)
**Agent:** `dev-be`
**Plan Document:** `doc/plans/user-authentication-backend-plan.md`

1. Domain Layer (Pure PHP)
2. Application Layer (DTOs, Services)
3. Infrastructure Layer (Repositories, Eloquent)
4. Interface Layer (Controllers, Requests)
5. Email Notifications
6. Testing

### Phase 2: Frontend Implementation (Vue 3 + Pinia)
**Agent:** `dev-fe-user`
**Plan Document:** `doc/plans/user-authentication-frontend-plan.md`

1. User Store (Pinia)
2. Authentication Service (API Client)
3. Views (Login, Register, Verify, Reset, Profile)
4. Components (Header Navigation)
5. Router Guards
6. Testing

---

## Success Criteria

### Backend
- [ ] All DDD layers properly implemented
- [ ] Email verification working with Mailpit
- [ ] Password reset working with tokens
- [ ] Profile updates with validation
- [ ] Unit tests for domain entities
- [ ] Feature tests for all endpoints
- [ ] PHPStan level 8 passing
- [ ] PSR-12 code style compliance

### Frontend
- [ ] All views created and styled
- [ ] User store managing auth state
- [ ] Route guards protecting authenticated routes
- [ ] Forms with validation and error handling
- [ ] Dynamic header navigation
- [ ] Email verification flow working
- [ ] Password reset flow working
- [ ] Vitest tests for components and store
- [ ] TypeScript strict mode compliance

---

## Dependencies

### Backend
- Laravel 12 (✓ existing)
- Laravel Mail (✓ existing)
- Mailpit Docker container (✓ existing)
- spatie/laravel-data (✓ existing)

### Frontend
- Vue 3 (✓ existing)
- Vue Router 4 (✓ existing)
- Pinia 3 (✓ existing)
- PrimeVue 4 (✓ existing)
- Axios (✓ existing)
- VueUse (✓ existing)

---

## Next Steps

1. Review this overview plan
2. Implement **Backend** using `doc/plans/user-authentication-backend-plan.md`
3. Implement **Frontend** using `doc/plans/user-authentication-frontend-plan.md`
4. Test complete authentication flow end-to-end
5. Document any deviations or learnings

---

## Related Documentation

### Backend Development
- [DDD Architecture Overview](./.claude/guides/backend/ddd-overview.md)
- [User Backend Guide](./.claude/guides/backend/user-backend-guide.md)

### Frontend Development
- [Admin Authentication Guide](./.claude/guides/frontend/admin-authentication-guide.md) (reference)
- [Admin Dashboard Development Guide](./.claude/guides/frontend/admin-dashboard-development-guide.md) (patterns)

### Email
- Laravel 12 Mail Documentation (researched via Context7)
- Laravel 12 Notifications Documentation (researched via Context7)

---

**Prepared by:** Claude Code
**Last Updated:** 2025-10-15
