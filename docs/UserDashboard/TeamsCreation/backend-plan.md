# Teams Creation Feature - Backend Implementation Plan

## Overview
This plan follows the Domain-Driven Design (DDD) architecture established in this project. All implementation should follow the patterns documented in `.claude/guides/backend/ddd-overview.md` and `.claude/guides/backend/admin-backend-guide.md`.

**Agent to use:** `dev-be`

---

## Step 1: Database Layer

### Migration 1: Create teams table
**File:** `database/migrations/YYYY_MM_DD_HHMMSS_create_teams_table.php`

```php
Schema::create('teams', function (Blueprint $table) {
    $table->id();
    $table->foreignId('season_id')->constrained('seasons')->onDelete('cascade');
    $table->string('name', 60);
    $table->string('logo_url')->nullable();
    $table->timestamps();

    // Indexes
    $table->index('season_id');
});
```

**Notes:**
- Cascade delete: When season is deleted, teams are automatically deleted
- No unique constraint on name (teams can have duplicate names within a season)
- logo_url stores the full URL path to the uploaded logo

### Migration 2: Add team_id to season_drivers
**File:** `database/migrations/YYYY_MM_DD_HHMMSS_add_team_id_to_season_drivers_table.php`

```php
Schema::table('season_drivers', function (Blueprint $table) {
    $table->foreignId('team_id')->nullable()->after('season_id')->constrained('teams')->onDelete('set null');

    // Index for queries filtering by team
    $table->index('team_id');
});
```

**Notes:**
- Nullable: Drivers don't need a team
- `onDelete('set null')`: When team is deleted, driver's team_id becomes null (Privateer)

---

## Step 2: Domain Layer

### 2.1 Team Entity
**File:** `app/Domain/Team/Entities/Team.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Team\Entities;

use App\Domain\Team\ValueObjects\TeamName;
use App\Domain\Team\Events\TeamCreated;
use App\Domain\Team\Events\TeamUpdated;
use App\Domain\Team\Events\TeamDeleted;

final class Team
{
    private array $domainEvents = [];

    public function __construct(
        private ?int $id,
        private int $seasonId,
        private TeamName $name,
        private ?string $logoUrl,
        private \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
    ) {}

    public static function create(
        int $seasonId,
        TeamName $name,
        ?string $logoUrl = null,
    ): self {
        $team = new self(
            id: null,
            seasonId: $seasonId,
            name: $name,
            logoUrl: $logoUrl,
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
        );

        $team->recordEvent(new TeamCreated(
            seasonId: $seasonId,
            name: $name->value(),
            logoUrl: $logoUrl,
        ));

        return $team;
    }

    public function update(TeamName $name, ?string $logoUrl): void
    {
        $this->name = $name;
        $this->logoUrl = $logoUrl;
        $this->updatedAt = new \DateTimeImmutable();

        $this->recordEvent(new TeamUpdated(
            teamId: $this->id,
            name: $name->value(),
            logoUrl: $logoUrl,
        ));
    }

    public function delete(): void
    {
        $this->recordEvent(new TeamDeleted(
            teamId: $this->id,
            seasonId: $this->seasonId,
        ));
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function seasonId(): int { return $this->seasonId; }
    public function name(): TeamName { return $this->name; }
    public function logoUrl(): ?string { return $this->logoUrl; }
    public function createdAt(): \DateTimeImmutable { return $this->createdAt; }
    public function updatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    // Domain Events
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }

    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }
}
```

