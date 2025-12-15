<?php

declare(strict_types=1);

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Show Race Results Request.
 * Validates route parameters for fetching race results by race ID.
 */
final class ShowRaceResultsRequest extends FormRequest
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
     * @return array<string, array<int, string|int>>
     */
    public function rules(): array
    {
        return [
            'raceId' => ['required', 'integer', 'min:1'],
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
            'raceId.required' => 'Race ID is required.',
            'raceId.integer' => 'Race ID must be a valid integer.',
            'raceId.min' => 'Race ID must be at least 1.',
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
            'raceId' => $this->route('raceId'),
        ]);
    }

    /**
     * Get the validated race ID.
     */
    public function getRaceId(): int
    {
        return (int) $this->route('raceId');
    }
}
