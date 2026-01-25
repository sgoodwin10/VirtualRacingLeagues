<?php

declare(strict_types=1);

namespace App\Domain\Notification\Repositories;

use App\Domain\Notification\Entities\NotificationLog;
use DateTimeImmutable;

interface NotificationLogRepositoryInterface
{
    public function save(NotificationLog $notificationLog): void;

    public function findById(int $id): ?NotificationLog;

    /**
     * @param  array<string, mixed>  $filters
     * @return array{data: array<NotificationLog>, total: int, page: int, per_page: int, last_page: int}
     */
    public function findAll(array $filters = [], int $page = 1, int $perPage = 20): array;

    public function deleteOlderThan(DateTimeImmutable $date): int;
}
