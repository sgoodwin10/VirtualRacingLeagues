<?php

declare(strict_types=1);

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Show Public Round Results Request.
 * Validates route parameters for fetching round results by round ID.
 */
final class ShowPublicRoundResultsRequest extends FormRequest
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
            'roundId' => ['required', 'integer', 'min:1'],
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
            'roundId.required' => 'Round ID is required.',
            'roundId.integer' => 'Round ID must be a valid integer.',
            'roundId.min' => 'Round ID must be at least 1.',
        ];
    }

    /**
     * Get all route parameters for validation.
     *
     * @return array<string, mixed>
     */
    public function validationData(): array
    {
        /** @var array<string, mixed> $allData */
        $allData = $this->all();

        return array_merge($allData, [
            'roundId' => $this->route('roundId'),
        ]);
    }

    /**
     * Get the validated round ID.
     */
    public function getRoundId(): int
    {
        /** @var int|string|null $roundId */
        $roundId = $this->route('roundId');

        return (int) $roundId;
    }
}
