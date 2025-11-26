# Round Creation - Implementation Summary

**Version:** 1.0
**Last Updated:** October 25, 2025
**Status:** Planning Phase

---

## Overview

Implementation of complete Round and Race management functionality for the user dashboard, following Domain-Driven Design principles on the backend and Vue 3 Composition API on the frontend.

---

## Scope

### Included in this Implementation (MVP - Option C)

✅ **Round Management**
- Create rounds (CRUD operations)
- Round details: number, name, date/time, track selection
- Slug auto-generation (from name or "round-{number}")
- Technical notes, stream URLs, internal notes
- Round status management (scheduled, pre_race, in_progress, completed, cancelled)

✅ **Race Configuration**
- Full race creation and management per round
- Race details: name, type, number
- Qualifying configuration (format, length, tire compound)
- Starting grid determination (qualifying, previous race, championship order, etc.)
- Race length (laps or time duration)
- Platform-specific settings (GT7: weather, tires, fuel, damage, penalties, assists)
- Points system configuration (templates + custom)
- Bonus points (pole, fastest lap, etc.)
- DNF/DNS handling
- Division support (separate results per division)

✅ **Track Selection**
- Search/select from existing track database
- Filtered by season's platform (GT7 season → GT7 tracks only)
- Admin-managed track database (users cannot add tracks)

✅ **User Interface**
- Rounds tab on Season Detail page
- Accordion UI (expandable rounds)
- Round creation drawer (slide from bottom)
- Race creation drawer (slide from bottom)
- Track search/autocomplete
- Date/time picker with timezone inheritance
- Form validation and error handling

❌ **NOT Included** (Future Tasks)
- Race results entry (separate task)
- Points calculation and standings
- Live timing/race control
- Round templates or bulk creation

---

## Key Decisions Summary

### 1. Divisions & Race Results
- **Decision**: Divisions work like race classes - separate result sets per division
- **Impact**: Each race can have multiple result sets (one per division)
- **Example**: Round 5 has 1 race with 3 divisions → 3 separate result entry forms

### 2. Round vs Race Separation
- **Decision**: Rounds and races are separate entities
- **Workflow**: Create round → Expand accordion → Add race(s) → Configure each race
- **Rationale**: Clean separation of concerns, flexible for multi-race rounds

### 3. Track Database Management
- **Decision**: Admin-managed only, users select from existing tracks
- **Filtering**: Tracks filtered by season's platform
- **Rationale**: Maintains data quality, prevents duplicates

### 4. Platform-Specific Race Settings
- **Decision**: PHP config files per platform + API endpoint
- **Structure**: `config/race_settings/{platform}.php`
- **API**: `GET /api/platforms/{platformId}/race-settings`
- **Storage**: Selected values stored as strings/JSON in `races` table
- **Rationale**: Single source of truth, no frontend/backend sync issues, scalable

### 5. Slug Generation
- **Decision**: Always auto-generated, user never edits
- **Pattern**: From round name or fallback to "round-{number}"
- **Uniqueness**: Per season (handled by repository)
- **Rationale**: Simple UX, consistent URLs

### 6. Post-Creation Flow
- **Decision**: Stay on rounds list with success toast
- **Behavior**: New round appears in accordion (collapsed)
- **Rationale**: Non-intrusive, user controls next steps

---

## User Flow

### Primary User Journey

```
Season Detail Page → Rounds Tab
    ↓
Click [+ Create Round]
    ↓
Round Creation Drawer opens (bottom slide)
    ↓
Fill form:
  - Round number (auto-suggested)
  - Round name (optional)
  - Date & time (with timezone)
  - Track selection (searchable, filtered by platform)
  - Technical notes (optional)
  - Stream URL (optional)
  - Internal notes (optional)
    ↓
Click [Create Round]
    ↓
Drawer closes → Toast: "Round created successfully"
    ↓
New round appears in accordion (collapsed)
    ↓
User clicks round to expand
    ↓
Shows: [+ Add Race] button (if no races)
    ↓
Click [+ Add Race]
    ↓
Race Configuration Drawer opens (bottom slide)
    ↓
Fill race form:
  - Race name (optional)
  - Race type (sprint, feature, endurance, etc.)
  - Qualifying format
  - Starting grid determination
  - Race length (laps or time)
  - Platform settings (weather, tires, fuel, damage, etc.)
  - Points system (template or custom)
  - Bonus points configuration
  - Division settings (if enabled)
    ↓
Click [Create Race]
    ↓
Drawer closes → Toast: "Race created successfully"
    ↓
Race appears in expanded round accordion
    ↓
User can:
  - Add more races
  - Edit race details
  - Delete race
  - (Future) Enter results
```

