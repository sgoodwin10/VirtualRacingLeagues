<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * Input DTO for adding a driver to a season.
 */
class AddSeasonDriverData extends Data
{
    public function __construct(
        public int $league_driver_id,
        public string $status = 'active',
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
            'league_driver_id' => ['required', 'integer', 'exists:league_drivers,id'],
            'status' => ['string', 'in:active,reserve,withdrawn'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
