# Round Tiebreaker Rules - Backend Implementation Plan

**Agent**: `dev-be`

## Key Business Rules

1. **Tie-handling ONLY applies when tiebreaker is DISABLED**:
   - Tied drivers receive the **SAME position** (e.g., both "3rd")
   - Tied drivers receive the **SAME round points** (not split/averaged)
   - Next driver **skips positions** (e.g., 5th, not 4th)

2. **When tiebreaker is ENABLED**:
   - Rules determine a winner → normal position assignment (3rd, 4th, 5th...)
   - Only if NO rule breaks the tie do drivers share position (fallback to Mode 1 behavior)

3. **Rules can be edited at any time** - not restricted to season setup status

4. **Qualifying races are EXCLUDED** from the "Best Result from All Races" countback rule

5. Changes apply to future round completions only (already-completed rounds keep their results)

---

## Phase 1: Database Schema

### Migration 1: Add season column
**File**: `database/migrations/xxxx_add_tiebreaker_enabled_to_seasons.php`

```php
Schema::table('seasons', function (Blueprint $table) {
    $table->boolean('round_totals_tiebreaker_rules_enabled')->default(false)->after('total_drop_rounds');
});
```

### Migration 2: Add round column
**File**: `database/migrations/xxxx_add_tiebreaker_info_to_rounds.php`

```php
Schema::table('rounds', function (Blueprint $table) {
    // JSON column for structured tiebreaker information
    $table->json('round_totals_tiebreaker_rules_information')->nullable()->after('team_championship_results');
});
```

**JSON Schema for `round_totals_tiebreaker_rules_information`:**
```json
{
  "tie_groups_resolved": 2,
  "resolutions": [
    {
      "drivers": [123, 456],
      "rule_applied": "highest-qualifying-position",
      "winner_id": 456,
      "explanation": "Driver 456 had a higher qualifying position (P6) than Driver 123 (P7)",
      "data": {
        "driver_123_position": 7,
        "driver_456_position": 6
      }
    },
    {
      "drivers": [789, 101],
      "rule_applied": "best-result-all-races",
      "winner_id": 789,
      "explanation": "Driver 789 placed higher using countback: both had P1 best finish, but Driver 789's second-best (P2) beat Driver 101's (P3)",
      "data": {
        "driver_789_results": [1, 2, 5],
        "driver_101_results": [1, 3, 4]
      }
    }
  ],
  "unresolved_ties": []
}
```

### Migration 3: Create tiebreaker rules table
**File**: `database/migrations/xxxx_create_round_tiebreaker_rules_table.php`

```php
Schema::create('round_tiebreaker_rules', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    $table->unsignedInteger('default_order')->default(0);
    $table->timestamps();

    // Index for active rules lookup
    $table->index(['is_active', 'default_order']);
});
```

### Migration 4: Create pivot table
**File**: `database/migrations/xxxx_create_season_round_tiebreaker_rules_table.php`

```php
Schema::create('season_round_tiebreaker_rules', function (Blueprint $table) {
    $table->id();
    $table->foreignId('season_id')->constrained()->onDelete('cascade');
    $table->foreignId('round_tiebreaker_rule_id')->constrained()->onDelete('cascade');
    $table->unsignedInteger('order');
    $table->timestamps();

    $table->unique(['season_id', 'round_tiebreaker_rule_id']);

    // Composite index for efficient ordering queries
    $table->index(['season_id', 'order']);
});
```

### Seeder: Default rules
**File**: `database/seeders/RoundTiebreakerRulesSeeder.php`

```php
$rules = [
    [
        'name' => 'Highest Qualifying Position',
        'slug' => 'highest-qualifying-position',
        'description' => 'Driver with the higher qualifying position wins the tiebreaker',
        'default_order' => 1,
    ],
    [
        'name' => 'Race 1 Best Result',
        'slug' => 'race-1-best-result',
        'description' => 'Driver with the better Race 1 finish wins the tiebreaker',
        'default_order' => 2,
    ],
    [
        'name' => 'Best Result from All Races',
        'slug' => 'best-result-all-races',
        'description' => 'Countback through all main races (excluding qualifying) - best single finish, then second-best, etc.',
        'default_order' => 3,
    ],
];
```

---

## Phase 2: Domain Layer

### New Value Object: TiebreakerRuleSlug
**File**: `app/Domain/Competition/ValueObjects/TiebreakerRuleSlug.php`

Purpose: Validated, immutable slug for tiebreaker rules.

```php
final readonly class TiebreakerRuleSlug
{
    private const VALID_SLUGS = [
        'highest-qualifying-position',
        'race-1-best-result',
        'best-result-all-races',
    ];

    public function __construct(private string $value)
    {
        if (!in_array($value, self::VALID_SLUGS, true)) {
            throw new InvalidTiebreakerRuleSlugException($value);
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
```

### New Value Object: TiebreakerRuleConfiguration
**File**: `app/Domain/Competition/ValueObjects/TiebreakerRuleConfiguration.php`

Purpose: Immutable collection of ordered tiebreaker rules for a season. Replaces the anemic `SeasonTiebreakerRuleConfig` entity.

