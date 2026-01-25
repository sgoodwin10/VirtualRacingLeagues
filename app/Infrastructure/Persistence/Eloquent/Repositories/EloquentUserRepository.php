<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\User\Entities\User;
use App\Domain\User\Exceptions\UserNotFoundException;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Domain\User\ValueObjects\UserAlias;
use App\Domain\User\ValueObjects\UserStatus;
use App\Domain\User\ValueObjects\UserUuid;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use DateTimeImmutable;

/**
 * Eloquent implementation of User Repository.
 * Maps between domain entities and Eloquent models.
 */
final class EloquentUserRepository implements UserRepositoryInterface
{
    public function findById(int $id): User
    {
        $eloquentUser = UserEloquent::withTrashed()->find($id);

        if ($eloquentUser === null) {
            throw UserNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquentUser);
    }

    public function findByIdOrNull(int $id): ?User
    {
        $eloquentUser = UserEloquent::withTrashed()->find($id);

        if ($eloquentUser === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentUser);
    }

    public function findByEmail(string $email): User
    {
        $eloquentUser = UserEloquent::withTrashed()->where('email', $email)->first();

        if ($eloquentUser === null) {
            throw UserNotFoundException::withEmail($email);
        }

        return $this->toDomainEntity($eloquentUser);
    }

    public function findByEmailOrNull(string $email): ?User
    {
        $eloquentUser = UserEloquent::withTrashed()->where('email', $email)->first();

        if ($eloquentUser === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentUser);
    }

    public function findByUuid(string $uuid): User
    {
        $eloquentUser = UserEloquent::withTrashed()->where('uuid', $uuid)->first();

        if ($eloquentUser === null) {
            throw UserNotFoundException::withUuid($uuid);
        }

        return $this->toDomainEntity($eloquentUser);
    }

    public function findByUuidOrNull(string $uuid): ?User
    {
        $eloquentUser = UserEloquent::withTrashed()->where('uuid', $uuid)->first();

        if ($eloquentUser === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentUser);
    }

    public function existsByEmail(string $email): bool
    {
        return UserEloquent::withTrashed()->where('email', $email)->exists();
    }

    public function existsByUuid(string $uuid): bool
    {
        return UserEloquent::withTrashed()->where('uuid', $uuid)->exists();
    }

    public function all(array $filters = []): array
    {
        $query = UserEloquent::query();

        $this->applyFilters($query, $filters);

        $eloquentUsers = $query->get();

        return $eloquentUsers->map(fn ($eloquentUser) => $this->toDomainEntity($eloquentUser))->all();
    }

