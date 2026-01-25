<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * Complete Round Data DTO.
 * Optional data sent by frontend when completing a round.
 * If provided, these values override automatic calculation.
 */
final class CompleteRoundData extends Data
{
    /**
     * @param  array<array{position: int, race_result_id: int, time_ms: int}>|null  $qualifying_results
     * @param  array<array{position: int, race_result_id: int, time_ms: int}>|null  $race_time_results
     * @param  array<array{position: int, race_result_id: int, time_ms: int}>|null  $fastest_lap_results
     */
    public function __construct(
        public readonly ?array $qualifying_results = null,
        public readonly ?array $race_time_results = null,
        public readonly ?array $fastest_lap_results = null,
    ) {
    }

    /**
     * Validation rules for completing a round.
     *
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            'qualifying_results' => 'nullable|array',
            'qualifying_results.*.position' => 'required|integer|min:1',
            'qualifying_results.*.race_result_id' => 'required|integer|exists:race_results,id',
            'qualifying_results.*.time_ms' => 'required|integer|min:1',

            'race_time_results' => 'nullable|array',
            'race_time_results.*.position' => 'required|integer|min:1',
            'race_time_results.*.race_result_id' => 'required|integer|exists:race_results,id',
            'race_time_results.*.time_ms' => 'required|integer|min:1',

            'fastest_lap_results' => 'nullable|array',
            'fastest_lap_results.*.position' => 'required|integer|min:1',
            'fastest_lap_results.*.race_result_id' => 'required|integer|exists:race_results,id',
            'fastest_lap_results.*.time_ms' => 'required|integer|min:1',
        ];
    }
}
