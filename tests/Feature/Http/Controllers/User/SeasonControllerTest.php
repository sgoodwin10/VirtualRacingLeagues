<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SeasonControllerTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private User $user;
    private User $otherUser;
    private League $league;
    private Platform $platform;
    private Competition $competition;

    protected function setUp(): void
    {
        parent::setUp();

        // Create platform
        $this->platform = Platform::create([
            'name' => 'iRacing',
            'slug' => 'iracing',
        ]);

        // Create users
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();

        // Create league owned by user
        $this->league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$this->platform->id],
        ]);

        // Create competition
        $this->competition = Competition::create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'name' => 'GT3 Championship',
            'slug' => 'gt3-championship',
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
            'competition_colour' => '{"r":100,"g":102,"b":241}',
        ]);
    }

    // ==================== Archive/Unarchive Tests ====================

    public function test_user_can_archive_season(): void
    {
        $this->actingAs($this->user, 'web');

        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->postJson("/api/seasons/{$season->id}/archive");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'status',
                'is_archived',
            ],
        ]);

        $this->assertDatabaseHas('seasons', [
            'id' => $season->id,
            'status' => 'archived',
        ]);

        $season->refresh();
        $this->assertEquals('archived', $season->status);
    }

    public function test_user_can_unarchive_season(): void
    {
        $this->actingAs($this->user, 'web');

        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'archived',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->postJson("/api/seasons/{$season->id}/unarchive");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'status',
                'is_archived',
            ],
        ]);

        // After unarchive, season should be restored to 'completed' status
        $this->assertDatabaseHas('seasons', [
            'id' => $season->id,
            'status' => 'completed',
        ]);

        $season->refresh();
        $this->assertEquals('completed', $season->status);
        $this->assertFalse($season->status === 'archived');
    }

    public function test_guest_cannot_archive_season(): void
    {
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->postJson("/api/seasons/{$season->id}/archive");

        $response->assertStatus(401);
    }

    public function test_guest_cannot_unarchive_season(): void
    {
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'archived',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->postJson("/api/seasons/{$season->id}/unarchive");

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_archive_season(): void
    {
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
        ]);

        $this->actingAs($this->otherUser, 'web');

        $response = $this->postJson("/api/seasons/{$season->id}/archive");

        $response->assertStatus(403);
    }

    public function test_non_owner_cannot_unarchive_season(): void
    {
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'archived',
            'created_by_user_id' => $this->user->id,
        ]);

        $this->actingAs($this->otherUser, 'web');

        $response = $this->postJson("/api/seasons/{$season->id}/unarchive");

        $response->assertStatus(403);
    }

    public function test_unarchiving_non_archived_season_has_no_effect(): void
    {
        $this->actingAs($this->user, 'web');

        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->postJson("/api/seasons/{$season->id}/unarchive");

        $response->assertStatus(200);

        // Season should remain active since it wasn't archived
        $season->refresh();
        $this->assertEquals('active', $season->status);
    }

    public function test_unarchive_updates_timestamp_in_database(): void
    {
        $this->actingAs($this->user, 'web');

        // Create an archived season
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'archived',
            'created_by_user_id' => $this->user->id,
        ]);

        // Manually set the updated_at to a timestamp in the past
        // This simulates the season being updated previously
        $pastTimestamp = now()->subHour()->format('Y-m-d H:i:s');
        \DB::table('seasons')
            ->where('id', $season->id)
            ->update(['updated_at' => $pastTimestamp]);

        // Refresh to get the updated timestamp from database
        $season->refresh();
        $originalUpdatedAt = $season->updated_at;

        // Verify the past timestamp was set correctly
        $this->assertLessThan(
            now(),
            $originalUpdatedAt,
            'Original timestamp should be in the past'
        );

        // Unarchive the season
        $response = $this->postJson("/api/seasons/{$season->id}/unarchive");

        $response->assertStatus(200);

        // Refresh from database
        $season->refresh();

        // Verify status changed
        $this->assertEquals('completed', $season->status);

        // Verify updated_at was actually changed in the database
        // Simply check that the timestamp is different and the absolute difference is at least 1 second
        $this->assertNotEquals(
            $originalUpdatedAt->format('Y-m-d H:i:s'),
            $season->updated_at->format('Y-m-d H:i:s'),
            'updated_at timestamp should be different after unarchiving'
        );

        // The timestamps should be different by at least 1 second in absolute terms
        $diff = abs($season->updated_at->diffInSeconds($originalUpdatedAt, false));
        $this->assertGreaterThan(
            0,
            $diff,
            'updated_at should have changed (difference should be > 0 seconds)'
        );
    }

    // ==================== Update Tests ====================

    public function test_user_can_update_season(): void
    {
        $this->actingAs($this->user, 'web');

        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->putJson("/api/seasons/{$season->id}", [
            'name' => 'Season 1 Updated',
            'car_class' => 'GT3',
            'description' => 'Updated description',
            'technical_specs' => 'Updated specs',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'car_class',
                'description',
                'technical_specs',
            ],
        ]);

        $this->assertDatabaseHas('seasons', [
            'id' => $season->id,
            'name' => 'Season 1 Updated',
            'car_class' => 'GT3',
            'description' => 'Updated description',
            'technical_specs' => 'Updated specs',
        ]);
    }

    public function test_guest_cannot_update_season(): void
    {
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->putJson("/api/seasons/{$season->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_update_season(): void
    {
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
        ]);

        $this->actingAs($this->otherUser, 'web');

        $response = $this->putJson("/api/seasons/{$season->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_can_update_teams_drivers_for_calculation_to_null(): void
    {
        $this->actingAs($this->user, 'web');

        // Create season with teams_drivers_for_calculation set to 2
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
            'team_championship_enabled' => true,
            'teams_drivers_for_calculation' => 2,
        ]);

        $this->assertDatabaseHas('seasons', [
            'id' => $season->id,
            'teams_drivers_for_calculation' => 2,
        ]);

        // Update to null (meaning "All")
        $response = $this->putJson("/api/seasons/{$season->id}", [
            'name' => 'Season 1',
            'team_championship_enabled' => true,
            'teams_drivers_for_calculation' => null,
        ]);

        $response->assertStatus(200);

        // Verify database was updated to NULL
        $this->assertDatabaseHas('seasons', [
            'id' => $season->id,
            'teams_drivers_for_calculation' => null,
        ]);

        // Verify response contains null value
        $response->assertJson([
            'success' => true,
            'data' => [
                'teams_drivers_for_calculation' => null,
            ],
        ]);
    }

    public function test_user_can_update_teams_drivers_for_calculation_from_null_to_integer(): void
    {
        $this->actingAs($this->user, 'web');

        // Create season with teams_drivers_for_calculation set to null
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
            'team_championship_enabled' => true,
            'teams_drivers_for_calculation' => null,
        ]);

        $this->assertDatabaseHas('seasons', [
            'id' => $season->id,
            'teams_drivers_for_calculation' => null,
        ]);

        // Update to 3
        $response = $this->putJson("/api/seasons/{$season->id}", [
            'name' => 'Season 1',
            'team_championship_enabled' => true,
            'teams_drivers_for_calculation' => 3,
        ]);

        $response->assertStatus(200);

        // Verify database was updated to 3
        $this->assertDatabaseHas('seasons', [
            'id' => $season->id,
            'teams_drivers_for_calculation' => 3,
        ]);

        // Verify response contains integer value
        $response->assertJson([
            'success' => true,
            'data' => [
                'teams_drivers_for_calculation' => 3,
            ],
        ]);
    }

    public function test_updating_season_without_teams_drivers_for_calculation_does_not_change_existing_value(): void
    {
        $this->actingAs($this->user, 'web');

        // Create season with teams_drivers_for_calculation set to 2
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
            'team_championship_enabled' => true,
            'teams_drivers_for_calculation' => 2,
        ]);

        // Update other fields WITHOUT including teams_drivers_for_calculation
        $response = $this->putJson("/api/seasons/{$season->id}", [
            'name' => 'Season 1 Updated',
            'description' => 'New description',
        ]);

        $response->assertStatus(200);

        // Verify teams_drivers_for_calculation remains unchanged
        $this->assertDatabaseHas('seasons', [
            'id' => $season->id,
            'teams_drivers_for_calculation' => 2,
            'name' => 'Season 1 Updated',
        ]);
    }

    // ==================== Delete Tests ====================

    public function test_user_can_delete_season(): void
    {
        $this->actingAs($this->user, 'web');

        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->deleteJson("/api/seasons/{$season->id}");

        $response->assertStatus(200);

        // Verify permanent delete (hard delete via forceDelete)
        $this->assertEquals(0, SeasonEloquent::where('id', $season->id)->count());
        $this->assertDatabaseMissing('seasons', ['id' => $season->id]);
    }

    public function test_guest_cannot_delete_season(): void
    {
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->deleteJson("/api/seasons/{$season->id}");

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_delete_season(): void
    {
        $season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'setup',
            'created_by_user_id' => $this->user->id,
        ]);

        $this->actingAs($this->otherUser, 'web');

        $response = $this->deleteJson("/api/seasons/{$season->id}");

        $response->assertStatus(403);
    }
}
