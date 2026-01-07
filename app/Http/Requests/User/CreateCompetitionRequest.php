<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Application\Competition\DTOs\CreateCompetitionData;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for creating a competition.
 * Authorization: User must own the league.
 */
class CreateCompetitionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Checks if the authenticated user owns the league.
     *
     * Note: Authorization is handled here for create action only.
     * The league ID comes from the route parameter {leagueId}.
     */
    public function authorize(): bool
    {
        // Get league ID from route parameter
        /** @var int|string|null $leagueId */
        /** @phpstan-ignore-next-line */
        $leagueId = $this->route('leagueId');

        if (!$leagueId) {
            return false;
        }

        // Check if league exists and user owns it
        $league = League::find($leagueId);

        if (!$league instanceof League) {
            return false;
        }

        /** @phpstan-ignore-next-line */
        return $league->owner_user_id === $this->user()?->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return CreateCompetitionData::rules();
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
            'name.required' => 'Please provide a name for your competition.',
            'name.min' => 'Competition name must be at least 3 characters.',
            'name.max' => 'Competition name cannot exceed 100 characters.',

            // Platform
            'platform_id.required' => 'Please select a racing platform.',
            'platform_id.integer' => 'Invalid platform selected.',
            'platform_id.exists' => 'The selected platform does not exist.',

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
            'platform_id' => 'platform',
            'description' => 'description',
            'logo' => 'logo',
            'competition_colour' => 'competition colour',
        ];
    }
}
