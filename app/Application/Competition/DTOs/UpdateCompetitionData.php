<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Data;

/**
 * Input DTO for updating a competition.
 * Note: Platform ID is intentionally excluded (immutable).
 */
class UpdateCompetitionData extends Data
{
    public function __construct(
        public ?string $name = null,
        public ?string $description = null,
        public ?UploadedFile $logo = null,
    ) {
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'min:3', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
        ];
    }
}
