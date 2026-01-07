<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Application\Competition\DTOs\CreateRoundData;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for creating a round.
 */
class CreateRoundRequest extends FormRequest
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
                'required',
                'integer',
                'min:1',
                'max:99',
            ],
            'name' => [
                'nullable',
                'string',
                'min:3',
                'max:100',
            ],
            'scheduled_at' => [
                'nullable',
                'date_format:Y-m-d H:i:s',
            ],
            'platform_track_id' => [
                'nullable',
                'integer',
            ],
            'track_layout' => [
                'nullable',
                'string',
                'max:100',
            ],
            'track_conditions' => [
                'nullable',
                'string',
                'max:500',
            ],
            'technical_notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'stream_url' => [
                'nullable',
                'url',
                'max:255',
            ],
            'internal_notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'fastest_lap' => [
                'nullable',
                'integer',
                'min:0',
                'max:100',
            ],
            'fastest_lap_top_10' => [
                'boolean',
            ],
            'qualifying_pole' => [
                'nullable',
                'integer',
                'min:0',
                'max:100',
            ],
            'qualifying_pole_top_10' => [
                'boolean',
            ],
            'points_system' => [
                'nullable',
                'json',
            ],
            'round_points' => [
                'boolean',
            ],
        ];
    }

    /**
     * Get the validated data as a DTO.
     */
    public function toDTO(): CreateRoundData
    {
        return CreateRoundData::from($this->validated());
    }
}