---

## Technical Architecture

### Backend (DDD - Domain-Driven Design)

#### Hierarchy
```
League
  └── Competition
      └── Season
          ├── Division (optional, many)
          └── Round (many)
              └── Race (many, 1-10+ per round)
                  └── RaceResult (many, per division if enabled)
```

#### Layer Structure

**Domain Layer** (Pure PHP, no Laravel dependencies)
```
app/Domain/Competition/
  ├── Entities/
  │   ├── Round.php
  │   └── Race.php
  ├── ValueObjects/
  │   ├── RoundNumber.php
  │   ├── RoundName.php
  │   ├── RoundSlug.php
  │   ├── RoundStatus.php (enum)
  │   ├── RaceName.php
  │   ├── RaceType.php (enum)
  │   ├── QualifyingFormat.php (enum)
  │   ├── GridSource.php (enum)
  │   ├── RaceLengthType.php (enum)
  │   └── PointsSystem.php
  ├── Events/
  │   ├── RoundCreated.php
  │   ├── RoundUpdated.php
  │   ├── RoundDeleted.php
  │   ├── RaceCreated.php
  │   └── RaceUpdated.php
  ├── Exceptions/
  │   ├── RoundNotFoundException.php
  │   ├── InvalidRoundNumberException.php
  │   ├── RaceNotFoundException.php
  │   └── InvalidRaceConfigurationException.php
  └── Repositories/
      ├── RoundRepositoryInterface.php
      └── RaceRepositoryInterface.php
```

**Application Layer** (Use case orchestration)
```
app/Application/Competition/
  ├── Services/
  │   ├── RoundApplicationService.php
  │   └── RaceApplicationService.php
  └── DTOs/
      ├── CreateRoundData.php
      ├── UpdateRoundData.php
      ├── RoundData.php
      ├── CreateRaceData.php
      ├── UpdateRaceData.php
      └── RaceData.php
```

**Infrastructure Layer** (Persistence)
```
app/Infrastructure/Persistence/Eloquent/
  ├── Models/
  │   ├── Round.php (RoundEloquent)
  │   └── Race.php (RaceEloquent)
  └── Repositories/
      ├── EloquentRoundRepository.php
      └── EloquentRaceRepository.php
```

**Interface Layer** (HTTP)
```
app/Http/Controllers/User/
  ├── RoundController.php
  └── RaceController.php

routes/subdomain.php (app subdomain routes)
```

#### Database Schema

**rounds table**
- Foreign keys: `season_id`, `platform_track_id`, `created_by_user_id`
- Unique constraint: `slug` per `season_id`
- Indexes: `season_id`, `status`, `scheduled_at`

**races table**
- Foreign keys: `round_id`, `grid_source_race_id` (nullable)
- JSON columns: `points_system`, `bonus_points`
- Platform settings stored as strings/text
- Division support flag

### Frontend (Vue 3 + TypeScript)

#### Component Structure
```
resources/app/js/
  ├── components/round/
  │   ├── RoundsPanel.vue (main panel with accordion)
  │   ├── RoundAccordionItem.vue (single round in list)
  │   ├── RaceListItem.vue (race display in accordion)
  │   └── modals/
  │       ├── RoundFormDrawer.vue (create/edit round)
  │       └── RaceFormDrawer.vue (create/edit race)
  ├── services/
  │   ├── roundService.ts (API calls)
  │   ├── raceService.ts (API calls)
  │   ├── trackService.ts (API calls)
  │   └── raceSettingsService.ts (fetch platform configs)
  ├── stores/
  │   ├── roundStore.ts (Pinia)
  │   ├── raceStore.ts (Pinia)
  │   ├── trackStore.ts (Pinia)
  │   └── raceSettingsStore.ts (Pinia - caches platform configs)
  ├── composables/
  │   ├── useRoundValidation.ts
  │   ├── useRaceValidation.ts
  │   └── useTrackSearch.ts
  └── types/
      ├── round.ts
      ├── race.ts
      └── track.ts
```

