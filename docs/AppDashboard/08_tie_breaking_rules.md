# Tie-Breaking Rules Documentation

**Version:** 1.0  
**Last Updated:** October 17, 2025

---

## Overview

When multiple drivers finish a round with identical total points from all races, the system applies tie-breaking rules to determine final round positions. Tie-breaking rules are configured manually per round by the manager.

---

## Configuration

### Location

**Round Dashboard → Results → [Configure Tie-Breaking Rules]**

Tie-breaking rules are configured **per round** and must be selected before finalizing results.

### Configuration Interface

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

## Rule Type 1: Standard Sprint

### When to Use

- Round has multiple races (2+)
- All races have standard grids (qualifying or championship order)
- No reverse grid races in the round

### Tie-Breaking Priority

1. **Best result** across all races (lowest position = best)
2. **Second-best result** across all races
3. **Third-best result** across all races (if 3+ races)
4. **Race 1 finish** position
5. **Qualifying** position (final tie-breaker)

### Example: 3-Race Round

```
Drivers with identical total points (43):

Driver A: Race 1 = P2, Race 2 = P3, Race 3 = P1
Driver B: Race 1 = P1, Race 2 = P3, Race 3 = P2
Driver C: Race 1 = P3, Race 2 = P1, Race 3 = P2

Step 1: Best result across all races?
  Driver A: P1 (Race 3)
  Driver B: P1 (Race 1)
  Driver C: P1 (Race 2)
  → All have P1 → Still tied

Step 2: Second-best result?
  Driver A: P2 (Race 1)
  Driver B: P2 (Race 3)
  Driver C: P2 (Race 3)
  → All have P2 → Still tied

Step 3: Third-best result?
  Driver A: P3 (Race 2)
  Driver B: P3 (Race 2)
  Driver C: P3 (Race 1)
  → All have P3 → Still tied
  → Same set of results (P1, P2, P3) just in different order

Step 4: Race 1 finish position?
  Driver A: P2
  Driver B: P1 ← WINNER
  Driver C: P3

FINAL ROUND POSITIONS:
1. Driver B (43 pts) - Won tie-break via Race 1 finish (P1)
2. Driver A (43 pts) - P2 in Race 1
3. Driver C (43 pts) - P3 in Race 1
```

### Example: 2-Race Round

```
Drivers with identical total points (36):

Driver A: Race 1 = P2, Race 2 = P1
Driver B: Race 1 = P1, Race 2 = P2

Step 1: Best result?
  Both have P1 → Still tied

Step 2: Second-best result?
  Both have P2 → Still tied

Step 3: Race 1 finish?
  Driver B: P1 ← WINNER
  Driver A: P2

FINAL ROUND POSITIONS:
1. Driver B (36 pts) - Won tie-break via Race 1 finish
2. Driver A (36 pts) - P2 in Race 1
```

### Display in Results

```
═══════════════════════════════════════════════════
ROUND 5 RESULTS - DIVISION 1
═══════════════════════════════════════════════════

Pos│ Driver    │ Pts │ R1│ R2│ R3│ Tie-Break Method
───┼───────────┼─────┼───┼───┼───┼──────────────────────
 1 │ Driver B  │ 43  │ 1 │ 3 │ 2 │ Race 1 finish (P1)
 2 │ Driver A  │ 43  │ 2 │ 3 │ 1 │ Tied, Race 1: P2
 3 │ Driver C  │ 43  │ 3 │ 1 │ 2 │ Tied, Race 1: P3

* Positions 1-3 tied on 43 points
* Tie broken by Race 1 finish position
```

---

## Rule Type 2: Reverse Grid Sprint

### When to Use

- Round includes at least one reverse grid race
- Race 1 is always the qualifying-based race (standard grid)
- Subsequent races may have reverse grids

### Tie-Breaking Priority

1. **Race 1 finish** position (the qualifying-based race)
2. **Qualifying** position (final tie-breaker)

### Rationale

**Race 1 is always king** in reverse grid formats because:
- Race 1 has the legitimate qualifying-based grid
- Reverse grid races are intentionally randomized
- Race 1 represents true pace and skill
- Other races may have artificial starting positions

### Example: 3-Race Round with Reverse Grid

