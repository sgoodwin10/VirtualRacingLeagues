# App Dashboard Directory Guide

**Path**: `resources/app/` (alias: `@app`)
**Subdomain**: `app.virtualracingleagues.localhost`
**Purpose**: Authenticated user dashboard for league management

## Directory Structure

```
resources/app/
├── css/
│   ├── app.css              # Main stylesheet
│   └── components/          # Component-specific styles
└── js/
    ├── app.ts               # Vue app entry point
    ├── sentry.ts            # Sentry error tracking setup
    ├── router/              # Vue Router configuration
    ├── views/               # Page-level components
    ├── components/          # Reusable UI components
    ├── composables/         # Vue composition functions
    ├── services/            # API service layer
    ├── stores/              # Pinia state management
    ├── types/               # TypeScript type definitions
    ├── constants/           # App constants/enums
    ├── utils/               # Utility functions
    └── __tests__/           # Global test utilities
```

## Key Directories

### `views/`
Page components mapped to routes. Contains league, season, and driver detail views.

### `components/`
Organized by domain and purpose:
- `common/` - Shared UI: buttons, cards, forms, inputs, modals, tables
- `layout/` - App shell, navigation, sidebar
- `league/` - League-specific components and modals
- `season/` - Season management: divisions, teams, panels
- `driver/` - Driver profiles and modals
- `competition/`, `round/`, `result/` - Race management
- `activity/` - Activity log display
- `profile/` - User profile components

### `composables/`
Reusable logic hooks (60+ composables):
- Data fetching: `useAsyncData`, `useCrudStore`
- Forms: `useFormValidation`, `useFormState`
- UI: `useConfirmDialog`, `useToast`, `useBreadcrumbs`
- Domain: `useLeague`, `useSeason`, `useDriver`
- Utilities: `useDateFormatter`, `useCSVParser`, `useCsvExport`

### `services/`
API communication layer. Each domain has a dedicated service:
- `api.ts` - Base Axios instance
- `leagueService.ts`, `seasonService.ts`, `driverService.ts`, etc.

### `stores/`
Pinia stores for state management:
- `userStore.ts` - Current user state
- `leagueStore.ts`, `seasonStore.ts`, `driverStore.ts`, etc.
- `siteConfigStore.ts` - Site configuration
- `navigationStore.ts` - Navigation state

### `types/`
TypeScript interfaces and types for all domain entities.

## Import Alias

Use `@app/` for imports:
```typescript
import LeagueCard from '@app/components/league/LeagueCard.vue';
import { useLeague } from '@app/composables/useLeague';
import { leagueService } from '@app/services/leagueService';
```

## Testing

Tests are co-located with source files (`.test.ts` suffix).
```bash
npm run test:app    # Run app tests only
```
