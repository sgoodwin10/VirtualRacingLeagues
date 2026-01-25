# Public League Detail Enhancement - Overview

## Feature Summary

Enhance the public league detail page (`resources/public/js/views/leagues/LeagueDetailView.vue`) to display more information about the league, including social media links, contact information, and a modal popup for detailed league information.

## Current State

### What Exists
- **LeagueDetailView.vue**: Displays league header with banner, logo, name, primary platform, and basic stats (drivers count, competitions count, active seasons)
- **LeagueHeader.vue**: Component that renders the league banner, logo, and meta information
- **Backend**: The `PublicLeagueBasicData` DTO already includes all the social media fields:
  - `discord_url`
  - `website_url`
  - `twitter_handle`
  - `youtube_url`
  - `twitch_url`
  - `description`
  - `tagline`
- **Frontend Types**: `PublicLeagueInfo` interface already has all social media fields defined
- **Modal System**: A well-established VRL modal system exists with `VrlModal`, `VrlModalHeader`, `VrlModalBody`, `VrlModalFooter` components

### What's Missing
- Social media links are not displayed on the LeagueHeader component
- No modal popup for detailed league information
- No "About" or "More Info" button to trigger the modal
- Contact information (contact_email, organizer_name) is not exposed in the public DTO

## Proposed Changes

### 1. Display Social Links in LeagueHeader
Add social media links below the league meta information:
- **Discord Link**: Full URL with Discord icon (if available)
- **Website Link**: Full URL with globe/link icon (if available)
- **Social Media Icons Only**: Twitter/X, Instagram, YouTube, Twitch - displayed as icons that open in new tabs

### 2. "About" Button & Modal
Add an "About" or "More Info" button that opens a modal containing:
- League description (full text)
- League tagline
- All social media links (with full URLs)
- Contact information (if available)
- Organizer name (if available)

### 3. Backend Enhancement (Optional)
Consider exposing `contact_email` and `organizer_name` in the `PublicLeagueBasicData` DTO for the modal. This is optional as leagues may want to keep this private.

## Design Considerations

### Social Link Display Rules
1. Discord and Website: Show as full clickable links with icon on the left
2. Twitter, Instagram, YouTube, Twitch: Show as icon-only buttons that open in new tabs
3. Only show links that are available (not null/empty)

### Visual Design
- Follow existing VRL design system (cyan accent color, dark theme)
- Use Phosphor Icons for social media icons
- Ensure mobile responsiveness
- Match existing styling patterns in the codebase

## Files to Modify

### Frontend (resources/public/js/)
1. `components/leagues/LeagueHeader.vue` - Add social links display
2. `components/leagues/LeagueInfoModal.vue` - **New file** - Modal for detailed info
3. `views/leagues/LeagueDetailView.vue` - Add modal integration and "About" button
4. `types/public.ts` - Add `instagram_handle` if missing (it exists in backend but may be missing from frontend type)

### Backend (app/)
1. `Application/League/DTOs/PublicLeagueBasicData.php` - Optionally add `contact_email` and `organizer_name`

## Agents to Use

| Task | Agent | Rationale |
|------|-------|-----------|
| Frontend development | `dev-fe-public` | Public site frontend changes in resources/public/ |
| Backend DTO changes | `dev-be` | Laravel backend changes following DDD patterns |
| Design/styling | `public-design` skill | For distinctive UI design that avoids generic AI aesthetics |

## Implementation Order

1. **Backend first** (if adding contact info): Update the DTO to include additional fields
2. **Frontend - Social Links**: Add social links to LeagueHeader component
3. **Frontend - Modal**: Create LeagueInfoModal component
4. **Frontend - Integration**: Wire up the modal to LeagueDetailView
5. **Testing**: Add/update tests for all changes

## Questions to Consider

1. Should `contact_email` be exposed publicly, or should it remain private?
2. Should `organizer_name` be displayed publicly?
3. Is there an `instagram_handle` field that needs to be added to the frontend types?
4. Should the "About" button be in the LeagueHeader or separate?

## Out of Scope

- Adding new social media fields to the database
- Changing the admin dashboard UI
- Modifying the user dashboard
- Adding new API endpoints (existing endpoint returns all needed data)
