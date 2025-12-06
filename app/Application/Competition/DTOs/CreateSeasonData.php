<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Data;

/**
 * Input DTO for creating a season.
 */
class CreateSeasonData extends Data
{
    public function __construct(
        public int $competition_id,
        public string $name,
        public ?string $slug = null,
        public ?string $car_class = null,
        public ?string $description = null,
        public ?string $technical_specs = null,
        public ?UploadedFile $logo = null,
        public ?UploadedFile $banner = null,
        public bool $team_championship_enabled = false,
        public bool $race_divisions_enabled = false,
        public bool $race_times_required = true,
    ) {
    }

    /**
     * Validation rules for request input.
     *
     * Note: competition_id is not validated here because it comes from
     * the route parameter and is added in the controller after validation.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'slug' => ['nullable', 'string', 'min:3', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'car_class' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'technical_specs' => ['nullable', 'string', 'max:5000'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
            'banner' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:4096'],
            'team_championship_enabled' => ['boolean'],
            'race_divisions_enabled' => ['boolean'],
            'race_times_required' => ['boolean'],
        ];
    }
}