    public function paginate(int $page = 1, int $perPage = 15, array $filters = []): array
    {
        $query = UserEloquent::query();

        $this->applyFilters($query, $filters);

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $paginator->items() ? array_map(
                fn ($eloquentUser) => $this->toDomainEntity($eloquentUser),
                $paginator->items()
            ) : [],
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
        ];
    }

    public function save(User $user, ?string $hashedPassword = null): void
    {
        if ($user->id() === null) {
            // Create new
            $eloquentUser = new UserEloquent();
            $this->fillEloquentModel($eloquentUser, $user);

            // If a hashed password is provided, use it (infrastructure concern)
            if ($hashedPassword !== null) {
                $eloquentUser->password = $hashedPassword;
            }

            $eloquentUser->save();

            // Set ID on domain entity
            $user->setId($eloquentUser->id);
        } else {
            // Update existing
            $eloquentUser = UserEloquent::withTrashed()->findOrFail($user->id());
            $this->fillEloquentModel($eloquentUser, $user);

            // If a hashed password is provided, use it (infrastructure concern)
            if ($hashedPassword !== null) {
                $eloquentUser->password = $hashedPassword;
            }

            $eloquentUser->save();
        }
    }

    public function delete(User $user): void
    {
        if ($user->id() === null) {
            return;
        }

        $eloquentUser = UserEloquent::findOrFail($user->id());
        // First update the status (domain entity sets it to inactive on delete())
        $this->fillEloquentModel($eloquentUser, $user);
        $eloquentUser->save();
        // Then soft delete
        $eloquentUser->delete();
    }

    public function restore(User $user): void
    {
        if ($user->id() === null) {
            return;
        }

        $eloquentUser = UserEloquent::withTrashed()->findOrFail($user->id());
        $eloquentUser->restore();
        // Update the status (domain entity sets it to active on restore())
        $this->fillEloquentModel($eloquentUser, $user);
        $eloquentUser->save();
    }

    public function forceDelete(User $user): void
    {
        if ($user->id() === null) {
            return;
        }

        $eloquentUser = UserEloquent::withTrashed()->findOrFail($user->id());
        $eloquentUser->forceDelete();
    }

    public function count(array $filters = []): int
    {
        $query = UserEloquent::query();

        $this->applyFilters($query, $filters);

        return $query->count();
    }

    public function getRecentActivities(int $userId, int $limit = 50): array
    {
        $eloquentUser = UserEloquent::withTrashed()->find($userId);

        if ($eloquentUser === null) {
            return [];
        }

        return $eloquentUser->activities()
            ->latest()
            ->limit($limit)
            ->get()
            ->values()
            ->all();
    }

    public function findMultipleByIds(array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        $users = UserEloquent::whereIn('id', $ids)
            ->get(['id', 'first_name', 'last_name', 'email']);

        $result = [];
        foreach ($users as $user) {
            $result[$user->id] = [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
            ];
        }

        return $result;
    }

    /**
     * Apply filters to query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<UserEloquent>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        if (isset($filters['search']) && $filters['search'] !== '') {
            $query->search($filters['search']);
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->filterByStatus($filters['status']);
        }

        if (isset($filters['include_deleted']) && $filters['include_deleted']) {
            $query->withTrashed();
        }

        if (isset($filters['only_deleted']) && $filters['only_deleted']) {
            $query->onlyTrashed();
        }

        // Default ordering
        if (! isset($filters['order_by'])) {
            $query->orderBy('created_at', 'desc');
        } else {
            $direction = $filters['order_direction'] ?? 'asc';
            $query->orderBy($filters['order_by'], $direction);
        }
    }

    /**
     * Map Eloquent model to domain entity.
     */
    private function toDomainEntity(UserEloquent $eloquentUser): User
    {
        return User::reconstitute(
            id: $eloquentUser->id,
            fullName: FullName::from($eloquentUser->first_name, $eloquentUser->last_name),
            email: EmailAddress::from($eloquentUser->email),
            password: $eloquentUser->password,
            alias: UserAlias::fromNullable($eloquentUser->alias),
            uuid: UserUuid::fromNullable($eloquentUser->uuid),
            status: UserStatus::from($eloquentUser->status),
            emailVerifiedAt: $eloquentUser->email_verified_at
                ? DateTimeImmutable::createFromMutable($eloquentUser->email_verified_at)
                : null,
            createdAt: DateTimeImmutable::createFromMutable($eloquentUser->created_at),
            updatedAt: DateTimeImmutable::createFromMutable($eloquentUser->updated_at),
            deletedAt: $eloquentUser->deleted_at
                ? DateTimeImmutable::createFromMutable($eloquentUser->deleted_at)
                : null,
        );
    }

    /**
     * Fill Eloquent model from domain entity.
     */
    private function fillEloquentModel(UserEloquent $eloquentUser, User $user): void
    {
        $eloquentUser->first_name = $user->fullName()->firstName();
        $eloquentUser->last_name = $user->fullName()->lastName();
        $eloquentUser->email = $user->email()->value();
        $eloquentUser->password = $user->password();
        $eloquentUser->alias = $user->alias()?->value();
        $eloquentUser->uuid = $user->uuid()?->value();
        $eloquentUser->status = $user->status()->value;
        $eloquentUser->email_verified_at = $user->emailVerifiedAt()
            ? \Carbon\Carbon::instance($user->emailVerifiedAt())
            : null;
    }
}
