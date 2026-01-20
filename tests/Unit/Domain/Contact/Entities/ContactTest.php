<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Contact\Entities;

use App\Domain\Contact\Entities\Contact;
use App\Domain\Contact\Events\ContactSubmitted;
use App\Domain\Contact\ValueObjects\ContactReason;
use App\Domain\Contact\ValueObjects\ContactSource;
use App\Domain\Contact\ValueObjects\ContactStatus;
use App\Domain\Shared\ValueObjects\EmailAddress;
use PHPUnit\Framework\TestCase;

final class ContactTest extends TestCase
{
    public function test_creates_contact_with_required_fields(): void
    {
        $contact = Contact::create(
            name: 'John Doe',
            email: EmailAddress::from('john@example.com'),
            reason: ContactReason::Question,
            message: 'Test message',
            source: ContactSource::Public
        );

        $this->assertNull($contact->id());
        $this->assertSame('John Doe', $contact->name());
        $this->assertSame('john@example.com', $contact->email()->value());
        $this->assertSame(ContactReason::Question, $contact->reason());
        $this->assertSame('Test message', $contact->message());
        $this->assertSame(ContactSource::Public, $contact->source());
        $this->assertFalse($contact->shouldCcUser());
        $this->assertNull($contact->userId());
        $this->assertSame(ContactStatus::New, $contact->status());
    }

    public function test_creates_contact_with_optional_fields(): void
    {
        $contact = Contact::create(
            name: 'Jane Doe',
            email: EmailAddress::from('jane@example.com'),
            reason: ContactReason::Help,
            message: 'Help me please',
            source: ContactSource::App,
            ccUser: true,
            userId: 123,
            metadata: ['ip' => '127.0.0.1']
        );

        $this->assertTrue($contact->shouldCcUser());
        $this->assertSame(123, $contact->userId());
        $this->assertSame(['ip' => '127.0.0.1'], $contact->metadata());
    }

    public function test_trims_name_and_message(): void
    {
        $contact = Contact::create(
            name: '  John Doe  ',
            email: EmailAddress::from('john@example.com'),
            reason: ContactReason::Question,
            message: '  Test message  ',
            source: ContactSource::Public
        );

        $this->assertSame('John Doe', $contact->name());
        $this->assertSame('Test message', $contact->message());
    }

    public function test_records_contact_submitted_event(): void
    {
        $contact = Contact::create(
            name: 'John Doe',
            email: EmailAddress::from('john@example.com'),
            reason: ContactReason::Question,
            message: 'Test',
            source: ContactSource::Public
        );

        $events = $contact->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(ContactSubmitted::class, $events[0]);
    }

    public function test_marks_contact_as_read(): void
    {
        $contact = Contact::create(
            name: 'John Doe',
            email: EmailAddress::from('john@example.com'),
            reason: ContactReason::Question,
            message: 'Test',
            source: ContactSource::Public
        );

        $this->assertSame(ContactStatus::New, $contact->status());

        $contact->markAsRead();

        $this->assertSame(ContactStatus::Read, $contact->status());
    }

    public function test_marks_contact_as_responded(): void
    {
        $contact = Contact::create(
            name: 'John Doe',
            email: EmailAddress::from('john@example.com'),
            reason: ContactReason::Question,
            message: 'Test',
            source: ContactSource::Public
        );

        $contact->markAsResponded();

        $this->assertSame(ContactStatus::Responded, $contact->status());
    }

    public function test_archives_contact(): void
    {
        $contact = Contact::create(
            name: 'John Doe',
            email: EmailAddress::from('john@example.com'),
            reason: ContactReason::Question,
            message: 'Test',
            source: ContactSource::Public
        );

        $contact->archive();

        $this->assertSame(ContactStatus::Archived, $contact->status());
    }

    public function test_mark_as_read_only_works_for_new_contacts(): void
    {
        $contact = Contact::create(
            name: 'John Doe',
            email: EmailAddress::from('john@example.com'),
            reason: ContactReason::Question,
            message: 'Test',
            source: ContactSource::Public
        );

        $contact->markAsResponded();
        $contact->markAsRead();

        // Status should remain "responded", not change to "read"
        $this->assertSame(ContactStatus::Responded, $contact->status());
    }
}
