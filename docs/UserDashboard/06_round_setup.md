# Round Setup Documentation

**Version:** 1.0  
**Last Updated:** October 17, 2025

---

## Overview

A **Round** represents a race weekend/event within a season. Rounds can contain one or multiple races, all taking place at the same track. Each round has its own points system calculated from the aggregate results of all races within that round.

### Key Concepts

- **Single Form Creation:** Simple form to create a round
- **Track Database:** Pre-seeded track database for selection
- **Multiple Races:** Unlimited races per round, all on same track
- **Race-Specific Configuration:** Each race has unique settings (qualifying, grid, points)
- **Round Points:** Aggregate points from all races determine round finishing positions
- **Grid Determination:** Each race can have different starting grid rules

---

## Hierarchical Structure

```
Season
  └─ Round (Race Weekend)
      ├─ Race 1 (Sprint Race, Reverse Grid Qualifying)
      ├─ Race 2 (Feature Race, Previous Race Finish Order)
      └─ Race 3 (Finale, Standard Qualifying)
          └─ Results (per division)
```

---

## Navigation to Round Creation

### Entry Points

1. **Season Dashboard → Calendar tab:** [+ Create Round] button
2. **Season Dashboard → Overview:** "Create Rounds" button in empty state
3. **Calendar view:** [+ Add Round] button

---

## Round Creation Form

### Single-Page Form

```
═══════════════════════════════════════════════════
CREATE ROUND
Season: 2025 Spring Season
═══════════════════════════════════════════════════

BASIC INFORMATION
───────────────────────────────────────────────────

Round Number* (required)
[___] (1-99)
Auto-suggested based on existing rounds

Round Name/Title (optional)
[________________________________________________]
Example: "Season Opener", "Mid-Season Special", "Grand Finale"
If left blank, will display as "Round X"

Date & Time* (required)
Date: [📅 Feb 18, 2025]
Time: [🕐 7:00 PM] [AEDT ▼]
Timezone inherited from league settings


TRACK & LOCATION
───────────────────────────────────────────────────

Track* (required)
[Search tracks...                              🔍]

Results:
┌────────────────────────────────────────────────────┐
│ 🏁 Brands Hatch GP Circuit                        │
│ United Kingdom • 3.908 km • 9 corners             │
│ [Select]                                           │
├────────────────────────────────────────────────────┤
│ 🏁 Brands Hatch Indy Circuit                      │
│ United Kingdom • 1.929 km • 8 corners             │
│ [Select]                                           │
└────────────────────────────────────────────────────┘

Selected Track: Brands Hatch GP Circuit
Layout/Configuration (optional)
[Dropdown: GP Layout, Indy Layout, Custom ▼]

Track Conditions (optional text)
[________________________________________________]
Example: "Wet track, 15°C ambient"


RACE CONFIGURATION
───────────────────────────────────────────────────

Number of Races in Round* (required)
[1 ▼] (1-10+, default: 1)
  • 1 Race (Standard round)
  • 2 Races (Sprint + Feature)
  • 3 Races (Triple header)
  • Custom: [___]

ℹ️  You'll configure individual race settings after creation


ROUND SPECIFICATIONS (optional)
───────────────────────────────────────────────────

Technical Notes / Requirements
┌──────────────────────────────────────────────────┐
│ BOP settings, tire restrictions, fuel limits,   │
│ mandatory pit stops, etc...                     │
│                                                  │
└──────────────────────────────────────────────────┘

Stream/Broadcast Link (optional)
[https://____________________________________]
For YouTube, Twitch, or other streaming platforms

Notes (optional, internal)
┌──────────────────────────────────────────────────┐
│ Internal notes for stewards/organizers...       │
│                                                  │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════

[Cancel]  [Create Round]
```

---

## Saving
On save, a `slug` will be created for the season and saved in the database and will be used for the public dashboard. it will be unique, and will attempt to create from the round name name. Eg if round is `Round 1` it will attempt to make a slug called `round-1`. If this is not unique for the League, Combintation, season and round of slugs, it will add a number at the end eg `round-1-01` and increment until an available slug is found.

## Post-Creation Flow

