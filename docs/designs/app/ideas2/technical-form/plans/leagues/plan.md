# Overview
Redesign the league detail page to the new layout.

# Existing Layout
`resources/app/js/views/LeagueDetail.vue`

# New Layout
`docs/designs/app/ideas2/technical-form/plans/leagues/variation-3-split-panel.html`

- this should exist next to the existing icon rail navigation.

- Follow the layout and design exactly.
- components to use
    - `resources/app/js/components/common/lists`
    - `resources/app/js/components/common/cards`


# Left side
- use current league header for the background, or have a fallback
- use current league logo or have a fall back.
- show league name and tagline
- show visibility and status
- show competitions, drivers, seasons and platforms.
- in league config, show
    - organiser name
    - organiser email
    - slug
    - plaforms
    - description
    - all social urls
- show social media links
- edit league (make button more subtle)
- settings button - open modal `resources/app/js/components/league/modals/LeagueWizardDrawer.vue`


# Right Side
- show dashboard header
- Show active seasons
    - highlight colour should be the colour the season has selected.
- `Quick actions` section remove
- new section called `Competitions`.
- list all competitions in a card (same style as existing `quick actions`)
    - clicking on compeition will open a small modal with basic information
    - will expand on this in Version 2.
- have a `add competition` button at the end.
    - will open modal `resources/app/js/components/competition/CompetitionFormDrawer.vue`
- keep `recent activity`, but leave empty. will do in version 3


# Documentation
Create plans in `docs/designs/app/ideas2/technical-form/plans/leagues`