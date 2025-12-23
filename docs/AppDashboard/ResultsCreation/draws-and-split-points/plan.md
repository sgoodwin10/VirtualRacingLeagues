# Overview
Seasons have rounds that can consist of multiple races. These races each score their own points. then after all the races and qualifying are completed, there is a calculation that determines the overall round points/results/standing for the round when the round is marked as completed.

Example

---------------------------------------------------------------------
| driver    | quali | r1 pts| r2 pts| r3 pts| total | Round Points  |
---------------------------------------------------------------------
| Driver 2  | 2     | 13    | 4     | 2     | 20    | 25            |
| driver 1  | 4     | 11    | 2     | 3     | 16    | 20            |
| driver 3  | 6     | 3     | 10    | 1     | 14    | 16            |
| driver 4  | 8     | 2     | 1     | 11    | 14    | 13            |
| driver 5  | 8     | 1     | 7     | 0     | 8     | 11            |
---------------------------------------------------------------------


Important: these points will be different as they are customised at a race and round level, so retrieve the correct points from the database for that seaon/round/race



# Issue
if multiple drivers have the same race points total, it determines the order based off the drivers name. This often results in the incorrect standings for a round.


# Plan:
create the plan in `docs/AppDashboard/ResultsCreation/draws-and-split-points`.


# Solution
At a Season level, there should be an option for `round_totals_tiebreaker_rules_enabled` (boolean). This will then have options to help determine the ordering correctly, especially is multiple drivers are tied.

There will be a list of tie-breaker rules that will be used for calculation. These rules will be available for all leagues, but the order will be customised per league/season.

This calculation only occurs when a round is completed. It will be used for the `round_results` calculation.

When creating a new `season`, copy the default set of tiebreaker rules for the season.


## Database Fields
Table `rounds`
- `round_totals_tiebreaker_rules_information` - text. nullable. This will store text that will explain the reason for the driver order. eg `Driver 1 qualified faster than driver 4.`

Table `seasons`
- `round_totals_tiebreaker_rules_enabled` - boolean. Default to false.

New Table `round_tiebreaker_rules` - the table to store all the rules
- `id` - integer, auto increment
- `name` - varchar
- `slug` - varchar, unique

New Table `season_round_tiebreaker_rules` - the table that links the season to the rule and its order, sort of like a pivot table.
- `id` - integer, auto increment
- `season_id` - integer
- `round_tiebreaker_rule_id` - integer
- `order` - integer


## Step 1: Disabled tie breaker

> **Key Clarification**: Tie-handling (shared positions, identical points, position skipping) **ONLY applies when tiebreaker is DISABLED**.

If `round_totals_tiebreaker_rules_enabled` is **disabled** (default), then drivers with the same race points total will:
- Share the **same position** (e.g., both shown as "3rd")
- Receive the **same round points** (not split/averaged)
- The next driver will **skip positions** accordingly

**Example:**
```
driver 1 has 16pts → 2nd place → 20 round points
driver 2 has 20pts → 1st place → 25 round points
driver 3 has 14pts → tied 3rd  → 16 round points (3rd place points)
driver 4 has 14pts → tied 3rd  → 16 round points (3rd place points)
driver 5 has 8pts  → 5th place → 11 round points (SKIPS 4th position)
```

**Important**:
- Both tied drivers (3 and 4) receive identical 3rd place points (16 pts each)
- Points are NOT split or averaged
- Driver 5 is placed 5th, not 4th (position is skipped)

The `resources/app/js/components/season/modals/SeasonFormDrawer.vue` file will have a toggle for this. It will default as disabled.


## Step 2: Enabled Tie Breaker

When `round_totals_tiebreaker_rules_enabled` is **enabled**, tiebreaker rules are applied to determine a winner:
- Rules are applied sequentially until a **winner is determined**
- Winners get their actual position (3rd), losers get next position (4th)
- **Normal position assignment occurs** (no shared positions, no skipping)
- **Only if NO rule breaks the tie**: drivers share the position (fallback to Mode 1 behavior)

