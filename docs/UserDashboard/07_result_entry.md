# Result Entry Documentation

**Version:** 1.0  
**Last Updated:** October 17, 2025

---

## Overview

Result entry is the **most critical workflow** in the system. This process must be fast, accurate, and flexible to accommodate various race formats and data sources.

### Key Concepts

- **Division-by-Division Entry:** Enter results for one division at a time
- **CSV Paste & Parse:** Paste data, system parses into editable grid
- **Flexible Time Formats:** Support multiple time format variations
- **Penalty Application:** Add time penalties, automatically recalculate positions
- **Multi-Race Rounds:** Enter each race sequentially, aggregate at the end
- **Status Workflow:** Draft → Published → Finalized (with unlock capability)

---

## Result Entry Workflow

### Complete Flow

```
1. Select Division
   ↓
2. Enter Qualifying (if round has qualifying)
   ↓
3. Enter Race 1 Results
   ↓
4. Enter Race 2 Results (if multiple races)
   ↓
5. Enter Race 3 Results (if applicable)
   ↓
6. Review Aggregate Round Results
   ↓
7. Publish Results (visible on dashboard)
   ↓
8. Finalize Results (locked, but can be unlocked)
```

---

## Navigation to Result Entry

### Entry Points

1. **Season Dashboard:** "Enter Results" quick action
2. **Round Dashboard:** [Enter Results] button
3. **Calendar View:** Click round → [Enter Results]
4. **Division-Specific:** Round → Division tab → [Enter Results]

---

## Division Selection

**Location:** Round Dashboard → Results Entry

```
═══════════════════════════════════════════════════
ENTER RESULTS: ROUND 5 - BRANDS HATCH GP
═══════════════════════════════════════════════════

Select Division to Enter Results:

┌─────────────────────────────────────────────────┐
│ 🔴 Division 1 (Pro)                             │
│ 16 drivers • 1 race                             │
│ Status: ⏸️ Results not entered                  │
│ [Enter Results →]                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔵 Division 2 (Amateur)                         │
│ 14 drivers • 1 race                             │
│ Status: ✓ Results entered (Published)           │
│ [Edit Results] [View Results]                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🟢 Division 3 (Rookie)                          │
│ 12 drivers • 1 race                             │
│ Status: 🔒 Results finalized                    │
│ [View Results] [Unlock & Edit]                  │
└─────────────────────────────────────────────────┘
```

---

## Qualifying Entry (If Applicable)

**Note:** Qualifying is optional per round. If round has no qualifying, skip this step.

### Qualifying Entry Screen

```
═══════════════════════════════════════════════════
QUALIFYING RESULTS - DIVISION 1
Round 5 - Brands Hatch GP
═══════════════════════════════════════════════════

PASTE QUALIFYING DATA (CSV Format)
───────────────────────────────────────────────────

Expected format: Name, LapTime

Example:
John Smith, 1:23.456
Jane Doe, 1:23.789
Mike Ross, 1:24.012

┌──────────────────────────────────────────────────┐
│ John Smith, 1:23.456                            │
│ Jane Doe, 1:23.789                              │
│ Mike Ross, 1:24.012                             │
│ Sarah Williams, 1:24.234                        │
│                                                  │
│                                                  │
└──────────────────────────────────────────────────┘

[Parse Data] [Clear]
```

### After Parsing

```
═══════════════════════════════════════════════════
QUALIFYING RESULTS - DIVISION 1
═══════════════════════════════════════════════════

Pos│ Driver              │ Lap Time    │ Gap      │ Status
───┼─────────────────────┼─────────────┼──────────┼─────────
 1 │ John Smith          │ 1:23.456    │ -        │ ✓ Valid
 2 │ Jane Doe            │ 1:23.789    │ +0.333   │ ✓ Valid
 3 │ Mike Ross           │ 1:24.012    │ +0.556   │ ✓ Valid
 4 │ Sarah Williams      │ 1:24.234    │ +0.778   │ ✓ Valid
 5 │ [+ Add Driver]      │             │          │

Position and gap calculated automatically.

[+ Add Row Manually]

Drivers Not Listed (Did Not Qualify):
• Chris Brown (#11)
• Emma Davis (#22)
[Mark as DNS] or [Add to Grid]

[Save Draft] [Save & Continue to Race 1 →]
```

