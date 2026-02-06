# Public Site Directory Guide

The public site (`resources/public/`) serves the marketing pages and authentication flows at `virtualracingleagues.localhost`.

## Directory Structure

```
resources/public/
├── css/
│   ├── app.css                 # Main stylesheet (Tailwind imports, global styles)
│   └── components/             # Component-specific CSS
│       ├── buttons.css         # Button styles
│       ├── landing.css         # Landing page styles
│       ├── _navigation.css     # Navigation styles
│       └── tables.css          # Table styles
└── js/
    ├── app.ts                  # Vue app entry point
    ├── sentry.ts               # Sentry error tracking setup
    ├── components/             # Vue components
    ├── composables/            # Vue composables (reusable logic)
    ├── constants/              # Constants (API endpoints)
    ├── router/                 # Vue Router configuration
    ├── services/               # API services
    ├── stores/                 # Pinia stores
    ├── types/                  # TypeScript type definitions
    ├── utils/                  # Utility functions
    └── views/                  # Page-level Vue components
```

## Key Directories

### `js/components/`

| Directory | Purpose |
|-----------|---------|
| `common/` | Reusable VRL-prefixed UI components (buttons, forms, modals, tables, etc.) |
| `landing/` | Landing page components (hero, features, pricing, CTA sections) |
| `layout/` | Layout components (`PublicHeader`, `PublicFooter`) |
| `leagues/` | League display components (cards, standings tables, rounds) |
| `contact/` | Contact form modal |
| `maintenance/` | Maintenance mode components |

### `js/components/common/` (VRL Component Library)

Reusable components prefixed with `Vrl`:
- `accordions/` - Expandable content sections
- `alerts/` - Alert messages
- `badges/` - Status badges
- `buttons/` - Button variants (`VrlButton`, `VrlIconButton`, `VrlCloseButton`)
- `cards/` - Card containers and variants
- `drawers/` - Slide-out panels
- `forms/` - Form inputs (`VrlInput`, `VrlSelect`, `VrlCheckbox`, etc.)
- `indicators/` - Status and position indicators
- `lists/` - List containers and rows
- `loading/` - Spinners and skeletons
- `modals/` - Modal dialogs
- `navigation/` - Tabs, breadcrumbs, nav links
- `panels/` - Panel containers
- `tables/` - Data tables with pagination
- `tags/` - Tag components

### `js/views/`

| Directory | Purpose |
|-----------|---------|
| `auth/` | Authentication views (Login, Register, ForgotPassword, ResetPassword) |
| `leagues/` | League browsing views (LeaguesView, LeagueDetailView, SeasonDetailView) |
| Root | `HomeView.vue` - Landing page |

### `js/services/`

| File | Purpose |
|------|---------|
| `api.ts` | Base Axios instance with CSRF handling |
| `authService.ts` | Login, register, password reset API calls |
| `leagueService.ts` | League and season data fetching |
| `contactService.ts` | Contact form submission |
| `configService.ts` | Site configuration fetching |

### `js/composables/`

| File | Purpose |
|------|---------|
| `useModal.ts` | Modal open/close state management |
| `useToast.ts` | Toast notification handling |
| `useLoadingState.ts` | Loading state management |
| `usePasswordValidation.ts` | Password strength validation |
| `usePageTitle.ts` | Dynamic page title management |
| `useTimeFormat.ts` | Date/time formatting |
| `useSiteConfig.ts` | Site configuration access |
| `useGtm.ts` | Google Tag Manager integration |
| `useContactForm.ts` | Contact form logic |

### `js/stores/`

| File | Purpose |
|------|---------|
| `authStore.ts` | Authentication state (user, login status, tokens) |

### `js/types/`

TypeScript interfaces for auth, user, config, navigation, components, errors, and media.

## Import Alias

Use `@public/` for imports:
```typescript
import { useModal } from '@public/composables/useModal';
import VrlButton from '@public/components/common/buttons/VrlButton.vue';
```

## Testing

Tests are co-located with source files (`.test.ts` suffix). Run with:
```bash
npm run test:public
```
