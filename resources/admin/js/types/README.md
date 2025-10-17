# Admin Dashboard Type Definitions

This directory contains TypeScript type definitions for the admin dashboard application.

## Files

### `admin.ts`
Contains type definitions for admin users, including:
- `Admin` - Admin user interface
- `AdminRole` - Admin role types (super_admin, admin, moderator)
- `AdminStatus` - Admin status types (active, inactive)
- `AdminUserUpdateData` - Data structure for updating admin users

### `user.ts`
Contains type definitions for regular users, including:
- `User` - User interface
- `UserStatus` - User status types (active, inactive, suspended)
- `CreateUserData` - Data structure for creating new users
- `UpdateUserData` - Data structure for updating users

### `siteConfig.ts`
Contains type definitions for site configuration, including:
- `SiteConfig` - Site configuration interface
- `SiteConfigFile` - File upload interface
- `SiteConfigFileType` - File type definitions
- Validation rules for file uploads

### `activityLog.ts`
Contains type definitions for activity logging, including:
- `ActivityLog` - Activity log entry interface
- `ActivityLogActor` - Actor information for activity logs
- Query parameters for fetching activity logs

### `errors.ts`
Contains type definitions for error handling, including:
- `ApiError` - Standard API error interface
- `ValidationError` - Laravel validation error structure
- Error type guards and utilities

### `primevue.ts` ⭐ NEW
Contains comprehensive type definitions for PrimeVue component events, providing type safety when working with PrimeVue components.

## Using PrimeVue Types

The `primevue.ts` file contains TypeScript interfaces for all common PrimeVue component events. This improves type safety and developer experience when working with PrimeVue components.

### Import Types

```typescript
import type {
  DataTablePageEvent,
  DataTableSortEvent,
  DataTableFilterEvent,
  DropdownChangeEvent,
  CalendarChangeEvent,
  CheckboxChangeEvent,
  InputSwitchChangeEvent,
} from '@admin/types/primevue';
```

### Common Use Cases

#### 1. DataTable Pagination

```typescript
import type { DataTablePageEvent } from '@admin/types/primevue';

const onPage = (event: DataTablePageEvent): void => {
  // event.page is 0-based
  currentPage.value = event.page + 1;
  rowsPerPage.value = event.rows;
  loadData();
};
```

**Event Properties:**
- `page: number` - Current page index (0-based)
- `first: number` - Index of first row on page
- `rows: number` - Number of rows per page
- `pageCount: number` - Total number of pages

#### 2. DataTable Sorting

```typescript
import type { DataTableSortEvent } from '@admin/types/primevue';

const onSort = (event: DataTableSortEvent): void => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder; // 1 for asc, -1 for desc
  loadData();
};
```

**Event Properties:**
- `sortField: string` - Field name to sort by
- `sortOrder: 1 | -1 | 0` - Sort direction
- `multiSortMeta?: Array<{field: string, order: 1 | -1}>` - For multi-column sorting

#### 3. Dropdown/Select Changes

```typescript
import type { DropdownChangeEvent } from '@admin/types/primevue';

// With simple value
const onStatusChange = (event: DropdownChangeEvent<string>): void => {
  selectedStatus.value = event.value;
};

// With object value
interface RoleOption {
  label: string;
  value: string;
}

const onRoleChange = (event: DropdownChangeEvent<RoleOption>): void => {
  selectedRole.value = event.value.value;
};
```

**Event Properties:**
- `originalEvent: Event` - Original browser event
- `value: T` - Selected value (generic type)

#### 4. DataTable Row Events

```typescript
import type { DataTableRowClickEvent, DataTableRowSelectEvent } from '@admin/types/primevue';

interface User {
  id: number;
  name: string;
  email: string;
}

const onRowClick = (event: DataTableRowClickEvent<User>): void => {
  console.log('Clicked user:', event.data.name);
  console.log('Row index:', event.index);
};

const onRowSelect = (event: DataTableRowSelectEvent<User>): void => {
  selectedUsers.value.push(event.data);
};
```

#### 5. Calendar Date Selection

```typescript
import type { CalendarChangeEvent } from '@admin/types/primevue';

// Single date
const onDateChange = (event: CalendarChangeEvent): void => {
  if (event.value instanceof Date) {
    selectedDate.value = event.value;
  }
};

// Date range
const onRangeChange = (event: CalendarChangeEvent): void => {
  if (Array.isArray(event.value)) {
    startDate.value = event.value[0];
    endDate.value = event.value[1];
  }
};
```

#### 6. Checkbox and Switch Components

