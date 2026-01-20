<?php

declare(strict_types=1);

namespace App\Domain\Notification\Entities;

use App\Domain\Notification\ValueObjects\NotificationChannel;
use App\Domain\Notification\ValueObjects\NotificationStatus;
use App\Domain\Notification\ValueObjects\NotificationType;
use DateTimeImmutable;

final class NotificationLog
{
    private function __construct(
        private ?int $id,
        private NotificationType $type,
        private NotificationChannel $channel,
        private ?string $recipient,
        private ?string $subject,
        private ?string $body,
        private array $metadata,
        private NotificationStatus $status,
        private ?string $errorMessage,
        private ?DateTimeImmutable $sentAt,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    public static function create(
        NotificationType $type,
        NotificationChannel $channel,
        ?string $recipient,
        ?string $subject,
        ?string $body,
        array $metadata = []
    ): self {
        $now = new DateTimeImmutable();

        return new self(
            id: null,
            type: $type,
            channel: $channel,
            recipient: $recipient,
            subject: $subject,
            body: $body,
            metadata: $metadata,
            status: NotificationStatus::Pending,
            errorMessage: null,
            sentAt: null,
            createdAt: $now,
            updatedAt: $now,
        );
    }

    public static function reconstitute(
        int $id,
        NotificationType $type,
        NotificationChannel $channel,
        ?string $recipient,
        ?string $subject,
        ?string $body,
        array $metadata,
        NotificationStatus $status,
        ?string $errorMessage,
        ?DateTimeImmutable $sentAt,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        $notificationLog = new self(
            id: $id,
            type: $type,
            channel: $channel,
            recipient: $recipient,
            subject: $subject,
            body: $body,
            metadata: $metadata,
            status: $status,
            errorMessage: $errorMessage,
            sentAt: $sentAt,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );

        return $notificationLog;
    }

    public function markAsSent(): void
    {
        $this->status = NotificationStatus::Sent;
        $this->sentAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    public function markAsFailed(string $errorMessage): void
    {
        $this->status = NotificationStatus::Failed;
        $this->errorMessage = $errorMessage;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function id(): ?int
    {
        return $this->id;
    }

    public function type(): NotificationType
    {
        return $this->type;
    }

    public function channel(): NotificationChannel
    {
        return $this->channel;
    }

    public function recipient(): ?string
    {
        return $this->recipient;
    }

    public function subject(): ?string
    {
        return $this->subject;
    }

    public function body(): ?string
    {
        return $this->body;
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array
    {
        return $this->metadata;
    }

    public function status(): NotificationStatus
    {
        return $this->status;
    }

    public function errorMessage(): ?string
    {
        return $this->errorMessage;
    }

    public function sentAt(): ?DateTimeImmutable
    {
        return $this->sentAt;
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
