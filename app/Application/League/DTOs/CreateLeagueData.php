<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\File;
use Spatie\LaravelData\Attributes\Validation\Image;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for creating a league.
 */
final class CreateLeagueData extends Data
{
    public function __construct(
        #[Required, Min(3), Max(100)]
        public readonly string $name,
        #[Required, File, Image, Max(2048)]
        public readonly UploadedFile $logo,
        /** @var array<int> */
        #[Required, ArrayType]
        public readonly array $platform_ids,
        #[Required, In(['public', 'private', 'unlisted'])]
        public readonly string $visibility,
        #[Sometimes, Max(50)]
        public readonly ?string $timezone = null,
        #[Sometimes, Email, Max(255)]
        public readonly ?string $contact_email = null,
        #[Sometimes, Max(100)]
        public readonly ?string $organizer_name = null,
        #[Sometimes, Max(150)]
        public readonly ?string $tagline = null,
        #[Sometimes]
        public readonly ?string $description = null,
        #[Sometimes, File, Image, Max(4096)]
        public readonly ?UploadedFile $header_image = null,
        #[Sometimes, File, Image, Max(2048)]
        public readonly ?UploadedFile $banner = null,
        #[Sometimes, Url, Max(255)]
        public readonly ?string $discord_url = null,
        #[Sometimes, Url, Max(255)]
        public readonly ?string $website_url = null,
        #[Sometimes, Max(100)]
        public readonly ?string $twitter_handle = null,
        #[Sometimes, Max(100)]
        public readonly ?string $instagram_handle = null,
        #[Sometimes, Url, Max(255)]
        public readonly ?string $youtube_url = null,
        #[Sometimes, Url, Max(255)]
        public readonly ?string $twitch_url = null,
    ) {
    }
}