```
Round Format:
- Race 1: Standard qualifying grid
- Race 2: Reverse Race 1 finish order (reverse grid)
- Race 3: Standard qualifying grid

Drivers with identical total points (43):

Driver A: Race 1 = P5, Race 2 = P1, Race 3 = P2
Driver B: Race 1 = P2, Race 2 = P3, Race 3 = P3

Step 1: Race 1 finish position?
  Driver A: P5
  Driver B: P2 ← WINNER

FINAL ROUND POSITIONS:
1. Driver B (43 pts) - Won tie-break via Race 1 finish (P2)
2. Driver A (43 pts) - P5 in Race 1

Note: Driver A won Race 2 (P1), but this was from a reverse 
grid start, so it doesn't count in tie-breaking.
```

### Display in Results

```
═══════════════════════════════════════════════════
ROUND 5 RESULTS - DIVISION 1
═══════════════════════════════════════════════════

Pos│ Driver    │ Pts │ R1│ R2│ R3│ Tie-Break Method
───┼───────────┼─────┼───┼───┼───┼──────────────────────
 1 │ Driver B  │ 43  │ 2 │ 3 │ 3 │ Race 1 finish (P2)
 2 │ Driver A  │ 43  │ 5 │ 1 │ 2 │ Tied, Race 1: P5

* Positions 1-2 tied on 43 points
* Round includes reverse grid race (Race 2)
* Tie broken by Race 1 finish position
```

---

## Special Cases

### DNF in Tie-Breaking

**Rule:** DNF counts as **worst possible position** when comparing results.

#### Example 1: DNF with Better Best Result

```
Driver A: R1 = P1, R2 = P2, R3 = DNF (43 pts)
Driver B: R1 = P2, R2 = P3, R3 = P4 (43 pts)

Step 1: Best result?
  Driver A: P1
  Driver B: P2
  → Driver A wins (P1 beats P2)

WINNER: Driver A

Even though Driver A has DNF, their best result (P1) 
beats Driver B's best result (P2).
```

#### Example 2: DNF as Worst Result

```
Driver A: R1 = P2, R2 = DNF, R3 = P1 (40 pts)
Driver B: R1 = P3, R2 = P2, R3 = P1 (40 pts)

Step 1: Best result?
  Both have P1 → Still tied

Step 2: Second-best result?
  Driver A: P2
  Driver B: P2
  → Still tied

Step 3: Third-best result?
  Driver A: DNF (worst position)
  Driver B: P3
  → Driver B wins (P3 beats DNF)

WINNER: Driver B
```

#### Example 3: Multiple DNFs

```
Driver A: R1 = P1, R2 = DNF, R3 = DNF (25 pts)
Driver B: R1 = P2, R2 = DNF, R3 = P1 (43 pts)

Step 1: Best result?
  Both have P1 → Still tied

Step 2: Second-best result?
  Driver A: DNF (worst)
  Driver B: P2
  → Driver B wins (P2 beats DNF)

WINNER: Driver B
```

---

### Single Race Rounds

For rounds with only **1 race**, tied points can only occur if:
- Drivers have identical race times (extremely rare)
- Bonus points (fastest lap, pole position) create ties

**Tie-Breaking Priority:**

1. **Race time** (if somehow identical)
2. **Qualifying position**

**Example:**

```
Single race round with fastest lap bonus:

Driver A: P2 (18 pts) + Fastest Lap (1 pt) = 19 pts
Driver B: P1 (25 pts) - 6 second penalty = P3 (15 pts) + Fastest Lap (1 pt) + Pole (3 pts) = 19 pts

Both have 19 points but different race positions.

Tie-Breaking: Race finish position after penalties
  Driver A: P2
  Driver B: P3
  → Driver A wins

FINAL POSITIONS:
1. Driver A (19 pts) - P2 finish
2. Driver B (19 pts) - P3 finish (after penalty)
```

---

### Qualifying as Final Tie-Breaker

If all other tie-breaking methods result in a tie, **qualifying position** is the ultimate decider.

**Example:**

```
Driver A: Race 1 = P1 (Qualifying: P2)
Driver B: Race 1 = P1 (Qualifying: P1)

Both finished P1 in Race 1 with same race time.

Final Tie-Breaker: Qualifying position
  Driver A: P2 in Qualifying
  Driver B: P1 in Qualifying ← WINNER

FINAL POSITIONS:
1. Driver B (25 pts) - Tied on race result, won via qualifying (P1)
2. Driver A (25 pts) - Tied on race result, P2 in qualifying
```

