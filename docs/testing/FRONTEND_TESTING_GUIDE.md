# Vue.js Frontend Testing Guide

This guide covers testing strategies for the three Vue 3 Single Page Applications (SPAs) in this project.

## Application Architecture

This project has **three completely separate Vue.js applications** across three subdomains:

```
resources/
├── public/          # Public Site (virtualracingleagues.localhost)
│   └── js/
│       ├── views/       # Login, Register, Home, etc.
│       ├── components/
│       ├── router/
│       └── stores/
├── user/            # User Dashboard (app.virtualracingleagues.localhost)
│   └── js/
│       ├── views/       # Profile, Dashboard, etc.
│       ├── components/
│       ├── router/
│       ├── stores/
│       └── tests/       # User-specific tests
└── admin/           # Admin Dashboard (admin.virtualracingleagues.localhost)
    └── js/
        ├── views/       # Admin views
        ├── components/
        ├── router/
        ├── stores/
        └── tests/       # Admin-specific tests
```

**Critical**: Components and code are **NOT shared** between applications. Each has its own:
- Pinia store instance
- Vue Router instance
- Test suite
- Path alias (`@public`, `@user`, `@admin`)

## Running Tests

```bash
# All frontend tests
npm test

# Specific application
npm run test:public        # Public site only
npm run test:user          # User dashboard only
npm run test:admin         # Admin dashboard only

# Watch mode
npm test -- --watch

# UI mode (browser-based test runner)
npm run test:ui

# Coverage
npm run test:coverage

# Specific file
npm test resources/app/js/components/MyComponent.test.ts

# Filter by test name
npm test -- -t "renders correctly"
```

## Testing Stack

- **Vitest** - Fast test runner (Vite-native)
- **@testing-library/vue** - User-centric component testing
- **@testing-library/user-event** - Realistic user interactions
- **@vue/test-utils** - Low-level Vue component utilities
- **MSW (Mock Service Worker)** - API mocking at network level
- **happy-dom** - Fast DOM implementation (2-3x faster than jsdom)

## Testing Philosophy

### Testing Library (Preferred)

Focus on **how users interact** with your components:

```typescript
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

// Good: Test user behavior
const input = screen.getByLabelText('Email');
await userEvent.type(input, 'user@example.com');
expect(screen.getByText('Valid email')).toBeInTheDocument();

// Avoid: Test implementation details
expect(wrapper.vm.emailValue).toBe('user@example.com');
```

### Vue Test Utils (When Needed)

Use for **component internals** that users can't see:

```typescript
import { mount } from '@vue/test-utils';

// Good use case: Testing emitted events
const wrapper = mount(MyComponent);
await wrapper.find('button').trigger('click');
expect(wrapper.emitted('submit')).toBeTruthy();
```

## Basic Component Testing

### Simple Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import WelcomeMessage from './WelcomeMessage.vue';

describe('WelcomeMessage', () => {
  it('renders welcome message', () => {
    render(WelcomeMessage, {
      props: {
        userName: 'John Doe',
      },
    });

    expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
  });

  it('renders default message when no name provided', () => {
    render(WelcomeMessage);

    expect(screen.getByText('Welcome, Guest!')).toBeInTheDocument();
  });
});
```

### Component with User Interaction

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import Counter from './Counter.vue';

describe('Counter', () => {
  it('increments count when button clicked', async () => {
    const user = userEvent.setup();
    render(Counter);

    const button = screen.getByRole('button', { name: /increment/i });
    const count = screen.getByText(/count: 0/i);

    expect(count).toBeInTheDocument();

    await user.click(button);

    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });

  it('resets count when reset button clicked', async () => {
    const user = userEvent.setup();
    render(Counter);

    // Increment a few times
    const incrementBtn = screen.getByRole('button', { name: /increment/i });
    await user.click(incrementBtn);
    await user.click(incrementBtn);

    expect(screen.getByText(/count: 2/i)).toBeInTheDocument();

    // Reset
    const resetBtn = screen.getByRole('button', { name: /reset/i });
    await user.click(resetBtn);

    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  });
});
```

## Testing with Pinia Stores

### Option 1: Test with Real Store

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import UserProfile from './UserProfile.vue';
import { useUserStore } from '@app/stores/userStore';

