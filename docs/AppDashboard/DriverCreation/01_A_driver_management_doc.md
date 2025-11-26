# Driver Management Documentation

**Version:** 1.0  
**Last Updated:** October 18, 2025

---

## Overview

The Driver Management system operates at the **League Level**. All drivers belong to a league and can participate in any competition/season within that league. This creates a centralized driver roster that can be reused across multiple competitions and seasons.

### Key Concepts

- **League-Level Roster:** Drivers are added to the league, not individual competitions
- **Reusable Pool:** Same driver list available to all competitions in the league
- **Season Selection:** When creating seasons, select drivers from the league roster
- **Platform Flexibility:** Drivers can have multiple platform IDs
- **Bulk Import:** CSV import for easy roster building

---

## Hierarchical Structure

```
Global Driver Pool
  ├─ Driver Record #1 (John Smith, PSN: JohnSmith77)
  ├─ Driver Record #2 (John Smith, PSN: JSmith_Racing) -- Duplicate person OK
  └─ Driver Record #3 (Jane Doe, PSN: JaneDoe_GT)

League A (Sydney Racing)
  └─ league_drivers (Pivot)
      ├─ Driver #1 (Status: Active, Number: 5)
      ├─ Driver #3 (Status: Active, Number: 7)
      
  └─ Competition A → Season 1
      └─ season_drivers
          ├─ Driver #1 (Division 1)
          └─ Driver #3 (Division 1)

League B (Melbourne Racing)
  └─ league_drivers (Pivot)
      ├─ Driver #1 (Status: Active, Number: 12) -- Same person, different league
      ├─ Driver #2 (Status: Active, Number: 5)  -- Different driver record
      
  └─ Competition A → Season 1
      └─ season_drivers
          ├─ Driver #1 (Division 2)
          └─ Driver #2 (Division 1)
```

**Key Points:**
- Drivers exist in global pool (can be duplicates of same person)
- `league_drivers` pivot associates drivers with leagues
- Same driver (global ID) can be in multiple leagues with different settings
- Different driver records (duplicate people) can exist across leagues
- League-specific data (number, status) stored in pivot table

---

## Navigation to Driver Management

### Entry Points

1. **League Dashboard → Drivers tab:** Main driver management interface
2. **League Settings → Drivers:** Alternative access point
3. **Season Creation Flow:** "Add drivers from league roster" during season setup

---

## Driver Database Schema

### drivers Table (Global Pool)

```sql
drivers {
  id: integer (primary key)
  
  -- Basic Information (at least first OR last name required)
  first_name: string (nullable)
  last_name: string (nullable)
  nickname: string (nullable) -- Optional display name
  
  -- Contact Information (optional)
  email: string (nullable)
  phone: string (nullable)
  
  -- Platform IDs (at least ONE required)
  -- Gran Turismo 7
  psn_id: string (nullable, indexed)
  gt7_id: string (nullable, indexed)
  
  -- iRacing
  iracing_id: string (nullable, indexed)
  iracing_customer_id: integer (nullable)
  
  -- Steam-based (ACC, rF2, AMS2)
  steam_id: string (nullable, indexed)
  steam_name: string (nullable)
  
  -- Xbox
  xbox_gamertag: string (nullable, indexed)
  
  -- Generic/Custom
  custom_platform_id: string (nullable)
  custom_platform_name: string (nullable)
  
  -- Metadata
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (soft delete)
}

-- IMPORTANT: No league_id here. Drivers are global entities.
-- Duplicates allowed (same person can have multiple driver records).
```

### league_drivers Table (Pivot - Driver to League Association)

```sql
league_drivers {
  id: integer (primary key)
  league_id: integer (foreign key)
  driver_id: integer (foreign key)
  
  -- League-specific data
  driver_number: integer (nullable) -- League-specific number
  status: enum ('active', 'inactive', 'banned')
  
  -- Notes (league-specific, manager use only)
  league_notes: text (nullable)
  
  -- Metadata
  added_to_league_at: timestamp
  updated_at: timestamp
  
  -- Indexes
  UNIQUE INDEX (league_id, driver_id) -- Prevent duplicate associations
  INDEX (league_id)
  INDEX (driver_id)
}

-- This allows:
-- 1. Same driver (global ID) in multiple leagues
-- 2. Different driver records (duplicate people) in multiple leagues
-- 3. League-specific settings (number, status, notes)
```

