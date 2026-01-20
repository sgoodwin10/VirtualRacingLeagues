<?php

declare(strict_types=1);

namespace App\Application\Contact\DTOs;

use App\Domain\Contact\Entities\Contact;
use Spatie\LaravelData\Data;

final class ContactData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly ?int $userId,
        public readonly string $name,
        public readonly string $email,
        public readonly string $reason,
        public readonly string $reasonLabel,
        public readonly string $message,
        public readonly string $source,
        public readonly string $sourceLabel,
        public readonly bool $ccUser,
        public readonly string $status,
        public readonly string $statusLabel,
        /** @var array<string, mixed> */
        public readonly array $metadata,
        public readonly string $createdAt,
        public readonly string $updatedAt,
    ) {
    }

    public static function fromEntity(Contact $contact): self
    {
        return new self(
            id: $contact->id() ?? 0,
            userId: $contact->userId(),
            name: $contact->name(),
            email: $contact->email()->value(),
            reason: $contact->reason()->value,
            reasonLabel: $contact->reason()->label(),
            message: $contact->message(),
            source: $contact->source()->value,
            sourceLabel: $contact->source()->label(),
            ccUser: $contact->shouldCcUser(),
            status: $contact->status()->value,
            statusLabel: $contact->status()->label(),
            metadata: $contact->metadata(),
            createdAt: $contact->createdAt()->format('Y-m-d H:i:s'),
            updatedAt: $contact->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
