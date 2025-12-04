# Social Authentication - Architecture Overview

> High-level architecture plan for adding Discord, Google, and Apple social login to the Laravel 12 + Vue 3 application.

**Related Documents:**
- [Frontend Implementation Plan](./01-frontend-plan.md)
- [Backend Implementation Plan](./02-backend-plan.md)

---

## Executive Summary

This document outlines the architecture for implementing third-party social authentication (OAuth 2.0) alongside the existing email/password authentication system. Users will be able to register and login using Discord, Google, or Apple accounts, as well as link/unlink social accounts to existing accounts.

The implementation follows the existing Domain-Driven Design (DDD) architecture, introducing a new `SocialAccount` entity in the Domain layer while keeping the `User` entity unchanged. Laravel Socialite will handle OAuth provider communication in the Infrastructure layer.

Key features include:
- **Social Login/Register**: One-click authentication via Discord, Google, or Apple
- **Account Linking**: Users can connect multiple social accounts to their profile
- **Smart Email Matching**: Automatically link social accounts when email matches existing user
- **Security First**: State validation, token encryption, and account lockout prevention

---

## Architecture Overview

### DDD Layer Distribution

```
┌─────────────────────────────────────────────────────────────────────┐
│  Interface Layer                                                     │
│  └── SocialAuthController (redirect, callback, link, unlink)        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Application Layer                                                   │
│  └── SocialAuthApplicationService                                   │
│      └── DTOs: SocialLoginData, LinkSocialAccountData               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Domain Layer                                                        │
│  ├── SocialAccount Entity (NEW)                                     │
│  ├── Value Objects: SocialProvider, SocialProviderId               │
│  ├── Events: SocialAccountLinked, SocialAccountUnlinked            │
│  └── Exceptions: SocialAccountAlreadyLinked, etc.                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Infrastructure Layer                                                │
│  ├── Eloquent SocialAccount Model                                   │
│  ├── SocialAccountRepository                                        │
│  └── Laravel Socialite (OAuth Provider Communication)              │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **User Entity Unchanged**: Social accounts are stored separately, not as User properties
2. **One-to-Many Relationship**: A user can have multiple social accounts (one per provider)
3. **Unique Provider ID**: Each social provider ID can only be linked to one user
4. **Session-Based Auth**: Uses existing `web` guard and subdomain cookie sharing

---

## OAuth Flows

### Social Login / Registration Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│  User    │     │ Frontend │     │   Backend    │     │ Provider │
└────┬─────┘     └────┬─────┘     └──────┬───────┘     └────┬─────┘
     │                │                   │                  │
     │ Click "Login   │                   │                  │
     │ with Discord"  │                   │                  │
     │───────────────>│                   │                  │
     │                │                   │                  │
     │                │ GET /api/auth/    │                  │
     │                │ social/discord/   │                  │
     │                │ redirect          │                  │
     │                │──────────────────>│                  │
     │                │                   │                  │
     │                │ 302 Redirect URL  │                  │
     │                │<──────────────────│                  │
     │                │                   │                  │
     │<───────────────│ Redirect to       │                  │
     │                │ Discord OAuth     │                  │
     │                │                   │                  │
     │ Authorize App  │                   │                  │
     │────────────────────────────────────────────────────-->│
     │                │                   │                  │
     │<──────────────────────────────────────────────────────│
     │ Callback with code                 │                  │
     │                │                   │                  │
     │───────────────────────────────────>│                  │
     │                │                   │ Exchange code    │
     │                │                   │ for token        │
     │                │                   │─────────────────>│
     │                │                   │                  │
     │                │                   │<─────────────────│
     │                │                   │ User data        │
     │                │                   │                  │
     │                │                   │ ┌──────────────┐ │
     │                │                   │ │Check if      │ │
     │                │                   │ │social account│ │
     │                │                   │ │exists        │ │
     │                │                   │ └──────────────┘ │
     │                │                   │                  │
     │                │  302 to app       │                  │
     │<───────────────────────────────────│                  │
     │                │  subdomain        │                  │
     │                │  (logged in)      │                  │
```

### Decision Logic (Backend Callback)

```
Social Account Exists?
├── YES → Log in user → Redirect to app subdomain
│
└── NO → Email from provider?
         ├── YES → User with this email exists?
         │         ├── YES → Create social account → Link to user → Log in
         │         └── NO  → Create new user → Create social account → Log in
         │
         └── NO  → Create new user (no email) → Create social account → Log in
```

---

## Security Highlights

### OAuth Security
- **State Parameter**: Cryptographically random, validated on callback
- **HTTPS Only**: All OAuth redirects use HTTPS in production
- **Token Encryption**: Access/refresh tokens encrypted at rest
- **Short-lived Sessions**: OAuth state expires after 10 minutes

