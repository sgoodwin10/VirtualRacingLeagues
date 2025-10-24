i want to create a new page in the admin dashboard. it is for `Leagues`.

it will have a nav menu, under `users`.

it will function exactly like `resources/admin/js/views/UsersView.vue`, but for `leagues`.

it will not have a `create` button.

the columns will be: id, logo (show 32px 32px), name (and slug in a small font size), platforms, visibiliy, status, manager (user) and action column

you can order on id, name, visibility, status

you can filter on visibility, status and platforms (multi select)

actions will be view (drawer from bottom will appear and show league details - leave blank for now), and archive. archive will require a confirm and then archive the league. When archived, a league can be deleted. So the archive button will change to a delete button. Let the delete button do nothing for now.

use dev-be and dev-fe-admin