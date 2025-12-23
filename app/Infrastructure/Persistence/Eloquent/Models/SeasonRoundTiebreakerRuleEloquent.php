<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * SeasonRoundTiebreakerRule Pivot Model (Anemic).
 *
 * @property int $id
 * @property int $season_id
 * @property int $round_tiebreaker_rule_id
 * @property int $order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
final class SeasonRoundTiebreakerRuleEloquent extends Pivot
{
    /**
     * The table associated with the model.
     */
    protected $table = 'season_round_tiebreaker_rules';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'season_id',
        'round_tiebreaker_rule_id',
        'order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'season_id' => 'integer',
        'round_tiebreaker_rule_id' => 'integer',
        'order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
