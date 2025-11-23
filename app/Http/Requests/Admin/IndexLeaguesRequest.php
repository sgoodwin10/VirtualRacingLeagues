<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class IndexLeaguesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization is handled in the controller
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'visibility' => ['nullable', 'in:public,private,unlisted'],
            'status' => ['nullable', 'in:active,archived'],
            'platform_ids' => ['nullable', 'array'],
            'platform_ids.*' => ['integer', 'exists:platforms,id'],
            'sort_by' => ['nullable', 'in:id,name,visibility,status,created_at,updated_at'],
            'sort_direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
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
            'search' => 'search term',
            'visibility' => 'visibility filter',
            'status' => 'status filter',
            'platform_ids' => 'platform filters',
            'sort_by' => 'sort field',
            'sort_direction' => 'sort direction',
            'per_page' => 'items per page',
            'page' => 'page number',
        ];
    }
}