### season_drivers Table (Assignment to Seasons)

```sql
season_drivers {
  id: integer (primary key)
  season_id: integer (foreign key)
  league_driver_id: integer (foreign key to league_drivers)
  
  -- Season-specific assignments
  division_id: integer (foreign key, nullable)
  team_id: integer (foreign key, nullable)
  driver_number_override: integer (nullable) -- Override league number
  
  -- Status
  status: enum ('active', 'reserve', 'withdrawn', 'dns')
  
  -- Notes (season-specific)
  season_notes: text (nullable)
  
  -- Metadata
  added_at: timestamp
  updated_at: timestamp
  
  -- Indexes
  UNIQUE INDEX (season_id, league_driver_id)
  INDEX (season_id)
  INDEX (league_driver_id)
}
```

---

## Driver Management Dashboard

**Location:** League Dashboard → Drivers tab

```
═══════════════════════════════════════════════════
LEAGUE DRIVERS
Sydney Racing League
═══════════════════════════════════════════════════

[+ Add Driver] [Import CSV] [Export CSV] [Bulk Actions ▼]

[Search drivers...] [Filter: All ▼] [Sort: Name A-Z ▼]

Total Drivers in League: 150
Active: 142 | Inactive: 8 | Banned: 0

ℹ️  These are drivers associated with THIS league.
   Some may also be in other leagues.

┌────┬───┬──────────────────┬────────────────┬──────────┬──────┬────────┐
│ #  │ St│ Name             │ Platform ID    │ Email    │ Multi│ Actions│
├────┼───┼──────────────────┼────────────────┼──────────┼──────┼────────┤
│ 5  │ ✓ │ John Smith       │ JohnSmith77    │ j@email  │  🔗  │[Edit][×]│
│ 7  │ ✓ │ Jane Doe         │ JaneDoe_GT     │ jane@em  │      │[Edit][×]│
│ 3  │ ✓ │ Mike Ross        │ MikeR_Racing   │ -        │  🔗  │[Edit][×]│
│ 23 │ ✓ │ Sarah Williams   │ SarahW_GT      │ s@email  │      │[Edit][×]│
│ 12 │ ⏸ │ Chris Brown      │ ChrisB77       │ c@email  │      │[Edit][×]│
└────┴───┴──────────────────┴────────────────┴──────────┴──────┴────────┘

✓ = Active | ⏸ = Inactive | ⛔ = Banned
🔗 = Also in other leagues

[Showing 1-50 of 150] [← Previous] [Next →]

Driver Participation Summary
───────────────────────────────────────────────────
┌────────────────────────────────────────────────────────┐
│ Most Active Drivers (by competition participation):   │
│ 1. John Smith - 3 competitions, 5 seasons (🔗 2 other leagues)│
│ 2. Jane Doe - 3 competitions, 4 seasons               │
│ 3. Mike Ross - 2 competitions, 3 seasons (🔗 1 other league)│
└────────────────────────────────────────────────────────┘
```

---

## Adding a Single Driver

**Click [+ Add Driver]:**

```
═══════════════════════════════════════════════════
ADD DRIVER TO LEAGUE
Sydney Racing League
═══════════════════════════════════════════════════

BASIC INFORMATION
───────────────────────────────────────────────────

First Name
[_________________________]

Last Name
[_________________________]

Nickname / Display Name (optional)
[_________________________]
Used for display if provided, otherwise uses First Last

Driver Number (optional, league-specific)
[___] (1-999)
Can be used for identification and car liveries

ℹ️  At least first name OR last name required


PLATFORM IDENTIFIERS
───────────────────────────────────────────────────

League Platforms: Gran Turismo 7, iRacing

Gran Turismo 7
PSN ID*
[_________________________]
Required for GT7 competitions

GT7 ID (optional, auto-detected)
[_________________________]

iRacing
iRacing Name
[_________________________]

iRacing Customer ID (optional)
[_________________________]

ℹ️  At least ONE platform ID required


CONTACT INFORMATION (Optional)
───────────────────────────────────────────────────

Email
[_________________________]

Phone
[_________________________]


STATUS
───────────────────────────────────────────────────

Driver Status
● Active (can participate in competitions)
○ Inactive (cannot be added to new seasons)

ℹ️  Inactive drivers remain in league roster but 
   cannot be selected for new seasons


INTERNAL NOTES (Optional)
───────────────────────────────────────────────────

Manager Notes (not visible to drivers)
┌──────────────────────────────────────────────────┐
│                                                  │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════

[Cancel]  [Add Driver]
```