```php
final readonly class TiebreakerRuleConfiguration
{
    /**
     * @param array<int, TiebreakerRuleReference> $rules Ordered array of rule references
     */
    public function __construct(
        private array $rules = []
    ) {
        $this->validateNoDuplicates();
    }

    public static function fromArray(array $data): self
    {
        $rules = [];
        foreach ($data as $index => $item) {
            $rules[$index] = new TiebreakerRuleReference(
                ruleId: $item['rule_id'],
                slug: new TiebreakerRuleSlug($item['slug']),
                order: $item['order']
            );
        }
        return new self($rules);
    }

    public function getRules(): array
    {
        return $this->rules;
    }

    public function getOrderedRules(): array
    {
        $sorted = $this->rules;
        usort($sorted, fn($a, $b) => $a->order() <=> $b->order());
        return $sorted;
    }

    public function isEmpty(): bool
    {
        return empty($this->rules);
    }

    public function reorder(array $newOrder): self
    {
        // $newOrder = [ruleId => newOrderPosition]
        $reorderedRules = [];
        foreach ($this->rules as $rule) {
            $newPosition = $newOrder[$rule->ruleId()] ?? $rule->order();
            $reorderedRules[] = $rule->withOrder($newPosition);
        }
        return new self($reorderedRules);
    }

    public function toArray(): array
    {
        return array_map(fn($rule) => $rule->toArray(), $this->rules);
    }

    private function validateNoDuplicates(): void
    {
        $ruleIds = array_map(fn($r) => $r->ruleId(), $this->rules);
        if (count($ruleIds) !== count(array_unique($ruleIds))) {
            throw new DuplicateTiebreakerRuleException();
        }
    }
}
```

### New Value Object: TiebreakerRuleReference
**File**: `app/Domain/Competition/ValueObjects/TiebreakerRuleReference.php`

```php
final readonly class TiebreakerRuleReference
{
    public function __construct(
        private int $ruleId,
        private TiebreakerRuleSlug $slug,
        private int $order
    ) {}

    public function ruleId(): int
    {
        return $this->ruleId;
    }

    public function slug(): TiebreakerRuleSlug
    {
        return $this->slug;
    }

    public function order(): int
    {
        return $this->order;
    }

    public function withOrder(int $newOrder): self
    {
        return new self($this->ruleId, $this->slug, $newOrder);
    }

    public function toArray(): array
    {
        return [
            'rule_id' => $this->ruleId,
            'slug' => $this->slug->value(),
            'order' => $this->order,
        ];
    }
}
```

### New Value Object: TiebreakerInformation
**File**: `app/Domain/Competition/ValueObjects/TiebreakerInformation.php`

Purpose: Structured storage for tiebreaker resolution information. Replaces raw `?string`.

```php
final readonly class TiebreakerInformation
{
    /**
     * @param array<TiebreakerResolution> $resolutions
     * @param array<array{drivers: int[]}> $unresolvedTies
     */
    public function __construct(
        private array $resolutions = [],
        private array $unresolvedTies = []
    ) {}

    public static function empty(): self
    {
        return new self();
    }

    public static function fromJson(?string $json): self
    {
        if ($json === null) {
            return self::empty();
        }

        $data = json_decode($json, true);
        // Parse and construct resolutions...
        return new self(/* ... */);
    }

    public function addResolution(TiebreakerResolution $resolution): self
    {
        return new self(
            [...$this->resolutions, $resolution],
            $this->unresolvedTies
        );
    }

    public function addUnresolvedTie(array $driverIds): self
    {
        return new self(
            $this->resolutions,
            [...$this->unresolvedTies, ['drivers' => $driverIds]]
        );
    }

    public function hasResolutions(): bool
    {
        return !empty($this->resolutions);
    }

    public function getHumanReadableSummary(): string
    {
        if (empty($this->resolutions)) {
            return '';
        }

        $summaries = array_map(
            fn($r) => $r->explanation(),
            $this->resolutions
        );

        return implode('. ', $summaries);
    }

    public function toJson(): string
    {
        return json_encode([
            'tie_groups_resolved' => count($this->resolutions),
            'resolutions' => array_map(fn($r) => $r->toArray(), $this->resolutions),
            'unresolved_ties' => $this->unresolvedTies,
        ]);
    }
}
```

### New Value Object: TiebreakerResolution
**File**: `app/Domain/Competition/ValueObjects/TiebreakerResolution.php`

```php
final readonly class TiebreakerResolution
{
    public function __construct(
        private array $driverIds,
        private TiebreakerRuleSlug $ruleApplied,
        private int $winnerId,
        private string $explanation,
        private array $data = []
    ) {}

    public function driverIds(): array { return $this->driverIds; }
    public function ruleApplied(): TiebreakerRuleSlug { return $this->ruleApplied; }
    public function winnerId(): int { return $this->winnerId; }
    public function explanation(): string { return $this->explanation; }

    public function toArray(): array
    {
        return [
            'drivers' => $this->driverIds,
            'rule_applied' => $this->ruleApplied->value(),
            'winner_id' => $this->winnerId,
            'explanation' => $this->explanation,
            'data' => $this->data,
        ];
    }
}
```

### New Value Object: TiebreakerResult
**File**: `app/Domain/Competition/ValueObjects/TiebreakerResult.php`

```php
final readonly class TiebreakerResult
{
    public function __construct(
        private array $resolvedOrder,       // [driverId => position]
        private TiebreakerInformation $information,
        private bool $fullyResolved         // True if ALL ties broken
    ) {}

    public function resolvedOrder(): array
    {
        return $this->resolvedOrder;
    }

    public function information(): TiebreakerInformation
    {
        return $this->information;
    }

    public function isFullyResolved(): bool
    {
        return $this->fullyResolved;
    }

    public function toSortedDriverIds(): array
    {
        asort($this->resolvedOrder);
        return array_keys($this->resolvedOrder);
    }
}
```

### New Entity: RoundTiebreakerRule
**File**: `app/Domain/Competition/Entities/RoundTiebreakerRule.php`

