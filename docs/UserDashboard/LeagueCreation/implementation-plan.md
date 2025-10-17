# League Creation - Implementation Plan (Revised)

**Version:** 2.0
**Last Updated:** October 17, 2025
**Feature Specification:** `docs/UserDashboard/01_league_creation.md`

---

## Overview

This document provides a comprehensive, step-by-step implementation plan for the League Creation feature with **improved UX based on user feedback**. The form uses a **3-step wizard** approach for better usability and reduced cognitive load.

### Key UX Improvements from V1.0:
- ✅ **Multi-step wizard** instead of single-page form (3 steps: Essentials → Branding & Description → Community & Admin)
- ✅ **Character counters removed** completely for cleaner UI
- ✅ **Admin-configurable platforms** via database table (with initial seeder)
- ✅ **Full timezone list** loaded from backend
- ✅ **Validation on step transition** (when clicking "Next")
- ✅ **Expandable social media fields** (show 2, expand for 4 more)
- ✅ **Disabled button with tooltip** for tier limit (not redirect)
- ✅ **Slug availability check on blur** of league name field
- ✅ **No draft saving** - simple one-session flow
- ✅ **No pre-filling** - explicit data entry
- ✅ **Computed property for league count** (no `leagues_count` column)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Phases](#implementation-phases)
3. [Backend Implementation (dev-be)](#backend-implementation-dev-be)
4. [Frontend Implementation (dev-fe-user)](#frontend-implementation-dev-fe-user)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

### Technology Stack

**Backend:**
- Laravel 12 with DDD architecture
- Spatie Laravel Data for DTOs
- Eloquent ORM with domain entities
- Form Request validation
- Image storage with Laravel Storage
- Slug generation with uniqueness validation and availability API

**Frontend:**
- Vue 3 Composition API with TypeScript
- Pinia store for state management
- Vue Router for navigation
- PrimeVue components (Stepper, FileUpload, InputText, Editor, MultiSelect, RadioButton)
- Tailwind CSS for styling
- Axios for API communication
- **Multi-step wizard pattern** for better UX

### Domain Context

This feature belongs to the **League** bounded context within the DDD architecture.

```
Domain/League/
Domain/Platform/        # NEW: Platform management
Application/League/
Application/Platform/   # NEW: Platform services
Infrastructure/Persistence/Eloquent/Models/League
Infrastructure/Persistence/Eloquent/Models/Platform    # NEW
Infrastructure/Persistence/Eloquent/Repositories/LeagueRepository
Infrastructure/Persistence/Eloquent/Repositories/PlatformRepository    # NEW
Http/Controllers/User/LeagueController
Http/Controllers/User/PlatformController    # NEW
```

---

## Implementation Phases

### Phase 1: Backend Foundation
1. Database schema and migrations (leagues, platforms, league_managers)
2. Platform management (Domain, Application, Infrastructure for platforms)
3. League domain layer (Entities, Value Objects, Events, Exceptions)
4. League application layer (DTOs, Services)
5. League infrastructure layer (Eloquent models, Repositories)
6. Interface layer (Controllers, Routes, Validation)
7. **NEW**: Slug availability check endpoint
8. **NEW**: Timezone list endpoint
9. **NEW**: Platforms list endpoint

### Phase 2: Frontend Foundation
1. TypeScript types and interfaces
2. API service layer (including slug check, timezones, platforms)
3. Pinia store
4. Router configuration

### Phase 3: UI Components (Wizard Pattern)
1. Wizard container component with step indicator
2. Step 1: Essentials form (name, logo, platforms, timezone, visibility)
3. Step 2: Branding & Description form (tagline, description, header image)
4. Step 3: Community & Admin form (contact, social links with expand)
5. Step validation logic
6. Image preview components
7. Form error handling

### Phase 4: Integration & Testing
1. Backend unit tests
2. Backend feature tests
3. Frontend component tests
4. Frontend integration tests
5. E2E tests for wizard flow

---

## Backend Implementation (dev-be)

### Step 1: Database Schema

**Agent:** dev-be

#### Task 1.1: Create Migration for Platforms Table

**File:** `database/migrations/YYYY_MM_DD_create_platforms_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platforms', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            // Indexes
            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platforms');
    }
};
```

**Purpose:** Admin-configurable platform list. Admins can add/edit/reorder platforms.

#### Task 1.2: Create Platform Seeder

**File:** `database/seeders/PlatformSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        $platforms = [
            ['name' => 'Gran Turismo 7', 'sort_order' => 1],
            ['name' => 'iRacing', 'sort_order' => 2],
            ['name' => 'Assetto Corsa Competizione', 'sort_order' => 3],
            ['name' => 'rFactor 2', 'sort_order' => 4],
            ['name' => 'Automobilista 2', 'sort_order' => 5],
            ['name' => 'F1 24', 'sort_order' => 6],
        ];

        foreach ($platforms as $platform) {
            DB::table('platforms')->insert([
                'name' => $platform['name'],
                'slug' => Str::slug($platform['name']),
                'is_active' => true,
                'sort_order' => $platform['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
```

#### Task 1.3: Create Migration for Leagues Table

**File:** `database/migrations/YYYY_MM_DD_create_leagues_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leagues', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 150)->unique();
            $table->string('tagline', 150)->nullable();
            $table->text('description')->nullable(); // Will store HTML from rich text editor

            // Image storage paths
            $table->string('logo_path');
            $table->string('header_image_path')->nullable();

            // Platform selections stored as JSON array of platform IDs
            $table->json('platform_ids')->default('[]');

            // Social media links
            $table->string('discord_url')->nullable();
            $table->string('website_url')->nullable();
            $table->string('twitter_handle')->nullable();
            $table->string('instagram_handle')->nullable();
            $table->string('youtube_url')->nullable();
            $table->string('twitch_url')->nullable();

            // Settings
            $table->enum('visibility', ['public', 'private', 'unlisted'])->default('public');
            $table->string('timezone', 50);

            // Administration
            $table->foreignId('owner_user_id')->constrained('users')->onDelete('cascade');
            $table->string('contact_email');
            $table->string('organizer_name', 100);

            // Status
            $table->enum('status', ['active', 'archived'])->default('active');

            // Metadata
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('slug');
            $table->index('visibility');
            $table->index('owner_user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leagues');
    }
};
```

**Changes from V1.0:**
- Removed `status = 'draft'` option (no draft functionality)
- Changed `platforms` JSON to `platform_ids` to store platform IDs
- **Removed `leagues_count` migration** (using computed property instead)

#### Task 1.4: Create League Managers Pivot Table

**File:** `database/migrations/YYYY_MM_DD_create_league_managers_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('league_managers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('league_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['owner', 'manager', 'moderator'])->default('manager');
            $table->timestamps();

            // Unique constraint: user can only be added once per league
            $table->unique(['league_id', 'user_id']);

            // Indexes
            $table->index('league_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('league_managers');
    }
};
```

---

### Step 2: Platform Domain & Application Layer

**Agent:** dev-be

**Note:** Platforms are simple lookup data, so we don't need full DDD treatment with value objects and domain events. A simpler approach suffices.

#### Task 2.1: Create Platform Eloquent Model

**File:** `app/Infrastructure/Persistence/Eloquent/Models/Platform.php`

```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;

class Platform extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'logo_url',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
```

#### Task 2.2: Create Platform Controller

**File:** `app/Http/Controllers/User/PlatformController.php`

```php
<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlatformController extends Controller
{
    public function index(): JsonResponse
    {
        $platforms = Platform::active()->ordered()->get(['id', 'name', 'slug']);
        return ApiResponse::success($platforms);
    }
}
```

---

### Step 3: League Domain Layer

**Agent:** dev-be

#### Task 3.1: Create League Entity

**File:** `app/Domain/League/Entities/League.php`

```php
<?php

namespace App\Domain\League\Entities;

use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueSlug;
use App\Domain\League\ValueObjects\LeagueVisibility;
use App\Domain\League\ValueObjects\Tagline;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\League\Events\LeagueCreated;
use App\Domain\League\Events\LeagueUpdated;

class League
{
    private ?int $id;
    private LeagueName $name;
    private LeagueSlug $slug;
    private ?Tagline $tagline;
    private ?string $description;
    private string $logoPath;
    private ?string $headerImagePath;
    private array $platformIds;
    private ?string $discordUrl;
    private ?string $websiteUrl;
    private ?string $twitterHandle;
    private ?string $instagramHandle;
    private ?string $youtubeUrl;
    private ?string $twitchUrl;
    private LeagueVisibility $visibility;
    private string $timezone;
    private int $ownerUserId;
    private EmailAddress $contactEmail;
    private string $organizerName;
    private string $status;
    private array $events = [];

    public function __construct(
        LeagueName $name,
        LeagueSlug $slug,
        string $logoPath,
        string $timezone,
        int $ownerUserId,
        EmailAddress $contactEmail,
        string $organizerName,
        ?Tagline $tagline = null,
        ?string $description = null,
        ?string $headerImagePath = null,
        array $platformIds = [],
        ?string $discordUrl = null,
        ?string $websiteUrl = null,
        ?string $twitterHandle = null,
        ?string $instagramHandle = null,
        ?string $youtubeUrl = null,
        ?string $twitchUrl = null,
        ?LeagueVisibility $visibility = null,
        string $status = 'active',
        ?int $id = null
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->slug = $slug;
        $this->tagline = $tagline;
        $this->description = $description;
        $this->logoPath = $logoPath;
        $this->headerImagePath = $headerImagePath;
        $this->platformIds = $platformIds;
        $this->discordUrl = $discordUrl;
        $this->websiteUrl = $websiteUrl;
        $this->twitterHandle = $twitterHandle;
        $this->instagramHandle = $instagramHandle;
        $this->youtubeUrl = $youtubeUrl;
        $this->twitchUrl = $twitchUrl;
        $this->visibility = $visibility ?? LeagueVisibility::public();
        $this->timezone = $timezone;
        $this->ownerUserId = $ownerUserId;
        $this->contactEmail = $contactEmail;
        $this->organizerName = $organizerName;
        $this->status = $status;

        if ($id === null) {
            $this->recordEvent(new LeagueCreated($this));
        }
    }

    // Business logic methods
    public function updateDetails(
        LeagueName $name,
        ?Tagline $tagline,
        ?string $description
    ): void {
        $this->name = $name;
        $this->tagline = $tagline;
        $this->description = $description;

        $this->recordEvent(new LeagueUpdated($this));
    }

    public function changeVisibility(LeagueVisibility $visibility): void
    {
        $this->visibility = $visibility;
        $this->recordEvent(new LeagueUpdated($this));
    }

    public function archive(): void
    {
        $this->status = 'archived';
        $this->recordEvent(new LeagueUpdated($this));
    }

    public function activate(): void
    {
        $this->status = 'active';
        $this->recordEvent(new LeagueUpdated($this));
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function name(): LeagueName { return $this->name; }
    public function slug(): LeagueSlug { return $this->slug; }
    public function tagline(): ?Tagline { return $this->tagline; }
    public function description(): ?string { return $this->description; }
    public function logoPath(): string { return $this->logoPath; }
    public function headerImagePath(): ?string { return $this->headerImagePath; }
    public function platformIds(): array { return $this->platformIds; }
    public function discordUrl(): ?string { return $this->discordUrl; }
    public function websiteUrl(): ?string { return $this->websiteUrl; }
    public function twitterHandle(): ?string { return $this->twitterHandle; }
    public function instagramHandle(): ?string { return $this->instagramHandle; }
    public function youtubeUrl(): ?string { return $this->youtubeUrl; }
    public function twitchUrl(): ?string { return $this->twitchUrl; }
    public function visibility(): LeagueVisibility { return $this->visibility; }
    public function timezone(): string { return $this->timezone; }
    public function ownerUserId(): int { return $this->ownerUserId; }
    public function contactEmail(): EmailAddress { return $this->contactEmail; }
    public function organizerName(): string { return $this->organizerName; }
    public function status(): string { return $this->status; }

    // Event handling
    private function recordEvent(object $event): void
    {
        $this->events[] = $event;
    }

    public function releaseEvents(): array
    {
        $events = $this->events;
        $this->events = [];
        return $events;
    }
}
```

**Changes from V1.0:**
- Changed `platforms` to `platformIds` (array of integers)
- Removed `draft` status

#### Task 3.2: Create Value Objects

**File:** `app/Domain/League/ValueObjects/LeagueName.php`

```php
<?php

namespace App\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidLeagueNameException;

final class LeagueName
{
    private string $value;

    public function __construct(string $value)
    {
        $trimmed = trim($value);

        if (empty($trimmed)) {
            throw new InvalidLeagueNameException('League name cannot be empty');
        }

        if (strlen($trimmed) < 3) {
            throw new InvalidLeagueNameException('League name must be at least 3 characters');
        }

        if (strlen($trimmed) > 100) {
            throw new InvalidLeagueNameException('League name cannot exceed 100 characters');
        }

        $this->value = $trimmed;
    }

    public function value(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

**File:** `app/Domain/League/ValueObjects/LeagueSlug.php`

```php
<?php

namespace App\Domain\League\ValueObjects;

use Illuminate\Support\Str;

final class LeagueSlug
{
    private string $value;

    public function __construct(string $value)
    {
        $this->value = Str::slug($value);
    }

    public static function fromName(string $name): self
    {
        return new self($name);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

**File:** `app/Domain/League/ValueObjects/LeagueVisibility.php`

```php
<?php

namespace App\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidVisibilityException;

final class LeagueVisibility
{
    private const PUBLIC = 'public';
    private const PRIVATE = 'private';
    private const UNLISTED = 'unlisted';

    private string $value;

    private function __construct(string $value)
    {
        if (!in_array($value, [self::PUBLIC, self::PRIVATE, self::UNLISTED], true)) {
            throw new InvalidVisibilityException("Invalid visibility: {$value}");
        }

        $this->value = $value;
    }

    public static function public(): self { return new self(self::PUBLIC); }
    public static function private(): self { return new self(self::PRIVATE); }
    public static function unlisted(): self { return new self(self::UNLISTED); }
    public static function fromString(string $value): self { return new self($value); }

    public function value(): string { return $this->value; }
    public function isPublic(): bool { return $this->value === self::PUBLIC; }
    public function isPrivate(): bool { return $this->value === self::PRIVATE; }
    public function isUnlisted(): bool { return $this->value === self::UNLISTED; }

    public function __toString(): string { return $this->value; }
}
```

**File:** `app/Domain/League/ValueObjects/Tagline.php`

```php
<?php

namespace App\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidTaglineException;

final class Tagline
{
    private string $value;

    public function __construct(string $value)
    {
        $trimmed = trim($value);

        if (strlen($trimmed) > 150) {
            throw new InvalidTaglineException('Tagline cannot exceed 150 characters');
        }

        $this->value = $trimmed;
    }

    public function value(): string { return $this->value; }
    public function __toString(): string { return $this->value; }
}
```

#### Task 3.3: Create Domain Events

**File:** `app/Domain/League/Events/LeagueCreated.php`

```php
<?php

namespace App\Domain\League\Events;

use App\Domain\League\Entities\League;

final class LeagueCreated
{
    public function __construct(
        public readonly League $league
    ) {}
}
```

**File:** `app/Domain/League/Events/LeagueUpdated.php`

```php
<?php

namespace App\Domain\League\Events;

use App\Domain\League\Entities\League;

final class LeagueUpdated
{
    public function __construct(
        public readonly League $league
    ) {}
}
```

#### Task 3.4: Create Domain Exceptions

**File:** `app/Domain/League/Exceptions/InvalidLeagueNameException.php`

```php
<?php

namespace App\Domain\League\Exceptions;

use DomainException;

final class InvalidLeagueNameException extends DomainException {}
```

**File:** `app/Domain/League/Exceptions/InvalidTaglineException.php`

```php
<?php

namespace App\Domain\League\Exceptions;

use DomainException;

final class InvalidTaglineException extends DomainException {}
```

**File:** `app/Domain/League/Exceptions/InvalidVisibilityException.php`

```php
<?php

namespace App\Domain\League\Exceptions;

use DomainException;

final class InvalidVisibilityException extends DomainException {}
```

**File:** `app/Domain/League/Exceptions/LeagueNotFoundException.php`

```php
<?php

namespace App\Domain\League\Exceptions;

use DomainException;

final class LeagueNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("League with ID {$id} not found");
    }

    public static function withSlug(string $slug): self
    {
        return new self("League with slug '{$slug}' not found");
    }
}
```

**File:** `app/Domain/League/Exceptions/LeagueLimitReachedException.php`

```php
<?php

namespace App\Domain\League\Exceptions;

use DomainException;

final class LeagueLimitReachedException extends DomainException
{
    public static function forFreeTier(): self
    {
        return new self('Free tier users can only create 1 league. Upgrade to create more.');
    }
}
```

#### Task 3.5: Create Repository Interface

**File:** `app/Domain/League/Repositories/LeagueRepositoryInterface.php`

```php
<?php

namespace App\Domain\League\Repositories;

use App\Domain\League\Entities\League;
use App\Domain\League\ValueObjects\LeagueSlug;

interface LeagueRepositoryInterface
{
    public function save(League $league): League;
    public function findById(int $id): ?League;
    public function findBySlug(LeagueSlug $slug): ?League;
    public function existsSlug(LeagueSlug $slug): bool;
    public function countByUserId(int $userId): int;
    public function getByUserId(int $userId): array;
    public function delete(int $id): void;
}
```

---

### Step 4: League Application Layer

**Agent:** dev-be

#### Task 4.1: Create DTOs

**File:** `app/Application/League/DTOs/CreateLeagueData.php`

```php
<?php

namespace App\Application\League\DTOs;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Data;

class CreateLeagueData extends Data
{
    public function __construct(
        public string $name,
        public UploadedFile $logo,
        public string $timezone,
        public string $contactEmail,
        public string $organizerName,
        public ?string $tagline = null,
        public ?string $description = null,
        public ?UploadedFile $headerImage = null,
        public array $platformIds = [],  // Changed from platforms to platformIds
        public ?string $discordUrl = null,
        public ?string $websiteUrl = null,
        public ?string $twitterHandle = null,
        public ?string $instagramHandle = null,
        public ?string $youtubeUrl = null,
        public ?string $twitchUrl = null,
        public string $visibility = 'public',
    ) {}
}
```

**File:** `app/Application/League/DTOs/LeagueData.php`

```php
<?php

namespace App\Application\League\DTOs;

use App\Domain\League\Entities\League;
use Spatie\LaravelData\Data;

class LeagueData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?string $tagline,
        public ?string $description,
        public string $logoUrl,
        public ?string $headerImageUrl,
        public array $platformIds,  // Changed
        public ?string $discordUrl,
        public ?string $websiteUrl,
        public ?string $twitterHandle,
        public ?string $instagramHandle,
        public ?string $youtubeUrl,
        public ?string $twitchUrl,
        public string $visibility,
        public string $timezone,
        public int $ownerUserId,
        public string $contactEmail,
        public string $organizerName,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
    ) {}

    public static function fromEntity(League $league, string $logoUrl, ?string $headerImageUrl, string $createdAt, string $updatedAt): self
    {
        return new self(
            id: $league->id(),
            name: $league->name()->value(),
            slug: $league->slug()->value(),
            tagline: $league->tagline()?->value(),
            description: $league->description(),
            logoUrl: $logoUrl,
            headerImageUrl: $headerImageUrl,
            platformIds: $league->platformIds(),
            discordUrl: $league->discordUrl(),
            websiteUrl: $league->websiteUrl(),
            twitterHandle: $league->twitterHandle(),
            instagramHandle: $league->instagramHandle(),
            youtubeUrl: $league->youtubeUrl(),
            twitchUrl: $league->twitchUrl(),
            visibility: $league->visibility()->value(),
            timezone: $league->timezone(),
            ownerUserId: $league->ownerUserId(),
            contactEmail: $league->contactEmail()->value(),
            organizerName: $league->organizerName(),
            status: $league->status(),
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );
    }
}
```

#### Task 4.2: Create Application Service

**File:** `app/Application/League/Services/LeagueApplicationService.php`

```php
<?php

namespace App\Application\League\Services;

use App\Application\League\DTOs\CreateLeagueData;
use App\Application\League\DTOs\LeagueData;
use App\Domain\League\Entities\League;
use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueSlug;
use App\Domain\League\ValueObjects\LeagueVisibility;
use App\Domain\League\ValueObjects\Tagline;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\League\Exceptions\LeagueLimitReachedException;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LeagueApplicationService
{
    public function __construct(
        private readonly LeagueRepositoryInterface $leagueRepository
    ) {}

    public function createLeague(CreateLeagueData $data, int $userId, bool $isFreeTier = true): LeagueData
    {
        return DB::transaction(function () use ($data, $userId, $isFreeTier) {
            // Check free tier limit (using computed property)
            if ($isFreeTier) {
                $leagueCount = $this->leagueRepository->countByUserId($userId);
                if ($leagueCount >= 1) {
                    throw LeagueLimitReachedException::forFreeTier();
                }
            }

            // Generate unique slug
            $baseSlug = LeagueSlug::fromName($data->name);
            $slug = $this->generateUniqueSlug($baseSlug);

            // Store logo
            $logoPath = $data->logo->store('leagues/logos', 'public');

            // Store header image if provided
            $headerImagePath = null;
            if ($data->headerImage) {
                $headerImagePath = $data->headerImage->store('leagues/headers', 'public');
            }

            // Create domain entity
            $league = new League(
                name: new LeagueName($data->name),
                slug: $slug,
                logoPath: $logoPath,
                timezone: $data->timezone,
                ownerUserId: $userId,
                contactEmail: new EmailAddress($data->contactEmail),
                organizerName: $data->organizerName,
                tagline: $data->tagline ? new Tagline($data->tagline) : null,
                description: $data->description,
                headerImagePath: $headerImagePath,
                platformIds: $data->platformIds,
                discordUrl: $data->discordUrl,
                websiteUrl: $data->websiteUrl,
                twitterHandle: $data->twitterHandle,
                instagramHandle: $data->instagramHandle,
                youtubeUrl: $data->youtubeUrl,
                twitchUrl: $data->twitchUrl,
                visibility: LeagueVisibility::fromString($data->visibility),
            );

            // Save to repository
            $savedLeague = $this->leagueRepository->save($league);

            // Generate URLs for response
            $logoUrl = Storage::url($logoPath);
            $headerImageUrl = $headerImagePath ? Storage::url($headerImagePath) : null;

            // Get timestamps from Eloquent model (via repository)
            $model = \App\Infrastructure\Persistence\Eloquent\Models\League::find($savedLeague->id());

            return LeagueData::fromEntity(
                $savedLeague,
                $logoUrl,
                $headerImageUrl,
                $model->created_at->toISOString(),
                $model->updated_at->toISOString()
            );
        });
    }

    public function checkSlugAvailability(string $name): array
    {
        $slug = LeagueSlug::fromName($name);
        $exists = $this->leagueRepository->existsSlug($slug);

        return [
            'available' => !$exists,
            'slug' => $slug->value(),
            'suggestion' => $exists ? $this->generateUniqueSlug($slug)->value() : null,
        ];
    }

    public function getUserLeagues(int $userId): array
    {
        $leagues = $this->leagueRepository->getByUserId($userId);

        return array_map(function (League $league) {
            $logoUrl = Storage::url($league->logoPath());
            $headerImageUrl = $league->headerImagePath()
                ? Storage::url($league->headerImagePath())
                : null;

            $model = \App\Infrastructure\Persistence\Eloquent\Models\League::find($league->id());

            return LeagueData::fromEntity(
                $league,
                $logoUrl,
                $headerImageUrl,
                $model->created_at->toISOString(),
                $model->updated_at->toISOString()
            );
        }, $leagues);
    }

    public function getLeagueById(int $leagueId, int $userId): LeagueData
    {
        $league = $this->leagueRepository->findById($leagueId);

        if (!$league) {
            throw LeagueNotFoundException::withId($leagueId);
        }

        // Authorization check for private leagues
        if ($league->visibility()->isPrivate() && $league->ownerUserId() !== $userId) {
            throw new \RuntimeException('Unauthorized to view this league');
        }

        $logoUrl = Storage::url($league->logoPath());
        $headerImageUrl = $league->headerImagePath()
            ? Storage::url($league->headerImagePath())
            : null;

        $model = \App\Infrastructure\Persistence\Eloquent\Models\League::find($league->id());

        return LeagueData::fromEntity(
            $league,
            $logoUrl,
            $headerImageUrl,
            $model->created_at->toISOString(),
            $model->updated_at->toISOString()
        );
    }

    public function deleteLeague(int $leagueId, int $userId): void
    {
        DB::transaction(function () use ($leagueId, $userId) {
            $league = $this->leagueRepository->findById($leagueId);

            if (!$league) {
                throw LeagueNotFoundException::withId($leagueId);
            }

            if ($league->ownerUserId() !== $userId) {
                throw new \RuntimeException('Unauthorized to delete this league');
            }

            $this->leagueRepository->delete($leagueId);
        });
    }

    private function generateUniqueSlug(LeagueSlug $baseSlug): LeagueSlug
    {
        $slug = $baseSlug;
        $counter = 1;

        while ($this->leagueRepository->existsSlug($slug)) {
            $slug = new LeagueSlug($baseSlug->value() . '-' . str_pad((string)$counter, 2, '0', STR_PAD_LEFT));
            $counter++;
        }

        return $slug;
    }
}
```

**New method:** `checkSlugAvailability()` for the blur check on frontend.

---

### Step 5: Infrastructure Layer

**Agent:** dev-be

#### Task 5.1: Create Eloquent Model

**File:** `app/Infrastructure/Persistence/Eloquent/Models/League.php`

```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class League extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'tagline',
        'description',
        'logo_path',
        'header_image_path',
        'platform_ids',  // Changed
        'discord_url',
        'website_url',
        'twitter_handle',
        'instagram_handle',
        'youtube_url',
        'twitch_url',
        'visibility',
        'timezone',
        'owner_user_id',
        'contact_email',
        'organizer_name',
        'status',
    ];

    protected $casts = [
        'platform_ids' => 'array',  // Changed
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'league_managers')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function platforms(): BelongsToMany
    {
        return $this->belongsToMany(Platform::class, 'platform_ids', 'league_id', 'platform_id');
    }
}
```

#### Task 5.2: Create Repository Implementation

**File:** `app/Infrastructure/Persistence/Eloquent/Repositories/LeagueRepository.php`

```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\League\Entities\League as LeagueEntity;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\League\ValueObjects\LeagueSlug;
use App\Infrastructure\Persistence\Eloquent\Models\League as LeagueModel;
use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueVisibility;
use App\Domain\League\ValueObjects\Tagline;
use App\Domain\Shared\ValueObjects\EmailAddress;

class LeagueRepository implements LeagueRepositoryInterface
{
    public function save(LeagueEntity $league): LeagueEntity
    {
        $model = $league->id()
            ? LeagueModel::findOrFail($league->id())
            : new LeagueModel();

        $model->fill([
            'name' => $league->name()->value(),
            'slug' => $league->slug()->value(),
            'tagline' => $league->tagline()?->value(),
            'description' => $league->description(),
            'logo_path' => $league->logoPath(),
            'header_image_path' => $league->headerImagePath(),
            'platform_ids' => $league->platformIds(),  // Changed
            'discord_url' => $league->discordUrl(),
            'website_url' => $league->websiteUrl(),
            'twitter_handle' => $league->twitterHandle(),
            'instagram_handle' => $league->instagramHandle(),
            'youtube_url' => $league->youtubeUrl(),
            'twitch_url' => $league->twitchUrl(),
            'visibility' => $league->visibility()->value(),
            'timezone' => $league->timezone(),
            'owner_user_id' => $league->ownerUserId(),
            'contact_email' => $league->contactEmail()->value(),
            'organizer_name' => $league->organizerName(),
            'status' => $league->status(),
        ]);

        $model->save();

        return $this->toDomainEntity($model);
    }

    public function findById(int $id): ?LeagueEntity
    {
        $model = LeagueModel::find($id);
        return $model ? $this->toDomainEntity($model) : null;
    }

    public function findBySlug(LeagueSlug $slug): ?LeagueEntity
    {
        $model = LeagueModel::where('slug', $slug->value())->first();
        return $model ? $this->toDomainEntity($model) : null;
    }

    public function existsSlug(LeagueSlug $slug): bool
    {
        return LeagueModel::where('slug', $slug->value())->exists();
    }

    public function countByUserId(int $userId): int
    {
        return LeagueModel::where('owner_user_id', $userId)->count();
    }

    public function getByUserId(int $userId): array
    {
        $models = LeagueModel::where('owner_user_id', $userId)->get();
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    public function delete(int $id): void
    {
        LeagueModel::findOrFail($id)->delete();
    }

    private function toDomainEntity(LeagueModel $model): LeagueEntity
    {
        return new LeagueEntity(
            name: new LeagueName($model->name),
            slug: new LeagueSlug($model->slug),
            logoPath: $model->logo_path,
            timezone: $model->timezone,
            ownerUserId: $model->owner_user_id,
            contactEmail: new EmailAddress($model->contact_email),
            organizerName: $model->organizer_name,
            tagline: $model->tagline ? new Tagline($model->tagline) : null,
            description: $model->description,
            headerImagePath: $model->header_image_path,
            platformIds: $model->platform_ids ?? [],  // Changed
            discordUrl: $model->discord_url,
            websiteUrl: $model->website_url,
            twitterHandle: $model->twitter_handle,
            instagramHandle: $model->instagram_handle,
            youtubeUrl: $model->youtube_url,
            twitchUrl: $model->twitch_url,
            visibility: LeagueVisibility::fromString($model->visibility),
            status: $model->status,
            id: $model->id
        );
    }
}
```

#### Task 5.3: Register Repository in Service Provider

**File:** `app/Providers/AppServiceProvider.php`

```php
public function register(): void
{
    $this->app->bind(
        \App\Domain\League\Repositories\LeagueRepositoryInterface::class,
        \App\Infrastructure\Persistence\Eloquent\Repositories\LeagueRepository::class
    );
}
```

---

### Step 6: Interface Layer (Controllers & Routes)

**Agent:** dev-be

#### Task 6.1: Create Form Request Validation

**File:** `app/Http/Requests/User/CreateLeagueRequest.php`

```php
<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class CreateLeagueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Already protected by auth middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'tagline' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'logo' => ['required', 'image', 'mimes:png,jpg,jpeg', 'max:2048'], // 2MB
            'header_image' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:5120'], // 5MB
            'platform_ids' => ['nullable', 'array'],
            'platform_ids.*' => ['integer', 'exists:platforms,id'],
            'discord_url' => ['nullable', 'url', 'max:255'],
            'website_url' => ['nullable', 'url', 'max:255'],
            'twitter_handle' => ['nullable', 'string', 'max:50'],
            'instagram_handle' => ['nullable', 'string', 'max:50'],
            'youtube_url' => ['nullable', 'url', 'max:255'],
            'twitch_url' => ['nullable', 'url', 'max:255'],
            'visibility' => ['required', 'in:public,private,unlisted'],
            'timezone' => ['required', 'string', 'timezone'],
            'contact_email' => ['required', 'email', 'max:255'],
            'organizer_name' => ['required', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'logo.required' => 'A league logo is required',
            'logo.max' => 'Logo file size must not exceed 2MB',
            'header_image.max' => 'Header image file size must not exceed 5MB',
            'name.min' => 'League name must be at least 3 characters',
            'name.max' => 'League name cannot exceed 100 characters',
            'tagline.max' => 'Tagline cannot exceed 150 characters',
            'description.max' => 'Description cannot exceed 2000 characters',
        ];
    }
}
```

**Changed:** `platforms` → `platform_ids` with validation for integer IDs.

#### Task 6.2: Create League Controller

**File:** `app/Http/Controllers/User/LeagueController.php`

```php
<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\CreateLeagueRequest;
use App\Application\League\Services\LeagueApplicationService;
use App\Application\League\DTOs\CreateLeagueData;
use App\Domain\League\Exceptions\LeagueLimitReachedException;
use App\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeagueController extends Controller
{
    public function __construct(
        private readonly LeagueApplicationService $leagueService
    ) {}

    public function index(): JsonResponse
    {
        $leagues = $this->leagueService->getUserLeagues(auth()->id());
        return ApiResponse::success($leagues);
    }

    public function store(CreateLeagueRequest $request): JsonResponse
    {
        try {
            $data = CreateLeagueData::from($request->validated());
            $league = $this->leagueService->createLeague(
                $data,
                auth()->id(),
                $this->isFreeTierUser()
            );

            return ApiResponse::created($league->toArray());
        } catch (LeagueLimitReachedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    public function show(int $id): JsonResponse
    {
        $league = $this->leagueService->getLeagueById($id, auth()->id());
        return ApiResponse::success($league->toArray());
    }

    public function destroy(int $id): JsonResponse
    {
        $this->leagueService->deleteLeague($id, auth()->id());
        return ApiResponse::success(['message' => 'League deleted successfully']);
    }

    public function checkSlug(Request $request): JsonResponse
    {
        $request->validate(['name' => 'required|string|min:3']);

        $result = $this->leagueService->checkSlugAvailability($request->name);
        return ApiResponse::success($result);
    }

    private function isFreeTierUser(): bool
    {
        // TODO: Implement tier checking logic
        // For now, return true (all users are free tier)
        return true;
    }
}
```

**New method:** `checkSlug()` for real-time availability checking.

#### Task 6.3: Create Timezone Controller

**File:** `app/Http/Controllers/User/TimezoneController.php`

```php
<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;
use DateTimeZone;

class TimezoneController extends Controller
{
    public function index(): JsonResponse
    {
        $timezones = DateTimeZone::listIdentifiers(DateTimeZone::ALL);

        // Group by region for easier selection
        $grouped = [];
        foreach ($timezones as $timezone) {
            $parts = explode('/', $timezone);
            $region = $parts[0];

            if (!isset($grouped[$region])) {
                $grouped[$region] = [];
            }

            $grouped[$region][] = [
                'value' => $timezone,
                'label' => str_replace('_', ' ', $timezone),
            ];
        }

        return ApiResponse::success($grouped);
    }
}
```

**New controller:** Returns full timezone list grouped by region.

#### Task 6.4: Add Routes

**File:** `routes/subdomain.php`

Add to the user dashboard domain group:

```php
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::prefix('api')->middleware(['auth:web', 'user.authenticate'])->group(function () {
        // Existing routes...

        // League routes
        Route::prefix('leagues')->group(function () {
            Route::get('/', [LeagueController::class, 'index']);
            Route::post('/', [LeagueController::class, 'store']);
            Route::get('/check-slug', [LeagueController::class, 'checkSlug']);  // NEW
            Route::get('/{id}', [LeagueController::class, 'show']);
            Route::delete('/{id}', [LeagueController::class, 'destroy']);
        });

        // Platform routes (NEW)
        Route::get('/platforms', [PlatformController::class, 'index']);

        // Timezone routes (NEW)
        Route::get('/timezones', [TimezoneController::class, 'index']);
    });

    Route::get('/{any?}', fn() => view('app'));
});
```

---

## Frontend Implementation (dev-fe-user)

### Step 7: TypeScript Types & Interfaces

**Agent:** dev-fe-user

#### Task 7.1: Create Types

**File:** `resources/user/js/types/league.ts`

```typescript
export interface League {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string;
  headerImageUrl: string | null;
  platformIds: number[];  // Changed
  discordUrl: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  instagramHandle: string | null;
  youtubeUrl: string | null;
  twitchUrl: string | null;
  visibility: 'public' | 'private' | 'unlisted';
  timezone: string;
  ownerUserId: number;
  contactEmail: string;
  organizerName: string;
  status: 'active' | 'archived';  // Changed
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeagueFormData {
  // Step 1: Essentials
  name: string;
  logo: File | null;
  platformIds: number[];  // Changed
  timezone: string;
  visibility: 'public' | 'private' | 'unlisted';

  // Step 2: Branding & Description
  tagline: string;
  description: string;
  headerImage: File | null;

  // Step 3: Community & Admin
  contactEmail: string;
  organizerName: string;
  discordUrl: string;
  websiteUrl: string;
  twitterHandle: string;
  instagramHandle: string;
  youtubeUrl: string;
  twitchUrl: string;
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
}

export interface TimezoneOption {
  value: string;
  label: string;
}

export interface TimezoneGroup {
  [region: string]: TimezoneOption[];
}

export interface SlugCheckResult {
  available: boolean;
  slug: string;
  suggestion: string | null;
}

export interface LeagueValidationErrors {
  // Step 1 fields
  name?: string[];
  logo?: string[];
  platformIds?: string[];
  timezone?: string[];
  visibility?: string[];

  // Step 2 fields
  tagline?: string[];
  description?: string[];
  headerImage?: string[];

  // Step 3 fields
  contactEmail?: string[];
  organizerName?: string[];
  discordUrl?: string[];
  websiteUrl?: string[];
  twitterHandle?: string[];
  instagramHandle?: string[];
  youtubeUrl?: string[];
  twitchUrl?: string[];
}

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Visible in league directory' },
  { value: 'private', label: 'Private', description: 'Only visible to invited members' },
  { value: 'unlisted', label: 'Unlisted', description: 'Accessible via direct link only' },
] as const;
```

**Changes:**
- Added `Platform` interface
- Added `TimezoneOption`, `TimezoneGroup`, `SlugCheckResult` interfaces
- Changed `platforms` to `platformIds`
- Removed `PLATFORM_OPTIONS` (loaded from API)
- Removed `'draft'` status

---

### Step 8: API Service Layer

**Agent:** dev-fe-user

#### Task 8.1: Create League API Service

**File:** `resources/user/js/services/leagueService.ts`

```typescript
import axios, { AxiosError } from 'axios';
import type { League, CreateLeagueFormData, SlugCheckResult } from '@user/types/league';

const BASE_URL = '/api/leagues';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class LeagueService {
  async getUserLeagues(): Promise<League[]> {
    try {
      const response = await axios.get<ApiResponse<League[]>>(BASE_URL);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createLeague(formData: CreateLeagueFormData): Promise<League> {
    try {
      const data = new FormData();

      // Step 1: Essentials
      data.append('name', formData.name);
      data.append('timezone', formData.timezone);
      data.append('visibility', formData.visibility);
      if (formData.logo) data.append('logo', formData.logo);

      formData.platformIds.forEach((id) => {
        data.append('platform_ids[]', id.toString());
      });

      // Step 2: Branding
      if (formData.tagline) data.append('tagline', formData.tagline);
      if (formData.description) data.append('description', formData.description);
      if (formData.headerImage) data.append('header_image', formData.headerImage);

      // Step 3: Community
      data.append('contact_email', formData.contactEmail);
      data.append('organizer_name', formData.organizerName);
      if (formData.discordUrl) data.append('discord_url', formData.discordUrl);
      if (formData.websiteUrl) data.append('website_url', formData.websiteUrl);
      if (formData.twitterHandle) data.append('twitter_handle', formData.twitterHandle);
      if (formData.instagramHandle) data.append('instagram_handle', formData.instagramHandle);
      if (formData.youtubeUrl) data.append('youtube_url', formData.youtubeUrl);
      if (formData.twitchUrl) data.append('twitch_url', formData.twitchUrl);

      const response = await axios.post<ApiResponse<League>>(BASE_URL, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkSlugAvailability(name: string): Promise<SlugCheckResult> {
    try {
      const response = await axios.get<ApiResponse<SlugCheckResult>>(
        `${BASE_URL}/check-slug`,
        { params: { name } }
      );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getLeagueById(id: number): Promise<League> {
    try {
      const response = await axios.get<ApiResponse<League>>(`${BASE_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteLeague(id: number): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      return {
        message: axiosError.response?.data?.message || 'An error occurred',
        errors: axiosError.response?.data?.errors,
      };
    }
    return {
      message: 'An unexpected error occurred',
    };
  }
}

export default new LeagueService();
```

**New method:** `checkSlugAvailability()`

#### Task 8.2: Create Platform API Service

**File:** `resources/user/js/services/platformService.ts`

```typescript
import axios from 'axios';
import type { Platform } from '@user/types/league';

const BASE_URL = '/api/platforms';

class PlatformService {
  async getPlatforms(): Promise<Platform[]> {
    const response = await axios.get<{ data: Platform[] }>(BASE_URL);
    return response.data.data;
  }
}

export default new PlatformService();
```

#### Task 8.3: Create Timezone API Service

**File:** `resources/user/js/services/timezoneService.ts`

```typescript
import axios from 'axios';
import type { TimezoneGroup } from '@user/types/league';

const BASE_URL = '/api/timezones';

class TimezoneService {
  async getTimezones(): Promise<TimezoneGroup> {
    const response = await axios.get<{ data: TimezoneGroup }>(BASE_URL);
    return response.data.data;
  }
}

export default new TimezoneService();
```

---

### Step 9: Pinia Store

**Agent:** dev-fe-user

#### Task 9.1: Create League Store

**File:** `resources/user/js/stores/leagueStore.ts`

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import leagueService from '@user/services/leagueService';
import platformService from '@user/services/platformService';
import timezoneService from '@user/services/timezoneService';
import type { League, CreateLeagueFormData, Platform, TimezoneGroup } from '@user/types/league';
import type { ApiError } from '@user/services/leagueService';

export const useLeagueStore = defineStore('league', () => {
  // State
  const leagues = ref<League[]>([]);
  const currentLeague = ref<League | null>(null);
  const platforms = ref<Platform[]>([]);
  const timezones = ref<TimezoneGroup>({});
  const loading = ref(false);
  const error = ref<ApiError | null>(null);

  // Getters
  const leagueCount = computed(() => leagues.value.length);
  const hasReachedFreeLimit = computed(() => leagueCount.value >= 1);
  const activeLeagues = computed(() =>
    leagues.value.filter(league => league.status === 'active')
  );
  const publicLeagues = computed(() =>
    leagues.value.filter(league => league.visibility === 'public')
  );

  // Actions
  async function fetchPlatforms(): Promise<void> {
    if (platforms.value.length > 0) return; // Cache platforms
    try {
      platforms.value = await platformService.getPlatforms();
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
    }
  }

  async function fetchTimezones(): Promise<void> {
    if (Object.keys(timezones.value).length > 0) return; // Cache timezones
    try {
      timezones.value = await timezoneService.getTimezones();
    } catch (err) {
      console.error('Failed to fetch timezones:', err);
    }
  }

  async function fetchUserLeagues(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      leagues.value = await leagueService.getUserLeagues();
    } catch (err) {
      error.value = err as ApiError;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createLeague(formData: CreateLeagueFormData): Promise<League> {
    loading.value = true;
    error.value = null;

    try {
      const league = await leagueService.createLeague(formData);
      leagues.value.push(league);
      currentLeague.value = league;
      return league;
    } catch (err) {
      error.value = err as ApiError;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function checkSlugAvailability(name: string) {
    return await leagueService.checkSlugAvailability(name);
  }

  async function fetchLeagueById(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      currentLeague.value = await leagueService.getLeagueById(id);
    } catch (err) {
      error.value = err as ApiError;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteLeague(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await leagueService.deleteLeague(id);
      leagues.value = leagues.value.filter(league => league.id !== id);
      if (currentLeague.value?.id === id) {
        currentLeague.value = null;
      }
    } catch (err) {
      error.value = err as ApiError;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function setCurrentLeague(league: League | null): void {
    currentLeague.value = league;
  }

  return {
    // State
    leagues,
    currentLeague,
    platforms,
    timezones,
    loading,
    error,

    // Getters
    leagueCount,
    hasReachedFreeLimit,
    activeLeagues,
    publicLeagues,

    // Actions
    fetchPlatforms,
    fetchTimezones,
    fetchUserLeagues,
    createLeague,
    checkSlugAvailability,
    fetchLeagueById,
    deleteLeague,
    clearError,
    setCurrentLeague,
  };
});
```

**New actions:**
- `fetchPlatforms()`
- `fetchTimezones()`
- `checkSlugAvailability()`

---

### Step 10: Vue Router Configuration

**Agent:** dev-fe-user

#### Task 10.1: Add League Routes

**File:** `resources/user/js/router/index.ts`

Add these routes:

```typescript
{
  path: '/leagues',
  name: 'leagues',
  component: () => import('@user/views/Leagues/LeaguesIndex.vue'),
  meta: { requiresAuth: true, title: 'My Leagues' },
},
{
  path: '/leagues/create',
  name: 'leagues-create',
  component: () => import('@user/views/Leagues/LeagueCreateWizard.vue'),
  meta: { requiresAuth: true, title: 'Create League' },
},
{
  path: '/leagues/:id',
  name: 'league-detail',
  component: () => import('@user/views/Leagues/LeagueDetail.vue'),
  meta: { requiresAuth: true, title: 'League Details' },
},
```

**Changed:** `LeagueCreate.vue` → `LeagueCreateWizard.vue`

---

### Step 11: Common Form Components

**Agent:** dev-fe-user

#### Task 11.1: Create Common Form Components

**File:** `resources/user/js/components/common/FormLabel.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  for?: string;
  required?: boolean;
  text: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  for: undefined,
  required: false,
  class: '',
});

const labelClasses = computed(() => {
  const baseClasses = 'block text-sm font-medium text-gray-700 mb-2';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <label :for="props.for" :class="labelClasses">
    {{ props.text }}
    <span v-if="props.required" class="text-red-500">*</span>
  </label>
</template>
```

**File:** `resources/user/js/components/common/FormError.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  error?: string | string[];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  error: undefined,
  class: '',
});

const errorMessage = computed(() => {
  if (!props.error) return null;
  return Array.isArray(props.error) ? props.error[0] : props.error;
});

const errorClasses = computed(() => {
  const baseClasses = 'text-sm text-red-500 mt-1';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <small v-if="errorMessage" :class="errorClasses">
    {{ errorMessage }}
  </small>
</template>
```

**File:** `resources/user/js/components/common/FormHelper.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  text?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: undefined,
  class: '',
});

const helperClasses = computed(() => {
  const baseClasses = 'text-sm text-gray-500 mt-1';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <small v-if="props.text" :class="helperClasses">
    {{ props.text }}
  </small>
</template>
```

**Note:** Removed `FormCharacterCount.vue` component (no character counters).

---

### Step 12: Wizard UI Components

**Agent:** dev-fe-user

#### Task 12.1: Create Wizard Container Component

**File:** `resources/user/js/views/Leagues/LeagueCreateWizard.vue`

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLeagueStore } from '@user/stores/leagueStore';
import { useToast } from 'primevue/usetoast';
import type { CreateLeagueFormData } from '@user/types/league';

import Stepper from 'primevue/stepper';
import StepperPanel from 'primevue/stepperpanel';
import Button from 'primevue/button';

import Step1Essentials from '@user/components/leagues/Step1Essentials.vue';
import Step2Branding from '@user/components/leagues/Step2Branding.vue';
import Step3Community from '@user/components/leagues/Step3Community.vue';

const router = useRouter();
const leagueStore = useLeagueStore();
const toast = useToast();

const currentStep = ref(0);
const submitting = ref(false);

// Form data (shared across steps)
const formData = ref<CreateLeagueFormData>({
  // Step 1
  name: '',
  logo: null,
  platformIds: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  visibility: 'public',
  // Step 2
  tagline: '',
  description: '',
  headerImage: null,
  // Step 3
  contactEmail: '',
  organizerName: '',
  discordUrl: '',
  websiteUrl: '',
  twitterHandle: '',
  instagramHandle: '',
  youtubeUrl: '',
  twitchUrl: '',
});

const errors = ref<Record<string, string>>({});

// Load platforms and timezones
onMounted(async () => {
  await leagueStore.fetchPlatforms();
  await leagueStore.fetchTimezones();
});

// Step validation handlers
const step1Ref = ref();
const step2Ref = ref();
const step3Ref = ref();

async function validateStep(step: number): Promise<boolean> {
  errors.value = {};

  if (step === 0 && step1Ref.value) {
    return await step1Ref.value.validate();
  } else if (step === 1 && step2Ref.value) {
    return await step2Ref.value.validate();
  } else if (step === 2 && step3Ref.value) {
    return await step3Ref.value.validate();
  }

  return true;
}

async function nextStep() {
  const isValid = await validateStep(currentStep.value);

  if (!isValid) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please correct the errors before proceeding',
      life: 3000,
    });
    return;
  }

  if (currentStep.value < 2) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

