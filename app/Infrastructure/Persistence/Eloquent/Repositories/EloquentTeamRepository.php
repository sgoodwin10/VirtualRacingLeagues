<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Team\Entities\Team;
use App\Domain\Team\Exceptions\TeamNotFoundException;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Domain\Team\ValueObjects\TeamName;
use App\Infrastructure\Persistence\Eloquent\Models\Team as TeamEloquent;
use DateTimeImmutable;

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
            fn($eloquentTeam) => $this->toDomainEntity($eloquentTeam)
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
