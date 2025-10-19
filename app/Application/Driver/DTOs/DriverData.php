<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use App\Domain\Driver\Entities\Driver;
use Spatie\LaravelData\Data;

final class DriverData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly ?string $first_name,
        public readonly ?string $last_name,
        public readonly ?string $nickname,
        public readonly string $display_name,
        public readonly ?string $email,
        public readonly ?string $phone,
        public readonly ?string $psn_id,
        public readonly ?string $gt7_id,
        public readonly ?string $iracing_id,
        public readonly ?int $iracing_customer_id,
        public readonly string $primary_platform_id,
        public readonly string $created_at,
        public readonly string $updated_at,
        public readonly ?string $deleted_at
    ) {
    }

    /**
     * Create from domain entity.
     */
    public static function fromEntity(Driver $driver): self
    {
        return new self(
            id: $driver->id() ?? 0,
            first_name: $driver->name()->firstName(),
            last_name: $driver->name()->lastName(),
            nickname: $driver->name()->nickname(),
            display_name: $driver->name()->displayName(),
            email: $driver->email(),
            phone: $driver->phone(),
            psn_id: $driver->platformIds()->psnId(),
            gt7_id: $driver->platformIds()->gt7Id(),
            iracing_id: $driver->platformIds()->iracingId(),
            iracing_customer_id: $driver->platformIds()->iracingCustomerId(),
            primary_platform_id: $driver->platformIds()->primaryIdentifier(),
            created_at: $driver->createdAt()?->format('Y-m-d H:i:s') ?? '',
            updated_at: $driver->updatedAt()?->format('Y-m-d H:i:s') ?? '',
            deleted_at: $driver->deletedAt()?->format('Y-m-d H:i:s')
        );
    }
}