### 2.2 TeamName Value Object
**File:** `app/Domain/Team/ValueObjects/TeamName.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Team\ValueObjects;

use App\Domain\Team\Exceptions\InvalidTeamNameException;

final readonly class TeamName
{
    private const MIN_LENGTH = 2;
    private const MAX_LENGTH = 60;

    public function __construct(
        private string $value,
    ) {
        $this->validate();
    }

    public function value(): string
    {
        return $this->value;
    }

    private function validate(): void
    {
        $length = mb_strlen($this->value);

        if ($length < self::MIN_LENGTH) {
            throw InvalidTeamNameException::tooShort(self::MIN_LENGTH);
        }

        if ($length > self::MAX_LENGTH) {
            throw InvalidTeamNameException::tooLong(self::MAX_LENGTH);
        }

        if (trim($this->value) === '') {
            throw InvalidTeamNameException::empty();
        }
    }

    public function equals(TeamName $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

### 2.3 Domain Events
**File:** `app/Domain/Team/Events/TeamCreated.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Team\Events;

final readonly class TeamCreated
{
    public function __construct(
        public int $seasonId,
        public string $name,
        public ?string $logoUrl,
    ) {}
}
```

**File:** `app/Domain/Team/Events/TeamUpdated.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Team\Events;

final readonly class TeamUpdated
{
    public function __construct(
        public ?int $teamId,
        public string $name,
        public ?string $logoUrl,
    ) {}
}
```

**File:** `app/Domain/Team/Events/TeamDeleted.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Team\Events;

final readonly class TeamDeleted
{
    public function __construct(
        public ?int $teamId,
        public int $seasonId,
    ) {}
}
```

### 2.4 Domain Exceptions
**File:** `app/Domain/Team/Exceptions/TeamNotFoundException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Team\Exceptions;

use Exception;

final class TeamNotFoundException extends Exception
{
    public static function withId(int $teamId): self
    {
        return new self("Team with ID {$teamId} not found.");
    }
}
```

**File:** `app/Domain/Team/Exceptions/InvalidTeamNameException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Team\Exceptions;

use Exception;

final class InvalidTeamNameException extends Exception
{
    public static function tooShort(int $minLength): self
    {
        return new self("Team name must be at least {$minLength} characters.");
    }

    public static function tooLong(int $maxLength): self
    {
        return new self("Team name cannot exceed {$maxLength} characters.");
    }

    public static function empty(): self
    {
        return new self("Team name cannot be empty.");
    }
}
```

### 2.5 Repository Interface
**File:** `app/Domain/Team/Repositories/TeamRepositoryInterface.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Team\Repositories;

use App\Domain\Team\Entities\Team;

interface TeamRepositoryInterface
{
    /**
     * Find a team by ID
     */
    public function findById(int $id): ?Team;

    /**
     * Get all teams for a season
     * @return Team[]
     */
    public function findBySeasonId(int $seasonId): array;

    /**
     * Count drivers assigned to a team
     */
    public function countDriversByTeamId(int $teamId): int;

    /**
     * Save (create or update) a team
     */
    public function save(Team $team): Team;

    /**
     * Delete a team (hard delete)
     */
    public function delete(int $id): void;
}
```

---

## Step 3: Application Layer

### 3.1 DTOs
**File:** `app/Application/Team/DTOs/TeamData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Team\DTOs;

use Spatie\LaravelData\Data;

final class TeamData extends Data
{
    public function __construct(
        public int $id,
        public int $season_id,
        public string $name,
        public ?string $logo_url,
        public string $created_at,
        public string $updated_at,
    ) {}
}
```

**File:** `app/Application/Team/DTOs/CreateTeamData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Team\DTOs;

use Spatie\LaravelData\Data;
use Illuminate\Http\UploadedFile;

final class CreateTeamData extends Data
{
    public function __construct(
        public string $name,
        public ?UploadedFile $logo = null,
    ) {}
}
```

**File:** `app/Application/Team/DTOs/UpdateTeamData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Team\DTOs;

use Spatie\LaravelData\Data;
use Illuminate\Http\UploadedFile;

final class UpdateTeamData extends Data
{
    public function __construct(
        public string $name,
        public ?UploadedFile $logo = null,
        public bool $remove_logo = false,
    ) {}
}
```

### 3.2 Application Service
**File:** `app/Application/Team/Services/TeamApplicationService.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Team\Services;

