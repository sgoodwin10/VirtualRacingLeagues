<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Application\Competition\DTOs\CompleteRoundData;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for completing a round.
 * Handles optional cross-division results data from frontend.
 */
class CompleteRoundRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by middleware (auth:web, user.authenticate)
        // Additional authorization (league ownership) is handled by the application service
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return CompleteRoundData::rules();
    }

    /**
     * Get the validated data as a DTO, or null if no data provided.
     */
    public function toDTO(): ?CompleteRoundData
    {
        // Only create DTO if any cross-division results are provided
        if (!$this->hasAny(['qualifying_results', 'race_time_results', 'fastest_lap_results'])) {
            return null;
        }

        return CompleteRoundData::from($this->validated());
    }
}
