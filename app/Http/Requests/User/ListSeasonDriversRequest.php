<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Rules\DivisionExists;
use App\Rules\TeamExists;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for listing season drivers with filtering and pagination.
 */
class ListSeasonDriversRequest extends FormRequest
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
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],
            'status' => [
                'nullable',
                'string',
                'in:active,reserve,withdrawn',
            ],
            'division_id' => [
                'nullable',
                'integer',
                new DivisionExists(),
            ],
            'team_id' => [
                'nullable',
                'integer',
                new TeamExists(),
            ],
            'order_by' => [
                'nullable',
                'string',
                'in:added_at,status,driver_name,discord_id,psn_id,iracing_id,driver_number,division_name,team_name',
            ],
            'order_direction' => [
                'nullable',
                'string',
                'in:asc,desc',
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
            'page.integer' => 'Page must be a number.',
            'page.min' => 'Page must be at least 1.',
            'per_page.integer' => 'Items per page must be a number.',
            'per_page.min' => 'Items per page must be at least 1.',
            'per_page.max' => 'Items per page cannot exceed 100.',
            'search.string' => 'Search query must be text.',
            'search.max' => 'Search query cannot exceed 255 characters.',
            'status.in' => 'Invalid status. Must be: active, reserve, or withdrawn.',
            'division_id.integer' => 'Division ID must be a number.',
            'team_id.integer' => 'Team ID must be a number.',
            'order_by.in' => 'Invalid sort column.',
            'order_direction.in' => 'Invalid sort direction. Must be: asc or desc.',
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
            'page' => 'page number',
            'per_page' => 'items per page',
            'search' => 'search query',
            'status' => 'driver status',
            'division_id' => 'division',
            'team_id' => 'team',
            'order_by' => 'sort column',
            'order_direction' => 'sort direction',
        ];
    }
}