Properties:
- `id: ?int`
- `name: string`
- `slug: TiebreakerRuleSlug`
- `description: ?string`
- `isActive: bool`
- `defaultOrder: int`

Methods:
- `create()`, `reconstitute()`
- Getters for all properties

### New Domain Events
**File**: `app/Domain/Competition/Events/`

```php
// SeasonTiebreakerRulesEnabled.php
final readonly class SeasonTiebreakerRulesEnabled implements DomainEvent
{
    public function __construct(
        public int $seasonId,
        public TiebreakerRuleConfiguration $configuration,
        public DateTimeImmutable $occurredAt
    ) {}
}

// SeasonTiebreakerRulesDisabled.php
final readonly class SeasonTiebreakerRulesDisabled implements DomainEvent
{
    public function __construct(
        public int $seasonId,
        public DateTimeImmutable $occurredAt
    ) {}
}

// SeasonTiebreakerRulesUpdated.php
final readonly class SeasonTiebreakerRulesUpdated implements DomainEvent
{
    public function __construct(
        public int $seasonId,
        public TiebreakerRuleConfiguration $oldConfiguration,
        public TiebreakerRuleConfiguration $newConfiguration,
        public DateTimeImmutable $occurredAt
    ) {}
}

// RoundTiebreakerApplied.php
final readonly class RoundTiebreakerApplied implements DomainEvent
{
    public function __construct(
        public int $roundId,
        public int $seasonId,
        public TiebreakerInformation $information,
        public DateTimeImmutable $occurredAt
    ) {}
}
```

### New Domain Exceptions
**File**: `app/Domain/Competition/Exceptions/`

```php
// InvalidTiebreakerRuleSlugException.php
final class InvalidTiebreakerRuleSlugException extends DomainException
{
    public function __construct(string $slug)
    {
        parent::__construct("Invalid tiebreaker rule slug: {$slug}");
    }
}

// DuplicateTiebreakerRuleException.php
final class DuplicateTiebreakerRuleException extends DomainException
{
    public function __construct()
    {
        parent::__construct("Duplicate tiebreaker rules are not allowed in configuration");
    }
}

// TiebreakerRuleNotFoundException.php
final class TiebreakerRuleNotFoundException extends DomainException
{
    public function __construct(int $ruleId)
    {
        parent::__construct("Tiebreaker rule not found: {$ruleId}");
    }
}

// InvalidTiebreakerConfigurationException.php
final class InvalidTiebreakerConfigurationException extends DomainException
{
    public function __construct(string $reason)
    {
        parent::__construct("Invalid tiebreaker configuration: {$reason}");
    }
}

// IncompleteTiebreakerDataException.php
final class IncompleteTiebreakerDataException extends DomainException
{
    public function __construct(string $missingData)
    {
        parent::__construct("Incomplete data for tiebreaker calculation: {$missingData}");
    }
}
```

### New Domain Service: RoundTiebreakerDomainService
**File**: `app/Domain/Competition/Services/RoundTiebreakerDomainService.php`

**IMPORTANT**: This service is placed in the **Domain Layer** because it contains pure business logic with NO infrastructure dependencies. It is testable without database or Laravel.

