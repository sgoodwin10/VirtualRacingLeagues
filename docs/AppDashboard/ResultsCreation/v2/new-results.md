# OVerview
i want to rewrite/redo the results modal and saving functionlity in `resources/app/js/components/result/RaceResultModal.vue`.


# important:
- Create 3 document plans in `docs/AppDashboard/ResultsCreation/v2`. an overview, frontend and backend file.
- include what agents will be used for each section.
- be precise as possible in the plans.
- no extra fluff.
- Ask any questions during planning or implementation if not sure.
- this is a very important part of the app, and needs to be correct

# first steps
- review the current `resources/app/js/components/result/RaceResultModal.vue` functionality and calculations to understand what already exists
- remove any functionality or calculations that are not required.

# Results Modal
- when opening to enter results for the first time, no drivers should be visible in the list.
- `Add Driver` button will add a new driver row, and then select the frist driver who is not already in the results list.
- when opening to edit/view results, only the drivers saved in the database should appear, and they should appear in the same order as their `race_results.position`.

# Parse CSV
- When parsing the CSV data (check and keep the existing functionality);
-- if the data has race times and time difference data, it needs to calculate the race time and then order the drivers in race time from fastest to slowest.
--- it will add all the drivers from the CSV that it can match
--- if a driver has `DNF` for their race, it will check the DNF checkbox for that driver/row
-- if there is no race time data, use the exact order that the CSV is in
- if a qualifying result, order the results basted on the fastest lap.


# Divisions
- if there are divisions for the season, drivers should be separated into their correct divisions
- Ordering and postions will be division based.


# Fastest Lap
- no front end calculations to determine the fastest lap.

# Time Difference & Race Time Calculations
- recalculate the only when a time difference has been changed.
- do not reorder the results table


# Penalties & Calculations
- when a penalty has been added, it needs to add the penalty time to the race time.
- do not reorder the results table


# DNF Calculations
- if DNF is selected, the race time and time difference should be removed - if they exist - from the drivers/row input fields.
- do not reorder the results table


# Results table
- add drag and drop functionality to be able to reorder the results as the user wants for all results (quali, race, time enabled and disabled)
- there shoud be NO automatic reordering.
- Drag and drop should always be enabled.

# Delete
- will remove the driver/row from the table, and will not be included when saving the results.

# Saving results
- it will only save the results that appear in the table. It will need to delete from the database any previous results that might have existed before, so make sure only drivers in the results table are saved.
- the driver position will be based on their position in the table - with respect to divisions if they are enabled and exist.
- if fastest lap times exist, attempt to determine the fastest lap time for the race/division and mark it as such in the database.

## Agents
- use as many agents @dev-fe-app and @dev-be as required.
