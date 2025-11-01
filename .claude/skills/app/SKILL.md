---
name: app
description: Specialized frontend development for the user dashboard (resources/app/) using Vue 3, TypeScript, PrimeVue, and Pinia. Automatically invokes the dev-fe-app agent for comprehensive Vue expertise.
allowed-tools: Bash, Glob, Grep, Read, Edit, MultiEdit, Write, WebFetch, WebSearch, TodoWrite, Task, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# User Dashboard Development Skill

This skill activates specialized user dashboard development mode using the `dev-fe-app` agent.

## Automatic Agent Invocation

When this skill is activated, **immediately invoke the dev-fe-app agent** using the Task tool:

```
Task(subagent_type: "dev-fe-app", prompt: "[user's request]")
```

The dev-fe-app agent is an elite Vue.js architect with expertise in:
- Vue 3 Composition API with `<script setup lang="ts">`
- TypeScript (strict mode)
- PrimeVue 4 components
- Pinia state management
- Vue Router 4
- Vitest testing
- Tailwind CSS 4

## Working Directory

**Primary Focus**: `resources/app/`

All user dashboard development happens in this directory. Do not work outside without explicit permission.

## Import Alias

Always use `@app/` for imports within the user application:

```typescript
import MyComponent from '@app/components/MyComponent.vue';
import { useAuthStore } from '@app/stores/auth';
import type { User } from '@app/types/user';
```

## Subdomain Architecture

- **Subdomain**: `app.{APP_DOMAIN}` (e.g., `app.virtualracingleagues.localhost`)
- **Blade Template**: `resources/views/app.blade.php`
- **Separate Application**: Completely independent from public and admin apps
- **Authentication**: All routes require authentication (users redirected to public site if not logged in)

## Key Development Workflows

### 1. Adding a New View
1. Create view in `resources/app/js/views/`
2. Add route in `resources/app/js/router/index.ts` with `requiresAuth: true` meta
3. Create tests in `resources/app/js/views/__tests__/`
4. Use PrimeVue components for UI

### 2. Adding a Component
1. Create in `resources/app/js/components/`
2. Use Composition API with `<script setup lang="ts">`
3. Add props/emits with TypeScript types
4. Create Vitest tests

### 3. Adding a Composable
1. Create in `resources/app/js/composables/`
2. Prefix with `use` (e.g., `useUserProfile.ts`)
3. Return reactive refs and methods
4. Write unit tests

### 4. Adding API Integration
1. Create service in `resources/app/js/services/`
2. Use axios with TypeScript types
3. Handle errors with toast notifications
4. Update Pinia store if needed

## PrimeVue Integration

Always use **PrimeVue 4** (latest version). For documentation, use Context7 MCP tools:

```typescript
// Resolve library
mcp__context7__resolve-library-id(libraryName: "primevue")

// Get docs for specific component
mcp__context7__get-library-docs(
  context7CompatibleLibraryID: "/primefaces/primevue",
  topic: "DataTable"
)
```

Common components:
- Forms: `InputText`, `Dropdown`, `Calendar`, `Checkbox`, `InputSwitch`
- Data: `DataTable`, `DataView`, `Timeline`
- Overlays: `Dialog`, `Sidebar`, `Toast`, `ConfirmDialog`
- Navigation: `Menu`, `Menubar`, `Breadcrumb`, `TabView`
- Buttons: `Button`, `SplitButton`

## Quality Gates (MANDATORY Before Completion)

Before marking any task as complete, ALL of the following must pass 100%:

### 1. Vitest Tests
```bash
npm run test:app
```
All tests must pass. Create tests for all new components, composables, and views.

### 2. TypeScript Checks
```bash
npm run type-check
```
No TypeScript errors allowed.

### 3. Linting
```bash
npm run lint:app
```
ESLint must pass with no errors.

### 4. Formatting
```bash
npm run format:app
```
Code must be properly formatted with Prettier.

### Run All Checks
```bash
npm run type-check && npm run lint:app && npm run format:app && npm run test:app
```

## Essential Guides

Refer to these comprehensive guides for detailed patterns and examples:

- **[User Dashboard Development Guide](./.claude/guides/frontend/app/app-dashboard-development-guide.md)** - Complete development workflow
- **[PrimeVue Usage Guide](./.claude/guides/primevue-usage.md)** - Local PrimeVue reference

## Development Commands

```bash
# Development
npm run dev                    # Start Vite dev server with HMR

# Testing
npm run test:app              # Run user dashboard tests
npm run test:app -- --ui      # Run with Vitest UI
npm run test:app -- --coverage  # Generate coverage report

# Quality Checks
npm run type-check            # TypeScript type checking
npm run lint:app              # ESLint
npm run lint:app -- --fix     # Auto-fix linting issues
npm run format:app            # Prettier formatting

# Build
npm run build                 # Production build (runs type-check + vite build)
```

## Best Practices

1. **Keep Components Focused**: Under 200-300 lines
2. **Extract Logic to Composables**: Don't bloat components
3. **Use TypeScript Strictly**: Full type safety everywhere
4. **Write Tests First**: TDD when possible
5. **Accessibility Matters**: ARIA labels, keyboard navigation, screen readers
6. **Responsive Design**: Mobile-first with Tailwind utilities
7. **Error Handling**: Always use try/catch and show user-friendly messages
8. **Loading States**: Show loading indicators for async operations
9. **Optimistic Updates**: Update UI immediately, rollback on error
10. **Code Reusability**: Create composables for shared logic

## Tailwind Specific Conventions

- **Text Size**: Only add if design deviates from `text-base`
- **Font Color**: Only change if design requires it (use default otherwise)
- **Utility-First**: Prefer Tailwind classes over scoped styles
- **Scoped Styles**: Only use when absolutely necessary

## Authentication Context

The user dashboard is **authenticated-only**:
- Users must be logged in to access any routes
- Authentication state managed by `auth` store
- Session shared from public site login via subdomain cookies
- Unauthenticated users redirected to public site login page

## Remember

- This is a **separate Vue application** from public and admin dashboards
- Components are **NOT shared** between applications
- Each app has its **own Pinia instance**
- Use the `dev-fe-app` agent for all Vue/TypeScript/PrimeVue work
- Never compromise on quality gates - all checks must pass 100%
- This is the **user-facing** application, not the admin dashboard
