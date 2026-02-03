<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form request for updating a league.
 * All validation rules are optional to support partial updates.
 */
class UpdateLeagueRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Note: We bypass authorization check here and let it be handled in the controller.
     * This is because Laravel's FormRequest authorization happens BEFORE the controller,
     * and if we return false here, it will return 403 instead of 404 for non-existent resources.
     * The actual authorization check happens in the application service.
     */
    public function authorize(): bool
    {
        // Always return true - authorization is handled in the application service
        // The application service will check:
        // 1. If the league exists (throws LeagueNotFoundException -> 404)
        // 2. If the user is the owner (throws exception -> 403)
        return true;
    }

    /**
     * Prepare the data for validation.
     * Convert empty strings to null for nullable fields.
     */
    protected function prepareForValidation(): void
    {
        $input = $this->all();

        // Convert empty strings and string "null" to null for optional fields
        $optionalFields = [
            'tagline',
            'description',
            'timezone',
            'contact_email',
            'organizer_name',
            'discord_url',
            'website_url',
            'twitter_handle',
            'instagram_handle',
            'youtube_url',
            'twitch_url',
            'facebook_handle',
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
            // Basic Information
            'name' => [
                'sometimes',
                'string',
                'min:3',
                'max:100',
            ],
            'tagline' => [
                'nullable',
                'string',
                'max:150',
            ],
            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],

            // Branding
            'logo' => [
                'sometimes',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120', // 5MB
            ],
            'header_image' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:10240', // 10MB
            ],

            // Platforms
            'platform_ids' => [
                'sometimes',
                'array',
                'min:1',
            ],
            'platform_ids.*' => [
                'required',
                'integer',
                Rule::exists('platforms', 'id')->where(function ($query) {
                    $query->where('is_active', true);
                }),
            ],

            // Social Media & Links
            'discord_url' => [
                'nullable',
                'url',
                'max:255',
            ],
            'website_url' => [
                'nullable',
                'url',
                'max:255',
            ],
            'twitter_handle' => [
                'nullable',
                'string',
                'max:15',
                'regex:/^[a-zA-Z0-9_]+$/',
            ],
            'instagram_handle' => [
                'nullable',
                'string',
                'max:30',
                'regex:/^[a-zA-Z0-9._]+$/',
            ],
            'youtube_url' => [
                'nullable',
                'url',
                'max:255',
            ],
            'twitch_url' => [
                'nullable',
                'url',
                'max:255',
            ],
            'facebook_handle' => [
                'nullable',
                'string',
                'max:100',
                'regex:/^[a-zA-Z0-9.]+$/',
            ],

            // Settings
            'visibility' => [
                'sometimes',
                'string',
                Rule::in(['public', 'unlisted', 'private']),
            ],
            'timezone' => [
                'nullable',
                'string',
                'timezone',
            ],

            // Contact Information
            'contact_email' => [
                'nullable',
                'email',
                'max:255',
            ],
            'organizer_name' => [
                'nullable',
                'string',
                'min:2',
                'max:100',
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
            // Name
            'name.min' => 'League name must be at least 3 characters.',
            'name.max' => 'League name cannot exceed 100 characters.',

            // Tagline
            'tagline.max' => 'Tagline cannot exceed 150 characters.',

            // Description
            'description.max' => 'Description cannot exceed 5000 characters.',

            // Logo
            'logo.image' => 'Logo must be an image file.',
            'logo.mimes' => 'Logo must be in JPEG, JPG, PNG, or WebP format.',
            'logo.max' => 'Logo file size cannot exceed 5MB.',

            // Header Image
            'header_image.image' => 'Header image must be an image file.',
            'header_image.mimes' => 'Header image must be in JPEG, JPG, PNG, or WebP format.',
            'header_image.max' => 'Header image file size cannot exceed 10MB.',

            // Platforms
            'platform_ids.min' => 'Please select at least one racing platform.',
            'platform_ids.*.exists' => 'One or more selected platforms are invalid.',

            // Social Media
            'discord_url.url' => 'Please provide a valid Discord URL.',
            'website_url.url' => 'Please provide a valid website URL.',
            'twitter_handle.regex' => 'Twitter handle can only contain letters, numbers, and underscores.',
            'twitter_handle.max' => 'Twitter handle cannot exceed 15 characters.',
            'instagram_handle.regex' => 'Instagram handle can only contain letters, numbers, dots, and underscores.',
            'instagram_handle.max' => 'Instagram handle cannot exceed 30 characters.',
            'youtube_url.url' => 'Please provide a valid YouTube URL.',
            'twitch_url.url' => 'Please provide a valid Twitch URL.',
            'facebook_handle.regex' => 'Facebook handle can only contain letters, numbers, and dots.',
            'facebook_handle.max' => 'Facebook handle cannot exceed 100 characters.',

            // Settings
            'visibility.in' => 'Invalid visibility setting selected.',
            'timezone.timezone' => 'Please select a valid timezone.',

            // Contact Information
            'contact_email.email' => 'Please provide a valid email address.',
            'organizer_name.min' => 'Organizer name must be at least 2 characters.',
            'organizer_name.max' => 'Organizer name cannot exceed 100 characters.',
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
            'name' => 'league name',
            'tagline' => 'tagline',
            'description' => 'description',
            'logo' => 'logo',
            'header_image' => 'header image',
            'platform_ids' => 'platforms',
            'discord_url' => 'Discord URL',
            'website_url' => 'website URL',
            'twitter_handle' => 'Twitter handle',
            'instagram_handle' => 'Instagram handle',
            'youtube_url' => 'YouTube URL',
            'twitch_url' => 'Twitch URL',
            'facebook_handle' => 'Facebook handle',
            'visibility' => 'visibility',
            'timezone' => 'timezone',
            'contact_email' => 'contact email',
            'organizer_name' => 'organizer name',
        ];
    }
}
