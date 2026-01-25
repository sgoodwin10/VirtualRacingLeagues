<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Test Competition Statistics Calculation.
 *
 * Verifies that competition stats (total_seasons, active_seasons, total_drivers, total_rounds, total_races)
 * are correctly calculated and returned in API responses.
 */
class CompetitionStatsTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private User $user;

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

        // Create user
        $this->user = User::factory()->create();

        // Create league owned by user
        $this->league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$this->platform->id],
        ]);

        // Create competition
        $this->competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
        ]);
    }

    // ==================== Competition Stats Tests ====================

    public function test_competition_has_zero_stats_when_empty(): void
    {
        $this->actingAs($this->user);

        $response = $this->getJson("/api/competitions/{$this->competition->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $this->competition->id,
                    'stats' => [
                        'total_seasons' => 0,
                        'active_seasons' => 0,
                        'total_drivers' => 0,
                        'total_rounds' => 0,
                        'total_races' => 0,
                    ],
                ],
            ]);
    }

    public function test_competition_counts_seasons_correctly(): void
    {
        // Create 2 active seasons and 1 archived season
        SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
        ]);

        SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
        ]);

        SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
            'status' => 'archived',
            'created_by_user_id' => $this->user->id,
        ]);

        $this->actingAs($this->user);

        $response = $this->getJson("/api/competitions/{$this->competition->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'stats' => [
                        'total_seasons' => 3,
                        'active_seasons' => 2,
                    ],
                ],
            ]);
    }

    public function test_competition_has_stats_structure(): void
    {
        $this->actingAs($this->user);

        $response = $this->getJson("/api/competitions/{$this->competition->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'name',
                    'stats' => [
                        'total_seasons',
                        'active_seasons',
                        'total_drivers',
                        'total_rounds',
                        'total_races',
                        'next_race_date',
                    ],
                ],
            ]);
    }

    public function test_competition_stats_are_included_in_league_competitions_list(): void
    {
        // Create a season
        SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
            'status' => 'active',
            'created_by_user_id' => $this->user->id,
        ]);

        $this->actingAs($this->user);

        $response = $this->getJson("/api/leagues/{$this->league->id}/competitions");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'stats' => [
                            'total_seasons',
                            'active_seasons',
                            'total_drivers',
                            'total_rounds',
                            'total_races',
                        ],
                    ],
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    [
                        'id' => $this->competition->id,
                        'stats' => [
                            'total_seasons' => 1,
                            'active_seasons' => 1,
                        ],
                    ],
                ],
            ]);
    }
}
