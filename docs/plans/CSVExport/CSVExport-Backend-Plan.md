# CSV Export Feature - Backend Plan

## Overview

This document outlines the backend implementation for CSV export functionality. The backend will provide API endpoints that generate and return CSV files for various result types.

## API Endpoints

### 1. Race/Qualifying Results Export
```
GET /api/races/{raceId}/export/csv
```

**Response:** CSV file download

**Headers:**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="{competition}-{season}-{round}-{race}-results.csv"`

### 2. Round Standings Export
```
GET /api/rounds/{roundId}/export/standings/csv
```

**Response:** CSV file download with round standings

### 3. Round Cross-Division Results Export
```
GET /api/rounds/{roundId}/export/{type}/csv
```

**Types:** `fastest-laps`, `race-times`, `qualifying-times`

**Response:** CSV file download

### 4. Season Standings Export
```
GET /api/seasons/{seasonId}/export/standings/csv
```

**Query Parameters:**
- `division_id` (optional) - Filter by specific division

**Response:** CSV file download

---

## File Structure

```
app/
├── Application/
│   └── Export/
│       ├── Services/
│       │   └── CsvExportService.php
│       └── DTOs/
│           ├── RaceResultExportRow.php
│           ├── RoundStandingExportRow.php
│           ├── CrossDivisionExportRow.php
│           └── SeasonStandingExportRow.php
├── Http/
│   └── Controllers/
│       └── App/
│           └── ExportController.php
└── routes/
    └── subdomain.php (add export routes)
```

---

## Implementation Details

### 1. CsvExportService

Location: `app/Application/Export/Services/CsvExportService.php`

This service handles CSV generation logic for all export types.

```php
<?php

namespace App\Application\Export\Services;

class CsvExportService
{
    /**
     * Generate CSV for race/qualifying results
     */
    public function generateRaceResultsCsv(int $raceId): array;

    /**
     * Generate CSV for round standings
     */
    public function generateRoundStandingsCsv(int $roundId): array;

    /**
     * Generate CSV for cross-division results (fastest laps, race times, qualifying times)
     */
    public function generateCrossDivisionCsv(int $roundId, string $type): array;

    /**
     * Generate CSV for season standings
     */
    public function generateSeasonStandingsCsv(int $seasonId, ?int $divisionId = null): array;

    /**
     * Generate filename for export
     */
    public function generateFilename(string $type, array $context): string;
}
```

### 2. Export DTOs

#### RaceResultExportRow
```php
<?php

namespace App\Application\Export\DTOs;

use Spatie\LaravelData\Data;

class RaceResultExportRow extends Data
{
    public function __construct(
        public int $position,
        public ?string $division,
        public string $driverName,
        public ?string $team,
        public ?string $raceTime,
        public ?string $timeDifference,
        public ?string $penalties,      // Race only
        public ?string $fastestLap,     // Race only
        public ?int $points,
    ) {}

    /**
     * Convert to CSV row array
     */
    public function toCsvRow(bool $isQualifying): array;
}
```

#### RoundStandingExportRow
```php
<?php

namespace App\Application\Export\DTOs;

use Spatie\LaravelData\Data;

class RoundStandingExportRow extends Data
{
    public function __construct(
        public int $position,
        public ?string $division,
        public string $driverName,
        public ?string $team,
        public int $roundPoints,
    ) {}
}
```

#### CrossDivisionExportRow
```php
<?php

namespace App\Application\Export\DTOs;

use Spatie\LaravelData\Data;

class CrossDivisionExportRow extends Data
{
    public function __construct(
        public int $position,
        public ?string $division,
        public string $driverName,
        public ?string $team,
        public string $time,
        public ?string $timeDifference,
    ) {}
}
```

#### SeasonStandingExportRow
```php
<?php

namespace App\Application\Export\DTOs;

use Spatie\LaravelData\Data;

class SeasonStandingExportRow extends Data
{
    public function __construct(
        public int $position,
        public ?string $division,
        public string $driverName,
        public ?string $team,
        public array $rounds,  // Array of [points, hasFastestLap, hasPole]
        public int $totalPoints,
        public ?int $dropRoundTotal,
    ) {}
}
```

### 3. ExportController

Location: `app/Http/Controllers/App/ExportController.php`

```php
<?php

