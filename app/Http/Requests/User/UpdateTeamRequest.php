<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Application\Team\DTOs\UpdateTeamData;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for updating a team.
 */
class UpdateTeamRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Authorization is handled by middleware (auth:web, user.authenticate)
     * and by the application service (league owner check).
     */
    public function authorize(): bool
    {
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
            'name' => ['sometimes', 'string', 'min:2', 'max:60'],
            'logo' => ['sometimes', 'file', 'image', 'max:2048'],
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
            'name.min' => 'Team name must be at least 2 characters.',
            'name.max' => 'Team name cannot exceed 60 characters.',

            'logo.file' => 'Logo must be a file.',
            'logo.image' => 'Logo must be an image file.',
            'logo.max' => 'Logo file size cannot exceed 2MB.',
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'team name',
            'logo' => 'logo',
        ];
    }

    /**
     * Get the validated data as a DTO.
     */
    public function toDTO(): UpdateTeamData
    {
        return UpdateTeamData::from($this->validated());
    }
}
