<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeasonStandingsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private League $league;

    private Platform $platform;

    private Competition $competition;

    private SeasonEloquent $season;

    protected function setUp(): void
    {
        parent::setUp();

        // Create platform
        $this->platform = Platform::create([
            'name' => 'iRacing',
            'slug' => 'iracing',
        ]);

        // Create user
        /** @var User $user */
        $user = User::factory()->create();
        $this->user = $user;

        // Create league owned by user
        /** @var League $league */
        $league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$this->platform->id],
        ]);
        $this->league = $league;

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

        // Create season
        $this->season = SeasonEloquent::create([
            'competition_id' => $this->competition->id,
            'name' => 'Season 1',
            'slug' => 'season-1',
            'status' => 'active',
            'race_divisions_enabled' => false,
            'created_by_user_id' => $this->user->id,
        ]);
    }

    public function test_returns_empty_standings_when_no_completed_rounds(): void
    {
        $this->actingAs($this->user, 'web');

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'standings' => [],
                'has_divisions' => false,
            ],
        ]);
    }

    public function test_returns_aggregated_standings_without_divisions(): void
    {
        $this->actingAs($this->user, 'web');

        // Create drivers
        [$driver1Id, $driver2Id, $driver3Id] = $this->createDrivers(['Driver 1', 'Driver 2', 'Driver 3']);

        // Create completed rounds with standings
        $round1 = $this->createRoundWithStandings(1, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 25],
            ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 18],
            ['driver_id' => $driver3Id, 'driver_name' => 'Driver 3', 'total_points' => 15],
        ]);

        $round2 = $this->createRoundWithStandings(2, [
            ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 25],
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 18],
            ['driver_id' => $driver3Id, 'driver_name' => 'Driver 3', 'total_points' => 15],
        ]);

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.has_divisions', false);

        // Check we have 3 drivers
        $standings = $response->json('data.standings');
        $this->assertCount(3, $standings);

        // Verify Driver 3 is always position 3 (lowest points)
        $this->assertEquals(3, $standings[2]['position']);
        $this->assertEquals($driver3Id, $standings[2]['driver_id']);
        $this->assertEquals('Driver 3', $standings[2]['driver_name']);
        $this->assertEquals(30, $standings[2]['total_points']);

        // Verify top 2 drivers both have 43 points (order may vary due to tie)
        $this->assertEquals(43, $standings[0]['total_points']);
        $this->assertEquals(43, $standings[1]['total_points']);

        // Verify all drivers have correct round breakdown
        foreach ($standings as $standing) {
            $this->assertArrayHasKey('rounds', $standing);
            $this->assertCount(2, $standing['rounds']);
        }
    }

    public function test_returns_aggregated_standings_with_divisions(): void
    {
        $this->actingAs($this->user, 'web');

        // Enable divisions on season
        $this->season->update(['race_divisions_enabled' => true]);

        // Create divisions
        $divisionA = Division::create([
            'season_id' => $this->season->id,
            'name' => 'Division A',
        ]);

        $divisionB = Division::create([
            'season_id' => $this->season->id,
            'name' => 'Division B',
        ]);

        // Create drivers
        [$driver1Id, $driver2Id, $driver3Id, $driver4Id] = $this->createDrivers([
            'Driver 1',
            'Driver 2',
            'Driver 3',
            'Driver 4',
        ]);

        // Create rounds with division standings
        $round1 = $this->createRoundWithDivisionStandings(1, [
            [
                'division_id' => $divisionA->id,
                'division_name' => 'Division A',
                'results' => [
                    ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 25],
                    ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 18],
                ],
            ],
            [
                'division_id' => $divisionB->id,
                'division_name' => 'Division B',
                'results' => [
                    ['driver_id' => $driver3Id, 'driver_name' => 'Driver 3', 'total_points' => 25],
                    ['driver_id' => $driver4Id, 'driver_name' => 'Driver 4', 'total_points' => 18],
                ],
            ],
        ]);

        $round2 = $this->createRoundWithDivisionStandings(2, [
            [
                'division_id' => $divisionA->id,
                'division_name' => 'Division A',
                'results' => [
                    ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 25],
                    ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 18],
                ],
            ],
            [
                'division_id' => $divisionB->id,
                'division_name' => 'Division B',
                'results' => [
                    ['driver_id' => $driver4Id, 'driver_name' => 'Driver 4', 'total_points' => 25],
                    ['driver_id' => $driver3Id, 'driver_name' => 'Driver 3', 'total_points' => 18],
                ],
            ],
        ]);

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.has_divisions', true);

        $standings = $response->json('data.standings');
        $this->assertCount(2, $standings);

        // Check Division A
        /** @var array<mixed>|null $divA */
        $divA = collect($standings)->firstWhere('division_id', $divisionA->id);
        $this->assertNotNull($divA);
        $this->assertEquals('Division A', $divA['division_name']);
        $this->assertCount(2, $divA['drivers']);
        $this->assertEquals(43, $divA['drivers'][0]['total_points']);
        $this->assertEquals(43, $divA['drivers'][1]['total_points']);

        // Check Division B
        /** @var array<mixed>|null $divB */
        $divB = collect($standings)->firstWhere('division_id', $divisionB->id);
        $this->assertNotNull($divB);
        $this->assertEquals('Division B', $divB['division_name']);
        $this->assertCount(2, $divB['drivers']);
        $this->assertEquals(43, $divB['drivers'][0]['total_points']);
        $this->assertEquals(43, $divB['drivers'][1]['total_points']);
    }

    public function test_ignores_scheduled_rounds_without_results(): void
    {
        $this->actingAs($this->user, 'web');

        // Create driver
        [$driver1Id] = $this->createDrivers(['Driver 1']);

        // Create one completed round with standings
        $round1 = $this->createRoundWithStandings(1, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 25],
        ]);

        // Create scheduled round without results
        Round::create([
            'season_id' => $this->season->id,
            'round_number' => 2,
            'slug' => 'round-2',
            'status' => 'scheduled',
            'timezone' => 'UTC',
            'created_by_user_id' => $this->user->id,
        ]);

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data' => [
                'standings' => [
                    [
                        'position' => 1,
                        'driver_id' => $driver1Id,
                        'driver_name' => 'Driver 1',
                        'total_points' => 25,
                        'rounds' => [
                            ['round_id' => $round1->id, 'round_number' => 1, 'points' => 25],
                        ],
                    ],
                ],
                'has_divisions' => false,
            ],
        ]);
    }

    public function test_calculates_drop_totals_correctly_without_divisions(): void
    {
        $this->actingAs($this->user, 'web');

        // Enable drop rounds on season
        $this->season->update([
            'drop_round' => true,
            'total_drop_rounds' => 1,
        ]);

        // Create two drivers with different participation levels
        [$driver1Id, $driver2Id] = $this->createDrivers(['Driver 1', 'Driver 2']);

        // Driver 1 participates in 6 rounds with scores: 20, 20, 16, 26, 26, 25
        // Should drop 16 (lowest), resulting in drop_total = 117
        $this->createRoundWithStandings(1, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 20],
            ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 10],
        ]);

        $this->createRoundWithStandings(2, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 20],
            ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 16],
        ]);

        $this->createRoundWithStandings(3, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 16],
        ]);

        // Driver 2 doesn't participate in round 4
        $this->createRoundWithStandings(4, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 26],
        ]);

        // Driver 2 doesn't participate in round 5
        $this->createRoundWithStandings(5, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 26],
        ]);

        $this->createRoundWithStandings(6, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 25],
        ]);

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.drop_round_enabled', true);
        $response->assertJsonPath('data.total_drop_rounds', 1);

        $standings = $response->json('data.standings');

        // Find Driver 1
        $driver1 = collect($standings)->firstWhere('driver_id', $driver1Id);
        $this->assertNotNull($driver1);
        $this->assertEquals(133, $driver1['total_points']); // 20+20+16+26+26+25
        $this->assertEquals(117, $driver1['drop_total']); // 133 - 16 (dropped lowest)

        // Find Driver 2 - only participated in 2 rounds out of 6
        // Missing rounds count as 0 points (per documentation)
        // Array: [10, 16, 0, 0, 0, 0] -> sorted: [0, 0, 0, 0, 10, 16]
        // Drops 1 lowest (0), drop_total = 26
        $driver2 = collect($standings)->firstWhere('driver_id', $driver2Id);
        $this->assertNotNull($driver2);
        $this->assertEquals(26, $driver2['total_points']); // 10+16
        $this->assertEquals(26, $driver2['drop_total']); // 26 - 0 (dropped one of the missing rounds)
    }

    public function test_calculates_drop_totals_correctly_with_divisions(): void
    {
        $this->actingAs($this->user, 'web');

        // Enable divisions and drop rounds on season
        $this->season->update([
            'race_divisions_enabled' => true,
            'drop_round' => true,
            'total_drop_rounds' => 1,
        ]);

        // Create division
        $divisionA = Division::create([
            'season_id' => $this->season->id,
            'name' => 'Division A',
        ]);

        // Create two drivers
        [$driver1Id, $driver2Id] = $this->createDrivers(['Driver 1', 'Driver 2']);

        // Driver 1 participates in 3 rounds with scores: 25, 18, 15
        // Should drop 15 (lowest), resulting in drop_total = 43
        $this->createRoundWithDivisionStandings(1, [
            [
                'division_id' => $divisionA->id,
                'division_name' => 'Division A',
                'results' => [
                    ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 25],
                    ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 10],
                ],
            ],
        ]);

        $this->createRoundWithDivisionStandings(2, [
            [
                'division_id' => $divisionA->id,
                'division_name' => 'Division A',
                'results' => [
                    ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 18],
                ],
            ],
        ]);

        $this->createRoundWithDivisionStandings(3, [
            [
                'division_id' => $divisionA->id,
                'division_name' => 'Division A',
                'results' => [
                    ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 15],
                ],
            ],
        ]);

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.has_divisions', true);
        $response->assertJsonPath('data.drop_round_enabled', true);
        $response->assertJsonPath('data.total_drop_rounds', 1);

        $standings = $response->json('data.standings');
        $divA = collect($standings)->firstWhere('division_id', $divisionA->id);
        $this->assertNotNull($divA);

        // Find Driver 1
        $driver1 = collect($divA['drivers'])->firstWhere('driver_id', $driver1Id);
        $this->assertNotNull($driver1);
        $this->assertEquals(58, $driver1['total_points']); // 25+18+15
        $this->assertEquals(43, $driver1['drop_total']); // 58 - 15 (dropped lowest)

        // Find Driver 2 - only participated in 1 round
        $driver2 = collect($divA['drivers'])->firstWhere('driver_id', $driver2Id);
        $this->assertNotNull($driver2);
        $this->assertEquals(10, $driver2['total_points']);
        $this->assertEquals(10, $driver2['drop_total']); // Can't drop when only 1 round participated
    }

    public function test_handles_tied_positions_correctly_without_divisions(): void
    {
        $this->actingAs($this->user, 'web');

        // Create drivers with tied points
        // Driver 2 and 3 tied at 26pts (should both be 5th)
        // Driver 5 should be 7th (skipping 6th)
        [$driver1Id, $driver2Id, $driver3Id, $driver4Id, $driver5Id] = $this->createDrivers([
            'Driver 1',
            'Driver 2',
            'Driver 3',
            'Driver 4',
            'Driver 5',
        ]);

        // Round 1
        $this->createRoundWithStandings(1, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 28],
            ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 26],
            ['driver_id' => $driver3Id, 'driver_name' => 'Driver 3', 'total_points' => 26],
            ['driver_id' => $driver4Id, 'driver_name' => 'Driver 4', 'total_points' => 24],
            ['driver_id' => $driver5Id, 'driver_name' => 'Driver 5', 'total_points' => 23],
        ]);

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $standings = $response->json('data.standings');
        $this->assertCount(5, $standings);

        // Verify positions with standard competition ranking
        $this->assertEquals(1, $standings[0]['position']); // Driver 1: 28pts
        $this->assertEquals(2, $standings[1]['position']); // Driver 2: 26pts (tied)
        $this->assertEquals(2, $standings[2]['position']); // Driver 3: 26pts (tied)
        $this->assertEquals(4, $standings[3]['position']); // Driver 4: 24pts (skips 3rd)
        $this->assertEquals(5, $standings[4]['position']); // Driver 5: 23pts
    }

    public function test_handles_tied_positions_correctly_with_divisions(): void
    {
        $this->actingAs($this->user, 'web');

        // Enable divisions on season
        $this->season->update(['race_divisions_enabled' => true]);

        // Create division
        $divisionA = Division::create([
            'season_id' => $this->season->id,
            'name' => 'Division A',
        ]);

        // Create drivers
        [$driver1Id, $driver2Id, $driver3Id, $driver4Id] = $this->createDrivers([
            'Driver 1',
            'Driver 2',
            'Driver 3',
            'Driver 4',
        ]);

        // Create round with tied drivers
        $this->createRoundWithDivisionStandings(1, [
            [
                'division_id' => $divisionA->id,
                'division_name' => 'Division A',
                'results' => [
                    ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 30],
                    ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 25],
                    ['driver_id' => $driver3Id, 'driver_name' => 'Driver 3', 'total_points' => 25],
                    ['driver_id' => $driver4Id, 'driver_name' => 'Driver 4', 'total_points' => 20],
                ],
            ],
        ]);

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $standings = $response->json('data.standings');
        $divA = collect($standings)->firstWhere('division_id', $divisionA->id);
        $this->assertNotNull($divA);

        // Verify positions with standard competition ranking
        $this->assertEquals(1, $divA['drivers'][0]['position']); // Driver 1: 30pts
        $this->assertEquals(2, $divA['drivers'][1]['position']); // Driver 2: 25pts (tied)
        $this->assertEquals(2, $divA['drivers'][2]['position']); // Driver 3: 25pts (tied)
        $this->assertEquals(4, $divA['drivers'][3]['position']); // Driver 4: 20pts (skips 3rd)
    }

    public function test_handles_tied_positions_with_drop_rounds(): void
    {
        $this->actingAs($this->user, 'web');

        // Enable drop rounds on season
        $this->season->update([
            'drop_round' => true,
            'total_drop_rounds' => 1,
        ]);

        // Create drivers
        [$driver1Id, $driver2Id, $driver3Id] = $this->createDrivers(['Driver 1', 'Driver 2', 'Driver 3']);

        // Create rounds where drivers are tied after drop round is applied
        $this->createRoundWithStandings(1, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 25],
            ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 20],
            ['driver_id' => $driver3Id, 'driver_name' => 'Driver 3', 'total_points' => 20],
        ]);

        $this->createRoundWithStandings(2, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 10],
            ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 25],
            ['driver_id' => $driver3Id, 'driver_name' => 'Driver 3', 'total_points' => 25],
        ]);

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $standings = $response->json('data.standings');

        // After drop rounds:
        // Driver 2: 45 total, drops 20, = 25 drop_total
        // Driver 3: 45 total, drops 20, = 25 drop_total
        // Driver 1: 35 total, drops 10, = 25 drop_total
        // All three should be tied at position 1

        $this->assertCount(3, $standings);
        $this->assertEquals(1, $standings[0]['position']);
        $this->assertEquals(1, $standings[1]['position']);
        $this->assertEquals(1, $standings[2]['position']);
        $this->assertEquals(25, $standings[0]['drop_total']);
        $this->assertEquals(25, $standings[1]['drop_total']);
        $this->assertEquals(25, $standings[2]['drop_total']);
    }

    public function test_includes_team_information_in_standings(): void
    {
        $this->actingAs($this->user, 'web');

        // Create a team
        $team = \App\Infrastructure\Persistence\Eloquent\Models\Team::create([
            'season_id' => $this->season->id,
            'name' => 'Red Bull Racing',
            'logo_url' => 'https://example.com/red-bull.png',
        ]);

        // Create drivers - one with team, one without
        $drivers = $this->createDrivers(['Driver 1', 'Driver 2']);
        $driver1Id = $drivers[0];
        $driver2Id = $drivers[1];

        // Assign first driver to team
        SeasonDriverEloquent::where('id', $driver1Id)->update(['team_id' => $team->id]);

        // Create round with standings
        $this->createRoundWithStandings(1, [
            ['driver_id' => $driver1Id, 'driver_name' => 'Driver 1', 'total_points' => 25],
            ['driver_id' => $driver2Id, 'driver_name' => 'Driver 2', 'total_points' => 18],
        ]);

        $url = "http://app.virtualracingleagues.localhost/api/seasons/{$this->season->id}/standings";
        $response = $this->getJson($url);

        $response->assertStatus(200);
        $standings = $response->json('data.standings');

        // Verify team data is present for driver with team
        $this->assertArrayHasKey('team_id', $standings[0]);
        $this->assertArrayHasKey('team_name', $standings[0]);
        $this->assertArrayHasKey('team_logo', $standings[0]);

        // Find driver 1 in standings
        $driver1Standing = collect($standings)->firstWhere('driver_id', $driver1Id);
        $this->assertNotNull($driver1Standing);
        $this->assertEquals($team->id, $driver1Standing['team_id']);
        $this->assertEquals('Red Bull Racing', $driver1Standing['team_name']);
        $this->assertEquals('https://example.com/red-bull.png', $driver1Standing['team_logo']);

        // Find driver 2 in standings (no team)
        $driver2Standing = collect($standings)->firstWhere('driver_id', $driver2Id);
        $this->assertNotNull($driver2Standing);
        $this->assertNull($driver2Standing['team_id']);
        $this->assertNull($driver2Standing['team_name']);
        $this->assertNull($driver2Standing['team_logo']);
    }

    /**
     * Helper: Create drivers and return their season driver IDs.
     *
     * @param  array<string>  $names
     * @return array<int>
     */
    private function createDrivers(array $names): array
    {
        $seasonDriverIds = [];

        foreach ($names as $name) {
            /** @var Driver $driver */
            $driver = Driver::factory()->create([
                'first_name' => $name,
                'last_name' => null,
                'nickname' => null,
            ]);

            $leagueDriver = LeagueDriverEloquent::create([
                'league_id' => $this->league->id,
                'driver_id' => $driver->id,
            ]);

            $seasonDriver = SeasonDriverEloquent::create([
                'season_id' => $this->season->id,
                'league_driver_id' => $leagueDriver->id,
                'status' => 'active',
            ]);

            $seasonDriverIds[] = $seasonDriver->id;
        }

        return $seasonDriverIds;
    }

    /**
     * Helper: Create a completed round with standings (without divisions).
     *
     * @param  array<array{driver_id: int, driver_name: string, total_points: int}>  $standings
     */
    private function createRoundWithStandings(int $roundNumber, array $standings): Round
    {
        $standingsData = [];
        $position = 1;

        foreach ($standings as $standing) {
            $standingsData[] = [
                'position' => $position++,
                'driver_id' => $standing['driver_id'],
                'driver_name' => $standing['driver_name'],
                'total_points' => $standing['total_points'],
                'race_points' => 0,
                'fastest_lap_points' => 0,
                'pole_position_points' => 0,
                'total_positions_gained' => 0,
            ];
        }

        return Round::create([
            'season_id' => $this->season->id,
            'round_number' => $roundNumber,
            'slug' => "round-{$roundNumber}",
            'status' => 'completed',
            'timezone' => 'UTC',
            'round_results' => ['standings' => $standingsData],
            'created_by_user_id' => $this->user->id,
        ]);
    }

    /**
     * Helper: Create a completed round with division standings.
     *
     * @param  array<array{division_id: int, division_name: string, results: array}>  $divisionStandings
     */
    private function createRoundWithDivisionStandings(int $roundNumber, array $divisionStandings): Round
    {
        $standingsData = [];

        foreach ($divisionStandings as $divisionStanding) {
            $results = [];
            $position = 1;

            foreach ($divisionStanding['results'] as $standing) {
                $results[] = [
                    'position' => $position++,
                    'driver_id' => $standing['driver_id'],
                    'driver_name' => $standing['driver_name'],
                    'total_points' => $standing['total_points'],
                    'race_points' => 0,
                    'fastest_lap_points' => 0,
                    'pole_position_points' => 0,
                    'total_positions_gained' => 0,
                ];
            }

            $standingsData[] = [
                'division_id' => $divisionStanding['division_id'],
                'division_name' => $divisionStanding['division_name'],
                'results' => $results,
            ];
        }

        return Round::create([
            'season_id' => $this->season->id,
            'round_number' => $roundNumber,
            'slug' => "round-{$roundNumber}",
            'status' => 'completed',
            'timezone' => 'UTC',
            'round_results' => ['standings' => $standingsData],
            'created_by_user_id' => $this->user->id,
        ]);
    }
}
