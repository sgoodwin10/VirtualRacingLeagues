# Backend Testing Guide

This guide explains the PHPUnit testing configuration optimized for Domain-Driven Design (DDD) architecture.

## Test Suite Architecture

The test suite is organized by DDD layers with 128+ test files:

```
tests/
├── TestCase.php                     # Custom base test class
├── Fixtures/                        # Test fixtures
│   └── TestMediaModel.php           # Media library test fixture
├── Unit/                            # 57+ tests (no HTTP stack)
│   ├── Domain/                      # Domain Layer (pure business logic)
│   │   ├── Competition/
│   │   │   ├── Entities/            # Competition, Season, Round, Race entities
│   │   │   └── ValueObjects/        # CompetitionSlug, SeasonStatus, etc.
│   │   ├── Contact/                 # Contact form domain tests
│   │   ├── Division/
│   │   │   └── ValueObjects/        # DivisionName, etc.
│   │   ├── Driver/
│   │   │   ├── Entities/            # Driver entity tests
│   │   │   ├── Services/            # Domain service tests
│   │   │   └── ValueObjects/        # DriverName, PlatformIdentifiers, etc.
│   │   ├── League/
│   │   │   ├── Entities/            # League entity tests
│   │   │   └── ValueObjects/        # LeagueSlug, LeagueVisibility, Tagline, etc.
│   │   ├── Shared/                  # Shared value objects (EmailAddress, FullName)
│   │   ├── SiteConfig/              # Site configuration domain
│   │   └── User/                    # User domain tests
│   ├── Application/                 # Application Layer tests
│   │   ├── Driver/DTOs/             # DTO validation tests
│   │   ├── League/Services/         # Application service tests
│   │   └── Activity/                # Activity logging service tests
│   ├── Infrastructure/              # Infrastructure Layer tests
│   │   ├── Cache/                   # Cache service tests
│   │   ├── Repositories/            # Repository unit tests
│   │   └── Eloquent/Models/         # Eloquent model tests
│   ├── Policies/                    # Authorization policies
│   └── Rules/                       # Custom validation rules
├── Integration/                     # 3 tests (with database)
│   └── Persistence/
│       └── Eloquent/
│           └── Repositories/        # Repository integration tests
├── Feature/                         # 66+ tests (full HTTP stack)
│   ├── Auth/                        # Authentication tests
│   ├── Admin/                       # Admin feature tests
│   ├── User/                        # User feature tests
│   ├── Public/                      # Public site tests
│   ├── Http/Controllers/
│   │   ├── Admin/                   # Admin controller tests
│   │   └── User/                    # User controller tests
│   ├── Api/Public/                  # Public API endpoint tests
│   ├── Application/                 # Application layer integration tests
│   ├── Console/Commands/            # Artisan command tests
│   ├── Infrastructure/Media/        # Media library tests
│   └── Notifications/               # Notification tests
└── Browser/                         # E2E tests (Playwright)
    ├── admin/
    ├── app/
    ├── public/
    └── utils/
```

## Running Tests

### All Tests
```bash
composer test
```

### By Test Suite
```bash
composer test:domain       # Domain tests (fastest - no database)
composer test:unit         # Unit tests (SQLite in-memory)
composer test:integration  # Integration tests (with MariaDB)
composer test:feature      # Feature tests (SQLite in-memory)
composer test:coverage     # With coverage report (min 70%)
```

### With MariaDB (Production-like)
```bash
composer test:feature:db   # Feature tests with MariaDB
composer test:all:db       # All tests with MariaDB
```

### Setup Test Environment
```bash
composer test:setup        # Creates .env.testing, sets up test database
```

## Test Suites

### 1. Domain Suite (`tests/Unit/Domain/`)
**Purpose:** Test pure business logic without framework dependencies

