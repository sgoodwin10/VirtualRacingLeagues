# User Management

**Location:** Admin Dashboard > Users (`/users`)

## Overview

The User Management feature allows administrators to view, create, edit, and manage all end-user accounts in the system. Every action is logged for audit purposes.

## Access Requirements

**Permissions:**
- Available to all admin roles (Super Admin, Admin, Moderator)
- Moderators have read-only access (future enhancement)

**Navigation:**
- Sidebar: Click "Users"
- Direct URL: `http://your-domain.localhost/users`

## Features

### 1. View Users

The main view displays all users in a paginated DataTable with the following information:
- **Name** - User's full name (sortable)
- **Email** - User's email address (sortable)
- **Alias** - User's display name/username (sortable)
- **Status** - Current account status with color coding:
  - 🟢 Active (green) - User can authenticate
  - ⚫ Inactive (gray) - User account is deactivated
  - 🔴 Suspended (red) - User is temporarily blocked
- **Created Date** - When the user account was created (sortable)
- **Actions** - Quick action buttons

### 2. Search and Filter

**Search Bar:**
- Searches across: name, email, and alias
- Real-time filtering as you type
- Case-insensitive search

**Status Filter:**
- Filter by: All, Active, Inactive, or Suspended
- Dropdown selection
- Combines with search filter

**Sorting:**
- Click any column header to sort
- Toggle between ascending/descending order

**Pagination:**
- Choose 10, 25, or 50 users per page
- Navigate between pages using pagination controls

### 3. View User Details

**How to Access:**
- Click the eye icon (👁️) in the Actions column

**Information Displayed:**
- All user details (name, email, alias, status)
- Email verification status
- Account creation and last update dates
- Activity log showing recent changes

**Activity Log:**
- Displays the last 50 activities
- Shows what was changed and when
- Identifies which admin made the change
- Timeline format for easy reading

### 4. Create New User

**How to Access:**
- Click "Create User" button (green button in top-right)

**Required Fields:**
- **Name*** - User's full name
- **Email*** - Must be unique, valid email format
- **Password*** - Minimum 8 characters

**Optional Fields:**
- **Alias** - Display name or username
- **Status** - Choose: Active (default), Inactive, or Suspended

**Process:**
1. Fill in the form
2. Click "Create" button
3. Success notification appears
4. User is added to the table
5. Activity log records the creation with admin details

**Validation:**
- Email must be unique across all users
- Password must be at least 8 characters
- All required fields must be filled

### 5. Edit User

**How to Access:**
- Click the pencil icon (✏️) in the Actions column

**Editable Fields:**
- **Name** - User's full name
- **Email** - Must be unique (excluding current user)
- **Alias** - Display name or username
- **Password** - Leave blank to keep current password
- **Status** - Active, Inactive, or Suspended

**Process:**
1. Modal opens with pre-filled form
2. Modify desired fields
3. Click "Save" button
4. Success notification appears
5. Table updates with new information
6. Activity log records the change with before/after values

**Important Notes:**
- Leaving password field blank will NOT change the password
- Email uniqueness is checked server-side
- All changes are logged for audit purposes

### 6. Deactivate User

**How to Access:**
- Click the trash icon (🗑️) in the Actions column
- Only visible for active users

**Process:**
1. Confirmation dialog appears with user's name
2. Click "Yes" to confirm or "No" to cancel
3. User status changes to "Inactive"
4. User is soft deleted (not permanently removed)
5. Success notification appears
6. Restore button (🔄) appears for the user
7. Activity log records the deactivation

**Effects:**
- User cannot log in
- Data is preserved
- User can be restored later
- All activity logs are retained

### 7. Restore User

**How to Access:**
- Click the restore icon (🔄) in the Actions column
- Only visible for deactivated users

**Process:**
1. User is restored immediately (no confirmation)
2. User status changes to "Active"
3. User can log in again
4. Success notification appears
5. Delete button (🗑️) appears again
6. Activity log records the reactivation

## Activity Logging

All user management actions are automatically logged with the following details:

**Logged Actions:**
- User created
- User updated (with before/after values)
- User deactivated
- User reactivated
- Field changes (name, email, alias, status)

**Log Information:**
- Timestamp of action
- Admin who performed the action
- Type of action (created, updated, deleted, restored)
- Changed fields with old and new values
- User who was affected

**Viewing Activity Logs:**
- Activity logs are visible in the "View User" modal
- Last 50 activities are displayed
- Shown in timeline format
- Most recent activities appear first

## API Endpoints

All endpoints are under `/api/users` and require admin authentication.

### List Users
```
GET /api/users
```

