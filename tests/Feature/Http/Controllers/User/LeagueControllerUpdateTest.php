<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Domain\League\Events\LeagueUpdated;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\CoversMethod;

#[CoversMethod(\App\Http\Controllers\User\LeagueController::class, 'update')]
class LeagueControllerUpdateTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private UserEloquent $user;

    private UserEloquent $otherUser;

    private League $league;

    private Platform $platform;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Event::fake();

        // Create users
        $this->user = UserEloquent::factory()->create();
        $this->otherUser = UserEloquent::factory()->create();

        // Create platform
        $this->platform = Platform::create([
            'name' => 'iRacing',
            'slug' => 'iracing',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Create a league owned by the user
        $this->league = League::create([
            'owner_user_id' => $this->user->id,
            'name' => 'Original League Name',
            'slug' => 'original-league-name',
            'tagline' => 'Original Tagline',
            'description' => 'Original Description',
            'logo_path' => 'leagues/logos/original.png',
            'header_image_path' => 'leagues/headers/original.png',
            'timezone' => 'UTC',
            'visibility' => 'public',
            'contact_email' => 'original@example.com',
            'organizer_name' => 'Original Organizer',
            'discord_url' => 'https://discord.gg/original',
            'website_url' => 'https://original.com',
            'twitter_handle' => 'original',
            'instagram_handle' => 'original',
            'youtube_url' => 'https://youtube.com/original',
            'twitch_url' => 'https://twitch.tv/original',
            'status' => 'active',
            'platform_ids' => [$this->platform->id],
        ]);
    }

    public function test_owner_can_update_their_league(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->from('http://app.virtualracingleagues.localhost')
            ->putJson("/api/leagues/{$this->league->id}", [
                'name' => 'Updated League Name',
                'tagline' => 'Updated Tagline',
                'description' => 'Updated Description',
            ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'League updated successfully',
        ]);

        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'name' => 'Updated League Name',
            'tagline' => 'Updated Tagline',
            'description' => 'Updated Description',
        ]);

        Event::assertDispatched(LeagueUpdated::class);
    }

    public function test_non_owner_cannot_update_league(): void
    {
        $response = $this->actingAs($this->otherUser, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'name' => 'Hacked Name',
            ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'name' => 'Original League Name',
        ]);
    }

    public function test_unauthenticated_user_cannot_update_league(): void
    {
        $response = $this->putJson("/api/leagues/{$this->league->id}", [
            'name' => 'Hacked Name',
        ]);

        $response->assertUnauthorized();
    }

    public function test_partial_update_only_updates_provided_fields(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'name' => 'Only Name Updated',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'name' => 'Only Name Updated',
            'tagline' => 'Original Tagline',
            'description' => 'Original Description',
            'contact_email' => 'original@example.com',
        ]);
    }

    public function test_can_update_logo(): void
    {
        if (! function_exists('imagejpeg')) {
            $this->markTestSkipped('GD extension not available');
        }

        $newLogo = UploadedFile::fake()->image('new-logo.png', 500, 500);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'logo' => $newLogo,
            ]);

        $response->assertOk();

        $league = League::find($this->league->id);
        $this->assertNotNull($league);
        $this->assertNotEquals('leagues/logos/original.png', $league->logo_path);
        Storage::disk('public')->assertExists($league->logo_path);
    }

    public function test_can_update_header_image(): void
    {
        if (! function_exists('imagejpeg')) {
            $this->markTestSkipped('GD extension not available');
        }

        $newHeader = UploadedFile::fake()->image('new-header.jpg', 1920, 1080);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'header_image' => $newHeader,
            ]);

        $response->assertOk();

        $league = League::find($this->league->id);
        $this->assertNotNull($league);
        $this->assertNotEquals('leagues/headers/original.png', $league->header_image_path);
        Storage::disk('public')->assertExists($league->header_image_path);
    }

    public function test_can_update_platforms(): void
    {
        $newPlatform = Platform::create([
            'name' => 'Assetto Corsa Competizione',
            'slug' => 'acc',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'platform_ids' => [$newPlatform->id],
            ]);

        $response->assertOk();

        $league = League::find($this->league->id);
        $this->assertNotNull($league);
        $this->assertEquals([$newPlatform->id], $league->platform_ids);
    }

    public function test_can_update_visibility(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'visibility' => 'private',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'visibility' => 'private',
        ]);
    }

    public function test_can_update_timezone(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'timezone' => 'America/New_York',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'timezone' => 'America/New_York',
        ]);
    }

    public function test_can_update_contact_information(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'contact_email' => 'updated@example.com',
                'organizer_name' => 'Updated Organizer',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'contact_email' => 'updated@example.com',
            'organizer_name' => 'Updated Organizer',
        ]);
    }

    public function test_can_update_social_media_links(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'discord_url' => 'https://discord.gg/updated',
                'website_url' => 'https://updated.com',
                'twitter_handle' => 'updated',
                'instagram_handle' => 'updated',
                'youtube_url' => 'https://youtube.com/updated',
                'twitch_url' => 'https://twitch.tv/updated',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'discord_url' => 'https://discord.gg/updated',
            'website_url' => 'https://updated.com',
            'twitter_handle' => 'updated',
            'instagram_handle' => 'updated',
            'youtube_url' => 'https://youtube.com/updated',
            'twitch_url' => 'https://twitch.tv/updated',
        ]);
    }

    public function test_can_clear_social_media_links_with_empty_strings(): void
    {
        // First, verify the league has social media values set
        $this->assertNotNull($this->league->discord_url);
        $this->assertNotNull($this->league->twitter_handle);

        // Send empty strings to clear the fields
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'discord_url' => '',
                'website_url' => '',
                'twitter_handle' => '',
                'instagram_handle' => '',
                'youtube_url' => '',
                'twitch_url' => '',
            ]);

        $response->assertOk();

        // Verify the fields are now null in the database
        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'discord_url' => null,
            'website_url' => null,
            'twitter_handle' => null,
            'instagram_handle' => null,
            'youtube_url' => null,
            'twitch_url' => null,
        ]);
    }

    public function test_can_clear_individual_social_media_link_while_keeping_others(): void
    {
        // Send empty string for only one field, leave others untouched
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'discord_url' => '', // Clear this one
                // Don't send other fields - they should remain unchanged
            ]);

        $response->assertOk();

        // Verify discord_url is now null but others remain unchanged
        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'discord_url' => null,
            'website_url' => 'https://original.com', // Unchanged
            'twitter_handle' => 'original', // Unchanged
            'instagram_handle' => 'original', // Unchanged
            'youtube_url' => 'https://youtube.com/original', // Unchanged
            'twitch_url' => 'https://twitch.tv/original', // Unchanged
        ]);
    }

    public function test_validation_fails_for_invalid_name(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'name' => 'ab', // Too short (min: 3)
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_validation_fails_for_invalid_email(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'contact_email' => 'not-an-email',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['contact_email']);
    }

    public function test_validation_fails_for_invalid_platform_ids(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'platform_ids' => [9999], // Non-existent platform
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['platform_ids.0']);
    }

    public function test_validation_fails_for_invalid_visibility(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'visibility' => 'invalid',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['visibility']);
    }

    public function test_validation_fails_for_invalid_timezone(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'timezone' => 'Invalid/Timezone',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['timezone']);
    }

    public function test_validation_fails_for_logo_too_large(): void
    {
        $largeLogo = UploadedFile::fake()->create('logo.png', 6000); // 6MB (max: 5MB)

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'logo' => $largeLogo,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['logo']);
    }

    public function test_validation_fails_for_header_image_too_large(): void
    {
        $largeHeader = UploadedFile::fake()->create('header.png', 11000); // 11MB (max: 10MB)

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'header_image' => $largeHeader,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['header_image']);
    }

    public function test_league_updated_event_dispatched_on_update(): void
    {
        $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'name' => 'Updated Name',
            ]);

        Event::assertDispatched(LeagueUpdated::class, function ($event) {
            return $event->league->id() === $this->league->id;
        });
    }

    public function test_returns_404_for_non_existent_league(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->putJson('/api/leagues/9999', [
                'name' => 'Updated Name',
            ]);

        $response->assertNotFound();
    }

    public function test_can_update_all_fields_at_once(): void
    {
        if (! function_exists('imagejpeg')) {
            $this->markTestSkipped('GD extension not available');
        }

        $newPlatform = Platform::create([
            'name' => 'RaceRoom',
            'slug' => 'raceroom',
            'is_active' => true,
            'sort_order' => 3,
        ]);
        $newLogo = UploadedFile::fake()->image('new-logo.png', 500, 500);
        $newHeader = UploadedFile::fake()->image('new-header.jpg', 1920, 1080);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/leagues/{$this->league->id}", [
                'name' => 'Fully Updated League',
                'tagline' => 'Fully Updated Tagline',
                'description' => 'Fully Updated Description',
                'logo' => $newLogo,
                'header_image' => $newHeader,
                'platform_ids' => [$newPlatform->id],
                'timezone' => 'Europe/London',
                'visibility' => 'unlisted',
                'contact_email' => 'fullyupdated@example.com',
                'organizer_name' => 'Fully Updated Organizer',
                'discord_url' => 'https://discord.gg/fullyupdated',
                'website_url' => 'https://fullyupdated.com',
                'twitter_handle' => 'fullyupdated',
                'instagram_handle' => 'fullyupdated',
                'youtube_url' => 'https://youtube.com/fullyupdated',
                'twitch_url' => 'https://twitch.tv/fullyupdated',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('leagues', [
            'id' => $this->league->id,
            'name' => 'Fully Updated League',
            'tagline' => 'Fully Updated Tagline',
            'description' => 'Fully Updated Description',
            'timezone' => 'Europe/London',
            'visibility' => 'unlisted',
            'contact_email' => 'fullyupdated@example.com',
            'organizer_name' => 'Fully Updated Organizer',
            'discord_url' => 'https://discord.gg/fullyupdated',
            'website_url' => 'https://fullyupdated.com',
            'twitter_handle' => 'fullyupdated',
            'instagram_handle' => 'fullyupdated',
            'youtube_url' => 'https://youtube.com/fullyupdated',
            'twitch_url' => 'https://twitch.tv/fullyupdated',
        ]);

        $league = League::find($this->league->id);
        $this->assertNotNull($league);
        Storage::disk('public')->assertExists($league->logo_path);
        Storage::disk('public')->assertExists($league->header_image_path);
    }
}