async function handleSubmit() {
  const isValid = await validateStep(2);

  if (!isValid) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please correct the errors before submitting',
      life: 3000,
    });
    return;
  }

  submitting.value = true;

  try {
    const league = await leagueStore.createLeague(formData.value);

    toast.add({
      severity: 'success',
      summary: 'League Created',
      detail: `${league.name} has been created successfully!`,
      life: 3000,
    });

    router.push(`/leagues/${league.id}`);
  } catch (error: any) {
    if (error.errors) {
      Object.keys(error.errors).forEach((key) => {
        errors.value[key] = error.errors[key][0];
      });
    }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to create league',
      life: 5000,
    });
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  router.push('/leagues');
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Create New League</h1>
      <p class="text-gray-600 mt-2">Follow the steps to set up your racing league</p>
    </div>

    <Stepper v-model:activeStep="currentStep" linear>
      <!-- Step 1: Essentials -->
      <StepperPanel header="Essentials">
        <template #content="{ nextCallback }">
          <Step1Essentials
            ref="step1Ref"
            v-model="formData"
            :errors="errors"
          />
          <div class="flex justify-end gap-3 pt-6">
            <Button label="Cancel" severity="secondary" @click="handleCancel" />
            <Button label="Next" @click="nextStep" />
          </div>
        </template>
      </StepperPanel>

      <!-- Step 2: Branding & Description -->
      <StepperPanel header="Branding & Description">
        <template #content="{ prevCallback, nextCallback }">
          <Step2Branding
            ref="step2Ref"
            v-model="formData"
            :errors="errors"
          />
          <div class="flex justify-between pt-6">
            <Button label="Back" severity="secondary" @click="prevStep" />
            <Button label="Next" @click="nextStep" />
          </div>
        </template>
      </StepperPanel>

      <!-- Step 3: Community & Admin -->
      <StepperPanel header="Community & Admin">
        <template #content="{ prevCallback }">
          <Step3Community
            ref="step3Ref"
            v-model="formData"
            :errors="errors"
          />
          <div class="flex justify-between pt-6">
            <Button label="Back" severity="secondary" @click="prevStep" :disabled="submitting" />
            <Button label="Create League" @click="handleSubmit" :loading="submitting" />
          </div>
        </template>
      </StepperPanel>
    </Stepper>
  </div>
