# Team Championship Calculations - Frontend Implementation Plan

## Overview

This document addresses the frontend requirements for the Team Championship Calculations feature.

---

## Current Feature Scope

### No Frontend Work Required

As stated in the original plan:

> **Important**: This is only performing the calculation. We will plan how to display this in a future feature build.

The current feature is **backend-only**. It focuses on:
1. Calculating team championship standings when a round completes
2. Storing the results in the database

---

## Future Frontend Work (Out of Scope)

When the display feature is implemented in the future, it will likely involve:

### Admin Dashboard (`dev-fe-admin`)

1. **Round Details View**
   - Display team championship standings after round completion
   - Show team name, total points, and contributing drivers
   - Visual representation of standings

2. **Season Overview**
   - Cumulative team championship standings
   - Team performance trends across rounds

3. **Season Configuration**
   - UI for `team_championship_enabled` toggle (may already exist)
   - UI for `teams_drivers_for_calculation` setting (may already exist)

### App Dashboard (`dev-fe-app`)

1. **User-Facing Team Standings**
   - Read-only view of team championship results
   - Current round team standings
   - Season-long team standings

### Public Site (`dev-fe-public`)

1. **Public Team Standings**
   - Display team championship for public viewing
   - Integration with season overview pages

---

## Data Structure for Future Reference

When the frontend is implemented, it will consume this JSON structure from the API:

```json
{
    "standings": [
        {
            "team_id": 1,
            "total_points": 45,
            "race_result_ids": [45, 67, 68, 97]
        },
        {
            "team_id": 3,
            "total_points": 32,
            "race_result_ids": [54, 56, 76, 77]
        }
    ]
}
```

### Additional Data Needed for Display

The frontend will need to fetch or join:
- `team.name` - Team display name
- `team.logo_url` - Team logo
- Driver names for each `race_result_id` (to show "Top 4 drivers: Driver A, B, C, D")

---

## API Endpoints (Future)

These endpoints will be needed for the display feature:

### Admin API

```
GET /admin/api/rounds/{roundId}/team-championship
GET /admin/api/seasons/{seasonId}/team-championship-standings
```

### User API

```
GET /api/rounds/{roundId}/team-championship
GET /api/seasons/{seasonId}/team-championship-standings
```

### Public API

```
GET /api/public/seasons/{seasonId}/team-championship-standings
```

---

## Agents for Future Feature

When the display feature is planned:

| Task | Agent |
|------|-------|
| Admin dashboard display | `dev-fe-admin` |
| App dashboard display | `dev-fe-app` |
| Public site display | `dev-fe-public` |
| API endpoints | `dev-be` |

---

## Summary

**For this feature (calculations)**: No frontend work required.

**For future feature (display)**: Will require work across all three frontend applications and corresponding API endpoints.
