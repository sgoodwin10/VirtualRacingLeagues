# User Authentication Backend - Complete Implementation Plan

**Project:** Laravel 12 + Vue 3 Dual Dashboard Template
**Component:** Backend (Laravel with DDD)
**Feature:** User Authentication System
**Agent:** `dev-be` (Laravel/PHP Backend Expert)
**Date:** 2025-10-15

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Domain Layer](#2-domain-layer)
3. [Application Layer](#3-application-layer)
4. [Infrastructure Layer](#4-infrastructure-layer)
5. [Interface Layer](#5-interface-layer)
6. [Email Notifications](#6-email-notifications)
7. [Middleware & Guards](#7-middleware--guards)
8. [Testing Strategy](#8-testing-strategy)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Architecture Overview

### DDD Layers

```
┌─────────────────────────────────────────────────────────┐
│  Interface Layer (HTTP Controllers, Form Requests)      │
│  Thin controllers (3-5 lines per method)                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Application Layer (UserAuthService, DTOs)              │
│  Use case orchestration, transactions, emails           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Domain Layer (User Entity, Value Objects, Events)      │
│  Pure business logic (NO Laravel dependencies)          │
└─────────────────────────────────────────────────────────┘
                          ↑
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Layer (UserEloquentRepository)          │
│  Database persistence, Entity ↔ Eloquent mapping       │
└─────────────────────────────────────────────────────────┘
```

### Bounded Context: User

**Existing structure:**
```
app/
├── Domain/
│   └── User/
│       ├── Entities/User.php
│       ├── ValueObjects/UserStatus.php
│       ├── ValueObjects/UserAlias.php
│       ├── Events/UserCreated.php
│       ├── Events/UserUpdated.php
│       ├── Exceptions/
│       └── Repositories/UserRepositoryInterface.php
├── Application/
│   └── User/
│       ├── Services/UserApplicationService.php
│       └── DTOs/
├── Infrastructure/
│   └── Persistence/Eloquent/
│       ├── Models/User.php (Eloquent)
│       └── Repositories/UserEloquentRepository.php
```

**New additions for authentication:**
```
app/
├── Domain/
│   └── User/
│       ├── ValueObjects/EmailVerificationToken.php (new)
│       ├── ValueObjects/PasswordResetToken.php (new)
│       ├── Events/EmailVerificationRequested.php (new)
│       ├── Events/EmailVerified.php (new)
│       ├── Events/PasswordResetRequested.php (new)
│       ├── Events/PasswordResetCompleted.php (new)
│       └── Exceptions/EmailAlreadyVerifiedException.php (new)
├── Application/
│   └── User/
│       ├── Services/UserAuthService.php (new)
│       └── DTOs/
│           ├── RegisterUserData.php (new)
│           ├── LoginCredentialsData.php (new)
│           ├── UpdateProfileData.php (new)
│           ├── RequestPasswordResetData.php (new)
│           └── ResetPasswordData.php (new)
├── Http/
│   ├── Controllers/Auth/
│   │   ├── RegisterController.php (new)
│   │   ├── LoginController.php (new)
│   │   ├── EmailVerificationController.php (new)
│   │   ├── PasswordResetController.php (new)
│   │   └── ProfileController.php (new)
│   └── Requests/Auth/
│       ├── RegisterRequest.php (new)
│       ├── LoginRequest.php (new)
│       ├── UpdateProfileRequest.php (new)
│       └── ResetPasswordRequest.php (new)
└── Notifications/
    ├── EmailVerificationNotification.php (new)
    └── PasswordResetNotification.php (new)
```

---

## 2. Domain Layer

### 2.1 Update User Entity

**File:** `app/Domain/User/Entities/User.php`

**Add methods:**
```php
// Email verification
public function markEmailAsVerified(): void
{
    if ($this->emailVerifiedAt !== null) {
        throw new EmailAlreadyVerifiedException();
    }

    $this->emailVerifiedAt = new \DateTimeImmutable();
    $this->recordEvent(new EmailVerified($this));
}

public function isEmailVerified(): bool
{
    return $this->emailVerifiedAt !== null;
}

public function requestEmailVerification(): void
{
    $this->recordEvent(new EmailVerificationRequested($this));
}

// Password reset
public function requestPasswordReset(): void
{
    $this->recordEvent(new PasswordResetRequested($this));
}

public function resetPassword(string $newPassword): void
{
    $this->password = $newPassword; // Will be hashed in infrastructure layer
    $this->recordEvent(new PasswordResetCompleted($this));
}

// Profile updates
public function updateProfile(string $name, EmailAddress $email): void
{
    $emailChanged = !$this->email->equals($email);

    $this->name = $name;
    $this->email = $email;

    if ($emailChanged) {
        $this->emailVerifiedAt = null; // Require re-verification
        $this->recordEvent(new EmailVerificationRequested($this));
    }

    $this->recordEvent(new UserUpdated($this));
}
```

**Add properties:**
```php
private ?\DateTimeImmutable $emailVerifiedAt = null;
```

### 2.2 Value Objects

#### EmailVerificationToken
**File:** `app/Domain/User/ValueObjects/EmailVerificationToken.php`

```php
<?php

namespace App\Domain\User\ValueObjects;

final class EmailVerificationToken
{
    private function __construct(
        private readonly string $token
    ) {}

    public static function generate(): self
    {
        return new self(bin2hex(random_bytes(32)));
    }

    public static function fromString(string $token): self
    {
        if (strlen($token) !== 64) {
            throw new \InvalidArgumentException('Invalid token format');
        }

        return new self($token);
    }

    public function value(): string
    {
        return $this->token;
    }
}
```

#### PasswordResetToken
**File:** `app/Domain/User/ValueObjects/PasswordResetToken.php`

```php
<?php

namespace App\Domain\User\ValueObjects;

final class PasswordResetToken
{
    private function __construct(
        private readonly string $token
    ) {}

    public static function generate(): self
    {
        return new self(bin2hex(random_bytes(32)));
    }

    public static function fromString(string $token): self
    {
        if (strlen($token) !== 64) {
            throw new \InvalidArgumentException('Invalid token format');
        }

        return new self($token);
    }

    public function value(): string
    {
        return $this->token;
    }
}
```

### 2.3 Domain Events

#### EmailVerificationRequested
**File:** `app/Domain/User/Events/EmailVerificationRequested.php`

```php
<?php

namespace App\Domain\User\Events;

use App\Domain\User\Entities\User;

final class EmailVerificationRequested
{
    public function __construct(
        public readonly User $user
    ) {}
}
```

#### EmailVerified
**File:** `app/Domain/User/Events/EmailVerified.php`

```php
<?php

namespace App\Domain\User\Events;

use App\Domain\User\Entities\User;

final class EmailVerified
{
    public function __construct(
        public readonly User $user
    ) {}
}
```

#### PasswordResetRequested
**File:** `app/Domain/User/Events/PasswordResetRequested.php`

```php
<?php

namespace App\Domain\User\Events;

use App\Domain\User\Entities\User;

final class PasswordResetRequested
{
    public function __construct(
        public readonly User $user
    ) {}
}
```

#### PasswordResetCompleted
**File:** `app/Domain/User/Events/PasswordResetCompleted.php`

```php
<?php

namespace App\Domain\User\Events;

use App\Domain\User\Entities\User;

final class PasswordResetCompleted
{
    public function __construct(
        public readonly User $user
    ) {}
}
```

### 2.4 Exceptions

**File:** `app/Domain/User/Exceptions/EmailAlreadyVerifiedException.php`

```php
<?php

namespace App\Domain\User\Exceptions;

final class EmailAlreadyVerifiedException extends \DomainException
{
    public function __construct()
    {
        parent::__construct('Email is already verified');
    }
}
```

**File:** `app/Domain/User/Exceptions/InvalidCredentialsException.php`

```php
<?php

namespace App\Domain\User\Exceptions;

final class InvalidCredentialsException extends \DomainException
{
    public function __construct()
    {
        parent::__construct('Invalid credentials provided');
    }
}
```

---

## 3. Application Layer

### 3.1 DTOs

#### RegisterUserData
**File:** `app/Application/User/DTOs/RegisterUserData.php`

```php
<?php

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

class RegisterUserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}
```

#### LoginCredentialsData
**File:** `app/Application/User/DTOs/LoginCredentialsData.php`

```php
<?php

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

class LoginCredentialsData extends Data
{
    public function __construct(
        public string $email,
        public string $password,
        public bool $remember = false,
    ) {}
}
```

#### UpdateProfileData
**File:** `app/Application/User/DTOs/UpdateProfileData.php`

```php
<?php

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

class UpdateProfileData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $password = null,
        public ?string $current_password = null,
    ) {}
}
```

#### RequestPasswordResetData
**File:** `app/Application/User/DTOs/RequestPasswordResetData.php`

```php
<?php

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

class RequestPasswordResetData extends Data
{
    public function __construct(
        public string $email,
    ) {}
}
```

#### ResetPasswordData
**File:** `app/Application/User/DTOs/ResetPasswordData.php`

```php
<?php

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

class ResetPasswordData extends Data
{
    public function __construct(
        public string $email,
        public string $token,
        public string $password,
    ) {}
}
```

### 3.2 UserAuthService

**File:** `app/Application/User/Services/UserAuthService.php`

```php
<?php

namespace App\Application\User\Services;

use App\Application\User\DTOs\LoginCredentialsData;
use App\Application\User\DTOs\RegisterUserData;
use App\Application\User\DTOs\UpdateProfileData;
use App\Application\User\DTOs\RequestPasswordResetData;
use App\Application\User\DTOs\ResetPasswordData;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\User\Entities\User;
use App\Domain\User\Exceptions\InvalidCredentialsException;
use App\Domain\User\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;

class UserAuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * Register a new user
     */
    public function register(RegisterUserData $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create(
                name: $data->name,
                email: EmailAddress::fromString($data->email),
                password: Hash::make($data->password)
            );

            $user->requestEmailVerification();
            $this->userRepository->save($user);

            return $user;
        });
    }

    /**
     * Authenticate user
     */
    public function login(LoginCredentialsData $credentials): User
    {
        $attempt = Auth::guard('web')->attempt(
            ['email' => $credentials->email, 'password' => $credentials->password],
            $credentials->remember
        );

        if (!$attempt) {
            throw new InvalidCredentialsException();
        }

        /** @var \App\Infrastructure\Persistence\Eloquent\Models\User $eloquentUser */
        $eloquentUser = Auth::guard('web')->user();

        return $this->userRepository->findById($eloquentUser->id);
    }

    /**
     * Logout user
     */
    public function logout(): void
    {
        Auth::guard('web')->logout();
    }

    /**
     * Get authenticated user
     */
    public function getCurrentUser(): ?User
    {
        $eloquentUser = Auth::guard('web')->user();

        if (!$eloquentUser) {
            return null;
        }

        return $this->userRepository->findById($eloquentUser->id);
    }

    /**
     * Verify email
     */
    public function verifyEmail(int $userId, string $hash): bool
    {
        return DB::transaction(function () use ($userId, $hash) {
            $user = $this->userRepository->findById($userId);

            if (!$user) {
                return false;
            }

            if ($user->isEmailVerified()) {
                return true;
            }

            if (!hash_equals($hash, sha1($user->email()->value()))) {
                return false;
            }

            $user->markEmailAsVerified();
            $this->userRepository->save($user);

            return true;
        });
    }

    /**
     * Resend verification email
     */
    public function resendVerificationEmail(User $user): void
    {
        $user->requestEmailVerification();
        $this->userRepository->save($user);
    }

    /**
     * Request password reset
     */
    public function requestPasswordReset(RequestPasswordResetData $data): string
    {
        $status = Password::sendResetLink(['email' => $data->email]);

        return $status;
    }

    /**
     * Reset password
     */
    public function resetPassword(ResetPasswordData $data): string
    {
        $status = Password::reset(
            [
                'email' => $data->email,
                'password' => $data->password,
                'token' => $data->token,
            ],
            function ($user, $password) {
                $domainUser = $this->userRepository->findById($user->id);
                $domainUser->resetPassword(Hash::make($password));
                $this->userRepository->save($domainUser);
            }
        );

        return $status;
    }

    /**
     * Update user profile
     */
    public function updateProfile(int $userId, UpdateProfileData $data): User
    {
        return DB::transaction(function () use ($userId, $data) {
            $user = $this->userRepository->findById($userId);

            // Verify current password if changing password
            if ($data->password) {
                if (!$data->current_password) {
                    throw new \InvalidArgumentException('Current password required');
                }

                $eloquentUser = Auth::guard('web')->user();
                if (!Hash::check($data->current_password, $eloquentUser->password)) {
                    throw new InvalidCredentialsException();
                }
            }

            // Update profile
            $user->updateProfile(
                $data->name,
                EmailAddress::fromString($data->email)
            );

            // Update password if provided
            if ($data->password) {
                $user->resetPassword(Hash::make($data->password));
            }

            $this->userRepository->save($user);

            return $user;
        });
    }
}
```

---

## 4. Infrastructure Layer

### 4.1 Update Eloquent Model

**File:** `app/Infrastructure/Persistence/Eloquent/Models/User.php`

**Add:**
```php
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at', // Add this
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
}
```

### 4.2 Database Migration

**Create migration:**
```bash
php artisan make:migration add_email_verification_to_users_table
```

**File:** `database/migrations/YYYY_MM_DD_HHMMSS_add_email_verification_to_users_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('email_verified_at')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('email_verified_at');
        });
    }
};
```

**Create password reset tokens table:**
```bash
php artisan make:migration create_password_reset_tokens_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
    }
};
```

---

## 5. Interface Layer

### 5.1 Controllers

#### RegisterController
**File:** `app/Http/Controllers/Auth/RegisterController.php`

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Application\User\DTOs\RegisterUserData;
use App\Application\User\Services\UserAuthService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;

class RegisterController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register(
            RegisterUserData::from($request->validated())
        );

        event(new Registered($user));

        return ApiResponse::created([
            'message' => 'Registration successful. Please check your email to verify your account.',
        ]);
    }
}
```

#### LoginController
**File:** `app/Http/Controllers/Auth/LoginController.php`

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Application\User\DTOs\LoginCredentialsData;
use App\Application\User\Services\UserAuthService;
use App\Domain\User\Exceptions\InvalidCredentialsException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;

class LoginController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $user = $this->authService->login(
                LoginCredentialsData::from($request->validated())
            );

            return ApiResponse::success([
                'user' => [
                    'id' => $user->id(),
                    'name' => $user->name(),
                    'email' => $user->email()->value(),
                    'email_verified_at' => $user->emailVerifiedAt()?->format('Y-m-d H:i:s'),
                ],
            ]);
        } catch (InvalidCredentialsException $e) {
            return ApiResponse::error('Invalid credentials', null, 422);
        }
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout();
        return ApiResponse::success(['message' => 'Logged out successfully']);
    }

    public function me(): JsonResponse
    {
        $user = $this->authService->getCurrentUser();

        if (!$user) {
            return ApiResponse::error('Unauthenticated', null, 401);
        }

        return ApiResponse::success([
            'user' => [
                'id' => $user->id(),
                'name' => $user->name(),
                'email' => $user->email()->value(),
                'email_verified_at' => $user->emailVerifiedAt()?->format('Y-m-d H:i:s'),
            ],
        ]);
    }
}
```

#### EmailVerificationController
**File:** `app/Http/Controllers/Auth/EmailVerificationController.php`

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Application\User\Services\UserAuthService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {}

    public function verify(Request $request, int $id, string $hash): JsonResponse
    {
        $verified = $this->authService->verifyEmail($id, $hash);

        if (!$verified) {
            return ApiResponse::error('Invalid verification link', null, 403);
        }

        return ApiResponse::success(['message' => 'Email verified successfully']);
    }

    public function resend(Request $request): JsonResponse
    {
        $user = $this->authService->getCurrentUser();

        if (!$user) {
            return ApiResponse::error('Unauthenticated', null, 401);
        }

        if ($user->isEmailVerified()) {
            return ApiResponse::error('Email already verified', null, 422);
        }

        $this->authService->resendVerificationEmail($user);

        return ApiResponse::success(['message' => 'Verification link sent']);
    }
}
```

#### PasswordResetController
**File:** `app/Http/Controllers/Auth/PasswordResetController.php`

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Application\User\DTOs\RequestPasswordResetData;
use App\Application\User\DTOs\ResetPasswordData;
use App\Application\User\Services\UserAuthService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class PasswordResetController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {}

    public function requestReset(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = $this->authService->requestPasswordReset(
            RequestPasswordResetData::from($request->only('email'))
        );

        return $status === Password::RESET_LINK_SENT
            ? ApiResponse::success(['message' => 'Password reset link sent'])
            : ApiResponse::error('Unable to send reset link', null, 422);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = $this->authService->resetPassword(
            ResetPasswordData::from($request->validated())
        );

        return $status === Password::PASSWORD_RESET
            ? ApiResponse::success(['message' => 'Password reset successfully'])
            : ApiResponse::error('Unable to reset password', null, 422);
    }
}
```

#### ProfileController
**File:** `app/Http/Controllers/Auth/ProfileController.php`

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Application\User\DTOs\UpdateProfileData;
use App\Application\User\Services\UserAuthService;
use App\Domain\User\Exceptions\InvalidCredentialsException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {}

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->authService->getCurrentUser();

        if (!$user) {
            return ApiResponse::error('Unauthenticated', null, 401);
        }

        try {
            $updatedUser = $this->authService->updateProfile(
                $user->id(),
                UpdateProfileData::from($request->validated())
            );

            return ApiResponse::success([
                'user' => [
                    'id' => $updatedUser->id(),
                    'name' => $updatedUser->name(),
                    'email' => $updatedUser->email()->value(),
                    'email_verified_at' => $updatedUser->emailVerifiedAt()?->format('Y-m-d H:i:s'),
                ],
                'message' => 'Profile updated successfully',
            ]);
        } catch (InvalidCredentialsException $e) {
            return ApiResponse::error('Invalid current password', null, 422);
        }
    }
}
```

### 5.2 Form Requests

#### RegisterRequest
**File:** `app/Http/Requests/Auth/RegisterRequest.php`

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
```

#### LoginRequest
**File:** `app/Http/Requests/Auth/LoginRequest.php`

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ];
    }
}
```

#### UpdateProfileRequest
**File:** `app/Http/Requests/Auth/UpdateProfileRequest.php`

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'current_password' => ['required_with:password', 'string'],
        ];
    }
}
```

