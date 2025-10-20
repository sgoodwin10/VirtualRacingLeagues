# Laravel Backend Testing Guide

This guide covers testing strategies for the Laravel backend following Domain-Driven Design (DDD) architecture.

## Test Organization

Tests are organized by architectural layer in four suites:

```
tests/
├── Unit/
│   ├── Domain/          # Pure business logic (no database, no Laravel)
│   ├── Policies/        # Authorization policies
│   └── Rules/           # Validation rules
├── Integration/         # Infrastructure layer (repositories with database)
├── Feature/             # HTTP/API endpoints (full application stack)
└── TestCase.php         # Base test class
```

## Running Tests

```bash
# All tests
composer test

# By suite
composer test:domain       # Domain layer only (fastest)
composer test:unit         # Unit tests (no database)
composer test:integration  # Integration tests (with MariaDB)
composer test:feature      # Feature tests (full HTTP stack)

# With coverage
composer test:coverage

# Specific file
./vendor/bin/phpunit tests/Unit/Domain/User/UserEntityTest.php

# Specific method
./vendor/bin/phpunit --filter test_user_can_verify_email
```

## Test Databases

- **SQLite in-memory** (`:memory:`) - Default for Unit/Domain tests (fast)
- **MariaDB** (`testing` connection) - For Integration tests (production-like)

Database is automatically reset between tests using `RefreshDatabase` trait.

## 1. Domain Layer Tests

**Purpose**: Test pure business logic without database or Laravel dependencies

**Location**: `tests/Unit/Domain/`

**Characteristics**:
- No database access
- No Laravel dependencies
- Test entities, value objects, domain events
- Fast execution (run first during development)

### Example: Testing an Entity

```php
<?php

namespace Tests\Unit\Domain\User;

use PHPUnit\Framework\TestCase;  // Plain PHPUnit, not Laravel TestCase
use App\Domain\User\Entities\User;
use App\Domain\User\Events\UserCreated;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;

class UserEntityTest extends TestCase
{
    public function test_creates_user_with_valid_data(): void
    {
        $user = User::create(
            id: 1,
            fullName: FullName::fromString('John Doe'),
            email: EmailAddress::fromString('john@example.com')
        );

        $this->assertEquals(1, $user->id());
        $this->assertEquals('John Doe', $user->fullName()->toString());
        $this->assertEquals('john@example.com', $user->email()->toString());
        $this->assertFalse($user->isEmailVerified());
    }

    public function test_records_domain_event_when_created(): void
    {
        $user = User::create(
            id: 1,
            fullName: FullName::fromString('John Doe'),
            email: EmailAddress::fromString('john@example.com')
        );

        $events = $user->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(UserCreated::class, $events[0]);
    }

    public function test_verifies_email(): void
    {
        $user = User::create(
            id: 1,
            fullName: FullName::fromString('John Doe'),
            email: EmailAddress::fromString('john@example.com')
        );

        $user->verifyEmail();

        $this->assertTrue($user->isEmailVerified());
        $this->assertNotNull($user->emailVerifiedAt());
    }

    public function test_updates_user_information(): void
    {
        $user = User::create(
            id: 1,
            fullName: FullName::fromString('John Doe'),
            email: EmailAddress::fromString('john@example.com')
        );

        $user->update(
            fullName: FullName::fromString('Jane Smith'),
            email: EmailAddress::fromString('jane@example.com')
        );

        $this->assertEquals('Jane Smith', $user->fullName()->toString());
        $this->assertEquals('jane@example.com', $user->email()->toString());
    }
}
```

### Example: Testing a Value Object

```php
<?php

namespace Tests\Unit\Domain\Shared;

use PHPUnit\Framework\TestCase;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\Exceptions\InvalidEmailAddressException;

class EmailAddressTest extends TestCase
{
    public function test_creates_valid_email(): void
    {
        $email = EmailAddress::fromString('user@example.com');

        $this->assertEquals('user@example.com', $email->toString());
    }

    public function test_throws_exception_for_invalid_email(): void
    {
        $this->expectException(InvalidEmailAddressException::class);

        EmailAddress::fromString('invalid-email');
    }

    public function test_email_equality(): void
    {
        $email1 = EmailAddress::fromString('user@example.com');
        $email2 = EmailAddress::fromString('user@example.com');

        $this->assertTrue($email1->equals($email2));
    }

    public function test_normalizes_email_case(): void
    {
        $email = EmailAddress::fromString('User@Example.COM');

        $this->assertEquals('user@example.com', $email->toString());
    }
}
```

