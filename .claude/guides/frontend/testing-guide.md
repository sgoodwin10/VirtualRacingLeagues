# Frontend Testing Guide

This guide covers testing practices for all three Vue.js dashboards in this multi-application Laravel + Vue project.

**Agent Reference:**
- **App Dashboard** (`resources/app/js`) → Use `dev-fe-app` agent
- **Public Dashboard** (`resources/public/js`) → Use `dev-fe-public` agent
- **Admin Dashboard** (`resources/admin/js`) → Use `dev-fe-admin` agent

---

## Table of Contents

1. [Testing Stack](#testing-stack)
2. [Configuration](#configuration)
3. [Running Tests](#running-tests)
4. [Test Organization](#test-organization)
5. [Testing Patterns](#testing-patterns)
   - [Component Testing](#component-testing)
   - [Pinia Store Testing](#pinia-store-testing)
   - [Composable Testing](#composable-testing)
   - [Service Testing](#service-testing)
   - [View/Page Testing](#viewpage-testing)
6. [Mocking](#mocking)
   - [API Mocking with MSW](#api-mocking-with-msw)
   - [Service Mocking](#service-mocking)
   - [PrimeVue Component Stubs](#primevue-component-stubs)
   - [Browser API Mocks](#browser-api-mocks)
7. [Test Utilities](#test-utilities)
8. [Mock Data Factories](#mock-data-factories)
9. [Dashboard-Specific Details](#dashboard-specific-details)

---

## Testing Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.0.1 | Unit testing framework |
| `@vue/test-utils` | ^2.4.6 | Vue component testing utilities |
| `@vitest/ui` | ^4.0.1 | Interactive test UI dashboard |
| `@vitest/coverage-v8` | ^4.0.14 | Code coverage reporting |
| `happy-dom` | ^20.0.7 | Lightweight DOM implementation |
| `msw` | ^2.11.6 | Mock Service Worker for HTTP interception |
| `@faker-js/faker` | ^10.1.0 | Mock data generation |
| `@playwright/test` | ^1.56.0 | End-to-end testing |

---

## Configuration

### Main Config (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,                    // describe, it, expect available globally
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    css: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
```

### Global Setup (`tests/setup.ts`)

The setup file configures:

- **MSW server** for API mocking
- **Browser API mocks**: `matchMedia`, `IntersectionObserver`, `ResizeObserver`, `scrollTo`
- **Storage mocks**: `localStorage`, `sessionStorage`
- **Vue Test Utils** global configuration with Teleport stub

### Path Aliases

```typescript
'@public' → 'resources/public/js'
'@app'    → 'resources/app/js'
'@admin'  → 'resources/admin/js'
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests by dashboard
npm run test:app           # App dashboard only
npm run test:public        # Public dashboard only
npm run test:admin         # Admin dashboard only

# Interactive UI mode
npm run test:ui

# With coverage report
npm run test:coverage

# Watch mode
npm test -- --watch

# Run specific file
npm test resources/admin/js/stores/__tests__/adminStore.spec.ts

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:public
npm run test:e2e:admin
```

---

## Test Organization

### Directory Structure

Tests are **colocated** with source files (test files alongside the code they test):

```
resources/[app|public|admin]/js/
├── components/
│   └── common/
│       ├── Button.vue
│       └── Button.test.ts          # Test file next to component
├── composables/
│   ├── useToast.ts
│   └── useToast.test.ts
├── stores/
│   ├── userStore.ts
│   └── userStore.test.ts
├── services/
│   ├── authService.ts
│   └── authService.test.ts
└── __tests__/                      # Dashboard-level test utilities (app/admin only)
    └── setup/
        ├── index.ts                # Central export
        ├── testUtils.ts            # Helper functions
        └── primevueStubs.ts        # Component stubs
```

### File Naming Conventions

- **`.test.ts`** - Standard convention (used across all dashboards)

Tests are colocated alongside source files (not in `__tests__/` subdirectories).

---

## Testing Patterns

### Component Testing

**Basic component test:**

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyButton from '../MyButton.vue';

describe('MyButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(MyButton, {
      slots: { default: 'Click Me' },
    });

    expect(wrapper.text()).toBe('Click Me');
    expect(wrapper.element.tagName).toBe('BUTTON');
  });

  it('applies variant classes', () => {
    const wrapper = mount(MyButton, {
      props: { variant: 'primary' },
    });

    expect(wrapper.classes()).toContain('bg-primary');
  });

  it('emits click event', async () => {
    const wrapper = mount(MyButton);

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('is disabled when loading', () => {
    const wrapper = mount(MyButton, {
      props: { loading: true },
    });

    expect(wrapper.attributes('disabled')).toBeDefined();
  });
});
```

**Component with plugins (Router, Pinia, PrimeVue):**

```typescript
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import MyComponent from '../MyComponent.vue';

describe('MyComponent', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
  });

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      global: {
        plugins: [router, createPinia(), PrimeVue],
        stubs: {
          'router-link': true,
          Teleport: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
```

**Using `mountWithStubs` helper (app/admin dashboards):**

```typescript
import { mountWithStubs } from '@app/__tests__/setup';
import MyComponent from '../MyComponent.vue';

describe('MyComponent', () => {
  it('renders with PrimeVue stubs', () => {
    const wrapper = mountWithStubs(MyComponent, {
      props: { title: 'Test' },
    });

    expect(wrapper.text()).toContain('Test');
  });
});
```

### Pinia Store Testing

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@app/stores/userStore';
import { authService } from '@app/services/authService';

// Mock the service
vi.mock('@app/services/authService');

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());  // Fresh store per test
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const store = useUserStore();

    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('sets user on successful login', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@example.com' };
    vi.mocked(authService.login).mockResolvedValue(mockUser);

    const store = useUserStore();
    await store.login({ email: 'john@example.com', password: 'password' });

    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
    expect(authService.login).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'password',
    });
  });

  it('clears user on logout', async () => {
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    const store = useUserStore();
    store.$patch({ user: { id: 1, name: 'John' } });

    await store.logout();

    expect(store.user).toBeNull();
  });

  it('handles login error', async () => {
    const error = new Error('Invalid credentials');
    vi.mocked(authService.login).mockRejectedValue(error);

    const store = useUserStore();

    await expect(store.login({ email: 'bad@example.com', password: 'wrong' }))
      .rejects.toThrow('Invalid credentials');

    expect(store.user).toBeNull();
  });
});
```

### Composable Testing

**Simple composable:**

```typescript
import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useImageUrl } from '../useImageUrl';

describe('useImageUrl', () => {
  it('returns empty string for null URLs', () => {
    const imageUrl = ref<string | null>(null);
    const { url } = useImageUrl(imageUrl);

    expect(url.value).toBe('');
  });

  it('normalizes relative URLs', () => {
    const imageUrl = ref('/storage/image.jpg');
    const { url } = useImageUrl(imageUrl);

    expect(url.value).toContain('/storage/image.jpg');
  });

  it('reacts to ref changes', () => {
    const imageUrl = ref('/storage/image1.jpg');
    const { url } = useImageUrl(imageUrl);

    expect(url.value).toContain('image1.jpg');

    imageUrl.value = '/storage/image2.jpg';
    expect(url.value).toContain('image2.jpg');
  });
});
```

**Composable with external dependencies:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToast } from '../useToast';
import { useToast as usePrimeToast } from 'primevue/usetoast';

vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(),
}));

describe('useToast', () => {
  const mockAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePrimeToast).mockReturnValue({
      add: mockAdd,
      remove: vi.fn(),
      removeGroup: vi.fn(),
      removeAllGroups: vi.fn(),
    });
  });

  it('shows success toast', () => {
    const toast = useToast();
    toast.success('Operation successful');

    expect(mockAdd).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Success',
      detail: 'Operation successful',
      life: 5000,
    });
  });

  it('shows error toast', () => {
    const toast = useToast();
    toast.error('Something went wrong');

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Something went wrong',
      })
    );
  });
});
```

**Composable requiring Vue context (use helper function):**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createApp } from 'vue';
import { usePublicLeagues } from '../usePublicLeagues';

// Helper to mount composable in Vue context
function withSetup<T>(composable: () => T): T {
  let result: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  app.mount(document.createElement('div'));
  return result!;
}

// Mock dependencies
vi.mock('@public/services/publicApi');
vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useRoute: () => ({ query: {} }),
}));

describe('usePublicLeagues', () => {
  it('initializes with empty state', () => {
    const { leagues, isLoading } = withSetup(usePublicLeagues);

    expect(leagues.value).toEqual([]);
    expect(isLoading.value).toBe(false);
  });
});
```

### Service Testing

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../authService';
import { apiClient, apiService } from '../api';
import { AxiosError } from 'axios';

vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  apiService: {
    fetchCSRFToken: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('fetches CSRF token and logs in user', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(apiService.fetchCSRFToken).toHaveBeenCalledOnce();
      expect(apiClient.post).toHaveBeenCalledWith('/login', expect.any(Object));
      expect(result).toEqual(mockUser);
    });

    it('throws on invalid credentials', async () => {
      const error = new AxiosError('Unauthorized', '401', undefined, {}, {
        status: 401,
        statusText: 'Unauthorized',
        data: { message: 'Invalid credentials' },
        headers: {},
        config: {} as any,
      });
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.login({
        email: 'bad@example.com',
        password: 'wrong',
      })).rejects.toThrow();
    });
  });

  describe('checkAuth', () => {
    it('returns user when authenticated', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.checkAuth();
      expect(result).toEqual(mockUser);
    });

    it('returns null for 401 response', async () => {
      const error = new AxiosError('Unauthorized', '401', undefined, {}, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config: {} as any,
      });
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const result = await authService.checkAuth();
      expect(result).toBeNull();
    });
  });
});
```

### View/Page Testing

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import LoginView from '../LoginView.vue';
import { useAuthStore } from '@public/stores/authStore';

const mockPush = vi.fn();

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRouter: () => ({ push: mockPush }),
  };
});

describe('LoginView', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: LoginView },
    ],
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
  });

  const createWrapper = () => {
    return mount(LoginView, {
      global: {
        plugins: [router, createPinia(), PrimeVue],
        stubs: {
          'router-link': {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    });
  };

  it('renders login form', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it('shows validation error for empty email', async () => {
    const wrapper = createWrapper();

    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('Email is required');
  });

  it('calls login on valid submission', async () => {
    const wrapper = createWrapper();
    const authStore = useAuthStore();
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue(undefined);

    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');

    await flushPromises();

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      remember: false,
    });
  });

  it('shows error message on login failure', async () => {
    const wrapper = createWrapper();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'login').mockRejectedValue(new Error('Invalid credentials'));

    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('wrong');
    await wrapper.find('form').trigger('submit.prevent');

    await flushPromises();

    expect(wrapper.text()).toContain('Invalid credentials');
  });
});
```

---

## Mocking

### API Mocking with MSW

MSW intercepts HTTP requests at the network level. Handlers are defined in `tests/mocks/handlers.ts`:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

// API base URLs for different subdomains
const API_BASE = 'http://virtualracingleagues.localhost/api';
const USER_API_BASE = 'http://app.virtualracingleagues.localhost/api';
const ADMIN_API_BASE = 'http://admin.virtualracingleagues.localhost/admin/api';

export const handlers = [
  // Public API (authentication)
  http.post(`${API_BASE}/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'user@example.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: { user: { id: 1, email: body.email } },
      });
    }

    return HttpResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 },
    );
  }),

  // User Dashboard API
  http.get(`${USER_API_BASE}/user`, () => {
    return HttpResponse.json({
      success: true,
      data: { id: 1, name: 'Test User', email: 'user@example.com' },
    });
  }),

  // Admin API
  http.get(`${ADMIN_API_BASE}/users`, () => {
    return HttpResponse.json({
      success: true,
      data: [{ id: 1, name: 'Admin User' }],
    });
  }),
];
```

**Override handlers in specific tests:**

```typescript
import { server } from '@/../tests/mocks/server';
import { http, HttpResponse } from 'msw';

