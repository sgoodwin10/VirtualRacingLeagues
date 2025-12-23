<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\Events\SeasonArchived;
use App\Domain\Competition\Events\SeasonCreated;
use App\Domain\Competition\Events\SeasonDeleted;
use App\Domain\Competition\Events\SeasonStatusChanged;
use App\Domain\Competition\Events\SeasonUpdated;
use App\Domain\Competition\Events\SeasonTiebreakerRulesEnabled;
use App\Domain\Competition\Events\SeasonTiebreakerRulesDisabled;
use App\Domain\Competition\Events\SeasonTiebreakerRulesUpdated;
use App\Domain\Competition\Exceptions\SeasonIsArchivedException;
use App\Domain\Competition\ValueObjects\SeasonName;
use App\Domain\Competition\ValueObjects\SeasonSlug;
use App\Domain\Competition\ValueObjects\SeasonStatus;
use App\Domain\Competition\ValueObjects\TiebreakerRuleConfiguration;
use DateTimeImmutable;

/**
 * Season Domain Entity.
 *
 * Represents a time-bound championship period within a competition.
 * Aggregate root managing season lifecycle and settings.
 *
 * Key Business Rules:
 * 1. Season belongs to a competition (immutable relationship)
 * 2. Slug must be unique per competition
 * 3. Cannot modify archived seasons
 * 4. Logo inherits from competition if not specified
 * 5. Status transitions: setup → active → completed → archived
 * 6. Soft deletion cascades to season_drivers but preserves league drivers
 */
