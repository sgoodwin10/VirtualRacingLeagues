<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\User\Events\EmailVerificationRequested;
use App\Domain\User\Events\EmailVerified;
use App\Domain\User\Events\PasswordResetCompleted;
use App\Domain\User\Events\PasswordResetRequested;
use App\Domain\User\Events\UserActivated;
use App\Domain\User\Events\UserCreated;
use App\Domain\User\Events\UserDeactivated;
use App\Domain\User\Events\UserDeleted;
use App\Domain\User\Events\UserLoggedIn;
use App\Domain\User\Events\UserLoggedOut;
use App\Domain\User\Events\UserRestored;
use App\Domain\User\Events\UserUpdated;
use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Database\Eloquent\Model;

/**
 * Listener for logging user domain events to activity log.
 * Note: Synchronous to ensure logs are immediately available.
 */
final class LogUserActivity
{
    /**
     * Handle the event.
     *
     * @param UserCreated|UserUpdated|UserActivated|UserDeactivated|UserDeleted|UserRestored
     *        |EmailVerificationRequested|EmailVerified|PasswordResetRequested
     *        |PasswordResetCompleted|UserLoggedIn|UserLoggedOut $event
     */
    public function handle(object $event): void
    {
        match (true) {
            $event instanceof UserCreated => $this->logUserCreated($event),
            $event instanceof UserUpdated => $this->logUserUpdated($event),
            $event instanceof UserActivated => $this->logUserActivated($event),
            $event instanceof UserDeactivated => $this->logUserDeactivated($event),
            $event instanceof UserDeleted => $this->logUserDeleted($event),
            $event instanceof UserRestored => $this->logUserRestored($event),
            $event instanceof EmailVerificationRequested => $this->logEmailVerificationRequested($event),
            $event instanceof EmailVerified => $this->logEmailVerified($event),
            $event instanceof PasswordResetRequested => $this->logPasswordResetRequested($event),
            $event instanceof PasswordResetCompleted => $this->logPasswordResetCompleted($event),
            $event instanceof UserLoggedIn => $this->logUserLoggedIn($event),
            $event instanceof UserLoggedOut => $this->logUserLoggedOut($event),
            default => null,
        };
    }

    private function logUserCreated(UserCreated $event): void
    {
        $user = $this->getUser($event->userId);
        if ($user === null) {
            return;
        }

        $causer = $this->getCausedBy();

        // Determine registration source: 'self' for self-registration, 'admin' for admin-created
        $registrationSource = (
            $causer && $causer instanceof AdminEloquent
        ) ? 'admin' : 'self';

        activity('user')
            ->causedBy($causer)
            ->performedOn($user)
            ->withProperties([
                'attributes' => [
                    'email' => $event->email,
                    'first_name' => $event->firstName,
                    'last_name' => $event->lastName,
                    'alias' => $event->alias,
                    'uuid' => $event->uuid,
                ],
                'registration_source' => $registrationSource,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'registered_at' => now()->toDateTimeString(),
            ])
            ->log('User created');
    }

