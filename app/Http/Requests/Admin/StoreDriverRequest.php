<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Application\Driver\DTOs\AdminCreateDriverData;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for creating a driver in admin context.
 */
final class StoreDriverRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return AdminCreateDriverData::rules();
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return AdminCreateDriverData::messages();
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
            'nickname' => 'nickname',
            'email' => 'email address',
            'phone' => 'phone number',
            'psn_id' => 'PSN ID',
            'iracing_id' => 'iRacing ID',
            'iracing_customer_id' => 'iRacing Customer ID',
            'discord_id' => 'Discord ID',
        ];
    }
}
