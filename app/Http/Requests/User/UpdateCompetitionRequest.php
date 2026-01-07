<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Application\Competition\DTOs\UpdateCompetitionData;
use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for updating a competition.
 * Authorization: User must own the competition's league.
 *
 * Note: We bypass authorization check here and let it be handled in the application service.
 * This is because Laravel's FormRequest authorization happens BEFORE the controller,
 * and if we return false here, it will return 403 instead of 404 for non-existent resources.
 * The actual authorization check happens in the application service via authorizeLeagueOwner().
 */
class UpdateCompetitionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Note: Always return true - authorization is handled in the application service.
     * The application service will check:
     * 1. If the competition exists (throws CompetitionNotFoundException -> 404)
     * 2. If the user is the league owner (throws UnauthorizedException -> 403)
     */
    public function authorize(): bool
    {
        // Always return true - authorization is handled in the application service
        return true;
    }

    /**
     * Prepare the data for validation.
     * Convert empty strings to null for nullable fields.
     */
    protected function prepareForValidation(): void
    {
        /** @var array<string, mixed> $input */
        /** @phpstan-ignore-next-line */
        $input = $this->all();

        // Convert empty strings and string "null" to null for optional fields
        $optionalFields = [
            'name',
            'description',
            'competition_colour',
        ];

        foreach ($optionalFields as $field) {
            if (isset($input[$field]) && ($input[$field] === '' || $input[$field] === 'null')) {
                $input[$field] = null;
            }
        }

        /** @phpstan-ignore-next-line */
        $this->replace($input);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return UpdateCompetitionData::rules();
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Name
            'name.min' => 'Competition name must be at least 3 characters.',
            'name.max' => 'Competition name cannot exceed 100 characters.',

            // Description
            'description.max' => 'Description cannot exceed 1000 characters.',

            // Logo
            'logo.image' => 'Logo must be an image file.',
            'logo.mimes' => 'Logo must be in PNG, JPG, or JPEG format.',
            'logo.max' => 'Logo file size cannot exceed 2MB.',

            // Competition Colour
            'competition_colour.max' => 'Competition colour cannot exceed 255 characters.',
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
            'name' => 'competition name',
            'description' => 'description',
            'logo' => 'logo',
            'competition_colour' => 'competition colour',
        ];
    }
}
