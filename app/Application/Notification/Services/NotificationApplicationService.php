<?php

declare(strict_types=1);

namespace App\Application\Notification\Services;

use App\Application\Notification\DTOs\NotificationLogData;
use App\Domain\Notification\Entities\NotificationLog;
use App\Domain\Notification\Repositories\NotificationLogRepositoryInterface;
use DateTimeImmutable;

final class NotificationApplicationService
{
    public function __construct(
        private readonly NotificationLogRepositoryInterface $notificationLogRepository
    ) {
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{data: array<NotificationLogData>, total: int, page: int, per_page: int, last_page: int}
     */
    public function getNotificationLogs(array $filters, int $page, int $perPage): array
    {
        $result = $this->notificationLogRepository->findAll($filters, $page, $perPage);

        return [
            'data' => array_map(
                fn (NotificationLog $log) => NotificationLogData::fromEntity($log),
                $result['data']
            ),
            'total' => $result['total'],
            'page' => $result['page'],
            'per_page' => $result['per_page'],
            'last_page' => $result['last_page'],
        ];
    }

    public function getNotificationById(int $id): ?NotificationLogData
    {
        $log = $this->notificationLogRepository->findById($id);

        if ($log === null) {
            return null;
        }

        return NotificationLogData::fromEntity($log);
    }

    public function cleanupOldNotifications(int $daysToKeep): int
    {
        $cutoffDate = (new DateTimeImmutable())->modify("-{$daysToKeep} days");

        return $this->notificationLogRepository->deleteOlderThan($cutoffDate);
    }
}
