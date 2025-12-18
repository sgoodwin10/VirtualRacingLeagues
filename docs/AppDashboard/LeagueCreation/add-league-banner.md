# Overview
Add the option to upload a League Banner, along with the existing logo and background image


# Existing
Ability to only upload a logo (`logo_path`) and background header image (`header_image_path`) via the `resources/app/js/components/league/modals/LeagueWizardDrawer.vue`


# Feature
Add a new upload field between logo and background image for a League banner


# Requirements
- New ability to upload a `League Banner` in the `resources/app/js/components/league/modals/LeagueWizardDrawer.vue` form. 
- add next to the `League Logo` field.
- put the Leage background image on a new line
- image is optional
- max height will be 100px
- max width will be 800px;
- min width will be 200px
- min height will be 32px
- add the same error/validation checking as leagure logo.
- removing the image and saving the form will nullify the database table field.


# Database fields
new field will be `banner_path`. string.


# Agents
use @dev-fe-admin and @dev-be