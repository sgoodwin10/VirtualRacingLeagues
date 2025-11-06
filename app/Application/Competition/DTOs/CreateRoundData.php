<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\DateFormat;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Data;

/**
 * DTO for creating a new round.
 */
final class CreateRoundData extends Data
{
    public function __construct(
        #[Required, IntegerType, Min(1), Max(99)]
        public readonly int $round_number,
        #[Nullable, Sometimes, StringType, Min(3), Max(100)]
        public readonly ?string $name,
        #[Nullable, Sometimes, DateFormat('Y-m-d H:i:s')]
        public readonly ?string $scheduled_at,
        #[Nullable, Sometimes, IntegerType]
        public readonly ?int $platform_track_id,
        #[Nullable, Sometimes, StringType, Max(100)]
        public readonly ?string $track_layout,
        #[Nullable, Sometimes, StringType, Max(500)]
        public readonly ?string $track_conditions,
        #[Nullable, Sometimes, StringType, Max(2000)]
        public readonly ?string $technical_notes,
        #[Nullable, Sometimes, Url, Max(255)]
        public readonly ?string $stream_url,
        #[Nullable, Sometimes, StringType, Max(2000)]
        public readonly ?string $internal_notes,
        #[Nullable, Sometimes, IntegerType, Min(0), Max(100)]
        public readonly ?int $fastest_lap = null,
        #[Sometimes, BooleanType]
        public readonly bool $fastest_lap_top_10 = false,
    ) {
    }
}