#### ResetPasswordRequest
**File:** `app/Http/Requests/Auth/ResetPasswordRequest.php`

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
```

---

## 6. Email Notifications

### 6.1 Email Verification Notification

**File:** `app/Notifications/EmailVerificationNotification.php`

```php
<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class EmailVerificationNotification extends BaseVerifyEmail
{
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify Email Address')
            ->line('Please click the button below to verify your email address.')
            ->action('Verify Email Address', $verificationUrl)
            ->line('If you did not create an account, no further action is required.');
    }
}
```

### 6.2 Password Reset Notification

**File:** `app/Notifications/PasswordResetNotification.php`

```php
<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class PasswordResetNotification extends BaseResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $resetUrl = url(config('app.frontend_url').'/reset-password?token='.$this->token.'&email='.urlencode($notifiable->email));

        return (new MailMessage)
            ->subject('Reset Password Notification')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $resetUrl)
            ->line('This password reset link will expire in '.config('auth.passwords.users.expire').' minutes.')
            ->line('If you did not request a password reset, no further action is required.');
    }
}
```

### 6.3 Update User Model for Notifications

**File:** `app/Infrastructure/Persistence/Eloquent/Models/User.php`

```php
use App\Notifications\EmailVerificationNotification;
use App\Notifications\PasswordResetNotification;

