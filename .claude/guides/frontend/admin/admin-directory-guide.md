# Admin Dashboard Directory Guide

Overview of `resources/admin/` directory structure.

## Directory Structure

```
resources/admin/
├── css/
│   └── app.css              # Global styles, Tailwind imports
└── js/
    ├── app.ts               # Vue app entry point
    ├── sentry.ts            # Error tracking setup
    ├── router/              # Vue Router configuration
    ├── views/               # Page components (routes)
    ├── components/          # Reusable UI components
    ├── stores/              # Pinia state management
    ├── services/            # API communication layer
    ├── composables/         # Vue composition functions
    ├── types/               # TypeScript interfaces
    ├── utils/               # Helper functions
    ├── constants/           # Static values
    └── __tests__/           # Test setup and helpers
```

## Directory Details

### `views/`
Page-level components mapped to routes. Each view represents a full page.

| File | Purpose |
|------|---------|
| `DashboardView.vue` | Admin home/overview |
| `UsersView.vue` | User management |
| `AdminUsersView.vue` | Admin user management |
| `LeaguesView.vue` | League management |
| `DriversView.vue` | Driver management |
| `ContactsView.vue` | Contact submissions |
| `ActivityLogView.vue` | System activity logs |
| `SiteConfigView.vue` | Site configuration |
| `SettingsView.vue` | Admin settings |
| `NotificationsView.vue` | Notification management |
| `AdminLoginView.vue` | Admin authentication |

### `components/`
Reusable components organized by domain.

| Directory | Purpose |
|-----------|---------|
| `layout/` | App shell (sidebar, header, navigation) |
| `common/` | Shared components (buttons, inputs, cards) |
| `modals/` | Modal dialogs |
| `User/` | User-related components + modals |
| `AdminUser/` | Admin user components + modals |
| `League/` | League management components |
| `SiteConfig/` | Site config components, file uploads |
| `ActivityLog/` | Activity log display components |
| `dashboard/` | Dashboard widgets |
| `drivers/` | Driver management components |
| `contacts/` | Contact form components |
| `notifications/` | Notification components |

### `stores/`
Pinia stores for state management.

| Store | Purpose |
|-------|---------|
| `adminStore.ts` | Current admin user, auth state |
| `userStore.ts` | User list, CRUD operations |
| `driverStore.ts` | Driver management state |
| `leagueStore.ts` | League data |
| `siteConfigStore.ts` | Site configuration state |
| `layoutStore.ts` | Sidebar state, UI preferences |

### `services/`
API service layer. Each service handles HTTP requests for a domain.

| Service | Purpose |
|---------|---------|
| `api.ts` | Axios instance, interceptors |
| `authService.ts` | Login, logout, session |
| `userService.ts` | User CRUD endpoints |
| `adminUserService.ts` | Admin user endpoints |
| `leagueService.ts` | League endpoints |
| `driverService.ts` | Driver endpoints |
| `siteConfigService.ts` | Site config endpoints |
| `activityLogService.ts` | Activity log endpoints |
| `contactService.ts` | Contact form endpoints |
| `notificationService.ts` | Notification endpoints |
| `queueService.ts` | Background job status |
| `platformCarService.ts` | Platform car data |

### `composables/`
Reusable Vue composition functions.

| Composable | Purpose |
|------------|---------|
| `useModal.ts` | Modal open/close state |
| `useAsyncAction.ts` | Loading/error state for async ops |
| `useErrorToast.ts` | Toast notifications |
| `useDateFormatter.ts` | Date formatting utilities |
| `useNameHelpers.ts` | Name display formatting |
| `useRoleHelpers.ts` | Role display/badge helpers |
| `useStatusHelpers.ts` | Status badge helpers |
| `useSiteConfig.ts` | Site config access |
| `useAdminUserModals.ts` | Admin user modal state |
| `useRequestCancellation.ts` | Abort controller management |

### `types/`
TypeScript interfaces and type definitions.

| File | Purpose |
|------|---------|
| `admin.ts` | Admin user types |
| `user.ts` | User types |
| `league.ts` | League types |
| `driver.ts` | Driver types |
| `api.ts` | API response types |
| `errors.ts` | Error types |
| `activityLog.ts` | Activity log types |
| `siteConfig.ts` | Site config types |
| `contact.ts` | Contact form types |
| `notification.ts` | Notification types |
| `media.ts` | File upload types |
| `primevue.ts` | PrimeVue type extensions |

### `utils/`
Pure helper functions.

| File | Purpose |
|------|---------|
| `errorHandler.ts` | Global error handling |
| `errorMessages.ts` | User-friendly error messages |
| `logger.ts` | Console logging wrapper |
| `pagination.ts` | Pagination helpers |
| `url.ts` | URL manipulation |
| `validation.ts` | Form validation helpers |

### `constants/`
Static configuration values.

| File | Purpose |
|------|---------|
| `messages.ts` | UI text constants |
| `pagination.ts` | Default page sizes |
| `platforms.ts` | Platform definitions |
| `externalLinks.ts` | External URLs |

## Import Aliases

Use `@admin/` alias for imports:

```ts
import { useAdminStore } from '@admin/stores/adminStore';
import { UserService } from '@admin/services/userService';
import type { User } from '@admin/types/user';
```

## Testing

Tests are colocated with source files using `.test.ts` suffix. Test setup and helpers are in `__tests__/`.