**Example with tiebreaker enabled:**
```
driver 1 has 16pts → 2nd place  → 20 round points
driver 2 has 20pts → 1st place  → 25 round points
driver 4 has 14pts → 3rd place  → 16 round points (WON tiebreaker - better quali P6 vs P7)
driver 3 has 14pts → 4th place  → 14 round points (LOST tiebreaker)
driver 5 has 8pts  → 5th place  → 11 round points
```

When `round_totals_tiebreaker_rules_enabled` is enabled on `resources/app/js/components/season/modals/SeasonFormDrawer.vue`, it will show a new section of all the rules that can be dragged and dropped to change position (and update the `season_round_tiebreaker_rules` table). This will dictate the order that the tie breaker rules will trigger.


### Rules (in default order)
- `Highest qualifying position` - Driver with the highest qualifying position
- `Race 1 best result` - The driver with the highest finish in race 1.
- `Best Result from all races` - Driver with the best result out of all the races in the round (excluding the qualifier). If still tied, then  the next best result, then if still tied, the next best result - and continue until no races are left.

These rules can be ordering in any order (have a drag and drop feature for the Front End) for the season.


## Process
- When the round races total has been calculated (for each division if `divisions` is enabled), it needs to check the standings and determine the drivers with the same total. It will then proceed - one by one -  to use the `rules`, for each group of drivers that have the same round race total.
- Each rule is to be executed separately. If the first rule implemented determines a clear result, it will then update the driver order to reflect this change, and then not proceed with any more tie breaker rules. If the rule does not determine a clear result, it will proceed to the next rule.

### Process: Rules


Example table
---------------------------------------------------------------------
| driver    | qualifying position  | r1 pts | r2 pts | r3 pts | total points|
---------------------------------------------------------------------
| Driver 2  | 2     | 13    | 4     | 2     | 20    |             |
| driver 1  | 4     | 11    | 2     | 3     | 16    |             |
| driver 3  | 7     | 3     | 10    | 1     | 14    |             |
| driver 4  | 6     | 2     | 1     | 11    | 14    |             |
| driver 5  | 8     | 1     | 7     | 0     | 8     |             |
---------------------------------------------------------------------

- `Highest qualifying position`:
Get the multiple drivers qualifying race (if exists), The ordering of the qualifier will determine the order for these drivers.

Example:
In the above scenario, driver 4 would end up placing higher in the round results as they had a higher qualifying position


- `Best Result from all races`:
Get all the races for all the drivers. Determine which driver had the best finishing position. This will will determine the order for these drivers. If all drvers had the same finishing position, then check their next bext position. This will will determine the order for these drivers. Continue this for each race. If there are more than 2 drivers in the tiebreaker, as each calculation is determined elimentate where you can. Example, if driver 1 had a finishing position of 2nd, but the next 2 drivers (driver 3 and driver 4) had the same best finishing position as 4th, then driver 1 will be higher in the final standings, removed from the comparison, then driver 3 and driver 4 will continue with the calculations until all driver positions have been determined.

Example:
In the above scenario, driver 3 would end up placing higher in the round results. Even though both driver 3 and 4 had a finishing position of 1st, their next best result is 3 and 2 respectively. So the 2nd place is the winner.


- `Race 1 best result`:
Get the multiple drivers 1st race (if exists), The final result will determine the order for these drivers. if multiple drivers did not have a 1st race, then order them by name.

Example:
In the above scenario, driver 3 would end up placing higher, as they finished the first race higher.
			


### Track Calculations
When a calculation has succeeded, it needs to append the `round_totals_tiebreaker_rules_information` field in the `rounds` table. It needs to be human readable explanation as to why a driver placed higher than the other. example: `Driver 4 had a higher qualifying position than Driver 3`