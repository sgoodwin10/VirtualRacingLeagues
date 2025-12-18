# Driver Profile API - Quick Reference

## Endpoint
```
GET /api/public/drivers/{seasonDriverId}
```

## Usage Example

```typescript
// Simple fetch
const response = await fetch('/api/public/drivers/123');
const { data } = await response.json();

console.log(data.nickname);        // "SpeedDemon"
console.log(data.driver_number);   // 99
console.log(data.career_stats.total_poles);    // 15
console.log(data.career_stats.total_podiums);  // 42
```

## Response Schema

```typescript
interface DriverProfile {
  nickname: string;
  driver_number: number | null;
  platform_accounts: {
    psn_id?: string;
    discord_id?: string;
    iracing_id?: string;
  };
  career_stats: {
    total_poles: number;
    total_podiums: number;
  };
  competitions: Array<{
    league_name: string;
    league_slug: string;
    season_name: string;
    season_slug: string;
    status: 'active' | 'reserve' | 'withdrawn';
  }>;
}
```

## Key Points

✅ **No authentication required**
✅ **Cached for 1 hour** - Fast response times
✅ **Privacy-first** - No personal names exposed
✅ **404 for private leagues** - Respects privacy settings
✅ **Aggregated stats** - Shows career totals across all seasons

## Where to Use `seasonDriverId`

The `seasonDriverId` is available in:
- Race results (`driver_id` field)
- Season standings (`driver_id` field)
- Round results (`driver_id` field)

This is the ID from the `season_drivers` table, not the `drivers` table!

## Error Handling

```typescript
const response = await fetch('/api/public/drivers/123');

if (!response.ok) {
  if (response.status === 404) {
    console.log('Driver not found or belongs to private league');
  }
  return;
}

const { data } = await response.json();
// Use data...
```

## Rate Limit
- 60 requests per minute (shared with other public endpoints)
- Returns 429 if limit exceeded
