<?php

declare(strict_types=1);

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Index Public Leagues Request.
 * Validates query parameters for fetching paginated public leagues.
 */
final class IndexPublicLeaguesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Public endpoint - no authentication required.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255', 'regex:/^[\pL\pN\s\-_.,\'()&]*$/u'],
            'platform_id' => ['nullable', 'integer', 'exists:platforms,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'search.regex' => 'The search field contains invalid characters. Only letters, numbers, spaces, and common punctuation are allowed.',
            'search.max' => 'The search field must not exceed 255 characters.',
            'platform_id.integer' => 'The platform ID must be a valid number.',
            'platform_id.exists' => 'The selected platform does not exist.',
            'per_page.integer' => 'The per page value must be a valid number.',
            'per_page.min' => 'The per page value must be at least 1.',
            'per_page.max' => 'The per page value must not exceed 100.',
            'page.integer' => 'The page number must be a valid number.',
            'page.min' => 'The page number must be at least 1.',
        ];
    }

    /**
     * Get filters from validated data.
     *
     * @return array<string, mixed>
     */
    public function getFilters(): array
    {
        $validated = $this->validated();

        return array_filter(
            [
                'search' => $validated['search'] ?? null,
                'platform_id' => $validated['platform_id'] ?? null,
            ],
            fn($value): bool => $value !== null
        );
    }

    /**
     * Get per_page value with default.
     */
    public function getPerPage(): int
    {
        return (int) ($this->validated()['per_page'] ?? 12);
    }

    /**
     * Get page value with default.
     */
    public function getPage(): int
    {
        return (int) ($this->validated()['page'] ?? 1);
    }
}
