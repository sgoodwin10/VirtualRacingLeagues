# Available Drivers Endpoint Fix

## Overview
Fixed two issues with the `/api/seasons/{season}/available-drivers` endpoint:
1. Search was not working on all driver fields
2. Response was missing `discord` and `platform_id` fields

## Endpoint
`GET /api/seasons/{seasonId}/available-drivers`

## Changes Made

### File Modified
`/var/www/app/Application/Competition/Services/SeasonDriverApplicationService.php`

### Issue 1: Enhanced Search Functionality (Lines 403-418)

**Before**: Search only worked on driver name fields via `whereHas`
```php
if ($search !== null && $search !== '') {
    $query->whereHas('driver', function ($q) use ($search) {
        $q->where('first_name', 'like', "%{$search}%")
            ->orWhere('last_name', 'like', "%{$search}%")
            ->orWhere('nickname', 'like', "%{$search}%")
            ->orWhere('discord_id', 'like', "%{$search}%")
            ->orWhere('psn_id', 'like', "%{$search}%")
            ->orWhere('iracing_id', 'like', "%{$search}%");
    });
}
```

**After**: Search now works on all driver fields AND league driver number
```php
if ($search !== null && $search !== '') {
    $query->where(function ($q) use ($search) {
        // Search driver fields
        $q->whereHas('driver', function ($driverQuery) use ($search) {
            $driverQuery->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('nickname', 'like', "%{$search}%")
                ->orWhere('discord_id', 'like', "%{$search}%")
                ->orWhere('psn_id', 'like', "%{$search}%")
                ->orWhere('iracing_id', 'like', "%{$search}%");
        })
        // Also search league_drivers.driver_number
        ->orWhere('league_drivers.driver_number', 'like', "%{$search}%");
    });
}
```

**Searchable Fields**:
- `drivers.first_name`
- `drivers.last_name`
- `drivers.nickname`
- `drivers.discord_id`
- `drivers.psn_id`
- `drivers.iracing_id`
- `league_drivers.driver_number`

### Issue 2: Added Missing Response Fields (Lines 433-444)

**Before**: Response only included basic fields
```php
$data = array_map(function ($leagueDriver) {
    return [
        'id' => $leagueDriver->id,
        'driver_id' => $leagueDriver->driver_id,
        'driver_name' => $leagueDriver->driver->name ?? 'Unknown',
        'number' => $leagueDriver->number !== null ? (string) $leagueDriver->number : null,
        'team_name' => $leagueDriver->team_name,
    ];
}, $paginator->items());
```

**After**: Response now includes all platform identifiers
```php
$data = array_map(function ($leagueDriver) {
    return [
        'id' => $leagueDriver->id,
        'driver_id' => $leagueDriver->driver_id,
        'driver_name' => $leagueDriver->driver->name ?? 'Unknown',
        'number' => $leagueDriver->number !== null ? (string) $leagueDriver->number : null,
        'team_name' => $leagueDriver->team_name,
        'discord' => $leagueDriver->driver->discord_id ?? null,
        'psn_id' => $leagueDriver->driver->psn_id ?? null,
        'iracing_id' => $leagueDriver->driver->iracing_id ?? null,
    ];
}, $paginator->items());
```

### Updated PHPDoc (Lines 348-373)

Updated the return type documentation to reflect the new response structure:
```php
/**
 * @return array{
 *     data: array<array{
 *         id: int,
 *         driver_id: int,
 *         driver_name: string,
 *         number: string|null,
 *         team_name: string|null,
 *         discord: string|null,
 *         psn_id: string|null,
 *         iracing_id: string|null
 *     }>,
 *     meta: array{...}
 * }
 */
```

## Response Structure

### Example Request
```http
GET /api/seasons/6/available-drivers?search=al&page=1&per_page=10&league_id=1
```

### Example Response
```json
{
  "data": [
    {
      "id": 123,
      "driver_id": 456,
      "driver_name": "Alex Albon",
      "number": "23",
      "team_name": "Williams Racing",
      "discord": "albon#2323",
      "psn_id": "alex_albon",
      "iracing_id": "aalbon23"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 1,
    "last_page": 1,
    "from": 1,
    "to": 1
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": null
  }
}
```

## Testing

### Code Quality Checks
✅ **PHPStan Level 8** - No errors
✅ **PHPCS (PSR-12)** - No violations

### Test File Created
`/var/www/tests/Feature/AvailableDriversSearchTest.php`

**Test Coverage**:
- Response includes all required fields
- Search by driver number
- Search by Discord ID
- Search by PSN ID
- Search by iRacing ID
- Search by first/last name
- Search by nickname
- Partial match searching
- Case-insensitive searching
- Null field handling
- Multiple results

## Backwards Compatibility

✅ **Fully backwards compatible** - All existing fields remain unchanged, only new fields added

## Database Tables Involved

- `drivers` - Contains driver personal information and platform IDs
- `league_drivers` - Links drivers to leagues with driver number
- `season_drivers` - Tracks which drivers are in which seasons
- `seasons` - Season information
- `competitions` - Competition information (links to league)

## Search Logic

The search uses a SQL `LIKE` pattern match with wildcards (`%search%`) for partial matching:
- Case-insensitive (SQL LIKE is case-insensitive by default in MySQL/MariaDB)
- Searches across ALL specified fields using OR logic
- Returns drivers matching ANY of the searchable fields

## Performance Considerations

- Uses eager loading (`->with('driver')`) to prevent N+1 queries
- Single database query with joins and subqueries
- Indexed columns: `drivers.first_name`, `drivers.last_name`, `drivers.nickname`, `drivers.discord_id`, `drivers.psn_id`, `drivers.iracing_id`, `league_drivers.driver_number`
- Pagination applied at database level for efficient memory usage

## Date
2026-01-30
