<?php

declare(strict_types=1);

namespace Tests\Integration\Persistence\Eloquent\Repositories;

use App\Domain\League\Entities\League;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueSlug;
use App\Domain\League\ValueObjects\LeagueVisibility;
use App\Domain\League\ValueObjects\Tagline;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Infrastructure\Persistence\Eloquent\Models\League as LeagueEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentLeagueRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EloquentLeagueRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentLeagueRepository $repository;
    private UserEloquent $user;
    private UserEloquent $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new EloquentLeagueRepository();
        $this->user = UserEloquent::factory()->create();
        $this->otherUser = UserEloquent::factory()->create();
    }

    /**
     * @test
     */
    public function it_saves_new_league(): void
    {
        $league = League::create(
            name: LeagueName::from('F1 Racing League'),
            slug: LeagueSlug::from('f1-racing-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'Europe/London',
            ownerUserId: $this->user->id,
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

        $this->assertNull($league->id());

        $this->repository->save($league);

        $this->assertNotNull($league->id());
        $this->assertDatabaseHas('leagues', [
            'id' => $league->id(),
            'name' => 'F1 Racing League',
            'slug' => 'f1-racing-league',
            'tagline' => 'The Premier F1 League',
            'description' => 'A competitive F1 racing league',
            'logo_path' => 'leagues/logos/logo.png',
            'header_image_path' => 'leagues/headers/header.png',
            'timezone' => 'Europe/London',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@example.com',
            'organizer_name' => 'John Doe',
            'discord_url' => 'https://discord.gg/league',
            'website_url' => 'https://league.example.com',
            'twitter_handle' => '@f1league',
            'instagram_handle' => '@f1league',
            'youtube_url' => 'https://youtube.com/@f1league',
            'twitch_url' => 'https://twitch.tv/f1league',
            'visibility' => 'private',
            'status' => 'active',
        ]);
    }

    /**
     * @test
     */
    public function it_saves_league_with_null_optional_fields(): void
    {
        $league = League::create(
            name: LeagueName::from('Minimal League'),
            slug: LeagueSlug::from('minimal-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'UTC',
            ownerUserId: $this->user->id,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'Jane Doe'
        );

        $this->repository->save($league);

        $this->assertDatabaseHas('leagues', [
            'id' => $league->id(),
            'name' => 'Minimal League',
            'tagline' => null,
            'description' => null,
            'header_image_path' => null,
            'discord_url' => null,
            'website_url' => null,
            'twitter_handle' => null,
            'instagram_handle' => null,
            'youtube_url' => null,
            'twitch_url' => null,
        ]);
    }

    /**
     * @test
     */
    public function it_updates_existing_league(): void
    {
        $league = League::create(
            name: LeagueName::from('Original Name'),
            slug: LeagueSlug::from('original-name'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'UTC',
            ownerUserId: $this->user->id,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->repository->save($league);
        $leagueId = $league->id();

        // Update the league
        $league->updateDetails(
            LeagueName::from('Updated Name'),
            Tagline::from('Updated tagline'),
            'Updated description'
        );

        $this->repository->save($league);

        $this->assertEquals($leagueId, $league->id());
        $this->assertDatabaseHas('leagues', [
            'id' => $leagueId,
            'name' => 'Updated Name',
            'slug' => 'original-name', // Slug doesn't change
            'tagline' => 'Updated tagline',
            'description' => 'Updated description',
        ]);
    }

    /**
     * @test
     */
    public function it_finds_league_by_id(): void
    {
        $eloquentLeague = LeagueEloquent::create([
            'name' => 'Test League',
            'slug' => 'test-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $league = $this->repository->findById($eloquentLeague->id);

        $this->assertInstanceOf(League::class, $league);
        $this->assertEquals($eloquentLeague->id, $league->id());
        $this->assertEquals('Test League', $league->name()->value());
        $this->assertEquals('test-league', $league->slug()->value());
    }

    /**
     * @test
     */
    public function it_throws_exception_when_league_not_found_by_id(): void
    {
        $this->expectException(LeagueNotFoundException::class);
        $this->expectExceptionMessage('League with ID 999 not found');

        $this->repository->findById(999);
    }

    /**
     * @test
     */
    public function it_returns_null_when_league_not_found_by_id_or_null(): void
    {
        $league = $this->repository->findByIdOrNull(999);

        $this->assertNull($league);
    }

    /**
     * @test
     */
    public function it_finds_league_by_slug(): void
    {
        $eloquentLeague = LeagueEloquent::create([
            'name' => 'Test League',
            'slug' => 'test-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $league = $this->repository->findBySlug('test-league');

        $this->assertInstanceOf(League::class, $league);
        $this->assertEquals($eloquentLeague->id, $league->id());
        $this->assertEquals('test-league', $league->slug()->value());
    }

    /**
     * @test
     */
    public function it_throws_exception_when_league_not_found_by_slug(): void
    {
        $this->expectException(LeagueNotFoundException::class);
        $this->expectExceptionMessage("League with slug 'non-existent' not found");

        $this->repository->findBySlug('non-existent');
    }

    /**
     * @test
     */
    public function it_returns_null_when_league_not_found_by_slug_or_null(): void
    {
        $league = $this->repository->findBySlugOrNull('non-existent');

        $this->assertNull($league);
    }

    /**
     * @test
     */
    public function it_checks_if_slug_is_available(): void
    {
        $this->assertTrue($this->repository->isSlugAvailable('new-league'));

        LeagueEloquent::create([
            'name' => 'Existing League',
            'slug' => 'existing-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $this->assertFalse($this->repository->isSlugAvailable('existing-league'));
    }

    /**
     * @test
     */
    public function it_checks_slug_availability_including_soft_deleted_leagues(): void
    {
        $eloquentLeague = LeagueEloquent::create([
            'name' => 'Deleted League',
            'slug' => 'deleted-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $eloquentLeague->delete();

        // Slug should still be unavailable even after soft delete
        $this->assertFalse($this->repository->isSlugAvailable('deleted-league'));
    }

    /**
     * @test
     */
    public function it_finds_leagues_by_user_id(): void
    {
        $leagueA = LeagueEloquent::create([
            'name' => 'User 1 League A',
            'slug' => 'user-1-league-a',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        // Force a second delay to ensure created_at is different
        sleep(1);

        $leagueB = LeagueEloquent::create([
            'name' => 'User 1 League B',
            'slug' => 'user-1-league-b',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        LeagueEloquent::create([
            'name' => 'User 2 League',
            'slug' => 'user-2-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->otherUser->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'Jane Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $leagues = $this->repository->findByUserId($this->user->id);

        $this->assertCount(2, $leagues);
        $this->assertContainsOnlyInstancesOf(League::class, $leagues);
        // Most recent first (B should be returned before A)
        $this->assertEquals('User 1 League B', $leagues[0]->name()->value());
        $this->assertEquals('User 1 League A', $leagues[1]->name()->value());
    }

    /**
     * @test
     */
    public function it_counts_leagues_by_user_id(): void
    {
        LeagueEloquent::create([
            'name' => 'User 1 League A',
            'slug' => 'user-1-league-a',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        LeagueEloquent::create([
            'name' => 'User 1 League B',
            'slug' => 'user-1-league-b',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        LeagueEloquent::create([
            'name' => 'User 2 League',
            'slug' => 'user-2-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->otherUser->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'Jane Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $count = $this->repository->countByUserId($this->user->id);

        $this->assertEquals(2, $count);
    }

    /**
     * @test
     */
    public function it_count_excludes_soft_deleted_leagues(): void
    {
        $league1 = LeagueEloquent::create([
            'name' => 'Active League',
            'slug' => 'active-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $league2 = LeagueEloquent::create([
            'name' => 'Deleted League',
            'slug' => 'deleted-league',
            'logo_path' => 'leagues/logos/logo.png',
            'timezone' => 'UTC',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'contact@test.com',
            'organizer_name' => 'John Doe',
            'visibility' => 'public',
            'status' => 'active',
        ]);

        $league2->delete();

        $count = $this->repository->countByUserId($this->user->id);

        $this->assertEquals(1, $count);
    }

    /**
     * @test
     */
    public function it_soft_deletes_league(): void
    {
        $league = League::create(
            name: LeagueName::from('Test League'),
            slug: LeagueSlug::from('test-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'UTC',
            ownerUserId: $this->user->id,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->repository->save($league);
        $leagueId = $league->id();

        $this->repository->delete($league);

        $this->assertSoftDeleted('leagues', ['id' => $leagueId]);

        // Can still find with withTrashed
        $foundLeague = $this->repository->findById($leagueId);
        $this->assertInstanceOf(League::class, $foundLeague);
    }

    /**
     * @test
     */
    public function it_restores_soft_deleted_league(): void
    {
        $league = League::create(
            name: LeagueName::from('Test League'),
            slug: LeagueSlug::from('test-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'UTC',
            ownerUserId: $this->user->id,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->repository->save($league);
        $leagueId = $league->id();

        $this->repository->delete($league);
        $this->assertSoftDeleted('leagues', ['id' => $leagueId]);

        $this->repository->restore($league);
        $this->assertDatabaseHas('leagues', ['id' => $leagueId, 'deleted_at' => null]);
    }

    /**
     * @test
     */
    public function it_force_deletes_league(): void
    {
        $league = League::create(
            name: LeagueName::from('Test League'),
            slug: LeagueSlug::from('test-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'UTC',
            ownerUserId: $this->user->id,
            contactEmail: EmailAddress::from('contact@example.com'),
            organizerName: 'John Doe'
        );

        $this->repository->save($league);
        $leagueId = $league->id();

        $this->repository->forceDelete($league);

        $this->assertDatabaseMissing('leagues', ['id' => $leagueId]);
    }

    /**
     * @test
     */
    public function it_maps_entity_to_eloquent_model_correctly(): void
    {
        $league = League::create(
            name: LeagueName::from('Complete League'),
            slug: LeagueSlug::from('complete-league'),
            logoPath: 'leagues/logos/logo.png',
            timezone: 'America/New_York',
            ownerUserId: $this->user->id,
            contactEmail: EmailAddress::from('admin@league.com'),
            organizerName: 'League Organizer',
            tagline: Tagline::from('Best League Ever'),
            description: 'This is a complete league with all fields',
            headerImagePath: 'leagues/headers/header.jpg',
            platformIds: [1, 2, 3],
            discordUrl: 'https://discord.gg/complete',
            websiteUrl: 'https://complete.example.com',
            twitterHandle: '@complete',
            instagramHandle: '@complete_ig',
            youtubeUrl: 'https://youtube.com/@complete',
            twitchUrl: 'https://twitch.tv/complete',
            visibility: LeagueVisibility::UNLISTED
        );

        $this->repository->save($league);

        $eloquentLeague = LeagueEloquent::find($league->id());

        $this->assertEquals('Complete League', $eloquentLeague->name);
        $this->assertEquals('complete-league', $eloquentLeague->slug);
        $this->assertEquals('Best League Ever', $eloquentLeague->tagline);
        $this->assertEquals('This is a complete league with all fields', $eloquentLeague->description);
        $this->assertEquals('leagues/logos/logo.png', $eloquentLeague->logo_path);
        $this->assertEquals('leagues/headers/header.jpg', $eloquentLeague->header_image_path);
        $this->assertEquals('America/New_York', $eloquentLeague->timezone);
        $this->assertEquals($this->user->id, $eloquentLeague->owner_user_id);
        $this->assertEquals('admin@league.com', $eloquentLeague->contact_email);
        $this->assertEquals('League Organizer', $eloquentLeague->organizer_name);
        $this->assertEquals([1, 2, 3], $eloquentLeague->platform_ids);
        $this->assertEquals('https://discord.gg/complete', $eloquentLeague->discord_url);
        $this->assertEquals('https://complete.example.com', $eloquentLeague->website_url);
        $this->assertEquals('@complete', $eloquentLeague->twitter_handle);
        $this->assertEquals('@complete_ig', $eloquentLeague->instagram_handle);
        $this->assertEquals('https://youtube.com/@complete', $eloquentLeague->youtube_url);
        $this->assertEquals('https://twitch.tv/complete', $eloquentLeague->twitch_url);
        $this->assertEquals('unlisted', $eloquentLeague->visibility);
        $this->assertEquals('active', $eloquentLeague->status);
    }

    /**
     * @test
     */
    public function it_maps_eloquent_model_to_entity_correctly(): void
    {
        $eloquentLeague = LeagueEloquent::create([
            'name' => 'Complete League',
            'slug' => 'complete-league',
            'tagline' => 'Best League Ever',
            'description' => 'This is a complete league with all fields',
            'logo_path' => 'leagues/logos/logo.png',
            'header_image_path' => 'leagues/headers/header.jpg',
            'timezone' => 'America/New_York',
            'owner_user_id' => $this->user->id,
            'contact_email' => 'admin@league.com',
            'organizer_name' => 'League Organizer',
            'platform_ids' => [1, 2, 3],
            'discord_url' => 'https://discord.gg/complete',
            'website_url' => 'https://complete.example.com',
            'twitter_handle' => '@complete',
            'instagram_handle' => '@complete_ig',
            'youtube_url' => 'https://youtube.com/@complete',
            'twitch_url' => 'https://twitch.tv/complete',
            'visibility' => 'unlisted',
            'status' => 'active',
        ]);

        $league = $this->repository->findById($eloquentLeague->id);

        $this->assertEquals($eloquentLeague->id, $league->id());
        $this->assertEquals('Complete League', $league->name()->value());
        $this->assertEquals('complete-league', $league->slug()->value());
        $this->assertEquals('Best League Ever', $league->tagline()->value());
        $this->assertEquals('This is a complete league with all fields', $league->description());
        $this->assertEquals('leagues/logos/logo.png', $league->logoPath());
        $this->assertEquals('leagues/headers/header.jpg', $league->headerImagePath());
        $this->assertEquals('America/New_York', $league->timezone());
        $this->assertEquals($this->user->id, $league->ownerUserId());
        $this->assertEquals('admin@league.com', $league->contactEmail()->value());
        $this->assertEquals('League Organizer', $league->organizerName());
        $this->assertEquals([1, 2, 3], $league->platformIds());
        $this->assertEquals('https://discord.gg/complete', $league->discordUrl());
        $this->assertEquals('https://complete.example.com', $league->websiteUrl());
        $this->assertEquals('@complete', $league->twitterHandle());
        $this->assertEquals('@complete_ig', $league->instagramHandle());
        $this->assertEquals('https://youtube.com/@complete', $league->youtubeUrl());
        $this->assertEquals('https://twitch.tv/complete', $league->twitchUrl());
        $this->assertEquals(LeagueVisibility::UNLISTED, $league->visibility());
        $this->assertEquals('active', $league->status());
    }
}
