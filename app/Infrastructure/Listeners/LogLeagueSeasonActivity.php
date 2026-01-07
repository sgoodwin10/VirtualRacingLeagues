<?php

declare(strict_types=1);

namespace App\Infrastructure\Listeners;

use App\Domain\Competition\Events\SeasonArchived;
use App\Domain\Competition\Events\SeasonCreated;
use App\Domain\Competition\Events\SeasonDeleted;
use App\Domain\Competition\Events\SeasonStatusChanged;
use App\Domain\Competition\Events\SeasonUpdated;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Listener for logging season domain events to league activity log.
 * All season activities are logged under the 'league' log name with league_id context.
 *
 * Note: Synchronous to ensure logs are immediately available.
 */
final class LogLeagueSeasonActivity
{
    /**
     * Handle the event.
     *
     * @param  SeasonCreated|SeasonUpdated|SeasonArchived|SeasonDeleted|SeasonStatusChanged  $event
     */
    public function handle(object $event): void
    {
        match (true) {
            $event instanceof SeasonCreated => $this->logSeasonCreated($event),
            $event instanceof SeasonUpdated => $this->logSeasonUpdated($event),
            $event instanceof SeasonArchived => $this->logSeasonArchived($event),
            $event instanceof SeasonDeleted => $this->logSeasonDeleted($event),
            $event instanceof SeasonStatusChanged => $this->logSeasonStatusChanged($event),
            default => null,
        };
    }

    private function logSeasonCreated(SeasonCreated $event): void
    {
        $season = $this->getSeason($event->seasonId);
        if ($season === null || ! $season instanceof SeasonEloquent) {
            return;
        }

        $season->loadMissing('competition.league');
        $competition = $season->competition;
        if ($competition === null) {
            return;
        }

        $league = $competition->league;
        if ($league === null) {
            return;
        }

        $user = $this->getCausedBy();

        activity('league')
            ->causedBy($user)
            ->performedOn($season)
            ->withProperties([
                'league_id' => $league->id,
                'league_name' => $league->name,
                'action' => 'create',
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ])
            ->log("Created season: {$competition->name} - {$season->name}");
    }

    private function logSeasonUpdated(SeasonUpdated $event): void
    {
        $season = $this->getSeason($event->seasonId);
        if ($season === null || ! $season instanceof SeasonEloquent) {
            return;
        }

        $season->loadMissing('competition.league');
        $competition = $season->competition;
        if ($competition === null) {
            return;
        }

        $league = $competition->league;
        if ($league === null) {
            return;
        }

        $user = $this->getCausedBy();

        // Build old and new attributes from changes
        $old = [];
        $new = [];
        foreach ($event->changes as $field => $change) {
            if (isset($change['old'])) {
                $old[$field] = $change['old'];
            }
            if (isset($change['new'])) {
                $new[$field] = $change['new'];
            }
        }

        activity('league')
            ->causedBy($user)
            ->performedOn($season)
            ->withProperties([
                'league_id' => $league->id,
                'league_name' => $league->name,
                'action' => 'update',
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                ],
                'changes' => [
                    'old' => $old,
                    'new' => $new,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ])
            ->log("Updated season: {$competition->name} - {$season->name}");
    }

    private function logSeasonArchived(SeasonArchived $event): void
    {
        $season = $this->getSeason($event->seasonId);
        if ($season === null || ! $season instanceof SeasonEloquent) {
            return;
        }

        $season->loadMissing('competition.league');
        $competition = $season->competition;
        if ($competition === null) {
            return;
        }

        $league = $competition->league;
        if ($league === null) {
            return;
        }

        $user = $this->getCausedBy();

        activity('league')
            ->causedBy($user)
            ->performedOn($season)
            ->withProperties([
                'league_id' => $league->id,
                'league_name' => $league->name,
                'action' => 'archive',
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ])
            ->log("Archived season: {$competition->name} - {$season->name}");
    }

    private function logSeasonDeleted(SeasonDeleted $event): void
    {
        $season = $this->getSeasonWithTrashed($event->seasonId);
        if ($season === null || ! $season instanceof SeasonEloquent) {
            return;
        }

        $season->loadMissing('competition.league');
        $competition = $season->competition;
        if ($competition === null) {
            return;
        }

        $league = $competition->league;
        if ($league === null) {
            return;
        }

        $user = $this->getCausedBy();

        activity('league')
            ->causedBy($user)
            ->performedOn($season)
            ->withProperties([
                'league_id' => $league->id,
                'league_name' => $league->name,
                'action' => 'delete',
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ])
            ->log("Deleted season: {$competition->name} - {$season->name}");
    }

    private function logSeasonStatusChanged(SeasonStatusChanged $event): void
    {
        $season = $this->getSeason($event->seasonId);
        if ($season === null || ! $season instanceof SeasonEloquent) {
            return;
        }

        $season->loadMissing('competition.league');
        $competition = $season->competition;
        if ($competition === null) {
            return;
        }

        $league = $competition->league;
        if ($league === null) {
            return;
        }

        $user = $this->getCausedBy();

        // Determine action based on new status
        $action = match ($event->newStatus) {
            'active' => 'activate',
            'completed' => 'complete',
            'archived' => 'archive',
            default => 'status_change',
        };

        $description = match ($event->newStatus) {
            'active' => "Activated season: {$competition->name} - {$season->name}",
            'completed' => "Completed season: {$competition->name} - {$season->name}",
            'archived' => "Archived season: {$competition->name} - {$season->name}",
            default => "Changed season status: {$competition->name} - {$season->name}",
        };

        activity('league')
            ->causedBy($user)
            ->performedOn($season)
            ->withProperties([
                'league_id' => $league->id,
                'league_name' => $league->name,
                'action' => $action,
                'entity_type' => 'season',
                'entity_id' => $season->id,
                'entity_name' => $season->name,
                'context' => [
                    'competition_id' => $competition->id,
                    'competition_name' => $competition->name,
                    'old_status' => $event->oldStatus,
                    'new_status' => $event->newStatus,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ])
            ->log($description);
    }

    /**
     * Get season model for activity log.
     */
    private function getSeason(int $seasonId): ?Model
    {
        if ($seasonId === 0) {
            return null;
        }

        return SeasonEloquent::find($seasonId);
    }

    /**
     * Get season model for activity log (including soft-deleted).
     */
    private function getSeasonWithTrashed(int $seasonId): ?Model
    {
        if ($seasonId === 0) {
            return null;
        }

        return SeasonEloquent::withTrashed()->find($seasonId);
    }

    /**
     * Get the user who caused this action.
     * League activities are always triggered by authenticated users (web guard).
     */
    private function getCausedBy(): ?Model
    {
        /** @var UserEloquent|null $user */
        $user = Auth::guard('web')->user();

        return $user;
    }
}
