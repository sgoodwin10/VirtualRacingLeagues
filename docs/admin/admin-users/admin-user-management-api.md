# Admin User Management API Documentation

This guide provides comprehensive documentation for the admin user management API endpoints.

## Overview

The Admin User Management API allows privileged administrators to manage other admin users within the system. The API enforces a strict role-based hierarchy to ensure proper access control.

## Role Hierarchy

The system implements a three-tier role hierarchy:

1. **Super Admin** (highest privilege)
   - Can manage all admin users including other super admins
   - Can assign any role (super_admin, admin, moderator)
   - Full access to all endpoints

2. **Admin** (medium privilege)
   - Can manage admin and moderator users only
   - Cannot view, edit, or delete super admin users
   - Can assign admin and moderator roles only

3. **Moderator** (lowest privilege)
   - Cannot access admin user management endpoints
   - Will receive 403 Forbidden for all admin management requests

## Authentication

All endpoints require authentication using the `admin` guard. Include the session cookie in your requests.

```bash
# Example authenticated request
curl -X GET http://localhost/api/admin/admin-users \
  -H "Cookie: laravel_session=YOUR_SESSION_COOKIE" \
  -H "Accept: application/json"
```

## Endpoints

### 1. List Admin Users

Retrieve a paginated list of admin users with optional filtering, searching, and sorting.

**Endpoint:** `GET /api/admin/admin-users`

**Authorization:**
- Super Admin: Can see all users
- Admin: Can see only admin and moderator users
- Moderator: 403 Forbidden

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | null | Search by ID, first name, last name, or email |
| `status` | string | both | Filter by status: `active`, `inactive`, or `both` |
| `sort_by` | string | id | Sort column: `id`, `first_name`, `last_name`, `status`, `last_login_at` |
| `sort_order` | string | asc | Sort direction: `asc` or `desc` |
| `per_page` | integer | 25 | Results per page (1-100) |

**Example Requests:**

