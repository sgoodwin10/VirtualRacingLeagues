<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Admin\Repositories\AdminRepositoryInterface;
use App\Domain\Admin\ValueObjects\AdminRole;
use App\Domain\Admin\ValueObjects\AdminStatus;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use DateTimeImmutable;

/**
 * Eloquent implementation of Admin Repository.
 * Maps between domain entities and Eloquent models.
 */
final class EloquentAdminRepository implements AdminRepositoryInterface
{
    public function save(Admin $admin): void
    {
        if ($admin->id() === null) {
            // Create new
            $eloquentAdmin = new AdminEloquent();
            $this->fillEloquentModel($eloquentAdmin, $admin);
            $eloquentAdmin->save();

            // Set the ID on the entity after persistence
            $admin->setId($eloquentAdmin->id);
        } else {
            // Update existing
            $eloquentAdmin = AdminEloquent::withTrashed()->findOrFail($admin->id());
            $this->fillEloquentModel($eloquentAdmin, $admin);
            $eloquentAdmin->save();
        }
    }

    /**
     * Find an admin by ID.
     * Throws exception if not found (consistent with User repository).
     *
     * @throws AdminNotFoundException
     */
    public function findById(int $id): Admin
    {
        $eloquentAdmin = AdminEloquent::withTrashed()->find($id);

        if ($eloquentAdmin === null) {
            throw AdminNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquentAdmin);
    }

    /**
     * Find an admin by ID, returning null if not found.
     */
    public function findByIdOrNull(int $id): ?Admin
    {
        $eloquentAdmin = AdminEloquent::withTrashed()->find($id);

        if ($eloquentAdmin === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentAdmin);
    }

    /**
     * Get Eloquent model for an admin ID (for policy authorization).
     * This is infrastructure-specific and should only be used for Laravel's Gate/Policy system.
     */
    public function getEloquentModelById(int $id): ?AdminEloquent
    {
        return AdminEloquent::withTrashed()->find($id);
    }

    public function findByEmail(EmailAddress $email): ?Admin
    {
        $eloquentAdmin = AdminEloquent::withTrashed()
            ->where('email', (string) $email)
            ->first();

        if ($eloquentAdmin === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentAdmin);
    }

    public function emailExists(EmailAddress $email, ?int $excludeId = null): bool
    {
        $query = AdminEloquent::withTrashed()->where('email', (string) $email);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    public function getPaginated(int $page, int $perPage, array $filters = []): array
    {
        $query = AdminEloquent::query();

        $this->applyFilters($query, $filters);

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $paginator->items() ? array_map(
                fn ($eloquentAdmin) => $this->toDomainEntity($eloquentAdmin),
                $paginator->items()
            ) : [],
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
        ];
    }

    public function delete(Admin $admin): void
    {
        if ($admin->id() === null) {
            return;
        }

        $eloquentAdmin = AdminEloquent::findOrFail($admin->id());
        $eloquentAdmin->delete();
    }

    /**
     * Apply filters to query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<AdminEloquent>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (isset($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (isset($filters['exclude_roles'])) {
            $query->whereNotIn('role', $filters['exclude_roles']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
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
    private function toDomainEntity(AdminEloquent $eloquentAdmin): Admin
    {
        return Admin::reconstitute(
            id: $eloquentAdmin->id,
            name: FullName::from($eloquentAdmin->first_name, $eloquentAdmin->last_name),
            email: EmailAddress::from($eloquentAdmin->email),
            hashedPassword: $eloquentAdmin->password,
            role: AdminRole::from($eloquentAdmin->role),
            status: AdminStatus::from($eloquentAdmin->status),
            createdAt: DateTimeImmutable::createFromMutable($eloquentAdmin->created_at),
            updatedAt: DateTimeImmutable::createFromMutable($eloquentAdmin->updated_at),
            deletedAt: $eloquentAdmin->deleted_at
                ? DateTimeImmutable::createFromMutable($eloquentAdmin->deleted_at)
                : null,
        );
    }

    /**
     * Fill Eloquent model from domain entity.
     */
    private function fillEloquentModel(AdminEloquent $eloquentAdmin, Admin $admin): void
    {
        $eloquentAdmin->first_name = $admin->name()->firstName();
        $eloquentAdmin->last_name = $admin->name()->lastName();
        $eloquentAdmin->email = (string) $admin->email();
        $eloquentAdmin->password = $admin->hashedPassword();
        $eloquentAdmin->role = $admin->role()->value;
        $eloquentAdmin->status = $admin->status()->value;

        // Handle soft deletes
        if ($admin->isDeleted() && $admin->deletedAt()) {
            $eloquentAdmin->deleted_at = \Carbon\Carbon::instance($admin->deletedAt());
        } elseif (! $admin->isDeleted()) {
            $eloquentAdmin->deleted_at = null;
        }
    }
}
