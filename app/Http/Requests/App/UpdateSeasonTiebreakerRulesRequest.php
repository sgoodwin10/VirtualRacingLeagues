<?php

declare(strict_types=1);

namespace App\Http\Requests\App;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request validation for updating season tiebreaker rules.
 */
final class UpdateSeasonTiebreakerRulesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'rules' => ['required', 'array', 'min:1', 'max:10'],
            'rules.*.id' => ['required', 'integer', 'exists:round_tiebreaker_rules,id'],
            'rules.*.order' => ['required', 'integer', 'min:1'],
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
            'rules.required' => 'At least one tiebreaker rule is required',
            'rules.*.id.required' => 'Rule ID is required',
            'rules.*.id.exists' => 'Invalid tiebreaker rule ID',
            'rules.*.order.required' => 'Rule order is required',
            'rules.*.order.min' => 'Rule order must be at least 1',
        ];
    }
}