```bash
# Basic request
GET /api/admin/admin-users

# Search for users named "John"
GET /api/admin/admin-users?search=John

# Filter active users only
GET /api/admin/admin-users?status=active

# Sort by last login, most recent first
GET /api/admin/admin-users?sort_by=last_login_at&sort_order=desc

# Paginate with 50 items per page
GET /api/admin/admin-users?per_page=50

# Combined filters
GET /api/admin/admin-users?search=admin&status=active&sort_by=first_name&sort_order=asc&per_page=10
```

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "role": "admin",
      "status": "active",
      "last_login_at": "2025-10-13T10:30:00.000000Z",
      "created_at": "2025-10-01T08:00:00.000000Z",
      "updated_at": "2025-10-13T10:30:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "per_page": 25,
    "to": 25,
    "total": 67
  },
  "links": {
    "first": "http://localhost/api/admin/admin-users?page=1",
    "last": "http://localhost/api/admin/admin-users?page=3",
    "prev": null,
    "next": "http://localhost/api/admin/admin-users?page=2"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "message": "Forbidden. Moderators do not have access to admin user management."
}
```

---

### 2. Get Single Admin User

Retrieve detailed information about a specific admin user.

**Endpoint:** `GET /api/admin/admin-users/{id}`

**Authorization:**
- Super Admin: Can view any user
- Admin: Can view admin and moderator users only
- Moderator: 403 Forbidden

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The admin user ID |

**Example Request:**

```bash
GET /api/admin/admin-users/5
```

**Success Response (200 OK):**

```json
{
  "data": {
    "id": 5,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "role": "admin",
    "status": "active",
    "last_login_at": "2025-10-12T14:22:00.000000Z",
    "created_at": "2025-09-15T09:00:00.000000Z",
    "updated_at": "2025-10-12T14:22:00.000000Z"
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "message": "Admin user not found."
}

// 403 Forbidden (trying to view super admin as admin)
{
  "message": "Forbidden. You do not have permission to view this admin user."
}
```

---

### 3. Update Admin User

Update an existing admin user's information.

**Endpoint:** `PUT /api/admin/admin-users/{id}` or `PATCH /api/admin/admin-users/{id}`

**Authorization:**
- Super Admin: Can update any user and assign any role
- Admin: Can update admin and moderator users, assign admin/moderator roles only
- Moderator: 403 Forbidden

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The admin user ID |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `first_name` | string | No | Max 255 characters |
| `last_name` | string | No | Max 255 characters |
| `email` | string | No | Valid email, unique, max 255 characters |
| `role` | string | No | One of: `super_admin`, `admin`, `moderator` |

**Example Requests:**

```bash
# Update first name only
PUT /api/admin/admin-users/5
Content-Type: application/json

{
  "first_name": "Janet"
}

# Update multiple fields
PUT /api/admin/admin-users/5
Content-Type: application/json

{
  "first_name": "Janet",
  "last_name": "Johnson",
  "email": "janet.johnson@example.com"
}

# Change user role
PUT /api/admin/admin-users/5
Content-Type: application/json

{
  "role": "moderator"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Admin user updated successfully.",
  "data": {
    "id": 5,
    "first_name": "Janet",
    "last_name": "Johnson",
    "email": "janet.johnson@example.com",
    "role": "moderator",
    "status": "active",
    "last_login_at": "2025-10-12T14:22:00.000000Z",
    "created_at": "2025-09-15T09:00:00.000000Z",
    "updated_at": "2025-10-13T11:45:00.000000Z"
  }
}
```

**Error Responses:**

```json
// 422 Validation Error
{
  "message": "The email has already been taken.",
  "errors": {
    "email": [
      "The email has already been taken."
    ]
  }
}

// 403 Forbidden (admin trying to assign super_admin role)
{
  "message": "Forbidden. You do not have permission to assign this role.",
  "errors": {
    "role": [
      "You cannot assign a role higher than or equal to your own role."
    ]
  }
}

// 403 Forbidden (admin trying to update super admin)
{
  "message": "Forbidden. You do not have permission to update this admin user."
}

// 404 Not Found
{
  "message": "Admin user not found."
}
```

---

### 4. Delete Admin User

Soft delete an admin user by marking them as inactive. This does not permanently delete the user from the database.

**Endpoint:** `DELETE /api/admin/admin-users/{id}`

**Authorization:**
- Super Admin: Can delete any user (except themselves)
- Admin: Can delete admin and moderator users only (except themselves)
- Moderator: 403 Forbidden

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The admin user ID |

**Example Request:**

```bash
DELETE /api/admin/admin-users/5
```

**Success Response (200 OK):**

```json
{
  "message": "Admin user deleted successfully."
}
```

**Error Responses:**

```json
// 422 Unprocessable Entity (trying to delete self)
{
  "message": "You cannot delete your own account.",
  "errors": {
    "id": [
      "You cannot delete your own account."
    ]
  }
}

// 403 Forbidden (admin trying to delete super admin)
{
  "message": "Forbidden. You do not have permission to delete this admin user."
}

// 404 Not Found
{
  "message": "Admin user not found."
}
```

---

## Permission Matrix

| Action | Super Admin | Admin | Moderator |
|--------|-------------|-------|-----------|
| List all users | Yes | Admin/Moderator only | No |
| View super_admin | Yes | No | No |
| View admin | Yes | Yes | No |
| View moderator | Yes | Yes | No |
| Update super_admin | Yes | No | No |
| Update admin | Yes | Yes | No |
| Update moderator | Yes | Yes | No |
| Assign super_admin role | Yes | No | No |
| Assign admin role | Yes | Yes | No |
| Assign moderator role | Yes | Yes | No |
| Delete super_admin | Yes | No | No |
| Delete admin | Yes | Yes | No |
| Delete moderator | Yes | Yes | No |
| Delete self | No | No | No |

## Error Handling

The API returns standard HTTP status codes:

- **200 OK**: Request successful
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Authenticated but lacks permission
- **404 Not Found**: Resource doesn't exist
- **422 Unprocessable Entity**: Validation failed

All error responses follow this structure:

```json
{
  "message": "Human-readable error message",
  "errors": {
    "field_name": [
      "Detailed error message"
    ]
  }
}
```

## Testing

Comprehensive PHPUnit tests are available at:
`tests/Feature/Admin/AdminUserControllerTest.php`

Run tests with:

```bash
php artisan test --filter AdminUserControllerTest
```

## Implementation Files

- **Controller**: `app/Http/Controllers/Admin/AdminUserController.php`
- **Form Request**: `app/Http/Requests/Admin/UpdateAdminUserRequest.php`
- **Model**: `app/Models/Admin.php`
- **Routes**: `routes/api.php`
- **Tests**: `tests/Feature/Admin/AdminUserControllerTest.php`
- **Factory**: `database/factories/AdminFactory.php`
- **Config**: `config/admin_permissions.php`

## Security Considerations

1. **Role Hierarchy**: The system enforces strict role hierarchy to prevent privilege escalation
2. **Self-Management**: Users cannot delete themselves to prevent accidental lockouts
3. **Soft Deletes**: Deletions mark users as inactive rather than permanently removing them
4. **Authentication**: All endpoints require valid admin authentication
5. **Validation**: All inputs are validated and sanitized
6. **Email Uniqueness**: Email addresses must be unique across all admin users

## Examples Using JavaScript/Axios

```javascript
// List admin users with filters
const listAdmins = async () => {
  const response = await axios.get('/api/admin/admin-users', {
    params: {
      search: 'john',
      status: 'active',
      sort_by: 'first_name',
      sort_order: 'asc',
      per_page: 25
    }
  });
  return response.data;
};

// Get single admin user
const getAdmin = async (id) => {
  const response = await axios.get(`/api/admin/admin-users/${id}`);
  return response.data;
};

// Update admin user
const updateAdmin = async (id, data) => {
  const response = await axios.put(`/api/admin/admin-users/${id}`, data);
  return response.data;
};

// Delete admin user
const deleteAdmin = async (id) => {
  const response = await axios.delete(`/api/admin/admin-users/${id}`);
  return response.data;
};
```

## Notes

- All timestamps are returned in ISO 8601 format (UTC)
- Pagination follows Laravel's standard pagination format
- The `last_login_at` field is automatically updated when admins log in
- Status can only be `active` or `inactive`
- Role can only be `super_admin`, `admin`, or `moderator`