it('handles login error', async () => {
  server.use(
    http.post('*/api/login', () => {
      return HttpResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    })
  );

  // Test error handling...
});
```

### Service Mocking

```typescript
import { vi } from 'vitest';
import { authService } from '@app/services/authService';

// Mock entire module
vi.mock('@app/services/authService');

// Configure mock behavior
vi.mocked(authService.login).mockResolvedValue({ id: 1, name: 'Test' });
vi.mocked(authService.login).mockRejectedValue(new Error('Failed'));

// Verify calls
expect(authService.login).toHaveBeenCalledWith({ email: 'test@example.com' });
expect(authService.login).toHaveBeenCalledTimes(1);
```

### PrimeVue Component Stubs

The `primevueStubs.ts` file provides stub implementations for PrimeVue components:

```typescript
// Import stubs
import { primevueStubs } from '@app/__tests__/setup';

// Use in test
const wrapper = mount(MyComponent, {
  global: {
    stubs: primevueStubs,
  },
});

// Or use mountWithStubs helper
import { mountWithStubs } from '@app/__tests__/setup';
const wrapper = mountWithStubs(MyComponent);
```

**Available stubs include:**
- **Form**: InputText, Password, Checkbox, Select, MultiSelect, Editor, FileUpload
- **Display**: Button, Card, Message, Tag, Chip, DataView, Skeleton
- **Navigation**: Menubar, Menu, Toast, ConfirmDialog
- **Modals**: Dialog, Drawer
- **Data**: DataTable, Column

### Browser API Mocks

**Already configured in `tests/setup.ts`:**

```typescript
// window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