use App\Application\Team\DTOs\CreateTeamData;
use App\Application\Team\DTOs\TeamData;
use App\Application\Team\DTOs\UpdateTeamData;
use App\Domain\Team\Entities\Team;
use App\Domain\Team\Exceptions\TeamNotFoundException;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Domain\Team\ValueObjects\TeamName;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final readonly class TeamApplicationService
{
    public function __construct(
        private TeamRepositoryInterface $teamRepository,
    ) {}

    /**
     * Get all teams for a season
     * @return TeamData[]
     */
    public function getTeamsBySeasonId(int $seasonId): array
    {
        $teams = $this->teamRepository->findBySeasonId($seasonId);

        return array_map(
            fn(Team $team) => $this->mapToDto($team),
            $teams
        );
    }

    /**
     * Get a team by ID
     */
    public function getTeamById(int $teamId): TeamData
    {
        $team = $this->teamRepository->findById($teamId);

        if (!$team) {
            throw TeamNotFoundException::withId($teamId);
        }

        return $this->mapToDto($team);
    }

    /**
     * Create a new team
     */
    public function createTeam(int $seasonId, CreateTeamData $data): TeamData
    {
        return DB::transaction(function () use ($seasonId, $data) {
            // Upload logo if provided
            $logoUrl = null;
            if ($data->logo) {
                $logoUrl = $this->uploadLogo($data->logo, $seasonId);
            }

            // Create domain entity
            $team = Team::create(
                seasonId: $seasonId,
                name: new TeamName($data->name),
                logoUrl: $logoUrl,
            );

            // Persist
            $team = $this->teamRepository->save($team);

            return $this->mapToDto($team);
        });
    }

    /**
     * Update an existing team
     */
    public function updateTeam(int $teamId, UpdateTeamData $data): TeamData
    {
        return DB::transaction(function () use ($teamId, $data) {
            $team = $this->teamRepository->findById($teamId);

            if (!$team) {
                throw TeamNotFoundException::withId($teamId);
            }

            // Handle logo update
            $logoUrl = $team->logoUrl();

            if ($data->remove_logo) {
                // Remove existing logo
                if ($logoUrl) {
                    $this->deleteLogo($logoUrl);
                }
                $logoUrl = null;
            } elseif ($data->logo) {
                // Replace with new logo
                if ($logoUrl) {
                    $this->deleteLogo($logoUrl);
                }
                $logoUrl = $this->uploadLogo($data->logo, $team->seasonId());
            }

            // Update entity
            $team->update(
                name: new TeamName($data->name),
                logoUrl: $logoUrl,
            );

            // Persist
            $team = $this->teamRepository->save($team);

            return $this->mapToDto($team);
        });
    }

    /**
     * Delete a team
     */
    public function deleteTeam(int $teamId): void
    {
        DB::transaction(function () use ($teamId) {
            $team = $this->teamRepository->findById($teamId);

            if (!$team) {
                throw TeamNotFoundException::withId($teamId);
            }

            // Delete logo if exists
            if ($team->logoUrl()) {
                $this->deleteLogo($team->logoUrl());
            }

            // Delete team (will set team_id to null for all drivers due to migration)
            $team->delete();
            $this->teamRepository->delete($teamId);
        });
    }

    /**
     * Get driver count for a team (used in delete confirmation)
     */
    public function getDriverCount(int $teamId): int
    {
        return $this->teamRepository->countDriversByTeamId($teamId);
    }

    /**
     * Map Team entity to DTO
     */
    private function mapToDto(Team $team): TeamData
    {
        return new TeamData(
            id: $team->id(),
            season_id: $team->seasonId(),
            name: $team->name()->value(),
            logo_url: $team->logoUrl(),
            created_at: $team->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $team->updatedAt()->format('Y-m-d H:i:s'),
        );
    }

    /**
     * Upload team logo
     */
    private function uploadLogo(mixed $file, int $seasonId): string
    {
        $path = $file->store("teams/season-{$seasonId}", 'public');
        return Storage::url($path);
    }

    /**
     * Delete team logo
     */
    private function deleteLogo(string $logoUrl): void
    {
        $path = str_replace('/storage/', '', $logoUrl);
        Storage::disk('public')->delete($path);
    }
}
```

---

## Step 4: Infrastructure Layer

### 4.1 Eloquent Model
**File:** `app/Infrastructure/Persistence/Eloquent/Models/Team.php`

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $season_id
 * @property string $name
 * @property string|null $logo_url
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
final class Team extends Model
{
    protected $table = 'teams';

    protected $fillable = [
        'season_id',
        'name',
        'logo_url',
    ];

    protected $casts = [
        'season_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    public function seasonDrivers(): HasMany
    {
        return $this->hasMany(SeasonDriver::class);
    }
}
```