**Field Specifications:**
- **Driver:** Fuzzy matched against season driver list
- **Lap Time:** Required. Format: `mm:ss.SSS` or `h:mm:ss.SSS`
- **Gap:** Auto-calculated from fastest time
- **Status:** Auto-validated (Valid, Warning, Error)

---

## Race Result Entry

### Race Entry Screen (Initial)

```
═══════════════════════════════════════════════════
RACE 1 RESULTS - DIVISION 1
Round 5 - Brands Hatch GP
═══════════════════════════════════════════════════

PASTE RACE DATA (CSV Format)
───────────────────────────────────────────────────

Expected format: Name, RaceTime, FastestLap

Time Formats Supported:
• Full time: 36:24.582 or 1:23:45.678 (with hours)
• Gap after winner: +2.341 or 2.341
• Gap over 1 minute: +1:12.456
• Laps down: +1 LAP, +2 LAPS, 1 LAP, 2+ LAPS
• Did not finish: DNF (case insensitive)

Example:
John Smith, 36:24.582, 1:23.982
Jane Doe, +2.341, 1:24.123
Mike Ross, +5.782, 1:24.456
Sarah Williams, +1 LAP, 1:25.123
Chris Brown, DNF, 1:24.789
Emma Davis, DNS,

┌──────────────────────────────────────────────────┐
│ John Smith, 36:24.582, 1:23.982                 │
│ Jane Doe, +2.341, 1:24.123                      │
│ Mike Ross, +5.782, 1:24.456                     │
│ Sarah Williams, +1 LAP, 1:25.123                │
│ Chris Brown, DNF, 1:24.789                      │
│                                                  │
│                                                  │
└──────────────────────────────────────────────────┘

[Parse Data] [Clear]
```

### After Parsing - Editable Grid

```
═══════════════════════════════════════════════════
RACE 1 RESULTS - DIVISION 1
Round 5 - Brands Hatch GP
═══════════════════════════════════════════════════

Pos│ Driver         │ Race Time  │ FL Time  │ Penalty│ Status    │ Pts│ Actions
───┼────────────────┼────────────┼──────────┼────────┼───────────┼────┼─────────
 1 │ John Smith     │ 36:24.582  │ 1:23.982 │ [___]s │ Finished  │ 26 │ [Edit][×]
 2 │ Jane Doe       │ +2.341     │ 1:24.123 │ [___]s │ Finished  │ 18 │ [Edit][×]
 3 │ Mike Ross      │ +5.782     │ 1:24.456 │ [___]s │ Finished  │ 15 │ [Edit][×]
 4 │ Sarah Williams │ +1 LAP     │ 1:25.123 │ [___]s │ +1 Lap    │ 12 │ [Edit][×]
 5 │ Chris Brown    │ DNF        │ 1:24.789 │ [___]s │ DNF       │  0 │ [Edit][×]
 6 │ [+ Add Driver] │            │          │        │           │    │

Points calculated from race points system.
Fastest Lap bonus: John Smith (+1 point)

[+ Add Row Manually]

Drivers Not Listed (Auto-marked DNS):
• Emma Davis (#22) - Did not start
[Add to Results] if actually participated

⚠️ WARNINGS (1)
• Sarah Williams: Finished +1 lap, awarded position-based points

[Save Draft] [Preview Results] [Save & Continue to Race 2 →]
```

---

## Field Specifications & Validation

### Driver Name Field

**Input:** Text (fuzzy matching)

**Matching Logic:**
1. Exact match (case-insensitive)
2. Partial match (first/last name)
3. Platform ID match (PSN ID, GT7 ID)
4. Fuzzy match (Levenshtein distance)

