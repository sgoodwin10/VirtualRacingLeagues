<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

final class ImportDriversData extends Data
{
    public function __construct(
        public readonly string $csv_data
    ) {
    }

    /**
     * Validation rules for CSV import.
     *
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            'csv_data' => ['required', 'string', 'min:10'],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'csv_data.required' => 'CSV data is required',
            'csv_data.min' => 'CSV data appears to be empty or too short',
        ];
    }
}
