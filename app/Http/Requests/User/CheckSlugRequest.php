<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Form request for checking slug availability.
 */
final class CheckSlugRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'min:3',
                'max:100',
            ],
            'league_id' => [
                'nullable',
                'integer',
                Rule::exists('leagues', 'id')->where(function ($query) {
                    $query->where('owner_user_id', Auth::id());
                }),
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
            'name.required' => 'Please provide a name to check.',
            'name.min' => 'Name must be at least 3 characters.',
            'name.max' => 'Name cannot exceed 100 characters.',
            'league_id.integer' => 'League ID must be a valid integer.',
            'league_id.exists' => 'The specified league does not exist or does not belong to you.',
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
            'name' => 'name',
            'league_id' => 'league ID',
        ];
    }
}