### 4.2 Repository Implementation
**File:** `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentTeamRepository.php`

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Team\Entities\Team as TeamEntity;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Domain\Team\ValueObjects\TeamName;
use App\Infrastructure\Persistence\Eloquent\Models\Team as TeamModel;

final class EloquentTeamRepository implements TeamRepositoryInterface
{
    public function findById(int $id): ?TeamEntity
    {
        $model = TeamModel::find($id);

        return $model ? $this->toDomain($model) : null;
    }

    public function findBySeasonId(int $seasonId): array
    {
        $models = TeamModel::where('season_id', $seasonId)
            ->orderBy('name')
            ->get();

        return $models->map(fn($model) => $this->toDomain($model))->all();
    }

    public function countDriversByTeamId(int $teamId): int
    {
        return TeamModel::find($teamId)?->seasonDrivers()->count() ?? 0;
    }

    public function save(TeamEntity $team): TeamEntity
    {
        if ($team->id()) {
            // Update existing
            $model = TeamModel::findOrFail($team->id());
            $model->update($this->toArray($team));
        } else {
            // Create new
            $model = TeamModel::create($this->toArray($team));
        }

        return $this->toDomain($model);
    }

    public function delete(int $id): void
    {
        TeamModel::destroy($id);
    }

    /**
     * Map Eloquent model to Domain entity
     */
    private function toDomain(TeamModel $model): TeamEntity
    {
        return new TeamEntity(
            id: $model->id,
            seasonId: $model->season_id,
            name: new TeamName($model->name),
            logoUrl: $model->logo_url,
            createdAt: $model->created_at->toDateTimeImmutable(),
            updatedAt: $model->updated_at->toDateTimeImmutable(),
        );
    }

    /**
     * Map Domain entity to array for Eloquent
     */
    private function toArray(TeamEntity $team): array
    {
        $data = [
            'season_id' => $team->seasonId(),
            'name' => $team->name()->value(),
            'logo_url' => $team->logoUrl(),
        ];

        if ($team->id()) {
            $data['id'] = $team->id();
        }

        return $data;
    }
}
```

### 4.3 Service Provider Registration
**File:** `app/Providers/AppServiceProvider.php` (update)

Add to the `register()` method:

```php
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentTeamRepository;

$this->app->bind(TeamRepositoryInterface::class, EloquentTeamRepository::class);
```

---

## Step 5: Interface Layer (HTTP)

### 5.1 Form Requests
**File:** `app/Http/Requests/User/CreateTeamRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

final class CreateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,svg', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Team name is required.',
            'name.min' => 'Team name must be at least 2 characters.',
            'name.max' => 'Team name cannot exceed 60 characters.',
            'logo.image' => 'Logo must be an image file.',
            'logo.mimes' => 'Logo must be a JPG, PNG, or SVG file.',
            'logo.max' => 'Logo cannot exceed 2MB.',
        ];
    }
}
```

**File:** `app/Http/Requests/User/UpdateTeamRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,svg', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Team name is required.',
            'name.min' => 'Team name must be at least 2 characters.',
            'name.max' => 'Team name cannot exceed 60 characters.',
            'logo.image' => 'Logo must be an image file.',
            'logo.mimes' => 'Logo must be a JPG, PNG, or SVG file.',
            'logo.max' => 'Logo cannot exceed 2MB.',
        ];
    }
}
```

**File:** `app/Http/Requests/User/AssignDriverTeamRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