### Success Screen

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ✅  Round Created!                             │
│                                                 │
│  🏁 Round 5 - Brands Hatch GP Circuit           │
│  Feb 18, 2025 @ 7:00 PM                         │
│  1 race configured                              │
│                                                 │
│  Next Steps:                                    │
│                                                 │
│  [Configure Race Settings →]                    │
│    Set qualifying format, race length, points   │
│                                                 │
│  [Add Another Round]                            │
│  [Go to Round Dashboard]                        │
│  [Back to Season Calendar]                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**After creation, redirect to:** Round Dashboard → Race Configuration

---

## Race Configuration (Per Race)

**Location:** Round Dashboard → Races tab

If round has **1 race:**
```
═══════════════════════════════════════════════════
ROUND 5 - BRANDS HATCH GP CIRCUIT
Feb 18, 2025 @ 7:00 PM
═══════════════════════════════════════════════════

[Race Configuration] [Entry Lists] [Results] [Settings]
  ^active

RACE CONFIGURATION
───────────────────────────────────────────────────

Single Race Format
This round consists of one race.

[Edit Race Settings]
```

If round has **multiple races:**
```
═══════════════════════════════════════════════════
ROUND 5 - BRANDS HATCH GP CIRCUIT
Feb 18, 2025 @ 7:00 PM
═══════════════════════════════════════════════════

[Race Configuration] [Entry Lists] [Results] [Settings]
  ^active

RACE CONFIGURATION
───────────────────────────────────────────────────

Multiple Race Format (3 races)

┌─────────────────────────────────────────────────┐
│ Race 1: Sprint Race                             │
│ Status: ⚙️ Configuration needed                 │
│ [Configure Race →]                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Race 2: Feature Race                            │
│ Status: ⚙️ Configuration needed                 │
│ [Configure Race →]                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Race 3: Final Race                              │
│ Status: ⚙️ Configuration needed                 │
│ [Configure Race →]                              │
└─────────────────────────────────────────────────┘

[Add Another Race]  [Remove Last Race]
```

---

## Individual Race Settings

**Click [Configure Race →] or [Edit Race Settings]:**

