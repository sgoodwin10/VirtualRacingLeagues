<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Application\Team\DTOs\AssignDriverTeamData;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for assigning a driver to a team.
 */
class AssignDriverTeamRequest extends FormRequest
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
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
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
            'team_id.integer' => 'Team ID must be an integer.',
            'team_id.exists' => 'The selected team does not exist.',
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
            'team_id' => 'team',
        ];
    }

    /**
     * Get the validated data as a DTO.
     */
    public function toDTO(): AssignDriverTeamData
    {
        return AssignDriverTeamData::from($this->validated());
    }
}
