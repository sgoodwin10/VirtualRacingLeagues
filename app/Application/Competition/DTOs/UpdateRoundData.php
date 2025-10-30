<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\DateFormat;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;

/**
 * DTO for updating a round.
 */
final class UpdateRoundData extends Data
{
    public function __construct(
        #[Sometimes, IntegerType, Min(1), Max(99)]
        public readonly ?int $round_number = null,
        #[Sometimes, Nullable, StringType, Min(3), Max(100)]
        public readonly ?string $name = null,
        #[Sometimes, Nullable, DateFormat('Y-m-d H:i:s')]
        public readonly ?string $scheduled_at = null,
        #[Sometimes, IntegerType]
        public readonly ?int $platform_track_id = null,
        #[Sometimes, Nullable, StringType, Max(100)]
        public readonly ?string $track_layout = null,
        #[Sometimes, Nullable, StringType, Max(500)]
        public readonly ?string $track_conditions = null,
        #[Sometimes, Nullable, StringType, Max(2000)]
        public readonly ?string $technical_notes = null,
        #[Sometimes, Nullable, Url, Max(255)]
        public readonly ?string $stream_url = null,
        #[Sometimes, Nullable, StringType, Max(2000)]
        public readonly ?string $internal_notes = null,
    ) {
    }
}
