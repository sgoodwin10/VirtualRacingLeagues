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

Tests are **colocated** with source files in `__tests__` directories:

```
resources/[app|public|admin]/js/
├── components/
│   └── common/
│       └── Button.vue
│       └── __tests__/
│           └── Button.test.ts      # Test file
├── composables/
│   └── useToast.ts
│   └── __tests__/
│       └── useToast.test.ts
├── stores/
│   └── userStore.ts
│   └── __tests__/
│       └── userStore.test.ts
├── services/
│   └── authService.ts
│   └── __tests__/
│       └── authService.test.ts
└── __tests__/                      # Dashboard-level test utilities
    └── setup/
        ├── index.ts                # Central export
        ├── testUtils.ts            # Helper functions
        └── primevueStubs.ts        # Component stubs
```

### File Naming Conventions

- **`.test.ts`** - Primary convention (used in app/public dashboards)
- **`.spec.ts`** - Alternative convention (predominant in admin dashboard)

Both patterns are automatically discovered by Vitest.

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

export const handlers = [
  // Public API
  http.post('http://virtualracingleagues.localhost/api/login', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: { user: { id: 1, email: body.email } },
    });
  }),

  // Admin API
  http.get('http://admin.virtualracingleagues.localhost/admin/api/users', () => {
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

```typescript
// Mount with all stubs configured
export function mountWithStubs(component, options = {}) {
  return mount(component, {
    global: {
      plugins: [createTestPinia(), createTestRouter()],
      stubs: { ...primevueStubs, Teleport: true },
      ...options.global,
    },
    ...options,
  });
}

// Create isolated Pinia instance
export function createTestPinia() {
  return createPinia();
}

// Create memory-based router
export function createTestRouter(routes = []) {
  return createRouter({
    history: createMemoryHistory(),
    routes: routes.length ? routes : [{ path: '/', component: { template: '<div />' } }],
  });
}

// Wait for Vue updates and promises
export async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

// Wait for condition with timeout
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('waitFor timeout');
    }
    await new Promise(r => setTimeout(r, interval));
  }
}

// Create mock API response
export function createMockApiResponse(data: any, status = 200) {
  return {
    data: { success: true, data },
    status,
    statusText: 'OK',
  };
}

// Create mock API error
export function createMockApiError(message: string, status = 400) {
  return {
    response: {
      data: { success: false, message },
      status,
    },
  };
}

// Find component by name in wrapper
export function findComponentByName(wrapper, name: string) {
  return wrapper.findComponent({ name });
}
```

---

## Mock Data Factories

Located in `__tests__/helpers/mockFactories.ts`:

```typescript
import { faker } from '@faker-js/faker';

export function createMockUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    status: 'active',
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockAdmin(overrides = {}) {
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    is_super_admin: false,
    last_login_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockLeague(overrides = {}) {
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.company.name() + ' Racing League',
    slug: faker.helpers.slugify(faker.company.name()),
    description: faker.lorem.paragraph(),
    platforms: [{ id: 1, name: 'iRacing' }],
    ...overrides,
  };
}

// Usage in tests:
const user = createMockUser({ status: 'pending' });
const admin = createMockAdmin({ is_super_admin: true });
```

---

## Dashboard-Specific Details

### App Dashboard (`dev-fe-app` agent)

**Test location:** `resources/app/js/`

**Key characteristics:**
- Uses `.test.ts` naming convention
- Has comprehensive test utilities in `__tests__/setup/`
- Complete PrimeVue stubs available
- Mock factories for complex data structures

**Example test file locations:**
```
resources/app/js/
├── stores/__tests__/userStore.test.ts
├── composables/__tests__/useImageUrl.test.ts
├── components/common/__tests__/HTag.test.ts
├── components/common/forms/__tests__/ImageUpload.test.ts
├── services/__tests__/authService.test.ts
```

**Import test utilities:**
```typescript
import { mountWithStubs, primevueStubs, createTestPinia } from '@app/__tests__/setup';
```

### Public Dashboard (`dev-fe-public` agent)

**Test location:** `resources/public/js/`

**Key characteristics:**
- Uses both `.test.ts` and `.spec.ts` conventions
- Tests components, composables, services, and views
- Uses `withSetup` helper for composables needing Vue context

**Example test file locations:**
```
resources/public/js/
├── components/common/buttons/__tests__/VrlButton.test.ts
├── components/common/forms/__tests__/VrlInput.test.ts
├── composables/__tests__/useToast.test.ts
├── services/__tests__/authService.spec.ts
├── views/__tests__/HomeView.test.ts
├── views/auth/__tests__/LoginView.spec.ts
```

### Admin Dashboard (`dev-fe-admin` agent)

**Test location:** `resources/admin/js/`

**Key characteristics:**
- Uses `.spec.ts` naming convention predominantly
- Most comprehensive test setup with 55+ test files
- Complete mock factories using Faker.js
- Extensive PrimeVue stubs

**Example test file locations:**
```
resources/admin/js/
├── stores/__tests__/adminStore.spec.ts
├── composables/__tests__/useDateFormatter.spec.ts
├── composables/__tests__/useAsyncAction.spec.ts
├── components/common/__tests__/Badge.spec.ts
├── components/AdminUser/modals/__tests__/CreateAdminUserModal.spec.ts
├── services/__tests__/authService.spec.ts
├── views/__tests__/AdminLoginView.spec.ts
```

**Import test utilities:**
```typescript
import { mountWithStubs, primevueStubs } from '@admin/__tests__/setup';
import { createMockAdmin, createMockUser } from '@admin/__tests__/helpers/mockFactories';
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
