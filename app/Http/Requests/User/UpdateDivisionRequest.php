<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for updating a division.
 * All validation rules are optional to support partial updates.
 */
class UpdateDivisionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Note: We bypass authorization check here and let it be handled in the application service.
     * This is because Laravel's FormRequest authorization happens BEFORE the controller,
     * and if we return false here, it will return 403 instead of 404 for non-existent resources.
     * The actual authorization check happens in the application service.
     */
    public function authorize(): bool
    {
        // Always return true - authorization is handled in the application service
        // The application service will check:
        // 1. If the division exists (throws DivisionNotFoundException -> 404)
        // 2. If the season exists (throws exception -> 404)
        // 3. If the user is the league owner (throws UnauthorizedException -> 403)
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
        $optionalFields = ['description'];

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
            'name' => [
                'sometimes',
                'string',
                'min:2',
                'max:60',
            ],
            'description' => [
                'nullable',
                'string',
                'min:10',
                'max:500',
            ],
            'logo' => [
                'sometimes',
                'file',
                'image',
                'max:2048', // 2MB in KB
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
            'name.min' => 'Division name must be at least 2 characters.',
            'name.max' => 'Division name cannot exceed 60 characters.',

            // Description
            'description.min' => 'Description must be at least 10 characters.',
            'description.max' => 'Description cannot exceed 500 characters.',

            // Logo
            'logo.file' => 'Logo must be a file.',
            'logo.image' => 'Logo must be an image file.',
            'logo.max' => 'Logo file size cannot exceed 2MB.',
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
            'name' => 'division name',
            'description' => 'description',
            'logo' => 'logo',
        ];
    }
}