public function sendEmailVerificationNotification(): void
{
    $this->notify(new EmailVerificationNotification());
}

public function sendPasswordResetNotification($token): void
{
    $this->notify(new PasswordResetNotification($token));
}
```

### 6.4 Configure Mail

**File:** `config/mail.php`

Ensure SMTP is configured to use Mailpit:

```php
'default' => env('MAIL_MAILER', 'smtp'),

'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
    'name' => env('MAIL_FROM_NAME', 'Example'),
],
```

**File:** `.env`

```env
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@yourdomain.localhost"
MAIL_FROM_NAME="${APP_NAME}"
```

---

## 7. Middleware & Guards

### 7.1 Routes

**File:** `routes/api.php`

```php
<?php

use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ProfileController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);
Route::post('/forgot-password', [PasswordResetController::class, 'requestReset']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);

// Email verification (signed routes)
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed'])
    ->name('verification.verify');

// Authenticated routes
Route::middleware(['auth:web'])->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/me', [LoginController::class, 'me']);

    // Email verification
    Route::post('/email/resend', [EmailVerificationController::class, 'resend'])
        ->middleware(['throttle:6,1']);

    // Profile
    Route::put('/profile', [ProfileController::class, 'update']);
});
```

### 7.2 CSRF Configuration

Ensure API routes are exempt from CSRF (already configured in Laravel):

**File:** `app/Http/Middleware/VerifyCsrfToken.php`

```php
protected $except = [
    'api/*',
];
```

---

## 8. Testing Strategy

### 8.1 Unit Tests (Domain Layer)

**File:** `tests/Unit/Domain/User/UserEntityTest.php`

```php
<?php