```php
final class RoundTiebreakerDomainService
{
    /**
     * Apply tiebreaker rules to resolve tied drivers.
     *
     * IMPORTANT: This service receives ALL race results including qualifiers.
     * It is responsible for filtering out qualifiers when applying the
     * "best-result-all-races" countback rule.
     *
     * @param array<int, int> $tiedDrivers Driver IDs with same points [driverId => points]
     * @param array $allRaceResults ALL race results for the round (including qualifiers)
     *                              Structure: [raceId => ['is_qualifier' => bool, 'results' => [driverId => position]]]
     * @param array<int, int> $qualifyingPositions [driverId => qualifying position]
     * @param TiebreakerRuleConfiguration $rules Ordered rules to apply
     * @return TiebreakerResult Resolved order with explanations
     */
    public function resolveTies(
        array $tiedDrivers,
        array $allRaceResults,
        array $qualifyingPositions,
        TiebreakerRuleConfiguration $rules
    ): TiebreakerResult {
        // Group drivers by their point totals to find tie groups
        $tieGroups = $this->identifyTieGroups($tiedDrivers);

        $resolvedOrder = [];
        $information = TiebreakerInformation::empty();
        $fullyResolved = true;

        // Filter out qualifying races for countback rule
        $mainRaceResults = $this->filterMainRacesOnly($allRaceResults);

        foreach ($tieGroups as $points => $driverIds) {
            if (count($driverIds) === 1) {
                // No tie, assign position directly
                continue;
            }

            // Apply rules sequentially until tie is broken
            $result = $this->applyRulesSequentially(
                $driverIds,
                $rules->getOrderedRules(),
                $mainRaceResults,
                $qualifyingPositions,
                $allRaceResults
            );

            if ($result !== null) {
                $resolvedOrder = array_merge($resolvedOrder, $result->resolvedOrder());
                $information = $information->addResolution($result->resolution());
            } else {
                // Could not resolve - drivers share position
                $information = $information->addUnresolvedTie($driverIds);
                $fullyResolved = false;
            }
        }

        return new TiebreakerResult($resolvedOrder, $information, $fullyResolved);
    }

    /**
     * Filter to get only main race results (excluding qualifiers).
     * This is called internally before applying the countback rule.
     */
    private function filterMainRacesOnly(array $allRaceResults): array
    {
        return array_filter($allRaceResults, fn($race) => !($race['is_qualifier'] ?? false));
    }

    private function applyRulesSequentially(
        array $driverIds,
        array $orderedRules,
        array $mainRaceResults,
        array $qualifyingPositions,
        array $allRaceResults
    ): ?TiebreakerRuleResult {
        foreach ($orderedRules as $rule) {
            $result = match ($rule->slug()->value()) {
                'highest-qualifying-position' => $this->applyHighestQualifyingRule($driverIds, $qualifyingPositions),
                'race-1-best-result' => $this->applyRace1BestResultRule($driverIds, $allRaceResults),
                'best-result-all-races' => $this->applyBestResultAllRacesRule($driverIds, $mainRaceResults),
                default => null,
            };

            if ($result !== null && $result->isResolved()) {
                return $result;
            }
        }

        return null;
    }

    /**
     * Apply highest qualifying position rule.
     */
    private function applyHighestQualifyingRule(
        array $driverIds,
        array $qualifyingPositions
    ): ?TiebreakerRuleResult {
        $positions = [];
        foreach ($driverIds as $driverId) {
            if (!isset($qualifyingPositions[$driverId])) {
                // Driver has no qualifying position - cannot apply this rule
                return null;
            }
            $positions[$driverId] = $qualifyingPositions[$driverId];
        }

        // Sort by qualifying position (lower is better)
        asort($positions);

        // Check if we have a clear winner
        $positionValues = array_values($positions);
        if ($positionValues[0] === $positionValues[1]) {
            // Still tied
            return null;
        }

        $winnerId = array_key_first($positions);
        $loserId = array_keys($positions)[1];

        return new TiebreakerRuleResult(
            resolvedOrder: array_flip(array_keys($positions)),
            resolution: new TiebreakerResolution(
                driverIds: $driverIds,
                ruleApplied: new TiebreakerRuleSlug('highest-qualifying-position'),
                winnerId: $winnerId,
                explanation: sprintf(
                    "Driver %d had a higher qualifying position (P%d) than Driver %d (P%d)",
                    $winnerId,
                    $positions[$winnerId],
                    $loserId,
                    $positions[$loserId]
                ),
                data: [
                    "driver_{$winnerId}_position" => $positions[$winnerId],
                    "driver_{$loserId}_position" => $positions[$loserId],
                ]
            ),
            isResolved: true
        );
    }

    /**
     * Apply Race 1 best result rule.
     */
    private function applyRace1BestResultRule(
        array $driverIds,
        array $allRaceResults
    ): ?TiebreakerRuleResult {
        // Find Race 1 (first non-qualifying race)
        $race1 = null;
        foreach ($allRaceResults as $raceId => $race) {
            if (!($race['is_qualifier'] ?? false)) {
                $race1 = $race;
                break;
            }
        }

        if ($race1 === null) {
            return null;
        }

        $positions = [];
        foreach ($driverIds as $driverId) {
            $positions[$driverId] = $race1['results'][$driverId] ?? PHP_INT_MAX;
        }

        asort($positions);

        // Check if clear winner
        $positionValues = array_values($positions);
        if ($positionValues[0] === $positionValues[1]) {
            return null;
        }

        $winnerId = array_key_first($positions);

        return new TiebreakerRuleResult(
            resolvedOrder: array_flip(array_keys($positions)),
            resolution: new TiebreakerResolution(
                driverIds: $driverIds,
                ruleApplied: new TiebreakerRuleSlug('race-1-best-result'),
                winnerId: $winnerId,
                explanation: sprintf(
                    "Driver %d finished Race 1 in P%d, higher than other tied drivers",
                    $winnerId,
                    $positions[$winnerId]
                ),
                data: array_combine(
                    array_map(fn($id) => "driver_{$id}_race1_position", array_keys($positions)),
                    array_values($positions)
                )
            ),
            isResolved: true
        );
    }

    /**
     * Apply countback rule (best result from all races).
     * IMPORTANT: This method expects ONLY main race results (qualifiers already filtered out).
     */
    private function applyBestResultAllRacesRule(
        array $driverIds,
        array $mainRaceResults
    ): ?TiebreakerRuleResult {
        // Collect all finishing positions for each driver
        $driverResults = [];
        foreach ($driverIds as $driverId) {
            $results = [];
            foreach ($mainRaceResults as $race) {
                if (isset($race['results'][$driverId])) {
                    $results[] = $race['results'][$driverId];
                }
            }
            sort($results); // Best (lowest) first
            $driverResults[$driverId] = $results;
        }

        // Compare position by position (countback)
        $maxResults = max(array_map('count', $driverResults));

        for ($i = 0; $i < $maxResults; $i++) {
            $currentPositions = [];
            foreach ($driverIds as $driverId) {
                $currentPositions[$driverId] = $driverResults[$driverId][$i] ?? PHP_INT_MAX;
            }

            asort($currentPositions);
            $positionValues = array_values($currentPositions);

            if ($positionValues[0] < $positionValues[1]) {
                // We have a winner at this level
                $winnerId = array_key_first($currentPositions);

                return new TiebreakerRuleResult(
                    resolvedOrder: array_flip(array_keys($currentPositions)),
                    resolution: new TiebreakerResolution(
                        driverIds: $driverIds,
                        ruleApplied: new TiebreakerRuleSlug('best-result-all-races'),
                        winnerId: $winnerId,
                        explanation: $this->buildCountbackExplanation($driverResults, $winnerId, $i),
                        data: array_combine(
                            array_map(fn($id) => "driver_{$id}_results", array_keys($driverResults)),
                            array_values($driverResults)
                        )
                    ),
                    isResolved: true
                );
            }
        }

        return null; // Still tied after checking all results
    }

    private function buildCountbackExplanation(array $driverResults, int $winnerId, int $decisionLevel): string
    {
        if ($decisionLevel === 0) {
            return sprintf(
                "Driver %d had the best single race finish (P%d)",
                $winnerId,
                $driverResults[$winnerId][0]
            );
        }

        $ordinals = ['best', 'second-best', 'third-best', 'fourth-best', 'fifth-best'];
        $ordinal = $ordinals[$decisionLevel] ?? "#{$decisionLevel}";

        return sprintf(
            "Driver %d placed higher using countback: %s finish (P%d) was better",
            $winnerId,
            $ordinal,
            $driverResults[$winnerId][$decisionLevel]
        );
    }

    private function identifyTieGroups(array $driverPoints): array
    {
        $groups = [];
        foreach ($driverPoints as $driverId => $points) {
            $groups[$points][] = $driverId;
        }
        return array_filter($groups, fn($drivers) => count($drivers) > 1);
    }
}
```