// IntersectionObserver (for lazy loading)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// localStorage with working implementation
const localStorageData: Record<string, string> = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key) => localStorageData[key] ?? null),
    setItem: vi.fn((key, value) => { localStorageData[key] = value; }),
    removeItem: vi.fn((key) => { delete localStorageData[key]; }),
    clear: vi.fn(() => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }),
  },
});
```

**Custom mocks in tests:**

```typescript
// Mock URL API
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { origin: 'http://app.virtualracingleagues.localhost' },
  writable: true,
});

// Mock matchMedia for specific breakpoint
vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
  matches: query === '(min-width: 768px)',
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));
```

---

## Test Utilities

### Common Utilities (`testUtils.ts`)

Located in `resources/[app|admin]/js/__tests__/setup/testUtils.ts`:

```typescript
// Mount with all stubs configured (includes PrimeVue plugins automatically)
export function mountWithStubs<T extends ComponentPublicInstance>(
  component: Component,
  options: MountingOptions<any> = {},
): VueWrapper<T> {
  // Automatically includes:
  // - PrimeVue stubs
  // - PrimeVue, ToastService, ConfirmationService plugins
  // - Pinia (if not provided)
  // - Router (if not provided)
  // - Teleport stub
  // - Directive stubs (tooltip)
  return mount(component, {
    global: {
      plugins: [createTestPinia(), createTestRouter(), PrimeVue, ToastService],
      stubs: { ...primevueStubs, Teleport: true },
      directives: { tooltip: { mounted: () => {}, updated: () => {}, unmounted: () => {} } },
      ...options.global,
    },
    ...options,
  }) as VueWrapper<T>;
}

