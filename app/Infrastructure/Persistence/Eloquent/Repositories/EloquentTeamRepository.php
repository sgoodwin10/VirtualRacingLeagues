<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Team\Entities\Team;
use App\Domain\Team\Exceptions\TeamNotFoundException;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Domain\Team\ValueObjects\TeamName;
use App\Infrastructure\Persistence\Eloquent\Models\Team as TeamEloquent;
use DateTimeImmutable;
use Illuminate\Support\Facades\Storage;

/**
 * Eloquent implementation of Team Repository.
 * Maps between domain entities and Eloquent models.
 */
final class EloquentTeamRepository implements TeamRepositoryInterface
{
    public function save(Team $team): void
    {
        if ($team->id() === null) {
            // Create new
            $eloquentTeam = new TeamEloquent();
            $this->fillEloquentModel($eloquentTeam, $team);

            $eloquentTeam->save();

            // Set ID on domain entity
            $team->setId($eloquentTeam->id);
        } else {
            // Update existing
            $eloquentTeam = TeamEloquent::findOrFail($team->id());
            $this->fillEloquentModel($eloquentTeam, $team);

            $eloquentTeam->save();
        }
    }

    public function findById(int $id): Team
    {
        $eloquentTeam = TeamEloquent::find($id);

        if ($eloquentTeam === null) {
            throw TeamNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquentTeam);
    }

    public function findBySeasonId(int $seasonId): array
    {
        $eloquentTeams = TeamEloquent::where('season_id', $seasonId)
            ->orderBy('name', 'asc')
            ->get();

        return $eloquentTeams->map(
            /** @param TeamEloquent $eloquentTeam */
            fn ($eloquentTeam) => $this->toDomainEntity($eloquentTeam)
        )->all();
    }

    public function delete(Team $team): void
    {
        if ($team->id() === null) {
            return;
        }

        $eloquentTeam = TeamEloquent::findOrFail($team->id());

        // Hard delete - this will cascade to set season_drivers.team_id to NULL
        $eloquentTeam->delete();
    }

    public function exists(int $id): bool
    {
        return TeamEloquent::where('id', $id)->exists();
    }

    public function existsInSeason(int $teamId, int $seasonId): bool
    {
        return TeamEloquent::where('id', $teamId)
            ->where('season_id', $seasonId)
            ->exists();
    }

    /**
     * Batch fetch team data for multiple team IDs to avoid N+1 queries.
     *
     * @param  array<int>  $teamIds
     * @return array<int, array{name: string, logo_url: string|null}> Map of team ID => team data
     */
    public function findDataByIds(array $teamIds): array
    {
        if (empty($teamIds)) {
            return [];
        }

        $teams = TeamEloquent::query()
            ->whereIn('id', $teamIds)
            ->select('id', 'name', 'logo_url')
            ->get();

        $map = [];
        foreach ($teams as $team) {
            // If logo_url is already a full URL (http/https), use it as-is
            // Otherwise, generate storage URL from relative path using public disk
            $logoUrl = null;
            if ($team->logo_url !== null) {
                $logoUrl = str_starts_with($team->logo_url, 'http://') || str_starts_with($team->logo_url, 'https://')
                    ? $team->logo_url
                    : Storage::disk('public')->url($team->logo_url);
            }

            $map[$team->id] = [
                'name' => $team->name,
                'logo_url' => $logoUrl,
            ];
        }

        return $map;
    }

    /**
     * Fill Eloquent model from domain entity.
     */
    private function fillEloquentModel(TeamEloquent $eloquentTeam, Team $team): void
    {
        $eloquentTeam->season_id = $team->seasonId();
        $eloquentTeam->name = $team->name()->value();
        $eloquentTeam->logo_url = $team->logoUrl();
    }

    /**
     * Map Eloquent model to domain entity.
     */
    private function toDomainEntity(TeamEloquent $eloquentTeam): Team
    {
        return Team::reconstitute(
            id: $eloquentTeam->id,
            seasonId: $eloquentTeam->season_id,
            name: TeamName::from($eloquentTeam->name),
            logoUrl: $eloquentTeam->logo_url,
            createdAt: new DateTimeImmutable($eloquentTeam->created_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($eloquentTeam->updated_at->toDateTimeString()),
        );
    }
}
