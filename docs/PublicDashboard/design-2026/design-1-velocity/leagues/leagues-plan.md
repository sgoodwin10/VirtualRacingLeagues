# Overview
Create a Public Leagues and View League page so anyone can search and view different leagues, competitions, races and their results.


# Static Design
- This is the html page that has the design and layout.
- `docs/PublicDashboard/design-2026/design-1-velocity/leagues.html`
- Replicate the exact layout and design.


# Task
Implement the static design using all the components, design, layout, ui/ux and colours of the `resources.public` dashboard.

## Important
- Use the existing colour schema
- Use existing components found in `resources/public/js/components/common`
- Kepp the same Backend flow as it works already.
- Do not create custom css styles. Use Tailwind CSS


## Leagues
- Layout exactly like the leagues.html page above
- Title will be `Leagues` and not `Public Leagues`
- have the search base and the select boxes. Make sure they work
- Include the public dashboard footer.
- The league card should use the leagues logo, banner and background image if feasible
- if there is any gradients



## View League
- Will be the same layout as when you click on `Red Storm Racing`
- Include the public dashboard footer.

**Url**
- Use the league and competition slugs for the url

**Header**
- Use the leagues background, logo and banner

**Competitions**
- list every competition.
- in the competition have the Current active season highlighted (like the winter 2026 for the GT5 Championship), and the other `completed` seasons not highlight (exactly like the design).
- clicking on the compeition name will open a new page. (more information below - View Season). use the season slug for the url
- clicking on the `completed` season name in the competition will open a new page (more information belew - View Season).


## View Season
- Will show the season standings (tabs for divisions if needed)
- Below it will show the Team standings (if enabled for the season).
- For the standing tables, use the `GT4 Championship - Winter 2026` from the html page.



# Plan
Create a plan in `docs/PublicDashboard/design-2026/design-1-velocity/leagues`. Create a overview plan, then link any other plans you create to it.