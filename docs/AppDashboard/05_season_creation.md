# Season Creation Documentation

**Version:** 1.0  
**Last Updated:** October 17, 2025

---

## Overview

A **Season** represents a time-bound championship period within a competition. Seasons contain divisions, drivers, teams, and rounds. This is where the bulk of league management happens.

### Key Concepts

- **Flexible Setup:** Create season structure first, organize later
- **Driver Pool:** Add drivers to season, assign to divisions later
- **Team Championships:** Optional, enabled at season level
- **Platform-Specific:** Inherits platform from competition
- **Configuration:** Detailed race settings configured at round level

---

## Hierarchical Structure

```
Competition
  └─ Season
      ├─ Divisions (skill-based groupings)
      ├─ Drivers (assigned to divisions)
      ├─ Teams (optional, for team championship)
      └─ Rounds (race weekends)
          └─ Races (individual races with results)
```

---

## Navigation to Season Creation

### Entry Points

1. **Post-Competition Creation:** "Create Your First Season" button
2. **Competition Dashboard:** [+ Create Season] button
3. **Competition → Seasons tab:** [+ Create New Season] button
4. **Empty Season State:** Large CTA when no seasons exist

---

## Season Creation Form

### Simple Single-Page Form

```
═══════════════════════════════════════════════════
CREATE SEASON
Competition: Sunday Night Racing
═══════════════════════════════════════════════════

BASIC INFORMATION
───────────────────────────────────────────────────

Season Name* (required)
[________________________________________________]
Examples: "2025 Spring Season", "Season 3", "Summer Cup"
0/100 characters

Car Class/Restrictions (optional)
[________________________________________________]
Example: "GT3 Cars Only", "Gr.3 BOP Enabled"
0/150 characters

Description (optional)
┌──────────────────────────────────────────────────┐
│ Season overview, rules, format, expectations... │
│                                                  │
└──────────────────────────────────────────────────┘
0/2000 characters

Technical Specifications (optional)
┌──────────────────────────────────────────────────┐
│ Tire restrictions, setup rules, regulations,    │
│ performance balance, tuning limits...            │
│                                                  │
└──────────────────────────────────────────────────┘
0/2000 characters


BRANDING
───────────────────────────────────────────────────

Season Logo (optional)
┌─────────────────────┐
│                     │
│  [Upload Logo]      │
│  or drag & drop     │
│                     │
│  Inherits from      │
│  competition if     │
│  not provided       │
└─────────────────────┘
PNG/JPG, max 2MB, 500x500px recommended

Season Banner/Header Image (optional)
┌──────────────────────────────────────────────────┐
│                                                  │
│          [Upload Banner Image]                   │
│            or drag & drop                        │
│                                                  │
└──────────────────────────────────────────────────┘
PNG/JPG, max 5MB, 1920x400px recommended


SETTINGS
───────────────────────────────────────────────────

Platform (locked from competition)
[Gran Turismo 7] 🔒

Team Championship
☐ Enable Team Championship
  Drivers can be assigned to teams. Team standings 
  calculated as sum of all driver points per round.

═══════════════════════════════════════════════════

[Cancel]  [Create Season]
```

---

## Field Specifications

### Required Fields

1. **Season Name** - 3-100 characters

### Optional Fields

- **Car Class/Restrictions** - 0-150 characters (plain text)
- **Description** - 0-2000 characters (rich text)
- **Technical Specifications** - 0-2000 characters (rich text)
- **Season Logo** - Image file (inherits from competition)
- **Season Banner** - Image file
- **Team Championship** - Boolean toggle (default: OFF)

---

## Saving
On save, a `slug` will be created for the season and saved in the database and will be used for the public dashboard. it will be unique, and will attempt to create from the Season name. Eg if Season is `Winter 2025` it will attempt to make a slug called `winter-2025`. If this is not unique for the League, Combintation and season of slugs, it will add a number at the end eg `winter-2025-01` and increment until an available slug is found.

## Post-Creation Flow

