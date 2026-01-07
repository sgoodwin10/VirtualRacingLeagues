# Edit League Modal - Backend Implementation Plan

## Agent: `dev-be`

This document outlines the backend considerations for the Edit League Modal feature.

## Current Backend Status

The existing backend API fully supports the Edit League Modal functionality. **No backend changes are required** for the initial implementation.

## Existing API Endpoints

### League CRUD Operations

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| GET | `/api/leagues` | `LeagueController@index` | List user's leagues |
| POST | `/api/leagues` | `LeagueController@store` | Create new league |
| GET | `/api/leagues/{id}` | `LeagueController@show` | Get league details |
| PUT | `/api/leagues/{id}` | `LeagueController@update` | Update league |
| DELETE | `/api/leagues/{id}` | `LeagueController@destroy` | Delete league |

### Supporting Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | `/api/leagues/check-slug` | `LeagueController@checkSlug` | Validate slug availability |
| GET | `/api/platforms` | `PlatformController@index` | Get all platforms |
| GET | `/api/timezones` | `TimezoneController@index` | Get all timezones |

## Data Transfer Objects (DTOs)

### CreateLeagueData

**File:** `app/Application/League/DTOs/CreateLeagueData.php`

```php
class CreateLeagueData extends Data
{
    public function __construct(
        public string $name,
        public array $platform_ids,
        public string $visibility = 'public',
        public ?string $timezone = null,
        public ?string $tagline = null,
        public ?string $description = null,
        public ?UploadedFile $logo = null,
        public ?UploadedFile $banner = null,
        public ?UploadedFile $header_image = null,
        public ?string $contact_email = null,
        public ?string $organizer_name = null,
        public ?string $discord_url = null,
        public ?string $website_url = null,
        public ?string $twitter_handle = null,
        public ?string $instagram_handle = null,
        public ?string $youtube_url = null,
        public ?string $twitch_url = null,
    ) {}
}
```

### UpdateLeagueData

**File:** `app/Application/League/DTOs/UpdateLeagueData.php`

```php
class UpdateLeagueData extends Data
{
    public function __construct(
        public ?string $name = null,
        public ?array $platform_ids = null,
        public ?string $visibility = null,
        public ?string $timezone = null,
        public ?string $tagline = null,
        public ?string $description = null,
        public ?UploadedFile $logo = null,
        public ?UploadedFile $banner = null,
        public ?UploadedFile $header_image = null,
        public ?string $contact_email = null,
        public ?string $organizer_name = null,
        public ?string $discord_url = null,
        public ?string $website_url = null,
        public ?string $twitter_handle = null,
        public ?string $instagram_handle = null,
        public ?string $youtube_url = null,
        public ?string $twitch_url = null,
    ) {}
}
```

## Request Validation

### CreateLeagueRequest

**File:** `app/Http/Requests/User/CreateLeagueRequest.php`

Existing validation rules:
- `name`: required, string, max:255
- `platform_ids`: required, array, min:1
- `platform_ids.*`: exists:platforms,id
- `visibility`: in:public,private,unlisted
- `timezone`: nullable, timezone
- `tagline`: nullable, string, max:150
- `description`: nullable, string
- `logo`: nullable, image, max:2048
- `banner`: nullable, image, max:2048
- `header_image`: nullable, image, max:2048
- `contact_email`: nullable, email
- `organizer_name`: nullable, string, max:100
- Social URLs: nullable, url or string validation

### UpdateLeagueRequest

**File:** `app/Http/Requests/User/UpdateLeagueRequest.php`

Same rules as CreateLeagueRequest but all fields optional.

### CheckSlugRequest

**File:** `app/Http/Requests/User/CheckSlugRequest.php`

```php
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'max:255'],
        'league_id' => ['nullable', 'integer', 'exists:leagues,id'],
    ];
}
```

## Response Format

