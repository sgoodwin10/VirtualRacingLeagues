<?php

declare(strict_types=1);

namespace App\Application\Division\DTOs;

use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for reordering divisions.
 */
final class ReorderDivisionsData extends Data
{
    /**
     * @param  array<int, array{id: int, order: int}>  $divisions
     */
    public function __construct(
        public readonly array $divisions,
    ) {
    }

    /**
     * @return array<string, array<string>>
     */
    public static function rules(): array
    {
        return [
            'divisions' => ['required', 'array', 'min:1'],
            'divisions.*.id' => ['required', 'integer', 'min:1'],
            'divisions.*.order' => ['required', 'integer', 'min:1'],
        ];
    }
}