// Create isolated Pinia instance
export function createTestPinia() {
  return createPinia();
}

// Create memory-based router with default routes
export function createTestRouter(routes: RouteRecordRaw[] = []) {
  return createRouter({
    history: createMemoryHistory(),
    routes: routes.length ? routes : [
      { path: '/', name: 'home', component: { template: '<div />' } },
      // Dashboard-specific default routes included
    ],
  });
}

// Wait for Vue updates and promises
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// Wait for condition with timeout (default 1000ms)
export async function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 50,
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout exceeded');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// Create mock API response
export function createMockApiResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  };
}

// Create mock API error
export function createMockApiError(message: string, status = 500) {
  const error = new Error(message) as any;
  error.response = {
    data: { message },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  };
  return error;
}

// Find component by name in wrapper
export function findComponentByName<T extends ComponentPublicInstance>(
  wrapper: VueWrapper<any>,
  name: string,
): VueWrapper<T> | undefined {
  return wrapper.findComponent({ name }) as VueWrapper<T> | undefined;
}

// Find all components by name
export function findAllComponentsByName<T extends ComponentPublicInstance>(
  wrapper: VueWrapper<any>,
  name: string,
): VueWrapper<T>[] {
  return wrapper.findAllComponents({ name }) as VueWrapper<T>[];
}

