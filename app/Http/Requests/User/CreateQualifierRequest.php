<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use Illuminate\Foundation\Http\FormRequest;

final class CreateQualifierRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create a qualifier for this round.
     */
    public function authorize(): bool
    {
        // Check that the authenticated user owns the league containing this round
        $roundId = (int) $this->route('roundId');

        /** @var \App\Models\User|null $user */
        $user = auth('web')->user();
        if (! $user) {
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
            'name' => ['nullable', 'string', 'between:3,100'],
            'qualifying_format' => ['required', 'string', 'in:standard,time_trial,previous_race'],
            'qualifying_length' => ['required', 'integer', 'min:1'],
            'qualifying_tire' => ['nullable', 'string', 'max:50'],
            'weather' => ['nullable', 'string', 'max:100'],
            'tire_restrictions' => ['nullable', 'string', 'max:100'],
            'fuel_usage' => ['nullable', 'string', 'max:100'],
            'damage_model' => ['nullable', 'string', 'max:100'],
            'track_limits_enforced' => ['required', 'boolean'],
            'false_start_detection' => ['required', 'boolean'],
            'collision_penalties' => ['required', 'boolean'],
            'assists_restrictions' => ['nullable', 'string'],
            'qualifying_pole' => ['nullable', 'numeric', 'min:0'],
            'qualifying_pole_top_10' => ['nullable', 'boolean'],
            'race_notes' => ['nullable', 'string'],
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
            'qualifying_format.required' => 'Qualifying format is required for qualifiers.',
            'qualifying_format.in' => 'Qualifying format must be standard, time_trial, or previous_race.',
            'qualifying_length.required' => 'Qualifying length is required for qualifiers.',
            'qualifying_length.min' => 'Qualifying length must be at least 1 minute.',
        ];
    }
}