### Account Security
- **Cannot Unlink Last Auth Method**: Prevents account lockout
- **Email Verification**: Social emails auto-verified (provider verified)
- **Rate Limiting**: 10 OAuth attempts per minute per IP
- **Account Takeover Prevention**: Cannot link already-linked social account

### Data Privacy
- **Minimal Data Storage**: Only store provider ID, email, name
- **Apple Privacy**: Support for Apple's private relay email
- **GDPR Compliance**: Social data deletable with account

---

## Database Changes

### New Table: `social_accounts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `user_id` | BIGINT | Foreign key to users |
| `provider` | VARCHAR(20) | 'discord', 'google', 'apple' |
| `provider_id` | VARCHAR(255) | Unique ID from provider |
| `email` | VARCHAR(255) | Email from provider (nullable) |
| `name` | VARCHAR(255) | Display name from provider |
| `avatar` | VARCHAR(500) | Avatar URL (nullable) |
| `access_token` | TEXT | Encrypted access token |
| `refresh_token` | TEXT | Encrypted refresh token (nullable) |
| `token_expires_at` | TIMESTAMP | Token expiration (nullable) |
| `created_at` | TIMESTAMP | Created timestamp |
| `updated_at` | TIMESTAMP | Updated timestamp |

**Indexes:**
- `UNIQUE (provider, provider_id)` - One social account per provider globally
- `UNIQUE (user_id, provider)` - One provider per user
- `INDEX (user_id)` - Fast lookup by user

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

---

## Implementation Phases

### Phase 1: Infrastructure Setup (2-3 hours)
- Install Laravel Socialite and provider packages
- Configure OAuth credentials in `.env` and `config/services.php`
- Create database migration
- Set up OAuth apps in Discord, Google, Apple developer consoles

### Phase 2: Domain & Application Layer (4-5 hours)
- Create `SocialAccount` entity and value objects
- Create domain events and exceptions
- Create DTOs for social authentication
- Implement `SocialAuthApplicationService`
- Create repository interface and implementation

### Phase 3: Backend Controllers & Routes (2-3 hours)
- Create `SocialAuthController`
- Add routes to `routes/subdomain.php`
- Implement redirect and callback endpoints
- Implement link/unlink endpoints

### Phase 4: Frontend - Public Site (4-5 hours)
- Create `SocialLoginButton` and `SocialLoginButtons` components
- Update `LoginView` and `RegisterView`
- Create `OAuthCallback` view
- Update auth store and service

### Phase 5: Frontend - User Dashboard (3-4 hours)
- Create `LinkedAccounts` component
- Add settings page or section for account linking
- Implement link/unlink functionality
- Add success/error notifications

### Phase 6: Testing & Refinement (2-3 hours)
- Unit tests for domain layer
- Feature tests for API endpoints
- E2E tests for OAuth flows
- Manual testing with real OAuth apps

**Total Estimated Time: 17-23 hours**

---

## Provider Setup Notes

### Discord
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. Go to OAuth2 → Add Redirect: `https://virtualracingleagues.localhost/api/auth/social/discord/callback`
4. Copy Client ID and Client Secret
5. Required scopes: `identify`, `email`

### Google
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/Select Project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add Redirect URI: `https://virtualracingleagues.localhost/api/auth/social/google/callback`
5. Copy Client ID and Client Secret
6. Required scopes: `openid`, `email`, `profile`

### Apple (Most Complex) - Ignore for this build. For Version 2 of the app.
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Requires paid Apple Developer account ($99/year)
3. Register App ID with Sign In with Apple capability
4. Create Services ID for web authentication
5. Create private key (.p8 file) for Sign In with Apple
6. Configure domains and return URLs
7. Apple provides: Team ID, Key ID, Client ID, Private Key
8. Required scopes: `name`, `email`

**Note**: Apple Sign In requires additional JWT handling. See [Backend Plan](./02-backend-plan.md) for details.

---

## Environment Variables

```env
# Discord
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://virtualracingleagues.localhost/api/auth/social/discord/callback

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://virtualracingleagues.localhost/api/auth/social/google/callback

# Apple
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=   # Base64 encoded .p8 contents
APPLE_REDIRECT_URI=https://virtualracingleagues.localhost/api/auth/social/apple/callback
```

---

## Success Criteria

1. Users can register/login with Discord, Google, or Apple in < 3 clicks
2. Existing users can link/unlink social accounts from settings
3. Email conflicts are handled gracefully with account merging
4. All OAuth flows complete in < 5 seconds
5. 95%+ test coverage on social auth code
6. Zero security vulnerabilities in OAuth implementation

---

## Related Documents

- **[01-frontend-plan.md](./01-frontend-plan.md)** - Detailed frontend implementation specifications
- **[02-backend-plan.md](./02-backend-plan.md)** - Detailed backend implementation specifications

---

*Last Updated: December 2024*
