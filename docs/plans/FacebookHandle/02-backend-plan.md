# Facebook Handle Feature - Backend Implementation Plan

## Overview

This document details the backend implementation for adding the `facebook_handle` field to the League entity, following the existing DDD architecture patterns.

---

## Step 1: Database Migration

### Create New Migration

**File**: `database/migrations/YYYY_MM_DD_XXXXXX_add_facebook_handle_to_leagues_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leagues', function (Blueprint $table) {
            $table->string('facebook_handle')->nullable()->after('twitch_url');
        });
    }

    public function down(): void
    {
        Schema::table('leagues', function (Blueprint $table) {
            $table->dropColumn('facebook_handle');
        });
    }
};
```

### Run Migration

```bash
php artisan migrate
```

---

## Step 2: Domain Layer

### Update Domain Entity

**File**: `app/Domain/League/Entities/League.php`

#### Changes:

1. **Add property to constructor** (line ~44, after `twitchUrl`):
```php
private ?string $facebookHandle,
```

2. **Update `create()` method** - add parameter and pass to constructor

3. **Update `reconstitute()` method** - add parameter and pass to constructor

4. **Add getter method**:
```php
public function facebookHandle(): ?string
{
    return $this->facebookHandle;
}
```

5. **Update `updateSocialMedia()` method** - add `$facebookHandle` parameter:
```php
public function updateSocialMedia(
    ?string $discordUrl,
    ?string $websiteUrl,
    ?string $twitterHandle,
    ?string $instagramHandle,
    ?string $youtubeUrl,
    ?string $twitchUrl,
    ?string $facebookHandle
): void {
    $this->discordUrl = $discordUrl;
    $this->websiteUrl = $websiteUrl;
    $this->twitterHandle = $twitterHandle;
    $this->instagramHandle = $instagramHandle;
    $this->youtubeUrl = $youtubeUrl;
    $this->twitchUrl = $twitchUrl;
    $this->facebookHandle = $facebookHandle;
    $this->recordEvent(new LeagueUpdated($this));
}
```

---

## Step 3: Infrastructure Layer

### Update Eloquent Model

**File**: `app/Infrastructure/Persistence/Eloquent/Models/League.php`

#### Changes:

1. **Add to PHPDoc** (around line 36):
```php
 * @property string|null $facebook_handle
```

2. **Add to `$fillable` array** (after `twitch_url`):
```php
'facebook_handle',
```

3. **Add PHPStan method annotation**:
```php
 * @method static \Illuminate\Database\Eloquent\Builder<static>|League whereFacebookHandle($value)
```

### Update Repository

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueRepository.php`

#### Changes:

1. **Update `toDomainEntity()` method** - pass `facebook_handle` to `reconstitute()`

2. **Update `save()` method** - include `facebook_handle` in the data array:
```php
'facebook_handle' => $league->facebookHandle(),
```

---

## Step 4: Application Layer

### Update DTOs

#### File: `app/Application/League/DTOs/LeagueData.php`

Add property after `twitch_url`:
```php
public readonly ?string $facebook_handle,
```

Update `fromEntity()` method to include:
```php
facebook_handle: $league->facebookHandle(),
```

#### File: `app/Application/League/DTOs/CreateLeagueData.php`

Add property after `twitch_url`:
```php
#[Sometimes, Max(100)]
public readonly ?string $facebook_handle = null,
```

#### File: `app/Application/League/DTOs/UpdateLeagueData.php`

Add property after `twitch_url`:
```php
#[Sometimes, Max(100)]
public readonly ?string $facebook_handle = null,
```

### Update Application Service

**File**: `app/Application/League/Services/LeagueApplicationService.php`

#### Changes:

1. **Update `createLeague()` method** - pass `facebook_handle` to `League::create()`:
```php
facebookHandle: $data->facebook_handle,
```

2. **Update `updateLeague()` method** - include in social media updates:
```php
$league->updateSocialMedia(
    $data->discord_url ?? $league->discordUrl(),
    $data->website_url ?? $league->websiteUrl(),
    $data->twitter_handle ?? $league->twitterHandle(),
    $data->instagram_handle ?? $league->instagramHandle(),
    $data->youtube_url ?? $league->youtubeUrl(),
    $data->twitch_url ?? $league->twitchUrl(),
    $data->facebook_handle ?? $league->facebookHandle(),
);
```

---

## Step 5: Factory & Seeder Updates

### Update Factory

**File**: `database/factories/LeagueFactory.php`

Add to definition:
```php
'facebook_handle' => fake()->optional(0.5)->userName(),
```

### Review Seeder

**File**: `database/seeders/LeagueSeeder.php`

Check if manual data needs updating (likely no changes needed if using factory).

---

## Step 6: Tests

### Unit Tests to Update

**File**: `tests/Unit/Domain/League/Entities/LeagueTest.php`

- Add test for `facebookHandle()` getter
- Update `updateSocialMedia()` test to include facebook_handle

**File**: `tests/Unit/Application/League/Services/LeagueApplicationServiceTest.php`

- Update create/update tests to include facebook_handle

### Feature Tests to Update

**File**: `tests/Feature/Http/Controllers/User/LeagueControllerTest.php`

- Add facebook_handle to test payloads
- Verify it's returned in responses

**File**: `tests/Feature/Http/Controllers/User/LeagueControllerUpdateTest.php`

- Add facebook_handle to update test payloads

---

## Verification Commands

```bash
# Run migration
php artisan migrate

# Verify column exists
mysql -h mariadb -u laravel -psecret --skip-ssl virtualracingleagues -e "DESCRIBE leagues;"

# Run static analysis
composer phpstan

# Run code style check
composer phpcs

# Run tests
composer test
```

---

## Checklist

- [ ] Create and run migration
- [ ] Update Domain Entity (`League.php`)
- [ ] Update Eloquent Model (`League.php`)
- [ ] Update Repository (`EloquentLeagueRepository.php`)
- [ ] Update `LeagueData` DTO
- [ ] Update `CreateLeagueData` DTO
- [ ] Update `UpdateLeagueData` DTO
- [ ] Update Application Service
- [ ] Update Factory
- [ ] Run PHPStan
- [ ] Run PHPUnit tests
- [ ] Fix any failing tests

---

## Notes

- The `facebook_handle` field follows the same pattern as `twitter_handle` and `instagram_handle`
- It stores just the username/handle, not the full URL
- The frontend will construct the full URL: `https://facebook.com/{facebook_handle}`
- Validation is simple: optional, max 100 characters (same as twitter/instagram)