#### State Management Flow
```
User Action → Component → Service (API) → Store (Pinia) → Component (reactive update)
```

---

## API Endpoints

### Round Endpoints
```
GET    /api/seasons/{seasonId}/rounds           - List rounds for season
POST   /api/seasons/{seasonId}/rounds           - Create new round
GET    /api/rounds/{roundId}                    - Get round details
PUT    /api/rounds/{roundId}                    - Update round
DELETE /api/rounds/{roundId}                    - Delete round
```

### Race Endpoints
```
GET    /api/rounds/{roundId}/races              - List races for round
POST   /api/rounds/{roundId}/races              - Create new race
GET    /api/races/{raceId}                      - Get race details
PUT    /api/races/{raceId}                      - Update race configuration
DELETE /api/races/{raceId}                      - Delete race
```

### Platform Settings Endpoint
```
GET    /api/platforms/{platformId}/race-settings - Get race setting options for platform
```

### Track Endpoints (May already exist)
```
GET    /api/tracks?platform_id={id}&search={query} - Search tracks filtered by platform
```

---

## Testing Strategy

### Backend Testing

**Unit Tests** (Domain Layer - No Database)
- Entity creation and reconstitution
- Business logic methods
- Value object validation
- Event recording
- Status transitions

**Feature Tests** (API Integration - With Database)
- API endpoint authentication
- Request validation
- CRUD operations
- Database persistence
- Error responses
- Authorization (league ownership)

**Coverage Targets**
- Domain layer: 90%+
- Application layer: 80%+
- Overall: 80%+

### Frontend Testing

**Unit Tests** (Stores/Composables)
- Store actions and getters
- API service mocking
- Validation logic
- Error handling

**Component Tests** (Vue components)
- Rendering with props
- User interactions
- Form validation
- Event emissions
- Loading/error states

**Coverage Targets**
- Stores: 85%+
- Components: 75%+
- Overall: 80%+

---

## Dependencies

### Backend
- ✅ Laravel 12 (framework)
- ✅ spatie/laravel-data (DTOs)
- ✅ Existing track database (`platform_tracks`, `platform_track_locations`)
- ✅ Existing season/division infrastructure

### Frontend
- ✅ Vue 3 (framework)
- ✅ PrimeVue 4 (UI components: DataTable, Calendar, AutoComplete, Accordion)
- ✅ Pinia 3 (state management)
- ✅ TypeScript (strict mode)
- ✅ Vitest (testing)
- ✅ date-fns (date formatting)

**No new dependencies required**

---

## Implementation Phases

### Phase 1: Backend Foundation (Round)
**Duration:** 2-3 days

1. Domain layer (Round entity, value objects, events, repository interface)
2. Application layer (RoundApplicationService, DTOs)
3. Infrastructure layer (RoundEloquent, EloquentRoundRepository, migration)
4. Interface layer (RoundController, routes)
5. Unit tests (domain)
6. Feature tests (API)

### Phase 2: Backend Race Configuration
**Duration:** 3-4 days

7. Race settings config files (GT7, ACC, iRacing, etc.)
8. Domain layer (Race entity, value objects, events, repository interface)
9. Application layer (RaceApplicationService, DTOs)
10. Infrastructure layer (RaceEloquent, EloquentRaceRepository, migration)
11. Interface layer (RaceController, platform settings endpoint, routes)
12. Unit tests (domain)
13. Feature tests (API)

### Phase 3: Frontend Foundation (Round)
**Duration:** 2-3 days

14. Type definitions (round.ts, track.ts)
15. API services (roundService.ts, trackService.ts)
16. Pinia stores (roundStore.ts, trackStore.ts)
17. Store tests
18. RoundsPanel component
19. RoundFormDrawer component
20. Validation composable
21. Integration with SeasonDetail.vue (add Rounds tab)

### Phase 4: Frontend Race Configuration
**Duration:** 3-4 days

22. Type definitions (race.ts)
23. API services (raceService.ts, raceSettingsService.ts)
24. Pinia stores (raceStore.ts, raceSettingsStore.ts)
25. Store tests
26. RaceFormDrawer component (complex form)
27. Validation composable
28. Accordion integration (expand/collapse rounds)
29. Component tests

