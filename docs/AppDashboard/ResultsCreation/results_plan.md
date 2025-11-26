
# Purpose
To upload or enter results of a race or qualifier. These result will help calculate the rounds results.


# Workflow
## Create and Update
1. On race event, click button to enter results
2. modal opens
3. copy and paste a csv into a text area, or enter each driver's time manually.
4. save to database


# Database
New table called `race_results`

## Fields
`id`, `race_id`, `driver_id`, `race_time` (time in hh:mm:ss.milliseconds), `race_time_difference` (time in hh:mm:ss.milliseconds), `fastest_lap` (time in  hh:mm:ss.milliseconds), `penalities` (time in hh:mm:ss.milliseconds), `has_fastest_lap` (boolean), `has_pole` (boolean), `status` (enum `pending` and `confirmed`), `race_points` (integer)

Add any other relations ships that might be needed.


# UI
The modal should have 2 main sections - top and bottom. There will also be a save/update button as well as cancel.

## Top
A basic textarea input field to paste in a csv.

## Bottom
if there a divisions for this season (app/Domain/Competition/Entities/Season.php - raceDivisionEnabled)
show each division, broken into 3 columns.
The division will list all the drivers in that division.
The drivers table for the division will consist of columns `driver`, `race_time`, `race_time_difference`, `fastest_lap_time`, `penalties`.
each driver row will have input fields. 
- the `driver` will be a select box of all the drivers in that division (and realtime validation that the same driver cannot be on multiple rows - maybe disble or remove from select box??).
- `race_time` will have input mask (https://primevue.org/inputmask/) for hh:mm:ss.milliseconds - not required
- `race_time_difference` will have input mask (https://primevue.org/inputmask/) for hh:mm:ss.milliseconds - not required
- `fastest_lap_time` will have input mask (https://primevue.org/inputmask/) for hh:mm:ss.milliseconds - not required
- `penalties` will have input mask (https://primevue.org/inputmask/) for hh:mm:ss.milliseconds - not required

The table will need to be automatically sorted for race time - unless its qualifying, when it will sort by lap time.

### important
When entering qualification results, `race_time` and `race_time_difference` will not be shown.


# UX
when pasting in a csv, and then looping through each row, the code will attempt to match the current driver with one in any of the divisions. If found, it will update the matching rows data by entering the rest of the details from the drivers row in the csv.

A CSV will have either a `race_time` or a `race_time_difference`. if both, always use the race time and ignore the race_time_difference.

If only `race_time_difference` is passed, this is the time (hh:mm:ss.milliseconds) off of the fastest driver in the current division. Eg if the fastest driver is `00:01:23.546` and the other drivers `race_time_difference` is `+00:00:02.104` then the drivers race time is a calculation sum of the fastest drivers time and the different (`00:01:25.650`). This needs to be a dynamic realtime calulcation.

in the UI, if a penalty is added `+00:00:05.000`, this will need to be added to the drivers race time, AND the table reordered to cater for the sort by race time (or qualifying time).

This is a very complex part of the race entry UI/UX. Ask questions for claification.


# CSV Format
First row will be fields (`driver`, `race_time`, `race_time_difference`, `fastest_lap_time`).
each subsequent row will be the driver and results. 


At any time the data can be saved, as long as the data is valid. When editing a race result, all the data will be retrieved from the database.




## Things for next phase - DO NOT DO NOW.
Changing a race result status to `confirmed` as well as calculating the results, pole and fastest lap.