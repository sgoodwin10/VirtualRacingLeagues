<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization is handled in the controller
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'alias' => ['nullable', 'string', 'max:100', 'unique:users,alias'],
            'uuid' => ['nullable', 'string', 'max:60'],
            'password' => ['required', 'string', 'min:8'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
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
            'first_name' => 'first name',
            'last_name' => 'last name',
            'email' => 'email address',
            'alias' => 'user alias',
            'uuid' => 'platform UUID',
            'password' => 'password',
            'status' => 'account status',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'The first name field is required.',
            'last_name.required' => 'The last name field is required.',
            'email.required' => 'The email address field is required.',
            'email.email' => 'The email address must be a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'alias.unique' => 'This alias is already in use.',
            'password.required' => 'The password field is required.',
        ];
    }
}