## 2. Unit Tests (Laravel-Specific)

**Purpose**: Test Laravel units (policies, rules, helpers) without database

**Location**: `tests/Unit/` (excluding `Domain/` subdirectory)

**Characteristics**:
- Tests Laravel-specific code
- No database access
- Mock dependencies as needed

### Example: Testing a Policy

```php
<?php

namespace Tests\Unit\Policies;

use Tests\TestCase;
use App\Domain\User\Entities\User;
use App\Policies\LeaguePolicy;
use App\Domain\League\Entities\League;

class LeaguePolicyTest extends TestCase
{
    private LeaguePolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new LeaguePolicy();
    }

    public function test_user_can_create_league_if_under_limit(): void
    {
        // Create user with no existing leagues
        $user = $this->createUser();

        $this->assertTrue($this->policy->create($user));
    }

    public function test_user_cannot_create_league_if_at_limit(): void
    {
        $user = $this->createUserWithLeagues(5); // At free tier limit

        $this->assertFalse($this->policy->create($user));
    }

    public function test_user_can_update_own_league(): void
    {
        $user = $this->createUser();
        $league = $this->createLeagueForUser($user);

        $this->assertTrue($this->policy->update($user, $league));
    }

    public function test_user_cannot_update_other_users_league(): void
    {
        $user = $this->createUser();
        $otherUser = $this->createUser();
        $league = $this->createLeagueForUser($otherUser);

        $this->assertFalse($this->policy->update($user, $league));
    }
}
```

### Example: Testing a Validation Rule

```php
<?php

namespace Tests\Unit\Rules;

use Tests\TestCase;
use App\Rules\UniqueEmailRule;
use Illuminate\Support\Facades\Validator;

class UniqueEmailRuleTest extends TestCase
{
    public function test_passes_for_unique_email(): void
    {
        $rule = new UniqueEmailRule();

        $validator = Validator::make(
            ['email' => 'unique@example.com'],
            ['email' => $rule]
        );

        $this->assertTrue($validator->passes());
    }

    public function test_fails_for_existing_email(): void
    {
        // Create user with email
        $this->createUser(['email' => 'existing@example.com']);

        $rule = new UniqueEmailRule();

        $validator = Validator::make(
            ['email' => 'existing@example.com'],
            ['email' => $rule]
        );

        $this->assertFalse($validator->passes());
    }
}
```

## 3. Integration Tests

**Purpose**: Test infrastructure layer (repositories, Eloquent) with real database

**Location**: `tests/Integration/`

**Database**: Uses MariaDB (`testing` connection) for production-like testing

**Characteristics**:
- Tests entity ↔ Eloquent model mapping
- Tests repository implementations
- Tests database queries and relationships

### Example: Testing a Repository

