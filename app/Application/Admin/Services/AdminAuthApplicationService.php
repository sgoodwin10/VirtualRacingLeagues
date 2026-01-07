<?php

declare(strict_types=1);

namespace App\Application\Admin\Services;

use App\Application\Admin\DTOs\AdminData;
use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\Events\AdminAuthenticated;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Admin\Exceptions\InvalidCredentialsException;
use App\Domain\Admin\Repositories\AdminRepositoryInterface;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;

/**
 * Admin Authentication Application Service.
 * Handles authentication-related use cases.
 */
final class AdminAuthApplicationService
{
    public function __construct(
        private readonly AdminRepositoryInterface $adminRepository,
    ) {
    }

    /**
     * Attempt to authenticate an admin.
     *
     * @throws InvalidCredentialsException
     */
    public function login(string $email, string $password, bool $remember = false): AdminData
    {
        $admin = $this->adminRepository->findByEmail(EmailAddress::from($email));

        if (!$admin) {
            throw new InvalidCredentialsException();
        }

        // Verify password
        if (!Hash::check($password, $admin->hashedPassword())) {
            throw new InvalidCredentialsException();
        }

        // Check if admin is active
        if (!$admin->isActive()) {
            throw new InvalidCredentialsException();
        }

        // Log in the admin using Laravel's auth
        /** @var \Illuminate\Contracts\Auth\StatefulGuard $guard */
        $guard = Auth::guard('admin');
        $guard->login(
            $this->convertToEloquentAdmin($admin),
            $remember
        );

        // Dispatch authentication event
        Event::dispatch(new AdminAuthenticated($admin));

        return AdminData::fromEntity($admin);
    }

    /**
     * Log out the currently authenticated admin.
     */
    public function logout(): void
    {
        /** @var \Illuminate\Contracts\Auth\StatefulGuard $guard */
        $guard = Auth::guard('admin');
        $guard->logout();
    }

    /**
     * Get the currently authenticated admin.
     *
     * @throws AdminNotFoundException
     */
    public function getCurrentAdmin(): AdminData
    {
        /** @var AdminEloquent|null $eloquentAdmin */
        $eloquentAdmin = Auth::guard('admin')->user();

        if (!$eloquentAdmin) {
            throw new AdminNotFoundException('No authenticated admin');
        }

        $admin = $this->adminRepository->findById($eloquentAdmin->id);

        if (!$admin) {
            throw AdminNotFoundException::withId($eloquentAdmin->id);
        }

        return AdminData::fromEntity($admin);
    }

    /**
     * Update the current admin's password.
     */
    public function updatePassword(int $adminId, string $currentPassword, string $newPassword): AdminData
    {
        return DB::transaction(function () use ($adminId, $currentPassword, $newPassword) {
            $admin = $this->adminRepository->findById($adminId);

            if (!$admin) {
                throw AdminNotFoundException::withId($adminId);
            }

            // Verify current password
            if (!Hash::check($currentPassword, $admin->hashedPassword())) {
                throw new InvalidCredentialsException();
            }

            // Change password
            $admin->changePassword(Hash::make($newPassword));

            // Persist
            $this->adminRepository->save($admin);

            // Dispatch domain events
            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Update the current admin's profile.
     */
    public function updateProfile(int $adminId, string $firstName, string $lastName, string $email): AdminData
    {
        return DB::transaction(function () use ($adminId, $firstName, $lastName, $email) {
            $admin = $this->adminRepository->findById($adminId);

            if (!$admin) {
                throw AdminNotFoundException::withId($adminId);
            }

            // Check email uniqueness if being changed
            $newEmail = EmailAddress::from($email);
            if ($email !== (string) $admin->email() && $this->adminRepository->emailExists($newEmail, $adminId)) {
                throw new \DomainException("Email '{$email}' is already in use");
            }

            // Update profile
            $admin->updateProfile(
                name: FullName::from($firstName, $lastName),
                email: $newEmail,
            );

            // Persist
            $this->adminRepository->save($admin);

            // Dispatch domain events
            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Convert domain Admin to Eloquent Admin for Auth.
     * This is a temporary helper until we have the infrastructure layer.
     *
     * @return \Illuminate\Contracts\Auth\Authenticatable Eloquent admin model
     */
    private function convertToEloquentAdmin(Admin $admin): \Illuminate\Contracts\Auth\Authenticatable
    {
        // This will be replaced when we have EloquentAdminRepository
        $eloquentModel = AdminEloquent::find($admin->id());

        if (!$eloquentModel) {
            throw new \RuntimeException('Could not find Eloquent admin model');
        }

        return $eloquentModel;
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(Admin $admin): void
    {
        $events = $admin->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }
}