---

## Bulk CSV Import

**Click [Import CSV]:**

```
═══════════════════════════════════════════════════
IMPORT DRIVERS TO LEAGUE
Sydney Racing League
═══════════════════════════════════════════════════

League Platforms: Gran Turismo 7, iRacing

STEP 1: DOWNLOAD TEMPLATE OR PASTE DATA
───────────────────────────────────────────────────

[Download CSV Template]
  → Generates template with headers based on league platforms

CSV Format Options:

Option 1: Full Details (Recommended)
FirstName,LastName,Nickname,PSN_ID,GT7_ID,Email,DriverNumber

Option 2: Minimum Required (Names + Platform ID)
FirstName,LastName,PSN_ID

Option 3: Platform ID Only (Creates basic profiles)
PSN_ID


Example CSV Data:
───────────────────────────────────────────────────
FirstName,LastName,PSN_ID,Email,DriverNumber
John,Smith,JohnSmith77,john@email.com,5
Jane,Doe,JaneDoe_GT,jane@email.com,7
Mike,Ross,MikeR_Racing,,3
,Williams,SarahW_GT,sarah@email.com,23
Chris,,ChrisB77,chris@email.com,


PASTE CSV DATA HERE:
┌──────────────────────────────────────────────────┐
│ FirstName,LastName,PSN_ID,Email,DriverNumber     │
│ John,Smith,JohnSmith77,john@email.com,5         │
│ Jane,Doe,JaneDoe_GT,jane@email.com,7            │
│ Mike,Ross,MikeR_Racing,,3                       │
│                                                  │
│                                                  │
└──────────────────────────────────────────────────┘

Or upload file: [Choose CSV File]

Import Options:
☑ Mark all as Active (can be changed later)
☐ Skip rows with insufficient data
☑ Auto-generate missing names from Platform IDs
☐ Update existing drivers if Platform ID matches

[Cancel]  [Preview Import →]
```

---

## CSV Import Preview & Validation