### Modify Entity: Season
**File**: `app/Domain/Competition/Entities/Season.php`

Add rich domain model with business logic methods:

```php
// New properties
private bool $roundTotalsTiebreakerRulesEnabled;
private ?TiebreakerRuleConfiguration $tiebreakerRuleConfiguration;

// Business logic methods (NOT just getters/setters)
public function hasTiebreakerRulesEnabled(): bool
{
    return $this->roundTotalsTiebreakerRulesEnabled;
}

public function getTiebreakerRules(): ?TiebreakerRuleConfiguration
{
    return $this->tiebreakerRuleConfiguration;
}

public function enableTiebreakerRules(TiebreakerRuleConfiguration $configuration): void
{
    if ($this->roundTotalsTiebreakerRulesEnabled) {
        return; // Already enabled
    }

    $this->roundTotalsTiebreakerRulesEnabled = true;
    $this->tiebreakerRuleConfiguration = $configuration;

    $this->recordEvent(new SeasonTiebreakerRulesEnabled(
        $this->id,
        $configuration,
        new DateTimeImmutable()
    ));
}

public function disableTiebreakerRules(): void
{
    if (!$this->roundTotalsTiebreakerRulesEnabled) {
        return; // Already disabled
    }

    $this->roundTotalsTiebreakerRulesEnabled = false;
    $this->tiebreakerRuleConfiguration = null;

    $this->recordEvent(new SeasonTiebreakerRulesDisabled(
        $this->id,
        new DateTimeImmutable()
    ));
}

public function updateTiebreakerRules(TiebreakerRuleConfiguration $newConfiguration): void
{
    if (!$this->roundTotalsTiebreakerRulesEnabled) {
        throw new InvalidTiebreakerConfigurationException('Cannot update rules when tiebreaker is disabled');
    }

    $oldConfiguration = $this->tiebreakerRuleConfiguration;
    $this->tiebreakerRuleConfiguration = $newConfiguration;

    $this->recordEvent(new SeasonTiebreakerRulesUpdated(
        $this->id,
        $oldConfiguration,
        $newConfiguration,
        new DateTimeImmutable()
    ));
}

// Update create() and reconstitute() signatures
public static function create(
    // ... existing params ...
    bool $roundTotalsTiebreakerRulesEnabled = false,
    ?TiebreakerRuleConfiguration $tiebreakerRuleConfiguration = null
): self;

public static function reconstitute(
    // ... existing params ...
    bool $roundTotalsTiebreakerRulesEnabled,
    ?TiebreakerRuleConfiguration $tiebreakerRuleConfiguration
): self;
```

### Modify Entity: Round
**File**: `app/Domain/Competition/Entities/Round.php`

```php
// New property - using value object instead of string
private ?TiebreakerInformation $tiebreakerInformation;

// Methods
public function tiebreakerInformation(): ?TiebreakerInformation
{
    return $this->tiebreakerInformation;
}

public function setTiebreakerInformation(TiebreakerInformation $info): void
{
    $this->tiebreakerInformation = $info;

    $this->recordEvent(new RoundTiebreakerApplied(
        $this->id,
        $this->seasonId,
        $info,
        new DateTimeImmutable()
    ));
}

public function clearTiebreakerInformation(): void
{
    $this->tiebreakerInformation = null;
}

// Update create() and reconstitute() signatures
```

---

## Phase 3: Infrastructure Layer

### New Eloquent Model: RoundTiebreakerRuleEloquent
**File**: `app/Infrastructure/Persistence/Eloquent/Models/RoundTiebreakerRuleEloquent.php`

```php
protected $table = 'round_tiebreaker_rules';
protected $fillable = ['name', 'slug', 'description', 'is_active', 'default_order'];
protected $casts = [
    'is_active' => 'boolean',
    'default_order' => 'integer',
];
```

### New Eloquent Model: SeasonRoundTiebreakerRuleEloquent
**File**: `app/Infrastructure/Persistence/Eloquent/Models/SeasonRoundTiebreakerRuleEloquent.php`

```php
protected $table = 'season_round_tiebreaker_rules';
protected $fillable = ['season_id', 'round_tiebreaker_rule_id', 'order'];
protected $casts = [
    'order' => 'integer',
];

// Relationships
public function season(): BelongsTo
{
    return $this->belongsTo(SeasonEloquent::class, 'season_id');
}

public function tiebreakerRule(): BelongsTo
{
    return $this->belongsTo(RoundTiebreakerRuleEloquent::class, 'round_tiebreaker_rule_id');
}
```

### Modify Model: SeasonEloquent
**File**: `app/Infrastructure/Persistence/Eloquent/Models/SeasonEloquent.php`