describe('UserProfile', () => {
  beforeEach(() => {
    // Create fresh Pinia instance for each test
    setActivePinia(createPinia());
  });

  it('displays user information from store', () => {
    const userStore = useUserStore();

    // Set up store state
    userStore.user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    };

    render(UserProfile, {
      global: {
        plugins: [createPinia()],
      },
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### Option 2: Mock Store

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import UserProfile from './UserProfile.vue';

// Mock the store module
vi.mock('@app/stores/userStore', () => ({
  useUserStore: vi.fn(() => ({
    user: {
      id: 1,
      name: 'Mocked User',
      email: 'mocked@example.com',
    },
    updateProfile: vi.fn(),
  })),
}));

describe('UserProfile', () => {
  it('displays mocked user information', () => {
    render(UserProfile);

    expect(screen.getByText('Mocked User')).toBeInTheDocument();
  });
});
```

## Testing with Vue Router

### Option 1: Test with Real Router

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import Navigation from './Navigation.vue';

describe('Navigation', () => {
  it('renders navigation links', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/about', name: 'about', component: { template: '<div>About</div>' } },
      ],
    });

    render(Navigation, {
      global: {
        plugins: [router],
      },
    });

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
  });

  it('navigates to correct route on click', async () => {
    const user = userEvent.setup();
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/about', name: 'about', component: { template: '<div>About</div>' } },
      ],
    });

    render(Navigation, {
      global: {
        plugins: [router],
      },
    });

    const aboutLink = screen.getByRole('link', { name: /about/i });
    await user.click(aboutLink);

    expect(router.currentRoute.value.path).toBe('/about');
  });
});
```

### Option 2: Mock Router

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import LoginForm from './LoginForm.vue';

const mockPush = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LoginForm', () => {
  it('navigates to dashboard after successful login', async () => {
    const user = userEvent.setup();
    render(LoginForm);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Wait for async operation
    await screen.findByText(/login successful/i);

    expect(mockPush).toHaveBeenCalledWith({ name: 'dashboard' });
  });
});
```

## API Mocking with MSW

### Basic Setup

MSW is configured globally in `tests/setup.ts` and `tests/mocks/server.ts`.

### Using Default Handlers

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import LoginForm from '@public/views/LoginForm.vue';

// MSW handlers in tests/mocks/handlers.ts handle /api/login

describe('LoginForm', () => {
  it('logs in user with valid credentials', async () => {
    const user = userEvent.setup();
    render(LoginForm);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');

    // Submit
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Wait for success message (MSW returns mocked response)
    await waitFor(() => {
      expect(screen.getByText(/login successful/i)).toBeInTheDocument();
    });
  });
});
```

### Override Handlers for Specific Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import LoginForm from '@public/views/LoginForm.vue';

describe('LoginForm - Error Scenarios', () => {
  it('shows error message for invalid credentials', async () => {
    // Override handler for this test
    server.use(
      http.post('http://virtualracingleagues.localhost/api/login', () => {
        return HttpResponse.json(
          {
            success: false,
            message: 'Invalid credentials',
          },
          { status: 401 }
        );
      })
    );

    const user = userEvent.setup();
    render(LoginForm);

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows error message for network failure', async () => {
    server.use(
      http.post('http://virtualracingleagues.localhost/api/login', () => {
        return HttpResponse.error();
      })
    );

    const user = userEvent.setup();
    render(LoginForm);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
```

### Adding Custom Handlers

Edit `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

const USER_API_BASE = 'http://app.virtualracingleagues.localhost/api';

export const handlers = [
  // ... existing handlers

  // Add your custom handler
  http.get(`${USER_API_BASE}/leagues`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: 'League 1', slug: 'league-1' },
        { id: 2, name: 'League 2', slug: 'league-2' },
      ],
    });
  }),
];
```

## Testing PrimeVue Components

### Testing Forms with PrimeVue Inputs

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import PrimeVue from 'primevue/config';
import UserForm from './UserForm.vue';

describe('UserForm', () => {
  it('validates email input', async () => {
    const user = userEvent.setup();

    render(UserForm, {
      global: {
        plugins: [PrimeVue],
      },
    });

    const emailInput = screen.getByLabelText(/email/i);

    // Type invalid email
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event

    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();

    // Clear and type valid email
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    await user.tab();

    expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
  });
});
```

### Testing PrimeVue Dialogs

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import PrimeVue from 'primevue/config';
import ConfirmationDialog from './ConfirmationDialog.vue';

describe('ConfirmationDialog', () => {
  it('shows dialog when triggered', async () => {
    const user = userEvent.setup();

    render(ConfirmationDialog, {
      global: {
        plugins: [PrimeVue],
      },
    });

    const openButton = screen.getByRole('button', { name: /delete/i });
    await user.click(openButton);

    // Dialog content should be visible
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('emits confirm event when confirmed', async () => {
    const user = userEvent.setup();

    const { emitted } = render(ConfirmationDialog, {
      global: {
        plugins: [PrimeVue],
      },
    });

    // Open dialog
    await user.click(screen.getByRole('button', { name: /delete/i }));

    // Click confirm
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(emitted()).toHaveProperty('confirm');
  });
});
```

### Testing PrimeVue DataTable

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import PrimeVue from 'primevue/config';
import UserTable from './UserTable.vue';

describe('UserTable', () => {
  it('renders user data in table', () => {
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    render(UserTable, {
      props: { users },
      global: {
        plugins: [PrimeVue],
      },
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(UserTable, {
      props: { users: [] },
      global: {
        plugins: [PrimeVue],
      },
    });

    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });
});
```

## Testing Composables

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { count } = useCounter();

    expect(count.value).toBe(0);
  });

  it('initializes with custom value', () => {
    const { count } = useCounter(10);

    expect(count.value).toBe(10);
  });

  it('increments count', () => {
    const { count, increment } = useCounter();

    increment();

    expect(count.value).toBe(1);
  });

  it('decrements count', () => {
    const { count, increment, decrement } = useCounter(5);

    decrement();

    expect(count.value).toBe(4);
  });

  it('resets count to initial value', () => {
    const { count, increment, reset } = useCounter(10);

    increment();
    increment();
    expect(count.value).toBe(12);

    reset();
    expect(count.value).toBe(10);
  });
});
```

### Testing Composables with API Calls

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { useUserData } from './useUserData';

describe('useUserData', () => {
  it('fetches user data successfully', async () => {
    const { user, loading, error, fetchUser } = useUserData();

    expect(loading.value).toBe(false);

    fetchUser(1);

    expect(loading.value).toBe(true);

    await flushPromises(); // Wait for async operations

    expect(loading.value).toBe(false);
    expect(user.value).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(error.value).toBeNull();
  });

  it('handles error when user not found', async () => {
    server.use(
      http.get('*/api/users/:id', () => {
        return HttpResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      })
    );

    const { user, loading, error, fetchUser } = useUserData();

    fetchUser(999);

    await flushPromises();

    expect(loading.value).toBe(false);
    expect(user.value).toBeNull();
    expect(error.value).toBe('User not found');
  });
});
```

