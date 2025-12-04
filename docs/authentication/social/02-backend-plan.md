# Social Authentication Backend Implementation Plan

**Version**: 1.0
**Last Updated**: December 4, 2025
**Status**: Planning Phase
**Prerequisites**: Laravel 12 with DDD architecture, existing User domain

---

## Table of Contents

1. [Overview](#overview)
2. [Package Installation](#package-installation)
3. [Domain Layer Changes](#domain-layer-changes)
4. [Application Layer Changes](#application-layer-changes)
5. [Infrastructure Layer Changes](#infrastructure-layer-changes)
6. [Interface Layer Changes](#interface-layer-changes)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [OAuth Configuration](#oauth-configuration)
10. [Security Considerations](#security-considerations)
11. [Error Handling](#error-handling)
12. [Testing Plan](#testing-plan)
13. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Summary

This plan details the backend implementation for adding OAuth 2.0 social authentication (Discord, Google) to the Laravel 12 application following DDD (Domain-Driven Design) architecture patterns. Apple sign in will have in the next iteration of the build v2.

### Key Features

1. **OAuth Login/Registration**: Users can authenticate via Discord, Google, or Apple
2. **Account Linking**: Users can link multiple social providers to existing accounts
3. **Account Unlinking**: Users can unlink social providers
4. **Email Conflict Resolution**: Handle scenarios where social email matches existing account
5. **Session Management**: Maintain existing session-based authentication with subdomain cookie sharing

### Architecture Alignment

- Follows existing DDD patterns (Domain, Application, Infrastructure, Interface layers)
- Uses existing User domain entity and repository patterns
- Integrates with current session-based authentication (`web` guard)
- Maintains consistency with Admin authentication patterns

### Business Rules

1. **Primary Rule**: A social account can only be linked to ONE user account
2. **Email Matching**: If social email matches existing user email, auto-link (with confirmation)
3. **Multiple Providers**: A user can link multiple social providers (Discord + Google + Apple)
4. **Unlinking**: Users can unlink providers, but must maintain at least one authentication method (password OR social)
5. **Provider Migration**: If a user changes their email on the provider side, we maintain the link via `provider_id`

---

## Package Installation

### Required Packages

#### 1. Laravel Socialite (Core Package)

```bash
composer require laravel/socialite
```

**Purpose**: Official Laravel OAuth provider abstraction
**Version**: ^5.16 (latest for Laravel 12)
**Documentation**: https://laravel.com/docs/12.x/socialite

#### 2. Discord Provider

```bash
composer require socialiteproviders/discord
```

**Purpose**: Discord OAuth2 integration for Socialite
**Package**: `socialiteproviders/discord`
**Documentation**: https://socialiteproviders.com/Discord/

**Alternative Option**: `revolution/socialite-discord` (more maintained)

```bash
composer require revolution/socialite-discord
```

#### 3. Apple Sign In Provider - Ignore for this build. For Version 2 of the app.

```bash
composer require socialiteproviders/apple
```

**Purpose**: Apple Sign In integration for Socialite
**Package**: `socialiteproviders/apple`
**Documentation**: https://socialiteproviders.com/Apple/

**Important Notes**:
- Requires JWT token generation (uses `firebase/php-jwt` and `lcobucci/jwt` dependencies)
- Client secret is a JWT token with 6-month maximum lifetime
- Must be regenerated every 6 months
- Requires private key file (.p8) from Apple Developer

**Alternative Option**: `genealabs/laravel-sign-in-with-apple` (full-featured wrapper)

```bash
composer require genealabs/laravel-sign-in-with-apple
```

### Installation Commands

```bash
# Install all packages
composer require laravel/socialite
composer require socialiteproviders/discord
composer require socialiteproviders/apple

# Or use alternative providers
composer require laravel/socialite
composer require revolution/socialite-discord
composer require genealabs/laravel-sign-in-with-apple
```

### Built-in vs Community Providers

**Google**: Built into Laravel Socialite (no additional package needed)
**Discord**: Community provider (Socialite Providers)
**Apple**: Community provider (Socialite Providers)

---

## Domain Layer Changes

### Directory Structure

```
app/Domain/User/
├── Entities/
│   └── SocialAccount.php              # NEW - Social account entity
├── ValueObjects/
│   ├── SocialProvider.php             # NEW - Enum for providers
│   ├── SocialProviderId.php           # NEW - Provider user ID
│   ├── SocialProviderToken.php        # NEW - Access token (if needed)
│   └── SocialProviderEmail.php        # NEW - Email from provider (optional)
├── Events/
│   ├── SocialAccountLinked.php        # NEW
│   ├── SocialAccountUnlinked.php      # NEW
│   ├── SocialLoginCompleted.php       # NEW
│   └── SocialRegistrationCompleted.php # NEW
├── Exceptions/
│   ├── SocialAccountAlreadyLinkedException.php  # NEW
│   ├── SocialAccountNotFoundException.php       # NEW
│   ├── InvalidSocialProviderException.php       # NEW
│   ├── CannotUnlinkLastAuthMethodException.php  # NEW
│   └── SocialEmailConflictException.php         # NEW
└── Repositories/
    └── SocialAccountRepositoryInterface.php     # NEW
```

### 1. SocialAccount Entity

**Location**: `app/Domain/User/Entities/SocialAccount.php`

**Purpose**: Represents a social authentication provider linked to a user account

**Properties**:
- `?int $id` - Entity ID (null until persisted)
- `int $userId` - Foreign key to User entity
- `SocialProvider $provider` - Provider enum (discord, google, apple)
- `SocialProviderId $providerId` - User ID from provider (unique per provider)
- `?string $providerEmail` - Email from provider (may differ from user email)
- `?string $providerToken` - OAuth access token (optional, for API calls)
- `?string $providerRefreshToken` - OAuth refresh token (optional)
- `?DateTimeImmutable $tokenExpiresAt` - Token expiration (optional)
- `DateTimeImmutable $createdAt` - When linked
- `DateTimeImmutable $updatedAt` - Last updated

**Methods**:
```php
// Factory methods
public static function create(
    int $userId,
    SocialProvider $provider,
    SocialProviderId $providerId,
    ?string $providerEmail,
    ?string $providerToken,
    ?string $providerRefreshToken,
    ?DateTimeImmutable $tokenExpiresAt,
): self

public static function reconstitute(
    int $id,
    int $userId,
    SocialProvider $provider,
    SocialProviderId $providerId,
    ?string $providerEmail,
    ?string $providerToken,
    ?string $providerRefreshToken,
    ?DateTimeImmutable $tokenExpiresAt,
    DateTimeImmutable $createdAt,
    DateTimeImmutable $updatedAt,
): self

// Business logic
public function updateTokens(
    string $providerToken,
    ?string $providerRefreshToken,
    ?DateTimeImmutable $tokenExpiresAt,
): void

public function updateEmail(string $providerEmail): void

public function isTokenExpired(): bool

// Getters
public function id(): ?int
public function userId(): int
public function provider(): SocialProvider
public function providerId(): SocialProviderId
public function providerEmail(): ?string
public function providerToken(): ?string
public function providerRefreshToken(): ?string
public function tokenExpiresAt(): ?DateTimeImmutable
public function createdAt(): DateTimeImmutable
public function updatedAt(): DateTimeImmutable

// Exception for persistence
public function setId(int $id): void

// Domain events
private function recordEvent(object $event): void
public function releaseEvents(): array
public function hasEvents(): bool
```

**Business Rules Enforced**:
1. Provider + ProviderId combination must be unique (enforced at infrastructure layer)
2. A user can have multiple social accounts (one per provider type)
3. Tokens are optional (not all flows need them)

### 2. Value Objects

#### SocialProvider (Enum)

**Location**: `app/Domain/User/ValueObjects/SocialProvider.php`

```php
enum SocialProvider: string
{
    case DISCORD = 'discord';
    case GOOGLE = 'google';
    case APPLE = 'apple';

    /**
     * Get human-readable name.
     */
    public function label(): string
    {
        return match ($this) {
            self::DISCORD => 'Discord',
            self::GOOGLE => 'Google',
            self::APPLE => 'Apple',
        };
    }

    /**
     * Check if provider supports token refresh.
     */
    public function supportsRefreshToken(): bool
    {
        return match ($this) {
            self::GOOGLE => true,
            self::APPLE => true,
            self::DISCORD => false,
        };
    }

    /**
     * Get OAuth scopes for this provider.
     */
    public function defaultScopes(): array
    {
        return match ($this) {
            self::DISCORD => ['identify', 'email'],
            self::GOOGLE => ['email', 'profile'],
            self::APPLE => ['name', 'email'],
        };
    }
}
```

#### SocialProviderId (Value Object)

**Location**: `app/Domain/User/ValueObjects/SocialProviderId.php`

```php
final readonly class SocialProviderId
{
    private function __construct(
        private string $value
    ) {
        if (empty($value)) {
            throw new \InvalidArgumentException('Social provider ID cannot be empty');
        }

        if (strlen($value) > 255) {
            throw new \InvalidArgumentException('Social provider ID too long');
        }
    }

    public static function from(string $value): self
    {
        return new self($value);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
```

### 3. Domain Events

#### SocialAccountLinked

**Location**: `app/Domain/User/Events/SocialAccountLinked.php`

```php
final readonly class SocialAccountLinked
{
    public function __construct(
        public int $userId,
        public int $socialAccountId,
        public string $provider,
        public string $providerId,
        public ?string $providerEmail,
    ) {}
}
```

#### SocialAccountUnlinked

**Location**: `app/Domain/User/Events/SocialAccountUnlinked.php`

```php
final readonly class SocialAccountUnlinked
{
    public function __construct(
        public int $userId,
        public int $socialAccountId,
        public string $provider,
    ) {}
}
```

#### SocialLoginCompleted

**Location**: `app/Domain/User/Events/SocialLoginCompleted.php`

```php
final readonly class SocialLoginCompleted
{
    public function __construct(
        public int $userId,
        public string $provider,
        public string $providerId,
    ) {}
}
```

#### SocialRegistrationCompleted

**Location**: `app/Domain/User/Events/SocialRegistrationCompleted.php`

```php
final readonly class SocialRegistrationCompleted
{
    public function __construct(
        public int $userId,
        public string $provider,
        public string $providerId,
        public string $email,
    ) {}
}
```

### 4. Domain Exceptions

#### SocialAccountAlreadyLinkedException

```php
final class SocialAccountAlreadyLinkedException extends \DomainException
{
    public static function forUser(int $userId, string $provider): self
    {
        return new self(
            "User {$userId} already has a linked {$provider} account"
        );
    }

    public static function forProvider(string $provider, string $providerId): self
    {
        return new self(
            "Social account {$provider}:{$providerId} is already linked to another user"
        );
    }
}
```

#### SocialAccountNotFoundException

```php
final class SocialAccountNotFoundException extends \DomainException
{
    public static function withId(int $id): self
    {
        return new self("Social account with ID {$id} not found");
    }

    public static function forUser(int $userId, string $provider): self
    {
        return new self(
            "User {$userId} does not have a linked {$provider} account"
        );
    }

    public static function forProvider(string $provider, string $providerId): self
    {
        return new self(
            "Social account {$provider}:{$providerId} not found"
        );
    }
}
```

#### InvalidSocialProviderException

```php
final class InvalidSocialProviderException extends \DomainException
{
    public static function unsupported(string $provider): self
    {
        return new self("Unsupported social provider: {$provider}");
    }
}
```

#### CannotUnlinkLastAuthMethodException

```php
final class CannotUnlinkLastAuthMethodException extends \DomainException
{
    public static function forUser(int $userId): self
    {
        return new self(
            "Cannot unlink last authentication method for user {$userId}. User must have at least one way to authenticate (password or social account)."
        );
    }
}
```

#### SocialEmailConflictException

```php
final class SocialEmailConflictException extends \DomainException
{
    public static function create(string $email, int $existingUserId): self
    {
        return new self(
            "Email {$email} from social provider is already registered to another user"
        );
    }
}
```

### 5. Repository Interface

**Location**: `app/Domain/User/Repositories/SocialAccountRepositoryInterface.php`

```php
interface SocialAccountRepositoryInterface
{
    /**
     * Save social account (create or update).
     */
    public function save(SocialAccount $socialAccount): void;

    /**
     * Find social account by ID.
     *
     * @throws SocialAccountNotFoundException
     */
    public function findById(int $id): SocialAccount;

    /**
     * Find social account by provider and provider ID.
     *
     * @throws SocialAccountNotFoundException
     */
    public function findByProvider(
        SocialProvider $provider,
        SocialProviderId $providerId
    ): SocialAccount;

    /**
     * Find social account for user and provider.
     *
     * @throws SocialAccountNotFoundException
     */
    public function findByUserAndProvider(
        int $userId,
        SocialProvider $provider
    ): SocialAccount;

    /**
     * Get all social accounts for a user.
     *
     * @return array<SocialAccount>
     */
    public function findByUserId(int $userId): array;

    /**
     * Check if social account exists for provider.
     */
    public function existsByProvider(
        SocialProvider $provider,
        SocialProviderId $providerId
    ): bool;

    /**
     * Check if user has linked account for provider.
     */
    public function existsByUserAndProvider(
        int $userId,
        SocialProvider $provider
    ): bool;

    /**
     * Delete social account.
     */
    public function delete(SocialAccount $socialAccount): void;

    /**
     * Count authentication methods for user.
     * Returns count of: password (1 if exists) + social accounts count.
     */
    public function countAuthMethodsForUser(int $userId): int;
}
```

---

## Application Layer Changes

### Directory Structure

```
app/Application/User/
├── Services/
│   ├── UserApplicationService.php     # UPDATED - Add helper methods
│   └── SocialAuthApplicationService.php # NEW - Social auth orchestration
└── DTOs/
    ├── SocialLoginData.php            # NEW - Input for OAuth callback
    ├── LinkSocialAccountData.php      # NEW - Input for linking
    ├── SocialAccountData.php          # NEW - Output for social accounts
    └── SocialUserData.php             # NEW - OAuth user data from provider
```

### 1. SocialAuthApplicationService

**Location**: `app/Application/User/Services/SocialAuthApplicationService.php`

**Purpose**: Orchestrate social authentication use cases

**Dependencies**:
- `UserRepositoryInterface` - Find/create users
- `SocialAccountRepositoryInterface` - Manage social accounts
- `Hash` facade - Password hashing (for new users)
- `DB` facade - Transactions
- `Event` facade - Domain events

**Methods**:

#### handleSocialLogin()

```php
/**
 * Handle OAuth callback - login existing user or register new user.
 *
 * @param SocialLoginData $data OAuth data from provider
 * @return array{user: UserData, isNewUser: bool}
 * @throws SocialEmailConflictException
 */
public function handleSocialLogin(SocialLoginData $data): array
```

**Logic Flow**:
1. Check if social account exists (by provider + provider_id)
2. **If exists**: Load user, update tokens, dispatch `SocialLoginCompleted` event
3. **If not exists**:
   a. Check if email exists in users table
   b. **If email exists**: Auto-link to existing user (with confirmation), dispatch `SocialAccountLinked`
   c. **If email not exists**: Create new user, create social account, dispatch `SocialRegistrationCompleted`
4. Return user data + `isNewUser` flag

#### linkSocialAccount()

```php
/**
 * Link a social provider to authenticated user.
 *
 * @param LinkSocialAccountData $data
 * @param int $userId Authenticated user ID
 * @return SocialAccountData
 * @throws SocialAccountAlreadyLinkedException
 */
public function linkSocialAccount(LinkSocialAccountData $data, int $userId): SocialAccountData
```

**Logic Flow**:
1. Verify user exists
2. Check if user already has this provider linked
3. Check if provider account is linked to another user
4. Create social account entity
5. Persist in transaction
6. Dispatch `SocialAccountLinked` event
7. Return SocialAccountData DTO

#### unlinkSocialAccount()

```php
/**
 * Unlink a social provider from authenticated user.
 *
 * @param SocialProvider $provider
 * @param int $userId Authenticated user ID
 * @throws SocialAccountNotFoundException
 * @throws CannotUnlinkLastAuthMethodException
 */
public function unlinkSocialAccount(SocialProvider $provider, int $userId): void
```

**Logic Flow**:
1. Verify user exists
2. Find social account for user + provider
3. **Check business rule**: Count auth methods (password + social accounts)
4. If only 1 method remains, throw `CannotUnlinkLastAuthMethodException`
5. Delete social account in transaction
6. Dispatch `SocialAccountUnlinked` event

#### getSocialAccountsForUser()

```php
/**
 * Get all linked social accounts for a user.
 *
 * @param int $userId
 * @return array<SocialAccountData>
 */
public function getSocialAccountsForUser(int $userId): array
```

#### canUnlinkAccount()

```php
/**
 * Check if user can unlink a social account (has other auth methods).
 *
 * @param int $userId
 * @return bool
 */
public function canUnlinkAccount(int $userId): bool
```

### 2. Application DTOs

#### SocialLoginData (Input DTO)

**Location**: `app/Application/User/DTOs/SocialLoginData.php`

**Purpose**: Data received from OAuth callback

```php
final class SocialLoginData extends Data
{
    public function __construct(
        public readonly string $provider,        // 'discord', 'google', 'apple'
        public readonly string $provider_id,     // ID from provider
        public readonly ?string $email,          // Email from provider (nullable for privacy)
        public readonly ?string $name,           // Full name from provider
        public readonly ?string $first_name,     // First name (if available)
        public readonly ?string $last_name,      // Last name (if available)
        public readonly ?string $avatar,         // Avatar URL (optional)
        public readonly ?string $token,          // OAuth access token (optional)
        public readonly ?string $refresh_token,  // OAuth refresh token (optional)
        public readonly ?int $expires_in,        // Token expiration seconds (optional)
    ) {}

    public static function rules(): array
    {
        return [
            'provider' => ['required', 'string', 'in:discord,google,apple'],
            'provider_id' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'avatar' => ['nullable', 'url', 'max:500'],
            'token' => ['nullable', 'string'],
            'refresh_token' => ['nullable', 'string'],
            'expires_in' => ['nullable', 'integer'],
        ];
    }
}
```

#### LinkSocialAccountData (Input DTO)

**Location**: `app/Application/User/DTOs/LinkSocialAccountData.php`

```php
final class LinkSocialAccountData extends Data
{
    public function __construct(
        public readonly string $provider,
        public readonly string $provider_id,
        public readonly ?string $provider_email,
        public readonly ?string $token,
        public readonly ?string $refresh_token,
        public readonly ?int $expires_in,
    ) {}

    public static function rules(): array
    {
        return [
            'provider' => ['required', 'string', 'in:discord,google,apple'],
            'provider_id' => ['required', 'string', 'max:255'],
            'provider_email' => ['nullable', 'email', 'max:255'],
            'token' => ['nullable', 'string'],
            'refresh_token' => ['nullable', 'string'],
            'expires_in' => ['nullable', 'integer'],
        ];
    }
}
```

#### SocialAccountData (Output DTO)

**Location**: `app/Application/User/DTOs/SocialAccountData.php`

```php
final class SocialAccountData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $user_id,
        public readonly string $provider,
        public readonly string $provider_id,
        public readonly ?string $provider_email,
        public readonly bool $has_token,          // Don't expose actual token
        public readonly bool $token_expired,      // Whether token is expired
        public readonly string $created_at,
        public readonly string $updated_at,
    ) {}

    public static function fromEntity(SocialAccount $socialAccount): self
    {
        return new self(
            id: $socialAccount->id() ?? 0,
            user_id: $socialAccount->userId(),
            provider: $socialAccount->provider()->value,
            provider_id: $socialAccount->providerId()->value(),
            provider_email: $socialAccount->providerEmail(),
            has_token: $socialAccount->providerToken() !== null,
            token_expired: $socialAccount->isTokenExpired(),
            created_at: $socialAccount->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $socialAccount->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
```

---

## Infrastructure Layer Changes

### Directory Structure

```
app/Infrastructure/Persistence/Eloquent/
├── Models/
│   └── SocialAccountEloquent.php      # NEW - Eloquent model
└── Repositories/
    └── SocialAccountRepository.php    # NEW - Repository implementation
```

### 1. Eloquent Model

**Location**: `app/Infrastructure/Persistence/Eloquent/Models/SocialAccountEloquent.php`

**Class Name**: `SocialAccountEloquent` (avoid conflict with domain entity)

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Social Account Eloquent Model (Anemic).
 *
 * @property int $id
 * @property int $user_id
 * @property string $provider
 * @property string $provider_id
 * @property string|null $provider_email
 * @property string|null $provider_token
 * @property string|null $provider_refresh_token
 * @property \Carbon\Carbon|null $token_expires_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
final class SocialAccountEloquent extends Model
{
    protected $table = 'social_accounts';

    protected $fillable = [
        'user_id',
        'provider',
        'provider_id',
        'provider_email',
        'provider_token',
        'provider_refresh_token',
        'token_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'token_expires_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Relationship to User.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserEloquent::class, 'user_id');
    }
}
```

### 2. Repository Implementation

**Location**: `app/Infrastructure/Persistence/Eloquent/Repositories/SocialAccountRepository.php`

**Key Responsibilities**:
1. Map between `SocialAccount` domain entity and `SocialAccountEloquent` model
2. Implement all repository interface methods
3. Handle persistence and retrieval
4. Encrypt sensitive tokens before storage (optional)

**Mapping Methods**:

```php
/**
 * Map domain entity to Eloquent model.
 */
private function toEloquent(SocialAccount $socialAccount): SocialAccountEloquent
{
    $eloquent = $socialAccount->id() !== null
        ? SocialAccountEloquent::findOrFail($socialAccount->id())
        : new SocialAccountEloquent();

    $eloquent->user_id = $socialAccount->userId();
    $eloquent->provider = $socialAccount->provider()->value;
    $eloquent->provider_id = $socialAccount->providerId()->value();
    $eloquent->provider_email = $socialAccount->providerEmail();
    $eloquent->provider_token = $socialAccount->providerToken();
    $eloquent->provider_refresh_token = $socialAccount->providerRefreshToken();
    $eloquent->token_expires_at = $socialAccount->tokenExpiresAt();

    return $eloquent;
}

/**
 * Map Eloquent model to domain entity.
 */
private function toDomain(SocialAccountEloquent $eloquent): SocialAccount
{
    return SocialAccount::reconstitute(
        id: $eloquent->id,
        userId: $eloquent->user_id,
        provider: SocialProvider::from($eloquent->provider),
        providerId: SocialProviderId::from($eloquent->provider_id),
        providerEmail: $eloquent->provider_email,
        providerToken: $eloquent->provider_token,
        providerRefreshToken: $eloquent->provider_refresh_token,
        tokenExpiresAt: $eloquent->token_expires_at
            ? DateTimeImmutable::createFromMutable($eloquent->token_expires_at)
            : null,
        createdAt: DateTimeImmutable::createFromMutable($eloquent->created_at),
        updatedAt: DateTimeImmutable::createFromMutable($eloquent->updated_at),
    );
}
```

**Implementation Example**:

```php
public function findByProvider(
    SocialProvider $provider,
    SocialProviderId $providerId
): SocialAccount {
    $eloquent = SocialAccountEloquent::where('provider', $provider->value)
        ->where('provider_id', $providerId->value())
        ->first();

    if ($eloquent === null) {
        throw SocialAccountNotFoundException::forProvider(
            $provider->value,
            $providerId->value()
        );
    }

    return $this->toDomain($eloquent);
}

public function countAuthMethodsForUser(int $userId): int
{
    // Check if user has password
    $user = UserEloquent::withTrashed()->findOrFail($userId);
    $hasPassword = !empty($user->password);

    // Count social accounts
    $socialAccountsCount = SocialAccountEloquent::where('user_id', $userId)->count();

    return ($hasPassword ? 1 : 0) + $socialAccountsCount;
}
```

### 3. OAuth Provider Configuration

**Location**: `app/Infrastructure/Services/SocialiteProviderService.php` (NEW)

**Purpose**: Configure and return Socialite driver for each provider

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Services;

use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;

final class SocialiteProviderService
{
    /**
     * Get Socialite provider instance.
     */
    public function getProvider(string $provider): Provider
    {
        return match ($provider) {
            'google' => $this->getGoogleProvider(),
            'discord' => $this->getDiscordProvider(),
            'apple' => $this->getAppleProvider(),
            default => throw new \InvalidArgumentException("Unsupported provider: {$provider}"),
        };
    }

    private function getGoogleProvider(): Provider
    {
        return Socialite::driver('google')
            ->scopes(['email', 'profile'])
            ->stateless(); // For API usage
    }

    private function getDiscordProvider(): Provider
    {
        return Socialite::driver('discord')
            ->scopes(['identify', 'email'])
            ->stateless();
    }

    private function getAppleProvider(): Provider
    {
        return Socialite::driver('apple')
            ->scopes(['name', 'email'])
            ->stateless();
    }
}
```

---

## Interface Layer Changes

### Directory Structure

```
app/Http/Controllers/
└── Auth/
    └── SocialAuthController.php       # NEW - Social auth endpoints
```

### Routes

**Location**: `routes/subdomain.php` (existing file)

**Add to public site subdomain section**:

```php
// Public Site (virtualracingleagues.localhost)
Route::domain('virtualracingleagues.localhost')->group(function () {

    // ... existing routes ...

    // Social authentication routes (public)
    Route::prefix('api/auth/social')->group(function () {
        // Redirect to OAuth provider
        Route::get('/{provider}/redirect', [SocialAuthController::class, 'redirect'])
            ->whereIn('provider', ['discord', 'google', 'apple']);

        // OAuth callback
        Route::get('/{provider}/callback', [SocialAuthController::class, 'callback'])
            ->whereIn('provider', ['discord', 'google', 'apple']);
    });

    Route::get('/{any?}', fn() => view('public'));
});

// User Dashboard (app.virtualracingleagues.localhost) - Authenticated Only
Route::domain('app.virtualracingleagues.localhost')->group(function () {

    // ... existing routes ...

    // Social account management (authenticated)
    Route::prefix('api/auth/social')->middleware(['auth:web', 'user.authenticate'])->group(function () {
        // Get linked accounts
        Route::get('/accounts', [SocialAuthController::class, 'listAccounts']);

        // Link account
        Route::post('/{provider}/link', [SocialAuthController::class, 'linkAccount'])
            ->whereIn('provider', ['discord', 'google', 'apple']);

        // Unlink account
        Route::delete('/{provider}/unlink', [SocialAuthController::class, 'unlinkAccount'])
            ->whereIn('provider', ['discord', 'google', 'apple']);
    });

    Route::get('/{any?}', fn() => view('app'));
});
```

### SocialAuthController

**Location**: `app/Http/Controllers/Auth/SocialAuthController.php`

**Methods**:

#### 1. redirect()

```php
/**
 * Redirect user to OAuth provider.
 *
 * GET /api/auth/social/{provider}/redirect
 */
public function redirect(string $provider): RedirectResponse
{
    try {
        $socialiteProvider = $this->socialiteService->getProvider($provider);
        return $socialiteProvider->redirect();
    } catch (\InvalidArgumentException $e) {
        return ApiResponse::error('Invalid provider', null, 400);
    }
}
```

**Query Parameters**:
- `redirect_url` (optional) - Frontend URL to redirect after successful auth
- Store in session: `session(['social_auth_redirect' => $request->query('redirect_url')])`

#### 2. callback()

```php
/**
 * Handle OAuth callback from provider.
 *
 * GET /api/auth/social/{provider}/callback
 */
public function callback(string $provider): JsonResponse|RedirectResponse
{
    try {
        // Get user from provider
        $socialiteProvider = $this->socialiteService->getProvider($provider);
        $socialUser = $socialiteProvider->user();

        // Map to DTO
        $socialLoginData = SocialLoginData::from([
            'provider' => $provider,
            'provider_id' => $socialUser->getId(),
            'email' => $socialUser->getEmail(),
            'name' => $socialUser->getName(),
            'avatar' => $socialUser->getAvatar(),
            'token' => $socialUser->token,
            'refresh_token' => $socialUser->refreshToken ?? null,
            'expires_in' => $socialUser->expiresIn ?? null,
        ]);

        // Handle login/registration
        $result = $this->socialAuthService->handleSocialLogin($socialLoginData);

        // Authenticate user
        Auth::guard('web')->loginUsingId($result['user']->id);

        // Redirect to user dashboard
        $redirectUrl = session('social_auth_redirect', config('app.user_dashboard_url'));
        session()->forget('social_auth_redirect');

        return redirect($redirectUrl);

    } catch (SocialEmailConflictException $e) {
        return redirect('/social-error?error=email_conflict');
    } catch (\Exception $e) {
        return redirect('/social-error?error=unknown');
    }
}
```

#### 3. listAccounts()

```php
/**
 * Get all linked social accounts for authenticated user.
 *
 * GET /api/auth/social/accounts
 */
public function listAccounts(Request $request): JsonResponse
{
    /** @var \App\Models\User $user */
    $user = $request->user();

    $accounts = $this->socialAuthService->getSocialAccountsForUser($user->id);

    return ApiResponse::success([
        'accounts' => array_map(fn($account) => $account->toArray(), $accounts),
        'can_unlink' => $this->socialAuthService->canUnlinkAccount($user->id),
    ]);
}
```

#### 4. linkAccount()

```php
/**
 * Link a social provider to authenticated user.
 *
 * POST /api/auth/social/{provider}/link
 */
public function linkAccount(Request $request, string $provider): JsonResponse
{
    /** @var \App\Models\User $user */
    $user = $request->user();

    try {
        // Get OAuth data from provider
        $socialiteProvider = $this->socialiteService->getProvider($provider);
        $socialUser = $socialiteProvider->user();

        // Map to DTO
        $linkData = LinkSocialAccountData::from([
            'provider' => $provider,
            'provider_id' => $socialUser->getId(),
            'provider_email' => $socialUser->getEmail(),
            'token' => $socialUser->token,
            'refresh_token' => $socialUser->refreshToken ?? null,
            'expires_in' => $socialUser->expiresIn ?? null,
        ]);

        $socialAccount = $this->socialAuthService->linkSocialAccount($linkData, $user->id);

        return ApiResponse::success(
            $socialAccount->toArray(),
            'Social account linked successfully'
        );

    } catch (SocialAccountAlreadyLinkedException $e) {
        return ApiResponse::error($e->getMessage(), null, 422);
    } catch (\Exception $e) {
        return ApiResponse::error('Failed to link social account', null, 500);
    }
}
```

#### 5. unlinkAccount()

```php
/**
 * Unlink a social provider from authenticated user.
 *
 * DELETE /api/auth/social/{provider}/unlink
 */
public function unlinkAccount(Request $request, string $provider): JsonResponse
{
    /** @var \App\Models\User $user */
    $user = $request->user();

    try {
        $this->socialAuthService->unlinkSocialAccount(
            SocialProvider::from($provider),
            $user->id
        );

        return ApiResponse::success(null, 'Social account unlinked successfully');

    } catch (SocialAccountNotFoundException $e) {
        return ApiResponse::error($e->getMessage(), null, 404);
    } catch (CannotUnlinkLastAuthMethodException $e) {
        return ApiResponse::error($e->getMessage(), null, 422);
    } catch (\Exception $e) {
        return ApiResponse::error('Failed to unlink social account', null, 500);
    }
}
```

**Controller Dependencies**:
```php
public function __construct(
    private readonly SocialAuthApplicationService $socialAuthService,
    private readonly SocialiteProviderService $socialiteService,
) {}
```

---

## Database Schema

### Migration: Create social_accounts Table

**Location**: `database/migrations/YYYY_MM_DD_HHMMSS_create_social_accounts_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('cascade');

            $table->enum('provider', ['discord', 'google', 'apple']);
            $table->string('provider_id', 255); // ID from provider
            $table->string('provider_email', 255)->nullable();

            // OAuth tokens (optional, encrypted recommended)
            $table->text('provider_token')->nullable();
            $table->text('provider_refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->unique(['provider', 'provider_id'], 'idx_social_provider_unique');
            $table->unique(['user_id', 'provider'], 'idx_social_user_provider');
            $table->index('user_id', 'idx_social_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};
```

### Table Structure

**Table Name**: `social_accounts`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary key |
| `user_id` | BIGINT UNSIGNED | NO | | Foreign key to `users.id` |
| `provider` | ENUM('discord','google','apple') | NO | | OAuth provider |
| `provider_id` | VARCHAR(255) | NO | | User ID from provider |
| `provider_email` | VARCHAR(255) | YES | NULL | Email from provider (may differ from user email) |
| `provider_token` | TEXT | YES | NULL | OAuth access token (encrypt recommended) |
| `provider_refresh_token` | TEXT | YES | NULL | OAuth refresh token |
| `token_expires_at` | TIMESTAMP | YES | NULL | Token expiration datetime |
| `created_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | When linked |
| `updated_at` | TIMESTAMP | NO | CURRENT_TIMESTAMP | Last updated |

### Indexes

1. **PRIMARY KEY**: `id`
2. **UNIQUE**: `idx_social_provider_unique` (`provider`, `provider_id`)
   - Ensures a social account can only be linked once
3. **UNIQUE**: `idx_social_user_provider` (`user_id`, `provider`)
   - Ensures a user can only link one account per provider
4. **INDEX**: `idx_social_user_id` (`user_id`)
   - Fast lookups for user's social accounts

### Constraints

1. **Foreign Key**: `user_id` → `users.id` (CASCADE on delete)
2. **Uniqueness**: `provider` + `provider_id` (enforces domain rule)
3. **Uniqueness**: `user_id` + `provider` (one provider per user)

### Security Considerations

**Token Encryption** (Recommended):

```php
// In SocialAccountEloquent model
protected function casts(): array
{
    return [
        'provider_token' => 'encrypted',
        'provider_refresh_token' => 'encrypted',
        // ... other casts
    ];
}
```

---

## API Endpoints

### Endpoint Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/auth/social/{provider}/redirect` | Public | Redirect to OAuth provider |
| GET | `/api/auth/social/{provider}/callback` | Public | Handle OAuth callback |
| GET | `/api/auth/social/accounts` | Authenticated | List linked accounts |
| POST | `/api/auth/social/{provider}/link` | Authenticated | Link account |
| DELETE | `/api/auth/social/{provider}/unlink` | Authenticated | Unlink account |

### 1. Redirect to OAuth Provider

**Endpoint**: `GET /api/auth/social/{provider}/redirect`
**Auth**: Public
**Parameters**: `{provider}` - One of: `discord`, `google`, `apple`

**Query Parameters**:
- `redirect_url` (optional) - Frontend URL to redirect after auth

**Response**: `302 Redirect` to OAuth provider

**Example**:
```
GET /api/auth/social/discord/redirect?redirect_url=http://app.example.com/dashboard
```

### 2. OAuth Callback

**Endpoint**: `GET /api/auth/social/{provider}/callback`
**Auth**: Public (provider redirects here)
**Parameters**: `{provider}` - One of: `discord`, `google`, `apple`

**Query Parameters** (from provider):
- `code` - Authorization code
- `state` - CSRF protection token

**Success Response**: `302 Redirect` to user dashboard
**Error Response**: `302 Redirect` to `/social-error?error={type}`

**Error Types**:
- `email_conflict` - Email already registered
- `unknown` - Other errors

### 3. List Linked Accounts

**Endpoint**: `GET /api/auth/social/accounts`
**Auth**: Authenticated (`auth:web`)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": 1,
        "user_id": 123,
        "provider": "discord",
        "provider_id": "1234567890",
        "provider_email": "user@example.com",
        "has_token": true,
        "token_expired": false,
        "created_at": "2025-12-04 10:00:00",
        "updated_at": "2025-12-04 10:00:00"
      }
    ],
    "can_unlink": true
  },
  "message": null
}
```

### 4. Link Social Account

**Endpoint**: `POST /api/auth/social/{provider}/link`
**Auth**: Authenticated (`auth:web`)
**Parameters**: `{provider}` - One of: `discord`, `google`, `apple`

**Note**: This endpoint requires the user to complete OAuth flow first. Frontend should:
1. Open OAuth popup/redirect: `GET /api/auth/social/{provider}/redirect`
2. Handle callback
3. Call this endpoint with OAuth data

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "provider": "discord",
    "provider_id": "1234567890",
    "provider_email": "user@example.com",
    "has_token": true,
    "token_expired": false,
    "created_at": "2025-12-04 10:00:00",
    "updated_at": "2025-12-04 10:00:00"
  },
  "message": "Social account linked successfully"
}
```

**Error Responses**:
- `422 Unprocessable Entity` - Already linked
```json
{
  "success": false,
  "data": null,
  "message": "User 123 already has a linked discord account"
}
```

### 5. Unlink Social Account

**Endpoint**: `DELETE /api/auth/social/{provider}/unlink`
**Auth**: Authenticated (`auth:web`)
**Parameters**: `{provider}` - One of: `discord`, `google`, `apple`

**Success Response** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Social account unlinked successfully"
}
```

**Error Responses**:

- `404 Not Found` - Account not linked
```json
{
  "success": false,
  "data": null,
  "message": "User 123 does not have a linked discord account"
}
```

- `422 Unprocessable Entity` - Cannot unlink last auth method
```json
{
  "success": false,
  "data": null,
  "message": "Cannot unlink last authentication method for user 123. User must have at least one way to authenticate (password or social account)."
}
```

---

## OAuth Configuration

### Environment Variables

Add to `.env`:

```bash
# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI="${APP_URL}/api/auth/social/discord/callback"

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI="${APP_URL}/api/auth/social/google/callback"

# Apple Sign In
APPLE_CLIENT_ID=your_apple_service_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=/var/www/storage/keys/AuthKey_XXXXXXXXXX.p8
APPLE_REDIRECT_URI="${APP_URL}/api/auth/social/apple/callback"
```

### Configuration File

**Location**: `config/services.php`

Add to existing array:

```php
<?php

return [
    // ... existing services ...

    /*
    |--------------------------------------------------------------------------
    | Third Party Services - OAuth Providers
    |--------------------------------------------------------------------------
    */

    'discord' => [
        'client_id' => env('DISCORD_CLIENT_ID'),
        'client_secret' => env('DISCORD_CLIENT_SECRET'),
        'redirect' => env('DISCORD_REDIRECT_URI'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'apple' => [
        'client_id' => env('APPLE_CLIENT_ID'),
        'team_id' => env('APPLE_TEAM_ID'),
        'key_id' => env('APPLE_KEY_ID'),
        'private_key' => env('APPLE_PRIVATE_KEY'),
        'redirect' => env('APPLE_REDIRECT_URI'),
    ],
];
```

### Provider-Specific Setup

#### Discord Setup

1. **Create Application**: https://discord.com/developers/applications
2. **OAuth2 Settings**:
   - Add redirect URL: `http://virtualracingleagues.localhost/api/auth/social/discord/callback`
   - Scopes: `identify`, `email`
3. **Copy Credentials**:
   - Client ID → `DISCORD_CLIENT_ID`
   - Client Secret → `DISCORD_CLIENT_SECRET`

**Data Returned**:
- `id` - Discord user ID (snowflake)
- `username` - Discord username
- `discriminator` - Discord discriminator (e.g., "0001")
- `email` - User email (if scope granted)
- `avatar` - Avatar hash

#### Google Setup

1. **Create Project**: https://console.cloud.google.com/
2. **Enable API**: Google+ API or People API
3. **Create OAuth 2.0 Credentials**:
   - Authorized JavaScript origins: `http://virtualracingleagues.localhost`
   - Authorized redirect URIs: `http://virtualracingleagues.localhost/api/auth/social/google/callback`
4. **Copy Credentials**:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

**Data Returned**:
- `id` - Google user ID
- `email` - User email
- `name` - Full name
- `given_name` - First name
- `family_name` - Last name
- `picture` - Profile picture URL

#### Apple Sign In Setup

**Most Complex Provider** - Requires multiple setup steps:

1. **Apple Developer Account**: https://developer.apple.com/account/

2. **Create App ID**:
   - Go to: Certificates, Identifiers & Profiles → Identifiers
   - Register a new App ID
   - Platform: iOS, tvOS, watchOS
   - Bundle ID: `com.yourcompany.yourapp`
   - Enable "Sign in with Apple" capability

3. **Create Service ID**:
   - Go to: Identifiers → Register a new Services ID
   - Identifier: `com.yourcompany.yourapp.service` (must be different from App ID)
   - Description: Your app name
   - Enable "Sign in with Apple"
   - Configure: Add domain `virtualracingleagues.localhost` and return URL `http://virtualracingleagues.localhost/api/auth/social/apple/callback`

4. **Create Private Key**:
   - Go to: Keys → Create a new key
   - Enable "Sign in with Apple"
   - Download `.p8` file (can only download once!)
   - Note the Key ID

5. **Store Private Key**:
   - Move `.p8` file to: `/var/www/storage/keys/AuthKey_XXXXXXXXXX.p8`
   - Update permissions: `chmod 600 storage/keys/AuthKey_XXXXXXXXXX.p8`

6. **Environment Variables**:
   - `APPLE_CLIENT_ID` → Service ID identifier
   - `APPLE_TEAM_ID` → Your team ID (found in membership details)
   - `APPLE_KEY_ID` → Key ID from step 4
   - `APPLE_PRIVATE_KEY` → Absolute path to `.p8` file

**Important Notes**:
- Client secret is a **JWT token** generated dynamically by Socialite
- Token has **6-month maximum lifetime** (must regenerate)
- The `sub` field is the **unique user identifier** (not email!)
- Email may be hidden by user (privacy feature)
- Name data only provided on **first authorization**

**Data Returned**:
- `sub` - Apple user ID (unique identifier) **USE THIS**
- `email` - User email (may be hidden: `privaterelay@appleid.com`)
- `email_verified` - Boolean
- `is_private_email` - Boolean (true if using Hide My Email)
- `name` - Only on first authorization: `{ firstName, lastName }`

#### Event Service Provider Configuration

**Location**: `app/Providers/EventServiceProvider.php`

For community providers (Discord, Apple), register the event listener:

```php
<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;
use SocialiteProviders\Manager\SocialiteWasCalled;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // ... existing listeners ...
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        // Register Socialite providers
        Event::listen(function (SocialiteWasCalled $event) {
            $event->extendSocialite('discord', \SocialiteProviders\Discord\Provider::class);
            $event->extendSocialite('apple', \SocialiteProviders\Apple\Provider::class);
        });
    }
}
```

**Alternative for Laravel 11+** (if EventServiceProvider removed):

Add to `app/Providers/AppServiceProvider.php`:

```php
public function boot(): void
{
    Event::listen(function (\SocialiteProviders\Manager\SocialiteWasCalled $event) {
        $event->extendSocialite('discord', \SocialiteProviders\Discord\Provider::class);
        $event->extendSocialite('apple', \SocialiteProviders\Apple\Provider::class);
    });
}
```

---

## Security Considerations

### 1. State Parameter Validation

**Risk**: CSRF attacks via OAuth callback

**Mitigation**: Laravel Socialite handles state parameter automatically

**Verify**:
```php
// Socialite automatically validates state parameter
// No additional code needed
```

### 2. Token Handling

**Risk**: Storing OAuth tokens in plain text

**Mitigation**: Encrypt tokens before storage

**Implementation**:
```php
// In SocialAccountEloquent model
protected function casts(): array
{
    return [
        'provider_token' => 'encrypted',
        'provider_refresh_token' => 'encrypted',
        // ...
    ];
}
```

**Alternative**: Don't store tokens at all if not needed for API calls

### 3. Rate Limiting

**Risk**: Brute force attacks on OAuth endpoints

**Mitigation**: Apply rate limiting middleware

**Implementation**:
```php
// routes/subdomain.php
Route::prefix('api/auth/social')->middleware(['throttle:oauth'])->group(function () {
    // ... routes
});

// config/rate-limiting.php or AppServiceProvider
RateLimiter::for('oauth', function (Request $request) {
    return Limit::perMinute(10)->by($request->ip());
});
```

### 4. CSRF Protection

**Risk**: Cross-site request forgery

**Mitigation**:
- OAuth state parameter (automatic)
- Session-based CSRF tokens for authenticated routes

**Verify**:
```php
// Authenticated routes already have VerifyCsrfToken middleware
// Public OAuth routes use state parameter
```

### 5. Email Verification

**Risk**: Unverified emails from social providers

**Strategy Decision**:

**Option A: Trust Provider** (Recommended for Google, Apple)
```php
// In SocialAuthApplicationService::handleSocialLogin()
if ($provider === 'google' || $provider === 'apple') {
    $user->markEmailAsVerified(); // Trust these providers
}
```

**Option B: Always Require Verification**
```php
// Always send verification email even for social sign-ups
$user->requestEmailVerification();
```

### 6. Provider-Specific Security

#### Discord
- **Risk**: Public Discord IDs can be enumerated
- **Mitigation**: Use Discord ID as provider_id, but don't expose publicly

#### Google
- **Risk**: Token refresh can be exploited if refresh token leaked
- **Mitigation**: Encrypt refresh tokens, rotate regularly

#### Apple
- **Risk**: Private key compromise
- **Mitigation**:
  - Store `.p8` file outside web root
  - Permissions: `chmod 600`
  - Never commit to version control (add to `.gitignore`)
  - Rotate key regularly (within 6-month limit)

**Add to `.gitignore`**:
```
storage/keys/*.p8
```

### 7. Account Takeover Prevention

**Risk**: Attacker links their social account to victim's email

**Mitigation**:

```php
// In SocialAuthApplicationService::handleSocialLogin()
if ($userExists && !$socialAccountExists) {
    // Email matches existing user
    // Option A: Require authentication before linking
    throw SocialEmailConflictException::create($email, $existingUserId);

    // Option B: Auto-link with notification email
    // Auto-link + send security notification email
    $this->sendSecurityNotification($user, $provider);
}
```

**Recommended**: Auto-link with email notification (better UX)

### 8. Session Security

**Ensure session configuration**:

```php
// .env
SESSION_DOMAIN=.virtualracingleagues.localhost
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=false  // true in production with HTTPS
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
```

---

## Error Handling

### Error Scenarios

#### 1. OAuth Provider Errors

**Scenario**: Provider returns error (user denies permission, invalid credentials)

**Handling**:
```php
// In SocialAuthController::callback()
try {
    $socialUser = $socialiteProvider->user();
} catch (\Laravel\Socialite\Two\InvalidStateException $e) {
    // State mismatch (CSRF protection)
    return redirect('/social-error?error=invalid_state');
} catch (\GuzzleHttp\Exception\ClientException $e) {
    // Provider API error (4xx)
    return redirect('/social-error?error=provider_error');
} catch (\Exception $e) {
    // General error
    Log::error('Social auth error', [
        'provider' => $provider,
        'error' => $e->getMessage(),
    ]);
    return redirect('/social-error?error=unknown');
}
```

**Frontend Error Page**: `/social-error`

Display user-friendly error messages based on error type.

#### 2. Email Conflicts

**Scenario**: Social email matches existing user email

**Business Rule**: Auto-link with notification

**Handling**:
```php
// In SocialAuthApplicationService::handleSocialLogin()
if ($this->userRepository->existsByEmail($email)) {
    $existingUser = $this->userRepository->findByEmail($email);

    // Check if social account already linked to different user
    if ($this->socialAccountRepository->existsByProvider($provider, $providerId)) {
        $linkedSocialAccount = $this->socialAccountRepository->findByProvider($provider, $providerId);
        if ($linkedSocialAccount->userId() !== $existingUser->id()) {
            throw SocialAccountAlreadyLinkedException::forProvider($provider, $providerId);
        }
    }

    // Auto-link and send notification
    $socialAccount = SocialAccount::create(/* ... */);
    $this->socialAccountRepository->save($socialAccount);

    // Dispatch event for email notification
    event(new SocialAccountLinked($existingUser->id(), /* ... */));

    return ['user' => UserData::fromEntity($existingUser), 'isNewUser' => false];
}
```

#### 3. Invalid Provider

**Scenario**: User tries to authenticate with unsupported provider

**Handling**:
```php
// Route constraint prevents most cases
Route::get('/{provider}/redirect', [SocialAuthController::class, 'redirect'])
    ->whereIn('provider', ['discord', 'google', 'apple']);

// Controller still validates
public function redirect(string $provider): RedirectResponse
{
    try {
        $socialiteProvider = $this->socialiteService->getProvider($provider);
        return $socialiteProvider->redirect();
    } catch (\InvalidArgumentException $e) {
        return redirect('/social-error?error=invalid_provider');
    }
}
```

#### 4. Missing Email

**Scenario**: Provider doesn't return email (Apple privacy, Discord permission denied)

**Handling**:
```php
// In SocialAuthApplicationService::handleSocialLogin()
if (empty($data->email)) {
    // For new users, email is required
    if (!$socialAccountExists) {
        throw new \DomainException('Email is required for registration. Please grant email permission.');
    }

    // For existing users, continue with null email
    // Email stored in user record, not required in social_accounts
}
```

**Frontend**: Show error message and ask user to re-authorize with email permission.

#### 5. Token Expiration

**Scenario**: Stored OAuth token expires

**Handling**:
```php
// In SocialAccount entity
public function isTokenExpired(): bool
{
    if ($this->tokenExpiresAt === null) {
        return false; // No expiration set
    }

    return $this->tokenExpiresAt < new DateTimeImmutable();
}

// When using token for API calls
if ($socialAccount->isTokenExpired()) {
    // Attempt refresh if supported
    if ($socialAccount->provider()->supportsRefreshToken() && $socialAccount->providerRefreshToken() !== null) {
        // Refresh logic (future feature)
        $this->refreshToken($socialAccount);
    } else {
        // Require re-authentication
        throw new TokenExpiredException();
    }
}
```

#### 6. Provider Unavailable

**Scenario**: OAuth provider service is down

**Handling**:
```php
// In SocialAuthController::callback()
try {
    $socialUser = $socialiteProvider->user();
} catch (\GuzzleHttp\Exception\ConnectException $e) {
    // Provider service unreachable
    Log::error('Provider unavailable', [
        'provider' => $provider,
        'error' => $e->getMessage(),
    ]);
    return redirect('/social-error?error=provider_unavailable');
} catch (\GuzzleHttp\Exception\ServerException $e) {
    // Provider server error (5xx)
    return redirect('/social-error?error=provider_error');
}
```

#### 7. Cannot Unlink Last Method

**Scenario**: User tries to unlink last authentication method

**Handling**:
```php
// In SocialAuthApplicationService::unlinkSocialAccount()
$authMethodsCount = $this->socialAccountRepository->countAuthMethodsForUser($userId);

if ($authMethodsCount <= 1) {
    throw CannotUnlinkLastAuthMethodException::forUser($userId);
}
```

**Response**:
```json
{
  "success": false,
  "message": "Cannot unlink last authentication method. Please set a password first.",
  "data": {
    "required_action": "set_password"
  }
}
```

**Frontend**: Show password setup form before unlinking.

### Error Response Format

**Standard API Error Response**:
```json
{
  "success": false,
  "data": null,
  "message": "Human-readable error message",
  "errors": {
    "field": ["Validation error messages"]
  }
}
```

### Logging Strategy

**What to Log**:
- ✅ OAuth failures (with provider, user IP, timestamp)
- ✅ Email conflicts (security concern)
- ✅ Account linking/unlinking
- ✅ Token refresh failures
- ❌ Don't log tokens or sensitive data

**Example**:
```php
// In SocialAuthApplicationService
use Illuminate\Support\Facades\Log;

Log::info('Social account linked', [
    'user_id' => $userId,
    'provider' => $provider,
    'provider_id' => $providerId,
]);

Log::warning('Social email conflict', [
    'provider' => $provider,
    'email' => $email,
    'existing_user_id' => $existingUserId,
]);
```

---

## Testing Plan

### Unit Tests (Domain Layer)

**Location**: `tests/Unit/Domain/User/`

#### 1. SocialAccount Entity Tests

**File**: `tests/Unit/Domain/User/Entities/SocialAccountTest.php`

**Test Cases**:
```php
public function test_can_create_social_account(): void
public function test_can_reconstitute_social_account(): void
public function test_can_update_tokens(): void
public function test_can_update_email(): void
public function test_is_token_expired_returns_true_when_expired(): void
public function test_is_token_expired_returns_false_when_not_expired(): void
public function test_is_token_expired_returns_false_when_no_expiration_set(): void
public function test_records_social_account_linked_event_on_creation(): void
```

**Example**:
```php
public function test_can_create_social_account(): void
{
    $socialAccount = SocialAccount::create(
        userId: 1,
        provider: SocialProvider::DISCORD,
        providerId: SocialProviderId::from('123456789'),
        providerEmail: 'user@example.com',
        providerToken: 'access_token',
        providerRefreshToken: null,
        tokenExpiresAt: null,
    );

    $this->assertNull($socialAccount->id());
    $this->assertEquals(1, $socialAccount->userId());
    $this->assertEquals(SocialProvider::DISCORD, $socialAccount->provider());
    $this->assertEquals('123456789', $socialAccount->providerId()->value());
}
```

#### 2. Value Object Tests

**File**: `tests/Unit/Domain/User/ValueObjects/SocialProviderTest.php`

**Test Cases**:
```php
public function test_can_create_provider_enum(): void
public function test_label_returns_human_readable_name(): void
public function test_supports_refresh_token_for_google(): void
public function test_does_not_support_refresh_token_for_discord(): void
public function test_default_scopes_returns_correct_scopes(): void
```

**File**: `tests/Unit/Domain/User/ValueObjects/SocialProviderIdTest.php`

**Test Cases**:
```php
public function test_can_create_from_string(): void
public function test_throws_exception_for_empty_value(): void
public function test_throws_exception_for_too_long_value(): void
public function test_equals_returns_true_for_same_value(): void
public function test_equals_returns_false_for_different_value(): void
```

### Feature Tests (HTTP Layer)

**Location**: `tests/Feature/Auth/`

#### 3. Social Authentication Flow Tests

**File**: `tests/Feature/Auth/SocialAuthControllerTest.php`

**Test Cases**:

```php
// Redirect tests
public function test_redirect_to_discord_provider(): void
public function test_redirect_to_google_provider(): void
public function test_redirect_to_apple_provider(): void
public function test_redirect_returns_error_for_invalid_provider(): void

// Callback tests (with Socialite mock)
public function test_callback_creates_new_user_when_not_exists(): void
public function test_callback_logs_in_existing_user(): void
public function test_callback_auto_links_when_email_matches(): void
public function test_callback_handles_missing_email_gracefully(): void
public function test_callback_redirects_to_dashboard_on_success(): void

// List accounts tests
public function test_can_list_linked_social_accounts(): void
public function test_list_accounts_returns_empty_when_none_linked(): void
public function test_list_accounts_requires_authentication(): void

// Link account tests
public function test_can_link_social_account(): void
public function test_cannot_link_already_linked_provider(): void
public function test_cannot_link_provider_linked_to_another_user(): void
public function test_link_account_requires_authentication(): void

// Unlink account tests
public function test_can_unlink_social_account(): void
public function test_cannot_unlink_last_auth_method(): void
public function test_cannot_unlink_non_existent_account(): void
public function test_unlink_account_requires_authentication(): void
```

**Example with Socialite Mock**:
```php
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;

public function test_callback_creates_new_user_when_not_exists(): void
{
    // Mock Socialite provider
    $socialiteUser = Mockery::mock(SocialiteUser::class);
    $socialiteUser->shouldReceive('getId')->andReturn('discord123');
    $socialiteUser->shouldReceive('getEmail')->andReturn('newuser@example.com');
    $socialiteUser->shouldReceive('getName')->andReturn('New User');
    $socialiteUser->shouldReceive('getAvatar')->andReturn('https://avatar.url');
    $socialiteUser->token = 'access_token';
    $socialiteUser->refreshToken = null;
    $socialiteUser->expiresIn = 3600;

    Socialite::shouldReceive('driver')
        ->with('discord')
        ->andReturnSelf();
    Socialite::shouldReceive('user')
        ->andReturn($socialiteUser);

    // Make request
    $response = $this->get('/api/auth/social/discord/callback?code=auth_code');

    // Assertions
    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'email' => 'newuser@example.com',
    ]);
    $this->assertDatabaseHas('social_accounts', [
        'provider' => 'discord',
        'provider_id' => 'discord123',
    ]);
}
```

### Integration Tests

#### 4. Repository Tests

**File**: `tests/Feature/Repositories/SocialAccountRepositoryTest.php`

**Test Cases**:
```php
public function test_can_save_and_retrieve_social_account(): void
public function test_find_by_provider_returns_correct_account(): void
public function test_find_by_user_and_provider_returns_correct_account(): void
public function test_find_by_user_id_returns_all_accounts(): void
public function test_exists_by_provider_returns_true_when_exists(): void
public function test_exists_by_user_and_provider_returns_true_when_exists(): void
public function test_can_delete_social_account(): void
public function test_count_auth_methods_includes_password_and_social_accounts(): void
```

### Mock OAuth Responses

**Create test fixtures for OAuth responses**:

**File**: `tests/Fixtures/SocialiteUserFixtures.php`

```php
<?php

namespace Tests\Fixtures;

use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;

class SocialiteUserFixtures
{
    public static function discord(
        string $id = 'discord123',
        string $email = 'user@example.com',
        string $name = 'Discord User'
    ): SocialiteUser {
        $user = Mockery::mock(SocialiteUser::class);
        $user->shouldReceive('getId')->andReturn($id);
        $user->shouldReceive('getEmail')->andReturn($email);
        $user->shouldReceive('getName')->andReturn($name);
        $user->shouldReceive('getAvatar')->andReturn('https://cdn.discordapp.com/avatars/123.png');
        $user->token = 'discord_access_token';
        $user->refreshToken = null;
        $user->expiresIn = 3600;

        return $user;
    }

    public static function google(
        string $id = 'google123',
        string $email = 'user@gmail.com',
        string $name = 'Google User'
    ): SocialiteUser {
        $user = Mockery::mock(SocialiteUser::class);
        $user->shouldReceive('getId')->andReturn($id);
        $user->shouldReceive('getEmail')->andReturn($email);
        $user->shouldReceive('getName')->andReturn($name);
        $user->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/123');
        $user->token = 'google_access_token';
        $user->refreshToken = 'google_refresh_token';
        $user->expiresIn = 3600;

        return $user;
    }

    public static function apple(
        string $id = 'apple123',
        string $email = 'user@privaterelay.appleid.com',
        string $name = 'Apple User'
    ): SocialiteUser {
        $user = Mockery::mock(SocialiteUser::class);
        $user->shouldReceive('getId')->andReturn($id);
        $user->shouldReceive('getEmail')->andReturn($email);
        $user->shouldReceive('getName')->andReturn($name);
        $user->shouldReceive('getAvatar')->andReturn(null); // Apple doesn't provide avatars
        $user->token = 'apple_id_token';
        $user->refreshToken = 'apple_refresh_token';
        $user->expiresIn = 3600;

        return $user;
    }
}
```

### Test Database Setup

**Factory for SocialAccount**:

**File**: `database/factories/SocialAccountFactory.php`

```php
<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\SocialAccountEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Database\Eloquent\Factories\Factory;

class SocialAccountFactory extends Factory
{
    protected $model = SocialAccountEloquent::class;

    public function definition(): array
    {
        return [
            'user_id' => UserEloquent::factory(),
            'provider' => $this->faker->randomElement(['discord', 'google', 'apple']),
            'provider_id' => $this->faker->numerify('##########'),
            'provider_email' => $this->faker->email,
            'provider_token' => $this->faker->sha256,
            'provider_refresh_token' => null,
            'token_expires_at' => now()->addDays(7),
        ];
    }

    public function discord(): self
    {
        return $this->state(fn (array $attributes) => [
            'provider' => 'discord',
        ]);
    }

    public function google(): self
    {
        return $this->state(fn (array $attributes) => [
            'provider' => 'google',
            'provider_refresh_token' => $this->faker->sha256,
        ]);
    }

    public function apple(): self
    {
        return $this->state(fn (array $attributes) => [
            'provider' => 'apple',
            'provider_refresh_token' => $this->faker->sha256,
        ]);
    }

    public function expired(): self
    {
        return $this->state(fn (array $attributes) => [
            'token_expires_at' => now()->subDay(),
        ]);
    }
}
```

### Testing Commands

```bash
# Run all tests
composer test

# Run specific test file
composer test tests/Unit/Domain/User/Entities/SocialAccountTest.php

# Run feature tests only
composer test tests/Feature/Auth/

# Run with coverage
composer test -- --coverage

# Run with filter
composer test -- --filter=social
```

---

## Implementation Checklist

### Phase 1: Domain Layer (Pure PHP)

- [ ] Create `SocialAccount` entity (`app/Domain/User/Entities/SocialAccount.php`)
- [ ] Create `SocialProvider` enum (`app/Domain/User/ValueObjects/SocialProvider.php`)
- [ ] Create `SocialProviderId` value object (`app/Domain/User/ValueObjects/SocialProviderId.php`)
- [ ] Create domain events:
  - [ ] `SocialAccountLinked`
  - [ ] `SocialAccountUnlinked`
  - [ ] `SocialLoginCompleted`
  - [ ] `SocialRegistrationCompleted`
- [ ] Create domain exceptions:
  - [ ] `SocialAccountAlreadyLinkedException`
  - [ ] `SocialAccountNotFoundException`
  - [ ] `InvalidSocialProviderException`
  - [ ] `CannotUnlinkLastAuthMethodException`
  - [ ] `SocialEmailConflictException`
- [ ] Create `SocialAccountRepositoryInterface`
- [ ] Write unit tests for entity and value objects

### Phase 2: Infrastructure Layer

- [ ] Install packages:
  - [ ] `composer require laravel/socialite`
  - [ ] `composer require socialiteproviders/discord`
  - [ ] `composer require socialiteproviders/apple`
- [ ] Create migration: `create_social_accounts_table`
- [ ] Run migration: `php artisan migrate`
- [ ] Create `SocialAccountEloquent` model
- [ ] Create `SocialAccountRepository` implementation
- [ ] Create `SocialiteProviderService`
- [ ] Update `EventServiceProvider` (register Socialite providers)
- [ ] Add encryption to token fields (optional)
- [ ] Create factory: `SocialAccountFactory`

### Phase 3: Application Layer

- [ ] Create `SocialAuthApplicationService`
  - [ ] Implement `handleSocialLogin()`
  - [ ] Implement `linkSocialAccount()`
  - [ ] Implement `unlinkSocialAccount()`
  - [ ] Implement `getSocialAccountsForUser()`
  - [ ] Implement `canUnlinkAccount()`
- [ ] Create DTOs:
  - [ ] `SocialLoginData`
  - [ ] `LinkSocialAccountData`
  - [ ] `SocialAccountData`
- [ ] Write feature tests for application service

### Phase 4: Interface Layer

- [ ] Create `SocialAuthController`
  - [ ] Implement `redirect()`
  - [ ] Implement `callback()`
  - [ ] Implement `listAccounts()`
  - [ ] Implement `linkAccount()`
  - [ ] Implement `unlinkAccount()`
- [ ] Add routes to `routes/subdomain.php`:
  - [ ] Public routes (redirect, callback)
  - [ ] Authenticated routes (list, link, unlink)
- [ ] Write feature tests for controller

### Phase 5: Configuration

- [ ] Create Discord OAuth application
- [ ] Create Google OAuth application
- [ ] Create Apple Sign In configuration
- [ ] Add environment variables to `.env`:
  - [ ] Discord credentials
  - [ ] Google credentials
  - [ ] Apple credentials
- [ ] Update `config/services.php`
- [ ] Store Apple private key (`.p8` file)
- [ ] Add `.p8` files to `.gitignore`

### Phase 6: Security & Error Handling

- [ ] Implement rate limiting on OAuth endpoints
- [ ] Add token encryption (if storing tokens)
- [ ] Create error handling for:
  - [ ] Invalid provider
  - [ ] Missing email
  - [ ] Email conflicts
  - [ ] Provider errors
  - [ ] Token expiration
- [ ] Create frontend error page (`/social-error`)
- [ ] Add logging for security events
- [ ] Test CSRF protection
- [ ] Test session sharing across subdomains

### Phase 7: Testing & Quality

- [ ] Run all unit tests: `composer test tests/Unit/`
- [ ] Run all feature tests: `composer test tests/Feature/`
- [ ] Run PHPStan: `composer phpstan`
- [ ] Run PHPCS: `composer phpcs`
- [ ] Fix code style: `composer phpcbf`
- [ ] Test manually with each provider:
  - [ ] Discord login/register
  - [ ] Google login/register
  - [ ] Apple login/register
  - [ ] Link accounts
  - [ ] Unlink accounts
  - [ ] Error scenarios

### Phase 8: Documentation

- [ ] Update API documentation
- [ ] Document OAuth setup for each provider
- [ ] Create user guide for linking accounts
- [ ] Update environment variable documentation
- [ ] Document error codes and responses

---

## Next Steps After Backend Completion

1. **Frontend Implementation**: See `03-frontend-plan.md`
   - Vue components for social login buttons
   - OAuth popup/redirect handling
   - Account linking UI in user dashboard
   - Error handling and user feedback

2. **Email Notifications**:
   - Send email when social account is auto-linked
   - Security notification for new linked accounts
   - Notification when account is unlinked

3. **Advanced Features** (Future):
   - Token refresh mechanism
   - Fetch user data from provider APIs (using stored tokens)
   - Sync profile picture from social provider
   - Two-factor authentication with social accounts

4. **Analytics & Monitoring**:
   - Track social login conversion rates
   - Monitor OAuth errors
   - Dashboard for social auth statistics

---

**End of Backend Implementation Plan v1.0**

## References

- [Laravel Socialite Documentation](https://laravel.com/docs/12.x/socialite)
- [Socialite Providers Website](https://socialiteproviders.com/)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [DDD Backend Architecture Overview](./../../../.claude/guides/backend/ddd-overview.md)
- [Admin Backend Guide](./../../../.claude/guides/backend/admin-backend-guide.md)