**Examples:**
- "John Smith" → ✓ Matches "John Smith"
- "J Smith" → ✓ Matches "John Smith"
- "JSmith77" → ✓ Matches "John Smith" (via PSN ID)
- "Jon Smith" → ⚠️ Did you mean "John Smith"?
- "Unknown Driver" → ✗ Not found in driver list

**Error Display:**
```
Pos│ Driver              │ Race Time  │ Status
───┼─────────────────────┼────────────┼─────────
 6 │ Unknown Driver      │ +12.456    │ ✗ Not Found
    ⚠️ Driver not found in season roster
    [Select from list ▼] or [Add as new driver]
```

---

### Race Time Field

**Input:** Text (multiple formats accepted)

**Supported Formats:**

1. **Full Time (Winner):**
   - `36:24.582` (mm:ss.SSS)
   - `1:23:45.678` (h:mm:ss.SSS)
   - `23.456` (ss.SSS) - for very short races

2. **Gap After Winner:**
   - `+2.341` (seconds)
   - `2.341` (implied +)
   - `+1:12.456` (minutes + seconds)
   - `+23.456` (seconds)

3. **Laps Down:**
   - `+1 LAP` (case insensitive)
   - `+2 LAPS`
   - `1 LAP` (implied +)
   - `2+ LAPS`

4. **Did Not Finish:**
   - `DNF` (case insensitive)
   - `Did Not Finish`

5. **Did Not Start:**
   - `DNS` (case insensitive)
   - Blank field (interpreted as DNS)

**Validation:**
- ✓ Valid time format
- ⚠️ Unusual gap (e.g., winner has `+2.341`)
- ✗ Invalid format

---

### Fastest Lap Field

**Input:** Text (lap time format)

**Supported Formats:**
- `1:23.456` (mm:ss.SSS)
- `23.456` (ss.SSS)
- Blank (no fastest lap recorded)

**Optional:** Not required, ignored if blank

**Validation:**
- ✓ Valid lap time
- ⚠️ Faster than qualifying time
- ⚠️ Slower than all other fastest laps

---

### Penalty Field

**Input:** Number (seconds)

**Format:**
- Integer: `5` (5 seconds)
- Decimal: `10.5` (10.5 seconds)
- Blank: `0` (no penalty)

**Application:**
- Penalty time **added** to race time
- Positions **recalculated** after penalty applied
- Applied when saving race data (not real-time)

**Example:**
```
BEFORE PENALTY:
Pos│ Driver      │ Race Time  │ Penalty│ Final Time │ New Pos
───┼─────────────┼────────────┼────────┼────────────┼────────
 1 │ John Smith  │ 36:24.582  │        │ 36:24.582  │   1
 2 │ Jane Doe    │ +2.341     │ 5s     │ +7.341     │   3
 3 │ Mike Ross   │ +5.782     │        │ +5.782     │   2

AFTER PENALTY APPLIED:
Pos│ Driver      │ Race Time  │ Penalty│ Final Time │ Points
───┼─────────────┼────────────┼────────┼────────────┼───────
 1 │ John Smith  │ 36:24.582  │        │ 36:24.582  │  25
 2 │ Mike Ross   │ +5.782     │        │ +5.782     │  18
 3 │ Jane Doe    │ +2.341     │ +5s    │ +7.341     │  15
```

---

### Status Field

**Auto-determined from race time:**

- `Finished` - Normal completion
- `+1 Lap` - 1 lap behind winner
- `+2 Laps` - 2 laps behind winner
- `DNF` - Did not finish
- `DNS` - Did not start
- `DSQ` - Disqualified (manual entry)

**Editable dropdown for manual correction**

---

## Manual Row Addition

**Click [+ Add Row Manually]:**