```
═══════════════════════════════════════════════════
CONFIGURE RACE
Round 5 - Race 1
═══════════════════════════════════════════════════

RACE DETAILS
───────────────────────────────────────────────────

Race Name/Title (optional)
[________________________________________________]
Example: "Sprint Race", "Feature Race", "Main Event"
Leave blank for "Race 1", "Race 2", etc.

Race Type (optional, display only)
[Dropdown ▼]
  • Sprint Race
  • Feature Race
  • Qualifying Race
  • Endurance Race
  • Custom/Other


QUALIFYING CONFIGURATION
───────────────────────────────────────────────────

Qualifying Format* (required)
[Dropdown ▼]
  • Standard Qualifying (single session)
  • Time Trial (best lap)
  • No Qualifying (grid determined by other method)
  • Previous Race Result (uses Race X finish order)

If "Standard Qualifying" or "Time Trial":
  Session Length: [10] minutes
  Tire Compound: [Any ▼] (Soft, Medium, Hard, Any)

If "No Qualifying":
  Grid Order Method* (required)
  [Dropdown ▼]
    • Championship Order (current standings)
    • Reverse Championship Order
    • Random Draw
    • Manual Grid Assignment


STARTING GRID DETERMINATION (if not first race)
───────────────────────────────────────────────────

⚠️  This is Race 2 of 3 in this round

Starting Grid Source* (required)
[Dropdown ▼]
  • Use Qualifying Results (from this race's qualifying)
  • Previous Race Finish Order (Race 1 results)
  • Reverse Previous Race Finish (Race 1 results reversed)
  • Same Qualifying as Race 1 (reuse Race 1 qualifying)
  • Reverse Qualifying from Race 1
  • Championship Order
  • Reverse Championship Order
  • Manual Grid Assignment

ℹ️  Selected: Previous Race Finish Order
    Starting grid will match the finish order of Race 1


RACE LENGTH
───────────────────────────────────────────────────

Race Length Type* (required)
○ Laps
○ Time Duration

If Laps:
  Number of Laps: [15] laps

If Time:
  Duration: [30] minutes
  Plus: [1] lap after time expires


RACE SETTINGS
───────────────────────────────────────────────────

Weather Conditions
[Dropdown ▼]
  • Clear/Dry
  • Wet/Rain
  • Dynamic Weather (starts clear, may rain)
  • Custom: [_________________________]

Tire Restrictions
[Dropdown ▼]
  • Any Compound
  • Soft Only
  • Medium Only
  • Hard Only
  • Multiple Compounds Required
  • Custom: [_________________________]

Fuel Usage
[Dropdown ▼]
  • Standard
  • Limited Fuel (specify strategy)
  • Unlimited
  • Custom: [_________________________]

Damage Model
[Dropdown ▼]
  • Off (no damage)
  • Visual Only
  • Mechanical Damage
  • Full Damage
  • Simulation (realistic)

Penalties
☑ Track Limits Enforced
☑ False Start Detection
☑ Collision Penalties
☐ Mandatory Pit Stop Required
  If checked: Minimum stop time: [___] seconds

Assists Restrictions (optional)
┌──────────────────────────────────────────────────┐
│ List allowed/forbidden assists...               │
│ (TCS, ABS, Stability Control, etc.)             │
└──────────────────────────────────────────────────┘


POINTS SYSTEM (THIS RACE)
───────────────────────────────────────────────────

⚠️  IMPORTANT: These points are for THIS RACE ONLY
   Round points are calculated from ALL races combined

Points Template
[Dropdown ▼]
  • F1 Standard (25-18-15-12-10-8-6-4-2-1)
  • Custom Points

If Custom:

Position Points Table
┌──────────┬────────┐
│ Position │ Points │
├──────────┼────────┤
│    1     │  [25]  │
│    2     │  [18]  │
│    3     │  [15]  │
│    4     │  [12]  │
│    5     │  [10]  │
│   ...    │  ...   │
└──────────┴────────┘
[+ Add More Positions]

Bonus Points (optional)
☐ Pole Position: [1] points
☐ Fastest Lap: [1] points
  ☐ Must finish in top 10
☐ Most Positions Gained: [2] points
☐ Leading Most Laps: [1] points

DNF/DNS Points
DNF (Did Not Finish): [0] points
DNS (Did Not Start): [0] points


RACE NOTES (optional)
───────────────────────────────────────────────────

┌──────────────────────────────────────────────────┐
│ Special notes for this specific race...         │
│                                                  │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════

[Cancel]  [Save Race Configuration]
```

---

## Round Points Calculation

**After all races in round are completed:**

```
═══════════════════════════════════════════════════
ROUND POINTS CALCULATION
Round 5 - Brands Hatch GP Circuit
═══════════════════════════════════════════════════

This round consists of 2 races.
Round finishing positions are determined by TOTAL POINTS
from all races.

Example Driver Results:
───────────────────────────────────────────────────

Driver: John Smith
  Race 1: P2 (18 points)
  Race 2: P1 (25 points)
  ────────────────────
  Total:  43 points → Round Position: P1

Driver: Jane Doe
  Race 1: P1 (25 points)
  Race 2: P3 (15 points)
  ────────────────────
  Total:  40 points → Round Position: P2

Driver: Mike Ross
  Race 1: P3 (15 points)
  Race 2: P2 (18 points)
  ────────────────────
  Total:  33 points → Round Position: P3


TIE BREAKING RULES
───────────────────────────────────────────────────

When drivers have equal total points, ties are broken by:
(To be configured per round or season-wide)

Priority order:
1. Number of wins (most wins ranks higher)
2. Number of 2nd places
3. Number of 3rd places
4. Best finish in final race of round
5. Best finish in first race of round
6. Best qualifying position
7. Countback (most 4ths, 5ths, etc.)
8. If still tied: Joint position awarded

Note: Tie breaking rules will be configured during 
      result entry (covered in next documentation)
```

---

## Track Database Schema

### tracks Table

