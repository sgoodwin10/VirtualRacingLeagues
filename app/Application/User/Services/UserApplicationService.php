<?php

declare(strict_types=1);

namespace App\Application\User\Services;

use App\Application\User\DTOs\CreateUserData;
use App\Application\User\DTOs\UpdateUserData;
use App\Application\User\DTOs\UserData;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\User\Entities\User;
use App\Domain\User\Exceptions\UserAlreadyExistsException;
use App\Domain\User\Exceptions\UserNotDeletedException;
use App\Domain\User\Exceptions\UserNotFoundException;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Domain\User\ValueObjects\UserAlias;
use App\Domain\User\ValueObjects\UserStatus;
use App\Domain\User\ValueObjects\UserUuid;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Spatie\LaravelData\Optional;

/**
 * User Application Service.
 * Orchestrates user use cases and coordinates domain logic.
 */
final class UserApplicationService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {
    }

    /**
     * Create a new user.
     *
     * @throws UserAlreadyExistsException
     */
    public function createUser(CreateUserData $data): UserData
    {
        // Check if user already exists
        if ($this->userRepository->existsByEmail($data->email)) {
            throw UserAlreadyExistsException::withEmail($data->email);
        }

        if ($data->uuid && $this->userRepository->existsByUuid($data->uuid)) {
            throw UserAlreadyExistsException::withUuid($data->uuid);
        }

        return DB::transaction(function () use ($data) {
            // Create domain entity
            $user = User::create(
                fullName: FullName::from($data->first_name, $data->last_name),
                email: EmailAddress::from($data->email),
                password: Hash::make($data->password),
                alias: UserAlias::fromNullable($data->alias),
                uuid: $data->uuid ? UserUuid::from($data->uuid) : UserUuid::generate(),
                status: UserStatus::from($data->status),
            );

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
     * Update an existing user.
     *
     * @throws UserNotFoundException
     * @throws UserAlreadyExistsException
     */
    public function updateUser(int $userId, UpdateUserData $data): UserData
    {
        return DB::transaction(function () use ($userId, $data) {
            $user = $this->userRepository->findById($userId);

            // Check email uniqueness if being changed
            if (!$data->email instanceof Optional && $data->email !== $user->email()->value()) {
                if ($this->userRepository->existsByEmail($data->email)) {
                    throw UserAlreadyExistsException::withEmail($data->email);
                }
            }

            // Update profile
            if (!$data->first_name instanceof Optional || !$data->last_name instanceof Optional) {
                $firstName = !$data->first_name instanceof Optional
                    ? $data->first_name
                    : $user->fullName()->firstName();

                $lastName = !$data->last_name instanceof Optional
                    ? $data->last_name
                    : $user->fullName()->lastName();

                $fullName = FullName::from($firstName, $lastName);
                $email = !$data->email instanceof Optional
                    ? EmailAddress::from($data->email)
                    : null;

                $alias = !$data->alias instanceof Optional
                    ? UserAlias::fromNullable($data->alias)
                    : null;

                $user->updateProfile(
                    fullName: $fullName,
                    email: $email,
                    alias: $alias,
                );
            } elseif (!$data->email instanceof Optional) {
                $user->updateProfile(
                    email: EmailAddress::from($data->email),
                );
            } elseif (!$data->alias instanceof Optional) {
                $user->updateProfile(
                    alias: UserAlias::fromNullable($data->alias),
                );
            }

            // Update status
            if (!$data->status instanceof Optional && $data->status !== $user->status()->value) {
                $newStatus = UserStatus::from($data->status);
                if ($newStatus->isActive()) {
                    $user->activate();
                } else {
                    $user->deactivate();
                }
            }

            // Update password if provided
            if (!$data->password instanceof Optional) {
                $user->updatePassword(Hash::make($data->password));
            }

            // Persist
            $this->userRepository->save($user);

            // Dispatch domain events
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Get a user by ID.
     *
     * @throws UserNotFoundException
     */
    public function getUserById(int $userId): UserData
    {
        $user = $this->userRepository->findById($userId);

        return UserData::fromEntity($user);
    }

    /**
     * Get a user entity by ID (returns domain entity).
     *
     * @throws UserNotFoundException
     */
    public function getUserEntityById(int $userId): User
    {
        return $this->userRepository->findById($userId);
    }

    /**
     * Get a user with activity logs.
     * Returns user data and activity logs for admin display.
     *
     * @throws UserNotFoundException
     * @return array{user: array<string, mixed>, activities: array<int, mixed>}
     */
    public function getUserWithActivities(int $userId): array
    {
        $user = $this->userRepository->findById($userId);

        // Fetch activity logs via repository
        $activities = $this->userRepository->getRecentActivities($userId, 50);

        return [
            'user' => UserData::fromEntity($user)->toArray(),
            'activities' => $activities,
        ];
    }

    /**
     * Get a user by email.
     *
     * @throws UserNotFoundException
     */
    public function getUserByEmail(string $email): UserData
    {
        $user = $this->userRepository->findByEmail($email);

        return UserData::fromEntity($user);
    }

    /**
     * Get a user by UUID.
     *
     * @throws UserNotFoundException
     */
    public function getUserByUuid(string $uuid): UserData
    {
        $user = $this->userRepository->findByUuid($uuid);

        return UserData::fromEntity($user);
    }

    /**
     * Get all users with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return array<int, UserData>
     */
    public function getAllUsers(array $filters = []): array
    {
        $users = $this->userRepository->all($filters);

        return array_map(
            fn(User $user) => UserData::fromEntity($user),
            $users
        );
    }

    /**
     * Get paginated users with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return array{data: array<int, UserData>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function getPaginatedUsers(int $page = 1, int $perPage = 15, array $filters = []): array
    {
        $result = $this->userRepository->paginate($page, $perPage, $filters);

        return [
            'data' => array_map(
                fn(User $user) => UserData::fromEntity($user),
                $result['data']
            ),
            'total' => $result['total'],
            'per_page' => $result['per_page'],
            'current_page' => $result['current_page'],
            'last_page' => $result['last_page'],
        ];
    }

    /**
     * Activate a user.
     *
     * @throws UserNotFoundException
     */
    public function activateUser(int $userId): UserData
    {
        return DB::transaction(function () use ($userId) {
            $user = $this->userRepository->findById($userId);

            $user->activate();

            $this->userRepository->save($user);
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Deactivate a user.
     *
     * @throws UserNotFoundException
     */
    public function deactivateUser(int $userId): UserData
    {
        return DB::transaction(function () use ($userId) {
            $user = $this->userRepository->findById($userId);

            $user->deactivate();

            $this->userRepository->save($user);
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Delete a user (soft delete).
     *
     * @throws UserNotFoundException
     */
    public function deleteUser(int $userId): void
    {
        DB::transaction(function () use ($userId) {
            $user = $this->userRepository->findById($userId);

            $user->delete();

            $this->userRepository->delete($user);
            $this->dispatchEvents($user);
        });
    }

    /**
     * Restore a soft-deleted user.
     *
     * @throws UserNotFoundException
     * @throws UserNotDeletedException if user is not deleted
     */
    public function restoreUser(int $userId): UserData
    {
        return DB::transaction(function () use ($userId) {
            $user = $this->userRepository->findById($userId);

            // Check if user is actually deleted before restoring
            if (!$user->isDeleted()) {
                throw UserNotDeletedException::withId($userId);
            }

            $user->restore();

            $this->userRepository->restore($user);
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Permanently delete a user.
     *
     * @throws UserNotFoundException
     */
    public function forceDeleteUser(int $userId): void
    {
        DB::transaction(function () use ($userId) {
            $user = $this->userRepository->findById($userId);

            $this->userRepository->forceDelete($user);
        });
    }

    /**
     * Count users with optional filters.
     *
     * @param array<string, mixed> $filters
     */
    public function countUsers(array $filters = []): int
    {
        return $this->userRepository->count($filters);
    }

    /**
     * Manually verify a user's email (admin action).
     * This bypasses the normal email verification flow.
     * If the email is already verified, this operation is idempotent.
     *
     * @throws UserNotFoundException
     */
    public function verifyUserEmail(int $userId): UserData
    {
        return DB::transaction(function () use ($userId) {
            $user = $this->userRepository->findById($userId);

            // Check if already verified - if so, this is idempotent (don't throw exception)
            if ($user->isEmailVerified()) {
                return UserData::fromEntity($user);
            }

            $user->markEmailAsVerified();

            $this->userRepository->save($user);
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Resend email verification notification to a user (admin action).
     *
     * @throws UserNotFoundException
     */
    public function resendUserEmailVerification(int $userId): UserData
    {
        $user = $this->userRepository->findById($userId);

        // Request email verification (records domain event)
        $user->requestEmailVerification();

        // Dispatch the event immediately (will trigger listener to send email)
        $this->dispatchEvents($user);

        return UserData::fromEntity($user);
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