```php
// Add to $fillable
'round_totals_tiebreaker_rules_enabled',

// Add to $casts
'round_totals_tiebreaker_rules_enabled' => 'boolean',

// Add relationship with proper pivot handling
public function tiebreakerRules(): BelongsToMany
{
    return $this->belongsToMany(
        RoundTiebreakerRuleEloquent::class,
        'season_round_tiebreaker_rules',
        'season_id',
        'round_tiebreaker_rule_id'
    )
    ->withPivot('order')
    ->withTimestamps()
    ->orderBy('season_round_tiebreaker_rules.order');
}
```

### Modify Model: Round
**File**: `app/Infrastructure/Persistence/Eloquent/Models/Round.php`

```php
// Add to $fillable
'round_totals_tiebreaker_rules_information',

// Add to $casts - JSON column
'round_totals_tiebreaker_rules_information' => 'array',
```

### New Repository Interface: RoundTiebreakerRuleRepositoryInterface
**File**: `app/Domain/Competition/Repositories/RoundTiebreakerRuleRepositoryInterface.php`

```php
interface RoundTiebreakerRuleRepositoryInterface
{
    public function findAll(): array;
    public function findAllActive(): array;
    public function findById(int $id): ?RoundTiebreakerRule;
    public function findByIds(array $ids): array;
    public function findBySlug(TiebreakerRuleSlug $slug): ?RoundTiebreakerRule;
    public function save(RoundTiebreakerRule $rule): void;
    public function slugExists(TiebreakerRuleSlug $slug, ?int $excludeId = null): bool;
}
```

### New Repository: EloquentRoundTiebreakerRuleRepository
**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRoundTiebreakerRuleRepository.php`

Implements `RoundTiebreakerRuleRepositoryInterface` with Eloquent.

### Modify Repository: EloquentSeasonRepository
**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonRepository.php`

Update:
- `toEntity()` method to include tiebreaker fields and configuration
- `toEloquent()` method to include tiebreaker fields
- Add method: `syncTiebreakerRules(Season $season, TiebreakerRuleConfiguration $config): void`
- Add method: `findByIdWithTiebreakerRules(int $id): ?Season`

---

## Phase 4: Application Layer

### New DTO: TiebreakerRuleData
**File**: `app/Application/Competition/DTOs/TiebreakerRuleData.php`

```php
class TiebreakerRuleData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?string $description,
        public bool $is_active,
        public int $default_order,
    ) {}
}
```

### New DTO: SeasonTiebreakerRuleData
**File**: `app/Application/Competition/DTOs/SeasonTiebreakerRuleData.php`

```php
class SeasonTiebreakerRuleData extends Data
{
    public function __construct(
        public int $id,
        public int $season_id,
        public int $rule_id,
        public string $rule_name,
        public string $rule_slug,
        public ?string $rule_description,
        public int $order,
    ) {}
}
```

### New DTO: TiebreakerInformationData
**File**: `app/Application/Competition/DTOs/TiebreakerInformationData.php`

```php
class TiebreakerInformationData extends Data
{
    public function __construct(
        public int $tie_groups_resolved,
        public array $resolutions,
        public array $unresolved_ties,
        public string $human_readable_summary,
    ) {}

    public static function fromValueObject(TiebreakerInformation $info): self
    {
        return new self(
            tie_groups_resolved: count($info->getResolutions()),
            resolutions: $info->toArray()['resolutions'],
            unresolved_ties: $info->toArray()['unresolved_ties'],
            human_readable_summary: $info->getHumanReadableSummary(),
        );
    }
}
```

### Modify DTO: CreateSeasonData
**File**: `app/Application/Competition/DTOs/CreateSeasonData.php`

Add:
- `round_totals_tiebreaker_rules_enabled: bool = false`

### Modify DTO: UpdateSeasonData
**File**: `app/Application/Competition/DTOs/UpdateSeasonData.php`

Add:
- `round_totals_tiebreaker_rules_enabled: ?bool`

### Modify DTO: SeasonData
**File**: `app/Application/Competition/DTOs/SeasonData.php`

Add:
- `round_totals_tiebreaker_rules_enabled: bool`
- `tiebreaker_rules: ?DataCollection<SeasonTiebreakerRuleData>`

### Modify DTO: RoundData
**File**: `app/Application/Competition/DTOs/RoundData.php`

Add:
- `tiebreaker_information: ?TiebreakerInformationData`

---

## Phase 5: Integration with RoundApplicationService

### Modify: RoundApplicationService
**File**: `app/Application/Competition/Services/RoundApplicationService.php`

Inject the domain service:
```php
public function __construct(
    // ... existing dependencies ...
    private RoundTiebreakerDomainService $tiebreakerDomainService
) {}
```

Update `sortDriversWithTieBreaking()` method:

