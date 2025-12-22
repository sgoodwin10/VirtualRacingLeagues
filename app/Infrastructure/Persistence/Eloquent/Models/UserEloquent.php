<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Models\User;
use App\Notifications\EmailVerificationNotification;
use App\Notifications\PasswordResetNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Spatie\Activitylog\Models\Activity;

/**
 * Anemic Eloquent Model for User persistence.
 *
 * Contains only persistence concerns, no business logic.
 *
 * Note: This class is not final to allow the App\Models\User proxy class
 * to extend it for Laravel framework features (Gates, Policies, Activity Logs).
 *
 * @property int $id
 * @property string $first_name
 * @property string $last_name
 * @property string|null $alias
 * @property string|null $uuid
 * @property string $status
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Activity> $activities
 * @property-read int|null $activities_count
 * @property-read string $name
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int,
 *     \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static Builder<static>|UserEloquent filterByStatus(?string $status)
 * @method static Builder<static>|UserEloquent newModelQuery()
 * @method static Builder<static>|UserEloquent newQuery()
 * @method static Builder<static>|UserEloquent onlyTrashed()
 * @method static Builder<static>|UserEloquent query()
 * @method static Builder<static>|UserEloquent search(?string $search)
 * @method static Builder<static>|UserEloquent whereAlias($value)
 * @method static Builder<static>|UserEloquent whereCreatedAt($value)
 * @method static Builder<static>|UserEloquent whereDeletedAt($value)
 * @method static Builder<static>|UserEloquent whereEmail($value)
 * @method static Builder<static>|UserEloquent whereEmailVerifiedAt($value)
 * @method static Builder<static>|UserEloquent whereFirstName($value)
 * @method static Builder<static>|UserEloquent whereId($value)
 * @method static Builder<static>|UserEloquent whereLastName($value)
 * @method static Builder<static>|UserEloquent wherePassword($value)
 * @method static Builder<static>|UserEloquent whereRememberToken($value)
 * @method static Builder<static>|UserEloquent whereStatus($value)
 * @method static Builder<static>|UserEloquent whereUpdatedAt($value)
 * @method static Builder<static>|UserEloquent whereUuid($value)
 * @method static Builder<static>|UserEloquent withTrashed(bool $withTrashed = true)
 * @method static Builder<static>|UserEloquent withoutTrashed()
 */
class UserEloquent extends Authenticatable implements MustVerifyEmail
{
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'users';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'alias',
        'uuid',
        'status',
        'email_verified_at',
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
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the user's full name accessor (for backward compatibility).
     */
    public function getNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Check if the user account is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->deleted_at === null;
    }

    /**
     * Scope a query to search across user fields.
     *
     * @param Builder<UserEloquent> $query
     * @return Builder<UserEloquent>
     */
    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (!$search) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('alias', 'like', "%{$search}%");
        });
    }

    /**
     * Scope a query to filter by status.
     *
     * @param Builder<UserEloquent> $query
     * @return Builder<UserEloquent>
     */
    public function scopeFilterByStatus(Builder $query, ?string $status): Builder
    {
        if (!$status) {
            return $query;
        }

        return $query->where('status', $status);
    }

    /**
     * Get activity logs for this user.
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
     * This ensures activity logs use the App\Models\User proxy class.
     */
    public function getMorphClass(): string
    {
        return User::class;
    }

    /**
     * Create a new factory instance for the model.
     * This tells Laravel to use the UserFactory from the proxy class.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory<static>
     */
    protected static function newFactory(): \Illuminate\Database\Eloquent\Factories\Factory
    {
        return \Database\Factories\UserFactory::new();
    }

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new EmailVerificationNotification());
    }

    /**
     * Send the password reset notification.
     *
     * @param string $token
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new PasswordResetNotification($token));
    }
}
