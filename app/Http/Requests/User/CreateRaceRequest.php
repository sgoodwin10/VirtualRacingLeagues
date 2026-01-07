<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use Illuminate\Foundation\Http\FormRequest;

final class CreateRaceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create a race for this round.
     */
    public function authorize(): bool
    {
        // Check that the authenticated user owns the league containing this round
        $roundId = (int) $this->route('roundId');

        /** @var \App\Models\User|null $user */
        $user = auth('web')->user();
        if (!$user) {
            return false;
        }

        $userId = $user->id;

        $roundRepository = app(RoundRepositoryInterface::class);
        return $roundRepository->isOwnedByUser($roundId, $userId);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Basic
            'race_number' => ['nullable', 'integer', 'min:0'],
            'name' => ['nullable', 'string', 'between:3,100'],
            'race_type' => ['nullable', 'string', 'in:sprint,feature,endurance,qualifying,custom'],
            // Qualifying
            'qualifying_format' => ['nullable', 'string', 'in:standard,time_trial,none,previous_race'],
            'qualifying_length' => ['nullable', 'integer', 'min:1'],
            'qualifying_tire' => ['nullable', 'string', 'max:50'],
            // Grid
            'grid_source' => [
                'nullable',
                'string',
                'in:qualifying,previous_race,reverse_previous,championship,reverse_championship,manual',
            ],
            'grid_source_race_id' => ['nullable', 'integer', 'min:1'],
            // Length
            'length_type' => ['nullable', 'string', 'in:laps,time'],
            'length_value' => ['nullable', 'integer', 'min:1'],
            'extra_lap_after_time' => ['nullable', 'boolean'],
            // Platform settings
            'weather' => ['nullable', 'string', 'max:100'],
            'tire_restrictions' => ['nullable', 'string', 'max:100'],
            'fuel_usage' => ['nullable', 'string', 'max:100'],
            'damage_model' => ['nullable', 'string', 'max:100'],
            // Penalties & Rules
            'track_limits_enforced' => ['nullable', 'boolean'],
            'false_start_detection' => ['nullable', 'boolean'],
            'collision_penalties' => ['nullable', 'boolean'],
            'mandatory_pit_stop' => ['nullable', 'boolean'],
            'minimum_pit_time' => ['nullable', 'integer', 'min:0'],
            'assists_restrictions' => ['nullable', 'string'],
            // Bonus Points
            'fastest_lap' => ['nullable', 'numeric', 'min:0'],
            'fastest_lap_top_10' => ['nullable', 'boolean'],
            'qualifying_pole' => ['nullable', 'numeric', 'min:0'],
            'qualifying_pole_top_10' => ['nullable', 'boolean'],
            // Points
            'points_system' => ['nullable', 'array'],
            'points_system.*' => ['integer', 'min:0'],
            'dnf_points' => ['nullable', 'integer'],
            'dns_points' => ['nullable', 'integer'],
            'race_points' => ['nullable', 'boolean'],
            // Notes
            'race_notes' => ['nullable', 'string'],
        ];
    }
}