### Success Screen

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ✅  Season Created!                            │
│                                                 │
│  🏆 2025 Spring Season                          │
│  Sunday Night Racing • Gran Turismo 7          │
│                                                 │
│  Your season is ready. What would you like to  │
│  do next?                                      │
│                                                 │
│  Recommended workflow:                         │
│                                                 │
│  1️⃣  [Add Drivers →]                            │
│     Build your driver roster                   │
│                                                 │
│  2️⃣  [Create Divisions]                         │
│     Set up skill-based groups                  │
│                                                 │
│  3️⃣  [Create Rounds]                            │
│     Build your race calendar                   │
│                                                 │
│  ────────────────────────────────────────────  │
│                                                 │
│  [Go to Season Dashboard]                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Season Dashboard (Empty State)

After creation, when viewing season before drivers/rounds added:

```
═══════════════════════════════════════════════════
🏆 2025 SPRING SEASON
Sunday Night Racing • Gran Turismo 7       [⚙️ Edit]
═══════════════════════════════════════════════════

[Tabs: Overview | Drivers | Divisions | Teams | Rounds | Settings]

OVERVIEW TAB (Empty State)
───────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│                                                 │
│               🏁 Let's Get Started              │
│                                                 │
│  Your season is created. Follow these steps    │
│  to get racing:                                │
│                                                 │
│  Step 1: Add Drivers                           │
│  Import your driver roster using CSV or add    │
│  them individually.                            │
│  [Add Drivers →]                               │
│                                                 │
│  Step 2: Organize Divisions (Optional)         │
│  Create skill-based groups for your drivers.   │
│  [Create Divisions]                            │
│                                                 │
│  Step 3: Build Race Calendar                   │
│  Add rounds and configure race settings.       │
│  [Create Rounds]                               │
│                                                 │
└─────────────────────────────────────────────────┘

Season Information
───────────────────────────────────────────────────
Competition:       Sunday Night Racing
Platform:          Gran Turismo 7
Car Class:         GT3 Cars Only
Team Championship: Disabled
Created:           Feb 15, 2025

Current Status:    🔧 Setup in Progress
Total Drivers:     0
Total Divisions:   0
Total Rounds:      0
```

---

## Driver Management System

### Global Driver Database Schema

```javascript
drivers {
  id: integer (primary key)
  
  // Basic Information (always required)
  first_name: string (required)
  last_name: string (required)
  
  // Optional Contact
  email: string (nullable)
  phone: string (nullable)
  
  // Platform IDs (at least ONE required based on platform)
  // Gran Turismo 7
  psn_id: string (nullable)
  gt7_id: string (nullable)
  
  // iRacing
  iracing_id: string (nullable)
  iracing_name: string (nullable)
  
  // Steam-based (ACC, rF2, AMS2)
  steam_id: string (nullable)
  
  // Xbox
  xbox_gamertag: string (nullable)
  
  // Generic
  custom_platform_id: string (nullable)
  
  // Metadata
  created_at: timestamp
  updated_at: timestamp
}
```

### Season Driver Assignment Schema

```javascript
season_drivers {
  id: integer (primary key)
  season_id: integer (foreign key)
  driver_id: integer (foreign key to global drivers)
  
  // Season-specific assignments
  division_id: integer (foreign key, nullable - can be assigned later)
  team_id: integer (foreign key, nullable - optional)
  
  // Status
  status: enum ('active', 'reserve', 'withdrawn')
  
  // Notes
  notes: text (internal manager notes, nullable)
  
  // Metadata
  added_at: timestamp
  updated_at: timestamp
}
```

---

## Adding Drivers to Season

### Method 1: Bulk CSV Import (Recommended)

**Location:** Season → Drivers tab → [+ Add Drivers] → [Import from CSV]

