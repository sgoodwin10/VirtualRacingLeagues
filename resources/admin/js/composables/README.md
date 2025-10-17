# Admin Dashboard Composables

This directory contains reusable Vue 3 composables for the admin dashboard. Each composable follows the Composition API pattern and provides specific, focused functionality.

## Table of Contents

- [useDateFormatter](#usedateformatter)
- [useNameHelpers](#usenamehelpers)
- [useRoleHelpers](#userolehelpers)
- [useStatusHelpers](#usestatushelpers)
- [useSiteConfig](#usesiteconfig)

---

## useDateFormatter

**Purpose**: Format dates consistently across the admin dashboard using date-fns.

**Location**: `/resources/admin/js/composables/useDateFormatter.ts`

**Import**:
```typescript
import { useDateFormatter } from '@admin/composables/useDateFormatter';
```

**Returns**:
- `formatDate(dateString, formatString?)` - Format a date string for display

**Usage**:
```typescript
const { formatDate } = useDateFormatter();

// Default format: "4:43pm 3rd Aug 25"
const formattedDate = formatDate('2025-08-03T16:43:00Z');

// Custom format using date-fns format strings
const customFormat = formatDate('2025-08-03T16:43:00Z', 'PPpp');
// Result: "Aug 3rd, 2025 at 4:43 PM"

// Handles null/undefined values
formatDate(null); // "Never"
formatDate('invalid'); // "Invalid date"
```

**Common Format Strings**:
- `'PPpp'` - Full date and time: "Aug 3rd, 2025 at 4:43 PM"
- `'PP'` - Date only: "Aug 3rd, 2025"
- `'p'` - Time only: "4:43 PM"
- `'yyyy-MM-dd'` - ISO date: "2025-08-03"
- See [date-fns format documentation](https://date-fns.org/docs/format) for more options

**When to Use**:
- Displaying timestamps in tables
- Formatting dates in modals and detail views
- Showing "last login" or "created at" dates
- Any date display that needs consistent formatting

**Components Using This**:
- `AdminUsersTable.vue`
- `UsersTable.vue`
- `ActivityLogTable.vue`
- `ViewUserModal.vue`
- `ViewAdminUserModal.vue`

---

## useNameHelpers

**Purpose**: Extract and format names from Admin and User entities.

**Location**: `/resources/admin/js/composables/useNameHelpers.ts`

**Import**:
```typescript
import { useNameHelpers } from '@admin/composables/useNameHelpers';
```

**Returns**:
- `getFullName(entity)` - Get the full name of an entity
- `getFirstName(entity)` - Get the first name
- `getLastName(entity)` - Get the last name
- `getUserInitials(entity)` - Get initials for avatars (e.g., "JD")
- `getDisplayName(entity, email?)` - Get name with email fallback
- `hasCompleteName(entity)` - Check if entity has both first and last name

**Usage**:
```typescript
const { getFullName, getUserInitials, getDisplayName } = useNameHelpers();

// With an Admin or User entity
const admin = { first_name: 'John', last_name: 'Doe', email: 'john@example.com' };

const fullName = getFullName(admin); // "John Doe"
const initials = getUserInitials(admin); // "JD"
const displayName = getDisplayName(admin, admin.email); // "John Doe" or email if no name

// Handles entities with only 'name' field
const user = { name: 'Jane Smith', email: 'jane@example.com' };
getFullName(user); // "Jane Smith"
getUserInitials(user); // "JS"

// Handles missing names gracefully
const incomplete = { email: 'unknown@example.com' };
getFullName(incomplete); // "Unknown"
getUserInitials(incomplete); // "U"
```

**Entity Interface**:
```typescript
interface NamedEntity {
  name?: string;
  first_name?: string;
  last_name?: string;
}
```

**When to Use**:
- Displaying user/admin names in tables
- Creating avatar initials
- Showing names in dropdowns or autocomplete
- Any UI that displays people's names

**Components Using This**:
- `AdminUsersTable.vue`
- `UsersTable.vue`
- `ViewUserModal.vue`
- `ViewAdminUserModal.vue`
- `ActivityLogTable.vue`

---

## useRoleHelpers

**Purpose**: Work with admin roles and role-based access control (RBAC).

**Location**: `/resources/admin/js/composables/useRoleHelpers.ts`

**Import**:
```typescript
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';
```

**Returns**:
- `getRoleLevel(role)` - Get numeric level of a role (0-3)
- `hasRoleAccess(currentRole, requiredRole)` - Check if role has sufficient access
- `getRoleLabel(role)` - Get human-readable label
- `getRoleBadgeVariant(role)` - Get badge color variant for UI

**Role Hierarchy**:
```typescript
export const ROLE_HIERARCHY = {
  super_admin: 3,  // Highest privileges
  admin: 2,
  moderator: 1,    // Lowest privileges
} as const;
```

**Usage**:
```typescript
const { hasRoleAccess, getRoleLabel, getRoleBadgeVariant } = useRoleHelpers();

// Check role access
const currentUserRole = 'admin';
const canEditUsers = hasRoleAccess(currentUserRole, 'moderator'); // true
const canEditAdmins = hasRoleAccess(currentUserRole, 'super_admin'); // false

// Get display label
const label = getRoleLabel('super_admin'); // "Super Admin"

// Get badge variant for UI
const variant = getRoleBadgeVariant('admin'); // "warning"
// Use with Badge component:
// <Badge :text="getRoleLabel(admin.role)" :variant="getRoleBadgeVariant(admin.role)" />
```

**Role Badge Variants**:
- `super_admin` → `danger` (red badge)
- `admin` → `warning` (yellow/orange badge)
- `moderator` → `info` (blue badge)

**When to Use**:
- Checking if a user can perform an action
- Displaying role badges
- Implementing role-based UI visibility
- Validating role changes (e.g., moderator can't promote to super_admin)
- Disabling actions based on role hierarchy

**Components Using This**:
- `AdminUsersView.vue`
- `AdminUsersTable.vue`
- `EditAdminUserModal.vue`
- `CreateAdminUserModal.vue`

---

## useStatusHelpers

**Purpose**: Work with user and admin status values (active, inactive, suspended).

**Location**: `/resources/admin/js/composables/useStatusHelpers.ts`

**Import**:
```typescript
import { useStatusHelpers } from '@admin/composables/useStatusHelpers';
```

**Returns**:
- `getStatusLabel(status)` - Get human-readable label
- `getStatusVariant(status)` - Get badge color variant
- `getStatusIcon(status)` - Get PrimeIcons class name
- `isActive(status)` - Check if status is active
- `isInactive(status)` - Check if status is inactive
- `isSuspended(status)` - Check if status is suspended

**Usage**:
```typescript
const { getStatusLabel, getStatusVariant, getStatusIcon, isActive } = useStatusHelpers();

const user = { status: 'active' };

// Get display information
const label = getStatusLabel(user.status); // "Active"
const variant = getStatusVariant(user.status); // "success"
const icon = getStatusIcon(user.status); // "pi-circle-fill"

// Check status
if (isActive(user.status)) {
  // User can log in
}

// Use with Badge component
// <Badge
//   :text="getStatusLabel(user.status)"
//   :variant="getStatusVariant(user.status)"
//   :icon="getStatusIcon(user.status)"
// />
```

**Status Mapping**:

| Status | Label | Badge Variant | Icon | Description |
|--------|-------|---------------|------|-------------|
| `active` | Active | `success` (green) | `pi-circle-fill` | User can log in |
| `inactive` | Inactive | `secondary` (grey) | `pi-circle` | Account disabled |
| `suspended` | Suspended | `danger` (red) | `pi-ban` | Account suspended |

**When to Use**:
- Displaying status badges in tables
- Checking if a user/admin can log in
- Filtering by status
- Status dropdowns and selects
- Conditional UI based on status

**Components Using This**:
- `AdminUsersTable.vue`
- `UsersTable.vue`
- `ViewUserModal.vue`
- `ViewAdminUserModal.vue`
- `EditAdminUserModal.vue`
- `EditUserModal.vue`

---

## useSiteConfig

**Purpose**: Manage site configuration with reactive state, validation, and API integration.

**Location**: `/resources/admin/js/composables/useSiteConfig.ts`

**Import**:
```typescript
import { useSiteConfig } from '@admin/composables/useSiteConfig';
```

**Returns**:
- `config` (Ref) - The current site configuration object
- `loading` (Ref) - Loading state when fetching config
- `saving` (Ref) - Saving state when updating config
- `error` (Ref) - General error message
- `validationErrors` (Ref) - Field-specific validation errors
- `fetchConfig()` - Fetch configuration from API
- `updateConfig(data)` - Update configuration
- `clearValidationErrors()` - Clear all validation errors
- `getFieldError(fieldName)` - Get error message for a field
- `hasFieldError(fieldName)` - Check if field has errors

**Usage**:

### Basic Usage
```typescript
const {
  config,
  loading,
  saving,
  error,
  fetchConfig,
  updateConfig,
} = useSiteConfig();

// Fetch configuration
await fetchConfig();
console.log(config.value?.app_name);

// Update configuration
const success = await updateConfig({
  app_name: 'My Application',
  app_url: 'https://myapp.com',
  support_email: 'support@myapp.com',
});

if (success) {
  // Show success message
} else {
  // Show error.value or check validationErrors.value
}
```

### With Validation Errors
```typescript
const {
  updateConfig,
  validationErrors,
  getFieldError,
  hasFieldError,
  clearValidationErrors,
} = useSiteConfig();

const form = ref({
  app_name: '',
  app_url: '',
});

const handleSubmit = async () => {
  clearValidationErrors();

  const success = await updateConfig(form.value);

  if (!success) {
    // Check for field-specific errors
    if (hasFieldError('app_name')) {
      const errorMsg = getFieldError('app_name');
      // Display error under the app_name input
    }
  }
};
```

### In Templates
```vue
<template>
  <div>
    <div v-if="loading">Loading configuration...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <input
        v-model="form.app_name"
        :class="{ 'error': hasFieldError('app_name') }"
      />
      <span v-if="hasFieldError('app_name')" class="error-text">
        {{ getFieldError('app_name') }}
      </span>

      <button @click="handleSubmit" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </div>
</template>
```

**When to Use**:
- Site configuration management views
- Settings pages
- Any component that needs to read or update global site settings
- Forms that modify site configuration

**Error Handling**:
- Validation errors from the backend are automatically mapped to `validationErrors`
- Use `getFieldError(fieldName)` to display errors next to form fields
- Use `hasFieldError(fieldName)` to conditionally apply error styling
- General errors are available in the `error` ref

**Components Using This**:
- `SiteConfigView.vue`
- `SiteConfigForm.vue`

---

## Best Practices

### 1. Import Only What You Need
```typescript
// Good - Destructure only what you need
const { formatDate } = useDateFormatter();

// Avoid - Importing the whole object
const dateFormatter = useDateFormatter();
const formatted = dateFormatter.formatDate(date);
```

### 2. Combine Composables
```typescript
// Combine multiple composables in a single component
const { formatDate } = useDateFormatter();
const { getFullName, getUserInitials } = useNameHelpers();
const { getStatusLabel, getStatusVariant } = useStatusHelpers();

const displayUser = (user: User) => ({
  name: getFullName(user),
  initials: getUserInitials(user),
  status: getStatusLabel(user.status),
  createdAt: formatDate(user.created_at),
});
```

### 3. Use Type Safety
All composables are fully typed. Use TypeScript to get autocomplete and type checking:
```typescript
import type { AdminRole } from '@admin/types/admin';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

const { hasRoleAccess } = useRoleHelpers();
const role: AdminRole = 'admin'; // Type-safe
```

### 4. Handle Edge Cases
Composables handle common edge cases (null, undefined, invalid data), but always validate input:
```typescript
const { formatDate } = useDateFormatter();

// Safe - handles null
formatDate(user.last_login_at); // "Never" if null

// But check for user existence first
if (user) {
  const date = formatDate(user.created_at);
}
```

### 5. Reactive State
When using composables like `useSiteConfig` that return refs, remember they're reactive:
```typescript
const { config, loading } = useSiteConfig();

// Watch for changes
watch(config, (newConfig) => {
  console.log('Config updated:', newConfig);
});

// Use in computed properties
const appTitle = computed(() => config.value?.app_name || 'Admin Dashboard');
```

### 6. Consistent Naming
Use the `use` prefix for all composables:
```typescript
// Good
useAuth()
useApi()
useValidation()

// Bad
authHelper()
apiService()
validateForm()
```

### 7. Single Responsibility
Each composable should have a single, well-defined purpose:
```typescript
// Good - Each composable has one focus
useDateFormatter() // Only handles date formatting
useNameHelpers()   // Only handles name operations

// Bad - Composable doing too much
useUserManagement() // Handles dates, names, status, roles, etc.
```

---

## Testing

All composables have comprehensive test files in the `__tests__/` directory. When adding new composables:

### Test Coverage Requirements
1. Test all exported functions
2. Test edge cases (null, undefined, empty strings, invalid inputs)
3. Test error handling
4. Test type safety (if applicable)
5. Aim for 100% code coverage

### Running Tests
```bash
# Run all composable tests
npm run test:admin -- composables

# Run specific composable tests
npm run test:admin -- useDateFormatter
npm run test:admin -- useRoleHelpers

# Run with coverage
npm run test:coverage -- composables
```

### Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { useDateFormatter } from '../useDateFormatter';

describe('useDateFormatter', () => {
  const { formatDate } = useDateFormatter();

  describe('formatDate', () => {
    it('formats dates correctly with default format', () => {
      expect(formatDate('2025-08-03T16:43:00Z')).toContain('Aug');
    });

    it('handles null values', () => {
      expect(formatDate(null)).toBe('Never');
    });

    it('handles undefined values', () => {
      expect(formatDate(undefined)).toBe('Never');
    });

    it('handles invalid date strings', () => {
      expect(formatDate('invalid')).toBe('Invalid date');
    });

    it('supports custom format strings', () => {
      const result = formatDate('2025-08-03T16:43:00Z', 'yyyy-MM-dd');
      expect(result).toBe('2025-08-03');
    });
  });
});
```

---

## Adding New Composables

When creating a new composable, follow these steps:

### 1. Create the File
```typescript
// composables/useMyFeature.ts
/**
 * Composable for [description]
 *
 * @returns [description of return value]
 *
 * @example
 * ```typescript
 * const { myFunction } = useMyFeature();
 * myFunction('example');
 * ```
 */
export function useMyFeature() {
  /**
   * [Description of what this function does]
   *
   * @param param - [description]
   * @returns [description]
   */
  const myFunction = (param: string): string => {
    // Implementation
    return result;
  };

  return {
    myFunction,
  };
}
```

### 2. Add TypeScript Types
```typescript
import type { MyType } from '@admin/types/myTypes';

export interface MyFeatureOptions {
  option1: string;
  option2?: number;
}

export function useMyFeature(options?: MyFeatureOptions) {
  // Implementation
}
```

### 3. Create Tests
```typescript
// __tests__/useMyFeature.spec.ts
import { describe, it, expect } from 'vitest';
import { useMyFeature } from '../useMyFeature';

describe('useMyFeature', () => {
  it('works correctly', () => {
    const { myFunction } = useMyFeature();
    expect(myFunction('test')).toBe('expected result');
  });
});
```

### 4. Update This README
Add a new section with:
- Purpose
- Location
- Import statement
- API documentation
- Usage examples
- When to use it
- Components using it

### 5. Checklist
- [ ] File created with proper naming (`use` prefix)
- [ ] JSDoc comments added
- [ ] TypeScript types defined
- [ ] Tests created and passing
- [ ] README updated
- [ ] Used in at least one component
- [ ] Peer reviewed

---

## Questions or Issues?

If you have questions about any composable or need help implementing new ones:

1. Check the inline JSDoc comments in the source files
2. Review the test files for more usage examples
3. Check existing component implementations
4. Consult the main project documentation in `/docs`
5. Ask the team in the development channel

---

## Related Documentation

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [VueUse Composables](https://vueuse.org/) - External composable library we use
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vitest Testing Guide](https://vitest.dev/guide/)