```php
<?php

namespace Tests\Integration\Persistence\Eloquent\Repositories;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentLeagueRepository;
use App\Infrastructure\Persistence\Eloquent\Models\League as LeagueModel;
use App\Domain\League\Entities\League;
use App\Domain\League\ValueObjects\LeagueName;
use App\Domain\League\ValueObjects\LeagueSlug;

class EloquentLeagueRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentLeagueRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new EloquentLeagueRepository();
    }

    public function test_saves_league_entity(): void
    {
        $league = $this->createLeagueEntity();

        $this->repository->save($league);

        $this->assertDatabaseHas('leagues', [
            'id' => $league->id(),
            'name' => $league->name()->toString(),
            'slug' => $league->slug()->toString(),
        ]);
    }

    public function test_finds_league_by_id(): void
    {
        $leagueModel = LeagueModel::factory()->create([
            'name' => 'Test League',
            'slug' => 'test-league',
        ]);

        $league = $this->repository->findById($leagueModel->id);

        $this->assertInstanceOf(League::class, $league);
        $this->assertEquals($leagueModel->id, $league->id());
        $this->assertEquals('Test League', $league->name()->toString());
        $this->assertEquals('test-league', $league->slug()->toString());
    }

    public function test_returns_null_when_league_not_found(): void
    {
        $league = $this->repository->findById(999);

        $this->assertNull($league);
    }

    public function test_finds_league_by_slug(): void
    {
        LeagueModel::factory()->create(['slug' => 'my-league']);

        $league = $this->repository->findBySlug(
            LeagueSlug::fromString('my-league')
        );

        $this->assertNotNull($league);
        $this->assertEquals('my-league', $league->slug()->toString());
    }

    public function test_finds_leagues_by_user_id(): void
    {
        $userId = 1;

        LeagueModel::factory()->count(3)->create(['user_id' => $userId]);
        LeagueModel::factory()->count(2)->create(['user_id' => 999]);

        $leagues = $this->repository->findByUserId($userId);

        $this->assertCount(3, $leagues);
        foreach ($leagues as $league) {
            $this->assertEquals($userId, $league->userId());
        }
    }

    public function test_deletes_league(): void
    {
        $league = $this->createLeagueEntity();
        $this->repository->save($league);

        $this->repository->delete($league->id());

        $this->assertSoftDeleted('leagues', ['id' => $league->id()]);
    }

    public function test_updates_existing_league(): void
    {
        $league = $this->createLeagueEntity();
        $this->repository->save($league);

        $league->update(
            name: LeagueName::fromString('Updated Name'),
            slug: LeagueSlug::fromString('updated-slug')
        );

        $this->repository->save($league);

        $this->assertDatabaseHas('leagues', [
            'id' => $league->id(),
            'name' => 'Updated Name',
            'slug' => 'updated-slug',
        ]);
    }

    private function createLeagueEntity(): League
    {
        return League::create(
            id: 1,
            userId: 1,
            name: LeagueName::fromString('Test League'),
            slug: LeagueSlug::fromString('test-league')
        );
    }
}
```

## 4. Feature Tests

**Purpose**: Test HTTP/API endpoints with full application stack

**Location**: `tests/Feature/`

**Characteristics**:
- Tests controllers, middleware, validation
- Tests authentication and authorization
- Tests complete request/response cycle
- Tests error handling

### Example: Testing API Endpoints

```php
<?php

namespace Tests\Feature\Http\Controllers\User;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LeagueControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_league_with_valid_data(): void
    {
        Storage::fake('public');
        $user = $this->createAuthenticatedUser();

        $response = $this->actingAs($user)->postJson('/api/leagues', [
            'name' => 'My League',
            'description' => 'League description',
            'game' => 'ACC',
            'platform' => 'PC',
            'visibility' => 'public',
            'logo' => UploadedFile::fake()->image('logo.jpg'),
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'My League',
                    'slug' => 'my-league',
                ],
            ]);

        $this->assertDatabaseHas('leagues', [
            'name' => 'My League',
            'slug' => 'my-league',
            'user_id' => $user->id,
        ]);

        Storage::disk('public')->assertExists('leagues/logo.jpg');
    }

    public function test_requires_authentication(): void
    {
        $response = $this->postJson('/api/leagues', [
            'name' => 'My League',
        ]);

        $response->assertStatus(401);
    }

    public function test_validates_required_fields(): void
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->actingAs($user)->postJson('/api/leagues', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'game', 'platform']);
    }

    public function test_enforces_free_tier_league_limit(): void
    {
        $user = $this->createAuthenticatedUser();

        // Create 5 leagues (free tier limit)
        $this->createLeagues($user, 5);

        $response = $this->actingAs($user)->postJson('/api/leagues', [
            'name' => 'Sixth League',
            'game' => 'ACC',
            'platform' => 'PC',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Free tier limited to 5 leagues',
            ]);
    }

    public function test_user_can_only_update_own_league(): void
    {
        $user = $this->createAuthenticatedUser();
        $otherUser = $this->createUser();

        $league = $this->createLeagueForUser($otherUser);

        $response = $this->actingAs($user)->putJson("/api/leagues/{$league->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(403);
    }

    public function test_lists_user_leagues(): void
    {
        $user = $this->createAuthenticatedUser();

        $this->createLeagues($user, 3);
        $this->createLeagues($this->createUser(), 2); // Other user's leagues

        $response = $this->actingAs($user)->getJson('/api/leagues');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_soft_deletes_league(): void
    {
        $user = $this->createAuthenticatedUser();
        $league = $this->createLeagueForUser($user);

        $response = $this->actingAs($user)->deleteJson("/api/leagues/{$league->id}");

        $response->assertStatus(200);

        $this->assertSoftDeleted('leagues', ['id' => $league->id]);
    }
}
```