```
═══════════════════════════════════════════════════
IMPORT DRIVERS FROM CSV
═══════════════════════════════════════════════════

Platform: Gran Turismo 7
Required Fields: First Name OR Last Name OR PSN ID OR GT7 ID
(At least one identifier required per driver)

[Download CSV Template]
  → Generates template based on season platform

CSV Format for Gran Turismo 7:
───────────────────────────────────────────────────

Option 1: Name + Platform IDs
FirstName,LastName,PSN_ID,GT7_ID

Option 2: Platform IDs Only (system creates names)
PSN_ID,GT7_ID

Option 3: Names Only (manual ID entry later)
FirstName,LastName


Example CSV Data:
───────────────────────────────────────────────────
John,Smith,JohnSmith77,abc123xyz
Jane,Doe,JaneDoe_GT,def456uvw
Mike,Ross,MikeR_Racing,ghi789rst
,Williams,SarahW_GT,jkl012mno
Chris,,ChrisB77,pqr345stu


Paste CSV Data Here:
┌──────────────────────────────────────────────────┐
│ FirstName,LastName,PSN_ID,GT7_ID                │
│ John,Smith,JohnSmith77,abc123xyz                │
│ Jane,Doe,JaneDoe_GT,def456uvw                   │
│ Mike,Ross,MikeR_Racing,ghi789rst                │
│                                                  │
│                                                  │
└──────────────────────────────────────────────────┘

Or upload file: [Choose CSV File]

Import Options:
☐ Automatically create divisions if needed
☐ Skip rows with insufficient data
☐ Add duplicate drivers as new entries

[Cancel]  [Preview Import →]
```

---

### CSV Import Preview & Matching

After pasting/uploading CSV:

```
═══════════════════════════════════════════════════
IMPORT PREVIEW - 5 Drivers Detected
═══════════════════════════════════════════════════

The system attempts to match drivers with existing
database records. If ANY field differs, a new driver
is created.

┌────────────────────────────────────────────────────────┐
│ ✓ EXACT MATCH FOUND                                    │
├────────────────────────────────────────────────────────┤
│ CSV Row 1: John Smith                                  │
│ • PSN ID: JohnSmith77                                  │
│ • GT7 ID: abc123xyz                                    │
│                                                        │
│ → Matched existing driver: John Smith (ID: 142)        │
│   Previously competed in: Fall 2024, Summer 2024       │
│                                                        │
│ Action: ✓ Add to season (no new driver created)       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ + NEW DRIVER (Name match, different IDs)              │
├────────────────────────────────────────────────────────┤
│ CSV Row 2: Jane Doe                                    │
│ • PSN ID: JaneDoe_GT                                   │
│ • GT7 ID: def456uvw                                    │
│                                                        │
│ → Partial match found: Jane Doe (ID: 287)              │
│   Existing PSN ID: JaneDoe_Racing (DIFFERENT)          │
│   Existing GT7 ID: xyz789def (DIFFERENT)               │
│                                                        │
│ ⚠️ IDs don't match - will create NEW driver            │
│                                                        │
│ Action: + Create new driver entry                     │
│ ○ Ignore differences, use existing driver (not rec.)  │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ + NEW DRIVER                                           │
├────────────────────────────────────────────────────────┤
│ CSV Row 3: Mike Ross                                   │
│ • PSN ID: MikeR_Racing                                 │
│ • GT7 ID: ghi789rst                                    │
│                                                        │
│ → No existing match found                              │
│                                                        │
│ Action: + Create new driver                           │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ + NEW DRIVER (Name incomplete)                        │
├────────────────────────────────────────────────────────┤
│ CSV Row 4: Williams (first name missing)              │
│ • PSN ID: SarahW_GT                                    │
│ • GT7 ID: jkl012mno                                    │
│                                                        │
│ → Will use PSN ID as display name until updated        │
│                                                        │
│ Action: + Create as "SarahW_GT Williams"              │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ + NEW DRIVER (Last name missing)                      │
├────────────────────────────────────────────────────────┤
│ CSV Row 5: Chris (last name missing)                  │
│ • PSN ID: ChrisB77                                     │
│ • GT7 ID: pqr345stu                                    │
│                                                        │
│ → Will use PSN ID as display name until updated        │
│                                                        │
│ Action: + Create as "Chris ChrisB77"                  │
└────────────────────────────────────────────────────────┘

Summary:
• 1 existing driver matched and will be added
• 4 new drivers will be created
• 0 errors
• 0 duplicates detected

[← Back]  [Cancel]  [Import 5 Drivers]
```