</template>
```

#### Task 12.2: Create Step 1 (Essentials) Component

**File:** `resources/user/js/components/leagues/Step1Essentials.vue`

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useLeagueStore } from '@user/stores/leagueStore';
import type { CreateLeagueFormData } from '@user/types/league';

import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton';
import FileUpload from 'primevue/fileupload';
import Message from 'primevue/message';

import FormLabel from '@user/components/common/FormLabel.vue';
import FormError from '@user/components/common/FormError.vue';
import FormHelper from '@user/components/common/FormHelper.vue';
import { VISIBILITY_OPTIONS } from '@user/types/league';

interface Props {
  modelValue: CreateLeagueFormData;
  errors: Record<string, string>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: CreateLeagueFormData];
}>();

const leagueStore = useLeagueStore();

const logoPreview = ref<string | null>(null);
const slugCheckResult = ref<{ available: boolean; slug: string; suggestion: string | null } | null>(null);
const checkingSlug = ref(false);

// Handle logo upload
function onLogoSelect(event: any) {
  const file = event.files[0];
  if (file) {
    emit('update:modelValue', { ...props.modelValue, logo: file });
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

// Check slug availability on blur
async function checkSlugAvailability() {
  if (!props.modelValue.name || props.modelValue.name.length < 3) return;

  checkingSlug.value = true;
  try {
    slugCheckResult.value = await leagueStore.checkSlugAvailability(props.modelValue.name);
  } catch (error) {
    console.error('Slug check failed:', error);
  } finally {
    checkingSlug.value = false;
  }
}

// Validation
async function validate(): Promise<boolean> {
  const errors: Record<string, string> = {};

  if (!props.modelValue.name || props.modelValue.name.length < 3) {
    errors.name = 'League name must be at least 3 characters';
  }
  if (props.modelValue.name.length > 100) {
    errors.name = 'League name cannot exceed 100 characters';
  }
  if (!props.modelValue.logo) {
    errors.logo = 'League logo is required';
  }
  if (!props.modelValue.timezone) {
    errors.timezone = 'Timezone is required';
  }

  Object.assign(props.errors, errors);
  return Object.keys(errors).length === 0;
}

defineExpose({ validate });
</script>

<template>
  <div class="space-y-6">
    <p class="text-gray-600">Let's start with the essential information for your league.</p>

    <!-- League Name -->
    <div>
      <FormLabel for="name" text="League Name" :required="true" />
      <InputText
        id="name"
        :model-value="modelValue.name"
        @update:model-value="emit('update:modelValue', { ...modelValue, name: $event })"
        @blur="checkSlugAvailability"
        :class="{ 'p-invalid': errors.name }"
        class="w-full"
        maxlength="100"
        placeholder="Enter league name"
      />
      <FormError :error="errors.name" />

      <!-- Slug availability indicator -->
      <div v-if="checkingSlug" class="mt-2">
        <Message severity="info" :closable="false">Checking availability...</Message>
      </div>
      <div v-else-if="slugCheckResult" class="mt-2">
        <Message v-if="slugCheckResult.available" severity="success" :closable="false">
          ✓ Available: {{ slugCheckResult.slug }}
        </Message>
        <Message v-else severity="warn" :closable="false">
          Already taken. Suggested: {{ slugCheckResult.suggestion }}
        </Message>
      </div>
    </div>

    <!-- Logo -->
    <div>
      <FormLabel text="League Logo" :required="true" />
      <FileUpload
        mode="basic"
        accept="image/png,image/jpeg"
        :maxFileSize="2097152"
        :auto="false"
        @select="onLogoSelect"
        :class="{ 'p-invalid': errors.logo }"
        chooseLabel="Upload Logo"
      />
      <FormHelper text="Recommended: 500x500px, PNG/JPG, max 2MB" />
      <FormError :error="errors.logo" />

      <div v-if="logoPreview" class="mt-3">
        <img :src="logoPreview" alt="Logo preview" class="w-32 h-32 object-cover rounded-lg border" />
      </div>
    </div>

    <!-- Platforms -->
    <div>
      <FormLabel text="Sim Racing Platforms" />
      <MultiSelect
        :model-value="modelValue.platformIds"
        @update:model-value="emit('update:modelValue', { ...modelValue, platformIds: $event })"
        :options="leagueStore.platforms"
        optionLabel="name"
        optionValue="id"
        placeholder="Select platforms"
        class="w-full"
        display="chip"
      />
      <FormHelper text="Select all platforms your league supports" />
    </div>

    <!-- Timezone -->
    <div>
      <FormLabel for="timezone" text="Time Zone" :required="true" />
      <Dropdown
        id="timezone"
        :model-value="modelValue.timezone"
        @update:model-value="emit('update:modelValue', { ...modelValue, timezone: $event })"
        :options="Object.values(leagueStore.timezones).flat()"
        optionLabel="label"
        optionValue="value"
        :class="{ 'p-invalid': errors.timezone }"
        class="w-full"
        placeholder="Select timezone"
        filter
        filterPlaceholder="Search timezones..."
      />
      <FormHelper text="All race times will display in this timezone" />
      <FormError :error="errors.timezone" />
    </div>

    <!-- Visibility -->
    <div>
      <FormLabel text="League Visibility" class="mb-3" />
      <div class="space-y-3">
        <div v-for="option in VISIBILITY_OPTIONS" :key="option.value" class="flex items-start">
          <RadioButton
            :id="option.value"
            :model-value="modelValue.visibility"
            @update:model-value="emit('update:modelValue', { ...modelValue, visibility: $event })"
            :value="option.value"
            name="visibility"
          />
          <label :for="option.value" class="ml-3 cursor-pointer">
            <div class="font-medium text-gray-900">{{ option.label }}</div>
            <div class="text-sm text-gray-600">{{ option.description }}</div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### Task 12.3: Create Step 2 (Branding) Component

**File:** `resources/user/js/components/leagues/Step2Branding.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { CreateLeagueFormData } from '@user/types/league';

