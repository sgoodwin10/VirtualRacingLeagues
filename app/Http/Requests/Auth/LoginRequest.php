<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Rules\RecaptchaV3Rule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for user login.
 */
class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $rules = [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ];

        // Add reCAPTCHA validation if enabled
        if (config('recaptchav3.enabled', true)) {
            $rules['recaptcha_token'] = ['required', 'string', new RecaptchaV3Rule('login')];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Email address is required',
            'email.email' => 'Please provide a valid email address',
            'password.required' => 'Password is required',
        ];
    }
}