// Trigger native DOM event
export async function triggerNativeEvent(
  element: Element,
  eventType: string,
  eventData: any = {},
): Promise<void> {
  const event = new Event(eventType, { bubbles: true, cancelable: true });
  Object.assign(event, eventData);
  element.dispatchEvent(event);
  await flushPromises();
}

// Mock console methods for tests
export function mockConsole() {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };
}

// Restore console methods after tests
export function restoreConsole(mocks: ReturnType<typeof mockConsole>) {
  Object.values(mocks).forEach(mock => mock.mockRestore());
}
```

---

## Mock Data Factories

Located in `resources/admin/js/__tests__/helpers/mockFactories.ts`:

```typescript
import { faker } from '@faker-js/faker';

// Available factories (admin dashboard):
export function createMockUser(overrides?: Partial<User>): User;
export function createMockAdmin(overrides?: Partial<Admin>): Admin;
export function createMockSiteConfig(overrides?: Partial<SiteConfig>): SiteConfig;
export function createMockActivity(overrides?: Partial<Activity>): Activity;
export function createMockMedia(overrides?: Partial<MediaObject>): MediaObject;
export function createMockLeague(overrides?: Partial<League>): League;
export function createMockDriver(overrides?: Partial<Driver>): Driver;
export function createMockCompetition(overrides?: Partial<CompetitionSummary>): CompetitionSummary;
export function createMockSeason(overrides?: Partial<Season>): Season;
export function createMockPlatformCarImportSummary(overrides?: Partial<PlatformCarImportSummary>): PlatformCarImportSummary;