## Testing Async Components

### Using `waitFor` and `findBy` Queries

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import UserList from './UserList.vue';

describe('UserList', () => {
  it('displays loading state then user list', async () => {
    render(UserList);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for users to load (findBy* queries wait automatically)
    const firstUser = await screen.findByText('John Doe');

    expect(firstUser).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('displays error message on fetch failure', async () => {
    server.use(
      http.get('*/api/users', () => {
        return HttpResponse.error();
      })
    );

    render(UserList);

    await waitFor(() => {
      expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
    });
  });
});
```

## Testing File Uploads

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpload.vue';

describe('FileUpload', () => {
  it('uploads file when selected', async () => {
    const user = userEvent.setup();
    render(FileUpload);

    const file = new File(['logo content'], 'logo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload file/i);

    await user.upload(input, file);

    expect(screen.getByText('logo.jpg')).toBeInTheDocument();
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    render(FileUpload);

    const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload file/i);

    await user.upload(input, file);

    expect(screen.getByText(/only images allowed/i)).toBeInTheDocument();
  });
});
```

## Testing Forms with Validation

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import RegistrationForm from './RegistrationForm.vue';

describe('RegistrationForm', () => {
  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(RegistrationForm);

    const submitButton = screen.getByRole('button', { name: /register/i });
    await user.click(submitButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(RegistrationForm);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.tab(); // Trigger validation

    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
  });

  it('validates password strength', async () => {
    const user = userEvent.setup();
    render(RegistrationForm);

    await user.type(screen.getByLabelText(/^password$/i), 'weak');
    await user.tab();

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    render(RegistrationForm);

    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass123!');
    await user.tab();

    expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(RegistrationForm);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123!');

    await user.click(screen.getByRole('button', { name: /register/i }));

    await screen.findByText(/registration successful/i);
  });
});
```

## Query Priority (Testing Library)

Use queries in this order:

1. **Accessible to everyone**: `getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`
2. **Semantic queries**: `getByAltText`, `getByTitle`
3. **Test IDs** (last resort): `getByTestId`

```typescript
// Best: Accessible queries
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email address/i);

// Good: Text content
screen.getByText(/welcome back/i);