```
┌────────────────────────────────────────────────────────┐
│ ADD DRIVER MANUALLY                                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Driver*                                                │
│ [Search drivers...                              ▼]    │
│   • John Smith (#5)                                    │
│   • Jane Doe (#7)                                      │
│                                                        │
│ Race Time                                              │
│ [_____________________]                                │
│ Format: 36:24.582 or +2.341 or DNF                     │
│                                                        │
│ Fastest Lap (optional)                                 │
│ [_____________________]                                │
│ Format: 1:23.456                                       │
│                                                        │
│ Penalty (seconds)                                      │
│ [_____] (leave blank for no penalty)                   │
│                                                        │
│ Status                                                 │
│ [Finished ▼]                                           │
│   • Finished                                           │
│   • +1 Lap                                             │
│   • DNF                                                │
│   • DNS                                                │
│   • DSQ                                                │
│                                                        │
│ [Cancel]  [Add Driver]                                 │
└────────────────────────────────────────────────────────┘
```

---

## Edit Row (Inline Editing)

**Click [Edit] next to driver:**

```
Pos│ Driver         │ Race Time     │ FL Time     │ Penalty│ Status
───┼────────────────┼───────────────┼─────────────┼────────┼─────────
 2 │ [Jane Doe  ▼]  │ [+2.341    ]  │ [1:24.123 ] │ [5  ]s │ [Fin ▼]
    [Save] [Cancel]

All fields become editable inline.
```

---

## Multi-Race Round Handling

**If round has multiple races:**

### Race Navigation

```
═══════════════════════════════════════════════════
ROUND 5 - BRANDS HATCH GP - DIVISION 1
═══════════════════════════════════════════════════

[Race 1 Results] [Race 2 Results] [Aggregate Results]
      ✓               ⏳                 ⏸️
   (Completed)    (In Progress)      (Pending)
```

### Sequential Entry Process

1. **Enter Race 1** → Save → Mark as complete
2. **Enter Race 2** → Save → Mark as complete
3. **Enter Race 3** (if applicable) → Save → Mark as complete
4. **View Aggregate Results** → Auto-calculated from all races
5. **Publish** → Make visible on dashboard
6. **Finalize** → Lock results

### After All Races Entered - Aggregate View

```
═══════════════════════════════════════════════════
AGGREGATE ROUND RESULTS - DIVISION 1
Round 5 - Brands Hatch GP
═══════════════════════════════════════════════════

Round points calculated from total points across all races.

Pos│ Driver         │ R1  │ R2  │ R3  │ Total Pts│ Round Pts│ Status
───┼────────────────┼─────┼─────┼─────┼──────────┼──────────┼────────
 1 │ John Smith     │ 18  │ 25  │ 25  │    68    │    25    │ ✓ Valid
 2 │ Jane Doe       │ 25  │ 18  │ 15  │    58    │    18    │ ✓ Valid
 3 │ Mike Ross      │ 15  │ 15  │ 18  │    48    │    15    │ ✓ Valid
 4 │ Sarah Williams │ 12  │ 12  │ 12  │    36    │    12    │ ✓ Valid

R1, R2, R3 = Points from each race
Total Pts = Sum of all race points
Round Pts = Championship points awarded for round position

TIE BREAKING RULES
───────────────────────────────────────────────────

Note: Tie-breaking rules to be implemented in future version.
Currently ties resolved by:
1. Number of race wins
2. Best finish in final race
3. Joint position awarded

[Edit Tie Breaking Rules] (Future feature)

[Save Draft] [Publish Results]
```

---

## Result Status Workflow

### Status Levels

```
1. DRAFT (📝)
   • Results being entered
   • Not visible on dashboard
   • Fully editable
   • Auto-saved periodically

2. PUBLISHED (👁️)
   • Visible on dashboard
   • Visible to drivers (if enabled)
   • Still editable
   • Changes reflected immediately

3. FINALIZED (🔒)
   • Locked from editing
   • Official championship points applied
   • Can be unlocked if needed
   • Audit trail of changes
```

### Status Transitions

