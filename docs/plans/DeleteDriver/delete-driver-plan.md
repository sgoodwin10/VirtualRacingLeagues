# Overview
When delteing a driver from a league, it should only mark the driver as `deleted` (i think the `deleted_at`) field. It needs to leave the `league_drivers` database relationship so the driver appears on the race results and standings table.

# Current
Currently when deleting the driver (from `resources/app/js/views/season/DriversView.vue`), it deletes the `leagure_drivers` relationship table.

# Goal
When deleting a driver, it ONLY marks the driver as deleted in the drivers table BUT the driver name will still appear everywhere else in the app, public and admin sections. This will require database lookups that will still retrieve the driver even though they are deleted.

in the `resources/app/js/views/season/DriversView.vue`, there will be a new filter for driver status. The options will be `active` and `deleted`. All drivers that are not marked as `deleted` will be considered `active`. And driver whose `deleted_at` is populated will be considered `deleted`.

Do a thorough check to confirm that all over parts of the site (app, public and admin) still show the driver (race results, standings, etc)

