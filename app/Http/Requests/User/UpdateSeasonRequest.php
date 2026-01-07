<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Rules\ValidateDropRounds;
use App\Rules\ValidateTeamsDropRounds;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for updating a season.
 * All validation rules are optional to support partial updates.
 */
class UpdateSeasonRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Authorization is handled by middleware (auth:web, user.authenticate)
     * and by the application service (league owner check).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     * Convert empty strings to null for nullable fields.
     */
    protected function prepareForValidation(): void
    {
        $input = $this->all();

        // Convert empty strings to null for optional fields
        $optionalFields = [
            'car_class',
            'description',
            'technical_specs',
            'teams_drivers_for_calculation',
            'teams_total_drop_rounds',
            'total_drop_rounds',
        ];

        foreach ($optionalFields as $field) {
            if (isset($input[$field]) && ($input[$field] === '' || $input[$field] === 'null')) {
                $input[$field] = null;
            }
        }

        $this->replace($input);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'car_class' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'technical_specs' => ['nullable', 'string', 'max:5000'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
            'banner' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:4096'],
            'team_championship_enabled' => ['nullable', 'boolean'],
            'teams_drivers_for_calculation' => ['nullable', 'integer', 'min:1', 'max:16'],
            'teams_drop_rounds' => ['nullable', 'boolean'],
            'teams_total_drop_rounds' => ['nullable', 'integer', 'min:0', 'max:20', new ValidateTeamsDropRounds()],
            'race_divisions_enabled' => ['nullable', 'boolean'],
            'race_times_required' => ['nullable', 'boolean'],
            'drop_round' => ['nullable', 'boolean'],
            'total_drop_rounds' => ['nullable', 'integer', 'min:0', 'max:20', new ValidateDropRounds()],
            'round_totals_tiebreaker_rules_enabled' => ['nullable', 'boolean'],
            'remove_logo' => ['nullable', 'boolean'],
            'remove_banner' => ['nullable', 'boolean'],
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
            'name.required' => 'Please provide a name for the season.',
            'name.min' => 'Season name must be at least 3 characters.',
            'name.max' => 'Season name cannot exceed 100 characters.',

            'car_class.max' => 'Car class cannot exceed 100 characters.',
            'description.max' => 'Description cannot exceed 2000 characters.',
            'technical_specs.max' => 'Technical specs cannot exceed 5000 characters.',

            'logo.image' => 'Logo must be an image file.',
            'logo.mimes' => 'Logo must be in PNG, JPG, or JPEG format.',
            'logo.max' => 'Logo file size cannot exceed 2MB.',

            'banner.image' => 'Banner must be an image file.',
            'banner.mimes' => 'Banner must be in PNG, JPG, or JPEG format.',
            'banner.max' => 'Banner file size cannot exceed 4MB.',

            'teams_drivers_for_calculation.min' => 'Teams drivers for calculation must be at least 1.',
            'teams_drivers_for_calculation.max' => 'Teams drivers for calculation cannot exceed 16.',

            'teams_total_drop_rounds.min' => 'Teams total drop rounds must be at least 0.',
            'teams_total_drop_rounds.max' => 'Teams total drop rounds cannot exceed 20.',

            'total_drop_rounds.min' => 'Total drop rounds must be at least 0.',
            'total_drop_rounds.max' => 'Total drop rounds cannot exceed 20.',
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
            'name' => 'season name',
            'car_class' => 'car class',
            'description' => 'description',
            'technical_specs' => 'technical specs',
            'logo' => 'logo',
            'banner' => 'banner',
            'team_championship_enabled' => 'team championship',
            'teams_drivers_for_calculation' => 'teams drivers for calculation',
            'teams_drop_rounds' => 'teams drop rounds',
            'teams_total_drop_rounds' => 'teams total drop rounds',
            'race_divisions_enabled' => 'race divisions',
            'race_times_required' => 'race times required',
            'drop_round' => 'drop round',
            'total_drop_rounds' => 'total drop rounds',
            'round_totals_tiebreaker_rules_enabled' => 'tiebreaker rules',
            'remove_logo' => 'remove logo',
            'remove_banner' => 'remove banner',
        ];
    }
}