```php
/**
 * Sort drivers with tiebreaking logic.
 *
 * @param array $driverPoints [driverId => totalPoints]
 * @param array $raceResultsByDriver [driverId => [raceId => position]]
 * @param array $driverBestTimes [driverId => bestTime]
 * @param array $driverHasDnfOrDns [driverId => bool]
 * @param Season|null $season Season entity for tiebreaker configuration
 * @param array $qualifyingPositions [driverId => qualifyingPosition]
 * @param array $allRaceResults [raceId => ['is_qualifier' => bool, 'results' => [driverId => position]]]
 * @return SortedDriversResult
 */
private function sortDriversWithTieBreaking(
    array $driverPoints,
    array $raceResultsByDriver,
    array $driverBestTimes = [],
    array $driverHasDnfOrDns = [],
    ?Season $season = null,
    array $qualifyingPositions = [],
    array $allRaceResults = []
): SortedDriversResult {
    // Existing sorting logic for initial ordering...

    // If tiebreaker enabled, apply domain service
    if ($season?->hasTiebreakerRulesEnabled() && $season->getTiebreakerRules() !== null) {
        $tiebreakerResult = $this->tiebreakerDomainService->resolveTies(
            $driverPoints,
            $allRaceResults,
            $qualifyingPositions,
            $season->getTiebreakerRules()
        );

        return new SortedDriversResult(
            sortedDriverIds: $tiebreakerResult->toSortedDriverIds(),
            tiebreakerInformation: $tiebreakerResult->information(),
            hasTiebreaker: true
        );
    }

    // Existing fallback logic for tiebreaker disabled...
    return new SortedDriversResult(
        sortedDriverIds: $this->sortWithSharedPositions($driverPoints),
        tiebreakerInformation: null,
        hasTiebreaker: false
    );
}
```

Update `calculateRoundResults()` to:
1. Extract qualifying positions from race results
2. Build `allRaceResults` structure with `is_qualifier` flag
3. Pass to sorting method
4. Store tiebreaker information in round entity

### Tiebreaker Disabled Behavior

When `round_totals_tiebreaker_rules_enabled = false`:

```php
// Tied drivers receive the SAME round points (not split/averaged)
// Example: If drivers tie for 3rd place, both get 3rd place points
// The next driver becomes 5th (skips 4th)

private function assignRoundPointsWithTies(array $sortedDrivers, PointsSystem $pointsSystem): array
{
    $results = [];
    $position = 1;

    foreach ($sortedDrivers as $group) {
        if (is_array($group)) {
            // Tied group - all receive same position's points
            $points = $pointsSystem->getPointsForPosition($position);
            foreach ($group as $driverId) {
                $results[$driverId] = [
                    'position' => $position,
                    'round_points' => $points,
                    'is_tied' => true,
                ];
            }
            $position += count($group); // Skip positions for tied drivers
        } else {
            // Single driver at this position
            $results[$group] = [
                'position' => $position,
                'round_points' => $pointsSystem->getPointsForPosition($position),
                'is_tied' => false,
            ];
            $position++;
        }
    }

    return $results;
}
```

---

## Phase 6: Season Service Updates

### Modify: SeasonApplicationService
**File**: `app/Application/Competition/Services/SeasonApplicationService.php`

Add methods:
- `updateTiebreakerRulesOrder(int $seasonId, array $ruleOrder): void`
- `copyDefaultTiebreakerRules(Season $season): void` - Called on season creation

Update `createSeason()`:
```php
// After saving season, copy default tiebreaker rules if enabled
if ($season->hasTiebreakerRulesEnabled()) {
    $this->copyDefaultTiebreakerRules($season);
}
```

---

## Phase 7: API Endpoints

### New Controller: TiebreakerRuleController
**File**: `app/Http/Controllers/App/TiebreakerRuleController.php`

Endpoints:
- `GET /api/tiebreaker-rules` - List all available rules
- `GET /api/seasons/{season}/tiebreaker-rules` - Get season's configured rules
- `PUT /api/seasons/{season}/tiebreaker-rules` - Update rule order

### New FormRequest: UpdateSeasonTiebreakerRulesRequest
**File**: `app/Http/Requests/App/UpdateSeasonTiebreakerRulesRequest.php`

```php
class UpdateSeasonTiebreakerRulesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'rules' => ['required', 'array', 'min:1'],
            'rules.*.rule_id' => ['required', 'integer', 'exists:round_tiebreaker_rules,id'],
            'rules.*.order' => ['required', 'integer', 'min:1'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $ruleIds = collect($this->input('rules'))->pluck('rule_id');
            $orders = collect($this->input('rules'))->pluck('order');

            // Check for duplicate rule IDs
            if ($ruleIds->count() !== $ruleIds->unique()->count()) {
                $validator->errors()->add('rules', 'Duplicate rule IDs are not allowed');
            }

            // Check for duplicate orders
            if ($orders->count() !== $orders->unique()->count()) {
                $validator->errors()->add('rules', 'Duplicate order values are not allowed');
            }
        });
    }
}
```

### Route Registration
**File**: `routes/subdomain.php`

```php
// Under app subdomain, authenticated routes
Route::middleware(['auth:web', 'user.authenticate'])->group(function () {
    Route::get('/tiebreaker-rules', [TiebreakerRuleController::class, 'index']);
    Route::get('/seasons/{season}/tiebreaker-rules', [TiebreakerRuleController::class, 'show']);
    Route::put('/seasons/{season}/tiebreaker-rules', [TiebreakerRuleController::class, 'update']);
});
```

---

## Phase 8: Tests

### Unit Tests (Domain Layer - Pure PHP, No Database)

1. **TiebreakerRuleSlugTest** - Value object validation
2. **TiebreakerRuleConfigurationTest** - Configuration value object tests
3. **TiebreakerInformationTest** - Information value object tests
4. **TiebreakerResultTest** - Result value object tests
5. **RoundTiebreakerDomainServiceTest** - Core calculation logic
   - Test highest qualifying position rule
   - Test race 1 best result rule
   - Test countback rule (with qualifier exclusion)
   - Test rule priority ordering
   - Test partial resolution (some ties remain)
   - Test full resolution
   - Test explanation generation
   - Test multiple tie groups simultaneously
   - Test edge cases (all drivers tied, missing data)

### Feature Tests (Integration)