### Example: Testing Authentication

```php
<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'user@example.com',
                    ],
                ],
            ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid credentials',
            ]);

        $this->assertGuest();
    }

    public function test_user_can_logout(): void
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->actingAs($user)->postJson('/api/logout');

        $response->assertStatus(200);
        $this->assertGuest();
    }
}
```

## Test Helpers and Factories

### Creating Test Data

Use factories and helper methods for consistent test data:

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
    use RefreshDatabase;

    /**
     * Create an authenticated user
     */
    protected function createAuthenticatedUser(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $this->actingAs($user);
        return $user;
    }

    /**
     * Create a user without authentication
     */
    protected function createUser(array $attributes = []): User
    {
        return User::factory()->create($attributes);
    }

    /**
     * Create multiple leagues for a user
     */
    protected function createLeagues(User $user, int $count): void
    {
        League::factory()->count($count)->create(['user_id' => $user->id]);
    }

    /**
     * Create a single league for a user
     */
    protected function createLeagueForUser(User $user, array $attributes = []): League
    {
        return League::factory()->create(array_merge(
            ['user_id' => $user->id],
            $attributes
        ));
    }
}
```

## Mocking Dependencies

### Mocking External Services

```php
<?php

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;

class ExternalServiceTest extends TestCase
{
    public function test_calls_external_api(): void
    {
        Http::fake([
            'api.example.com/*' => Http::response([
                'data' => 'mocked response'
            ], 200),
        ]);

        $response = $this->service->callExternalApi();

        $this->assertEquals('mocked response', $response['data']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.example.com/endpoint';
        });
    }

    public function test_uploads_file_to_storage(): void
    {
        Storage::fake('s3');

        $this->service->uploadFile($file);

        Storage::disk('s3')->assertExists('path/to/file.jpg');
    }

    public function test_sends_email_notification(): void
    {
        Mail::fake();

        $this->service->sendNotification($user);

        Mail::assertSent(WelcomeEmail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }
}
```

### Mocking Dependencies in Domain Tests

```php
<?php

use PHPUnit\Framework\TestCase;
use Mockery;