final class AssignDriverTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'team_id.exists' => 'Selected team does not exist.',
        ];
    }
}
```

### 5.2 Controller
**File:** `app/Http/Controllers/User/TeamController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Team\DTOs\CreateTeamData;
use App\Application\Team\DTOs\UpdateTeamData;
use App\Application\Team\Services\TeamApplicationService;
use App\Domain\Team\Exceptions\InvalidTeamNameException;
use App\Domain\Team\Exceptions\TeamNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\CreateTeamRequest;
use App\Http\Requests\User\UpdateTeamRequest;
use Illuminate\Http\JsonResponse;

final class TeamController extends Controller
{
    public function __construct(
        private readonly TeamApplicationService $teamService,
    ) {}

    /**
     * List all teams for a season
     */
    public function index(int $seasonId): JsonResponse
    {
        try {
            $teams = $this->teamService->getTeamsBySeasonId($seasonId);
            return ApiResponse::success($teams);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to load teams', null, 500);
        }
    }

    /**
     * Create a new team
     */
    public function store(CreateTeamRequest $request, int $seasonId): JsonResponse
    {
        try {
            $data = CreateTeamData::from($request->validated());
            $team = $this->teamService->createTeam($seasonId, $data);

            return ApiResponse::created($team->toArray());
        } catch (InvalidTeamNameException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to create team', null, 500);
        }
    }

    /**
     * Update a team
     */
    public function update(UpdateTeamRequest $request, int $seasonId, int $teamId): JsonResponse
    {
        try {
            $data = UpdateTeamData::from($request->validated());
            $team = $this->teamService->updateTeam($teamId, $data);

            return ApiResponse::success($team->toArray());
        } catch (TeamNotFoundException $e) {
            return ApiResponse::notFound($e->getMessage());
        } catch (InvalidTeamNameException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to update team', null, 500);
        }
    }

    /**
     * Delete a team
     */
    public function destroy(int $seasonId, int $teamId): JsonResponse
    {
        try {
            $this->teamService->deleteTeam($teamId);
            return ApiResponse::success(['message' => 'Team deleted successfully']);
        } catch (TeamNotFoundException $e) {
            return ApiResponse::notFound($e->getMessage());
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to delete team', null, 500);
        }
    }

    /**
     * Get driver count for a team (used in delete confirmation)
     */
    public function driverCount(int $seasonId, int $teamId): JsonResponse
    {
        try {
            $count = $this->teamService->getDriverCount($teamId);
            return ApiResponse::success(['count' => $count]);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to get driver count', null, 500);
        }
    }
}
```

### 5.3 SeasonDriverController Update
**File:** `app/Http/Controllers/User/SeasonDriverController.php` (add method)

```php
/**
 * Assign/change driver's team
 */
public function assignTeam(AssignDriverTeamRequest $request, int $seasonId, int $driverId): JsonResponse
{
    try {
        DB::table('season_drivers')
            ->where('id', $driverId)
            ->where('season_id', $seasonId)
            ->update(['team_id' => $request->validated('team_id')]);

        return ApiResponse::success(['message' => 'Team assignment updated']);
    } catch (\Exception $e) {
        return ApiResponse::error('Failed to assign team', null, 500);
    }
}
```

---

## Step 6: Routes

**File:** `routes/subdomain.php` (add to user subdomain group)

Add within the `Route::domain('app.virtualracingleagues.localhost')` group:

```php
// Team Management
Route::prefix('api/seasons/{seasonId}/teams')
    ->middleware(['auth:web', 'user.authenticate'])
    ->controller(TeamController::class)
    ->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::put('/{teamId}', 'update');
        Route::delete('/{teamId}', 'destroy');
        Route::get('/{teamId}/driver-count', 'driverCount');
    });