```
═══════════════════════════════════════════════════
IMPORT PREVIEW - 5 Drivers Detected
═══════════════════════════════════════════════════

The system checks for:
1. Existing driver record in GLOBAL pool (by Platform ID)
2. If found, check if already in THIS league
3. If not found, create new global driver record

┌────────────────────────────────────────────────────────┐
│ + NEW DRIVER (Create Global + Add to League)          │
├────────────────────────────────────────────────────────┤
│ CSV Row 1: John Smith                                  │
│ • PSN ID: JohnSmith77                                  │
│ • Email: john@email.com                                │
│ • Driver Number: 5 (league-specific)                   │
│                                                        │
│ → No global driver record found with PSN: JohnSmith77  │
│                                                        │
│ Action: ✓ Create new global driver                    │
│         ✓ Add to Sydney Racing League                 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ⚠️  ALREADY IN THIS LEAGUE                             │
├────────────────────────────────────────────────────────┤
│ CSV Row 2: Jane Doe                                    │
│ • PSN ID: JaneDoe_GT                                   │
│                                                        │
│ → Global driver found: Jane Doe (Driver ID: 287)       │
│ → Already in Sydney Racing League (ID: 142)            │
│   Current Number: 7                                    │
│   Current Status: Active                               │
│   Currently in: Fall 2024, Summer 2024                 │
│                                                        │
│ ○ Skip (keep existing association unchanged)          │
│ ● Update league data (overwrite number, status)       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ + EXISTING DRIVER, ADD TO LEAGUE                      │
├────────────────────────────────────────────────────────┤
│ CSV Row 3: Mike Ross                                   │
│ • PSN ID: MikeR_Racing                                 │
│ • Driver Number: 3                                     │
│                                                        │
│ → Global driver found: Mike Ross (Driver ID: 398)      │
│   Currently in: Melbourne Racing League                │
│ → NOT in Sydney Racing League                          │
│                                                        │
│ Action: ✓ Add existing driver to Sydney Racing League │
│         (Driver can be in multiple leagues)            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ⚠️  POTENTIAL DUPLICATE PERSON                         │
├────────────────────────────────────────────────────────┤
│ CSV Row 4: Sarah Williams                              │
│ • PSN ID: SarahW_GT                                    │
│ • Email: sarah@email.com                               │
│                                                        │
│ → Global driver found: Sarah Williams (Driver ID: 156) │
│   PSN ID: SarahW_Racing (DIFFERENT)                    │
│   Email: sarah@email.com (MATCHES)                     │
│                                                        │
│ ⚠️  Same name + email, but DIFFERENT PSN ID            │
│                                                        │
│ This might be:                                         │
│ • Same person with new PSN account                     │
│ • Different person (duplicate name)                    │
│                                                        │
│ ○ Use existing driver record (ID: 156)                │
│ ● Create new driver record (allow duplicate)          │
│ ○ Update existing PSN ID to: SarahW_GT                │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ + NEW DRIVER (Missing Last Name)                      │
├────────────────────────────────────────────────────────┤
│ CSV Row 5: Chris                                       │
│ • PSN ID: ChrisB77                                     │
│ • Email: chris@email.com                               │
│                                                        │
│ → No global driver found                               │
│ → Last name missing, will use "ChrisB77" as last      │
│                                                        │
│ Action: ✓ Create as "Chris ChrisB77"                  │
│         ✓ Add to Sydney Racing League                 │
│ ℹ️  Can be edited after import                         │
└────────────────────────────────────────────────────────┘

Summary:
• 2 new global driver records will be created
• 1 existing driver will be added to this league
• 1 already in league (select action above)
• 1 potential duplicate detected (select action above)
• 0 errors

Duplicate Policy:
☐ Prevent duplicate PSN IDs in global pool (strict)
● Allow duplicate PSN IDs (flexible - same person can have multiple records)

ℹ️  Allowing duplicates means the same person might have 
   multiple driver records if they change PSN accounts or 
   race under different identities.

[← Back]  [Cancel]  [Import Drivers]
```

---

## Error Handling

```
⚠️  ERRORS FOUND (2)

┌────────────────────────────────────────────────────────┐
│ ✗ ERROR - INSUFFICIENT DATA                           │
├────────────────────────────────────────────────────────┤
│ CSV Row 6: (empty row)                                │
│ Error: No data provided                                │
│                                                        │
│ Action: ☑ Skip this row                               │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ ✗ ERROR - NO IDENTIFIERS                              │
├────────────────────────────────────────────────────────┤
│ CSV Row 7: ,,,,                                        │
│ Error: No name or platform ID provided                │
│                                                        │
│ Action: ☑ Skip this row                               │
└────────────────────────────────────────────────────────┘

Options:
☑ Skip all rows with errors
☐ Attempt to import partial data where possible

Valid drivers to import: 4 of 7
```

---

## Edit Existing Driver

**Click [Edit] next to driver:**

```
═══════════════════════════════════════════════════
EDIT DRIVER ASSOCIATION
John Smith (#5) - Sydney Racing League
═══════════════════════════════════════════════════

ℹ️  This driver is in 2 leagues total:
   • Sydney Racing League (this league)
   • Melbourne Racing League

You are editing settings for THIS league only.

LEAGUE-SPECIFIC SETTINGS
───────────────────────────────────────────────────

Driver Number (Sydney Racing League)
[5__] (1-999)

Status (Sydney Racing League)
● Active
○ Inactive
○ Banned

League Notes (Sydney Racing League)
┌──────────────────────────────────────────────────┐
│ Very consistent driver, good sportsmanship.      │
│ Prefers Division 1 racing.                       │
└──────────────────────────────────────────────────┘

⚠️  Setting to Inactive will:
   • Keep driver in league roster
   • Prevent adding to new seasons in THIS league
   • NOT affect other leagues (Melbourne: Active)


GLOBAL DRIVER INFORMATION
───────────────────────────────────────────────────

ℹ️  Changes here affect ALL leagues this driver is in.

[View/Edit Global Driver Info →]

First Name:      John
Last Name:       Smith
Nickname:        -
PSN ID:          JohnSmith77
GT7 ID:          abc123xyz
Email:           john@email.com

Last Updated:    Feb 15, 2025


PARTICIPATION HISTORY (This League Only)
───────────────────────────────────────────────────

Currently in:
• Sunday Night Racing - Spring 2025 (Division 1)
• GT3 Championship - Spring 2025 (Division 1)

Previously in:
• Sunday Night Racing - Fall 2024 (Division 1)
• F1 Series - Summer 2024 (Division 2)

Total Seasons (Sydney Racing): 4
Total Races (Sydney Racing): 48

[View Full History]

═══════════════════════════════════════════════════

[Cancel]  [Save League Settings]  [Remove from League]
```

