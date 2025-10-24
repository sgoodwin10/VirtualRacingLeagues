<?php

declare(strict_types=1);

namespace App\Application\Team\DTOs;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Attributes\Validation\File;
use Spatie\LaravelData\Attributes\Validation\Image;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for updating a team.
 */
final class UpdateTeamData extends Data
{
    public function __construct(
        #[Sometimes, Min(2), Max(60)]
        public readonly ?string $name = null,
        #[Sometimes, File, Image, Max(2048)]
        public readonly ?UploadedFile $logo = null,
    ) {
    }
}