**Query Parameters:**
- `search` - Search by name, email, or alias
- `status` - Filter by status (active, inactive, suspended)
- `include_deleted` - Include soft deleted users (boolean)
- `sort_field` - Field to sort by (default: created_at)
- `sort_order` - Sort order: asc or desc (default: desc)
- `per_page` - Results per page (optional)

### Get Single User
```
GET /api/users/{id}
```

Returns user details with last 50 activity logs.

### Create User
```
POST /api/users
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "alias": "johnd",
  "status": "active"
}
```

### Update User
```
PUT /api/users/{id}
```

**Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.new@example.com",
  "password": "newpassword",
  "alias": "johnnyD",
  "status": "active"
}
```

Note: All fields are optional. Omit `password` to keep current password.

### Delete User (Soft Delete)
```
DELETE /api/users/{id}
```

Sets status to inactive and soft deletes the user.

### Restore User
```
POST /api/users/{id}/restore
```

Restores soft deleted user and sets status to active.

## User States

### Active
- User can log in and use the system
- Default status for new users
- Green tag in the interface

### Inactive
- User cannot log in
- Usually set when deactivating a user
- Can be reactivated
- Gray tag in the interface

### Suspended
- User is temporarily blocked
- Can be used for moderation purposes
- Can be reactivated by changing status
- Red tag in the interface

## Validation Rules

**Name:**
- Required
- Maximum 255 characters
- String type

**Email:**
- Required
- Must be valid email format
- Must be unique across all users
- Maximum 255 characters

**Password:**
- Required on creation
- Optional on update (blank = no change)
- Minimum 8 characters
- Automatically hashed using bcrypt

**Alias:**
- Optional
- Maximum 255 characters
- String type

**Status:**
- Optional (defaults to 'active' on creation)
- Must be one of: active, inactive, suspended
- Enum type

## Best Practices

### When to Create Users
- Manual registration by admin
- Bulk import scenarios
- Testing purposes
- Special access requirements

### When to Deactivate Users
- User requested account closure
- Violation of terms of service
- Inactive accounts (after warning)
- Security concerns

### When to Suspend Users
- Temporary ban for rule violations
- Investigation pending
- Payment issues (if applicable)
- Short-term access restriction

### When to Restore Users
- Issue resolved
- Ban period expired
- Mistake in deactivation
- User requested reactivation

## Troubleshooting

### "Email has already been taken"
- Another user already has this email
- Check if a soft-deleted user has this email
- Use search to find the existing user

### User List Not Loading
- Check your authentication status
- Ensure you have admin permissions
- Check browser console for errors
- Verify backend API is running

### Changes Not Saving
- Check validation errors (red text in form)
- Ensure all required fields are filled
- Verify password meets minimum length (8 chars)
- Check server logs for backend errors

### Activity Logs Not Showing
- Logs are created automatically
- Check if user has any changes
- Only last 50 activities are shown
- Older logs exist in database but aren't displayed

## Technical Details

**Database Table:** `users`

**Key Fields:**
- `id` (UUID) - Primary key
- `name` (string) - User's name
- `email` (string, unique) - Email address
- `password` (hashed string) - Authentication
- `alias` (string, nullable) - Display name
- `uuid` (UUID, nullable) - External identifier
- `status` (enum) - Account status
- `email_verified_at` (timestamp, nullable) - Verification status
- `created_at` (timestamp) - Creation date
- `updated_at` (timestamp) - Last modification
- `deleted_at` (timestamp, nullable) - Soft delete marker

**Relationships:**
- Has many activity logs via `activities` relationship
- Uses `users` table (separate from `admins` table)

**Security:**
- All routes require `auth:admin` middleware
- Passwords are hashed with bcrypt
- CSRF protection on all mutations
- SQL injection prevented via Eloquent ORM
- XSS protection via Vue auto-escaping

## Related Documentation

- [Admin Users Management](./admin-users.md) - Managing administrator accounts
- [Activity Logs](../activity-logs/activity-logs.md) - Complete activity log system
- [Admin Authentication](./admin-authentication.md) - Admin login system
- [API Documentation](../api/user-management.md) - Detailed API specifications

## Future Enhancements

Planned features for future releases:
- Role-based permissions (Moderator read-only access)
- Bulk operations (delete, activate multiple users)
- Export functionality (CSV, Excel)
- Advanced filters (date range, email verified)
- Email verification flow
- Password reset functionality
- User impersonation for admins
- User activity dashboard

## Support

For issues or questions:
- Check this documentation first
- Review browser console for errors
- Check Laravel logs at `storage/logs/laravel.log`
- Contact system administrator
