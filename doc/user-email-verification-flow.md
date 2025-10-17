# User Email Verification Flow

This document describes the email verification flow for the user dashboard.

## Overview

The email verification process consists of three main components:

1. **Registration** - User signs up and receives a verification email
2. **Verification Request** - User can request a new verification email
3. **Verification Result** - User sees success or error after clicking the verification link

## Components

### 1. Register.vue (`/register`)
- User registration form
- Sends verification email on successful registration
- Redirects to `/verify-email` after registration

### 2. VerifyEmail.vue (`/verify-email`)
- Shows message asking user to check their email
- Allows user to resend verification email
- Requires authentication (`requiresAuth: true`)

### 3. VerifyEmailResultView.vue (`/verify-email-result`)
- **NEW**: Displays verification success or error based on URL query parameters
- Does not require authentication (`requiresAuth: false`)
- Handles different error scenarios

## Email Verification Result Flow

### Backend Verification Endpoint

The backend should verify the email and redirect to:

**Success:**
```
/verify-email-result?status=success
```

**Error:**
```
/verify-email-result?status=error&reason={error-reason}
```

### Error Reasons

The component handles these error reasons:

| Reason | Message |
|--------|---------|
| `invalid-token` | The verification link is invalid or has expired. |
| `already-verified` | Your email has already been verified. |
| `expired` | The verification link has expired. Please request a new one. |
| `not-found` | We could not find your account. Please try registering again. |
| Custom message | Displays the custom error message |
| No reason | Email verification failed. Please try again. |

### Success State

When `status=success`:
- Shows success icon (green check circle)
- Displays success message
- Shows "Go to Dashboard" button
- Automatically calls `userStore.checkAuth()` to refresh user state

### Error State

When `status=error`:
- Shows error icon (red X circle)
- Displays error message based on reason
- Shows "Request New Verification Email" button (navigates to `/verify-email`)
- Shows "Go to Login" button (navigates to `/login`)

### Invalid Status

If no valid status parameter is provided, the component redirects to `/verify-email`.

## Usage Example

### Backend Controller (Laravel)

```php
// Successful verification
return redirect('/verify-email-result?status=success');

// Failed verification - invalid token
return redirect('/verify-email-result?status=error&reason=invalid-token');

// Failed verification - already verified
return redirect('/verify-email-result?status=error&reason=already-verified');

// Failed verification - custom message
return redirect('/verify-email-result?status=error&reason=' . urlencode('Custom error message'));
```

### Frontend Navigation

```typescript
// Navigate to verification result page
router.push({
  name: 'verify-email-result',
  query: {
    status: 'success'
  }
});

// Navigate with error
router.push({
  name: 'verify-email-result',
  query: {
    status: 'error',
    reason: 'invalid-token'
  }
});
```

## Testing

Comprehensive tests are available in:
```
resources/user/js/views/auth/__tests__/VerifyEmailResultView.spec.ts
```

Run tests:
```bash
npm run test:user -- VerifyEmailResultView.spec.ts
```

## Design

The component follows the established auth view patterns:
- Centered card layout
- Blue gradient background (`from-blue-50 to-blue-100`)
- White card with shadow
- Uses PrimeVue components (Message, Button)
- Uses Phosphor Icons (PhCheckCircle, PhXCircle, PhEnvelope)
- Matches styling of Login.vue and Register.vue

## Accessibility

- Uses semantic HTML
- Provides clear visual feedback (icons + colors + text)
- Button labels are descriptive
- Error messages are specific and actionable

## Route Configuration

```typescript
{
  path: '/verify-email-result',
  name: 'verify-email-result',
  component: VerifyEmailResultView,
  meta: {
    title: 'Email Verification',
    requiresAuth: false, // Public route
  },
}
```