class DomainServiceTest extends TestCase
{
    public function test_domain_service_with_mocked_repository(): void
    {
        $repository = Mockery::mock(UserRepositoryInterface::class);
        $repository->shouldReceive('findByEmail')
            ->once()
            ->with('user@example.com')
            ->andReturn($this->createUser());

        $service = new UserDomainService($repository);
        $user = $service->getUserByEmail('user@example.com');

        $this->assertNotNull($user);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
```

## Database Testing Strategies

### Using Transactions (Alternative to RefreshDatabase)

```php
<?php

use Illuminate\Foundation\Testing\DatabaseTransactions;

class FastDatabaseTest extends TestCase
{
    use DatabaseTransactions; // Faster than RefreshDatabase for single tests

    public function test_creates_record(): void
    {
        // Data is automatically rolled back after test
        $user = User::create(['name' => 'Test']);
        $this->assertDatabaseHas('users', ['name' => 'Test']);
    }
}
```

### Testing Specific Database Scenarios

```php
<?php

class DatabaseScenarioTest extends TestCase
{
    use RefreshDatabase;

    public function test_handles_unique_constraint_violation(): void
    {
        User::factory()->create(['email' => 'duplicate@example.com']);

        $this->expectException(QueryException::class);

        User::factory()->create(['email' => 'duplicate@example.com']);
    }

    public function test_soft_deletes_work_correctly(): void
    {
        $league = League::factory()->create();

        $league->delete(); // Soft delete

        $this->assertSoftDeleted('leagues', ['id' => $league->id]);
        $this->assertDatabaseHas('leagues', ['id' => $league->id]);
        $this->assertNotNull($league->fresh()->deleted_at);
    }

    public function test_restores_soft_deleted_record(): void
    {
        $league = League::factory()->create();
        $league->delete();

        $league->restore();

        $this->assertDatabaseHas('leagues', [
            'id' => $league->id,
            'deleted_at' => null,
        ]);
    }
}
```

## Testing Best Practices

### 1. Follow the Testing Pyramid
- **Most tests**: Domain layer (fast, isolated)
- **Moderate tests**: Integration layer (database required)
- **Fewer tests**: Feature layer (full stack, slower)

### 2. Test Naming Conventions
- Use descriptive method names: `test_user_can_verify_email`
- Follow pattern: `test_[scenario]_[expected_result]`
- Be specific about what you're testing

### 3. AAA Pattern (Arrange, Act, Assert)
```php
public function test_example(): void
{
    // Arrange: Set up test data
    $user = $this->createUser();

    // Act: Perform the action
    $user->verifyEmail();

    // Assert: Verify the result
    $this->assertTrue($user->isEmailVerified());
}
```

### 4. One Assertion Per Concept
- Test one logical concept per test method
- Multiple assertions are OK if testing the same concept
- Split complex scenarios into multiple tests

### 5. Use Factories for Test Data
```php
// Good: Flexible and maintainable
$user = User::factory()->create(['name' => 'Custom Name']);

// Avoid: Hard-coded values
$user = new User(['name' => 'Custom Name', 'email' => 'test@test.com', ...]);
```

### 6. Don't Test Framework Code
```php
// Bad: Testing Laravel's validation
public function test_validation_rules_exist(): void
{
    $rules = (new CreateUserRequest())->rules();
    $this->assertArrayHasKey('email', $rules);
}

// Good: Test your business logic
public function test_creates_user_with_valid_data(): void
{
    $response = $this->postJson('/api/users', ['email' => 'valid@example.com']);
    $response->assertStatus(201);
}
```

### 7. Isolate Tests
- Each test should be independent
- Don't rely on test execution order
- Use `RefreshDatabase` to reset state

### 8. Test Error Scenarios
```php
public function test_throws_exception_when_user_not_found(): void
{
    $this->expectException(UserNotFoundException::class);

    $this->repository->findById(999);
}
```

## Common Testing Patterns

### Testing File Uploads
```php
Storage::fake('public');

$file = UploadedFile::fake()->image('avatar.jpg', 600, 600);

$response = $this->postJson('/api/upload', ['file' => $file]);

Storage::disk('public')->assertExists('avatars/avatar.jpg');
```

### Testing API Responses
```php
$response = $this->getJson('/api/users');

$response->assertStatus(200)
    ->assertJsonStructure([
        'success',
        'data' => [
            '*' => ['id', 'name', 'email']
        ]
    ])
    ->assertJsonCount(5, 'data');
```

### Testing Middleware
```php
public function test_middleware_blocks_unauthenticated_users(): void
{
    $response = $this->getJson('/api/protected-route');

    $response->assertStatus(401);
}

public function test_middleware_allows_authenticated_users(): void
{
    $user = $this->createAuthenticatedUser();

    $response = $this->actingAs($user)->getJson('/api/protected-route');

    $response->assertStatus(200);
}
```

### Testing Events and Listeners
```php
use Illuminate\Support\Facades\Event;

public function test_dispatches_user_created_event(): void
{
    Event::fake([UserCreated::class]);

    $this->service->createUser($data);

    Event::assertDispatched(UserCreated::class, function ($event) {
        return $event->user->email === 'user@example.com';
    });
}
```

## Performance Tips

1. **Run Domain tests first** - They're fastest and catch most logic errors
2. **Use SQLite in-memory** - Much faster than MariaDB for most tests
3. **Use `DatabaseTransactions`** - Faster than `RefreshDatabase` for single tests
4. **Limit Integration tests** - Only test repository implementations
5. **Parallel testing** - Use `--parallel` flag for faster execution
6. **Avoid unnecessary HTTP calls** - Use unit tests for business logic

## Debugging Tests

```bash
# Run with verbose output
./vendor/bin/phpunit --verbose

# Stop on first failure
./vendor/bin/phpunit --stop-on-failure

# Filter specific test
./vendor/bin/phpunit --filter test_user_can_login

# Show debugging output
./vendor/bin/phpunit --debug
```

## Coverage Reports

```bash
# Generate HTML coverage report
composer test:coverage

# View report
open coverage/html/index.html
```

---

**Key Takeaways**:
- Organize tests by architectural layer (Domain, Unit, Integration, Feature)
- Domain tests are fastest - test business logic here first
- Integration tests validate infrastructure (repositories, database)
- Feature tests validate full HTTP/API stack
- Use factories for consistent test data
- Follow AAA pattern (Arrange, Act, Assert)
- Isolate tests and don't rely on execution order
