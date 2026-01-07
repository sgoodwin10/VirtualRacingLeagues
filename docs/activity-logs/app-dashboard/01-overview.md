# Activity Logs for App Dashboard - Overview

## Feature Summary

Add comprehensive activity logging to the User/App dashboard to track all user actions within their leagues. This feature will record who did what, when, and on which resource - providing a complete audit trail of league management activities.

## Scope

**In Scope:**
- Track activities performed within the User/App dashboard only
- Activities scoped per-league (viewable within each league's settings)
- Use a dedicated log name: `league`
- UI placement: Activity Log tab within League Settings page

**Out of Scope:**
- Global activity feed across leagues
- Admin dashboard activities (already exists separately)
- Public site activities

## Architecture Decisions

### Log Name
Use `league` as the log name to distinguish from:
- `user` - Account-level activities (profile updates, password changes)
- `admin` - Admin dashboard activities

### Activity Scope
Activities will be filtered by `league_id` stored in the activity `properties` field. Each activity will include the league context.

### UI Location
Activity log will be displayed in the League Settings page as a dedicated tab/section.

## Activities to Track

### 1. Leagues
| Action | Description Format |
|--------|---------------------|
| Create | Created league: [League Name] |
| Update | Updated league: [League Name] |

### 2. League Drivers
| Action | Description Format |
|--------|---------------------|
| Add | Added driver to league: [Driver Name] |
| Update | Updated league driver: [Driver Name] |
| Delete | Removed driver from league: [Driver Name] |
| Import | Imported drivers to league (count: X) |

### 3. Competitions
| Action | Description Format |
|--------|---------------------|
| Create | Created competition: [Competition Name] |
| Update | Updated competition: [Competition Name] |
| Delete | Deleted competition: [Competition Name] |

### 4. Seasons
| Action | Description Format |
|--------|---------------------|
| Create | Created season: [Competition Name] - [Season Name] |
| Update | Updated season: [Competition Name] - [Season Name] |
| Delete | Deleted season: [Competition Name] - [Season Name] |
| Complete | Completed season: [Competition Name] - [Season Name] |
| Archive | Archived season: [Competition Name] - [Season Name] |

### 5. Rounds
| Action | Description Format |
|--------|---------------------|
| Create | Created round: [Competition] - [Season]: [Round Name] |
| Update | Updated round: [Competition] - [Season]: [Round Name] |
| Delete | Deleted round: [Competition] - [Season]: [Round Name] |
| Complete | Completed round: [Competition] - [Season]: [Round Name] |

### 6. Races/Qualifiers
| Action | Description Format |
|--------|---------------------|
| Add Race | Added race: [Competition] - [Season]: [Round] Race [#] |
| Add Qualifier | Added qualifier: [Competition] - [Season]: [Round] Qualifier |
| Update | Updated race/qualifier: [Competition] - [Season]: [Round] [Type #] |
| Delete | Deleted race/qualifier: [Competition] - [Season]: [Round] [Type #] |
| Complete | Completed race/qualifier: [Competition] - [Season]: [Round] [Type #] |
| Enter Qualifier Results | Entered qualifier results: [Competition] - [Season]: [Round] |
| Enter Race Results | Entered race results: [Competition] - [Season]: [Round] Race [#] |

### 7. Divisions
| Action | Description Format |
|--------|---------------------|
| Create | Created division: [Competition] - [Season]: [Division Name] |
| Update | Updated division: [Competition] - [Season]: [Division Name] |
| Delete | Deleted division: [Competition] - [Season]: [Division Name] |
| Reorder | Reordered divisions: [Competition] - [Season] |
| Add Driver | Added driver to division: [Competition] - [Season]: [Division] - [Driver Name] |
| Remove Driver | Removed driver from division: [Competition] - [Season]: [Driver Name] |

### 8. Teams
| Action | Description Format |
|--------|---------------------|
| Create | Created team: [Competition] - [Season]: [Team Name] |
| Update | Updated team: [Competition] - [Season]: [Team Name] |
| Delete | Deleted team: [Competition] - [Season]: [Team Name] |
| Add Driver | Added driver to team: [Competition] - [Season]: [Team Name] - [Driver Name] |
| Remove Driver | Removed driver from team: [Competition] - [Season]: [Driver Name] |

### 9. Season Drivers
| Action | Description Format |
|--------|---------------------|
| Add | Added driver to season: [Competition] - [Season]: [Driver Name] |
| Remove | Removed driver from season: [Competition] - [Season]: [Driver Name] |

## Activity Properties Schema

Each activity will store the following properties:

```json
{
  "league_id": 1,
  "league_name": "F1 Racing League",
  "action": "create|update|delete|complete|archive|...",
  "entity_type": "league|driver|competition|season|round|race|division|team|season_driver",
  "entity_id": 123,
  "entity_name": "Displayed Name",
  "context": {
    "competition_id": 1,
    "competition_name": "F1 2024",
    "season_id": 5,
    "season_name": "Season 1",
    "round_id": 10,
    "round_name": "Monaco GP"
  },
  "changes": {
    "old": { "name": "Old Name" },
    "new": { "name": "New Name" }
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

## Technical Components

### Backend (Laravel/PHP)
1. **LeagueActivityLogService** - Dedicated service for league activity logging
2. **Controller Updates** - Add logging to all 14 user controllers
3. **API Endpoints** - New endpoints for fetching league activities
4. **DTOs** - Activity data transfer objects

### Frontend (Vue 3/TypeScript)
1. **Activity Log Types** - TypeScript interfaces
2. **Activity Log Service** - API service for fetching activities
3. **Activity Log Component** - UI component for displaying activities
4. **League Settings Integration** - Add activity tab to settings

## File Structure

### Backend Files to Create/Modify
```
app/
├── Application/
│   └── Activity/
│       ├── Services/
│       │   └── LeagueActivityLogService.php
│       └── DTOs/
│           └── LeagueActivityData.php
├── Http/
│   └── Controllers/
│       └── User/
│           ├── LeagueActivityLogController.php  (new)
│           ├── LeagueController.php  (modify)
│           ├── DriverController.php  (modify)
│           ├── CompetitionController.php  (modify)
│           ├── SeasonController.php  (modify)
│           ├── RoundController.php  (modify)
│           ├── RaceController.php  (modify)
│           ├── QualifierController.php  (modify)
│           ├── DivisionController.php  (modify)
│           ├── TeamController.php  (modify)
│           └── SeasonDriverController.php  (modify)
routes/
└── subdomain.php  (modify - add activity log routes)
```

### Frontend Files to Create
```
resources/app/js/
├── types/
│   └── activityLog.ts
├── services/
│   └── activityLogService.ts
├── components/
│   └── activity/
│       ├── ActivityLog.vue
│       ├── ActivityItem.vue
│       └── ActivityFilters.vue
└── views/
    └── league/
        └── settings/
            └── ActivityTab.vue  (or integrate into existing settings)
```

## Agents for Implementation

| Phase | Agent | Description |
|-------|-------|-------------|
| 1 | `dev-be` | Backend implementation - service, DTOs, API endpoints |
| 2 | `dev-be` | Controller modifications - add logging to all user controllers |
| 3 | `dev-fe-app` | Frontend implementation - types, services, components |

## Success Criteria

1. All listed activities are tracked when performed
2. Activities are scoped to the specific league
3. Activity log is viewable in League Settings
4. Activities show: who, what, when, and relevant context
5. Performance: Activity logging doesn't slow down main operations
6. Filtering: Activities can be filtered by date, action type, entity type