---

## Edit Global Driver Information

**Click [View/Edit Global Driver Info →]:**

```
═══════════════════════════════════════════════════
EDIT GLOBAL DRIVER
John Smith (Driver ID: 142)
═══════════════════════════════════════════════════

⚠️  IMPORTANT: Changes here affect this driver in ALL leagues

Currently in leagues:
• Sydney Racing League (#5, Active)
• Melbourne Racing League (#12, Active)

BASIC INFORMATION
───────────────────────────────────────────────────

First Name
[John_________________________]

Last Name
[Smith________________________]

Nickname / Display Name
[_________________________]


PLATFORM IDENTIFIERS
───────────────────────────────────────────────────

Gran Turismo 7
PSN ID
[JohnSmith77___________________]

GT7 ID
[abc123xyz_____________________]

iRacing
iRacing Name
[_________________________]

iRacing Customer ID
[_________________________]


CONTACT INFORMATION
───────────────────────────────────────────────────

Email
[john@email.com_______________]

Phone
[_________________________]


NOTES
───────────────────────────────────────────────────

ℹ️  These are global notes. For league-specific notes,
   edit the driver in each league separately.

Global Notes
┌──────────────────────────────────────────────────┐
│ Account created: Jan 2024                        │
│ Preferred communication: Email                   │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════

[Cancel]  [Save Global Changes]  [Delete Global Driver]
```

---

## Delete Global Driver

**Click [Delete Global Driver]:**

```
┌─────────────────────────────────────────────────┐
│ DELETE GLOBAL DRIVER                            │
├─────────────────────────────────────────────────┤
│                                                 │
│ Are you sure you want to delete John Smith     │
│ from the ENTIRE SYSTEM?                         │
│                                                 │
│ ⚠️  CRITICAL WARNING:                           │
│                                                 │
│ This driver is currently in 2 leagues:         │
│ • Sydney Racing League                          │
│ • Melbourne Racing League                       │
│                                                 │
│ Deleting will:                                  │
│ • Remove from ALL leagues                       │
│ • Preserve ALL historical results               │
│ • Driver name will show in past results         │
│ • Cannot be undone (soft delete)                │
│                                                 │
│ Alternative: Remove from THIS league only       │
│                                                 │
│ [Cancel]  [Remove from This League Only]        │
│           [Delete from All Leagues]             │
└─────────────────────────────────────────────────┘
```

---

## Season Driver Selection

**Location:** Season Creation → Add Drivers step

