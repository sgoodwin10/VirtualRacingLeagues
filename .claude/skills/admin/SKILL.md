---
name: frontend-admin
description: Specialized frontend development for the admin dashboard (resources/admin/) using Vue 3, TypeScript, PrimeVue, and Pinia. Automatically invokes the dev-fe-admin agent for comprehensive Vue expertise.
allowed-tools: Bash, Glob, Grep, Read, Edit, MultiEdit, Write, WebFetch, WebSearch, TodoWrite, Task, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# Admin Dashboard Development Skill

This skill activates specialized admin dashboard development mode using the `dev-fe-admin` agent.

## Automatic Agent Invocation

When this skill is activated, **immediately invoke the dev-fe-admin agent** using the Task tool:

```
Task(subagent_type: "dev-fe-admin", prompt: "[user's request]")
```

The dev-fe-admin agent is an elite Vue.js architect with expertise in:
- Vue 3 Composition API with `<script setup lang="ts">`
- TypeScript (strict mode)
- PrimeVue 4 components
- Pinia state management
- Vue Router 4
- Vitest testing
- Tailwind CSS 4

## Working Directory

**Primary Focus**: `resources/admin/`

All admin dashboard development happens in this directory. Do not work outside without explicit permission.

## Import Alias

Always use `@admin/` for imports within the admin application:

```typescript
import MyComponent from '@admin/components/MyComponent.vue';
import { useAdminStore } from '@admin/stores/admin';
import type { AdminUser } from '@admin/types/admin';
```

## Subdomain Architecture

- **Subdomain**: `admin.{APP_DOMAIN}` (e.g., `admin.virtualracingleagues.localhost`)
- **Route Prefix**: `/admin`
- **Blade Template**: `resources/views/admin.blade.php`
- **Separate Application**: Completely independent from public and user apps

## Key Development Workflows

### 1. Adding a New View
1. Create view in `resources/admin/js/views/`
2. Add route in `resources/admin/js/router/index.ts`
3. Create tests in `resources/admin/js/views/__tests__/`
4. Use PrimeVue components for UI

### 2. Adding a Component
1. Create in `resources/admin/js/components/`
2. Use Composition API with `<script setup lang="ts">`
3. Add props/emits with TypeScript types
4. Create Vitest tests

### 3. Adding a Composable
1. Create in `resources/admin/js/composables/`
2. Prefix with `use` (e.g., `useAdminForm.ts`)
3. Return reactive refs and methods
4. Write unit tests

### 4. Adding API Integration
1. Create service in `resources/admin/js/services/`
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
npm run test:admin
```
All tests must pass. Create tests for all new components, composables, and views.

### 2. TypeScript Checks
```bash
npm run type-check
```
No TypeScript errors allowed.

### 3. Linting
```bash
npm run lint:admin
```
ESLint must pass with no errors.

### 4. Formatting
```bash
npm run format:admin
```
Code must be properly formatted with Prettier.

### Run All Checks
```bash
npm run type-check && npm run lint:admin && npm run format:admin && npm run test:admin
```

## Essential Guides

Refer to these comprehensive guides for detailed patterns and examples:

- **[Admin Dashboard Development Guide](./.claude/guides/frontend/admin/admin-dashboard-development-guide.md)** - Complete development workflow
- **[Admin Styling Guide](./.claude/guides/frontend/admin/admin-styling-guide.md)** - Design system, typography, spacing, layouts
- **[Admin Components Guide](./.claude/guides/frontend/admin/admin-components-guide.md)** - Component patterns and examples
- **[Admin Composables Guide](./.claude/guides/frontend/admin/admin-composables-guide.md)** - Composable patterns
- **[Admin API Integration Guide](./.claude/guides/frontend/admin/admin-api-integration-guide.md)** - API service patterns
- **[PrimeVue Usage Guide](./.claude/guides/primevue-usage.md)** - Local PrimeVue reference

## Development Commands

```bash
# Development
npm run dev                    # Start Vite dev server with HMR

# Testing
npm run test:admin            # Run admin tests
npm run test:admin -- --ui    # Run with Vitest UI
npm run test:admin -- --coverage  # Generate coverage report

# Quality Checks
npm run type-check            # TypeScript type checking
npm run lint:admin            # ESLint
npm run lint:admin -- --fix   # Auto-fix linting issues
npm run format:admin          # Prettier formatting

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

## Remember

- This is a **separate Vue application** from public and user dashboards
- Components are **NOT shared** between applications
- Each app has its **own Pinia instance**
- Use the `dev-fe-admin` agent for all Vue/TypeScript/PrimeVue work
- Never compromise on quality gates - all checks must pass 100%
