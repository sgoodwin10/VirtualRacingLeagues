<?php

declare(strict_types=1);

namespace App\Application\User\Services;

use App\Application\User\DTOs\LoginCredentialsData;
use App\Application\User\DTOs\RegisterUserData;
use App\Application\User\DTOs\RequestPasswordResetData;
use App\Application\User\DTOs\ResetPasswordData;
use App\Application\User\DTOs\UpdateProfileData;
use App\Application\User\DTOs\UserData;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\User\Entities\User;
use App\Domain\User\Events\UserLoggedIn;
use App\Domain\User\Events\UserLoggedOut;
use App\Domain\User\Exceptions\InvalidCredentialsException;
use App\Domain\User\Exceptions\UserAlreadyExistsException;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

/**
 * User Authentication Service.
 * Handles user authentication, registration, email verification, and password reset.
 */
final class UserAuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {
    }

    /**
     * Register a new user.
     *
     * @throws UserAlreadyExistsException
     */
    public function register(RegisterUserData $data): UserData
    {
        // Check if user already exists
        if ($this->userRepository->existsByEmail($data->email)) {
            throw UserAlreadyExistsException::withEmail($data->email);
        }

        return DB::transaction(function () use ($data) {
            // Create domain entity
            $user = User::create(
                fullName: FullName::from($data->first_name, $data->last_name),
                email: EmailAddress::from($data->email),
                password: Hash::make($data->password),
            );

            // Request email verification
            $user->requestEmailVerification();

            // Persist
            $this->userRepository->save($user);

            // Record creation event now that ID is set
            $user->recordCreationEvent();

            // Dispatch domain events
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Authenticate user and create session.
     *
     * @throws InvalidCredentialsException
     */
    public function login(LoginCredentialsData $credentials): UserData
    {
        $attempt = Auth::guard('web')->attempt(
            ['email' => $credentials->email, 'password' => $credentials->password],
            $credentials->remember
        );

        if (!$attempt) {
            throw InvalidCredentialsException::forLogin();
        }

        /** @var UserEloquent $eloquentUser */
        $eloquentUser = Auth::guard('web')->user();

        if (!$eloquentUser) {
            throw InvalidCredentialsException::forLogin();
        }

        $user = $this->userRepository->findById($eloquentUser->id);

        // Dispatch login event
        $userId = $user->id();
        if ($userId !== null) {
            Event::dispatch(new UserLoggedIn($userId, $user->email()->value()));
        }

        return UserData::fromEntity($user);
    }

    /**
     * Logout the current user.
     */
    public function logout(): void
    {
        /** @var UserEloquent|null $eloquentUser */
        $eloquentUser = Auth::guard('web')->user();

        if ($eloquentUser) {
            // Use findByIdOrNull to avoid exceptions if user was deleted
            $user = $this->userRepository->findByIdOrNull($eloquentUser->id);

            // Dispatch logout event before actually logging out (only if user still exists)
            if ($user !== null) {
                $userId = $user->id();
                if ($userId !== null) {
                    Event::dispatch(new UserLoggedOut($userId, $user->email()->value()));
                }
            }
        }

        Auth::guard('web')->logout();
    }

    /**
     * Get the currently authenticated user.
     */
    public function getCurrentUser(): ?User
    {
        /** @var UserEloquent|null $eloquentUser */
        $eloquentUser = Auth::guard('web')->user();

        if (!$eloquentUser) {
            return null;
        }

        return $this->userRepository->findByIdOrNull($eloquentUser->id);
    }

    /**
     * Get the currently authenticated user as DTO.
     */
    public function getCurrentUserData(): ?UserData
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return null;
        }

        return UserData::fromEntity($user);
    }

    /**
     * Verify user's email address.
     */
    public function verifyEmail(int $userId, string $hash): bool
    {
        return DB::transaction(function () use ($userId, $hash) {
            $user = $this->userRepository->findByIdOrNull($userId);

            if (!$user) {
                return false;
            }

            if ($user->isEmailVerified()) {
                return true; // Already verified
            }

            // Verify hash matches
            if (!hash_equals($hash, sha1($user->email()->value()))) {
                return false;
            }

            $user->markEmailAsVerified();
            $this->userRepository->save($user);
            $this->dispatchEvents($user);

            return true;
        });
    }

    /**
     * Resend email verification notification.
     */
    public function resendVerificationEmail(User $user): void
    {
        if ($user->isEmailVerified()) {
            return; // Already verified
        }

        $user->requestEmailVerification();
        $this->userRepository->save($user);
        $this->dispatchEvents($user);
    }

    /**
     * Request password reset.
     * Returns Laravel's password broker status constant.
     */
    public function requestPasswordReset(RequestPasswordResetData $data): string
    {
        // Find the user first to dispatch the event
        $user = $this->userRepository->findByEmailOrNull($data->email);

        if ($user) {
            $user->requestPasswordReset();
            $this->userRepository->save($user);
            $this->dispatchEvents($user);
        }

        $status = Password::broker('users')->sendResetLink(['email' => $data->email]);

        return $status;
    }

    /**
     * Reset user password.
     * Returns Laravel's password broker status constant.
     */
    public function resetPassword(ResetPasswordData $data): string
    {
        $resetData = [
            'email' => $data->email,
            'password' => $data->password,
            'token' => $data->token,
        ];

        // Add password_confirmation if provided (for Laravel's validation)
        if ($data->password_confirmation !== null) {
            $resetData['password_confirmation'] = $data->password_confirmation;
        }

        $status = Password::broker('users')->reset(
            $resetData,
            function ($eloquentUser, $password) {
                /** @var UserEloquent $eloquentUser */
                $user = $this->userRepository->findById($eloquentUser->id);
                $user->resetPassword(Hash::make($password));
                $this->userRepository->save($user);
                $this->dispatchEvents($user);
            }
        );

        return $status;
    }

    /**
     * Update user profile.
     *
     * @throws \InvalidArgumentException if password is provided without current password
     * @throws InvalidCredentialsException if current password is incorrect
     */
    public function updateProfile(int $userId, UpdateProfileData $data): UserData
    {
        return DB::transaction(function () use ($userId, $data) {
            $user = $this->userRepository->findById($userId);

            // Verify current password if changing password
            if ($data->password) {
                if (!$data->current_password) {
                    throw new \InvalidArgumentException('Current password is required to change password');
                }

                /** @var UserEloquent $eloquentUser */
                $eloquentUser = Auth::guard('web')->user();

                if (!$eloquentUser || !Hash::check($data->current_password, $eloquentUser->password)) {
                    throw InvalidCredentialsException::forLogin();
                }
            }

            // Update profile (will trigger email verification if email changed)
            $user->updateProfile(
                fullName: FullName::from($data->first_name, $data->last_name),
                email: EmailAddress::from($data->email),
            );

            // Update password if provided
            if ($data->password) {
                $user->updatePassword(Hash::make($data->password));
            }

            $this->userRepository->save($user);
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(User $user): void
    {
        $events = $user->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }
}
