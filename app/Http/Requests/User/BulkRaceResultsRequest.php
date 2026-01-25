<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

final class BulkRaceResultsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Check that the authenticated user owns the league containing this race
        $raceId = (int) $this->route('raceId');

        /** @var \App\Models\User|null $user */
        $user = auth('web')->user();
        if (! $user) {
            return false;
        }

        $userId = $user->id;

        $raceRepository = app(RaceRepositoryInterface::class);

        return $raceRepository->isOwnedByUser($raceId, $userId);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // Pattern validates: optional +, hours (any digit count), minutes 00-59, seconds 00-59, milliseconds 1-3 digits
        $timePattern = '/^[+]?(\d+):([0-5]\d):([0-5]\d)\.(\d{1,3})$/';

        return [
            'results' => ['required', 'array'],
            'results.*.driver_id' => ['required', 'integer', 'exists:season_drivers,id'],
            'results.*.division_id' => ['nullable', 'integer', 'exists:divisions,id'],
            'results.*.position' => ['nullable', 'integer', 'min:1'],
            'results.*.original_race_time' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.original_race_time_difference' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.final_race_time_difference' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.fastest_lap' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.penalties' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.has_fastest_lap' => ['boolean'],
            'results.*.has_pole' => ['boolean'],
            'results.*.dnf' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'results.*.original_race_time.regex' => 'Original race time must be in format hh:mm:ss.ms',
            'results.*.original_race_time_difference.regex' => 'Original race time difference must be in format hh:mm:ss.ms',
            'results.*.final_race_time_difference.regex' => 'Final race time difference must be in format hh:mm:ss.ms',
            'results.*.fastest_lap.regex' => 'Fastest lap must be in format hh:mm:ss.ms',
            'results.*.penalties.regex' => 'Penalties must be in format hh:mm:ss.ms',
        ];
    }

    /**
     * Configure the validator instance with cross-field validation.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            /** @var \Illuminate\Validation\Validator $validator PHPStan: assert concrete type for getData() */
            /** @var array<string, mixed> $data */
            $data = $validator->getData();

            if (! isset($data['results']) || ! is_array($data['results'])) {
                return;
            }

            // Group by division for position uniqueness check
            $positionsByDivision = [];
            $driverIds = [];

            foreach ($data['results'] as $index => $result) {
                if (! is_array($result)) {
                    continue;
                }

                // Check for duplicate positions per division (if position is provided)
                if (isset($result['position']) && $result['position'] !== null) {
                    $position = (int) $result['position'];
                    $divisionId = $result['division_id'] ?? 'no_division';

                    if (! isset($positionsByDivision[$divisionId])) {
                        $positionsByDivision[$divisionId] = [];
                    }

                    if (isset($positionsByDivision[$divisionId][$position])) {
                        $divisionLabel = $divisionId === 'no_division' ? 'the race' : "division {$divisionId}";
                        $validator->errors()->add(
                            "results.{$index}.position",
                            "Position {$position} is duplicated in {$divisionLabel}. " .
                            'Each position must be unique within the division.'
                        );
                    }
                    $positionsByDivision[$divisionId][$position] = true;
                }

                // Check for duplicate driver_ids
                if (isset($result['driver_id']) && $result['driver_id'] !== null) {
                    $driverId = (int) $result['driver_id'];
                    if (isset($driverIds[$driverId])) {
                        $validator->errors()->add(
                            "results.{$index}.driver_id",
                            "Driver ID {$driverId} appears multiple times. " .
                            'Each driver can only have one result per race.'
                        );
                    }
                    $driverIds[$driverId] = true;
                }

                // If not DNF, at least one of original_race_time or position must be provided
                $isDnf = isset($result['dnf']) && $result['dnf'] === true;
                if (! $isDnf) {
                    $hasRaceTime = ! empty($result['original_race_time']);
                    $hasPosition = isset($result['position']) && $result['position'] !== null;

                    if (! $hasRaceTime && ! $hasPosition) {
                        $validator->errors()->add(
                            "results.{$index}",
                            'At least one of original_race_time or position must be provided for non-DNF results.'
                        );
                    }
                }
            }
        });
    }
}
