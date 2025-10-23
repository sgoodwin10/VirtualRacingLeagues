<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Data;

/**
 * Input DTO for creating a competition.
 */
class CreateCompetitionData extends Data
{
    public function __construct(
        public string $name,
        public int $platform_id,
        public int $league_id,
        public ?string $description = null,
        public ?UploadedFile $logo = null,
    ) {
    }

    /**
     * Validation rules for request input.
     * Note: league_id is set from URL parameter, not from request body.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'platform_id' => ['required', 'integer', 'exists:platforms,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
        ];
    }
}