// Example usage:
export function createMockUser(overrides?: Partial<User>): User {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.uuid(),
    first_name: firstName,
    last_name: lastName,
    name: `${firstName} ${lastName}`,
    email: faker.internet.email(),
    email_verified_at: faker.date.past().toISOString(),
    alias: faker.internet.username(),
    uuid: faker.string.uuid(),
    status: 'active',
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

export function createMockAdmin(overrides?: Partial<Admin>): Admin {
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.person.fullName(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    role: 'admin',
    status: 'active',
    last_login_at: faker.date.recent().toISOString(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockMedia(overrides?: Partial<MediaObject>): MediaObject {
  const id = faker.number.int({ min: 1, max: 10000 });
  const baseUrl = '/storage/media/' + id;

  return {
    id,
    original: `${baseUrl}/image.png`,
    conversions: {
      thumb: `${baseUrl}/conversions/image-thumb.webp`,
      small: `${baseUrl}/conversions/image-small.webp`,
      medium: `${baseUrl}/conversions/image-medium.webp`,
      large: `${baseUrl}/conversions/image-large.webp`,
      og: `${baseUrl}/conversions/image-og.webp`,
    },
    srcset: `${baseUrl}/conversions/image-thumb.webp 150w, ...`,
    ...overrides,
  };
}

// Usage in tests:
const user = createMockUser({ status: 'pending' });
const admin = createMockAdmin({ role: 'super_admin' });
const league = createMockLeague({ visibility: 'public' });
```

---

## Dashboard-Specific Details

### App Dashboard (`dev-fe-app` agent)

**Test location:** `resources/app/js/`

**Key characteristics:**
- Uses `.test.ts` naming convention (colocated with source files)
- Has comprehensive test utilities in `__tests__/setup/`
- Complete PrimeVue stubs available
- Full test utilities similar to admin dashboard

**Example test file locations:**
```
resources/app/js/
├── __tests__/
│   └── setup/
│       ├── index.ts           # Central export
│       ├── testUtils.ts       # Helper functions
│       └── primevueStubs.ts   # Component stubs
├── stores/leagueStore.test.ts
├── composables/useImageUrl.test.ts
├── components/common/HTag.test.ts
├── components/common/forms/ImageUpload.test.ts
├── services/driverService.test.ts
```

**Import test utilities:**
```typescript
import {
  mountWithStubs,
  primevueStubs,
  createTestPinia,
  createTestRouter,
  flushPromises,
  waitFor,
} from '@app/__tests__/setup';
```

### Public Dashboard (`dev-fe-public` agent)

**Test location:** `resources/public/js/`

**Key characteristics:**
- Uses `.test.ts` naming convention (colocated with source files)
- Tests components, composables, services, and views
- **No dedicated `__tests__/setup/` directory** - uses inline test setup
- Uses `withSetup` helper for composables needing Vue context (define inline in test files)

**Example test file locations:**
```
resources/public/js/
├── components/common/forms/VrlPasswordInput.test.ts
├── components/landing/HeroStandingsCard.test.ts
├── composables/useToast.test.ts
├── services/authService.test.ts
├── stores/authStore.test.ts
├── views/HomeView.test.ts
├── views/auth/LoginView.test.ts
```

**Note:** Public dashboard tests should define their own mount helpers inline or copy patterns from app/admin dashboards.

### Admin Dashboard (`dev-fe-admin` agent)

**Test location:** `resources/admin/js/`

**Key characteristics:**
- Uses `.test.ts` naming convention (colocated with source files)
- Most comprehensive test setup with 60+ test files
- Complete mock factories using Faker.js (10+ factory functions)
- Extensive PrimeVue stubs
- Full test utilities in `__tests__/setup/`

**Example test file locations:**
```
resources/admin/js/
├── __tests__/
│   ├── setup/
│   │   ├── index.ts           # Central export
│   │   ├── testUtils.ts       # Helper functions
│   │   └── primevueStubs.ts   # Component stubs
│   └── helpers/
│       └── mockFactories.ts   # Typed mock data generators
├── stores/adminStore.test.ts
├── composables/useDateFormatter.test.ts
├── composables/useAsyncAction.test.ts
├── components/common/Badge.test.ts
├── components/AdminUser/modals/CreateAdminUserModal.test.ts
├── services/authService.test.ts
├── views/AdminLoginView.test.ts
```

**Import test utilities:**
```typescript
import { mountWithStubs, primevueStubs, createTestPinia, createTestRouter } from '@admin/__tests__/setup';
import {
  createMockAdmin,
  createMockUser,
  createMockLeague,
  createMockMedia,
  createMockActivity,
} from '@admin/__tests__/helpers/mockFactories';
```

---

## Best Practices

1. **Isolate tests** - Use fresh Pinia instance per test with `setActivePinia(createPinia())`
2. **Clear mocks** - Call `vi.clearAllMocks()` in `beforeEach`
3. **Test behavior, not implementation** - Focus on what the component does, not how
4. **Use descriptive test names** - `it('shows error message when login fails')` not `it('test error')`
5. **Test edge cases** - Empty states, loading states, error states
6. **Mock at boundaries** - Mock services, not internal functions
7. **Keep tests fast** - Use stubs over real components when possible
8. **Use factories for data** - Don't hardcode test data, use mock factories
9. **Test user interactions** - Use `trigger('click')`, `setValue()`, etc.
10. **Verify events** - Check `wrapper.emitted()` for component events

---

## Coverage Requirements

All dashboards enforce **70% minimum coverage** for:
- Lines
- Functions
- Branches
- Statements

Run coverage report: `npm run test:coverage`
