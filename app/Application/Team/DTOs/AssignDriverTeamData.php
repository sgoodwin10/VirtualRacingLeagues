<?php

declare(strict_types=1);

namespace App\Application\Team\DTOs;

use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for assigning a driver to a team.
 */
final class AssignDriverTeamData extends Data
{
    public function __construct(
        #[Nullable, IntegerType]
        public readonly ?int $team_id = null,
    ) {
    }
}
