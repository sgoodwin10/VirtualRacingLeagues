<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\League;

use App\Domain\League\Entities\League;
use App\Domain\League\Events\LeagueUpdated;
use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueSlug;
use App\Domain\League\ValueObjects\LeagueVisibility;
use App\Domain\League\ValueObjects\Tagline;
use App\Domain\Shared\ValueObjects\EmailAddress;
use PHPUnit\Framework\TestCase;

/**
 * @covers \App\Domain\League\Entities\League::updateDetails
 * @covers \App\Domain\League\Entities\League::changeVisibility
 * @covers \App\Domain\League\Entities\League::updateContactInfo
 * @covers \App\Domain\League\Entities\League::updateSocialMedia
 * @covers \App\Domain\League\Entities\League::updatePlatforms
 * @covers \App\Domain\League\Entities\League::updateTimezone
 * @covers \App\Domain\League\Entities\League::updateLogo
 * @covers \App\Domain\League\Entities\League::updateHeaderImage
 */
class LeagueUpdateTest extends TestCase
{
    private League $league;

    protected function setUp(): void
    {
        parent::setUp();

        $this->league = League::create(
            name: LeagueName::from('Test League'),
            slug: LeagueSlug::from('test-league'),
            logoPath: 'leagues/logos/test.png',
            timezone: 'UTC',
            ownerUserId: 1,
            contactEmail: EmailAddress::from('test@example.com'),
            organizerName: 'Test Organizer',
            tagline: Tagline::from('Test Tagline'),
            description: 'Test Description',
            headerImagePath: 'leagues/headers/test.png',
            platformIds: [1, 2],
            discordUrl: 'https://discord.gg/test',
            websiteUrl: 'https://test.com',
            twitterHandle: 'test',
            instagramHandle: 'test',
            youtubeUrl: 'https://youtube.com/test',
            twitchUrl: 'https://twitch.tv/test',
            visibility: LeagueVisibility::public(),
        );

        // Clear initial events
        $this->league->releaseEvents();
    }

    public function test_update_details_changes_name_tagline_and_description(): void
    {
        $newName = LeagueName::from('Updated League');
        $newTagline = Tagline::from('Updated Tagline');
        $newDescription = 'Updated Description';

        $this->league->updateDetails($newName, $newTagline, $newDescription);

        $this->assertEquals('Updated League', $this->league->name()->value());
        $this->assertEquals('Updated Tagline', $this->league->tagline()?->value());
        $this->assertEquals('Updated Description', $this->league->description());
    }

