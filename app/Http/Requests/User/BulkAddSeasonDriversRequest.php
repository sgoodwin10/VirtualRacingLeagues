<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for bulk adding drivers to a season.
 */
class BulkAddSeasonDriversRequest extends FormRequest
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
            'league_driver_ids' => [
                'required',
                'array',
                'min:1',
            ],
            'league_driver_ids.*' => [
                'required',
                'integer',
                'exists:league_drivers,id',
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
            'league_driver_ids.required' => 'Please select at least one driver.',
            'league_driver_ids.array' => 'Driver list must be an array.',
            'league_driver_ids.min' => 'Please select at least one driver.',
            'league_driver_ids.*.required' => 'All driver IDs are required.',
            'league_driver_ids.*.integer' => 'All driver IDs must be numbers.',
            'league_driver_ids.*.exists' => 'One or more selected drivers do not exist.',
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
            'league_driver_ids' => 'drivers',
            'league_driver_ids.*' => 'driver',
        ];
    }
}
