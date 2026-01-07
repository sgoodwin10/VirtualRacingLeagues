<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for adding a driver to a season.
 */
class AddSeasonDriverRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by middleware (auth:web, user.authenticate)
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
            'league_driver_id' => [
                'required',
                'integer',
                'exists:league_drivers,id',
            ],
            'status' => [
                'string',
                'in:active,reserve,withdrawn',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
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
            'league_driver_id.required' => 'Please select a driver.',
            'league_driver_id.integer' => 'Driver ID must be a number.',
            'league_driver_id.exists' => 'The selected driver does not exist.',
            'status.in' => 'Invalid status. Must be: active, reserve, or withdrawn.',
            'notes.string' => 'Notes must be text.',
            'notes.max' => 'Notes cannot exceed 1000 characters.',
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
            'league_driver_id' => 'driver',
            'status' => 'driver status',
            'notes' => 'notes',
        ];
    }
}
