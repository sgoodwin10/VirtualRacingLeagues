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
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for updating a league.
 * All fields are optional to support partial updates.
 */
final class UpdateLeagueData extends Data
{
    public function __construct(
        #[Sometimes, Min(3), Max(100)]
        public readonly ?string $name = null,
        #[Sometimes, File, Image, Max(5120)]
        public readonly ?UploadedFile $logo = null,
        /** @var array<int>|null */
        #[Sometimes, ArrayType]
        public readonly ?array $platform_ids = null,
        #[Sometimes, Max(50)]
        public readonly ?string $timezone = null,
        #[Sometimes, In(['public', 'private', 'unlisted'])]
        public readonly ?string $visibility = null,
        #[Sometimes, Email, Max(255)]
        public readonly ?string $contact_email = null,
        #[Sometimes, Max(100)]
        public readonly ?string $organizer_name = null,
        #[Sometimes, Max(150)]
        public readonly ?string $tagline = null,
        #[Sometimes]
        public readonly ?string $description = null,
        #[Sometimes, File, Image, Max(10240)]
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
        #[Sometimes, Max(100)]
        public readonly ?string $facebook_handle = null,
    ) {
    }
}