---

### CSV Import Validation & Error Handling

```
⚠️ ERRORS FOUND (2)

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
│ CSV Row 7: ,,, (commas only)                          │
│ Error: No name or platform ID provided                │
│                                                        │
│ Action: ☑ Skip this row                               │
└────────────────────────────────────────────────────────┘

⚠️ WARNINGS (1)

┌────────────────────────────────────────────────────────┐
│ ⚠ WARNING - DUPLICATE IN IMPORT                       │
├────────────────────────────────────────────────────────┤
│ CSV Row 8: John Smith (JohnSmith77)                   │
│ Warning: Same driver appears multiple times in CSV     │
│                                                        │
│ First occurrence: Row 1                                │
│ Duplicate occurrence: Row 8                            │
│                                                        │
│ ○ Import both (create duplicate)                      │
│ ● Skip duplicate (recommended)                        │
└────────────────────────────────────────────────────────┘

Options:
☑ Skip all rows with errors
☐ Attempt to import partial data where possible
☑ Skip duplicate entries automatically

Valid drivers to import: 3 of 8
```

---

### Method 2: Add Single Driver

**Location:** Season → Drivers tab → [+ Add Driver]

```
═══════════════════════════════════════════════════
ADD DRIVER TO SEASON
═══════════════════════════════════════════════════

SEARCH EXISTING DRIVERS
───────────────────────────────────────────────────

Search by name or platform ID:
┌──────────────────────────────────────────────────┐
│ [Start typing to search...                   🔍] │
└──────────────────────────────────────────────────┘

Existing drivers matching your search:
┌────────────────────────────────────────────────────┐
│ John Smith                                         │
│ PSN: JohnSmith77 • GT7: abc123xyz                 │
│ Previously: Fall 2024, Summer 2024                 │
│ [Add to Season]                                    │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ John Johnson                                       │
│ PSN: JJ_Racing • GT7: xyz789abc                    │
│ Previously: Fall 2024                              │
│ [Add to Season]                                    │
└────────────────────────────────────────────────────┘

───────────────────────────────────────────────────
OR CREATE NEW DRIVER
───────────────────────────────────────────────────

Driver Information
(At least ONE field required: Name OR Platform ID)

First Name
[_________________________]

Last Name
[_________________________]

Platform IDs (Gran Turismo 7)

PSN ID*
[_________________________]
Required for Gran Turismo 7

GT7 ID (optional, can be auto-detected)
[_________________________]

Email (optional)
[_________________________]

───────────────────────────────────────────────────
SEASON ASSIGNMENT (Optional - can assign later)
───────────────────────────────────────────────────

Division
[Select Division ▼]
  • None (assign later)
  • Division 1
  • Division 2
  • + Create New Division

Team (if team championship enabled)
[Select Team ▼]
  • No Team
  • Red Racing
  • Blue Thunder
  • + Create New Team

Internal Notes (not visible to drivers)
┌──────────────────────────────────────────────────┐
│                                                  │
└──────────────────────────────────────────────────┘

[Cancel]  [Add Driver]
```

---

## Driver Management View

**Location:** Season → Drivers tab

```
═══════════════════════════════════════════════════
SEASON DRIVERS (45)
═══════════════════════════════════════════════════

[+ Add Driver]  [Import CSV]  [Manage Assignments]  [Export]

[Search drivers...] [Filter: All ▼] [Sort: Name A-Z ▼]

Unassigned Drivers (8)
───────────────────────────────────────────────────
Drivers not yet assigned to a division

┌────┬──────────────────┬────────────────┬──────┬────────┐
│ ID │ Name             │ Platform ID    │ Div  │ Team   │
├────┼──────────────────┼────────────────┼──────┼────────┤
│142 │ John Smith       │ JohnSmith77    │ TBD  │ Solo   │
│287 │ Jane Doe         │ JaneDoe_GT     │ TBD  │ Solo   │
│398 │ Mike Ross        │ MikeR_Racing   │ TBD  │ Solo   │
└────┴──────────────────┴────────────────┴──────┴────────┘

[Bulk Assign to Division]

Division 1 (16 drivers)
───────────────────────────────────────────────────

┌────┬──────────────────┬────────────────┬──────┬────────┐
│ ID │ Name             │ Platform ID    │ Div  │ Team   │
├────┼──────────────────┼────────────────┼──────┼────────┤
│205 │ Chris Brown      │ ChrisB77       │ Div 1│ Red    │
│312 │ Emma Davis       │ EmmaD_GT       │ Div 1│ Red    │
│441 │ Alex Lee         │ AlexL_Racing   │ Div 1│ Blue   │
└────┴──────────────────┴────────────────┴──────┴────────┘

Division 2 (14 drivers)
───────────────────────────────────────────────────
[Similar table...]

[Showing 1-45 of 45]
```

