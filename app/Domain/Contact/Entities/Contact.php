<?php

declare(strict_types=1);

namespace App\Domain\Contact\Entities;

use App\Domain\Contact\Events\ContactSubmitted;
use App\Domain\Contact\ValueObjects\ContactReason;
use App\Domain\Contact\ValueObjects\ContactSource;
use App\Domain\Contact\ValueObjects\ContactStatus;
use App\Domain\Shared\ValueObjects\EmailAddress;
use DateTimeImmutable;

final class Contact
{
    /**
     * @var array<object>
     */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private ?int $userId,
        private string $name,
        private EmailAddress $email,
        private ContactReason $reason,
        private string $message,
        private ContactSource $source,
        private bool $ccUser,
        private ContactStatus $status,
        private array $metadata,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    public static function create(
        string $name,
        EmailAddress $email,
        ContactReason $reason,
        string $message,
        ContactSource $source,
        bool $ccUser = false,
        ?int $userId = null,
        array $metadata = []
    ): self {
        $now = new DateTimeImmutable();

        $contact = new self(
            id: null,
            userId: $userId,
            name: trim($name),
            email: $email,
            reason: $reason,
            message: trim($message),
            source: $source,
            ccUser: $ccUser,
            status: ContactStatus::New,
            metadata: $metadata,
            createdAt: $now,
            updatedAt: $now,
        );

        $contact->recordDomainEvent(new ContactSubmitted($contact));

        return $contact;
    }

    public static function reconstitute(
        int $id,
        ?int $userId,
        string $name,
        EmailAddress $email,
        ContactReason $reason,
        string $message,
        ContactSource $source,
        bool $ccUser,
        ContactStatus $status,
        array $metadata,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            userId: $userId,
            name: $name,
            email: $email,
            reason: $reason,
            message: $message,
            source: $source,
            ccUser: $ccUser,
            status: $status,
            metadata: $metadata,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );
    }

    public function markAsRead(): void
    {
        if ($this->status === ContactStatus::New) {
            $this->status = ContactStatus::Read;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    public function markAsResponded(): void
    {
        $this->status = ContactStatus::Responded;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function archive(): void
    {
        $this->status = ContactStatus::Archived;
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * @param object $event
     */
    private function recordDomainEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function id(): ?int
    {
        return $this->id;
    }

    public function userId(): ?int
    {
        return $this->userId;
    }

    public function name(): string
    {
        return $this->name;
    }

    public function email(): EmailAddress
    {
        return $this->email;
    }

    public function reason(): ContactReason
    {
        return $this->reason;
    }

    public function message(): string
    {
        return $this->message;
    }

    public function source(): ContactSource
    {
        return $this->source;
    }

    public function shouldCcUser(): bool
    {
        return $this->ccUser;
    }

    public function status(): ContactStatus
    {
        return $this->status;
    }

    /**
     * @return array<string, mixed>
     */
    public function metadata(): array
    {
        return $this->metadata;
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
