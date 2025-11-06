# Competition Colour Verification

## Changes Made

### 1. Backend Changes

#### SeasonCompetitionData DTO (`app/Application/Competition/DTOs/SeasonCompetitionData.php`)
Added `competition_colour` field to the DTO:
```php
public function __construct(
    public int $id,
    public string $name,
    public string $slug,
    public int $platform_id,
    public ?string $competition_colour,  // ← ADDED
    public SeasonLeagueData $league,
) {
}
```

#### SeasonApplicationService (`app/Application/Competition/Services/SeasonApplicationService.php`)
Updated the instantiation to include `competition_colour`:
```php
$competitionData = new SeasonCompetitionData(
    id: $competition->id() ?? 0,
    name: $competition->name()->value(),
    slug: $competition->slug()->value(),
    platform_id: $competition->platformId(),
    competition_colour: $competition->competitionColour(),  // ← ADDED
    league: new SeasonLeagueData(
        id: $league->id() ?? 0,
        name: $league->name()->value(),
        slug: $league->slug()->value(),
    ),
);
```

### 2. Frontend Changes

#### Season Type Definition (`resources/app/js/types/season.ts`)
Added `competition_colour` to the `SeasonCompetition` interface:
```typescript
export interface SeasonCompetition {
  id: number;
  name: string;
  slug: string;
  platform_id: number;
  logo_url: string;
  competition_colour: string | null; // ← ADDED: RGB JSON string: {"r":100,"g":102,"b":241}
  platform?: {
    id: number;
    name: string;
    slug: string;
  };
  league?: {
    id: number;
    name: string;
    slug: string;
  };
}
```

### 3. Test Updates

Updated `tests/Feature/SeasonApiTest.php` to verify the `competition_colour` is returned:
- Added `competition_colour` to test data
- Added assertion to verify the colour is in the response structure
- Added assertion to verify the colour value is correct

## How to Access Competition Colour in SeasonDetail.vue

The competition colour is now available in the `SeasonDetail.vue` component through:

```typescript
// Access through the season object
season.value?.competition?.competition_colour

// Parse the RGB colour
const competitionColour = computed(() => {
  if (!season.value?.competition?.competition_colour) {
    return null;
  }

  try {
    return JSON.parse(season.value.competition.competition_colour) as { r: number; g: number; b: number };
  } catch {
    return null;
  }
});

// Use the colour
const competitionColourStyle = computed(() => {
  const colour = competitionColour.value;
  if (!colour) return {};

  return {
    backgroundColor: `rgb(${colour.r}, ${colour.g}, ${colour.b})`,
  };
});
```

## Example Usage in Template

```vue
<template>
  <div v-if="season">
    <!-- Use as background colour -->
    <div
      class="w-full h-64 bg-gradient-to-br from-purple-500 to-blue-600"
      :style="competitionColourStyle"
    >
      <!-- Content -->
    </div>

    <!-- Or parse and display RGB values -->
    <div v-if="competitionColour">
      Competition Colour: RGB({{ competitionColour.r }}, {{ competitionColour.g }}, {{ competitionColour.b }})
    </div>
  </div>
</template>
```

## Verification

1. Backend test passes: ✅ (29 assertions including competition_colour)
2. PHPStan analysis: ✅ (No errors)
3. TypeScript types: ✅ (competition_colour defined in SeasonCompetition interface)
4. Data flow: API → Service → Store → Component ✅

## Current Debug Output

The existing debug logging in `SeasonDetail.vue` (line 96-101) will now show the `competition_colour`:

```typescript
console.log('[SeasonDetail] Season loaded:', {
  seasonId: seasonId.value,
  season: season.value,
  platform_id: season.value?.competition?.platform_id,
  competition: season.value?.competition,  // ← competition_colour is here
});
```

The `competition_colour` field will be visible in the browser console when viewing a season detail page.