import InputText from 'primevue/inputtext';
import Editor from 'primevue/editor';
import FileUpload from 'primevue/fileupload';

import FormLabel from '@user/components/common/FormLabel.vue';
import FormError from '@user/components/common/FormError.vue';
import FormHelper from '@user/components/common/FormHelper.vue';

interface Props {
  modelValue: CreateLeagueFormData;
  errors: Record<string, string>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: CreateLeagueFormData];
}>();

const headerPreview = ref<string | null>(null);

// Handle header image upload
function onHeaderSelect(event: any) {
  const file = event.files[0];
  if (file) {
    emit('update:modelValue', { ...props.modelValue, headerImage: file });
    const reader = new FileReader();
    reader.onload = (e) => {
      headerPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

// Validation (all fields optional in this step)
async function validate(): Promise<boolean> {
  const errors: Record<string, string> = {};

  if (props.modelValue.tagline && props.modelValue.tagline.length > 150) {
    errors.tagline = 'Tagline cannot exceed 150 characters';
  }
  if (props.modelValue.description && props.modelValue.description.length > 2000) {
    errors.description = 'Description cannot exceed 2000 characters';
  }

  Object.assign(props.errors, errors);
  return Object.keys(errors).length === 0;
}

defineExpose({ validate });
</script>

<template>
  <div class="space-y-6">
    <p class="text-gray-600">Add branding and a description to make your league stand out (all optional).</p>

    <!-- Tagline -->
    <div>
      <FormLabel for="tagline" text="Tagline" />
      <InputText
        id="tagline"
        :model-value="modelValue.tagline"
        @update:model-value="emit('update:modelValue', { ...modelValue, tagline: $event })"
        class="w-full"
        maxlength="150"
        placeholder="Brief one-liner about your league"
      />
      <FormError :error="errors.tagline" />
    </div>

    <!-- Description -->
    <div>
      <FormLabel for="description" text="Description" />
      <Editor
        :model-value="modelValue.description"
        @update:model-value="emit('update:modelValue', { ...modelValue, description: $event })"
        editor-style="height: 200px"
        placeholder="Describe your league, racing style, rules, skill levels..."
      />
      <FormError :error="errors.description" />
    </div>

    <!-- Header Image -->
    <div>
      <FormLabel text="Header Image (optional)" />
      <FileUpload
        mode="basic"
        accept="image/png,image/jpeg"
        :maxFileSize="5242880"
        :auto="false"
        @select="onHeaderSelect"
        chooseLabel="Upload Header"
      />
      <FormHelper text="Recommended: 1920x400px, PNG/JPG, max 5MB" />

      <div v-if="headerPreview" class="mt-3">
        <img :src="headerPreview" alt="Header preview" class="w-full max-h-40 object-cover rounded-lg border" />
      </div>
    </div>
  </div>
</template>
```

#### Task 12.4: Create Step 3 (Community) Component

**File:** `resources/user/js/components/leagues/Step3Community.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { CreateLeagueFormData } from '@user/types/league';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

import FormLabel from '@user/components/common/FormLabel.vue';
import FormError from '@user/components/common/FormError.vue';
import FormHelper from '@user/components/common/FormHelper.vue';

interface Props {
  modelValue: CreateLeagueFormData;
  errors: Record<string, string>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: CreateLeagueFormData];
}>();

const showMoreSocials = ref(false);

// Validation
async function validate(): Promise<boolean> {
  const errors: Record<string, string> = {};

  if (!props.modelValue.contactEmail) {
    errors.contactEmail = 'Contact email is required';
  }
  if (!props.modelValue.organizerName) {
    errors.organizerName = 'Organizer name is required';
  }

  Object.assign(props.errors, errors);
  return Object.keys(errors).length === 0;
}

defineExpose({ validate });
</script>

<template>
  <div class="space-y-6">
    <p class="text-gray-600">Provide contact information and optional social media links.</p>

    <!-- Admin Info -->
    <div class="space-y-4">
      <h3 class="font-semibold text-gray-900">Administration</h3>

      <div>
        <FormLabel for="contactEmail" text="Primary Contact Email" :required="true" />
        <InputText
          id="contactEmail"
          :model-value="modelValue.contactEmail"
          @update:model-value="emit('update:modelValue', { ...modelValue, contactEmail: $event })"
          :class="{ 'p-invalid': errors.contactEmail }"
          type="email"
          class="w-full"
          placeholder="your.email@example.com"
        />
        <FormError :error="errors.contactEmail" />
      </div>

      <div>
        <FormLabel for="organizerName" text="League Administrator Name" :required="true" />
        <InputText
          id="organizerName"
          :model-value="modelValue.organizerName"
          @update:model-value="emit('update:modelValue', { ...modelValue, organizerName: $event })"
          :class="{ 'p-invalid': errors.organizerName }"
          class="w-full"
          placeholder="Your name"
        />
        <FormHelper text="This will be shown as the primary organizer" />
        <FormError :error="errors.organizerName" />
      </div>
    </div>

    <!-- Social Media -->
    <div class="space-y-4">
      <h3 class="font-semibold text-gray-900">Social & Community (optional)</h3>

      <!-- Always visible: Discord + Website -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormLabel for="discord" text="Discord Server" />
          <InputText
            id="discord"
            :model-value="modelValue.discordUrl"
            @update:model-value="emit('update:modelValue', { ...modelValue, discordUrl: $event })"
            class="w-full"
            placeholder="https://discord.gg/..."
          />
        </div>

        <div>
          <FormLabel for="website" text="Website" />
          <InputText
            id="website"
            :model-value="modelValue.websiteUrl"
            @update:model-value="emit('update:modelValue', { ...modelValue, websiteUrl: $event })"
            class="w-full"
            placeholder="https://..."
          />
        </div>
      </div>

      <!-- Expand button -->
      <Button
        v-if="!showMoreSocials"
        label="+ Add more social links"
        severity="secondary"
        text
        @click="showMoreSocials = true"
        class="p-0"
      />

      <!-- Expanded: Twitter, Instagram, YouTube, Twitch -->
      <div v-if="showMoreSocials" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div>
          <FormLabel for="twitter" text="Twitter/X" />
          <InputText
            id="twitter"
            :model-value="modelValue.twitterHandle"
            @update:model-value="emit('update:modelValue', { ...modelValue, twitterHandle: $event })"
            class="w-full"
            placeholder="@username"
          />
        </div>

        <div>
          <FormLabel for="instagram" text="Instagram" />
          <InputText
            id="instagram"
            :model-value="modelValue.instagramHandle"
            @update:model-value="emit('update:modelValue', { ...modelValue, instagramHandle: $event })"
            class="w-full"
            placeholder="@username"
          />
        </div>

        <div>
          <FormLabel for="youtube" text="YouTube" />
          <InputText
            id="youtube"
            :model-value="modelValue.youtubeUrl"
            @update:model-value="emit('update:modelValue', { ...modelValue, youtubeUrl: $event })"
            class="w-full"
            placeholder="https://youtube.com/@..."
          />
        </div>

        <div>
          <FormLabel for="twitch" text="Twitch" />
          <InputText
            id="twitch"
            :model-value="modelValue.twitchUrl"
            @update:model-value="emit('update:modelValue', { ...modelValue, twitchUrl: $event })"
            class="w-full"
            placeholder="https://twitch.tv/..."
          />
        </div>
      </div>
    </div>
  </div>
</template>
```

#### Task 12.5: Update Leagues List View

**File:** `resources/user/js/views/Leagues/LeaguesIndex.vue`

```vue
<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLeagueStore } from '@user/stores/leagueStore';

import Button from 'primevue/button';
import Tooltip from 'primevue/tooltip';
import Card from 'primevue/card';
import DataView from 'primevue/dataview';

const router = useRouter();
const leagueStore = useLeagueStore();

const createButtonDisabled = computed(() => leagueStore.hasReachedFreeLimit);
const createButtonTooltip = computed(() =>
  leagueStore.hasReachedFreeLimit
    ? 'You have reached the free tier limit of 1 league. Upgrade to create more.'
    : ''
);

onMounted(async () => {
  await leagueStore.fetchUserLeagues();
});

function handleCreateLeague() {
  if (!createButtonDisabled.value) {
    router.push('/leagues/create');
  }
}

function handleViewLeague(id: number) {
  router.push(`/leagues/${id}`);
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">My Leagues</h1>
        <p class="text-gray-600 mt-1">Manage your racing leagues and competitions</p>
      </div>
      <Button
        label="Create League"
        icon="pi pi-plus"
        @click="handleCreateLeague"
        :disabled="createButtonDisabled"
        v-tooltip.top="createButtonTooltip"
      />
    </div>

    <!-- Empty State -->
    <div v-if="leagueStore.leagues.length === 0 && !leagueStore.loading" class="text-center py-12">
      <Card>
        <template #content>
          <div class="py-8">
            <i class="pi pi-flag text-6xl text-gray-400 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">No leagues yet</h2>
            <p class="text-gray-600 mb-6">Create your first league to start organizing races</p>
            <Button label="Create Your First League" icon="pi pi-plus" @click="handleCreateLeague" />
          </div>
        </template>
      </Card>
    </div>

    <!-- Leagues List -->
    <DataView v-else :value="leagueStore.leagues" :loading="leagueStore.loading">
      <template #list="slotProps">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card v-for="league in slotProps.items" :key="league.id" class="cursor-pointer hover:shadow-lg transition-shadow">
            <template #header>
              <img
                v-if="league.headerImageUrl"
                :src="league.headerImageUrl"
                :alt="league.name"
                class="w-full h-32 object-cover"
              />
            </template>
            <template #title>
              <div class="flex items-center gap-3">
                <img :src="league.logoUrl" :alt="league.name" class="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <div class="text-lg font-bold">{{ league.name }}</div>
                  <div v-if="league.tagline" class="text-sm text-gray-600">{{ league.tagline }}</div>
                </div>
              </div>
            </template>
            <template #content>
              <div class="space-y-2">
                <div class="text-sm text-gray-600">
                  <i class="pi pi-eye mr-1"></i>
                  {{ league.visibility }}
                </div>
              </div>
            </template>
            <template #footer>
              <Button label="View Details" class="w-full" @click="handleViewLeague(league.id)" />
            </template>
          </Card>
        </div>
      </template>
    </DataView>
  </div>
</template>
```

**Changed:**
- Added tooltip to disabled "Create League" button showing tier limit message
- Removed platform chips (they're now IDs, would need separate lookup)

---

## Testing Strategy

### Backend Tests

**Agent:** dev-be

1. **Domain Layer Unit Tests**
   - Test value object validation (LeagueName, Tagline, etc.)
   - Test entity business logic
   - Test domain events

2. **Application Service Tests**
   - Test league creation with valid data
   - Test free tier limitations (using computed count)
   - Test slug uniqueness generation
   - Test slug availability check
   - Test authorization checks

3. **Repository Tests**
   - Test entity persistence
   - Test retrieval methods
   - Test slug existence checks

4. **Controller Feature Tests**
   - Test API endpoints
   - Test validation errors
   - Test authentication requirements
   - Test slug check endpoint
   - Test platforms endpoint
   - Test timezones endpoint

### Frontend Tests

**Agent:** dev-fe-user

1. **Component Tests**
   - Test wizard navigation (step validation)
   - Test form validation per step
   - Test image upload handling
   - Test slug availability check
   - Test form submission
   - Test expandable social media section

2. **Store Tests**
   - Test API integration
   - Test state management
   - Test error handling
   - Test platform/timezone caching

3. **E2E Tests**
   - Test complete wizard flow (all 3 steps)
   - Test free tier limitation (disabled button with tooltip)
   - Test navigation between steps
   - Test slug availability check on blur

---

## Deployment Checklist

- [ ] Run migrations on production database (leagues, platforms, league_managers)
- [ ] Run platform seeder (`php artisan db:seed --class=PlatformSeeder`)
- [ ] Configure file storage (S3 or local storage)
- [ ] Set up image optimization (optional)
- [ ] Configure CORS for file uploads
- [ ] Test image upload size limits
- [ ] Verify timezone list loads correctly
- [ ] Test slug uniqueness at scale
- [ ] Set up monitoring for league creation
- [ ] Configure backup for league images
- [ ] Test free tier limitations (computed count)
- [ ] Test on multiple browsers
- [ ] Test responsive design on mobile
- [ ] Performance test with large league lists
- [ ] Test wizard navigation on mobile

---

## Dependencies Between Tasks

```
Phase 1 (Backend) → Phase 2 (Frontend Foundation) → Phase 3 (UI Wizard) → Phase 4 (Testing)

Critical Path:
1. Platform table + seeder
2. Leagues table migration
3. Platform API controller + routes
4. Timezone API controller + routes
5. League domain layer (entities, value objects)
6. League application service (with slug check method)
7. League repository implementation
8. League controller and routes (including slug check)
9. Frontend types
10. Frontend API services (league, platform, timezone)
11. Pinia store
12. Wizard components (container + 3 steps)
13. Router configuration
14. Tests
```

---

## Next Steps After League Creation

Once this feature is complete, the following features should be implemented:

1. **Competition Creation** - Creating racing series within leagues
2. **Manager Invitation System** - Adding co-managers to leagues
3. **League Settings Management** - Editing league details
4. **League Dashboard** - Analytics and overview
5. **Public League Pages** - Public-facing league profiles
6. **Platform Management (Admin)** - Admin interface for managing platforms

---

## Notes

- All file paths follow the DDD architecture established in the codebase
- Use `dev-be` agent for all backend tasks (Steps 1-6)
- Use `dev-fe-user` agent for all frontend tasks (Steps 7-12)
- Follow the guides referenced in CLAUDE.md for implementation details
- Maintain thin controllers (3-5 lines per method)
- Keep domain entities free of Laravel dependencies
- Use DTOs for all data transfer between layers
- Write tests alongside feature development
- **Wizard pattern** provides better UX than single-page form
- **No character counters** for cleaner UI
- **No draft functionality** keeps implementation simple
- **Platform management** will be added later in admin dashboard