namespace App\Http\Controllers\App;

use App\Application\Export\Services\CsvExportService;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function __construct(
        private CsvExportService $exportService
    ) {}

    /**
     * Export race/qualifying results as CSV
     */
    public function exportRaceResults(int $raceId): StreamedResponse;

    /**
     * Export round standings as CSV
     */
    public function exportRoundStandings(int $roundId): StreamedResponse;

    /**
     * Export cross-division results as CSV
     */
    public function exportCrossDivisionResults(int $roundId, string $type): StreamedResponse;

    /**
     * Export season standings as CSV
     */
    public function exportSeasonStandings(int $seasonId): StreamedResponse;
}
```

### 4. Routes

Add to `routes/subdomain.php` under app subdomain:

```php
// Export routes (authenticated)
Route::prefix('api/export')->middleware(['auth:web', 'user.authenticate'])->group(function () {
    Route::get('/races/{raceId}/csv', [ExportController::class, 'exportRaceResults']);
    Route::get('/rounds/{roundId}/standings/csv', [ExportController::class, 'exportRoundStandings']);
    Route::get('/rounds/{roundId}/{type}/csv', [ExportController::class, 'exportCrossDivisionResults'])
        ->where('type', 'fastest-laps|race-times|qualifying-times');
    Route::get('/seasons/{seasonId}/standings/csv', [ExportController::class, 'exportSeasonStandings']);
});
```

---

## CSV Generation Logic

### Division Grouping
When divisions are enabled:
1. Fetch divisions ordered by their `order` field
2. For each division, fetch drivers sorted by position
3. Output drivers grouped by division in order

### Time Formatting
- Race times: `hh:mm:ss.fff` format
- Time differences: `+mm:ss.fff` or `+ss.fff` for under a minute
- Empty/null times: Leave cell blank

### Points
- Show points value when enabled
- Leave blank when points not enabled for the event

### Filename Generation
Pattern: `{competition-slug}-{season-slug}-{round-number}-{type}.csv`

Examples:
- `vrl-f1-season-2024-round-5-race-1-results.csv`
- `vrl-f1-season-2024-round-5-qualifying-results.csv`
- `vrl-f1-season-2024-round-5-standings.csv`
- `vrl-f1-season-2024-standings.csv`

---

## Data Sources

### Race Results
- Table: `race_results`
- Relations: `race.round.season.competition`, `seasonDriver.team`, `division`

### Round Standings
- Calculated from `round_results` JSON field on `rounds` table
- Or recalculated from `race_results` if needed

### Season Standings
- Use existing `SeasonStandingsCalculator` service
- Or query aggregated data from `season_standings` if cached

---

## Error Handling

| Scenario | Response |
|----------|----------|
| Race not found | 404 Not Found |
| Round not found | 404 Not Found |
| Season not found | 404 Not Found |
| No results available | 200 with empty CSV (headers only) |
| Unauthorized | 401 Unauthorized |

---

## Testing

### Unit Tests
- `CsvExportServiceTest.php`
  - Test CSV generation for each export type
  - Test division grouping logic
  - Test time formatting
  - Test filename generation

### Feature Tests
- `ExportControllerTest.php`
  - Test each endpoint returns correct content-type
  - Test filename in Content-Disposition header
  - Test authorization (only authenticated users)
  - Test 404 for non-existent resources

---

## Dependencies

### Existing Services to Use
- `SeasonStandingsCalculator` - For season standings data
- `RoundResultsCalculator` - For round results data

### New Dependencies
None required - standard Laravel response capabilities are sufficient for CSV generation.

---

## Implementation Checklist

- [ ] Create `CsvExportService` with all generation methods
- [ ] Create export DTOs
- [ ] Create `ExportController`
- [ ] Add routes to `subdomain.php`
- [ ] Add authorization checks
- [ ] Write unit tests for service
- [ ] Write feature tests for controller
- [ ] Test CSV output format manually
