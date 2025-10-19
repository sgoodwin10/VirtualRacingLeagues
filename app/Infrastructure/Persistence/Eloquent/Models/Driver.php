<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Database\Factories\DriverFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Anemic Eloquent model for Driver.
 * Business logic resides in App\Domain\Driver\Entities\Driver.
 *
 * @property int $id
 * @property string|null $first_name
 * @property string|null $last_name
 * @property string|null $nickname
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $psn_id
 * @property string|null $gt7_id
 * @property string|null $iracing_id
 * @property int|null $iracing_customer_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
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
        'email',
        'phone',
        'psn_id',
        'gt7_id',
        'iracing_id',
        'iracing_customer_id',
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
}
