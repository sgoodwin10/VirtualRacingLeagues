<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class QualifierControllerTest extends TestCase
{
    use RefreshDatabase;

    private const APP_URL = 'http://app.virtualracingleagues.localhost';

    private User $user;
    private Round $round;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        // Create proper ownership chain: User -> League -> Competition -> Season -> Round
        $league = \App\Infrastructure\Persistence\Eloquent\Models\League::factory()->create([
            'owner_user_id' => $this->user->id,
        ]);
        $competition = \App\Infrastructure\Persistence\Eloquent\Models\Competition::factory()->create([
            'league_id' => $league->id,
            'created_by_user_id' => $this->user->id,
        ]);
        $season = \App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent::factory()->create([
            'competition_id' => $competition->id,
            'created_by_user_id' => $this->user->id,
        ]);
        $this->round = \Database\Factories\RoundFactory::new()->create([
            'season_id' => $season->id,
            'created_by_user_id' => $this->user->id,
        ]);
    }

    public function test_creates_qualifier(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying Session',
                'qualifying_format' => 'standard',
                'qualifying_length' => 20,
                'qualifying_tire' => 'soft',
                'weather' => 'clear',
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'race_notes' => null,
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'round_id',
                'name',
                'qualifying_format',
                'qualifying_length',
                'qualifying_pole',
                'qualifying_pole_top_10',
            ],
        ]);

        $this->assertDatabaseHas('races', [
            'round_id' => $this->round->id,
            'is_qualifier' => true,
            'race_number' => null,
            'name' => 'Qualifying Session',
        ]);
    }

    public function test_prevents_duplicate_qualifiers(): void
    {
        // Create first qualifier
        $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying 1',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_notes' => null,
            ]);

        // Attempt to create second qualifier
        $response = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying 2',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_notes' => null,
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'message' => "A qualifier already exists for round {$this->round->id}. " .
                "Only one qualifier is allowed per round.",
        ]);
    }


    public function test_retrieves_qualifier_by_round(): void
    {
        // Create qualifier
        $createResponse = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Test Qualifying',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_notes' => null,
            ]);

        // Retrieve qualifier
        $response = $this->actingAs($this->user)
            ->getJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier");

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'round_id' => $this->round->id,
                'name' => 'Test Qualifying',
            ],
        ]);
    }

    public function test_returns_null_when_no_qualifier_exists(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier");

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
    }

    public function test_updates_qualifier(): void
    {
        // Create qualifier
        $createResponse = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Original',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_notes' => null,
            ]);

        $qualifierId = $createResponse->json('data.id');

        // Update qualifier
        $response = $this->actingAs($this->user)
            ->putJson(self::APP_URL . "/api/qualifiers/{$qualifierId}", [
                'name' => 'Updated',
                'qualifying_length' => 20,
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'name' => 'Updated',
                'qualifying_length' => 20,
            ],
        ]);
    }

    public function test_deletes_qualifier(): void
    {
        // Create qualifier
        $createResponse = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'To Delete',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_notes' => null,
            ]);

        $qualifierId = $createResponse->json('data.id');

        // Delete qualifier
        $response = $this->actingAs($this->user)
            ->deleteJson(self::APP_URL . "/api/qualifiers/{$qualifierId}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('races', ['id' => $qualifierId]);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
            'name' => 'Test',
            'qualifying_format' => 'standard',
            'qualifying_length' => 15,
            'qualifying_tire' => null,
            'weather' => null,
            'tire_restrictions' => null,
            'fuel_usage' => null,
            'damage_model' => null,
            'track_limits_enforced' => true,
            'false_start_detection' => true,
            'collision_penalties' => true,
            'assists_restrictions' => null,
            'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
            'race_notes' => null,
        ]);

        $response->assertStatus(401);
    }

    public function test_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                // Missing required fields
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors([
            'qualifying_format',
            'qualifying_length',
            'track_limits_enforced',
            'false_start_detection',
            'collision_penalties',
        ]);
    }

    public function test_calculates_pole_position_points_when_completed(): void
    {
        // Create qualifier with pole position bonus
        $createResponse = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'qualifying_pole' => 3,
                'qualifying_pole_top_10' => false,
                'race_notes' => null,
            ]);

        $qualifierId = $createResponse->json('data.id');

        // Get the season and league from the round
        $seasonId = $this->round->season_id;
        $season = \App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent::find($seasonId);
        $competition = \App\Infrastructure\Persistence\Eloquent\Models\Competition::find($season->competition_id);
        $leagueId = $competition->league_id;

        // Create season drivers
        $seasonDrivers = [];
        for ($i = 0; $i < 5; $i++) {
            $driver = \App\Infrastructure\Persistence\Eloquent\Models\Driver::factory()->create();
            $leagueDriver = \App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent::create([
                'league_id' => $leagueId,
                'driver_id' => $driver->id,
                'status' => 'active',
            ]);
            $seasonDrivers[$i] = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::create([
                'season_id' => $seasonId,
                'league_driver_id' => $leagueDriver->id,
                'status' => 'active',
            ]);
        }

        // Driver 1: Fastest lap - should get pole
        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[0]->id,
            'fastest_lap' => '01:23:45.123',
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Driver 2: Second fastest
        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[1]->id,
            'fastest_lap' => '01:23:45.456',
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Driver 3: Third fastest
        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[2]->id,
            'fastest_lap' => '01:23:46.000',
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Driver 4: DNF - should be at the end
        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[3]->id,
            'fastest_lap' => '01:23:44.000',
            'dnf' => true,
            'status' => 'pending',
        ]);

        // Driver 5: No time - should be at the end
        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[4]->id,
            'fastest_lap' => null,
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Mark qualifier as completed
        $response = $this->actingAs($this->user)
            ->putJson(self::APP_URL . "/api/qualifiers/{$qualifierId}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify pole position was awarded correctly
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[0]->id,
            'position' => 1,
            'has_pole' => true,
            'race_points' => 3,
        ]);

        // Verify second place
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[1]->id,
            'position' => 2,
            'has_pole' => false,
            'race_points' => 0,
        ]);

        // Verify third place
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[2]->id,
            'position' => 3,
            'has_pole' => false,
            'race_points' => 0,
        ]);

        // Verify DNF is placed at the end (position 4)
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[3]->id,
            'position' => 4,
            'has_pole' => false,
            'race_points' => 0,
        ]);

        // Verify no time is placed at the end (position 5)
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[4]->id,
            'position' => 5,
            'has_pole' => false,
            'race_points' => 0,
        ]);
    }

    public function test_calculates_positions_without_qualifying_pole(): void
    {
        // Create qualifier without pole position bonus
        $createResponse = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_notes' => null,
            ]);

        $qualifierId = $createResponse->json('data.id');

        // Get the season and league from the round
        $seasonId = $this->round->season_id;
        $season = \App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent::find($seasonId);
        $competition = \App\Infrastructure\Persistence\Eloquent\Models\Competition::find($season->competition_id);
        $leagueId = $competition->league_id;

        // Create season drivers
        $seasonDrivers = [];
        for ($i = 0; $i < 2; $i++) {
            $driver = \App\Infrastructure\Persistence\Eloquent\Models\Driver::factory()->create();
            $leagueDriver = \App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent::create([
                'league_id' => $leagueId,
                'driver_id' => $driver->id,
                'status' => 'active',
            ]);
            $seasonDrivers[$i] = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::create([
                'season_id' => $seasonId,
                'league_driver_id' => $leagueDriver->id,
                'status' => 'active',
            ]);
        }

        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[0]->id,
            'fastest_lap' => '01:23:45.123',
            'dnf' => false,
            'status' => 'pending',
        ]);

        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[1]->id,
            'fastest_lap' => '01:23:46.000',
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Mark qualifier as completed
        $this->actingAs($this->user)
            ->putJson(self::APP_URL . "/api/qualifiers/{$qualifierId}", [
                'status' => 'completed',
            ]);

        // Verify pole position was awarded but with 0 points
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[0]->id,
            'position' => 1,
            'has_pole' => true,
            'race_points' => 0,
        ]);

        // Verify second place
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDrivers[1]->id,
            'position' => 2,
            'has_pole' => false,
            'race_points' => 0,
        ]);
    }

    public function test_calculates_pole_position_per_division_when_divisions_enabled(): void
    {
        // Get the season and enable divisions
        $seasonId = $this->round->season_id;
        $season = \App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent::find($seasonId);
        $season->update(['race_divisions_enabled' => true]);

        $competition = \App\Infrastructure\Persistence\Eloquent\Models\Competition::find($season->competition_id);
        $leagueId = $competition->league_id;

        // Create two divisions
        $division1 = \App\Infrastructure\Persistence\Eloquent\Models\Division::factory()->create([
            'season_id' => $seasonId,
            'name' => 'Pro Division',
        ]);
        $division2 = \App\Infrastructure\Persistence\Eloquent\Models\Division::factory()->create([
            'season_id' => $seasonId,
            'name' => 'Amateur Division',
        ]);

        // Create qualifier with pole position bonus
        $createResponse = $this->actingAs($this->user)
            ->postJson(self::APP_URL . "/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'qualifying_pole' => 3,
                'qualifying_pole_top_10' => false,
                'race_notes' => null,
            ]);

        $qualifierId = $createResponse->json('data.id');

        // Create season drivers for Division 1
        $div1Driver1 = \App\Infrastructure\Persistence\Eloquent\Models\Driver::factory()->create();
        $div1LeagueDriver1 = \App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent::create([
            'league_id' => $leagueId,
            'driver_id' => $div1Driver1->id,
            'status' => 'active',
        ]);
        $seasonDriver1 = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::create([
            'season_id' => $seasonId,
            'league_driver_id' => $div1LeagueDriver1->id,
            'status' => 'active',
        ]);

        $div1Driver2 = \App\Infrastructure\Persistence\Eloquent\Models\Driver::factory()->create();
        $div1LeagueDriver2 = \App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent::create([
            'league_id' => $leagueId,
            'driver_id' => $div1Driver2->id,
            'status' => 'active',
        ]);
        $seasonDriver2 = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::create([
            'season_id' => $seasonId,
            'league_driver_id' => $div1LeagueDriver2->id,
            'status' => 'active',
        ]);

        // Create season drivers for Division 2
        $div2Driver1 = \App\Infrastructure\Persistence\Eloquent\Models\Driver::factory()->create();
        $div2LeagueDriver1 = \App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent::create([
            'league_id' => $leagueId,
            'driver_id' => $div2Driver1->id,
            'status' => 'active',
        ]);
        $seasonDriver3 = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::create([
            'season_id' => $seasonId,
            'league_driver_id' => $div2LeagueDriver1->id,
            'status' => 'active',
        ]);

        $div2Driver2 = \App\Infrastructure\Persistence\Eloquent\Models\Driver::factory()->create();
        $div2LeagueDriver2 = \App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent::create([
            'league_id' => $leagueId,
            'driver_id' => $div2Driver2->id,
            'status' => 'active',
        ]);
        $seasonDriver4 = \App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent::create([
            'season_id' => $seasonId,
            'league_driver_id' => $div2LeagueDriver2->id,
            'status' => 'active',
        ]);

        // Division 1 - Driver 1 is fastest (should get pole)
        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division1->id,
            'fastest_lap' => '01:23:45.123',
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Division 1 - Driver 2 is slower
        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDriver2->id,
            'division_id' => $division1->id,
            'fastest_lap' => '01:23:46.000',
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Division 2 - Driver 3 is fastest in Division 2 (should get pole in Division 2)
        // Note: This time is FASTER than Division 1 drivers, but should still get pole in Division 2
        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDriver3->id,
            'division_id' => $division2->id,
            'fastest_lap' => '01:23:44.000',
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Division 2 - Driver 4 is slower
        \App\Infrastructure\Persistence\Eloquent\Models\RaceResult::create([
            'race_id' => $qualifierId,
            'driver_id' => $seasonDriver4->id,
            'division_id' => $division2->id,
            'fastest_lap' => '01:23:47.000',
            'dnf' => false,
            'status' => 'pending',
        ]);

        // Mark qualifier as completed
        $response = $this->actingAs($this->user)
            ->putJson(self::APP_URL . "/api/qualifiers/{$qualifierId}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);

        // Verify Division 1 - Driver 1 gets pole and points
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDriver1->id,
            'division_id' => $division1->id,
            'position' => 1,
            'has_pole' => true,
            'race_points' => 3,
        ]);

        // Verify Division 1 - Driver 2 does NOT get pole
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDriver2->id,
            'division_id' => $division1->id,
            'position' => 2,
            'has_pole' => false,
            'race_points' => 0,
        ]);

        // Verify Division 2 - Driver 3 gets pole and points (even though faster overall)
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDriver3->id,
            'division_id' => $division2->id,
            'position' => 1,
            'has_pole' => true,
            'race_points' => 3,
        ]);

        // Verify Division 2 - Driver 4 does NOT get pole
        $this->assertDatabaseHas('race_results', [
            'race_id' => $qualifierId,
            'driver_id' => $seasonDriver4->id,
            'division_id' => $division2->id,
            'position' => 2,
            'has_pole' => false,
            'race_points' => 0,
        ]);
    }
}