```sql
tracks {
  id: integer (primary key)
  
  -- Basic Info
  name: string (required)
  location: string (country/region)
  circuit_type: enum ('road', 'street', 'oval', 'mixed')
  
  -- Track Details
  length_km: decimal (nullable)
  length_miles: decimal (nullable)
  corners: integer (nullable)
  
  -- Layout/Configuration
  default_layout: string (nullable)
  layouts: json (array of available layouts)
  
  -- Platform Availability
  platforms: json (array of platforms where track exists)
  
  -- Additional Info
  description: text (nullable)
  website_url: string (nullable)
  image_url: string (nullable)
  
  -- Metadata
  created_at: timestamp
  updated_at: timestamp
}
```

### Example Track Records

```javascript
// Brands Hatch
{
  id: 1,
  name: "Brands Hatch Circuit",
  location: "United Kingdom",
  circuit_type: "road",
  length_km: 3.908,
  length_miles: 2.428,
  corners: 9,
  default_layout: "GP Circuit",
  layouts: ["GP Circuit", "Indy Circuit"],
  platforms: ["Gran Turismo 7", "iRacing", "Assetto Corsa Competizione"],
  description: "Historic British racing circuit...",
  image_url: "https://..."
}

// Spa-Francorchamps
{
  id: 2,
  name: "Circuit de Spa-Francorchamps",
  location: "Belgium",
  circuit_type: "road",
  length_km: 7.004,
  length_miles: 4.352,
  corners: 19,
  default_layout: "Full Circuit",
  layouts: ["Full Circuit"],
  platforms: ["Gran Turismo 7", "iRacing", "Assetto Corsa Competizione", "F1 24"],
  description: "Legendary Belgian circuit...",
  image_url: "https://..."
}
```

---

## Database Schema

### rounds Table

```sql
rounds {
  id: integer (primary key)
  season_id: integer (foreign key)
  
  -- Basic Info
  round_number: integer (required)
  name: string (nullable, 100 chars)
  
  -- Schedule
  scheduled_at: datetime (required)
  timezone: string (inherited from league)
  
  -- Track
  track_id: integer (foreign key to tracks)
  track_layout: string (nullable)
  track_conditions: text (nullable)
  
  -- Configuration
  number_of_races: integer (default: 1)
  
  -- Specifications
  technical_notes: text (nullable)
  stream_url: string (nullable)
  internal_notes: text (nullable)
  
  -- Status
  status: enum ('scheduled', 'pre_race', 'in_progress', 'completed', 'cancelled')
  
  -- Metadata
  created_by_user_id: integer (foreign key)
  created_at: timestamp
  updated_at: timestamp
}
```

### races Table

```sql
races {
  id: integer (primary key)
  round_id: integer (foreign key)
  
  -- Basic Info
  race_number: integer (1, 2, 3... within round)
  name: string (nullable, "Sprint Race", "Feature Race")
  race_type: string (nullable, "sprint", "feature", "endurance")
  
  -- Qualifying
  qualifying_format: enum ('standard', 'time_trial', 'none', 'previous_race')
  qualifying_length: integer (minutes, nullable)
  qualifying_tire: string (nullable)
  
  -- Starting Grid (for multi-race rounds)
  grid_source: enum ('qualifying', 'previous_race', 'reverse_previous', 
                     'championship', 'reverse_championship', 'manual')
  grid_source_race_id: integer (foreign key to races, nullable)
  
  -- Race Length
  length_type: enum ('laps', 'time')
  length_value: integer (laps or minutes)
  extra_lap_after_time: boolean (default: true)
  
  -- Race Settings
  weather: string (nullable)
  tire_restrictions: string (nullable)
  fuel_usage: string (nullable)
  damage_model: string (nullable)
  
  -- Penalties & Rules
  track_limits_enforced: boolean (default: true)
  false_start_detection: boolean (default: true)
  collision_penalties: boolean (default: true)
  mandatory_pit_stop: boolean (default: false)
  minimum_pit_time: integer (seconds, nullable)
  
  -- Assists
  assists_restrictions: text (nullable)
  
  -- Points System (for this race)
  points_system: json (position → points mapping)
  bonus_points: json (pole, fastest_lap, etc.)
  dnf_points: integer (default: 0)
  dns_points: integer (default: 0)
  
  -- Notes
  race_notes: text (nullable)
  
  -- Status
  status: enum ('scheduled', 'qualifying', 'racing', 'completed')
  
  -- Metadata
  created_at: timestamp
  updated_at: timestamp
}
```

