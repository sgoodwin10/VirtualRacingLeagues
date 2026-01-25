<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Contact\Entities\Contact;
use App\Domain\Contact\Repositories\ContactRepositoryInterface;
use App\Domain\Contact\ValueObjects\ContactReason;
use App\Domain\Contact\ValueObjects\ContactSource;
use App\Domain\Contact\ValueObjects\ContactStatus;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Infrastructure\Persistence\Eloquent\Models\ContactEloquent;

/**
 * Eloquent implementation of Contact Repository.
 * Maps between domain entities and Eloquent models.
 */
final class EloquentContactRepository implements ContactRepositoryInterface
{
    public function save(Contact $contact): void
    {
        if ($contact->id() === null) {
            // Create new
            $eloquentContact = new ContactEloquent();
            $this->fillEloquentModel($eloquentContact, $contact);
            $eloquentContact->save();

            // Set the ID on the entity after persistence
            $contact->setId($eloquentContact->id);
        } else {
            // Update existing
            $eloquentContact = ContactEloquent::findOrFail($contact->id());
            $this->fillEloquentModel($eloquentContact, $contact);
            $eloquentContact->save();
        }
    }

    public function findById(int $id): ?Contact
    {
        $eloquentContact = ContactEloquent::find($id);

        if ($eloquentContact === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentContact);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{data: array<Contact>, total: int, page: int, per_page: int, last_page: int}
     */
    public function findAll(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $query = ContactEloquent::query();

        // Filter by status
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter by source
        if (isset($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        // Filter by reason
        if (isset($filters['reason'])) {
            $query->where('reason', $filters['reason']);
        }

        // Search by name, email, or message
        if (isset($filters['search']) && ! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        // Order by newest first
        $query->orderBy('created_at', 'desc');

        // Paginate
        $total = $query->count();
        $lastPage = (int) ceil($total / $perPage);

        $eloquentContacts = $query
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $contacts = $eloquentContacts->map(
            fn (ContactEloquent $eloquent) => $this->toDomainEntity($eloquent)
        )->all();

        return [
            'data' => $contacts,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => $lastPage,
        ];
    }

    public function countByStatus(ContactStatus $status): int
    {
        return ContactEloquent::where('status', $status->value)->count();
    }

    private function toDomainEntity(ContactEloquent $model): Contact
    {
        return Contact::reconstitute(
            id: $model->id,
            userId: $model->user_id,
            name: $model->name,
            email: EmailAddress::from($model->email),
            reason: ContactReason::from($model->reason),
            message: $model->message,
            source: ContactSource::from($model->source),
            ccUser: $model->cc_user,
            status: ContactStatus::from($model->status),
            metadata: $model->metadata ?? [],
            createdAt: $model->created_at->toDateTimeImmutable(),
            updatedAt: $model->updated_at->toDateTimeImmutable(),
        );
    }

    private function fillEloquentModel(ContactEloquent $model, Contact $contact): void
    {
        $model->user_id = $contact->userId();
        $model->name = $contact->name();
        $model->email = $contact->email()->value();
        $model->reason = $contact->reason()->value;
        $model->message = $contact->message();
        $model->source = $contact->source()->value;
        $model->cc_user = $contact->shouldCcUser();
        $model->status = $contact->status()->value;
        $model->metadata = $contact->metadata();
    }
}
