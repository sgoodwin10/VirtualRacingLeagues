<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\DriverFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Anemic Eloquent model for Driver.
 *
 * Business logic resides in App\Domain\Driver\Entities\Driver.
 *
 * @property int $id
 * @property string|null $first_name
 * @property string|null $last_name
 * @property string|null $nickname
 * @property string $slug
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $psn_id
 * @property string|null $iracing_id
 * @property int|null $iracing_customer_id
 * @property string|null $discord_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Infrastructure\Persistence\Eloquent\Models\League> $leagues
 * @property-read int|null $leagues_count
 * @property-read string $name
 * @method static \Database\Factories\DriverFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereDiscordId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereFirstName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereIracingCustomerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereIracingId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereLastName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereNickname($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver wherePsnId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver withTrashed(bool $withTrashed = true)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Driver withoutTrashed()
 * @mixin \Eloquent
 */
final class Driver extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): Factory
    {
        return DriverFactory::new();
    }

    protected $table = 'drivers';

    protected $fillable = [
        'first_name',
        'last_name',
        'nickname',
        'slug',
        'email',
        'phone',
        'psn_id',
        'iracing_id',
        'iracing_customer_id',
        'discord_id',
    ];

    protected $casts = [
        'iracing_customer_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Leagues this driver belongs to.
     *
     * @return BelongsToMany<League>
     */
    public function leagues(): BelongsToMany
    {
        return $this->belongsToMany(League::class, 'league_drivers', 'driver_id', 'league_id')
            ->withPivot('id', 'driver_number', 'status', 'league_notes', 'added_to_league_at', 'updated_at')
            ->withTimestamps();
    }

    /**
     * Get the driver's display name.
     *
     * Returns driver's name in priority order:
     * 1. Nickname (if exists)
     * 2. First name + last name (if both exist)
     * 3. First name only (if exists)
     * 4. Last name only (if exists)
     * 5. "Unknown" (fallback)
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: function (): string {
                if ($this->nickname) {
                    return $this->nickname;
                }

                if ($this->first_name && $this->last_name) {
                    return "{$this->first_name} {$this->last_name}";
                }

                if ($this->first_name) {
                    return $this->first_name;
                }

                if ($this->last_name) {
                    return $this->last_name;
                }

                return 'Unknown';
            }
        );
    }
}