---

### No Qualifying Data

If qualifying was **not run** for a round:

- Tie-breaking stops at the last available method
- Cannot use qualifying position as final tie-breaker
- Positions remain tied if all other methods are exhausted

**Example:**

```
No qualifying session run for this round.

Driver A: R1 = P1, R2 = P2, R3 = P3
Driver B: R1 = P3, R2 = P1, R3 = P2

Best result: Both P1 → Tied
Second-best: Both P2 → Tied
Third-best: Both P3 → Tied

Race 1 finish:
  Driver A: P1
  Driver B: P3
  → Driver A wins

No need for qualifying tie-breaker.
```

**If Race 1 was also tied:**

```
Driver A: R1 = P1, R2 = P2, R3 = P3
Driver B: R1 = P1, R2 = P3, R3 = P2

Best result: Both P1 → Tied
Second-best: Both P2 → Tied
Third-best: Both P3 → Tied
Race 1: Both P1 → Tied
Qualifying: No data available

RESULT: Joint position awarded (both P1 in round)
```

---

## Tie-Breaking Display

### In Results Table

Results should clearly show when tie-breaking was applied:

```
═══════════════════════════════════════════════════
ROUND 5 RESULTS - DIVISION 1
Brands Hatch GP • Standard Sprint Format
═══════════════════════════════════════════════════

Pos│ Driver    │ Pts │ R1│ R2│ R3│ Tie-Break Reason
───┼───────────┼─────┼───┼───┼───┼──────────────────────
 1 │ John      │ 68  │ 2 │ 3 │ 1 │ -
 2 │ Jane      │ 58  │ 1 │ 2 │ 3 │ -
 3 │ Mike      │ 48  │ 3 │ 1 │ 2 │ -
 4 │ Sarah*    │ 43  │ 1 │ 3 │ 2 │ Best result (P1)
 5 │ Chris*    │ 43  │ 2 │ 3 │ 1 │ Race 1 finish (P2)
 6 │ Emma*     │ 43  │ 3 │ 1 │ 2 │ Race 1 finish (P3)

* Positions 4-6 tied on 43 points
  Tie-breaking method: Standard Sprint
  - All had best result P1 (tied)
  - All had second-best P2 (tied)
  - All had third-best P3 (tied)
  - Decided by Race 1 finish order

───────────────────────────────────────────────────
Tie-Breaking Rules: Standard Sprint (Best Result First)
```

### In Detailed Results View

```
═══════════════════════════════════════════════════
TIE-BREAKING ANALYSIS
Drivers tied on 43 points: Sarah, Chris, Emma
═══════════════════════════════════════════════════

Method: Standard Sprint

Step 1: Compare best results
  Sarah:  P1 (Race 1) ✓
  Chris:  P1 (Race 3) ✓
  Emma:   P1 (Race 2) ✓
  → All have P1, still tied

Step 2: Compare second-best results
  Sarah:  P2 (Race 3) ✓
  Chris:  P2 (Race 1) ✓
  Emma:   P2 (Race 3) ✓
  → All have P2, still tied

Step 3: Compare third-best results
  Sarah:  P3 (Race 2) ✓
  Chris:  P3 (Race 2) ✓
  Emma:   P3 (Race 1) ✓
  → All have P3, still tied (identical result sets)

Step 4: Compare Race 1 finish
  Sarah:  P1 ← Position 4
  Chris:  P2 ← Position 5
  Emma:   P3 ← Position 6

FINAL ROUND POSITIONS:
4. Sarah (43 pts) - Race 1: P1
5. Chris (43 pts) - Race 1: P2
6. Emma (43 pts) - Race 1: P3
```

---

## Database Schema

### rounds Table

```sql
rounds {
  -- ... existing fields ...
  
  -- Tie-Breaking Configuration
  tie_breaking_method: enum (
    'standard_sprint', 
    'reverse_grid_sprint', 
    null
  )
  tie_breaking_notes: text (nullable)
  tie_breaking_configured_at: timestamp (nullable)
  tie_breaking_configured_by: integer (foreign key to users, nullable)
}
```

### race_results Table

