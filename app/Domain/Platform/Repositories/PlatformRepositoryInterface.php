<?php

declare(strict_types=1);

namespace App\Domain\Platform\Repositories;

use App\Application\Competition\DTOs\PlatformData;

/**
 * Platform Repository Interface.
 * Handles platform data retrieval.
 */
interface PlatformRepositoryInterface
{
    /**
     * Find platform by ID and return as DTO.
     *
     * @throws \RuntimeException if platform not found
     */
    public function findById(int $id): PlatformData;
}