    public function test_update_details_records_league_updated_event(): void
    {
        $this->league->updateDetails(
            LeagueName::from('New Name'),
            Tagline::from('New Tagline'),
            'New Description'
        );

        $events = $this->league->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    public function test_change_visibility_updates_visibility(): void
    {
        $this->league->changeVisibility(LeagueVisibility::private());

        $this->assertEquals('private', $this->league->visibility()->value);
    }

    public function test_change_visibility_records_league_updated_event(): void
    {
        $this->league->changeVisibility(LeagueVisibility::unlisted());

        $events = $this->league->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    public function test_update_contact_info_changes_email_and_organizer(): void
    {
        $newEmail = EmailAddress::from('updated@example.com');
        $newOrganizer = 'Updated Organizer';

        $this->league->updateContactInfo($newEmail, $newOrganizer);

        $this->assertEquals('updated@example.com', $this->league->contactEmail()->value());
        $this->assertEquals('Updated Organizer', $this->league->organizerName());
    }

    public function test_update_contact_info_records_league_updated_event(): void
    {
        $this->league->updateContactInfo(
            EmailAddress::from('new@example.com'),
            'New Organizer'
        );

        $events = $this->league->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    public function test_update_social_media_changes_all_social_links(): void
    {
        $this->league->updateSocialMedia(
            discordUrl: 'https://discord.gg/updated',
            websiteUrl: 'https://updated.com',
            twitterHandle: 'updated',
            instagramHandle: 'updated',
            youtubeUrl: 'https://youtube.com/updated',
            twitchUrl: 'https://twitch.tv/updated'
        );

        $this->assertEquals('https://discord.gg/updated', $this->league->discordUrl());
        $this->assertEquals('https://updated.com', $this->league->websiteUrl());
        $this->assertEquals('updated', $this->league->twitterHandle());
        $this->assertEquals('updated', $this->league->instagramHandle());
        $this->assertEquals('https://youtube.com/updated', $this->league->youtubeUrl());
        $this->assertEquals('https://twitch.tv/updated', $this->league->twitchUrl());
    }

    public function test_update_social_media_can_set_null_values(): void
    {
        $this->league->updateSocialMedia(
            discordUrl: null,
            websiteUrl: null,
            twitterHandle: null,
            instagramHandle: null,
            youtubeUrl: null,
            twitchUrl: null
        );

        $this->assertNull($this->league->discordUrl());
        $this->assertNull($this->league->websiteUrl());
        $this->assertNull($this->league->twitterHandle());
        $this->assertNull($this->league->instagramHandle());
        $this->assertNull($this->league->youtubeUrl());
        $this->assertNull($this->league->twitchUrl());
    }

    public function test_update_social_media_records_league_updated_event(): void
    {
        $this->league->updateSocialMedia(
            discordUrl: 'https://discord.gg/new',
            websiteUrl: null,
            twitterHandle: null,
            instagramHandle: null,
            youtubeUrl: null,
            twitchUrl: null
        );

        $events = $this->league->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    public function test_update_platforms_changes_platform_ids(): void
    {
        $newPlatformIds = [3, 4, 5];

        $this->league->updatePlatforms($newPlatformIds);

        $this->assertEquals([3, 4, 5], $this->league->platformIds());
    }

    public function test_update_platforms_records_league_updated_event(): void
    {
        $this->league->updatePlatforms([10]);

        $events = $this->league->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    public function test_update_timezone_changes_timezone(): void
    {
        $this->league->updateTimezone('America/New_York');

        $this->assertEquals('America/New_York', $this->league->timezone());
    }

    public function test_update_timezone_records_league_updated_event(): void
    {
        $this->league->updateTimezone('Europe/London');

        $events = $this->league->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    public function test_update_logo_changes_logo_path(): void
    {
        $this->league->updateLogo('leagues/logos/new-logo.png');

        $this->assertEquals('leagues/logos/new-logo.png', $this->league->logoPath());
    }

    public function test_update_logo_records_league_updated_event(): void
    {
        $this->league->updateLogo('leagues/logos/updated.png');

        $events = $this->league->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    public function test_update_header_image_changes_header_path(): void
    {
        $this->league->updateHeaderImage('leagues/headers/new-header.png');

        $this->assertEquals('leagues/headers/new-header.png', $this->league->headerImagePath());
    }

    public function test_update_header_image_can_set_null(): void
    {
        $this->league->updateHeaderImage(null);

        $this->assertNull($this->league->headerImagePath());
    }

    public function test_update_header_image_records_league_updated_event(): void
    {
        $this->league->updateHeaderImage('leagues/headers/updated.png');

        $events = $this->league->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(LeagueUpdated::class, $events[0]);
    }

    public function test_multiple_updates_record_multiple_events(): void
    {
        $this->league->updateDetails(
            LeagueName::from('New Name'),
            null,
            null
        );

        $this->league->changeVisibility(LeagueVisibility::private());

        $this->league->updateTimezone('Europe/Paris');

        $events = $this->league->releaseEvents();
        $this->assertCount(3, $events);
        $this->assertContainsOnlyInstancesOf(LeagueUpdated::class, $events);
    }

    public function test_release_events_clears_events(): void
    {
        $this->league->updateDetails(
            LeagueName::from('Name'),
            null,
            null
        );

        $this->assertCount(1, $this->league->releaseEvents());
        $this->assertCount(0, $this->league->releaseEvents());
    }
}
