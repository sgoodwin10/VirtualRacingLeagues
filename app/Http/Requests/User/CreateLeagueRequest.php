<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form request for creating a league.
 */
class CreateLeagueRequest extends FormRequest
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
            // Basic Information
            'name' => [
                'required',
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
                'required',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:2048', // 2MB
            ],
            'header_image' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120', // 5MB
            ],

            // Platforms
            'platform_ids' => [
                'required',
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

            // Settings
            'visibility' => [
                'required',
                'string',
                Rule::in(['public', 'unlisted', 'private']),
            ],
            'timezone' => [
                'required',
                'string',
                'timezone',
            ],

            // Contact Information
            'contact_email' => [
                'required',
                'email',
                'max:255',
            ],
            'organizer_name' => [
                'required',
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
            'name.required' => 'Please provide a name for your league.',
            'name.min' => 'League name must be at least 3 characters.',
            'name.max' => 'League name cannot exceed 100 characters.',

            // Tagline
            'tagline.max' => 'Tagline cannot exceed 150 characters.',

            // Description
            'description.max' => 'Description cannot exceed 5000 characters.',

            // Logo
            'logo.required' => 'Please upload a league logo.',
            'logo.image' => 'Logo must be an image file.',
            'logo.mimes' => 'Logo must be in JPEG, JPG, PNG, or WebP format.',
            'logo.max' => 'Logo file size cannot exceed 2MB.',

            // Header Image
            'header_image.image' => 'Header image must be an image file.',
            'header_image.mimes' => 'Header image must be in JPEG, JPG, PNG, or WebP format.',
            'header_image.max' => 'Header image file size cannot exceed 5MB.',

            // Platforms
            'platform_ids.required' => 'Please select at least one racing platform.',
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

            // Settings
            'visibility.required' => 'Please select a visibility setting.',
            'visibility.in' => 'Invalid visibility setting selected.',
            'timezone.required' => 'Please select a timezone.',
            'timezone.timezone' => 'Please select a valid timezone.',

            // Contact Information
            'contact_email.required' => 'Please provide a contact email address.',
            'contact_email.email' => 'Please provide a valid email address.',
            'organizer_name.required' => 'Please provide the organizer name.',
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
            'visibility' => 'visibility',
            'timezone' => 'timezone',
            'contact_email' => 'contact email',
            'organizer_name' => 'organizer name',
        ];
    }
}
