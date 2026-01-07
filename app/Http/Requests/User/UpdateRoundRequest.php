<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Application\Competition\DTOs\UpdateRoundData;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for updating a round.
 */
class UpdateRoundRequest extends FormRequest
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
        return [
            'round_number' => [
                'sometimes',
                'integer',
                'min:1',
                'max:99',
            ],
            'name' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'scheduled_at' => [
                'sometimes',
                'nullable',
                'date_format:Y-m-d H:i:s',
            ],
            'platform_track_id' => [
                'sometimes',
                'integer',
            ],
            'track_layout' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'track_conditions' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],
            'technical_notes' => [
                'sometimes',
                'nullable',
                'string',
                'max:2000',
            ],
            'stream_url' => [
                'sometimes',
                'nullable',
                'url',
                'max:255',
            ],
            'internal_notes' => [
                'sometimes',
                'nullable',
                'string',
                'max:2000',
            ],
            'fastest_lap' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
                'max:100',
            ],
            'fastest_lap_top_10' => [
                'sometimes',
                'boolean',
            ],
            'qualifying_pole' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
                'max:100',
            ],
            'qualifying_pole_top_10' => [
                'sometimes',
                'boolean',
            ],
            'points_system' => [
                'sometimes',
                'nullable',
                'json',
            ],
            'round_points' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize empty strings to null for nullable fields
        $data = $this->all();
        $data = UpdateRoundData::prepareForPipeline($data);
        $this->replace($data);
    }

    /**
     * Get the validated data as a DTO.
     */
    public function toDTO(): UpdateRoundData
    {
        return UpdateRoundData::from($this->validated());
    }
}
