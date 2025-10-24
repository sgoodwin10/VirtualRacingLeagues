i want to add a new field to the `seasons` table.

field name `race_divisions_enabled`.

it will act the same way as the `team_championship_enabled` featue.

it will be managed in resources/user/js/components/season/modals/SeasonFormDrawer.vue - the same as team championship

check all dtos, responses, pinia stores, etc include this new field.

update the backend using dev-be.

update front end with dev-fe-user.