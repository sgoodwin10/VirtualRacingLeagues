# Design Brief for Public Facing site
- This is the public facing side of the app `Virtual Racing Leagues`.
- its an app that allows virtual racing / sim racing managers can manage their competitions easily.
- it will consist of 2 main areas
    - Brochure style with Landing Page/Signup/Product Overview/carousel/etc promoting the app, etc
    - Area to view public leagues, their competitions, seasons and results.



# TASK
- create 3 unqiue html designs that will have 2 pages each - the brochure page, as well as the view leagues page.
- directory `docs/PublicDashboard/design-2026`
- it will contain elements like:
    - navigation
    - competition standings table
    - form fields
    - carousel
    - etc
- this will be the basis for the redesign for `resources/public`


# Design UI/UX
this is a site for sim racing managers and drivers come to view and manage results. So theming must be around driving/racing/online competition. 
Use the design style/ux/ui/colours of `resources/app` as this will be the public facing brochure site for the app. Use the same colours, fonts, padding, etc.
Important Files and Directories
- `resources/app/css/app.css` for css styles
- `resources/app/js/components/common` for resuable components


# Brochure Style area
- needs to promote the ease of using the platform

## Tagline / Description
something along the lines of
- Setup your league, comptitions and seasons in easy steps
- Create a few rounds and races.
- enter results
- share the link for everyone to view


## The Basics
The steps required for a basic competition:
- sign up and create you league. Example `Barry's Barry-R League`
- Add/import a list of drivers
- Create a Competition `Sunday GT4 League`
- Create a season `Winter 2026`
- Add drivers to the league
- Create a round, and the races for the round
- When you have completed the round, add/import the race results and complete the round.
- View the leaderboard.


## Price
its currently free, but i don't want the typical different tier prices that alot of SAAS products use. i want it indicated that it is all free.

## Register / athentication
look in `resources/public/js/views/auth` for existing working files and functionality for the register, login, lost password, etc.

## Features
- Support platforms: Gran Turismo 7, iRacing
- Create Leages, competitions, seaons, rounds, qualifcations, sprints
- Determine Qualifiying Pole, Fastest lap, Race Times and gaps
- Penalties, DNF and DNS calculations
- Driver tracking
- Division and Team management and results
- Simple CSV uploads for bulk updates and imports
- Exportable results
- Shareable public link for full season states



## Coming Soon
- GT7 data from daily races
- GT7 track api data
- GT7 Car api data
- Season car selection
- Individual race car selection
- Track details
- AI OCR Reader
- Google Sheet Imports
- More platforms and games



# Research 
reseach the `app` side of the application to get a holistic overview of the app and its features.



# Public Leagues area
want this section to look very clean, intuitive and minimalist. Respect the design and colour schema.
- An area that will list all the legaues that are public. have pagination and also a search field.
- clicking on it will show all competitions and a list of seasons.
- clicking on a season will show the standings, as well as an area to look at each round and races.
- use the leagues logo and background image if they exist. use them all the way to round/race/season results.
