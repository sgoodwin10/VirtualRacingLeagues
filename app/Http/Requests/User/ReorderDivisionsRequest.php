<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for reordering divisions.
 */
class ReorderDivisionsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Note: We bypass authorization check here and let it be handled in the application service.
     * This is because Laravel's FormRequest authorization happens BEFORE the controller,
     * and if we return false here, it will return 403 instead of 404 for non-existent resources.
     * The actual authorization check happens in the application service.
     */
    public function authorize(): bool
    {
        // Always return true - authorization is handled in the application service
        // The application service will check:
        // 1. If the season exists (throws exception -> 404)
        // 2. If the user is the league owner (throws UnauthorizedException -> 403)
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
            'divisions' => [
                'required',
                'array',
                'min:1',
            ],
            'divisions.*.id' => [
                'required',
                'integer',
                'min:1',
            ],
            'divisions.*.order' => [
                'required',
                'integer',
                'min:1',
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
            'divisions.required' => 'Divisions array is required.',
            'divisions.array' => 'Divisions must be an array.',
            'divisions.min' => 'At least one division is required.',
            'divisions.*.id.required' => 'Division ID is required.',
            'divisions.*.id.integer' => 'Division ID must be an integer.',
            'divisions.*.id.min' => 'Division ID must be at least 1.',
            'divisions.*.order.required' => 'Division order is required.',
            'divisions.*.order.integer' => 'Division order must be an integer.',
            'divisions.*.order.min' => 'Division order must be at least 1.',
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
            'divisions' => 'divisions',
            'divisions.*.id' => 'division ID',
            'divisions.*.order' => 'division order',
        ];
    }
}