```typescript
import type { CheckboxChangeEvent, InputSwitchChangeEvent } from '@admin/types/primevue';

const onCheckboxChange = (event: CheckboxChangeEvent): void => {
  isChecked.value = event.checked;
};

const onSwitchChange = (event: InputSwitchChangeEvent): void => {
  isEnabled.value = event.value;
};
```

### Component Emit Types

Use these types in your component's emit definitions:

```typescript
import type { DataTablePageEvent } from '@admin/types/primevue';

interface TableEmits {
  (event: 'page', pageEvent: DataTablePageEvent): void;
  (event: 'sort', sortEvent: DataTableSortEvent): void;
  (event: 'filter', filterEvent: DataTableFilterEvent): void;
}

const emit = defineEmits<TableEmits>();

const handlePage = (event: DataTablePageEvent): void => {
  emit('page', event);
};
```

### Complete Example

Here's a complete example of a paginated data table component:

```vue
<template>
  <DataTable
    :value="users"
    :loading="loading"
    :rows="rowsPerPage"
    :paginator="true"
    :total-records="totalRecords"
    :lazy="true"
    @page="onPage"
    @sort="onSort"
  >
    <Column field="name" header="Name" :sortable="true" />
    <Column field="email" header="Email" :sortable="true" />
  </DataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import type { DataTablePageEvent, DataTableSortEvent } from '@admin/types/primevue';
import type { User } from '@admin/types/user';

// State
const users = ref<User[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const totalRecords = ref(0);
const sortField = ref('name');
const sortOrder = ref<1 | -1>(1);

// Event handlers with proper types
const onPage = (event: DataTablePageEvent): void => {
  currentPage.value = event.page + 1;
  rowsPerPage.value = event.rows;
  loadUsers();
};

const onSort = (event: DataTableSortEvent): void => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder === 1 ? 1 : -1;
  loadUsers();
};

const loadUsers = async (): Promise<void> => {
  loading.value = true;
  try {
    // Fetch users with pagination and sorting
    const response = await userService.getUsers({
      page: currentPage.value,
      perPage: rowsPerPage.value,
      sortBy: sortField.value,
      sortOrder: sortOrder.value === 1 ? 'asc' : 'desc',
    });
    users.value = response.data;
    totalRecords.value = response.meta.total;
  } finally {
    loading.value = false;
  }
};
</script>
```

## Available Event Types

| Event Type | Use Case | Component(s) |
|------------|----------|--------------|
| `DataTablePageEvent` | Pagination changes | DataTable |
| `DataTableSortEvent` | Column sorting | DataTable |
| `DataTableFilterEvent` | Filtering data | DataTable |
| `DataTableRowClickEvent<T>` | Row click events | DataTable |
| `DataTableRowSelectEvent<T>` | Row selection | DataTable |
| `DropdownChangeEvent<T>` | Dropdown/Select changes | Dropdown, Select |
| `CalendarChangeEvent` | Date selection | Calendar |
| `CheckboxChangeEvent` | Checkbox toggle | Checkbox |
| `RadioButtonChangeEvent` | Radio selection | RadioButton |
| `InputSwitchChangeEvent` | Switch toggle | InputSwitch |
| `TabViewChangeEvent` | Tab changes | TabView |
| `DialogHideEvent` | Dialog close | Dialog |
| `FileUploadSelectEvent` | File selection | FileUpload |
| `MenuItemClickEvent` | Menu item clicks | Menu, Menubar |

## Generic Types

Some event types support generics for better type safety:

```typescript
// DataTable events with custom data types
DataTableRowClickEvent<User>
DataTableRowSelectEvent<Admin>

// Dropdown with specific value types
DropdownChangeEvent<string>
DropdownChangeEvent<RoleOption>
DropdownChangeEvent<'active' | 'inactive' | 'suspended'>
```

## Benefits

1. **Type Safety**: Catch errors at compile time instead of runtime
2. **IntelliSense**: Get autocomplete suggestions for event properties
3. **Documentation**: Event types serve as inline documentation
4. **Refactoring**: Safely refactor code with confidence
5. **Consistency**: Ensure consistent event handling across components

## Testing

All event types are thoroughly tested. See `__tests__/primevue.spec.ts` for comprehensive test coverage.

## Contributing

When adding new PrimeVue components:

1. Check if an event type already exists in `primevue.ts`
2. If not, add a new interface following the existing patterns
3. Add JSDoc comments with usage examples
4. Update this README with the new type
5. Add tests in `__tests__/primevue.spec.ts`

## See Also

- [PrimeVue Documentation](https://primevue.org/)
- [Vue 3 TypeScript Guide](https://vuejs.org/guide/typescript/overview.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