### League Data Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Velocity Racing League",
    "slug": "velocity-racing-league",
    "tagline": "Where speed meets precision",
    "description": "<p>Welcome to VRL...</p>",
    "logo": {
      "original": "https://...",
      "thumbnail": "https://...",
      "medium": "https://..."
    },
    "banner": { ... },
    "header_image": { ... },
    "platform_ids": [1, 2],
    "platforms": [
      { "id": 1, "name": "PC", "slug": "pc" },
      { "id": 2, "name": "PlayStation", "slug": "playstation" }
    ],
    "visibility": "public",
    "timezone": "America/New_York",
    "contact_email": "contact@vrl.com",
    "organizer_name": "VRL Admin",
    "discord_url": "https://discord.gg/vrl",
    "website_url": "https://vrl.com",
    "twitter_handle": "vrl_racing",
    "instagram_handle": "vrl_racing",
    "youtube_url": "https://youtube.com/@vrl",
    "twitch_url": "https://twitch.tv/vrl",
    "owner_user_id": 1,
    "status": "active",
    "competitions_count": 5,
    "drivers_count": 120,
    "active_seasons_count": 2,
    "total_races_count": 45,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-03-20T14:45:00Z"
  },
  "message": "League retrieved successfully"
}
```

### Slug Check Response

```json
{
  "success": true,
  "data": {
    "available": true,
    "slug": "velocity-racing-league",
    "suggestion": null
  }
}
```

When slug is taken:
```json
{
  "success": true,
  "data": {
    "available": false,
    "slug": "velocity-racing-league",
    "suggestion": "velocity-racing-league-1"
  }
}
```

## Error Handling

### Validation Errors (422)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": ["The name field is required."],
    "platform_ids": ["Please select at least one platform."]
  }
}
```

### Authorization Errors (403)

```json
{
  "success": false,
  "message": "You are not authorized to edit this league."
}
```

### Not Found Errors (404)

```json
{
  "success": false,
  "message": "League not found."
}
```

## Future Enhancements (Out of Scope)

The following enhancements could be considered for future iterations:

### 1. Draft/Auto-save Support

```php
// New endpoint
POST /api/leagues/drafts
PUT /api/leagues/drafts/{id}
GET /api/leagues/drafts/{id}

// New DTO
class SaveLeagueDraftData extends Data
{
    public string $section; // 'basic', 'contact', 'media', 'social'
    public array $data;
}
```

### 2. Image Validation Enhancements

```php
// Enhanced image validation with dimension checks
'logo' => [
    'nullable',
    'image',
    'max:2048',
    'dimensions:min_width=400,min_height=400,max_width=2000,max_height=2000',
],
'banner' => [
    'nullable',
    'image',
    'max:2048',
    'dimensions:min_width=200,max_width=800,min_height=32,max_height=100',
],
'header_image' => [
    'nullable',
    'image',
    'max:2048',
    'dimensions:min_width=1200,max_width=2400,min_height=400,max_height=800',
],
```

### 3. Real-time Validation Endpoint

```php
// New endpoint for field-by-field validation
POST /api/leagues/validate-field

// Request
{
  "field": "contact_email",
  "value": "test@example.com"
}

// Response
{
  "valid": true,
  "message": null
}
```

## Testing Considerations

The existing backend tests in `tests/Feature/Http/Controllers/User/LeagueControllerTest.php` cover:

1. League creation with all fields
2. League update with partial data
3. Slug availability checking
4. Authorization (only owner can edit)
5. Validation error handling
6. Image upload handling

No additional backend tests are required for this feature.

## Summary

The backend is fully prepared to support the Edit League Modal. The frontend team can proceed with implementation using the existing API endpoints. All necessary validation, error handling, and response formatting is already in place.

### API Quick Reference for Frontend

```typescript
// Fetch league for editing
GET /api/leagues/{id}

// Update league
PUT /api/leagues/{id}
Content-Type: multipart/form-data

// Check slug availability
POST /api/leagues/check-slug
{ "name": "League Name", "league_id": 123 }

// Get platforms
GET /api/platforms

// Get timezones
GET /api/timezones
```