1. **TiebreakerRulesApiTest** - API endpoint tests
2. **RoundCalculationWithTiebreakerTest** - Integration tests
   - Test with tiebreaker disabled (shared points)
   - Test with tiebreaker enabled (resolved standings)
   - Test multiple tie groups
   - Test edge cases (all drivers tied, etc.)

---

## Implementation Order

1. Database migrations and seeders
2. Domain layer (value objects, entities, domain events, exceptions, domain service)
3. Infrastructure layer (models, repositories)
4. Application layer (DTOs, application services)
5. Integration with RoundApplicationService
6. SeasonApplicationService updates
7. API endpoints with FormRequest validation
8. Tests

---

## File Summary

### New Files
| File | Type |
|------|------|
| `database/migrations/xxxx_add_tiebreaker_enabled_to_seasons.php` | Migration |
| `database/migrations/xxxx_add_tiebreaker_info_to_rounds.php` | Migration |
| `database/migrations/xxxx_create_round_tiebreaker_rules_table.php` | Migration |
| `database/migrations/xxxx_create_season_round_tiebreaker_rules_table.php` | Migration |
| `database/seeders/RoundTiebreakerRulesSeeder.php` | Seeder |
| `app/Domain/Competition/ValueObjects/TiebreakerRuleSlug.php` | Value Object |
| `app/Domain/Competition/ValueObjects/TiebreakerRuleConfiguration.php` | Value Object |
| `app/Domain/Competition/ValueObjects/TiebreakerRuleReference.php` | Value Object |
| `app/Domain/Competition/ValueObjects/TiebreakerInformation.php` | Value Object |
| `app/Domain/Competition/ValueObjects/TiebreakerResolution.php` | Value Object |
| `app/Domain/Competition/ValueObjects/TiebreakerResult.php` | Value Object |
| `app/Domain/Competition/Entities/RoundTiebreakerRule.php` | Entity |
| `app/Domain/Competition/Services/RoundTiebreakerDomainService.php` | Domain Service |
| `app/Domain/Competition/Events/SeasonTiebreakerRulesEnabled.php` | Domain Event |
| `app/Domain/Competition/Events/SeasonTiebreakerRulesDisabled.php` | Domain Event |
| `app/Domain/Competition/Events/SeasonTiebreakerRulesUpdated.php` | Domain Event |
| `app/Domain/Competition/Events/RoundTiebreakerApplied.php` | Domain Event |
| `app/Domain/Competition/Exceptions/InvalidTiebreakerRuleSlugException.php` | Exception |
| `app/Domain/Competition/Exceptions/DuplicateTiebreakerRuleException.php` | Exception |
| `app/Domain/Competition/Exceptions/TiebreakerRuleNotFoundException.php` | Exception |
| `app/Domain/Competition/Exceptions/InvalidTiebreakerConfigurationException.php` | Exception |
| `app/Domain/Competition/Exceptions/IncompleteTiebreakerDataException.php` | Exception |
| `app/Domain/Competition/Repositories/RoundTiebreakerRuleRepositoryInterface.php` | Interface |
| `app/Infrastructure/Persistence/Eloquent/Models/RoundTiebreakerRuleEloquent.php` | Model |
| `app/Infrastructure/Persistence/Eloquent/Models/SeasonRoundTiebreakerRuleEloquent.php` | Model |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRoundTiebreakerRuleRepository.php` | Repository |
| `app/Application/Competition/DTOs/TiebreakerRuleData.php` | DTO |
| `app/Application/Competition/DTOs/SeasonTiebreakerRuleData.php` | DTO |
| `app/Application/Competition/DTOs/TiebreakerInformationData.php` | DTO |
| `app/Http/Controllers/App/TiebreakerRuleController.php` | Controller |
| `app/Http/Requests/App/UpdateSeasonTiebreakerRulesRequest.php` | FormRequest |
| `tests/Unit/Domain/Competition/ValueObjects/TiebreakerRuleSlugTest.php` | Test |
| `tests/Unit/Domain/Competition/ValueObjects/TiebreakerRuleConfigurationTest.php` | Test |
| `tests/Unit/Domain/Competition/Services/RoundTiebreakerDomainServiceTest.php` | Test |
| `tests/Feature/TiebreakerRulesApiTest.php` | Test |
| `tests/Feature/RoundCalculationWithTiebreakerTest.php` | Test |

### Modified Files
| File | Changes |
|------|---------|
| `app/Domain/Competition/Entities/Season.php` | Add tiebreaker property, configuration, and business logic methods |
| `app/Domain/Competition/Entities/Round.php` | Add TiebreakerInformation value object and methods |
| `app/Infrastructure/Persistence/Eloquent/Models/SeasonEloquent.php` | Add fillable, cast, BelongsToMany relationship with pivot |
| `app/Infrastructure/Persistence/Eloquent/Models/Round.php` | Add fillable, JSON cast |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonRepository.php` | Update mapping, add sync methods |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRoundRepository.php` | Update mapping |
| `app/Application/Competition/DTOs/CreateSeasonData.php` | Add tiebreaker field |
| `app/Application/Competition/DTOs/UpdateSeasonData.php` | Add tiebreaker field |
| `app/Application/Competition/DTOs/SeasonData.php` | Add tiebreaker fields |
| `app/Application/Competition/DTOs/RoundData.php` | Add TiebreakerInformationData field |
| `app/Application/Competition/Services/RoundApplicationService.php` | Inject domain service, update sorting method |
| `app/Application/Competition/Services/SeasonApplicationService.php` | Add rule management methods |
| `routes/subdomain.php` | Add new endpoints |
