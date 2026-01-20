<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Notification\Entities\NotificationLog;
use App\Domain\Notification\Repositories\NotificationLogRepositoryInterface;
use App\Domain\Notification\ValueObjects\NotificationChannel;
use App\Domain\Notification\ValueObjects\NotificationStatus;
use App\Domain\Notification\ValueObjects\NotificationType;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationLogEloquent;
use DateTimeImmutable;

/**
 * Eloquent implementation of NotificationLog Repository.
 * Maps between domain entities and Eloquent models.
 */
final class EloquentNotificationLogRepository implements NotificationLogRepositoryInterface
{
    public function save(NotificationLog $notificationLog): void
    {
        if ($notificationLog->id() === null) {
            // Create new
            $eloquentLog = new NotificationLogEloquent();
            $this->fillEloquentModel($eloquentLog, $notificationLog);
            $eloquentLog->save();

            // Set the ID on the entity after persistence
            $notificationLog->setId($eloquentLog->id);
        } else {
            // Update existing
            $eloquentLog = NotificationLogEloquent::findOrFail($notificationLog->id());
            $this->fillEloquentModel($eloquentLog, $notificationLog);
            $eloquentLog->save();
        }
    }

    public function findById(int $id): ?NotificationLog
    {
        $eloquentLog = NotificationLogEloquent::find($id);

        if ($eloquentLog === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentLog);
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{data: array<NotificationLog>, total: int, page: int, per_page: int, last_page: int}
     */
    public function findAll(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $query = NotificationLogEloquent::query();

        // Filter by notification type
        if (isset($filters['type'])) {
            $query->where('notification_type', $filters['type']);
        }

        // Filter by channel
        if (isset($filters['channel'])) {
            $query->where('channel', $filters['channel']);
        }

        // Filter by status
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by date range
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // Search by recipient, subject, or body
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('recipient', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            });
        }

        // Order by newest first
        $query->orderBy('created_at', 'desc');

        // Paginate
        $total = $query->count();
        $lastPage = (int) ceil($total / $perPage);

        $eloquentLogs = $query
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $logs = $eloquentLogs->map(
            fn(NotificationLogEloquent $eloquent) => $this->toDomainEntity($eloquent)
        )->all();

        return [
            'data' => $logs,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => $lastPage,
        ];
    }

    public function deleteOlderThan(DateTimeImmutable $date): int
    {
        return NotificationLogEloquent::where('created_at', '<', $date->format('Y-m-d H:i:s'))
            ->delete();
    }

    private function toDomainEntity(NotificationLogEloquent $model): NotificationLog
    {
        return NotificationLog::reconstitute(
            id: $model->id,
            type: NotificationType::from($model->notification_type),
            channel: NotificationChannel::from($model->channel),
            recipient: $model->recipient,
            subject: $model->subject,
            body: $model->body,
            metadata: $model->metadata ?? [],
            status: NotificationStatus::from($model->status),
            errorMessage: $model->error_message,
            sentAt: $model->sent_at?->toDateTimeImmutable(),
            createdAt: $model->created_at->toDateTimeImmutable(),
            updatedAt: $model->updated_at->toDateTimeImmutable(),
        );
    }

    private function fillEloquentModel(NotificationLogEloquent $model, NotificationLog $log): void
    {
        $model->notification_type = $log->type()->value;
        $model->channel = $log->channel()->value;
        $model->recipient = $log->recipient();
        $model->subject = $log->subject();
        $model->body = $log->body();
        $model->metadata = $log->metadata();
        $model->status = $log->status()->value;
        $model->error_message = $log->errorMessage();
        $model->sent_at = $log->sentAt()?->format('Y-m-d H:i:s');
    }
}
