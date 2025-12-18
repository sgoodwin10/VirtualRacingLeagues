# Overview
Update the season configuration to include 2 new features
1. Add drop rounds (and number of drop rounds) to Teams.
    - A drop round is the ability to ignore the lowest scoring round(s) in a season when determining standings for teams
2. Add the ability to select the number of drivers points that would be used to calculate a teams round score


# Current
All we have currently is just the `teams` concept


# Feature to build
When creating a season, there is the ability to enable `Teams Championship` in `resources/app/js/components/season/modals/SeasonFormDrawer.vue`. When this option is selected, a 2 new fields will appear:

1. A select box with the options `All`, `1`, `2`, etc up to 16.
    - if `All` is selected, the database field will be null, otherwise use the selected integer
2. Enable Teams Drop Rounds (boolean - with a toggle button)
    - if enabled, a `total drop rounds` input will appear to allow for the number of drop rounds


# New Database fields 
These fields are to go into the `seasons` table, after the field `team_championship_enabled`
`teams_drivers_for_calculation` - integer / nullable
`teams_drop_rounds` - boolean
`teams_total_drop_rounds` - int / nullable


# Existing records.
All existing rounds will have this disabled


# Plan doumentation location
Create the plan in `docs/AppDashboard/TeamsCreation/drop-rounds`


# Agents
use agents @dev-fe-app and @dev-be