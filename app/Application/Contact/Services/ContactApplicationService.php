<?php

declare(strict_types=1);

namespace App\Application\Contact\Services;

use App\Application\Contact\DTOs\ContactData;
use App\Application\Contact\DTOs\CreateContactData;
use App\Domain\Contact\Entities\Contact;
use App\Domain\Contact\Repositories\ContactRepositoryInterface;
use App\Domain\Contact\ValueObjects\ContactReason;
use App\Domain\Contact\ValueObjects\ContactSource;
use App\Domain\Shared\ValueObjects\EmailAddress;
use Illuminate\Support\Facades\DB;

final class ContactApplicationService
{
    public function __construct(
        private readonly ContactRepositoryInterface $contactRepository
    ) {
    }

    public function submitContact(CreateContactData $data): ContactData
    {
        return DB::transaction(function () use ($data): ContactData {
            // Create domain entity
            $contact = Contact::create(
                name: $data->name,
                email: EmailAddress::from($data->email),
                reason: ContactReason::from($data->reason),
                message: $data->message,
                source: ContactSource::from($data->source),
                ccUser: $data->ccUser,
                userId: $data->userId,
                metadata: $data->metadata
            );

            // Persist
            $this->contactRepository->save($contact);

            // Dispatch domain events
            $this->dispatchEvents($contact);

            return ContactData::fromEntity($contact);
        });
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{data: array<ContactData>, total: int, page: int, per_page: int, last_page: int}
     */
    public function getContacts(array $filters, int $page, int $perPage): array
    {
        $result = $this->contactRepository->findAll($filters, $page, $perPage);

        return [
            'data' => array_map(
                fn(Contact $contact) => ContactData::fromEntity($contact),
                $result['data']
            ),
            'total' => $result['total'],
            'page' => $result['page'],
            'per_page' => $result['per_page'],
            'last_page' => $result['last_page'],
        ];
    }

    public function getContactById(int $id): ?ContactData
    {
        $contact = $this->contactRepository->findById($id);

        if ($contact === null) {
            return null;
        }

        return ContactData::fromEntity($contact);
    }

    public function markAsRead(int $id): ?ContactData
    {
        return DB::transaction(function () use ($id): ?ContactData {
            $contact = $this->contactRepository->findById($id);

            if ($contact === null) {
                return null;
            }

            $contact->markAsRead();
            $this->contactRepository->save($contact);

            return ContactData::fromEntity($contact);
        });
    }

    public function markAsResponded(int $id): ?ContactData
    {
        return DB::transaction(function () use ($id): ?ContactData {
            $contact = $this->contactRepository->findById($id);

            if ($contact === null) {
                return null;
            }

            $contact->markAsResponded();
            $this->contactRepository->save($contact);

            return ContactData::fromEntity($contact);
        });
    }

    public function archive(int $id): ?ContactData
    {
        return DB::transaction(function () use ($id): ?ContactData {
            $contact = $this->contactRepository->findById($id);

            if ($contact === null) {
                return null;
            }

            $contact->archive();
            $this->contactRepository->save($contact);

            return ContactData::fromEntity($contact);
        });
    }

    private function dispatchEvents(Contact $contact): void
    {
        foreach ($contact->releaseEvents() as $event) {
            event($event);
        }
    }
}
