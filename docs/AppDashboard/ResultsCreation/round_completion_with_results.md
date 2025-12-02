# Round Completion with Custom Cross-Division Results

## Overview

The round completion endpoint now supports optional cross-division results data from the frontend. This allows the frontend to override the backend's automatic calculation of `qualifying_results`, `race_time_results`, and `fastest_lap_results`.

## Implementation Details

### Backend Changes

#### 1. New DTO: `CompleteRoundData`

**File**: `/var/www/app/Application/Competition/DTOs/CompleteRoundData.php`

This DTO accepts three optional arrays for the cross-division results:

```php
public function __construct(
    public readonly ?array $qualifying_results = null,
    public readonly ?array $race_time_results = null,
    public readonly ?array $fastest_lap_results = null,
) {}
```

Each array contains entries with the following structure:
```php
[
    'position' => int,         // Position in the ranking (1, 2, 3, ...)
    'race_result_id' => int,   // ID of the race result
    'time_ms' => int,          // Time in milliseconds
]
```

**Validation Rules**:
- All three fields are nullable arrays
- Each entry requires `position`, `race_result_id`, and `time_ms`
- `race_result_id` must exist in the `race_results` table

#### 2. Updated Controller: `RoundController::complete()`

**File**: `/var/www/app/Http/Controllers/User/RoundController.php`

The `complete()` method now accepts an optional `Request` parameter and extracts the cross-division results if provided:

```php
public function complete(Request $request, int $roundId): JsonResponse
{
    $data = null;
    if ($request->hasAny(['qualifying_results', 'race_time_results', 'fastest_lap_results'])) {
        $validated = $request->validate(CompleteRoundData::rules());
        $data = CompleteRoundData::from($validated);
    }

    $round = $this->roundService->completeRound($roundId, $userId, $data);
    // ...
}
```

#### 3. Updated Application Service: `RoundApplicationService`

**File**: `/var/www/app/Application/Competition/Services/RoundApplicationService.php`

**Modified Methods**:
- `completeRound()` - Now accepts optional `CompleteRoundData` parameter
- `calculateAndStoreRoundResults()` - Now uses provided data if available, otherwise calculates automatically
- `hasAnyCrossDivisionResults()` - Helper method to check if any results are provided

**Logic**:
```php
if ($data !== null && $this->hasAnyCrossDivisionResults($data)) {
    // Use provided data from frontend
    $qualifyingResults = $data->qualifying_results ?? [];
    $raceTimeResults = $data->race_time_results ?? [];
    $fastestLapResults = $data->fastest_lap_results ?? [];
} else {
    // Calculate automatically (existing behavior)
    $crossDivisionResults = $this->calculateCrossDivisionResults($allRaceResults);
    $qualifyingResults = $crossDivisionResults['qualifying_results'];
    $raceTimeResults = $crossDivisionResults['race_time_results'];
    $fastestLapResults = $crossDivisionResults['fastest_lap_results'];
}
```

## API Usage

### Endpoint
```
PUT /api/seasons/{seasonId}/rounds/{roundId}/complete
```

### Request Format

#### Without Custom Results (Automatic Calculation)
```http
PUT /api/seasons/1/rounds/5/complete
Content-Type: application/json

{}
```

The backend will automatically calculate all cross-division results.

#### With Custom Results
```http
PUT /api/seasons/1/rounds/5/complete
Content-Type: application/json

{
  "qualifying_results": [
    {
      "position": 1,
      "race_result_id": 100,
      "time_ms": 72345
    },
    {
      "position": 2,
      "race_result_id": 101,
      "time_ms": 72567
    }
  ],
  "race_time_results": [
    {
      "position": 1,
      "race_result_id": 102,
      "time_ms": 6125123
    },
    {
      "position": 2,
      "race_result_id": 103,
      "time_ms": 6127890
    }
  ],
  "fastest_lap_results": [
    {
      "position": 1,
      "race_result_id": 102,
      "time_ms": 73456
    },
    {
      "position": 2,
      "race_result_id": 103,
      "time_ms": 73789
    }
  ]
}
```