// Avoid: Test IDs (use only when necessary)
screen.getByTestId('submit-button');
```

## Common Testing Patterns

### Testing Conditional Rendering

```typescript
it('shows login button when not authenticated', () => {
  render(Header, {
    global: {
      mocks: {
        $auth: { isAuthenticated: false },
      },
    },
  });

  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
});
```

### Testing Lists and Iteration

```typescript
it('renders all items in list', () => {
  const items = ['Item 1', 'Item 2', 'Item 3'];

  render(ItemList, { props: { items } });

  items.forEach((item) => {
    expect(screen.getByText(item)).toBeInTheDocument();
  });
});
```

### Testing Slots

```typescript
it('renders content in default slot', () => {
  render(Card, {
    slots: {
      default: '<p>Slot content</p>',
    },
  });

  expect(screen.getByText('Slot content')).toBeInTheDocument();
});

it('renders content in named slot', () => {
  render(Card, {
    slots: {
      header: '<h1>Card Header</h1>',
      footer: '<button>Action</button>',
    },
  });

  expect(screen.getByText('Card Header')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
});
```

### Testing Emitted Events

```typescript
it('emits custom event on click', async () => {
  const user = userEvent.setup();

  const { emitted } = render(CustomButton);

  await user.click(screen.getByRole('button'));

  expect(emitted()).toHaveProperty('customClick');
  expect(emitted().customClick).toHaveLength(1);
  expect(emitted().customClick[0]).toEqual(['payload data']);
});
```

## Application-Specific Testing

### Public Site Tests (`resources/public/js`)

Focus on:
- Authentication flows (login, register, password reset)
- Public-facing pages (home, about)
- Unauthenticated user experience

```typescript
// tests/public/LoginForm.test.ts
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import LoginForm from '@public/views/LoginForm.vue';

describe('Public Site - LoginForm', () => {
  it('redirects to user dashboard after successful login', async () => {
    // Test implementation
  });
});
```

### User Dashboard Tests (`resources/app/js`)

Focus on:
- Authenticated user features
- Profile management
- User-specific data and actions

```typescript
// resources/app/js/tests/Profile.test.ts
import { render, screen } from '@testing-library/vue';
import ProfileView from '@app/views/ProfileView.vue';

describe('User Dashboard - ProfileView', () => {
  it('displays user profile information', () => {
    // Test implementation
  });
});
```

### Admin Dashboard Tests (`resources/admin/js`)

Focus on:
- Admin CRUD operations
- Admin-specific UI components
- Permission-based features

```typescript
// resources/admin/js/tests/UserManagement.test.ts
import { render, screen } from '@testing-library/vue';
import UserManagement from '@admin/views/UserManagement.vue';

describe('Admin Dashboard - UserManagement', () => {
  it('displays list of users', () => {
    // Test implementation
  });
});
```

## Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// Good: Test what user sees
expect(screen.getByText('Login successful')).toBeInTheDocument();

// Avoid: Test implementation details
expect(wrapper.vm.loginSuccessful).toBe(true);
```

### 2. Use Accessible Queries

```typescript
// Good: Role-based query
screen.getByRole('button', { name: /submit/i });

// Avoid: Implementation-specific query
screen.getByTestId('submit-btn');
```

### 3. Avoid Testing Library Code

```typescript
// Don't test Vue Router
it('router has correct routes', () => {
  expect(router.getRoutes()).toHaveLength(5);
});

// Test user navigation instead
it('navigates to profile page', async () => {
  await user.click(screen.getByRole('link', { name: /profile/i }));
  expect(screen.getByText(/user profile/i)).toBeInTheDocument();
});
```

### 4. Keep Tests Isolated

```typescript
// Each test should be independent
beforeEach(() => {
  // Reset state before each test
  setActivePinia(createPinia());
});
```

### 5. Use Descriptive Test Names

```typescript
// Good: Clear, specific
it('shows error message when email is invalid', () => {});

// Avoid: Vague
it('works', () => {});
```

### 6. Test Edge Cases

```typescript
it('handles empty user list', () => {});
it('handles network errors gracefully', () => {});
it('validates maximum file size', () => {});
```

## Debugging Tests

```bash
# Run single test file
npm test resources/app/js/components/MyComponent.test.ts

# Run tests matching pattern
npm test -- -t "renders correctly"

# Watch mode for rapid iteration
npm test -- --watch

# UI mode for visual debugging
npm run test:ui

# Show console output
npm test -- --reporter=verbose
```

## Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/index.html
```

Coverage thresholds (configured in `vitest.config.ts`):
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

---

**Key Takeaways**:
- Use **Testing Library** for user-centric tests (preferred)
- Use **Vue Test Utils** for component internals only
- Mock APIs with **MSW** (network-level mocking)
- Each application (`@public`, `@user`, `@admin`) has **separate test suites**
- Test **user behavior**, not implementation details
- Use **accessible queries** (roles, labels) over test IDs
- Keep tests **isolated** and **independent**
- Focus on **edge cases** and **error scenarios**
