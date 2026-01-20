<?php

declare(strict_types=1);

namespace App\Domain\Contact\Events;

use App\Domain\Contact\Entities\Contact;

final readonly class ContactSubmitted
{
    public function __construct(
        public Contact $contact
    ) {
    }
}