```
═══════════════════════════════════════════════════
ADD DRIVERS TO SEASON
Spring 2025 Season - Sunday Night Racing
═══════════════════════════════════════════════════

SELECT FROM LEAGUE ROSTER
───────────────────────────────────────────────────

League: Sydney Racing League (150 active drivers)

⚠️  Only drivers already in the league roster can be added.
   To add new drivers, go to: League Dashboard → Drivers → Add Driver

[Search drivers...] [Filter ▼] [Select All] [Select None]

Available Drivers (150 Active)
┌────┬──────────────────┬────────────────┬────────┬──────┐
│ ☐  │ Name             │ Platform ID    │ #      │ Hist │
├────┼──────────────────┼────────────────┼────────┼──────┤
│ ☐  │ John Smith       │ JohnSmith77    │ 5      │ ⭐⭐⭐│
│ ☐  │ Jane Doe         │ JaneDoe_GT     │ 7      │ ⭐⭐⭐│
│ ☐  │ Mike Ross        │ MikeR_Racing   │ 3      │ ⭐⭐  │
│ ☐  │ Sarah Williams   │ SarahW_GT      │ 23     │ ⭐⭐⭐│
│ ☐  │ Chris Brown      │ ChrisB77       │ 12     │ ⭐   │
└────┴──────────────────┴────────────────┴────────┴──────┘

⭐⭐⭐ = Competed in this competition before
⭐⭐ = Competed in league before
⭐ = New to league

[Showing 1-50 of 150]

Selected Drivers: 0
───────────────────────────────────────────────────

Quick Selection Shortcuts:
[Select Previous Season Drivers] (45 drivers)
  → Fall 2024 - Sunday Night Racing drivers

[Select by Competition History]
  → All drivers who competed in Sunday Night Racing

[Select All Active] (150 drivers)
  → All active drivers in league roster

═══════════════════════════════════════════════════

⚠️  Driver Assignment Options:

○ Add all selected drivers to season now
  • Drivers added without division assignments
  • Assign to divisions later
  
○ Skip this step, add drivers later
  • Create empty season
  • Add drivers from Season Dashboard

[← Back]  [Skip & Continue] [Add Selected Drivers →]
```

---

## Filter Options

```
[Filter ▼]
  Participation History
  ─────────────────────
  • All Drivers
  • Competed in This Competition Before
  • New to This Competition
  • Competed Last Season
  • Never Competed
  
  Driver Status
  ─────────────────────
  • Active Only (default)
  • Inactive Only
  • All Statuses
  
  Platform
  ─────────────────────
  • Has PSN ID
  • Has GT7 ID
  • Has iRacing ID
  • Missing Platform ID
  
  Driver Number
  ─────────────────────
  • Has Number
  • No Number Assigned
  
  Contact Info
  ─────────────────────
  • Has Email
  • Has Phone
  • No Contact Info
```

---

## Bulk Actions

```
[Bulk Actions ▼]
  
  Selection Actions
  ─────────────────────
  • Add Selected to Season...
  • Export Selected (CSV)
  • Send Email to Selected
  
  Status Changes
  ─────────────────────
  • Set Selected to Active
  • Set Selected to Inactive
  • Ban Selected Drivers
  
  Data Management
  ─────────────────────
  • Merge Duplicate Drivers
  • Bulk Update Platform IDs
  • Assign Driver Numbers
  
  Analysis
  ─────────────────────
  • View Participation Report
  • Export Driver Statistics
```

---

## Driver Participation View

**Location:** Driver Details → [View Full History]

```
═══════════════════════════════════════════════════
DRIVER PARTICIPATION HISTORY
John Smith (#5)
═══════════════════════════════════════════════════

Competitions (3)
───────────────────────────────────────────────────

🏎️ Sunday Night Racing
  └─ Spring 2025 (Division 1) - Active
  └─ Fall 2024 (Division 1) - Complete
     • 12 races, 3 wins, 8 podiums
     • Champion
     
🏁 GT3 Championship
  └─ Spring 2025 (Division 1) - Active
  └─ Fall 2024 (Division 2) - Complete
     • 10 races, 2 wins, 5 podiums
     • 2nd place

🏆 F1 Series
  └─ Summer 2024 (Division 2) - Complete
     • 8 races, 1 win, 3 podiums
     • 3rd place

Career Statistics
───────────────────────────────────────────────────
Total Seasons:           4
Total Races:            48
Total Wins:              8
Total Podiums:          18
Pole Positions:          7
Fastest Laps:           12
Championships:           1
Average Finish:        P3.2

[Export Full History]
```

---

## Business Rules

### Global Driver Pool
- Drivers exist in global pool, independent of leagues
- **Duplicates allowed:** Same person can have multiple driver records
- Platform IDs are NOT globally unique (flexibility for account changes)
- No automatic merging of duplicates

### League Association (Pivot Table)
- Same driver (global ID) can be in multiple leagues
- Each league association has its own settings:
  - Driver number (league-specific)
  - Status (active/inactive/banned per league)
  - Notes (league-specific manager notes)
- `UNIQUE` constraint: driver can only be added to a league once
- Removing from league doesn't delete global driver record

