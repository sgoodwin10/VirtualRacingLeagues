<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * Input DTO for updating a season driver.
 */
class UpdateSeasonDriverData extends Data
{
    public function __construct(
        public string $status,
        public ?string $notes = null,
    ) {
    }

    /**
     * Validation rules for request input.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:active,reserve,withdrawn'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