---

## Division Management

### Creating Divisions

**Location:** Season → Divisions tab → [+ Create Division]

```
═══════════════════════════════════════════════════
CREATE DIVISION
═══════════════════════════════════════════════════

Division Name* (required)
[_________________________]
Examples: "Division 1", "Pro", "Amateur", "Rookie"

Short Name/Abbreviation (optional)
[_____]
Example: "D1", "PRO", "AM", "RK"
Used in compact views and reports

Description (optional)
┌──────────────────────────────────────────────────┐
│ Skill level, requirements, notes for drivers... │
│                                                  │
└──────────────────────────────────────────────────┘

Division Color (for UI/reports)
[Color Picker] 🎨 [#FF0000]

Order/Position (for sorting)
[___] (1-99, lower numbers appear first)

[Cancel]  [Create Division]
```

### Division Management View

**Location:** Season → Divisions tab

```
═══════════════════════════════════════════════════
DIVISIONS (3)                      [+ Create Division]
═══════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│ 🔴 Division 1 (Pro)                     [↑] [↓] │
│ Description: Top-tier drivers                   │
│                                                 │
│ 16 drivers • 5 teams                            │
│ Next race: Feb 18, 7:00 PM                      │
│                                                 │
│ [View Drivers] [View Standings] [Edit] [Delete]│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔵 Division 2 (Amateur)                 [↑] [↓] │
│ Description: Intermediate skill level           │
│                                                 │
│ 14 drivers • 4 teams                            │
│ Next race: Feb 18, 7:00 PM                      │
│                                                 │
│ [View Drivers] [View Standings] [Edit] [Delete]│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🟢 Division 3 (Rookie)                  [↑] [↓] │
│ Description: New and learning drivers           │
│                                                 │
│ 12 drivers • 3 teams                            │
│ Next race: Feb 18, 7:00 PM                      │
│                                                 │
│ [View Drivers] [View Standings] [Edit] [Delete]│
└─────────────────────────────────────────────────┘

Unassigned Drivers: 8 drivers not in any division
[Assign Drivers to Divisions]

[↑] [↓] = Reorder divisions (drag & drop also supported)
```

### Bulk Driver Assignment

**Location:** Season → Drivers → [Manage Assignments]

```
═══════════════════════════════════════════════════
ASSIGN DRIVERS TO DIVISIONS
═══════════════════════════════════════════════════

Drag and drop drivers between divisions or use 
dropdowns to assign.

Unassigned (8 drivers)
┌─────────────────────────────────────────────────┐
│ ☐ John Smith (JohnSmith77)         [Div ▼] [→] │
│ ☐ Jane Doe (JaneDoe_GT)            [Div ▼] [→] │
│ ☐ Mike Ross (MikeR_Racing)         [Div ▼] [→] │
│ ☐ Sarah Williams (SarahW_GT)       [Div ▼] [→] │
└─────────────────────────────────────────────────┘

[Select All] [Assign Selected to:] [Division ▼]

───────────────────────────────────────────────────

🔴 Division 1 (16 drivers)
┌─────────────────────────────────────────────────┐
│ ☐ Chris Brown (ChrisB77)           [Edit] [×]  │
│ ☐ Emma Davis (EmmaD_GT)            [Edit] [×]  │
│ ☐ Alex Lee (AlexL_Racing)          [Edit] [×]  │
└─────────────────────────────────────────────────┘

🔵 Division 2 (14 drivers)
┌─────────────────────────────────────────────────┐
│ ☐ Tom Wilson (TomW77)              [Edit] [×]  │
│ ☐ Sam Taylor (SamT_GT)             [Edit] [×]  │
└─────────────────────────────────────────────────┘

🟢 Division 3 (12 drivers)
[Similar list...]

[Cancel]  [Save Assignments]
```