```
┌─────────────────────────────────────────────────┐
│ CURRENT STATUS: DRAFT                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Save Draft]                                    │
│   → Save progress, remain in draft              │
│                                                 │
│ [Publish Results]                               │
│   → Make visible on dashboard                   │
│   → Still editable                              │
│                                                 │
│ [Publish & Finalize]                            │
│   → Publish and lock immediately                │
│                                                 │
└─────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────┐
│ CURRENT STATUS: PUBLISHED                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Save Changes]                                  │
│   → Update published results                    │
│                                                 │
│ [Finalize Results]                              │
│   → Lock results, apply to championship         │
│                                                 │
│ [Revert to Draft]                               │
│   → Hide from dashboard, continue editing       │
│                                                 │
└─────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────┐
│ CURRENT STATUS: FINALIZED                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ Results are locked and official.                │
│                                                 │
│ ⚠️  To make changes, you must unlock first.     │
│                                                 │
│ [Unlock & Edit]                                 │
│   → Unlocks results for editing                 │
│   → Audit trail recorded                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Unlock Confirmation

```
┌─────────────────────────────────────────────────┐
│ UNLOCK FINALIZED RESULTS                        │
├─────────────────────────────────────────────────┤
│                                                 │
│ Are you sure you want to unlock these results? │
│                                                 │
│ This will:                                      │
│ • Revert status to Published                    │
│ • Allow editing of results                      │
│ • Record unlock action in audit trail           │
│                                                 │
│ Reason for unlocking (optional):                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Penalty correction needed...                │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Cancel]  [Unlock Results]                      │
└─────────────────────────────────────────────────┘
```

---

## Audit Trail

### Edit History

**Location:** Round Results → [View Edit History]

```
═══════════════════════════════════════════════════
EDIT HISTORY - ROUND 5 DIVISION 1
═══════════════════════════════════════════════════

┌────────────────────────────────────────────────────────┐
│ Feb 18, 2025 @ 9:45 PM - John Doe (Manager)           │
│ Action: Results Finalized                             │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Feb 18, 2025 @ 9:42 PM - John Doe (Manager)           │
│ Action: Results Published                             │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Feb 18, 2025 @ 9:40 PM - John Doe (Manager)           │
│ Action: Penalty Applied                               │
│ Changes: Jane Doe - Added 5 second penalty            │
│          Position changed: P2 → P3                    │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Feb 18, 2025 @ 9:35 PM - John Doe (Manager)           │
│ Action: Race 1 Results Entered                        │
│ Details: 16 drivers, 14 finished, 2 DNF               │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Feb 18, 2025 @ 9:32 PM - John Doe (Manager)           │
│ Action: Qualifying Results Entered                    │
│ Details: 16 drivers                                   │
└────────────────────────────────────────────────────────┘

[Export Audit Log]
```

---

## Preview Results Before Publishing

**Click [Preview Results]:**

```
═══════════════════════════════════════════════════
PREVIEW RESULTS - DIVISION 1
Round 5 - Brands Hatch GP
═══════════════════════════════════════════════════

RACE RESULTS
───────────────────────────────────────────────────

Pos│ Driver              │ Laps│ Time       │ FL      │ Pts
───┼─────────────────────┼─────┼────────────┼─────────┼────
 1 │ John Smith          │  15 │ 36:24.582  │ 1:23.98 │ 26
 2 │ Mike Ross           │  15 │ +5.782     │ 1:24.45 │ 18
 3 │ Jane Doe*           │  15 │ +2.341     │ 1:24.12 │ 15
 4 │ Sarah Williams      │  14 │ +1 LAP     │ 1:25.12 │ 12

* Penalty applied: +5 second time penalty

Fastest Lap: John Smith (1:23.982) +1 point

CHAMPIONSHIP IMPACT
───────────────────────────────────────────────────

• John Smith extends lead to 3 points
• Mike Ross moves up to P2 (+1 position)
• Jane Doe drops to P3 (-1 position)