### Phase 5: Polish & Testing
**Duration:** 1-2 days

30. Integration testing (full flow)
31. Error handling refinement
32. Loading states
33. Accessibility audit
34. Performance optimization
35. Documentation updates
36. Final QA pass

**Total Estimated Duration:** 11-16 days (2-3 weeks)

---

## Success Criteria

### Functional Requirements
✅ Users can create rounds with all required/optional fields
✅ Rounds appear in accordion on Season Detail page
✅ Users can expand rounds to view races
✅ Users can add races to rounds with full configuration
✅ Track selection filtered by platform works correctly
✅ Platform-specific race settings (GT7, etc.) load dynamically
✅ Slug auto-generation works and enforces uniqueness
✅ Division support flag controls race result structure
✅ Form validation prevents invalid data
✅ Users can edit/delete rounds and races

### Technical Requirements
✅ All backend tests pass (PHPUnit, PHPStan level 8, PHPCS PSR-12)
✅ All frontend tests pass (Vitest)
✅ Code coverage meets targets (80%+)
✅ DDD architecture followed correctly
✅ Vue 3 Composition API patterns followed
✅ TypeScript strict mode compliant
✅ Accessibility standards met (WCAG 2.1 AA)
✅ No console errors or warnings

### User Experience Requirements
✅ Intuitive workflow (create round → add races)
✅ Responsive UI (mobile/tablet/desktop)
✅ Clear error messages
✅ Loading states for async operations
✅ Success feedback (toasts)
✅ Keyboard navigation support
✅ Form auto-save or unsaved changes warning (optional)

---

## Risks & Mitigation

### Risk 1: Complex Race Configuration Form
**Impact:** High complexity, many fields, conditional logic
**Mitigation:**
- Break form into logical sections
- Use PrimeVue Accordion for section grouping
- Progressive disclosure (show fields based on selections)
- Comprehensive validation with clear error messages

### Risk 2: Platform Settings Scalability
**Impact:** Many platforms = many config files
**Mitigation:**
- Standardize config file structure
- Use inheritance for common settings
- Document config format clearly
- Create helper script to generate new platform configs

### Risk 3: Grid Source Complexity
**Impact:** Race can reference other races for grid determination
**Mitigation:**
- Backend validation prevents circular references
- Frontend dropdown only shows valid previous races in same round
- Clear UI labels explaining each grid source option

### Risk 4: Division Support Integration
**Impact:** Division flag affects race results structure (future feature)
**Mitigation:**
- Design database schema with division support from start
- Include division flag in race configuration now
- Document integration points for results feature

### Risk 5: Timezone Handling
**Impact:** Users in different timezones, league timezone inheritance
**Mitigation:**
- Store all dates as UTC in database
- Display dates in league timezone with clear label
- Use PrimeVue Calendar with timezone support
- Show timezone in form (e.g., "7:00 PM AEDT")

---

## Future Enhancements (Not in Scope)

- Round templates (save/reuse configurations)
- Bulk round creation (generate season calendar)
- Track recommendations based on season
- Drag-and-drop race reordering
- Race cloning/duplication
- Weather forecast integration (real-world data)
- Practice/qualifying session management
- Live timing integration
- Automated grid penalty application
- Reserve driver substitutions
- Split qualifying by division
- Round/race notes with rich text editor
- File attachments (setup sheets, track maps)
- Email notifications (round created, race starting soon)

---

## Questions/Clarifications Resolved

1. ✅ **Divisions**: Separate result sets per division (like race classes)
2. ✅ **Workflow**: Round and race creation are separate steps
3. ✅ **Track Database**: Admin-managed, filtered by platform
4. ✅ **Race Settings**: PHP config per platform + API endpoint
5. ✅ **Slugs**: Always auto-generated
6. ✅ **Scope**: Full round + race configuration (no results entry)
7. ✅ **Post-Creation**: Stay on list with toast

---

## Next Steps

1. ✅ Review this summary document
2. ⏭️ Review backend plan (`02_backend_plan.md`)
3. ⏭️ Review frontend plan (`03_frontend_plan.md`)
4. ⏭️ **User approval to proceed with implementation**
5. ⏭️ Start Phase 1: Backend Foundation (Round entity)

---

**Ready for Review** - Please confirm before proceeding to implementation!
