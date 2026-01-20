# Overview
Have buttons that will export and download a CSV of race and round results, as well and season standings in different sections of the app dashboard.

# Data
- Division and Team are required when a season has teams and/or divisions enabled
- Points column can be empty if the race/qualifier does not have race points enabled
- if Divisions, display drivers grouped by `divisions` order and then their position in the division
- If `teams` is not enabled or the driver does not belong to a team, leave column blank
- Download csv button will only appear when race/qualifying results is `readOnly` mode.


## Export Race Results
- file `resources/app/js/components/result/RaceResultModal.vue`
- have download button in place of `Reset All Results`
- CSV Export Filename - `<competition>-<season>-<round>-<race>-results.csv`
- Headers
```
Position, Division, Driver Name, Team, Race Time, Time Difference, Penalties (if a race), Fastest Lap, Points
<loop through each driver>
```


## Export Qualifying Results
- file `resources/app/js/components/result/RaceResultModal.vue`
- have download button in place of `Reset All Results`
- CSV Export Filename - `<competition>-<season>-<round>-<qualifier>-results.csv`
- Headers
```
Position, Division, Driver Name, Team, Qualifying Lap, Time Difference
<loop through each driver>
```


## Export Round Standing Results
- file `resources/app/js/components/round/modals/RoundResultsModal.vue`
- CSV Export Filename - `<competition>-<season>-<round>-standing.csv`
- have button location in the header, aligned right. Button label `Download Round Results`
- Headers
```
Position, Division, Driver Name, Team, Round Points
<loop through each driver>
```


## Round Cross Division Fastest Lap, Race Times and Pole
- file `resources/app/js/components/round/modals/RoundResultsModal.vue`
- CSV Export Filename - `<competition>-<season>-<round>-<fastest-laps/race-times/qualifying-times>.csv`
- have button location at the top of each panel, aligned right. Button label `Download <Fastest Laps/Race Times/Qualifying Times>`
- Headers
```
Position, Division, Driver Name, Team, Time/Time difference
<loop through each driver>
```


## Export Standings
- file - `resources/app/js/views/season/StandingsView.vue`
- CSV Export Filename - `<competition>-<season>.csv`
- drop round total will only appear if drop round is enabled on the season.
- show each completed round with a extra columns for that round's has fastest lap and has pole position (if available).
- Headers
```
Position, Division, Driver Name, Team, <Each round points, has fastest lap 1/0, and has pole 1/0>, total points, drop round
<loop through each driver>
```


# Plan Creation
- Create plans in `docs/plans/CSVExport`
- have a overview plan that links to each plan. 
- separate out into front end and backend
- ask any questions 1 by 1