**Characteristics:**
- Extends `PHPUnit\Framework\TestCase` directly (NOT Laravel's TestCase)
- No database access required
- Fastest execution (no setup overhead)
- Tests entities, value objects, domain events, domain services

**Example:**
```php
namespace Tests\Unit\Domain\Driver\Entities;

use PHPUnit\Framework\TestCase;
use App\Domain\Driver\Entities\Driver;
use App\Domain\Driver\ValueObjects\DriverName;
use App\Domain\Driver\ValueObjects\PlatformIdentifiers;

final class DriverTest extends TestCase
{
    public function test_can_create_driver(): void
    {
        $name = DriverName::from('John', 'Doe', null);
        $platformIds = PlatformIdentifiers::from('JohnDoe77', null, null, null);

        $driver = Driver::create(
            name: $name,
            platformIds: $platformIds,
            email: 'john@example.com',
            phone: '555-1234'
        );

        $this->assertNull($driver->id());
        $this->assertEquals('John Doe', $driver->name()->displayName());
        $this->assertEquals('john-doe', $driver->slug()->value());
    }

    public function test_can_update_profile(): void
    {
        $driver = Driver::create(...);

        $driver->updateProfile($newName, $newPlatformIds, 'jane@example.com', '555-9999');

        $this->assertEquals('Jane Doe', $driver->name()->displayName());
    }
}
```

**Value Object Test Example:**
```php
namespace Tests\Unit\Domain\Division\ValueObjects;

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use App\Domain\Division\ValueObjects\DivisionName;
use App\Domain\Division\Exceptions\InvalidDivisionNameException;

class DivisionNameTest extends TestCase
{
    #[Test]
    public function it_creates_valid_division_name(): void
    {
        $name = DivisionName::from('Pro Division');
        $this->assertEquals('Pro Division', $name->value());
    }

    #[Test]
    public function it_throws_exception_for_too_short_name(): void
    {
        $this->expectException(InvalidDivisionNameException::class);
        $this->expectExceptionMessage('Division name must be at least 2 characters long');

        DivisionName::from('A');
    }

    #[Test]
    public function it_checks_equality_correctly(): void
    {
        $name1 = DivisionName::from('Pro Division');
        $name2 = DivisionName::from('Pro Division');
        $this->assertTrue($name1->equals($name2));
    }
}
```

### 2. Unit Suite (`tests/Unit/` excluding Domain)
**Purpose:** Test Laravel-specific units and infrastructure components

**Characteristics:**
- Extends `Tests\TestCase` (custom base)
- Uses `RefreshDatabase` trait when database needed
- SQLite in-memory database
- Tests policies, validation rules, cache services, DTOs

**Application Service Test Example:**
```php
namespace Tests\Unit\Application\League\Services;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Application\League\Services\LeagueApplicationService;
use ReflectionClass;

final class LeagueApplicationServiceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @dataProvider millisecondsToTimeProvider
     */
    public function test_format_milliseconds_to_time(
        ?int $milliseconds,
        ?string $expected
    ): void {
        $service = $this->app->make(LeagueApplicationService::class);

        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('formatMillisecondsToTime');
        $method->setAccessible(true);

        $result = $method->invoke($service, $milliseconds);

        $this->assertSame($expected, $result);
    }

    public static function millisecondsToTimeProvider(): array
    {
        return [
            'null input' => ['milliseconds' => null, 'expected' => null],
            'zero milliseconds' => ['milliseconds' => 0, 'expected' => null],
            '1 second' => ['milliseconds' => 1000, 'expected' => '1.000'],
            '1:25.123' => ['milliseconds' => 85123, 'expected' => '1:25.123'],
        ];
    }
}
```

**Repository Unit Test Example:**
```php
namespace Tests\Unit\Infrastructure\Repositories;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentRaceResultRepository;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\League;

final class EloquentRaceResultRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentRaceResultRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new EloquentRaceResultRepository();
    }

    public function test_has_orphaned_results_returns_true_when_null_division_exists(): void
    {
        // Arrange
        $user = User::factory()->create();
        $league = League::factory()->create(['owner_user_id' => $user->id]);
        // ... setup test data with null division_id

        // Act
        $result = $this->repository->hasOrphanedResultsForRound($round->id);

        // Assert
        $this->assertTrue($result);
    }
}
```

### 3. Integration Suite (`tests/Integration/`)
**Purpose:** Test infrastructure layer against production-like database

**Characteristics:**
- Uses `RefreshDatabase` trait
- Runs against MariaDB test database
- Tests complex queries and database-specific features
- Verifies entity ↔ Eloquent mapping

**Location:** `tests/Integration/Persistence/Eloquent/Repositories/`
- `EloquentAdminRepositoryTest.php`
- `EloquentLeagueRepositoryTest.php`
- `EloquentUserRepositoryTest.php`

### 4. Feature Suite (`tests/Feature/`)
**Purpose:** Test full application stack including HTTP requests

**Characteristics:**
- Extends `Tests\TestCase`
- Uses `RefreshDatabase` trait
- Makes actual HTTP requests (JSON API)
- Tests authentication, authorization, validation
- SQLite in-memory (fast) or MariaDB (production-like)

**Authentication Test Example:**
```php
namespace Tests\Feature\Auth;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'user' => ['id', 'first_name', 'last_name', 'email'],
                'message',
            ],
        ]);

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['message' => 'Invalid credentials provided']);
        $this->assertGuest('web');
    }
}
```

**Admin Authentication Test Example:**
```php
namespace Tests\Feature\Admin;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AdminAuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_valid_credentials(): void
    {
        $admin = Admin::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login successful.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'admin' => ['id', 'first_name', 'last_name', 'name', 'email', 'role', 'status'],
                ],
            ]);

        $this->assertAuthenticated('admin');
    }

    public function test_inactive_admin_cannot_login(): void
    {
        Admin::factory()->create([
            'email' => 'inactive@example.com',
            'password' => Hash::make('password123'),
            'status' => 'inactive',
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'inactive@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest('admin');
    }

    public function test_admin_can_update_password(): void
    {
        $admin = Admin::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/profile', [
                'current_password' => 'oldpassword',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(200);

        $admin->refresh();
        $this->assertTrue(Hash::check('newpassword123', $admin->password));
    }
}
```

## Custom TestCase

The custom `tests/TestCase.php` provides:

```php
abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Disable CSRF for easier API testing
        $this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class);
    }

    protected function afterRefreshingDatabase()
    {
        // Seed platforms for all tests
        $this->seed(\Database\Seeders\PlatformSeeder::class);
    }

    // Subdomain helpers for multi-tenant routing
    protected function onAppDomain(): static
    {
        $this->withServerVariables(['HTTP_HOST' => 'app.virtualracingleagues.localhost']);
        return $this;
    }

    protected function onAdminDomain(): static
    {
        $this->withServerVariables(['HTTP_HOST' => 'admin.virtualracingleagues.localhost']);
        return $this;
    }

    protected function onMainDomain(): static
    {
        $this->withServerVariables(['HTTP_HOST' => 'virtualracingleagues.localhost']);
        return $this;
    }

    protected function useTestDatabase(): void
    {
        config(['database.default' => 'testing']);
    }
}
```

## Database Strategy

### Dual Database Approach

1. **SQLite (`:memory:`)** - Default for Domain/Unit/Feature
   - Extremely fast (in-memory)
   - No setup required
   - Automatically reset between tests
   - Good for most testing scenarios

2. **MariaDB (`testing` connection)** - For Integration tests
   - Production-like environment
   - Tests database-specific features (JSON columns, full-text search)
   - Catches database compatibility issues

### Database Traits

**RefreshDatabase** (used in 65+ tests):
- Refreshes database after each test
- Runs migrations automatically
- Seeds platforms via `afterRefreshingDatabase()`
- Provides test isolation

## Test Factories

Located in `database/factories/`:

```php
// UserFactory.php
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'alias' => fake()->optional(0.7)->userName(),
            'uuid' => fake()->optional(0.8)->uuid(),
            'status' => 'active',
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
```

**Available Factories:**
- `AdminFactory`
- `CompetitionFactory`
- `DivisionFactory`
- `DriverFactory`
- `LeagueFactory`
- `LeagueDriverFactory`
- `PlatformFactory`
- `PlatformTrackFactory`
- `PlatformTrackLocationFactory`
- `RaceFactory`
- `RoundFactory`
- `SeasonFactory`
- `SeasonDriverFactory`
- `SiteConfigFactory`
- `TeamFactory`
- `UserFactory`

**Usage:**
```php
$user = User::factory()->create();
$user = User::factory()->create(['email' => 'custom@example.com']);
$users = User::factory()->count(5)->create();
$unverifiedUser = User::factory()->unverified()->create();
```

## Testing Patterns

### API Request/Response Testing

```php
// POST request
$response = $this->postJson('/api/login', [
    'email' => 'test@example.com',
    'password' => 'password123',
]);

// GET request
$response = $this->getJson('/api/profile');

// PUT request
$response = $this->putJson('/api/profile', [
    'first_name' => 'Updated',
]);

// DELETE request
$response = $this->deleteJson('/api/resource/1');
```

### Response Assertions

```php
$response->assertStatus(200);           // Status code
$response->assertStatus(422);           // Validation error
$response->assertStatus(401);           // Unauthorized
$response->assertStatus(403);           // Forbidden

$response->assertJson([                 // Exact JSON match
    'success' => true,
    'message' => 'Login successful.',
]);

$response->assertJsonStructure([        // Check structure
    'data' => [
        'user' => ['id', 'email', 'name'],
    ],
]);

$response->assertJsonValidationErrors(['email', 'password']);
```

### Authentication Testing

```php
// Authenticate as user
$this->actingAs($user, 'web');

// Authenticate as admin
$this->actingAs($admin, 'admin');

// Assert authentication
$this->assertAuthenticated('web');
$this->assertAuthenticated('admin');
$this->assertAuthenticatedAs($user, 'web');
$this->assertGuest('web');
$this->assertGuest('admin');
```

### Subdomain Testing

```php
// Test on app subdomain
$this->onAppDomain()
    ->actingAs($user, 'web')
    ->getJson('/api/profile')
    ->assertStatus(200);

// Test on admin subdomain
$this->onAdminDomain()
    ->actingAs($admin, 'admin')
    ->getJson('/api/admin/users')
    ->assertStatus(200);
```

### Notification Testing

```php
use Illuminate\Support\Facades\Notification;

Notification::fake();

// Trigger notification...

Notification::assertSent(EmailVerificationNotification::class);
```

### Activity Log Testing

```php
use Spatie\Activitylog\Models\Activity;

// Perform action that logs activity...

$activity = Activity::first();
$this->assertEquals('created', $activity->description);
$this->assertEquals($user->id, $activity->causer_id);
```

### Data Providers

```php
/**
 * @dataProvider validEmailProvider
 */
public function test_accepts_valid_emails(string $email): void
{
    $vo = EmailAddress::from($email);
    $this->assertEquals($email, $vo->value());
}

public static function validEmailProvider(): array
{
    return [
        'simple email' => ['test@example.com'],
        'with subdomain' => ['test@mail.example.com'],
        'with plus' => ['test+tag@example.com'],
    ];
}
```

## PHPUnit Configuration

Key settings in `phpunit.xml`:

```xml
<phpunit
    bootstrap="vendor/autoload.php"
    colors="true"
    failOnRisky="true"
    failOnWarning="true"
    executionOrder="random"
    cacheDirectory=".phpunit.cache"
    beStrictAboutOutputDuringTests="true">
```

**Configuration Highlights:**
- `executionOrder="random"` - Catches test order dependencies
- `failOnRisky="true"` - Strict test quality
- `failOnWarning="true"` - Treats warnings as failures
- `beStrictAboutOutputDuringTests="true"` - No uncontrolled output

**Environment Variables:**
```xml
<env name="APP_ENV" value="testing"/>
<env name="BCRYPT_ROUNDS" value="4"/>          <!-- Fast hashing -->
<env name="CACHE_STORE" value="array"/>         <!-- No Redis -->
<env name="MAIL_MAILER" value="array"/>         <!-- No email sending -->
<env name="QUEUE_CONNECTION" value="sync"/>     <!-- Synchronous queues -->
<env name="SESSION_DRIVER" value="array"/>      <!-- Array sessions -->
<env name="DB_CONNECTION" value="sqlite"/>      <!-- SQLite default -->
<env name="DB_DATABASE" value=":memory:"/>      <!-- In-memory -->
<env name="SCOUT_DRIVER" value="null"/>         <!-- No Elasticsearch -->
```

## Best Practices

1. **Choose the right test type:**
   - Domain entities/value objects → Domain tests (pure PHP)
   - Repositories, services → Unit tests (with RefreshDatabase)
   - API endpoints → Feature tests
   - Complex queries → Integration tests (MariaDB)

2. **Test isolation:**
   - Each test should be independent
   - Use `RefreshDatabase` for database tests
   - Random execution order catches hidden dependencies

3. **Use factories:**
   - Don't manually create test data
   - Use state methods for variations (`->unverified()`)
   - Use `count()` for multiple records

4. **Descriptive naming:**
   - `test_user_can_login_with_valid_credentials` not `testLogin`
   - `it_throws_exception_for_invalid_email` not `testValidation`

5. **Arrange-Act-Assert pattern:**
   ```php
   public function test_something(): void
   {
       // Arrange
       $user = User::factory()->create();

       // Act
       $result = $this->postJson('/api/action', ['data' => 'value']);

       // Assert
       $result->assertStatus(200);
   }
   ```

6. **Test edge cases:**
   - Empty inputs, null values
   - Boundary conditions (min/max lengths)
   - Unauthorized access attempts
   - Invalid data formats

## Need Help?

See also:
- [DDD Architecture Overview](./ddd-overview.md)
- [Admin Backend Guide](./admin-backend-guide.md)
- PHPUnit Documentation: https://phpunit.de/documentation.html
- Laravel Testing: https://laravel.com/docs/testing