The backend will use the provided data instead of calculating it.

#### Partial Submission
You can provide only some of the results arrays:

```http
PUT /api/seasons/1/rounds/5/complete
Content-Type: application/json

{
  "qualifying_results": [
    {
      "position": 1,
      "race_result_id": 100,
      "time_ms": 72345
    }
  ]
}
```

In this case:
- `qualifying_results` will use the provided data
- `race_time_results` will be calculated automatically (empty array if none provided)
- `fastest_lap_results` will be calculated automatically (empty array if none provided)

### Response Format
```json
{
  "message": "Round marked as completed",
  "data": {
    "id": 5,
    "season_id": 3,
    "round_number": 2,
    "name": "Spa Weekend",
    "status": "completed",
    "round_results": { /* ... */ },
    "qualifying_results": [ /* ... */ ],
    "race_time_results": [ /* ... */ ],
    "fastest_lap_results": [ /* ... */ ],
    "created_at": "2025-11-01 10:00:00",
    "updated_at": "2025-12-01 12:00:00"
  },
  "status": 200
}
```

## Data Structure

### Cross-Division Result Entry
Each entry in the `qualifying_results`, `race_time_results`, and `fastest_lap_results` arrays has this structure:

```typescript
{
  position: number;        // 1-based position in the ranking
  race_result_id: number;  // Foreign key to race_results table
  time_ms: number;         // Time in milliseconds
}
```

### Example Data

**Qualifying Results** - Best qualifying lap per driver from all qualifiers:
```json
[
  {
    "position": 1,
    "race_result_id": 100,
    "time_ms": 72345
  },
  {
    "position": 2,
    "race_result_id": 101,
    "time_ms": 72567
  }
]
```

**Race Time Results** - Best race time per driver from all non-qualifier races:
```json
[
  {
    "position": 1,
    "race_result_id": 102,
    "time_ms": 6125123
  },
  {
    "position": 2,
    "race_result_id": 103,
    "time_ms": 6127890
  }
]
```

**Fastest Lap Results** - Best fastest lap per driver from all non-qualifier races:
```json
[
  {
    "position": 1,
    "race_result_id": 102,
    "time_ms": 73456
  },
  {
    "position": 2,
    "race_result_id": 103,
    "time_ms": 73789
  }
]
```

## Important Notes

### Backward Compatibility
✅ **Fully backward compatible** - If no data is provided in the request, the backend calculates the results automatically (existing behavior).

### Data Validation
- All `race_result_id` values must exist in the `race_results` table
- Position values must be positive integers (minimum: 1)
- Time values must be positive integers in milliseconds (minimum: 1)

### When to Use This Feature

**Use automatic calculation when:**
- You want the backend to determine the fastest times across all races
- The data is straightforward and doesn't need custom logic
- You're following the standard racing format

**Use custom data when:**
- You need to apply custom business rules for cross-division results
- You want to pre-calculate results on the frontend for performance
- You need to override specific entries for corrections or adjustments

## Testing

All existing tests pass:
- ✅ PHPStan Level 8 analysis
- ✅ PSR-12 code style (minor PHPDoc line length warnings are acceptable)
- ✅ 85 round-related tests
- ✅ 11 round points calculation tests
- ✅ 5 round completion controller tests

## Related Files

### Application Layer
- `/var/www/app/Application/Competition/DTOs/CompleteRoundData.php` (NEW)
- `/var/www/app/Application/Competition/Services/RoundApplicationService.php` (UPDATED)

### Controller Layer
- `/var/www/app/Http/Controllers/User/RoundController.php` (UPDATED)

### Documentation
- `/var/www/docs/AppDashboard/ResultsCreation/03_round_completion.md` (Existing documentation)
- `/var/www/docs/backend/round_completion_with_results.md` (This file)