### Platform ID Requirements
- At least ONE platform ID required when creating driver
- Platform requirements based on league's configured platforms
- Multiple platform IDs allowed (cross-platform racing)
- Same PSN ID can exist on multiple driver records (duplicates OK)

### Driver Numbers
- Optional at league level (stored in `league_drivers` pivot)
- Can be overridden at season level
- Uniqueness not enforced (multiple drivers can share numbers)
- Different leagues can assign different numbers to same driver

### Status Management
- Status stored in `league_drivers` pivot (per-league)
- **Active:** Can be added to new seasons in this league
- **Inactive:** Remains in league roster, blocked from new seasons
- **Banned:** Removed from future considerations in this league
- Same driver can be Active in League A, Banned in League B

### Name Requirements
- At least First OR Last name required
- Nickname optional, used for display if provided
- Auto-generation from Platform ID if names missing

### Deletion
- Soft delete on `league_drivers` (removes from league)
- Global driver record preserved
- Historical results remain intact
- Driver can be re-added to league later

### Cross-League Scenarios
**Scenario 1: Same Person, Multiple Leagues**
```
Driver #142 (John Smith, PSN: JohnSmith77)
  ├─ Sydney Racing League (#5, Active)
  └─ Melbourne Racing League (#12, Active)
```

**Scenario 2: Duplicate Records, Same Person**
```
Driver #142 (John Smith, PSN: JohnSmith77)
  └─ Sydney Racing League (#5, Active)

Driver #287 (John Smith, PSN: JSmith_Racing) -- New account
  └─ Melbourne Racing League (#5, Active)
```

**Scenario 3: Same Driver ID, Different Leagues**
```
Driver #142 (John Smith, PSN: JohnSmith77)
  ├─ Sydney Racing League (#5, Active, Notes: "Very fast")
  └─ Brisbane Racing League (#23, Inactive, Notes: "Retired")
```

---

## Integration with Season Creation

### Modified Season Creation Flow

**Original Flow:**
```
1. Create Season
2. Add Drivers (CSV import or manual)
3. Create Divisions
4. Assign Drivers to Divisions
```

**New Flow:**
```
1. Create Season
2. Select Drivers from League Roster (checkbox selection)
3. Create Divisions
4. Assign Drivers to Divisions
```

### Season Driver Selection Changes

In `05-Season-Creation.md`, the "Adding Drivers to Season" section would change to:

```
═══════════════════════════════════════════════════
ADD DRIVERS TO SEASON
Spring 2025 Season
═══════════════════════════════════════════════════

SOURCE: LEAGUE ROSTER
───────────────────────────────────────────────────

Sydney Racing League has 150 active drivers.

[Select from League Roster →]

OR

[Import Additional Drivers]
  → Add new drivers to league roster first,
    then add them to this season
```

---

## Migration from Old System

If migrating from old system where drivers were season-specific:

```
═══════════════════════════════════════════════════
MIGRATION TOOL
═══════════════════════════════════════════════════

Detected: 250 drivers across all seasons

This tool will consolidate drivers to league level:
• Merge duplicate drivers (same Platform ID)
• Preserve all historical data
• Create league-level driver roster

┌────────────────────────────────────────────────────┐
│ PREVIEW                                            │
├────────────────────────────────────────────────────┤
│ • 250 season-level drivers found                   │
│ • 150 unique drivers detected                      │
│ • 100 duplicates will be merged                    │
│                                                    │
│ Merge Strategy:                                    │
│ • Matched by Platform ID                           │
│ • Most recent data used                            │
│ • All historical results preserved                 │
└────────────────────────────────────────────────────┘

[Preview Merges] [Start Migration]
```

---

## Future Enhancements (Not in v1)

- Driver profiles (photos, bio, social media)
- Driver statistics dashboard
- Driver performance trends across seasons
- Driver skill ratings / ELO system
- Driver achievements / badges
- Driver self-registration portal
- Driver profile visibility settings
- Cross-league driver transfer system
- Driver availability calendar

---

## Related Documentation

- `01-League-Creation.md` - Creating parent leagues
- `05-Season-Creation.md` - Season creation (updated driver selection flow)
- `04-Dashboard-Layouts.md` - Driver views in dashboards