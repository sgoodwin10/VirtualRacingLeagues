<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // No auth required for contact form
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'reason' => ['required', 'string', 'in:error,question,help,other,hello'],
            'message' => ['required', 'string', 'max:2000'],
            'cc_user' => ['boolean'],
            'source' => ['sometimes', 'string', 'in:app,public'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter your name.',
            'name.max' => 'Name cannot exceed 255 characters.',
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'Email cannot exceed 255 characters.',
            'reason.required' => 'Please select a reason for contacting us.',
            'reason.in' => 'Please select a valid reason.',
            'message.required' => 'Please enter your message.',
            'message.max' => 'Message cannot exceed 2000 characters.',
        ];
    }
}
