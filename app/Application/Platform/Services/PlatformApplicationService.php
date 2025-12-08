<?php

declare(strict_types=1);

namespace App\Application\Platform\Services;

use App\Domain\Platform\Repositories\PlatformRepositoryInterface;

/**
 * Platform Application Service.
 * Orchestrates platform use cases and coordinates domain logic.
 */
final class PlatformApplicationService
{
    public function __construct(
        private readonly PlatformRepositoryInterface $platformRepository,
    ) {
    }

    /**
     * Get all active platforms ordered by sort order.
     *
     * @return array<array{id: int, name: string, slug: string}>
     */
    public function getAllActivePlatforms(): array
    {
        return $this->platformRepository->getAllActive();
    }
}
