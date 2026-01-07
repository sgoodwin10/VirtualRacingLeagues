# Season Form Modal - Design 2: Split Panel Dashboard

## Overview

This plan describes the implementation of a new Season Form Modal component (`SeasonFormSplitModal.vue`) that provides an alternative UI to the existing `SeasonFormDrawer.vue` with a modernized split-panel dashboard design based on `design-2.html`.

**Note**: This component will exist alongside `SeasonFormDrawer.vue`, not replace it.

## Feature Summary

The new modal provides a **split-panel dashboard** UI for creating and editing seasons with:
- **Left sidebar navigation** with section links and real-time status summary
- **Right content area** with section-based form organization
- **Dark-themed motorsport aesthetic** matching the design system
- **Vue Transition animations** for smooth section transitions
- **Real-time settings summary** showing enabled features
- **Responsive design** with tab bar navigation on mobile

## Key Design Elements

### 1. Modal Structure (Desktop)
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Icon + Title + Subtitle + Close Button             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────────────────────────────────┐│
│  │  SIDEBAR     │  MAIN CONTENT                            ││
│  │  ──────────  │  ──────────────────────────              ││
│  │  //Sections  │  Section Title + Description             ││
│  │  • Basic     │                                          ││
│  │  • Driver    │  Form Fields / Settings Cards            ││
│  │  • Team      │                                          ││
│  │  • Branding  │                                          ││
│  │  ──────────  │                                          ││
│  │  //Active    │                                          ││
│  │  Settings    │                                          ││
│  │  • Divisions │                                          ││
│  │  • Teams     │                                          ││
│  │  • Drops     │                                          ││
│  │  • Ties      │                                          ││
│  └──────────────┴──────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Footer: Cancel + Create/Save Button                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. Modal Structure (Mobile - Tab Bar)
```
┌─────────────────────────────────────┐
│  Header: Icon + Title + Close       │
├─────────────────────────────────────┤
│  ┌─────┬─────┬─────┬─────┐         │
│  │Basic│Drivr│Team │Brand│  TAB BAR│
│  └─────┴─────┴─────┴─────┘         │
├─────────────────────────────────────┤
│                                     │
│  MAIN CONTENT                       │
│  Section Title + Description        │
│                                     │
│  Form Fields / Settings Cards       │
│                                     │
│  Status Summary (collapsible)       │
│                                     │
├─────────────────────────────────────┤
│  Footer: Cancel + Create/Save       │
└─────────────────────────────────────┘
```

### 3. Sections
1. **Basic Info**: Name, car class, description, technical specs with slug preview
2. **Driver Settings**: Race divisions, race times, drop rounds, tiebreaker rules
3. **Team Settings**: Team championship toggle with nested options
4. **Branding**: Simplified logo and banner upload with remove capability

### 4. UI/UX Features
- Sidebar navigation with active section highlighting (desktop)
- Tab bar navigation on mobile (responsive breakpoint)
- Real-time "Active Settings" summary (ON/OFF indicators)
- Setting cards with checkbox toggle and nested options
- Draggable tiebreaker rules ordering
- Simplified file upload areas with remove existing image capability
- Vue Transition components for smooth section animations
- Accessibility maintained (keyboard navigation, ARIA labels)

## Design Decisions

| Question | Decision |
|----------|----------|
| Parallel Usage | Exists alongside `SeasonFormDrawer.vue` (not a replacement) |
| Branding Upload | Simplified upload UI with remove existing image capability |
| Mobile Layout | Sidebar collapses to horizontal tab bar |
| Animations | Vue Transition components for section transitions |

## Scope

### In Scope
- New Vue component: `SeasonFormSplitModal.vue`
- Reuse existing common components where possible
- Same functionality as current `SeasonFormDrawer.vue`
- Same API integration (no backend changes required)
- Dark theme styling matching design-2.html
- Responsive design with mobile tab bar
- Vue Transition animations

### Out of Scope
- Backend API changes (using existing endpoints)
- Changes to existing `SeasonFormDrawer.vue` (separate component)
- New data fields or season properties
- Removing or deprecating `SeasonFormDrawer.vue`

## Technical Approach

### Frontend
- Create new Vue 3 component with Composition API
- Use existing common components: `BaseModal`, `FormInputGroup`, `FormLabel`, `FormError`, etc.
- Create simplified upload component for branding section
- Create new subcomponents for split-panel specific UI elements
- Implement CSS styles matching the dark theme design
- Use Vue Transition components for animations
- Implement responsive breakpoints for mobile tab bar
- Reuse existing composables and stores (`useSeasonStore`, `useSeasonValidation`)

### Backend
- No changes required - uses existing Season CRUD API
- All endpoints already support the required functionality

## Implementation Agents

| Task | Agent | Description |
|------|-------|-------------|
| Frontend Component | `dev-fe-app` | Main modal component and subcomponents |
| Styling | `dev-fe-app` | CSS/Tailwind styling for dark theme |
| Responsive Design | `dev-fe-app` | Mobile tab bar implementation |
| Vue Transitions | `dev-fe-app` | Animation implementation |
| Integration Testing | `dev-fe-app` | Vitest unit tests |
| Backend | `dev-be` | **Not required** - no changes needed |

## Files to Create/Modify

### New Files
```
resources/app/js/components/season/modals/
├── SeasonFormSplitModal.vue              # Main modal component
├── partials/
│   ├── SplitModalSidebar.vue             # Left sidebar navigation (desktop)
│   ├── SplitModalTabBar.vue              # Tab bar navigation (mobile)
│   ├── SplitModalNavItem.vue             # Navigation item component
│   ├── SplitModalStatusSummary.vue       # Active settings summary
│   ├── SettingCard.vue                   # Toggleable setting card
│   ├── TiebreakerRulesList.vue           # Draggable rules list
│   └── SimpleImageUpload.vue             # Simplified upload with remove
```

### Existing Files (No Changes)
- `resources/app/js/components/season/modals/SeasonFormDrawer.vue` - Unchanged, coexists
- `resources/app/js/services/seasonService.ts` - Reuse existing
- `resources/app/js/stores/seasonStore.ts` - Reuse existing
- `resources/app/js/composables/useSeasonValidation.ts` - Reuse existing
- `resources/app/js/types/season.ts` - Reuse existing

## Success Criteria

1. Modal displays with split-panel layout matching design-2.html
2. All sections navigate correctly with Vue Transition animations
3. Mobile view shows tab bar instead of sidebar
4. Form validation works identically to current drawer
5. Create/Update season functionality unchanged
6. Real-time status summary updates as settings toggle
7. Tiebreaker rules can be reordered via drag-and-drop
8. Simplified image uploads work for logo and banner
9. Existing images can be removed without uploading new ones
10. Responsive design works across breakpoints
11. Accessibility maintained (keyboard navigation, ARIA labels)
12. Unit tests pass with good coverage
13. Coexists with `SeasonFormDrawer.vue` without conflicts

## Timeline Estimate

This is a UI implementation with existing backend support, estimated complexity: **Medium**

- Phase 1: Supporting components (NavItem, StatusSummary, SettingCard) - Small
- Phase 2: SimpleImageUpload component - Small
- Phase 3: Sidebar + TabBar components - Small
- Phase 4: Main modal component - Medium
- Phase 5: Vue Transitions + responsive design - Small
- Phase 6: Testing - Small