---

## Team Management

### Team Championship Toggle

**Location:** Season Settings → General tab

```
═══════════════════════════════════════════════════
SEASON SETTINGS
═══════════════════════════════════════════════════

Team Championship
───────────────────────────────────────────────────

☑ Enable Team Championship

When enabled:
• Drivers can be assigned to teams
• Team standings calculated automatically
• Team points = Sum of all driver points per round
• Drivers can race solo (no team assignment required)

⚠️ Warning: Disabling will remove all team assignments

[Save Changes]
```

### Creating Teams

**Location:** Season → Teams tab → [+ Create Team]

```
═══════════════════════════════════════════════════
CREATE TEAM
═══════════════════════════════════════════════════

Team Name* (required)
[_________________________]
Example: "Red Racing", "Blue Thunder Motorsport"

Team Abbreviation (optional)
[_____]
Example: "RED", "BLU", "BTM"
Used in compact views

Team Color
[Color Picker] 🎨 [#FF0000]

Team Logo (optional)
┌─────────────────────┐
│                     │
│  [Upload Logo]      │
│  or drag & drop     │
│                     │
└─────────────────────┘
PNG/JPG, max 2MB, 500x500px recommended

Division Assignment (optional)
[Any Division ▼]
  • Any Division (team can have drivers from multiple divisions)
  • Division 1 Only
  • Division 2 Only
  • Division 3 Only

Notes (optional)
┌──────────────────────────────────────────────────┐
│ Team information, sponsors, notes...            │
└──────────────────────────────────────────────────┘

[Cancel]  [Create Team]
```

### Team Management View

**Location:** Season → Teams tab

```
═══════════════════════════════════════════════════
TEAMS (5)                              [+ Create Team]
═══════════════════════════════════════════════════

Team Championship Enabled
Points calculated as sum of all driver points per round.

┌─────────────────────────────────────────────────┐
│ 🔴 Red Racing                           [Edit]  │
│ 4 drivers (Div 1: 2, Div 2: 2)                 │
│ Current Season Points: 284 pts (2nd place)      │
│                                                 │
│ Members:                                        │
│ • Chris Brown (ChrisB77) - Div 1 - 118 pts     │
│ • Emma Davis (EmmaD_GT) - Div 1 - 98 pts       │
│ • Alex Lee (AlexL_Racing) - Div 2 - 45 pts     │
│ • Sam Taylor (SamT_GT) - Div 2 - 23 pts        │
│                                                 │
│ [Add Driver] [Edit Team] [Delete Team]         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔵 Blue Thunder                         [Edit]  │
│ 3 drivers (All Div 1)                          │
│ Current Season Points: 312 pts (1st place)      │
│                                                 │
│ Members:                                        │
│ • Tom Wilson (TomW77) - Div 1 - 125 pts        │
│ • Sarah Williams (SarahW_GT) - Div 1 - 115 pts │
│ • Mike Johnson (MikeJ_Racing) - Div 1 - 72 pts │
│                                                 │
│ [Add Driver] [Edit Team] [Delete Team]         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🟢 Green Machines                       [Edit]  │
│ 2 drivers (Div 2: 1, Div 3: 1)                 │
│ Current Season Points: 156 pts (3rd place)      │
│                                                 │
│ Members:                                        │
│ • Lisa Chen (LisaC_GT) - Div 2 - 95 pts        │
│ • David Kim (DavidK77) - Div 3 - 61 pts        │
│                                                 │
│ [Add Driver] [Edit Team] [Delete Team]         │
└─────────────────────────────────────────────────┘

Solo Drivers (No Team Assignment)
───────────────────────────────────────────────────
33 drivers racing without a team
[View List]
```

