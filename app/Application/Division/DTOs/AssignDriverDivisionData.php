<?php

declare(strict_types=1);

namespace App\Application\Division\DTOs;

use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for assigning a driver to a division.
 */
final class AssignDriverDivisionData extends Data
{
    public function __construct(
        #[Nullable, IntegerType]
        public readonly ?int $division_id = null,
    ) {
    }
}
