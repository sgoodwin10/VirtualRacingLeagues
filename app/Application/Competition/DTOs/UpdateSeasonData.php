<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Data;

/**
 * Input DTO for updating a season.
 */
class UpdateSeasonData extends Data
{
    public function __construct(
        public string $name,
        public ?string $car_class = null,
        public ?string $description = null,
        public ?string $technical_specs = null,
        public ?UploadedFile $logo = null,
        public ?UploadedFile $banner = null,
        public ?bool $team_championship_enabled = null,
        public ?bool $race_divisions_enabled = null,
        public ?bool $remove_logo = null,
        public ?bool $remove_banner = null,
    ) {
    }

    /**
     * Validation rules for request input.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'car_class' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'technical_specs' => ['nullable', 'string', 'max:5000'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
            'banner' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:4096'],
            'team_championship_enabled' => ['nullable', 'boolean'],
            'race_divisions_enabled' => ['nullable', 'boolean'],
            'remove_logo' => ['nullable', 'boolean'],
            'remove_banner' => ['nullable', 'boolean'],
        ];
    }
}
