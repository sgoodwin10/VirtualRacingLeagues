<?php

declare(strict_types=1);

namespace App\Application\Notification\DTOs;

use App\Domain\Notification\Entities\NotificationLog;
use Spatie\LaravelData\Data;

final class NotificationLogData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $type,
        public readonly string $typeLabel,
        public readonly string $channel,
        public readonly string $channelLabel,
        public readonly ?string $recipient,
        public readonly ?string $subject,
        public readonly ?string $body,
        /** @var array<string, mixed> */
        public readonly array $metadata,
        public readonly string $status,
        public readonly string $statusLabel,
        public readonly ?string $errorMessage,
        public readonly ?string $sentAt,
        public readonly string $createdAt,
        public readonly string $updatedAt,
    ) {
    }

    public static function fromEntity(NotificationLog $log): self
    {
        return new self(
            id: $log->id() ?? 0,
            type: $log->type()->value,
            typeLabel: $log->type()->label(),
            channel: $log->channel()->value,
            channelLabel: $log->channel()->label(),
            recipient: $log->recipient(),
            subject: $log->subject(),
            body: $log->body(),
            metadata: $log->metadata(),
            status: $log->status()->value,
            statusLabel: $log->status()->label(),
            errorMessage: $log->errorMessage(),
            sentAt: $log->sentAt()?->format('Y-m-d H:i:s'),
            createdAt: $log->createdAt()->format('Y-m-d H:i:s'),
            updatedAt: $log->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
