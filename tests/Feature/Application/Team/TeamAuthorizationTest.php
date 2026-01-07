<?php

declare(strict_types=1);

namespace Tests\Feature\Application\Team;

use App\Application\Team\DTOs\CreateTeamData;
use App\Application\Team\DTOs\UpdateTeamData;
use App\Application\Team\DTOs\AssignDriverTeamData;
use App\Application\Team\Services\TeamApplicationService;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\Team;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test authorization for Team operations.
 * Ensures only league owners can manage teams in their leagues.
 */
class TeamAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private TeamApplicationService $teamService;
    private UserEloquent $owner;
    private UserEloquent $otherUser;
    private League $league;
    private Competition $competition;
    private SeasonEloquent $season;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teamService = app(TeamApplicationService::class);

        // Create owner user
        $this->owner = UserEloquent::factory()->create();

        // Create other user (not owner)
        $this->otherUser = UserEloquent::factory()->create();

        // Create league owned by owner
        $this->league = League::factory()->create([
            'owner_user_id' => $this->owner->id,
        ]);

        // Create platform
        $platform = Platform::factory()->create();

        // Create competition in the league
        $this->competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $platform->id,
            'created_by_user_id' => $this->owner->id,
        ]);

        // Create season in the competition
        $this->season = SeasonEloquent::factory()->create([
            'competition_id' => $this->competition->id,
            'created_by_user_id' => $this->owner->id,
        ]);
    }

    public function test_owner_can_create_team(): void
    {
        $data = CreateTeamData::from([
            'name' => 'Test Team',
        ]);

        $teamData = $this->teamService->createTeam($data, $this->season->id, $this->owner->id);

        $this->assertNotNull($teamData->id);
        $this->assertEquals('Test Team', $teamData->name);
    }

    public function test_non_owner_cannot_create_team(): void
    {
        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Only league owner can manage teams');

        $data = CreateTeamData::from([
            'name' => 'Test Team',
        ]);

        $this->teamService->createTeam($data, $this->season->id, $this->otherUser->id);
    }

    public function test_owner_can_update_team(): void
    {
        // Create a team first
        $team = Team::factory()->create([
            'season_id' => $this->season->id,
            'name' => 'Original Name',
        ]);

        $data = UpdateTeamData::from([
            'name' => 'Updated Name',
        ]);

        $teamData = $this->teamService->updateTeam($team->id, $data, $this->owner->id);

        $this->assertEquals('Updated Name', $teamData->name);
    }

    public function test_non_owner_cannot_update_team(): void
    {
        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Only league owner can manage teams');

        $team = Team::factory()->create([
            'season_id' => $this->season->id,
            'name' => 'Original Name',
        ]);

        $data = UpdateTeamData::from([
            'name' => 'Updated Name',
        ]);

        $this->teamService->updateTeam($team->id, $data, $this->otherUser->id);
    }

    public function test_owner_can_delete_team(): void
    {
        $team = Team::factory()->create([
            'season_id' => $this->season->id,
        ]);

        $this->teamService->deleteTeam($team->id, $this->owner->id);

        $this->assertDatabaseMissing('teams', [
            'id' => $team->id,
        ]);
    }

    public function test_non_owner_cannot_delete_team(): void
    {
        $this->expectException(UnauthorizedException::class);
        $this->expectExceptionMessage('Only league owner can manage teams');

        $team = Team::factory()->create([
            'season_id' => $this->season->id,
        ]);

        $this->teamService->deleteTeam($team->id, $this->otherUser->id);
    }
}
