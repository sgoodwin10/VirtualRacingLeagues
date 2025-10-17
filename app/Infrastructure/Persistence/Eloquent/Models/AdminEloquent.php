<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Activitylog\Models\Activity;

/**
 * Anemic Eloquent Model for Admin persistence.
 * Contains NO business logic - only database mapping.
 *
 * Note: This class is not final to allow the App\Models\Admin proxy class
 * to extend it for Laravel framework features (Gates, Policies, Activity Logs).
 *
 * @property int $id
 * @property string $first_name
 * @property string $last_name
 * @property string $email
 * @property string $password
 * @property string $role
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $last_login_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
class AdminEloquent extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    protected $table = 'admins';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'role',
        'status',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Check if admin is active.
     *
     * Helper method for middleware and policies.
     * NOTE: This method exists in the Eloquent model (instead of only in domain entity)
     * because Laravel's middleware and policies work with Eloquent models, not domain entities.
     * This is an acceptable infrastructure concern to support Laravel's authentication system.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->deleted_at === null;
    }

    /**
     * Check if admin has a specific role.
     *
     * Helper method for policies.
     * NOTE: This method exists in the Eloquent model (instead of only in domain entity)
     * because Laravel's policies work with Eloquent models, not domain entities.
     * This is an acceptable infrastructure concern to support Laravel's authorization system.
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if admin is a super admin.
     *
     * Helper method for middleware.
     * NOTE: This method exists in the Eloquent model (instead of only in domain entity)
     * because Laravel's middleware works with Eloquent models, not domain entities.
     * This is an acceptable infrastructure concern to support Laravel's authentication system.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if admin is an admin.
     *
     * Helper method for middleware.
     * NOTE: This method exists in the Eloquent model (instead of only in domain entity)
     * because Laravel's middleware works with Eloquent models, not domain entities.
     * This is an acceptable infrastructure concern to support Laravel's authentication system.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Get the admin's full name accessor.
     */
    public function getNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Update the last login timestamp.
     * Helper method for authentication.
     */
    public function updateLastLogin(): void
    {
        $this->last_login_at = now();
        $this->save();
    }

    /**
     * Get activity logs for this admin.
     * Relationship for spatie/laravel-activitylog.
     * Note: Activity logging is handled via domain events, not the LogsActivity trait.
     *
     * @return MorphMany<Activity>
     */
    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject');
    }

    /**
     * Get the class name for polymorphic relations.
     * This ensures activity logs use the App\Models\Admin proxy class.
     */
    public function getMorphClass(): string
    {
        return Admin::class;
    }

    /**
     * Create a new factory instance for the model.
     * This tells Laravel to use the AdminFactory from the proxy class.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory<static>
     */
    protected static function newFactory(): \Illuminate\Database\Eloquent\Factories\Factory
    {
        return \Database\Factories\AdminFactory::new();
    }
}