final class Season
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $competitionId,
        private SeasonName $name,
        private SeasonSlug $slug,
        private ?string $carClass,
        private ?string $description,
        private ?string $technicalSpecs,
        private ?string $logoPath,
        private ?string $bannerPath,
        private bool $teamChampionshipEnabled,
        private ?int $teamsDriversForCalculation,
        private bool $teamsDropRounds,
        private ?int $teamsTotalDropRounds,
        private bool $raceDivisionsEnabled,
        private bool $raceTimesRequired,
        private bool $dropRound,
        private int $totalDropRounds,
        private bool $roundTotalsTiebreakerRulesEnabled,
        private TiebreakerRuleConfiguration $tiebreakerRuleConfiguration,
        private SeasonStatus $status,
        private int $createdByUserId,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt,
    ) {
    }

    /**
     * Create a new season.
     *
     * @throws \InvalidArgumentException if dropRound is false but totalDropRounds > 0
     * @throws \InvalidArgumentException if teamsDropRounds is false but teamsTotalDropRounds > 0
     */
    public static function create(
        int $competitionId,
        SeasonName $name,
        SeasonSlug $slug,
        int $createdByUserId,
        ?string $carClass = null,
        ?string $description = null,
        ?string $technicalSpecs = null,
        ?string $logoPath = null,
        ?string $bannerPath = null,
        bool $teamChampionshipEnabled = false,
        ?int $teamsDriversForCalculation = null,
        bool $teamsDropRounds = false,
        ?int $teamsTotalDropRounds = null,
        bool $raceDivisionsEnabled = false,
        bool $raceTimesRequired = true,
        bool $dropRound = false,
        int $totalDropRounds = 0,
    ): self {
        // Validate business rule: cannot have totalDropRounds > 0 when dropRound is disabled
        if (!$dropRound && $totalDropRounds > 0) {
            throw new \InvalidArgumentException(
                'Cannot set total drop rounds to a value greater than 0 when drop round feature is disabled'
            );
        }

        // Validate business rule: cannot have teamsTotalDropRounds > 0 when teamsDropRounds is disabled
        if (!$teamsDropRounds && $teamsTotalDropRounds !== null && $teamsTotalDropRounds > 0) {
            throw new \InvalidArgumentException(
                'Cannot set teams total drop rounds to a value greater than 0 ' .
                'when teams drop rounds feature is disabled'
            );
        }

        $now = new DateTimeImmutable();

        return new self(
            id: null,
            competitionId: $competitionId,
            name: $name,
            slug: $slug,
            carClass: $carClass,
            description: $description,
            technicalSpecs: $technicalSpecs,
            logoPath: $logoPath,
            bannerPath: $bannerPath,
            teamChampionshipEnabled: $teamChampionshipEnabled,
            teamsDriversForCalculation: $teamsDriversForCalculation,
            teamsDropRounds: $teamsDropRounds,
            teamsTotalDropRounds: $teamsTotalDropRounds,
            raceDivisionsEnabled: $raceDivisionsEnabled,
            raceTimesRequired: $raceTimesRequired,
            dropRound: $dropRound,
            totalDropRounds: $totalDropRounds,
            roundTotalsTiebreakerRulesEnabled: false,
            tiebreakerRuleConfiguration: TiebreakerRuleConfiguration::empty(),
            status: SeasonStatus::SETUP,
            createdByUserId: $createdByUserId,
            createdAt: $now,
            updatedAt: $now,
            deletedAt: null,
        );
    }

    /**
     * Reconstitute season from persistence.
     */
    public static function reconstitute(
        int $id,
        int $competitionId,
        SeasonName $name,
        SeasonSlug $slug,
        int $createdByUserId,
        SeasonStatus $status,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?string $carClass = null,
        ?string $description = null,
        ?string $technicalSpecs = null,
        ?string $logoPath = null,
        ?string $bannerPath = null,
        bool $teamChampionshipEnabled = false,
        ?int $teamsDriversForCalculation = null,
        bool $teamsDropRounds = false,
        ?int $teamsTotalDropRounds = null,
        bool $raceDivisionsEnabled = false,
        bool $raceTimesRequired = true,
        bool $dropRound = false,
        int $totalDropRounds = 0,
        bool $roundTotalsTiebreakerRulesEnabled = false,
        ?TiebreakerRuleConfiguration $tiebreakerRuleConfiguration = null,
        ?DateTimeImmutable $deletedAt = null,
    ): self {
        return new self(
            id: $id,
            competitionId: $competitionId,
            name: $name,
            slug: $slug,
            carClass: $carClass,
            description: $description,
            technicalSpecs: $technicalSpecs,
            logoPath: $logoPath,
            bannerPath: $bannerPath,
            teamChampionshipEnabled: $teamChampionshipEnabled,
            teamsDriversForCalculation: $teamsDriversForCalculation,
            teamsDropRounds: $teamsDropRounds,
            teamsTotalDropRounds: $teamsTotalDropRounds,
            raceDivisionsEnabled: $raceDivisionsEnabled,
            raceTimesRequired: $raceTimesRequired,
            dropRound: $dropRound,
            totalDropRounds: $totalDropRounds,
            roundTotalsTiebreakerRulesEnabled: $roundTotalsTiebreakerRulesEnabled,
            tiebreakerRuleConfiguration: $tiebreakerRuleConfiguration ?? TiebreakerRuleConfiguration::empty(),
            status: $status,
            createdByUserId: $createdByUserId,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt,
        );
    }

    /**
     * Record the SeasonCreated event after ID has been set by repository.
     * This must be called by the application service after save().
     */
    public function recordCreationEvent(int $leagueId): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new SeasonCreated(
            seasonId: $this->id,
            competitionId: $this->competitionId,
            leagueId: $leagueId,
            name: $this->name->value(),
            slug: $this->slug->value(),
            createdByUserId: $this->createdByUserId,
            occurredAt: $this->createdAt->format('Y-m-d H:i:s'),
        ));
    }

    // Getters

    public function id(): ?int
    {
        return $this->id;
    }

    public function competitionId(): int
    {
        return $this->competitionId;
    }

    public function name(): SeasonName
    {
        return $this->name;
    }

    public function slug(): SeasonSlug
    {
        return $this->slug;
    }

    public function carClass(): ?string
    {
        return $this->carClass;
    }

    public function description(): ?string
    {
        return $this->description;
    }

    public function technicalSpecs(): ?string
    {
        return $this->technicalSpecs;
    }

    public function logoPath(): ?string
    {
        return $this->logoPath;
    }

    public function bannerPath(): ?string
    {
        return $this->bannerPath;
    }

    public function teamChampionshipEnabled(): bool
    {
        return $this->teamChampionshipEnabled;
    }

    public function raceDivisionsEnabled(): bool
    {
        return $this->raceDivisionsEnabled;
    }

    public function raceTimesRequired(): bool
    {
        return $this->raceTimesRequired;
    }

    public function hasDropRound(): bool
    {
        return $this->dropRound;
    }

    public function getTotalDropRounds(): int
    {
        return $this->totalDropRounds;
    }

    public function getTeamsDriversForCalculation(): ?int
    {
        return $this->teamsDriversForCalculation;
    }

    public function hasTeamsDropRounds(): bool
    {
        return $this->teamsDropRounds;
    }

    public function getTeamsTotalDropRounds(): ?int
    {
        return $this->teamsTotalDropRounds;
    }

    public function status(): SeasonStatus
    {
        return $this->status;
    }

    public function createdByUserId(): int
    {
        return $this->createdByUserId;
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function deletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    // Business Logic Methods

    /**
     * Update season details.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function updateDetails(
        SeasonName $name,
        ?string $carClass,
        ?string $description,
        ?string $technicalSpecs,
    ): void {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        $changes = [];

        if (!$this->name->equals($name)) {
            $changes['name'] = [
                'old' => $this->name->value(),
                'new' => $name->value(),
            ];
            $this->name = $name;
        }

        if ($this->carClass !== $carClass) {
            $changes['car_class'] = [
                'old' => $this->carClass,
                'new' => $carClass,
            ];
            $this->carClass = $carClass;
        }

        if ($this->description !== $description) {
            $changes['description'] = [
                'old' => $this->description,
                'new' => $description,
            ];
            $this->description = $description;
        }

        if ($this->technicalSpecs !== $technicalSpecs) {
            $changes['technical_specs'] = [
                'old' => $this->technicalSpecs,
                'new' => $technicalSpecs,
            ];
            $this->technicalSpecs = $technicalSpecs;
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update season branding (logo and banner).
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function updateBranding(?string $logoPath, ?string $bannerPath): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        $changes = [];

        if ($this->logoPath !== $logoPath) {
            $changes['logo_path'] = [
                'old' => $this->logoPath,
                'new' => $logoPath,
            ];
            $this->logoPath = $logoPath;
        }

        if ($this->bannerPath !== $bannerPath) {
            $changes['banner_path'] = [
                'old' => $this->bannerPath,
                'new' => $bannerPath,
            ];
            $this->bannerPath = $bannerPath;
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update season slug.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function updateSlug(SeasonSlug $slug): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if (!$this->slug->equals($slug)) {
            $this->slug = $slug;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    /**
     * Enable team championship.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function enableTeamChampionship(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if (!$this->teamChampionshipEnabled) {
            $this->teamChampionshipEnabled = true;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['team_championship_enabled' => ['old' => false, 'new' => true]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Disable team championship.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function disableTeamChampionship(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if ($this->teamChampionshipEnabled) {
            $this->teamChampionshipEnabled = false;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['team_championship_enabled' => ['old' => true, 'new' => false]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Enable race divisions.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function enableRaceDivisions(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if (!$this->raceDivisionsEnabled) {
            $this->raceDivisionsEnabled = true;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['race_divisions_enabled' => ['old' => false, 'new' => true]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Disable race divisions.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function disableRaceDivisions(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if ($this->raceDivisionsEnabled) {
            $this->raceDivisionsEnabled = false;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['race_divisions_enabled' => ['old' => true, 'new' => false]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Enable race times requirement.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function enableRaceTimes(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if (!$this->raceTimesRequired) {
            $this->raceTimesRequired = true;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['race_times_required' => ['old' => false, 'new' => true]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Disable race times requirement.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function disableRaceTimes(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if ($this->raceTimesRequired) {
            $this->raceTimesRequired = false;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['race_times_required' => ['old' => true, 'new' => false]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Enable drop round feature.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function enableDropRound(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if (!$this->dropRound) {
            $this->dropRound = true;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['drop_round' => ['old' => false, 'new' => true]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Disable drop round feature.
     * Automatically resets totalDropRounds to 0 when disabled.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function disableDropRound(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if ($this->dropRound) {
            $changes = ['drop_round' => ['old' => true, 'new' => false]];

            $this->dropRound = false;

            // Business rule: when drop round is disabled, totalDropRounds must be reset to 0
            if ($this->totalDropRounds > 0) {
                $changes['total_drop_rounds'] = ['old' => $this->totalDropRounds, 'new' => 0];
                $this->totalDropRounds = 0;
            }

            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update the number of rounds to drop.
     *
     * @throws SeasonIsArchivedException if season is archived
     * @throws \InvalidArgumentException if trying to set totalDropRounds > 0 when dropRound is disabled
     */
    public function updateTotalDropRounds(int $totalDropRounds): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        // Validate business rule: cannot set totalDropRounds > 0 when drop round is disabled
        if (!$this->dropRound && $totalDropRounds > 0) {
            throw new \InvalidArgumentException(
                'Cannot set total drop rounds to a value greater than 0 when drop round feature is disabled. ' .
                'Enable drop round first.'
            );
        }

        if ($this->totalDropRounds !== $totalDropRounds) {
            $oldTotal = $this->totalDropRounds;
            $this->totalDropRounds = $totalDropRounds;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['total_drop_rounds' => ['old' => $oldTotal, 'new' => $totalDropRounds]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update the number of drivers' points to count towards team scores.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function updateTeamsDriversForCalculation(?int $count): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if ($this->teamsDriversForCalculation !== $count) {
            $oldCount = $this->teamsDriversForCalculation;
            $this->teamsDriversForCalculation = $count;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['teams_drivers_for_calculation' => ['old' => $oldCount, 'new' => $count]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Enable teams drop rounds feature.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function enableTeamsDropRounds(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if (!$this->teamsDropRounds) {
            $this->teamsDropRounds = true;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['teams_drop_rounds' => ['old' => false, 'new' => true]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Disable teams drop rounds feature.
     * Automatically resets teamsTotalDropRounds to null when disabled.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function disableTeamsDropRounds(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if ($this->teamsDropRounds) {
            $changes = ['teams_drop_rounds' => ['old' => true, 'new' => false]];

            $this->teamsDropRounds = false;

            // Business rule: when teams drop rounds is disabled, teamsTotalDropRounds must be reset to null
            if ($this->teamsTotalDropRounds !== null) {
                $changes['teams_total_drop_rounds'] = ['old' => $this->teamsTotalDropRounds, 'new' => null];
                $this->teamsTotalDropRounds = null;
            }

            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update the number of rounds to drop for teams.
     *
     * @throws SeasonIsArchivedException if season is archived
     * @throws \InvalidArgumentException if trying to set teamsTotalDropRounds > 0 when teamsDropRounds is disabled
     */
    public function updateTeamsTotalDropRounds(?int $totalDropRounds): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        // Validate business rule: cannot set teamsTotalDropRounds > 0 when teams drop rounds is disabled
        if (!$this->teamsDropRounds && $totalDropRounds !== null && $totalDropRounds > 0) {
            throw new \InvalidArgumentException(
                'Cannot set teams total drop rounds to a value greater than 0 ' .
                'when teams drop rounds feature is disabled. Enable teams drop rounds first.'
            );
        }

        if ($this->teamsTotalDropRounds !== $totalDropRounds) {
            $oldTotal = $this->teamsTotalDropRounds;
            $this->teamsTotalDropRounds = $totalDropRounds;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonUpdated(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                changes: ['teams_total_drop_rounds' => ['old' => $oldTotal, 'new' => $totalDropRounds]],
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Change season status.
     *
     * @throws SeasonIsArchivedException if season is archived and not restoring
     */
    public function changeStatus(SeasonStatus $newStatus): void
    {
        $this->ensureHasId();

        if ($this->status === $newStatus) {
            return;
        }

        // Prevent changing status of archived seasons unless we're restoring (moving from archived to another status)
        if ($this->status->isArchived() && $newStatus->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        $oldStatus = $this->status;
        $this->status = $newStatus;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonStatusChanged(
            seasonId: $this->id,
            competitionId: $this->competitionId,
            oldStatus: $oldStatus->value,
            newStatus: $newStatus->value,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Activate the season.
     */
    public function activate(): void
    {
        $this->changeStatus(SeasonStatus::ACTIVE);
    }

    /**
     * Complete the season.
     */
    public function complete(): void
    {
        $this->changeStatus(SeasonStatus::COMPLETED);
    }

    /**
     * Archive the season.
     */
    public function archive(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            return; // Already archived
        }

        $this->status = SeasonStatus::ARCHIVED;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonArchived(
            seasonId: $this->id,
            competitionId: $this->competitionId,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    /**
     * Restore from archived status.
     * By default restores to completed status, but can specify a target status.
     *
     * @param SeasonStatus|null $targetStatus The status to restore to (default: COMPLETED)
     */
    public function restore(?SeasonStatus $targetStatus = null): void
    {
        if (!$this->status->isArchived()) {
            return; // Not archived
        }

        $this->changeStatus($targetStatus ?? SeasonStatus::COMPLETED);
    }

    /**
     * Soft delete the season.
     */
    public function delete(): void
    {
        $this->ensureHasId();

        if ($this->deletedAt !== null) {
            return; // Already deleted
        }

        $this->deletedAt = new DateTimeImmutable();
        $this->updatedAt = $this->deletedAt;

        $this->recordEvent(new SeasonDeleted(
            seasonId: $this->id,
            competitionId: $this->competitionId,
            occurredAt: $this->deletedAt->format('Y-m-d H:i:s'),
        ));
    }

    // Status Checks

    public function isSetup(): bool
    {
        return $this->status->isSetup();
    }

    public function isActive(): bool
    {
        return $this->status->isActive();
    }

    public function isCompleted(): bool
    {
        return $this->status->isCompleted();
    }

    public function isArchived(): bool
    {
        return $this->status->isArchived();
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    // Domain Events Management

    /**
     * Ensure the entity has been persisted and has an ID.
     *
     * @throws \LogicException if entity has no ID
     * @phpstan-assert !null $this->id
     */
    private function ensureHasId(): void
    {
        if ($this->id === null) {
            throw new \LogicException(
                'Cannot perform this operation on an unpersisted entity. ' .
                'The entity must be saved to the database first.'
            );
        }
    }

    /**
     * Record a domain event.
     */
    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * Get recorded domain events and clear them.
     *
     * @return array<object>
     */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];

        return $events;
    }

    /**
     * Clear all recorded events without returning them.
     */
    public function clearEvents(): void
    {
        $this->domainEvents = [];
    }

    /**
     * Check if entity has recorded events.
     */
    public function hasEvents(): bool
    {
        return !empty($this->domainEvents);
    }

    // Tiebreaker Rules Methods

    public function hasTiebreakerRulesEnabled(): bool
    {
        return $this->roundTotalsTiebreakerRulesEnabled;
    }

    public function getTiebreakerRules(): TiebreakerRuleConfiguration
    {
        return $this->tiebreakerRuleConfiguration;
    }

    /**
     * Enable tiebreaker rules.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function enableTiebreakerRules(TiebreakerRuleConfiguration $configuration): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if (!$this->roundTotalsTiebreakerRulesEnabled) {
            $this->roundTotalsTiebreakerRulesEnabled = true;
            $this->tiebreakerRuleConfiguration = $configuration;
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonTiebreakerRulesEnabled(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                ruleSlugs: $configuration->getSlugsInOrder(),
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Disable tiebreaker rules.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function disableTiebreakerRules(): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        if ($this->roundTotalsTiebreakerRulesEnabled) {
            $this->roundTotalsTiebreakerRulesEnabled = false;
            $this->tiebreakerRuleConfiguration = TiebreakerRuleConfiguration::empty();
            $this->updatedAt = new DateTimeImmutable();

            $this->recordEvent(new SeasonTiebreakerRulesDisabled(
                seasonId: $this->id,
                competitionId: $this->competitionId,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    /**
     * Update tiebreaker rules configuration.
     *
     * @throws SeasonIsArchivedException if season is archived
     */
    public function updateTiebreakerRules(TiebreakerRuleConfiguration $configuration): void
    {
        $this->ensureHasId();

        if ($this->status->isArchived()) {
            throw SeasonIsArchivedException::withId($this->id);
        }

        $oldConfiguration = $this->tiebreakerRuleConfiguration;
        $this->tiebreakerRuleConfiguration = $configuration;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonTiebreakerRulesUpdated(
            seasonId: $this->id,
            competitionId: $this->competitionId,
            changes: [
                'old' => $oldConfiguration->toArray(),
                'new' => $configuration->toArray(),
            ],
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }
}