[← Back to Edit] [Publish Results]
```

---

## Business Rules

### Data Entry

- **Required:** Driver name (matched or manually selected)
- **Optional:** Race time, fastest lap, penalty
- **Auto-calculated:** Position, gap, points

### Time Validation

- Accepts multiple formats (hours optional)
- Case-insensitive for status (DNF, DNS)
- Fuzzy matching for driver names

### Penalty Application

- Penalties in seconds (integer or decimal)
- Applied to race time, positions recalculated
- Calculated when saving, not real-time

### Multi-Race Rounds

- Enter races sequentially
- Each race saved independently
- Aggregate calculated after all races entered
- Round points based on aggregate position

### Status Workflow

- Draft → Not visible
- Published → Visible, editable
- Finalized → Locked (unlockable)
- Anyone can publish/finalize/unlock

---

## Database Schema

### race_results Table

```sql
race_results {
  id: integer (primary key)
  race_id: integer (foreign key)
  division_id: integer (foreign key)
  driver_id: integer (foreign key)
  
  -- Race Data
  position: integer (finishing position)
  race_time: string (raw time entry)
  race_time_seconds: decimal (normalized to seconds)
  fastest_lap: string (nullable)
  fastest_lap_seconds: decimal (nullable, normalized)
  
  -- Penalties
  penalty_seconds: decimal (default: 0)
  penalty_reason: text (nullable)
  
  -- Status
  status: enum ('finished', 'dnf', 'dns', 'dsq', '+1_lap', '+2_laps')
  laps_completed: integer (nullable)
  
  -- Points
  race_points: integer (points from this race)
  bonus_points: integer (fastest lap, pole, etc.)
  total_points: integer (race + bonus)
  
  -- Metadata
  created_at: timestamp
  updated_at: timestamp
}
```

### qualifying_results Table

```sql
qualifying_results {
  id: integer (primary key)
  round_id: integer (foreign key)
  division_id: integer (foreign key)
  driver_id: integer (foreign key)
  
  -- Qualifying Data
  position: integer
  lap_time: string (raw entry)
  lap_time_seconds: decimal (normalized)
  gap_to_pole: decimal (seconds)
  
  -- Metadata
  created_at: timestamp
  updated_at: timestamp
}
```

### result_audit_log Table

```sql
result_audit_log {
  id: integer (primary key)
  round_id: integer (foreign key)
  division_id: integer (foreign key)
  user_id: integer (foreign key)
  
  -- Action Details
  action: enum ('created', 'updated', 'published', 'finalized', 'unlocked')
  changes: json (field-level changes)
  reason: text (nullable, for unlocks)
  
  -- Metadata
  created_at: timestamp
}
```

---

## Tie-Breaking Rules System

### Overview

When multiple drivers finish a round with identical total points from all races, the system applies tie-breaking rules to determine final round positions.

### Configuration

**Location:** Round Dashboard → Results → [Configure Tie-Breaking Rules]

Tie-breaking rules are configured **per round** and selected manually by the manager.

```
═══════════════════════════════════════════════════
CONFIGURE TIE-BREAKING RULES
Round 5 - Brands Hatch GP
═══════════════════════════════════════════════════

Tie-Breaking Method* (required)
[Select Rule Type ▼]
  • Standard Sprint (Best Result First)
  • Reverse Grid Sprint (Race 1 Priority)

Rule Descriptions:

STANDARD SPRINT (3+ Races, No Reverse Grid)
Use when all races have standard grids (qualifying or championship order)
Priority:
1. Best result across all races
2. Second-best result
3. Third-best result (if applicable)
4. Race 1 finish position
5. Qualifying position

REVERSE GRID SPRINT
Use when round includes reverse grid race(s)
Priority:
1. Race 1 finish position (qualifying-based race)
2. Qualifying position

ℹ️  DNF counts as worst possible position in tie-breaking

[Cancel]  [Save Tie-Breaking Rules]
```

---

### Rule Type 1: Standard Sprint

**When to use:** Round has multiple races, all with standard grids

**Tie-Breaking Priority:**

1. **Best result** across all races (lowest position = best)
2. **Second-best result** across all races
3. **Third-best result** across all races (if 3+ races)
4. **Race 1 finish** position
5. **Qualifying** position

**Example - 3 Races:**

```
Drivers with identical total points (43):

