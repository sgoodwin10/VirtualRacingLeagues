<?php

declare(strict_types=1);

namespace App\Application\Competition\Casts;

use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Contracts\BaseData;
use Spatie\LaravelData\Support\Creation\CreationContext;
use Spatie\LaravelData\Support\DataProperty;

/**
 * Cast that converts empty strings to null.
 * Useful for nullable integer fields where frontend sends '' instead of null.
 *
 * @template TData of BaseData
 */
class EmptyStringToNullCast implements Cast
{
    /**
     * @param array<string, mixed> $properties
     * @param CreationContext<TData> $context
     */
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): mixed
    {
        if ($value === '' || $value === null) {
            return null;
        }

        return $value;
    }
}
