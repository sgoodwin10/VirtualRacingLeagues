# Overview
Calculate the `Teams` standing table when a round is complete.

# Current Feature
This feature does not exist. But the `seasons` table does have fields that will be used for the calculations. These fields are `team_championship_eabled` and `teams_drivers_for_calculations`.

- `team_championship_eabled` is a boolean that indicates whether team championship is enabled or not
- `teams_drivers_for_calculations` is the number of drivers to use in the points calculation. if null, use all drivers. if a integer (eg 4), use the top 4 drivers.


# Database
a new field called `team_championship_results` (json object) for the `rounds` table. it can be nullable. after the `fastest_lap_rsults` field.


# implementation
When a round has been marked as `complete`, it currently calculates the round results, quali results, race time results and fastest lap, then
- check to see if `team_championship_eabled` is enabled
- get all the drivers for each team.
- if `teams_drivers_for_calculations` is null, calculate the round total for that team
- if `teams_drivers_for_calculations` is a integer, get the integer value. Then sort all the drivers for that team from highest to lowest score. Then get the `teams_drivers_for_calculations` value of top drivers. Example: if the value is `4`, then get the top 4 drivers and the calculate the round total. if there are not enough drivers, just calculate what you have.
- then create a json object to save to the new field for that round `team_championship_results`


Example JSON object
```
{
    standings: [
        {
            `team_id`: 1
            `total_points`: 45,
            `race_result_ids`: {
                45,67,68,97
            }
        },
        {
            `team_id`: 3
            `total_points`: 32,
            `race_result_ids`: {
                54,56,76,77
            }
        },
        {
            `team_id`: 2
            `total_points`: 19,
            `race_result_ids`: {
                3,7,9
            }
        },
    ]
}
```

# Important
this is only performing the calculation. We will plan how to display this in a future feature build.