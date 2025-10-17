<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @property mixed $maintenance_mode
 * @property mixed $user_registration_enabled
 * @property mixed $remove_logo
 * @property mixed $remove_favicon
 * @property mixed $remove_og_image
 */
class UpdateSiteConfigRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Prepare the data for validation.
     * Convert string boolean values from FormData to actual booleans.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'maintenance_mode' => filter_var(
                $this->maintenance_mode,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? false,
            'user_registration_enabled' => filter_var(
                $this->user_registration_enabled,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? true,
            'remove_logo' => filter_var(
                $this->remove_logo,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? false,
            'remove_favicon' => filter_var(
                $this->remove_favicon,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? false,
            'remove_og_image' => filter_var(
                $this->remove_og_image,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? false,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Site Identity
            'site_name' => ['required', 'string', 'max:255'],
            'discord_link' => ['nullable', 'url', 'max:500'],

            // Tracking & Analytics
            'google_tag_manager_id' => ['nullable', 'string', 'max:50', 'regex:/^GTM-[A-Z0-9]+$/'],
            'google_analytics_id' => ['nullable', 'string', 'max:50', 'regex:/^G-[A-Z0-9]+$/'],
            'google_search_console_code' => ['nullable', 'string'],

            // Email Addresses
            'support_email' => ['nullable', 'email', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'admin_email' => ['nullable', 'email', 'max:255'],

            // Application Settings
            'maintenance_mode' => ['required', 'boolean'],
            'timezone' => ['required', 'string', Rule::in(\DateTimeZone::listIdentifiers())],
            'user_registration_enabled' => ['required', 'boolean'],

            // File Uploads
            'logo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,svg', 'max:2048'],
            'favicon' => ['nullable', 'file', 'mimes:ico,png', 'max:512'],
            'og_image' => ['nullable', 'file', 'mimes:png,jpg,jpeg', 'max:2048'],

            // File Removals
            'remove_logo' => ['nullable', 'boolean'],
            'remove_favicon' => ['nullable', 'boolean'],
            'remove_og_image' => ['nullable', 'boolean'],
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
            'site_name.required' => 'Site name is required',
            'site_name.max' => 'Site name cannot exceed 255 characters',
            'discord_link.url' => 'Discord link must be a valid URL',
            'google_tag_manager_id.regex' => 'Google Tag Manager ID must be in format: GTM-XXXXXX',
            'google_analytics_id.regex' => 'Google Analytics ID must be in format: G-XXXXXXXXXX',
            'support_email.email' => 'Support email must be a valid email address',
            'contact_email.email' => 'Contact email must be a valid email address',
            'admin_email.email' => 'Admin email must be a valid email address',
            'timezone.in' => 'Invalid timezone selected',
            'logo.mimes' => 'Logo must be a PNG, JPG, JPEG, or SVG file',
            'logo.max' => 'Logo size cannot exceed 2MB',
            'favicon.mimes' => 'Favicon must be an ICO or PNG file',
            'favicon.max' => 'Favicon size cannot exceed 512KB',
            'og_image.mimes' => 'OG Image must be a PNG, JPG, or JPEG file',
            'og_image.max' => 'OG Image size cannot exceed 2MB',
        ];
    }
}
