# Edit League Modal - Design 1: Split Panel Navigation

## Overview

This document describes the implementation plan for a new **Edit League Modal** component that follows the UI/UX design from `design-1.html`. The design features a split-panel layout with a sidebar navigation system, allowing users to navigate between different sections of the league configuration form.

## Migration Strategy

**Decision: Replace `LeagueWizardDrawer.vue` with the new `EditLeagueModal.vue`**

The new `EditLeagueModal.vue` component will fully replace the existing `LeagueWizardDrawer.vue`. This is a complete replacement, not a coexistence strategy.

### Migration Steps

1. **Phase 1: Create New Component**
   - Build `EditLeagueModal.vue` with all functionality from design-1.html
   - Ensure feature parity with `LeagueWizardDrawer.vue`
   - Keep `LeagueWizardDrawer.vue` in place during development

2. **Phase 2: Update Usages**
   - Find all places where `LeagueWizardDrawer` is imported/used
   - Replace with `EditLeagueModal` component
   - Update any props or events as needed

3. **Phase 3: Cleanup**
   - Delete `LeagueWizardDrawer.vue` after all usages migrated
   - Remove any unused imports or dependencies

### Files to Delete (After Migration)

| File | Reason |
|------|--------|
| `resources/app/js/components/league/modals/LeagueWizardDrawer.vue` | Replaced by EditLeagueModal.vue |

### Files to Update (Usage Migration)

Search for imports of `LeagueWizardDrawer` and update to use `EditLeagueModal`:
- Views that open the league create/edit modal
- Any parent components that control modal visibility

## Feature Summary

The Edit League Modal will provide a modern, terminal-inspired interface for editing league details. Key characteristics include:

1. **Split Panel Layout**: A sidebar (200px) with navigation + main content area
2. **Section-based Navigation**: Four distinct sections (Basic Info, Contact, Media, Social Links)
3. **Real-time Progress Tracking**: Sidebar shows completion status for each section
4. **Dark Theme Styling**: Terminal-inspired aesthetic with cyan/green accent colors
5. **Responsive Form Fields**: All existing form fields from `LeagueWizardDrawer.vue` preserved

## Design Elements

### Modal Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Icon + Title + Close Button                         │
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar  │ Main Content Area                                │
│          │                                                  │
│ //SECTIONS│ Section Header                                  │
│ ○ Basic  │ ────────────────                                 │
│ ○ Contact│ Form Fields...                                   │
│ ○ Media  │                                                  │
│ ○ Social │                                                  │
│          │                                                  │
│ ──────── │                                                  │
│ //STATUS │                                                  │
│ Name: -- │                                                  │
│ Plat: 0  │                                                  │
│ [████░░] │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│ Footer: Cancel + Create/Save League Button                  │
└─────────────────────────────────────────────────────────────┘
```

### Sections

1. **Basic Info** (Required fields marked)
   - League Name (required) + Slug preview
   - Tagline
   - Platforms (required)
   - Description (rich text)
   - Visibility toggle (Public/Unlisted)
   - Timezone selector

2. **Contact**
   - Contact Email
   - Contact Name (Organizer)

3. **Media**
   - Logo upload (square, 400x400px)
   - Banner upload (200-800px wide)
   - Header Image upload (1200x400px)

4. **Social Links**
   - Discord URL
   - Website URL
   - Twitter/X handle
   - Instagram handle
   - YouTube URL
   - Twitch URL

## Design-Specific UI Elements

### Sidebar Navigation
- Active section highlighted with cyan background
- Badge indicators: `REQ` (orange) for required sections, checkmark (green) for complete
- Completion summary at bottom showing: Name, Platforms count, Visibility, Media count
- Progress bar showing overall completion percentage

### Platform Selection
- Chip-style buttons instead of dropdown
- Selected chips have cyan border and background
- Icons for each platform (PC, PlayStation, Xbox)

### Visibility Toggle
- Segmented control (Public/Unlisted buttons)
- Status panel below toggle explaining current selection
- Color-coded: Green for Public, Orange for Unlisted

### Slug Preview
- Inline indicator showing slug availability
- Animated pulse indicator while checking
- Real-time slug generation from league name

## Files to Create/Modify

### New Components (Frontend)

| File | Description |
|------|-------------|
| `resources/app/js/components/league/modals/EditLeagueModal.vue` | Main modal component |
| `resources/app/js/components/league/modals/partials/EditLeagueSidebar.vue` | Sidebar navigation component |
| `resources/app/js/components/league/modals/partials/EditLeagueHeader.vue` | Modal header with icon and title |
| `resources/app/js/components/league/modals/partials/EditLeagueProgress.vue` | Progress/completion tracking component |
| `resources/app/js/components/league/modals/partials/sections/BasicInfoSection.vue` | Basic info form section |
| `resources/app/js/components/league/modals/partials/sections/ContactSection.vue` | Contact form section |
| `resources/app/js/components/league/modals/partials/sections/MediaSection.vue` | Media upload section |
| `resources/app/js/components/league/modals/partials/sections/SocialSection.vue` | Social links section |
| `resources/app/js/components/common/forms/PlatformChips.vue` | Platform chip selector (reusable) |
| `resources/app/js/components/common/forms/VisibilityToggle.vue` | Visibility segmented control (reusable) |

### Existing Components to Reuse

| Component | Usage |
|-----------|-------|
| `BaseModal.vue` | Base modal wrapper |
| `FormLabel.vue` | Form field labels |
| `FormInputGroup.vue` | Form field grouping |
| `FormError.vue` | Error message display |
| `FormOptionalText.vue` | Helper text |
| `ImageUpload.vue` | Image upload with preview |
| `SocialMediaFields.vue` | Social links form fields |
| `InfoBox.vue` | Info banner component |
| `Button.vue` | Action buttons |

### Backend (No Changes Required)

The existing backend API endpoints in `LeagueController.php` already support all required functionality:
- `GET /api/leagues/{id}` - Fetch league data
- `PUT /api/leagues/{id}` - Update league data
- `POST /api/leagues/check-slug` - Validate slug availability

## Technical Considerations

### State Management
- Use reactive form state similar to `LeagueWizardDrawer.vue`
- Track active section for navigation
- Compute completion status for progress tracking
- Debounce slug checking on name input

### Styling
- Apply design-1.html CSS variables via Tailwind classes
- Use CSS custom properties for theme colors
- Maintain dark theme aesthetic

### Accessibility
- ARIA labels on navigation items
- Keyboard navigation between sections
- Focus management when switching sections
- Screen reader announcements for validation

### Reusability
- Extract `PlatformChips.vue` for use elsewhere
- Extract `VisibilityToggle.vue` for use elsewhere
- Section components can be reused in other contexts

## Implementation Agents

| Agent | Responsibility |
|-------|----------------|
| `dev-fe-app` | Frontend Vue components, styling, state management |
| `dev-be` | Backend modifications if needed (none expected) |

## Success Criteria

1. Modal opens with correct layout matching design-1.html
2. All sections navigable via sidebar
3. Form data persists when switching sections
4. Progress bar updates as fields are completed
5. Slug validation works with visual feedback
6. Platform chips select/deselect correctly
7. Visibility toggle updates status panel
8. Media uploads function correctly
9. Form submission creates/updates league
10. All existing LeagueWizardDrawer functionality preserved