namespace Tests\Unit\Domain\User;

use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\User\Entities\User;
use App\Domain\User\Exceptions\EmailAlreadyVerifiedException;
use PHPUnit\Framework\TestCase;

class UserEntityTest extends TestCase
{
    public function test_can_mark_email_as_verified(): void
    {
        $user = User::create(
            name: 'John Doe',
            email: EmailAddress::fromString('john@example.com'),
            password: 'hashed-password'
        );

        $this->assertFalse($user->isEmailVerified());

        $user->markEmailAsVerified();

        $this->assertTrue($user->isEmailVerified());
    }

    public function test_cannot_verify_already_verified_email(): void
    {
        $user = User::create(
            name: 'John Doe',
            email: EmailAddress::fromString('john@example.com'),
            password: 'hashed-password'
        );

        $user->markEmailAsVerified();

        $this->expectException(EmailAlreadyVerifiedException::class);
        $user->markEmailAsVerified();
    }
}
```

### 8.2 Feature Tests (API Endpoints)

**File:** `tests/Feature/Auth/RegistrationTest.php`

```php
<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
    }
}
```

**File:** `tests/Feature/Auth/LoginTest.php`

```php
<?php

namespace Tests\Feature\Auth;

use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['data' => ['user']]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }
}
```

---

## 9. Implementation Checklist

### Domain Layer
- [ ] Update `User` entity with email verification methods
- [ ] Update `User` entity with password reset methods
- [ ] Update `User` entity with profile update methods
- [ ] Create `EmailVerificationToken` value object
- [ ] Create `PasswordResetToken` value object
- [ ] Create `EmailVerificationRequested` event
- [ ] Create `EmailVerified` event
- [ ] Create `PasswordResetRequested` event
- [ ] Create `PasswordResetCompleted` event
- [ ] Create `EmailAlreadyVerifiedException`
- [ ] Create `InvalidCredentialsException`

### Application Layer
- [ ] Create `RegisterUserData` DTO
- [ ] Create `LoginCredentialsData` DTO
- [ ] Create `UpdateProfileData` DTO
- [ ] Create `RequestPasswordResetData` DTO
- [ ] Create `ResetPasswordData` DTO
- [ ] Create `UserAuthService` with all methods

### Infrastructure Layer
- [ ] Update Eloquent `User` model to implement `MustVerifyEmail`
- [ ] Create migration for `email_verified_at` column
- [ ] Create migration for `password_reset_tokens` table
- [ ] Run migrations

### Interface Layer
- [ ] Create `RegisterController`
- [ ] Create `LoginController`
- [ ] Create `EmailVerificationController`
- [ ] Create `PasswordResetController`
- [ ] Create `ProfileController`
- [ ] Create `RegisterRequest`
- [ ] Create `LoginRequest`
- [ ] Create `UpdateProfileRequest`
- [ ] Create `ResetPasswordRequest`
- [ ] Define API routes

### Email Notifications
- [ ] Create `EmailVerificationNotification`
- [ ] Create `PasswordResetNotification`
- [ ] Update `User` model with notification methods
- [ ] Configure mail settings in `.env`
- [ ] Test emails with Mailpit

### Testing
- [ ] Write unit tests for `User` entity
- [ ] Write feature tests for registration
- [ ] Write feature tests for login
- [ ] Write feature tests for email verification
- [ ] Write feature tests for password reset
- [ ] Write feature tests for profile updates
- [ ] Ensure PHPStan level 8 passes
- [ ] Ensure PSR-12 code style compliance

### Configuration
- [ ] Update `.env` with mail settings
- [ ] Add `FRONTEND_URL` to `.env` for email links
- [ ] Configure session lifetime
- [ ] Configure password reset expiration

---

## Next Steps

1. Review this plan with the `dev-be` agent
2. Implement each section sequentially
3. Test each feature thoroughly
4. Document any deviations or issues
5. Proceed to frontend implementation

---

**Agent:** `dev-be`
**Prepared by:** Claude Code
**Last Updated:** 2025-10-15
