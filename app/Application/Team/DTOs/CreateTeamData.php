<?php

declare(strict_types=1);

namespace App\Application\Team\DTOs;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Attributes\Validation\File;
use Spatie\LaravelData\Attributes\Validation\Image;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for creating a team.
 */
final class CreateTeamData extends Data
{
    public function __construct(
        #[Required, Min(2), Max(60)]
        public readonly string $name,
        #[Sometimes, File, Image, Max(2048)]
        public readonly ?UploadedFile $logo = null,
    ) {
    }
}