Driver A: R1=P2, R2=P3, R3=P1
Driver B: R1=P1, R2=P3, R3=P2
Driver C: R1=P3, R2=P1, R3=P2

Step 1: Best result?
  All have P1 → Still tied

Step 2: Second-best result?
  All have P2 → Still tied

Step 3: Third-best result?
  All have P3 → Still tied (same set of results)

Step 4: Race 1 finish?
  Driver B: P1 ← WINNER
  Driver A: P2
  Driver C: P3

FINAL ROUND POSITIONS:
1. Driver B (43 pts) - Tied on points, won via Race 1 finish
2. Driver A (43 pts) - Tied on points, P2 in Race 1
3. Driver C (43 pts) - Tied on points, P3 in Race 1
```

**Display in Results:**
```
Pos│ Driver    │ Pts │ R1│ R2│ R3│ Tie-Break
───┼───────────┼─────┼───┼───┼───┼─────────────────
 1 │ Driver B  │ 43  │ 1 │ 3 │ 2 │ Race 1 finish
 2 │ Driver A  │ 43  │ 2 │ 3 │ 1 │ Race 1 finish
 3 │ Driver C  │ 43  │ 3 │ 1 │ 2 │ Race 1 finish
```

---

### Rule Type 2: Reverse Grid Sprint

**When to use:** Round includes at least one reverse grid race

**Tie-Breaking Priority:**

1. **Race 1 finish** position (the qualifying-based race)
2. **Qualifying** position

**Why Race 1?** Race 1 is always the "true" qualifying/skill-based race. Reverse grid races are intentionally randomized, so we use the legitimate race to break ties.

**Example:**

```
Round Format:
- Race 1: Standard qualifying grid
- Race 2: Reverse Race 1 finish order
- Race 3: Standard qualifying grid

Drivers with identical total points (43):

Driver A: R1=P5, R2=P1, R3=P2
Driver B: R1=P2, R2=P3, R3=P3

Tie-Breaking: Race 1 finish?
  Driver B: P2 ← WINNER
  Driver A: P5

FINAL ROUND POSITIONS:
1. Driver B (43 pts) - Tied on points, P2 in Race 1
2. Driver A (43 pts) - Tied on points, P5 in Race 1
```

**Display in Results:**
```
Pos│ Driver    │ Pts │ R1│ R2│ R3│ Tie-Break
───┼───────────┼─────┼───┼───┼───┼─────────────────
 1 │ Driver B  │ 43  │ 2 │ 3 │ 3 │ Race 1 finish
 2 │ Driver A  │ 43  │ 5 │ 1 │ 2 │ Race 1 finish
```

---

### Special Cases

#### DNF in Tie-Breaking

DNF counts as **worst possible position** when comparing results.

**Example:**

```
Driver A: R1=P1, R2=P2, R3=DNF (43 pts)
Driver B: R1=P2, R2=P3, R3=P4 (43 pts)

Best result:
  Driver A: P1
  Driver B: P2
  → Driver A wins (P1 beats P2)

Even though Driver A has DNF, their best result (P1) 
beats Driver B's best result (P2)
```

**Another Example:**

```
Driver A: R1=P2, R2=DNF, R3=P1 (40 pts)
Driver B: R1=P3, R2=P2, R3=P1 (40 pts)

Best result:
  Both have P1 → Tied

Second-best result:
  Driver A: P2
  Driver B: P2
  → Still tied

Third-best result:
  Driver A: DNF (worst position)
  Driver B: P3
  → Driver B wins (P3 beats DNF)