// Driver Team Assignment
Route::put('api/seasons/{seasonId}/drivers/{driverId}/team', [SeasonDriverController::class, 'assignTeam'])
    ->middleware(['auth:web', 'user.authenticate']);
```

---

## Step 7: Update SeasonDriver Models/DTOs

### Update Eloquent Model
**File:** `app/Infrastructure/Persistence/Eloquent/Models/SeasonDriver.php`

Add to `$fillable`:
```php
'team_id',
```

Add to `$casts`:
```php
'team_id' => 'integer',
```

Add relationship:
```php
public function team(): BelongsTo
{
    return $this->belongsTo(Team::class);
}
```

### Update SeasonDriverData DTO
**File:** `app/Application/SeasonDriver/DTOs/SeasonDriverData.php`

Add property:
```php
public ?int $team_id,
public ?string $team_name,
public ?string $team_logo_url,
```

Update mapping in `SeasonDriverApplicationService` to include team relationship.

---

## Step 8: Testing

### Domain Layer Tests
**File:** `tests/Unit/Domain/Team/Entities/TeamTest.php`

Test:
- Team creation
- Team update
- Domain events recording
- Value object validation

### Application Layer Tests
**File:** `tests/Unit/Application/Team/Services/TeamApplicationServiceTest.php`

Test:
- Creating team with/without logo
- Updating team name and logo
- Deleting team
- Logo upload/deletion

### Feature Tests
**File:** `tests/Feature/User/TeamControllerTest.php`

Test:
- GET /api/seasons/{id}/teams - List teams
- POST /api/seasons/{id}/teams - Create team
- PUT /api/seasons/{id}/teams/{id} - Update team
- DELETE /api/seasons/{id}/teams/{id} - Delete team
- PUT /api/seasons/{id}/drivers/{id}/team - Assign team

---

## Step 9: Run Migrations

```bash
php artisan migrate
```

---

## Implementation Checklist

### Database
- [ ] Create teams table migration
- [ ] Add team_id to season_drivers migration
- [ ] Run migrations

### Domain Layer
- [ ] Team entity
- [ ] TeamName value object
- [ ] Domain events (Created, Updated, Deleted)
- [ ] Domain exceptions
- [ ] Repository interface

### Application Layer
- [ ] DTOs (TeamData, CreateTeamData, UpdateTeamData)
- [ ] TeamApplicationService

### Infrastructure Layer
- [ ] Team Eloquent model
- [ ] EloquentTeamRepository
- [ ] Register repository binding in AppServiceProvider

### Interface Layer
- [ ] Form requests (Create, Update, AssignTeam)
- [ ] TeamController
- [ ] Update SeasonDriverController (assignTeam method)
- [ ] Add routes to subdomain.php

### Updates
- [ ] Update SeasonDriver Eloquent model (team relationship)
- [ ] Update SeasonDriverData DTO (team fields)
- [ ] Update SeasonDriverApplicationService (include team in queries)

### Testing
- [ ] Domain layer unit tests
- [ ] Application service tests
- [ ] Feature tests for all endpoints
- [ ] Test logo upload/deletion
- [ ] Test team deletion cascade behavior

---

## Notes

1. **File Storage**: Team logos stored in `storage/app/public/teams/season-{id}/`
2. **Hard Delete**: Teams are permanently deleted (no soft delete as per requirements)
3. **Cascade Behavior**: Database handles setting team_id to null on team deletion
4. **Authorization**: All routes protected by `auth:web` and `user.authenticate` middleware
5. **Validation**: TeamName value object enforces 2-60 character limit
6. **Image Validation**: Max 2MB, JPG/PNG/SVG only

## Dependencies

No new Composer packages required. Uses existing:
- spatie/laravel-data (DTOs)
- Laravel Storage (file uploads)
- Laravel Validation (form requests)
