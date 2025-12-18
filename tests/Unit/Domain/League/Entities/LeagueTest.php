<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\League\Entities;

use App\Domain\League\Entities\League;
use App\Domain\League\Events\LeagueCreated;
use App\Domain\League\Events\LeagueUpdated;
use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueSlug;
use App\Domain\League\ValueObjects\LeagueVisibility;
use App\Domain\League\ValueObjects\Tagline;
use App\Domain\Shared\ValueObjects\EmailAddress;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class LeagueTest extends TestCase
{
    #[Test]
    public function it_creates_new_league_with_required_fields(): void
    {
        $league = League::create(
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->assertNull($league->id());
        $this->assertEquals('F1 Racing League', $league->name()->value());
        $this->assertEquals('f1-racing-league', $league->slug()->value());
        $this->assertEquals('leagues/logos/logo.png', $league->logoPath());
        $this->assertEquals('Europe/London', $league->timezone());
        $this->assertEquals(1, $league->ownerUserId());
        $this->assertEquals('contact@example.com', $league->contactEmail()->value());
        $this->assertEquals('John Doe', $league->organizerName());
        $this->assertNull($league->tagline());
        $this->assertNull($league->description());
        $this->assertNull($league->headerImagePath());
        $this->assertEquals([], $league->platformIds());
        $this->assertNull($league->discordUrl());
        $this->assertNull($league->websiteUrl());
        $this->assertNull($league->twitterHandle());
        $this->assertNull($league->instagramHandle());
        $this->assertNull($league->youtubeUrl());
        $this->assertNull($league->twitchUrl());
        $this->assertEquals(LeagueVisibility::PUBLIC, $league->visibility());
        $this->assertEquals('active', $league->status());
        $this->assertTrue($league->isActive());
        $this->assertFalse($league->isArchived());
    }

    #[Test]
    public function it_creates_new_league_with_all_optional_fields(): void
    {
        $league = League::create(
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe',
            tagline: Tagline::from('The Premier F1 League'),
            description: 'A competitive F1 racing league',
            headerImagePath: 'leagues/headers/header.png',
            platformIds: [1, 2, 3],
            discordUrl: 'https://discord.gg/league',
            websiteUrl: 'https://league.example.com',
            twitterHandle: '@f1league',
            instagramHandle: '@f1league',
            youtubeUrl: 'https://youtube.com/@f1league',
            twitchUrl: 'https://twitch.tv/f1league',
            visibility: LeagueVisibility::PRIVATE
        );

        $this->assertEquals('The Premier F1 League', $league->tagline()->value());
        $this->assertEquals('A competitive F1 racing league', $league->description());
        $this->assertEquals('leagues/headers/header.png', $league->headerImagePath());
        $this->assertEquals([1, 2, 3], $league->platformIds());
        $this->assertEquals('https://discord.gg/league', $league->discordUrl());
        $this->assertEquals('https://league.example.com', $league->websiteUrl());
        $this->assertEquals('@f1league', $league->twitterHandle());
        $this->assertEquals('@f1league', $league->instagramHandle());
        $this->assertEquals('https://youtube.com/@f1league', $league->youtubeUrl());
        $this->assertEquals('https://twitch.tv/f1league', $league->twitchUrl());
        $this->assertEquals(LeagueVisibility::PRIVATE, $league->visibility());
    }

    #[Test]
    public function it_defaults_to_public_visibility_when_not_specified(): void
    {
        $league = League::create(
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->assertEquals(LeagueVisibility::PUBLIC, $league->visibility());
        $this->assertTrue($league->visibility()->isPublic());
    }

    #[Test]
    public function it_defaults_to_active_status(): void
    {
        $league = League::create(
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->assertEquals('active', $league->status());
        $this->assertTrue($league->isActive());
        $this->assertFalse($league->isArchived());
    }

    #[Test]
    public function it_records_creation_event_after_id_is_set(): void
    {
        $league = League::create(
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->assertFalse($league->hasEvents());

        // Simulate repository setting ID
        $league->setId(1);
        $league->recordCreationEvent();

        $this->assertTrue($league->hasEvents());
        $events = $league->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueCreated::class, $events[0]);
    }

    #[Test]
    public function it_throws_exception_when_recording_creation_event_without_id(): void
    {
        $league = League::create(
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Cannot record creation event before entity has an ID');

        $league->recordCreationEvent();
    }

    #[Test]
    public function it_updates_league_details(): void
    {
        $league = $this->createLeague();

        $league->updateDetails(
            LeagueName::from('Updated League Name'),
            Tagline::from('Updated tagline'),
            'Updated description'
        );

        $this->assertEquals('Updated League Name', $league->name()->value());
        $this->assertEquals('Updated tagline', $league->tagline()->value());
        $this->assertEquals('Updated description', $league->description());
    }

    #[Test]
    public function it_records_updated_event_when_updating_details(): void
    {
        $league = $this->createLeague();

        $league->updateDetails(
            LeagueName::from('Updated League Name'),
            Tagline::from('Updated tagline'),
            'Updated description'
        );

        $this->assertTrue($league->hasEvents());
        $events = $league->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    #[Test]
    public function it_changes_visibility(): void
    {
        $league = $this->createLeague();

        $this->assertEquals(LeagueVisibility::PUBLIC, $league->visibility());

        $league->changeVisibility(LeagueVisibility::PRIVATE);

        $this->assertEquals(LeagueVisibility::PRIVATE, $league->visibility());
        $this->assertTrue($league->visibility()->isPrivate());
    }

    #[Test]
    public function it_records_updated_event_when_changing_visibility(): void
    {
        $league = $this->createLeague();

        $league->changeVisibility(LeagueVisibility::PRIVATE);

        $this->assertTrue($league->hasEvents());
        $events = $league->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    #[Test]
    public function it_archives_league(): void
    {
        $league = $this->createLeague();

        $this->assertTrue($league->isActive());

        $league->archive();

        $this->assertEquals('archived', $league->status());
        $this->assertFalse($league->isActive());
        $this->assertTrue($league->isArchived());
    }

    #[Test]
    public function it_records_updated_event_when_archiving(): void
    {
        $league = $this->createLeague();

        $league->archive();

        $this->assertTrue($league->hasEvents());
        $events = $league->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    #[Test]
    public function it_activates_archived_league(): void
    {
        $league = $this->createLeague();
        $league->archive();

        $this->assertTrue($league->isArchived());

        $league->activate();

        $this->assertEquals('active', $league->status());
        $this->assertTrue($league->isActive());
        $this->assertFalse($league->isArchived());
    }

    #[Test]
    public function it_records_updated_event_when_activating(): void
    {
        $league = $this->createLeague();
        $league->archive();
        $league->releaseEvents(); // Clear previous events

        $league->activate();

        $this->assertTrue($league->hasEvents());
        $events = $league->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    #[Test]
    public function it_releases_and_clears_events(): void
    {
        $league = $this->createLeague();

        $league->updateDetails(
            LeagueName::from('Updated League Name'),
            null,
            null
        );

        $this->assertTrue($league->hasEvents());

        $events = $league->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertFalse($league->hasEvents());
        $this->assertEmpty($league->releaseEvents());
    }

    #[Test]
    public function it_reconstitutes_league_from_persistence(): void
    {
        $league = League::reconstitute(
            id: 1,
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe',
            tagline: Tagline::from('The Premier F1 League'),
            description: 'A competitive F1 racing league',
            headerImagePath: 'leagues/headers/header.png',
            bannerPath: null,
            platformIds: [1, 2, 3],
            discordUrl: 'https://discord.gg/league',
            websiteUrl: 'https://league.example.com',
            twitterHandle: '@f1league',
            instagramHandle: '@f1league',
            youtubeUrl: 'https://youtube.com/@f1league',
            twitchUrl: 'https://twitch.tv/f1league',
            visibility: LeagueVisibility::PRIVATE,
            status: 'active'
        );

        $this->assertEquals(1, $league->id());
        $this->assertEquals('F1 Racing League', $league->name()->value());
        $this->assertEquals('f1-racing-league', $league->slug()->value());
        $this->assertEquals('leagues/logos/logo.png', $league->logoPath());
        $this->assertEquals('Europe/London', $league->timezone());
        $this->assertEquals(1, $league->ownerUserId());
        $this->assertEquals('contact@example.com', $league->contactEmail()->value());
        $this->assertEquals('John Doe', $league->organizerName());
        $this->assertEquals('The Premier F1 League', $league->tagline()->value());
        $this->assertEquals('A competitive F1 racing league', $league->description());
        $this->assertEquals('leagues/headers/header.png', $league->headerImagePath());
        $this->assertEquals([1, 2, 3], $league->platformIds());
        $this->assertEquals('https://discord.gg/league', $league->discordUrl());
        $this->assertEquals('https://league.example.com', $league->websiteUrl());
        $this->assertEquals('@f1league', $league->twitterHandle());
        $this->assertEquals('@f1league', $league->instagramHandle());
        $this->assertEquals('https://youtube.com/@f1league', $league->youtubeUrl());
        $this->assertEquals('https://twitch.tv/f1league', $league->twitchUrl());
        $this->assertEquals(LeagueVisibility::PRIVATE, $league->visibility());
        $this->assertEquals('active', $league->status());
    }

    #[Test]
    public function it_sets_id_on_newly_created_entity(): void
    {
        $league = League::create(
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->assertNull($league->id());

        $league->setId(42);

        $this->assertEquals(42, $league->id());
    }

    private function createLeague(): League
    {
        $league = League::create(
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $league->setId(1);

        return $league;
    }
}
