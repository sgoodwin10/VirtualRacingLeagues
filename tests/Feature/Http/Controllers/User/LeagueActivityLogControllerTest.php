<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Application\Activity\Services\LeagueActivityLogService;
use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Spatie\Activitylog\Models\Activity;

/**
 * Feature tests for LeagueActivityLogController.
 *
 * Tests API endpoints for viewing league activities.
 */
class LeagueActivityLogControllerTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private UserEloquent $user;

    private League $league;

    private LeagueActivityLogService $activityLogService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->activityLogService = app(LeagueActivityLogService::class);

        // Create a test user
        $this->user = UserEloquent::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
        ]);

        // Create a league owned by this user
        $this->league = League::factory()->create([
            'name' => 'Test League',
            'owner_user_id' => $this->user->id,
        ]);

        // Authenticate as the user
        $this->actingAs($this->user, 'web');
    }

    // =============================================================================
    // INDEX TESTS
    // =============================================================================

    public function test_can_get_activities_for_owned_league(): void
    {
        // Create some activities
        $this->activityLogService->logLeagueCreated($this->user, $this->league);

        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $this->activityLogService->logCompetitionCreated($this->user, $competition);

        // Get activities
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'log_name',
                        'description',
                        'subject_type',
                        'subject_id',
                        'causer_type',
                        'causer_id',
                        'causer_name',
                        'properties',
                        'event',
                        'created_at',
                        'entity_type',
                        'entity_id',
                        'entity_name',
                        'action',
                    ],
                ],
                'meta' => [
                    'total',
                    'per_page',
                    'current_page',
                    'last_page',
                    'from',
                    'to',
                ],
                'links' => [
                    'first',
                    'last',
                    'prev',
                    'next',
                ],
            ]);

        $data = $response->json('data');
        $this->assertCount(2, $data);
    }

    public function test_cannot_get_activities_for_non_owned_league(): void
    {
        // Create another user's league
        $otherUser = UserEloquent::factory()->create();
        $otherLeague = League::factory()->create(['owner_user_id' => $otherUser->id]);

        // Try to get activities
        $response = $this->json('GET', "/api/leagues/{$otherLeague->id}/activities");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have permission to view this league\'s activities.',
            ]);
    }

    public function test_can_filter_activities_by_entity_type(): void
    {
        // Create different types of activities
        $this->activityLogService->logLeagueCreated($this->user, $this->league);

        $competition = Competition::factory()->create(['league_id' => $this->league->id]);
        $this->activityLogService->logCompetitionCreated($this->user, $competition);

        // Filter by competition
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities?entity_type=competition");

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('competition', $data[0]['entity_type']);
    }

    public function test_can_filter_activities_by_action(): void
    {
        $competition = Competition::factory()->create(['league_id' => $this->league->id]);

        // Create and update
        $this->activityLogService->logCompetitionCreated($this->user, $competition);
        $this->activityLogService->logCompetitionUpdated($this->user, $competition, []);

        // Filter by create
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities?action=create");

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('create', $data[0]['action']);
    }

    public function test_can_filter_activities_by_date_range(): void
    {
        // Create an activity
        $this->activityLogService->logLeagueCreated($this->user, $this->league);

        // Get activities from today
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities?from_date=" . now()->toISOString());

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
    }

    public function test_pagination_works_correctly(): void
    {
        // Create 15 activities
        for ($i = 0; $i < 15; $i++) {
            $competition = Competition::factory()->create([
                'league_id' => $this->league->id,
                'name' => "Competition {$i}",
            ]);
            $this->activityLogService->logCompetitionCreated($this->user, $competition);
        }

        // Get first page with 10 items
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities?limit=10&page=1");

        $response->assertStatus(200);

        $data = $response->json('data');
        $meta = $response->json('meta');

        $this->assertCount(10, $data);
        $this->assertEquals(15, $meta['total']);
        $this->assertEquals(10, $meta['per_page']);
        $this->assertEquals(1, $meta['current_page']);
        $this->assertEquals(2, $meta['last_page']);

        // Get second page
        $response2 = $this->json('GET', "/api/leagues/{$this->league->id}/activities?limit=10&page=2");

        $response2->assertStatus(200);

        $data2 = $response2->json('data');
        $this->assertCount(5, $data2);
    }

    public function test_respects_max_limit_of_100(): void
    {
        // Try to request 200 items - should fail validation
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities?limit=200");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['limit']);

        // Verify that 100 is the maximum allowed value
        $response2 = $this->json('GET', "/api/leagues/{$this->league->id}/activities?limit=100");
        $response2->assertStatus(200);

        $meta = $response2->json('meta');
        $this->assertEquals(100, $meta['per_page']); // 100 should work
    }

    public function test_invalid_date_format_returns_validation_error(): void
    {
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities?from_date=invalid-date");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['from_date']);
    }

    public function test_activities_include_causer_name(): void
    {
        $this->activityLogService->logLeagueCreated($this->user, $this->league);

        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities");

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        $this->assertEquals('Test User', $data[0]['causer_name']);
    }

    public function test_activities_are_ordered_by_created_at_desc(): void
    {
        // Create activities with slight delay
        $competition1 = Competition::factory()->create([
            'league_id' => $this->league->id,
            'name' => 'First',
        ]);
        $this->activityLogService->logCompetitionCreated($this->user, $competition1);

        sleep(1); // Ensure different timestamps

        $competition2 = Competition::factory()->create([
            'league_id' => $this->league->id,
            'name' => 'Second',
        ]);
        $this->activityLogService->logCompetitionCreated($this->user, $competition2);

        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities");

        $response->assertStatus(200);

        $data = $response->json('data');
        // Most recent should be first
        $this->assertStringContainsString('Second', $data[0]['description']);
        $this->assertStringContainsString('First', $data[1]['description']);
    }

    // =============================================================================
    // SHOW TESTS
    // =============================================================================

    public function test_can_get_single_activity_by_id(): void
    {
        $activity = $this->activityLogService->logLeagueCreated($this->user, $this->league);

        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities/{$activity->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'log_name',
                    'description',
                    'subject_type',
                    'subject_id',
                    'causer_type',
                    'causer_id',
                    'causer_name',
                    'properties',
                    'event',
                    'created_at',
                    'entity_type',
                    'entity_id',
                    'entity_name',
                    'action',
                ],
            ]);

        $data = $response->json('data');
        $this->assertEquals($activity->id, $data['id']);
        $this->assertEquals('league', $data['log_name']);
    }

    public function test_cannot_get_activity_for_non_owned_league(): void
    {
        // Create activity for another user's league
        $otherUser = UserEloquent::factory()->create();
        $otherLeague = League::factory()->create(['owner_user_id' => $otherUser->id]);
        $activity = $this->activityLogService->logLeagueCreated($otherUser, $otherLeague);

        // Try to get it
        $response = $this->json('GET', "/api/leagues/{$otherLeague->id}/activities/{$activity->id}");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have permission to view this league\'s activities.',
            ]);
    }

    public function test_returns_404_for_non_existent_activity(): void
    {
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities/99999");

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Activity not found',
            ]);
    }

    public function test_cannot_get_activity_from_different_league(): void
    {
        // Create activity for this league
        $activity = $this->activityLogService->logLeagueCreated($this->user, $this->league);

        // Create another league owned by the same user
        $otherLeague = League::factory()->create(['owner_user_id' => $this->user->id]);

        // Try to access the activity via the wrong league
        $response = $this->json('GET', "/api/leagues/{$otherLeague->id}/activities/{$activity->id}");

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Activity not found',
            ]);
    }

    public function test_requires_authentication(): void
    {
        // Log out
        Auth::guard('web')->logout();

        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities");

        $response->assertStatus(401);
    }

    public function test_pagination_links_are_correct(): void
    {
        // Create 25 activities
        for ($i = 0; $i < 25; $i++) {
            $competition = Competition::factory()->create(['league_id' => $this->league->id]);
            $this->activityLogService->logCompetitionCreated($this->user, $competition);
        }

        // Get page 2 with limit 10
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities?limit=10&page=2");

        $response->assertStatus(200);

        $links = $response->json('links');

        $this->assertStringContainsString('page=1', $links['first']);
        $this->assertStringContainsString('page=3', $links['last']);
        $this->assertStringContainsString('page=1', $links['prev']);
        $this->assertStringContainsString('page=3', $links['next']);
    }

    public function test_no_prev_link_on_first_page(): void
    {
        $this->activityLogService->logLeagueCreated($this->user, $this->league);

        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities?page=1");

        $response->assertStatus(200);

        $links = $response->json('links');
        $this->assertNull($links['prev']);
    }

    public function test_no_next_link_on_last_page(): void
    {
        // Create 5 activities
        for ($i = 0; $i < 5; $i++) {
            $competition = Competition::factory()->create(['league_id' => $this->league->id]);
            $this->activityLogService->logCompetitionCreated($this->user, $competition);
        }

        // Get last page with limit 10 (only 1 page total)
        $response = $this->json('GET', "/api/leagues/{$this->league->id}/activities?limit=10&page=1");

        $response->assertStatus(200);

        $links = $response->json('links');
        $this->assertNull($links['next']);
    }
}
