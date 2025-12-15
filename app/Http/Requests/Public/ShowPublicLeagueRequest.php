<?php

declare(strict_types=1);

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Show Public League Request.
 * Validates route parameters for fetching a specific public league by slug.
 */
final class ShowPublicLeagueRequest extends FormRequest
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
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
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
            'slug.required' => 'League slug is required.',
            'slug.string' => 'League slug must be a string.',
            'slug.max' => 'League slug must not exceed 255 characters.',
            'slug.regex' => 'League slug must contain only lowercase letters, numbers, and hyphens.',
        ];
    }

    /**
     * Get all route parameters for validation.
     *
     * @return array<string, mixed>
     */
    public function validationData(): array
    {
        return array_merge($this->all(), [
            'slug' => $this->route('slug'),
        ]);
    }

    /**
     * Get the validated league slug.
     */
    public function getSlug(): string
    {
        return (string) $this->route('slug');
    }
}
