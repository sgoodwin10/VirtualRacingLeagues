# Design Brief for Public Facing site
- This is the public facing side of the app `Virtual Racing Leagues`.
- its an app that allows virtual racing / sim racing managers can manage their competitions easily.
- it will consist of 2 main areas
    - Brochure style with Landing Page/Signup/Product Overview/promoting the app, etc
    - Area to view public leagues, their competitions, seasons and results.


# Design UI/UX
this is a site for sim racing managers and drivers come to view and manage results. So theming must be around driving/racing/online competition. 


# Brochure Style area
- needs to promote the ease of using the platform

## Tagline / Description
something along the lines of
- Setup your league, copetitions and seasons in easy steps
- Create a few rounds and races.
- enter results
- share the link for everyone to view

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
- Track details
- AI OCR Reader
- Google Sheets
- More platforms and games



# Research 
reseach the `app` side of the application to get a holistic overview of the app and its features.



# Public Leagues area
want this section to look very clean, intuitive and minimalist. Respect the design and colour schema.
- An area that will list all the legaues that are public. have pagination and also a search field.
- clicking on it will show all competitions and a list of seasons.
- clicking on a season will show the standings, as well as an area to look at each round and races.
- use the leagues logo and background image if they exist. use them all the way to round/race/season results.