```

#### Single Race Rounds

For rounds with only 1 race, tied points can only occur if:
- Drivers have identical race times
- Bonus points (fastest lap, pole) create ties

**Tie-Breaking for Single Race:**

1. **Race time** (if somehow identical, extremely rare)
2. **Qualifying** position

#### Two-Race Rounds

Use **Standard Sprint** rules:

1. Best result → Second-best result → Race 1 finish → Qualifying

---

### Qualifying as Final Tie-Breaker

If all other tie-breaking methods still result in a tie, **qualifying position** is the ultimate decider.

**Example:**

```
Driver A: R1=P1 (Quali: P2)
Driver B: R1=P1 (Quali: P1)

Both finished P1 in Race 1.

Final tie-breaker: Qualifying position
  Driver B: P1 in Quali ← WINNER
  Driver A: P2 in Quali

FINAL POSITIONS:
1. Driver B - Tied on all results, won via qualifying
2. Driver A - Tied on all results, P2 in qualifying
```

---

### Tie-Breaking Display in Results

Results should clearly indicate when tie-breaking was applied:

```
═══════════════════════════════════════════════════
ROUND 5 RESULTS - DIVISION 1
═══════════════════════════════════════════════════

Pos│ Driver    │ Pts │ R1│ R2│ R3│ Tie-Break Method
───┼───────────┼─────┼───┼───┼───┼──────────────────────
 1 │ John      │ 68  │ 2 │ 3 │ 1 │ -
 2 │ Jane      │ 58  │ 1 │ 2 │ 3 │ -
 3 │ Mike      │ 48  │ 3 │ 1 │ 2 │ -
 4 │ Sarah*    │ 43  │ 1 │ 3 │ 2 │ Best result (P1)
 5 │ Chris*    │ 43  │ 2 │ 3 │ 1 │ Tied, Race 1: P2
 6 │ Emma*     │ 43  │ 3 │ 1 │ 2 │ Tied, Race 1: P3

* Positions 4-6 tied on 43 points, determined by 
  Standard Sprint tie-breaking rules

Tie-Breaking Applied:
• Sarah, Chris, Emma all scored 43 points
• All had identical best results (P1, P2, P3)
• Tie broken by Race 1 finish order
```

---

### Database Schema Addition

```sql
rounds {
  -- ... existing fields ...
  
  -- Tie-Breaking Configuration
  tie_breaking_method: enum ('standard_sprint', 'reverse_grid_sprint', null)
  tie_breaking_notes: text (nullable)
}

race_results {
  -- ... existing fields ...
  
  -- Tie-Breaking Metadata
  tied_with_drivers: json (array of driver IDs with same points, nullable)
  tie_break_reason: string (e.g., "Race 1 finish", "Best result", nullable)
  original_tied_position: integer (nullable - what position before tie-break)
}
```

---

## Business Rules

### Tie-Breaking Configuration

- **Per Round:** Each round can have different tie-breaking rules
- **Manual Selection:** Manager must choose rule type before finalizing results
- **Required:** Cannot finalize multi-race round results without selecting tie-breaking method
- **Default:** No default - must be explicitly selected

### Application

- Tie-breaking only applies when **total round points are identical**
- Applied **after all races in round are entered**
- Calculated **when results are published or finalized**
- Clearly **displayed in results output**

### Edge Cases

- **No qualifying data:** If qualifying wasn't run, tie-breaking stops at last available method
- **Same result set:** Drivers with P1, P2, P3 in different order → Race 1 decides
- **DNF positioning:** DNF always counts as worst position in comparisons

---

## Future Enhancements (Not in v1)

- **Tie Breaking Rules Configuration** (mentioned, to be implemented later)
- Photo finish detection
- Automated result import from game APIs
- Real-time result entry during race
- Split-screen result entry (multiple divisions simultaneously)
- Bulk penalty application
- Result comparison tool (compare with previous rounds)
- Driver performance trends
- Automated protest/appeal workflow

---

## Related Documentation

- `06-Round-Setup.md` - Creating rounds and races
- `05-Season-Creation.md` - Season and driver setup
- `04-Dashboard-Layouts.md` - Result display views
- `Tie-Breaking-Rules.md` - Detailed tie-breaking logic (to be created)