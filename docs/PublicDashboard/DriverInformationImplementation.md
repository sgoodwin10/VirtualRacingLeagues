# Public Driver Profile API Implementation

## Overview
This document describes the implementation of the public driver profile API endpoint for the Virtual Racing Leagues application.

## Endpoint Details

### URL
```
GET /api/public/drivers/{seasonDriverId}
```

### Parameters
- `seasonDriverId` (integer, required) - The ID from the `season_drivers` table

### Authentication
- **None required** - This is a public endpoint

### Rate Limiting
- 60 requests per minute (shared with other public endpoints)

### Response Format

```json
{
  "success": true,
  "data": {
    "nickname": "SpeedDemon",
    "driver_number": 99,
    "platform_accounts": {
      "psn_id": "speeddemon123",
      "discord_id": "speeddemon#1234",
      "iracing_id": "12345"
    },
    "career_stats": {
      "total_poles": 15,
      "total_podiums": 42
    },
    "competitions": [
      {
        "league_name": "Formula E Championship",
        "league_slug": "formula-e-championship",
        "season_name": "Season 2025",
        "season_slug": "season-2025",
        "status": "active"
      }
    ]
  }
}
```

### Response Fields

#### Root Level
- `nickname` (string) - Driver's nickname. If no nickname exists, falls back to "First Last" or "Unknown Driver"
- `driver_number` (int|null) - Driver's league number
- `platform_accounts` (object) - Platform identifiers (only non-null values included)
- `career_stats` (object) - Career statistics aggregated across all seasons
- `competitions` (array) - List of all seasons the driver has participated in

#### Platform Accounts
Only includes properties where the driver has a value:
- `psn_id` (string) - PlayStation Network ID
- `discord_id` (string) - Discord username
- `iracing_id` (string) - iRacing ID

#### Career Stats
- `total_poles` (int) - Total pole positions across all seasons
- `total_podiums` (int) - Total podium finishes (1st, 2nd, 3rd) across all seasons

#### Competitions
- `league_name` (string) - Name of the league
- `league_slug` (string) - URL-friendly league identifier
- `season_name` (string) - Name of the season
- `season_slug` (string) - URL-friendly season identifier
- `status` (string) - Driver status: "active", "reserve", or "withdrawn"

### Privacy Features
- **First name and last name are NEVER included** in the response for privacy reasons
- Only the nickname is exposed (or a fallback display name)
- Private league drivers return 404

### Error Responses

#### Driver Not Found (404)
```json
{
  "success": false,
  "message": "Driver not found"
}
```

Returned when:
- Season driver ID doesn't exist
- Driver belongs to a private league
- Related data is missing (league, driver, etc.)

## Architecture

### Files Created/Modified

#### New Files
1. `/app/Application/Driver/DTOs/PublicDriverProfileData.php`
   - DTO for driver profile response data
   - Uses Spatie Laravel Data for type safety

2. `/app/Http/Controllers/Public/PublicDriverController.php`
   - Thin controller (3 lines) following DDD principles
   - Delegates to application service

3. `/tests/Feature/Public/PublicDriverProfileTest.php`
   - Comprehensive test suite (7 test cases, 21 assertions)
   - Tests caching, privacy, aggregation, edge cases

#### Modified Files
1. `/app/Application/League/Services/LeagueApplicationService.php`
   - Added `getPublicDriverProfile()` method
   - Implements caching with 1-hour TTL
   - Aggregates data from multiple database tables

2. `/routes/subdomain.php`
   - Added route definition with parameter validation

### Data Flow

```
1. Frontend → GET /api/public/drivers/{seasonDriverId}
2. PublicDriverController::show()
3. LeagueApplicationService::getPublicDriverProfile()
4. Cache::remember() checks for cached data
5. If cache miss:
   a. Query season_driver with eager loading
   b. Verify league is public/unlisted
   c. Get all season_driver IDs for this driver
   d. Calculate career stats (poles, podiums)
   e. Fetch competition/season participation
   f. Build PublicDriverProfileData DTO
   g. Cache for 1 hour
6. Return JSON response
```

### Database Queries

The implementation performs efficient queries:
1. **Single query** with eager loading to get driver and league visibility
2. **Single query** to get all season driver IDs for the driver
3. **Two aggregate queries** for poles and podiums (using whereIn)
4. **Single query** to fetch all competitions/seasons

### Caching Strategy

- **Cache Key**: `public_driver_profile_{seasonDriverId}`
- **TTL**: 3600 seconds (1 hour)
- **Implementation**: `Cache::remember()`
- **Benefits**:
  - Reduces database load for popular drivers
  - Fast response times for subsequent requests
  - Automatic expiration

### Performance Considerations

1. **Eager Loading**: Uses `with()` to prevent N+1 queries
2. **Query Optimization**: Uses `pluck()` for ID-only queries
3. **Aggregation**: Uses database `count()` instead of loading all records
4. **Caching**: 1-hour cache significantly reduces database hits

## Testing

### Test Coverage
- ✅ Can retrieve driver profile by season_driver_id
- ✅ Excludes null platform accounts from response
- ✅ Returns 404 for nonexistent drivers
- ✅ Returns 404 for private league drivers
- ✅ Aggregates stats across multiple seasons correctly
- ✅ Response is cached for 1 hour
- ✅ Falls back to full name when no nickname exists

### Running Tests
```bash
# Run driver profile tests only
php artisan test tests/Feature/Public/PublicDriverProfileTest.php

# Run all public endpoint tests
php artisan test tests/Feature/Public/

# Run all feature tests
php artisan test --testsuite=Feature
```

## Code Quality

### PHPStan
- ✅ Level 8 (strictest) - No errors
- ✅ Proper type annotations
- ✅ Uses PHPDoc for complex types

### PHPCS (PSR-12)
- ✅ No errors
- ✅ Only warnings for long lines (acceptable)

### Tests
- ✅ All tests passing (7/7)
- ✅ 21 assertions covering edge cases

## Integration with Frontend

The frontend can call this endpoint when displaying driver information:

```typescript
// Example usage in Vue component
const fetchDriverProfile = async (seasonDriverId: number) => {
  const response = await fetch(`/api/public/drivers/${seasonDriverId}`);
  const { data } = await response.json();

  // data.nickname - Display name
  // data.driver_number - #99
  // data.platform_accounts - { psn_id, discord_id, iracing_id }
  // data.career_stats - { total_poles, total_podiums }
  // data.competitions - Array of seasons
};
```

## Security Considerations

1. **Privacy**: First and last names are never exposed
2. **Visibility**: Private league drivers return 404
3. **Rate Limiting**: 60 requests per minute prevents abuse
4. **Input Validation**: Route parameter must be numeric
5. **No Auth Required**: Public endpoint by design

## Future Enhancements

Potential improvements for future iterations:
- Add more career stats (wins, championship titles, DNFs)
- Include recent race results
- Add driver avatar/photo support
- Implement search by driver nickname
- Add pagination for competitions list
- Cache invalidation when driver data changes
- GraphQL support for flexible queries