---

## Round Dashboard Views

### Calendar View (Season Level)

```
═══════════════════════════════════════════════════
SEASON CALENDAR
2025 Spring Season
═══════════════════════════════════════════════════

[+ Create Round]  [View: List 📋 | Calendar 📅]

Round 1 - Brands Hatch GP              ✓ COMPLETED
Date: Jan 15, 2025 @ 7:00 PM
1 race • All divisions completed
[View Results] [View Standings]

Round 2 - Nürburgring GP              ✓ COMPLETED
Date: Jan 22, 2025 @ 7:00 PM
1 race • All divisions completed
[View Results] [View Standings]

Round 3 - Spa-Francorchamps          ✓ COMPLETED
Date: Feb 4, 2025 @ 7:00 PM
2 races • All divisions completed
[View Results] [View Standings]

Round 4 - Monza                      ✓ COMPLETED
Date: Feb 11, 2025 @ 7:00 PM
1 race • All divisions completed
[View Results] [View Standings]

Round 5 - Brands Hatch GP            ⏭️ UPCOMING
Date: Feb 18, 2025 @ 7:00 PM
1 race • 45 drivers registered
[Race Control] [Edit] [Entry Lists]

Round 6 - Suzuka Circuit             📅 SCHEDULED
Date: Feb 25, 2025 @ 7:00 PM
1 race • Not yet configured
[Configure] [Edit] [Delete]
```

### Round Details View

```
═══════════════════════════════════════════════════
ROUND 5 - BRANDS HATCH GP CIRCUIT
Sunday, February 18, 2025 @ 7:00 PM AEDT
Status: ⏭️ Upcoming
═══════════════════════════════════════════════════

[Overview] [Races] [Entry Lists] [Results] [Settings]
  ^active

OVERVIEW
───────────────────────────────────────────────────

Track Information
Track: Brands Hatch GP Circuit
Location: United Kingdom
Length: 3.908 km (2.428 mi)
Corners: 9
Layout: GP Circuit

Race Format
Number of Races: 1
Total Estimated Duration: ~45 minutes

Registration Status
Division 1: 16/16 drivers confirmed
Division 2: 15/16 drivers confirmed
Division 3: 14/16 drivers confirmed

Quick Actions
───────────────────────────────────────────────────
[View Entry Lists]
[Race Control Dashboard]
[Send Race Reminder]
[Edit Round Details]

Technical Notes
───────────────────────────────────────────────────
BOP Enabled • Hard Tire Compound Only
Track Limits Strictly Enforced

Stream Link
https://twitch.tv/yourleague
```

---

## Business Rules

### Round Numbering
- Round numbers auto-suggested (next available)
- Can be manually changed (gaps allowed)
- Multiple rounds can share same number (not recommended)

### Race Limits
- No hard limit on races per round
- Practical limit: 1-5 races typical
- All races in a round use the same track

### Track Selection
- Track must exist in track database
- Track filtered by platform if available
- Custom tracks can be added to database

### Grid Determination
- First race: Uses qualifying or other method
- Subsequent races: Can reference previous races in same round
- Cannot reference races from other rounds

### Points Configuration
- Each race has independent points system
- Round points = sum of all race points
- Tie-breaking rules apply at round level (not race level)

---

## Future Enhancements (Not in v1)

- Round templates (save/reuse configurations)
- Bulk round creation (generate multiple rounds at once)
- Track recommendations based on season
- Weather forecasts (real-world data integration)
- Practice/qualifying session management
- Live timing integration
- Automated grid penalty application
- Reserve driver substitutions
- Split qualifying by division

---

## Related Documentation

- `05-Season-Creation.md` - Parent season setup
- `04-Dashboard-Layouts.md` - Round dashboard layouts
- `07-Result-Entry.md` - Entering race results (next)
- `Track-Database-Seeder.md` - Track database structure (to be created)