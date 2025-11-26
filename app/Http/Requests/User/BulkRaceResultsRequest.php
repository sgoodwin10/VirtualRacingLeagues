<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

final class BulkRaceResultsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $timePattern = '/^[+]?(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/';

        return [
            'results' => ['required', 'array'],
            'results.*.driver_id' => ['required', 'integer', 'exists:season_drivers,id'],
            'results.*.division_id' => ['nullable', 'integer', 'exists:divisions,id'],
            'results.*.position' => ['nullable', 'integer', 'min:1'],
            'results.*.race_time' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.race_time_difference' => ['nullable', 'string', "regex:{$timePattern}"],
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
            'results.*.race_time.regex' => 'Race time must be in format hh:mm:ss.ms',
            'results.*.race_time_difference.regex' => 'Race time difference must be in format hh:mm:ss.ms',
            'results.*.fastest_lap.regex' => 'Fastest lap must be in format hh:mm:ss.ms',
            'results.*.penalties.regex' => 'Penalties must be in format hh:mm:ss.ms',
        ];
    }
}