```sql
race_results {
  -- ... existing fields ...
  
  -- Tie-Breaking Metadata
  tied_with_driver_ids: json (array of driver IDs with same points, nullable)
  tie_break_reason: string (nullable)
    -- Examples: "Best result (P1)", "Race 1 finish (P2)", "Qualifying (P3)"
  
  original_tied_position: integer (nullable)
    -- Position before tie-breaking (e.g., all three drivers at P4)
  
  final_position_after_tiebreak: integer (nullable)
    -- Final position after tie-breaking applied
}
```

### Example Data

```json
// Driver who won tie-break
{
  "driver_id": 142,
  "position": 4,
  "total_points": 43,
  "tied_with_driver_ids": [287, 398],
  "tie_break_reason": "Race 1 finish (P1)",
  "original_tied_position": 4,
  "final_position_after_tiebreak": 4
}

// Driver who lost tie-break
{
  "driver_id": 287,
  "position": 5,
  "total_points": 43,
  "tied_with_driver_ids": [142, 398],
  "tie_break_reason": "Race 1 finish (P2)",
  "original_tied_position": 4,
  "final_position_after_tiebreak": 5
}
```

---

## Business Rules

### Configuration Requirements

- **Required:** Tie-breaking method must be selected for multi-race rounds before finalizing
- **Per Round:** Each round can have different tie-breaking rules
- **Manual Selection:** Manager must explicitly choose the rule type
- **No Default:** System does not auto-select a tie-breaking method

### Application Timing

- Tie-breaking rules applied **after all races entered**
- Calculated **when results are published or finalized**
- Can be **reconfigured** if results are unlocked and re-edited
- **Audit trail** maintained for rule changes

### Validation

```
═══════════════════════════════════════════════════
⚠️  WARNING: TIE-BREAKING NOT CONFIGURED
═══════════════════════════════════════════════════

This round has multiple races with tied drivers.
You must configure tie-breaking rules before 
finalizing results.

Tied drivers detected:
• Positions 4-6: Sarah, Chris, Emma (43 pts)
• Positions 8-9: Mike, Tom (35 pts)

[Configure Tie-Breaking Rules]

[Save Draft]  [Finalize Results] (disabled)
```

---

## User Interface Examples

### Configuration Modal

```
┌───────────────────────────────────────────────────┐
│ CONFIGURE TIE-BREAKING RULES                      │
│ Round 5 - Brands Hatch GP - Division 1            │
├───────────────────────────────────────────────────┤
│                                                   │
│ Multiple drivers have tied on total points.      │
│ Select a tie-breaking method:                    │
│                                                   │
│ ○ Standard Sprint (Best Result First)            │
│   Best for: Regular sprint races without reverse │
│   Priority: Best result → 2nd best → 3rd best    │
│             → Race 1 → Qualifying                 │
│                                                   │
│ ○ Reverse Grid Sprint (Race 1 Priority)          │
│   Best for: Rounds with reverse grid races       │
│   Priority: Race 1 finish → Qualifying           │
│                                                   │
│ Notes (optional):                                 │
│ ┌───────────────────────────────────────────────┐ │
│ │                                               │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ [Cancel]  [Save & Apply Tie-Breaking]            │
└───────────────────────────────────────────────────┘
```

### Results Preview with Tie-Breaking

```
═══════════════════════════════════════════════════
PREVIEW RESULTS - DIVISION 1
Round 5 - Brands Hatch GP
═══════════════════════════════════════════════════

⚠️  TIE-BREAKING APPLIED

The following drivers tied on total points:
• Sarah, Chris, Emma: 43 points (Positions 4-6)

Tie-breaking method: Standard Sprint
Resolution: Decided by Race 1 finish order

Pos│ Driver │ Pts│ R1│ R2│ R3│ Tie-Break
───┼────────┼────┼───┼───┼───┼─────────────────
 4 │ Sarah  │ 43 │ 1 │ 3 │ 2 │ Race 1: P1
 5 │ Chris  │ 43 │ 2 │ 3 │ 1 │ Race 1: P2
 6 │ Emma   │ 43 │ 3 │ 1 │ 2 │ Race 1: P3

[← Edit Tie-Breaking] [Publish Results]
```

---

## Related Documentation

- `07-Result-Entry.md` - Entering race results
- `06-Round-Setup.md` - Creating rounds and races
- `05-Season-Creation.md` - Season configuration