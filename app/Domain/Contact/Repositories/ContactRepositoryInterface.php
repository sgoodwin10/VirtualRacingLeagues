<?php

declare(strict_types=1);

namespace App\Domain\Contact\Repositories;

use App\Domain\Contact\Entities\Contact;
use App\Domain\Contact\ValueObjects\ContactStatus;

interface ContactRepositoryInterface
{
    public function save(Contact $contact): void;

    public function findById(int $id): ?Contact;

    /**
     * @param array<string, mixed> $filters
     * @return array{data: array<Contact>, total: int, page: int, per_page: int, last_page: int}
     */
    public function findAll(array $filters = [], int $page = 1, int $perPage = 20): array;

    public function countByStatus(ContactStatus $status): int;
}
