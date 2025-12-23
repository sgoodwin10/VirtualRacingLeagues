<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * RoundTiebreakerRule Eloquent Model (Anemic).
 *
 * This is a thin persistence model with NO business logic.
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property bool $is_active
 * @property int $default_order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
final class RoundTiebreakerRuleEloquent extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'round_tiebreaker_rules';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'default_order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'default_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the seasons that use this rule.
     *
     * @return BelongsToMany<SeasonEloquent, $this>
     */
    public function seasons(): BelongsToMany
    {
        return $this->belongsToMany(
            SeasonEloquent::class,
            'season_round_tiebreaker_rules',
            'round_tiebreaker_rule_id',
            'season_id'
        )->withPivot('order')->withTimestamps();
    }
}