    private function logUserUpdated(UserUpdated $event): void
    {
        // Build old and attributes structure from changedAttributes
        $old = [];
        $attributes = [];

        foreach ($event->changedAttributes as $field => $change) {
            if (isset($change['old'])) {
                $old[$field] = $change['old'];
            }
            if (isset($change['new'])) {
                $attributes[$field] = $change['new'];
            }
        }

        $user = $this->getUser($event->userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->causedBy($this->getCausedBy())
            ->performedOn($user)
            ->withProperties([
                'old' => $old,
                'attributes' => $attributes,
            ])
            ->log('User updated');
    }

    private function logUserActivated(UserActivated $event): void
    {
        $user = $this->getUser($event->userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->causedBy($this->getCausedBy())
            ->performedOn($user)
            ->withProperties([
                'updated_by' => $this->getCausedByName(),
            ])
            ->log('User activated');
    }

    private function logUserDeactivated(UserDeactivated $event): void
    {
        $user = $this->getUser($event->userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->causedBy($this->getCausedBy())
            ->performedOn($user)
            ->withProperties([
                'updated_by' => $this->getCausedByName(),
            ])
            ->log('User deactivated');
    }

    private function logUserDeleted(UserDeleted $event): void
    {
        $user = $this->getUserWithTrashed($event->userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->causedBy($this->getCausedBy())
            ->performedOn($user)
            ->withProperties([
                'deleted_by' => $this->getCausedByName(),
            ])
            ->log('User deleted');
    }

    private function logUserRestored(UserRestored $event): void
    {
        $user = $this->getUser($event->userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->causedBy($this->getCausedBy())
            ->performedOn($user)
            ->withProperties([
                'restored_by' => $this->getCausedByName(),
            ])
            ->log('User restored');
    }

    private function logEmailVerificationRequested(EmailVerificationRequested $event): void
    {
        $userId = $event->user->id();
        if ($userId === null) {
            return;
        }

        $user = $this->getUser($userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties([
                'email' => $event->user->email()->value(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ])
            ->log('User email verification requested');
    }

    private function logEmailVerified(EmailVerified $event): void
    {
        $userId = $event->user->id();
        if ($userId === null) {
            return;
        }

        $user = $this->getUser($userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties([
                'email' => $event->user->email()->value(),
                'verified_at' => now()->toDateTimeString(),
                'ip_address' => request()->ip(),
            ])
            ->log('User email verified');
    }

    private function logPasswordResetRequested(PasswordResetRequested $event): void
    {
        $userId = $event->user->id();
        if ($userId === null) {
            return;
        }

        $user = $this->getUser($userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties([
                'email' => $event->user->email()->value(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ])
            ->log('User password reset requested');
    }

    private function logPasswordResetCompleted(PasswordResetCompleted $event): void
    {
        $userId = $event->user->id();
        if ($userId === null) {
            return;
        }

        $user = $this->getUser($userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties([
                'email' => $event->user->email()->value(),
                'reset_at' => now()->toDateTimeString(),
                'ip_address' => request()->ip(),
            ])
            ->log('User password reset completed');
    }

    private function logUserLoggedIn(UserLoggedIn $event): void
    {
        $user = $this->getUser($event->userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties([
                'email' => $event->email,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'logged_in_at' => now()->toDateTimeString(),
            ])
            ->log('User logged in');
    }

    private function logUserLoggedOut(UserLoggedOut $event): void
    {
        $user = $this->getUser($event->userId);
        if ($user === null) {
            return;
        }

        activity('user')
            ->performedOn($user)
            ->causedBy($user)
            ->withProperties([
                'email' => $event->email,
                'ip_address' => request()->ip(),
                'logged_out_at' => now()->toDateTimeString(),
            ])
            ->log('User logged out');
    }

    /**
     * Get user model for activity log.
     */
    private function getUser(int $userId): ?Model
    {
        if ($userId === 0) {
            return null;
        }

        return UserEloquent::find($userId);
    }

    /**
     * Get user model for activity log (including soft-deleted).
     */
    private function getUserWithTrashed(int $userId): ?Model
    {
        if ($userId === 0) {
            return null;
        }

        return UserEloquent::withTrashed()->find($userId);
    }

    /**
     * Get the user or admin who caused this action.
     */
    private function getCausedBy(): ?Model
    {
        // Check admin guard first (admin actions take precedence)
        /** @var AdminEloquent|null $admin */
        $admin = auth('admin')->user();
        if ($admin) {
            return $admin;
        }

        // Check web guard (user actions)
        /** @var UserEloquent|null $user */
        $user = auth('web')->user();
        if ($user) {
            return $user;
        }

        return null;
    }

    /**
     * Get the name of the user or admin who caused this action.
     */
    private function getCausedByName(): string
    {
        // Check admin guard first (admin actions take precedence)
        /** @var AdminEloquent|null $admin */
        $admin = auth('admin')->user();
        if ($admin) {
            return "{$admin->first_name} {$admin->last_name}";
        }

        // Check web guard (user actions)
        /** @var UserEloquent|null $user */
        $user = auth('web')->user();
        if ($user) {
            return "{$user->first_name} {$user->last_name}";
        }

        return 'System';
    }
}
