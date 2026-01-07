<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateQualifierRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to update this qualifier.
     */
    public function authorize(): bool
    {
        // Check that the authenticated user owns the league containing this qualifier
        $qualifierId = (int) $this->route('qualifierId');

        /** @var \App\Models\User|null $user */
        $user = auth('web')->user();
        if (!$user) {
            return false;
        }

        $userId = $user->id;

        $raceRepository = app(RaceRepositoryInterface::class);
        return $raceRepository->isOwnedByUser($qualifierId, $userId);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'between:3,100'],
            'qualifying_format' => ['nullable', 'string', 'in:standard,time_trial,previous_race'],
            'qualifying_length' => ['nullable', 'integer', 'min:1'],
            'qualifying_tire' => ['nullable', 'string', 'max:50'],
            'weather' => ['nullable', 'string', 'max:100'],
            'tire_restrictions' => ['nullable', 'string', 'max:100'],
            'fuel_usage' => ['nullable', 'string', 'max:100'],
            'damage_model' => ['nullable', 'string', 'max:100'],
            'track_limits_enforced' => ['nullable', 'boolean'],
            'false_start_detection' => ['nullable', 'boolean'],
            'collision_penalties' => ['nullable', 'boolean'],
            'assists_restrictions' => ['nullable', 'string'],
            'qualifying_pole' => ['nullable', 'numeric', 'min:0'],
            'qualifying_pole_top_10' => ['nullable', 'boolean'],
            'race_notes' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:scheduled,completed'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'qualifying_format.in' => 'Qualifying format must be standard, time_trial, or previous_race.',
            'qualifying_length.min' => 'Qualifying length must be at least 1 minute.',
            'status.in' => 'Status must be either scheduled or completed.',
        ];
    }
}
