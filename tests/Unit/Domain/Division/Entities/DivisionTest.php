<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Division\Entities;

use App\Domain\Division\Entities\Division;
use App\Domain\Division\Events\DivisionCreated;
use App\Domain\Division\Events\DivisionDeleted;
use App\Domain\Division\Events\DivisionUpdated;
use App\Domain\Division\ValueObjects\DivisionDescription;
use App\Domain\Division\ValueObjects\DivisionName;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class DivisionTest extends TestCase
{
    #[Test]
    public function it_creates_new_division_with_required_fields_only(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from(null)
        );

        $this->assertNull($division->id());
        $this->assertEquals(1, $division->seasonId());
        $this->assertEquals('Pro Division', $division->name()->value());
        $this->assertNull($division->description()->value());
        $this->assertNull($division->logoUrl());
        $this->assertInstanceOf(DateTimeImmutable::class, $division->createdAt());
        $this->assertInstanceOf(DateTimeImmutable::class, $division->updatedAt());
    }

    #[Test]
    public function it_creates_new_division_with_all_fields(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from('This is a description for the pro division'),
            logoUrl: 'divisions/season-1/logo.png'
        );

        $this->assertNull($division->id());
        $this->assertEquals(1, $division->seasonId());
        $this->assertEquals('Pro Division', $division->name()->value());
        $this->assertEquals('This is a description for the pro division', $division->description()->value());
        $this->assertEquals('divisions/season-1/logo.png', $division->logoUrl());
    }

    #[Test]
    public function it_reconstitutes_division_from_persistence(): void
    {
        $createdAt = new DateTimeImmutable('2025-01-01 10:00:00');
        $updatedAt = new DateTimeImmutable('2025-01-02 15:30:00');

        $division = Division::reconstitute(
            id: 123,
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from('Division description'),
            logoUrl: 'divisions/season-1/logo.png',
            createdAt: $createdAt,
            updatedAt: $updatedAt
        );

        $this->assertEquals(123, $division->id());
        $this->assertEquals(1, $division->seasonId());
        $this->assertEquals('Pro Division', $division->name()->value());
        $this->assertEquals('Division description', $division->description()->value());
        $this->assertEquals('divisions/season-1/logo.png', $division->logoUrl());
        $this->assertEquals($createdAt, $division->createdAt());
        $this->assertEquals($updatedAt, $division->updatedAt());
    }

    #[Test]
    public function it_sets_id_after_persistence(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from(null)
        );

        $this->assertNull($division->id());

        $division->setId(123);

        $this->assertEquals(123, $division->id());
    }

    #[Test]
    public function it_records_creation_event_after_id_is_set(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from('Division description'),
            logoUrl: 'divisions/season-1/logo.png'
        );

        $division->setId(123);
        $division->recordCreationEvent();

        $events = $division->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(DivisionCreated::class, $events[0]);
        $this->assertEquals(123, $events[0]->divisionId);
        $this->assertEquals(1, $events[0]->seasonId);
        $this->assertEquals('Pro Division', $events[0]->name);
        $this->assertEquals('Division description', $events[0]->description);
        $this->assertEquals('divisions/season-1/logo.png', $events[0]->logoUrl);
    }

    #[Test]
    public function it_throws_exception_when_recording_creation_event_without_id(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from(null)
        );

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Cannot record creation event before entity has an ID');

        $division->recordCreationEvent();
    }

    #[Test]
    public function it_updates_division_details(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from('Old description'),
            logoUrl: 'divisions/season-1/old-logo.png'
        );

        $division->setId(123);

        $division->updateDetails(
            name: DivisionName::from('Elite Division'),
            description: DivisionDescription::from('New description for elite division'),
            logoUrl: 'divisions/season-1/new-logo.png'
        );

        $this->assertEquals('Elite Division', $division->name()->value());
        $this->assertEquals('New description for elite division', $division->description()->value());
        $this->assertEquals('divisions/season-1/new-logo.png', $division->logoUrl());

        $events = $division->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(DivisionUpdated::class, $events[0]);
        $this->assertEquals(123, $events[0]->divisionId);
        $this->assertArrayHasKey('name', $events[0]->changes);
        $this->assertArrayHasKey('description', $events[0]->changes);
        $this->assertArrayHasKey('logo_url', $events[0]->changes);
    }

    #[Test]
    public function it_does_not_record_event_when_no_changes_made(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from('Description'),
            logoUrl: 'divisions/season-1/logo.png'
        );

        $division->setId(123);

        $division->updateDetails(
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from('Description'),
            logoUrl: 'divisions/season-1/logo.png'
        );

        $events = $division->releaseEvents();
        $this->assertCount(0, $events);
    }

    #[Test]
    public function it_updates_name_only(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from(null)
        );

        $division->setId(123);

        $division->updateName(DivisionName::from('Elite Division'));

        $this->assertEquals('Elite Division', $division->name()->value());

        $events = $division->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(DivisionUpdated::class, $events[0]);
        $this->assertArrayHasKey('name', $events[0]->changes);
        $this->assertEquals('Elite Division', $events[0]->changes['name']);
    }

    #[Test]
    public function it_does_not_record_event_when_name_unchanged(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from(null)
        );

        $division->setId(123);

        $division->updateName(DivisionName::from('Pro Division'));

        $events = $division->releaseEvents();
        $this->assertCount(0, $events);
    }

    #[Test]
    public function it_updates_description_only(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from('Old description')
        );

        $division->setId(123);

        $division->updateDescription(DivisionDescription::from('New description'));

        $this->assertEquals('New description', $division->description()->value());

        $events = $division->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(DivisionUpdated::class, $events[0]);
        $this->assertArrayHasKey('description', $events[0]->changes);
        $this->assertEquals('New description', $events[0]->changes['description']);
    }

    #[Test]
    public function it_updates_logo_only(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from(null),
            logoUrl: 'divisions/season-1/old-logo.png'
        );

        $division->setId(123);

        $division->updateLogo('divisions/season-1/new-logo.png');

        $this->assertEquals('divisions/season-1/new-logo.png', $division->logoUrl());

        $events = $division->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(DivisionUpdated::class, $events[0]);
        $this->assertArrayHasKey('logo_url', $events[0]->changes);
        $this->assertEquals('divisions/season-1/new-logo.png', $events[0]->changes['logo_url']);
    }

    #[Test]
    public function it_deletes_division_and_records_event(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from(null)
        );

        $division->setId(123);

        $division->delete();

        $events = $division->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(DivisionDeleted::class, $events[0]);
        $this->assertEquals(123, $events[0]->divisionId);
        $this->assertEquals(1, $events[0]->seasonId);
    }

    #[Test]
    public function it_releases_events_and_clears_them(): void
    {
        $division = Division::create(
            seasonId: 1,
            name: DivisionName::from('Pro Division'),
            description: DivisionDescription::from(null)
        );

        $division->setId(123);
        $division->recordCreationEvent();

        $this->assertTrue($division->hasEvents());

        $events = $division->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertFalse($division->hasEvents());
        $this->assertCount(0, $division->releaseEvents());
    }
}