### Adding Driver to Team

**Location:** Team Details → [Add Driver]

```
═══════════════════════════════════════════════════
ADD DRIVER TO TEAM: Red Racing
═══════════════════════════════════════════════════

Available Drivers (not on any team)
───────────────────────────────────────────────────

[Search drivers...]

┌────────────────────────────────────────────────────┐
│ ☐ John Smith (JohnSmith77) - Div 1               │
│ ☐ Jane Doe (JaneDoe_GT) - Div 2                  │
│ ☐ Mike Ross (MikeR_Racing) - Div 1               │
└────────────────────────────────────────────────────┘

[Select All] [Select None]

Current Team Members (4)
───────────────────────────────────────────────────
• Chris Brown (ChrisB77) - Div 1
• Emma Davis (EmmaD_GT) - Div 1
• Alex Lee (AlexL_Racing) - Div 2
• Sam Taylor (SamT_GT) - Div 2

[Cancel]  [Add Selected Drivers]
```

---

## Business Rules

### Season Lifecycle

1. **Creation:** Simple form, minimal required fields
2. **Setup Phase:** Add drivers, create divisions/teams, build calendar
3. **Active Phase:** Rounds happening, results being entered
4. **Completed Phase:** All rounds finished, archive or keep active

### Driver Rules

- Drivers added to season go into a "pool"
- Division assignment is optional initially
- Same driver can be in multiple seasons simultaneously
- Driver data is global, assignments are season-specific

### Division Rules

- No maximum drivers per division
- Divisions can be created at any time
- Divisions can be reordered
- Drivers can be moved between divisions anytime
- Empty divisions allowed

### Team Rules

- Teams are optional (enabled per season)
- Drivers can be solo (no team)
- Teams can span multiple divisions
- Team points = sum of all driver points (per round, per season)
- No maximum drivers per team
- Teams can be created/edited anytime

---

## Database Schema

### seasons Table

```sql
seasons {
  id: integer (primary key)
  competition_id: integer (foreign key)
  
  -- Basic info
  name: string (100 chars)
  car_class: string (150 chars, nullable)
  description: text (nullable)
  technical_specs: text (nullable)
  
  -- Branding
  logo_url: string (nullable)
  banner_url: string (nullable)
  
  -- Settings
  team_championship_enabled: boolean (default false)
  
  -- Status
  status: enum ('setup', 'active', 'completed', 'archived')
  
  -- Metadata
  created_by_user_id: integer (foreign key)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (soft delete)
}
```

### divisions Table

```sql
divisions {
  id: integer (primary key)
  season_id: integer (foreign key)
  
  name: string (100 chars)
  short_name: string (10 chars, nullable)
  description: text (nullable)
  color: string (hex color, nullable)
  order: integer (for sorting)
  
  created_at: timestamp
  updated_at: timestamp
}
```

### teams Table

```sql
teams {
  id: integer (primary key)
  season_id: integer (foreign key)
  
  name: string (100 chars)
  abbreviation: string (10 chars, nullable)
  color: string (hex color, nullable)
  logo_url: string (nullable)
  division_id: integer (foreign key, nullable - any division if null)
  notes: text (nullable)
  
  created_at: timestamp
  updated_at: timestamp
}
```

---

## Future Enhancements (Not in v1)

- Season templates (clone previous season structure)
- Auto-division assignment based on skill ratings
- Driver import from other platforms
- Team invitations (drivers can request to join teams)
- Division promotion/relegation system
- Season registration windows with cutoff dates
- Driver eligibility rules (minimum races to qualify)
- Reserve driver management

---

## Related Documentation

- `03-Competition-Creation.md` - Creating parent competitions
- `04-Dashboard-Layouts.md` - Season dashboard layouts
- `06-Driver-Management.md` - Detailed driver workflows (to be created)
- `07-Round-Setup.md` - Creating rounds and calendar (to be created)
- `08-Result-Entry.md` - Entering race results (to be created)