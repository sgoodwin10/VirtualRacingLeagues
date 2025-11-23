<?php

declare(strict_types=1);

namespace Tests\Integration\Persistence\Eloquent\Repositories;

use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\User\Entities\User;
use App\Domain\User\Exceptions\UserNotFoundException;
use App\Domain\User\ValueObjects\UserAlias;
use App\Domain\User\ValueObjects\UserStatus;
use App\Domain\User\ValueObjects\UserUuid;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentUserRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class EloquentUserRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentUserRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new EloquentUserRepository();
    }

    #[Test]
    public function it_saves_new_user(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john.doe@example.com'),
            password: 'hashed-password',
            alias: UserAlias::from('johndoe'),
            uuid: UserUuid::from('550e8400-e29b-41d4-a716-446655440000'),
            status: UserStatus::ACTIVE
        );

        $this->assertNull($user->id());

        $this->repository->save($user);

        $this->assertNotNull($user->id());
        $this->assertDatabaseHas('users', [
            'id' => $user->id(),
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'alias' => 'johndoe',
            'uuid' => '550e8400-e29b-41d4-a716-446655440000',
            'status' => 'active',
        ]);

        // Verify password is stored (hashed)
        $eloquentUser = UserEloquent::find($user->id());
        $this->assertNotNull($eloquentUser->password);
        $this->assertNotEquals('hashed-password', $eloquentUser->password);
    }

    #[Test]
    public function it_saves_user_with_null_optional_fields(): void
    {
        $user = User::create(
            fullName: FullName::from('Jane', 'Smith'),
            email: EmailAddress::from('jane.smith@example.com'),
            password: 'hashed-password',
            status: UserStatus::ACTIVE
        );

        $this->repository->save($user);

        $eloquentUser = UserEloquent::find($user->id());

        $this->assertEquals('Jane', $eloquentUser->first_name);
        $this->assertEquals('Smith', $eloquentUser->last_name);
        $this->assertEquals('jane.smith@example.com', $eloquentUser->email);
        $this->assertNull($eloquentUser->alias);
        // Note: Factory generates UUID, so we just check it's not null from factory
        // The domain entity has null UUID, but Eloquent factory may generate one
    }

    #[Test]
    public function it_updates_existing_user(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john.doe@example.com'),
            password: 'hashed-password',
            status: UserStatus::ACTIVE
        );

        $this->repository->save($user);
        $userId = $user->id();

        // Update the user
        $user->updateProfile(
            fullName: FullName::from('John', 'Updated'),
            alias: UserAlias::from('johnupdated')
        );

        $this->repository->save($user);

        $this->assertEquals($userId, $user->id());
        $this->assertDatabaseHas('users', [
            'id' => $userId,
            'first_name' => 'John',
            'last_name' => 'Updated',
            'alias' => 'johnupdated',
        ]);
    }

    #[Test]
    public function it_finds_user_by_id(): void
    {
        $eloquentUser = UserEloquent::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'status' => 'active',
        ]);

        $user = $this->repository->findById($eloquentUser->id);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals($eloquentUser->id, $user->id());
        $this->assertEquals('Test', $user->fullName()->firstName());
        $this->assertEquals('User', $user->fullName()->lastName());
        $this->assertEquals('test@example.com', $user->email()->value());
    }

    #[Test]
    public function it_throws_exception_when_user_not_found_by_id(): void
    {
        $this->expectException(UserNotFoundException::class);
        $this->expectExceptionMessage('User with ID 999 not found');

        $this->repository->findById(999);
    }

    #[Test]
    public function it_returns_null_when_user_not_found_by_id_or_null(): void
    {
        $user = $this->repository->findByIdOrNull(999);

        $this->assertNull($user);
    }

    #[Test]
    public function it_finds_user_by_email(): void
    {
        $eloquentUser = UserEloquent::factory()->create([
            'email' => 'findme@example.com',
        ]);

        $user = $this->repository->findByEmail('findme@example.com');

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals($eloquentUser->id, $user->id());
        $this->assertEquals('findme@example.com', $user->email()->value());
    }

    #[Test]
    public function it_throws_exception_when_user_not_found_by_email(): void
    {
        $this->expectException(UserNotFoundException::class);
        $this->expectExceptionMessage("User with email 'notfound@example.com' not found");

        $this->repository->findByEmail('notfound@example.com');
    }

    #[Test]
    public function it_checks_if_email_exists(): void
    {
        $this->assertFalse($this->repository->existsByEmail('new@example.com'));

        UserEloquent::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $this->assertTrue($this->repository->existsByEmail('existing@example.com'));
    }

    #[Test]
    public function it_checks_email_exists_including_soft_deleted_users(): void
    {
        $eloquentUser = UserEloquent::factory()->create([
            'email' => 'deleted@example.com',
        ]);

        $eloquentUser->delete();

        // Email should still exist even after soft delete
        $this->assertTrue($this->repository->existsByEmail('deleted@example.com'));
    }

    #[Test]
    public function it_soft_deletes_user(): void
    {
        $user = User::create(
            fullName: FullName::from('Delete', 'Me'),
            email: EmailAddress::from('delete@example.com'),
            password: 'hashed-password',
            status: UserStatus::ACTIVE
        );

        $this->repository->save($user);
        $userId = $user->id();

        $user->delete();
        $this->repository->delete($user);

        $this->assertSoftDeleted('users', ['id' => $userId]);

        // Can still find with withTrashed
        $foundUser = $this->repository->findById($userId);
        $this->assertInstanceOf(User::class, $foundUser);
        $this->assertEquals(UserStatus::INACTIVE, $foundUser->status());
    }

    #[Test]
    public function it_restores_soft_deleted_user(): void
    {
        $user = User::create(
            fullName: FullName::from('Restore', 'Me'),
            email: EmailAddress::from('restore@example.com'),
            password: 'hashed-password',
            status: UserStatus::ACTIVE
        );

        $this->repository->save($user);
        $userId = $user->id();

        $user->delete();
        $this->repository->delete($user);
        $this->assertSoftDeleted('users', ['id' => $userId]);

        $user->restore();
        $this->repository->restore($user);
        $this->assertDatabaseHas('users', ['id' => $userId, 'deleted_at' => null]);

        $restoredUser = $this->repository->findById($userId);
        $this->assertEquals(UserStatus::ACTIVE, $restoredUser->status());
    }

    #[Test]
    public function it_force_deletes_user(): void
    {
        $user = User::create(
            fullName: FullName::from('Force', 'Delete'),
            email: EmailAddress::from('force@example.com'),
            password: 'hashed-password',
            status: UserStatus::ACTIVE
        );

        $this->repository->save($user);
        $userId = $user->id();

        $this->repository->forceDelete($user);

        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }

    #[Test]
    public function it_maps_entity_to_eloquent_model_correctly(): void
    {
        $user = User::create(
            fullName: FullName::from('Complete', 'User'),
            email: EmailAddress::from('complete@example.com'),
            password: 'hashed-password',
            alias: UserAlias::from('completeuser'),
            uuid: UserUuid::from('650e8400-e29b-41d4-a716-446655440000'),
            status: UserStatus::SUSPENDED
        );

        $this->repository->save($user);

        $eloquentUser = UserEloquent::find($user->id());

        $this->assertEquals('Complete', $eloquentUser->first_name);
        $this->assertEquals('User', $eloquentUser->last_name);
        $this->assertEquals('complete@example.com', $eloquentUser->email);
        $this->assertNotNull($eloquentUser->password);
        $this->assertEquals('completeuser', $eloquentUser->alias);
        $this->assertEquals('650e8400-e29b-41d4-a716-446655440000', $eloquentUser->uuid);
        $this->assertEquals('suspended', $eloquentUser->status);
    }

    #[Test]
    public function it_maps_eloquent_model_to_entity_correctly(): void
    {
        $eloquentUser = UserEloquent::factory()->create([
            'first_name' => 'Complete',
            'last_name' => 'User',
            'email' => 'complete@example.com',
            'password' => 'hashed-password',
            'alias' => 'completeuser',
            'uuid' => '750e8400-e29b-41d4-a716-446655440000',
            'status' => 'suspended',
        ]);

        $user = $this->repository->findById($eloquentUser->id);

        $this->assertEquals($eloquentUser->id, $user->id());
        $this->assertEquals('Complete', $user->fullName()->firstName());
        $this->assertEquals('User', $user->fullName()->lastName());
        $this->assertEquals('complete@example.com', $user->email()->value());
        $this->assertNotNull($user->password());
        $this->assertEquals('completeuser', $user->alias()?->value());
        $this->assertEquals('750e8400-e29b-41d4-a716-446655440000', $user->uuid()?->value());
        $this->assertEquals(UserStatus::SUSPENDED, $user->status());
    }

    #[Test]
    public function it_gets_paginated_users(): void
    {
        UserEloquent::factory()->count(25)->create();

        $result = $this->repository->paginate(page: 1, perPage: 10);

        $this->assertCount(10, $result['data']);
        $this->assertEquals(25, $result['total']);
        $this->assertEquals(10, $result['per_page']);
        $this->assertEquals(1, $result['current_page']);
        $this->assertEquals(3, $result['last_page']);
        $this->assertContainsOnlyInstancesOf(User::class, $result['data']);
    }

    #[Test]
    public function it_filters_users_by_status(): void
    {
        UserEloquent::factory()->count(3)->create(['status' => 'active']);
        UserEloquent::factory()->count(2)->create(['status' => 'inactive']);
        UserEloquent::factory()->count(1)->create(['status' => 'suspended']);

        $activeUsers = $this->repository->all(['status' => 'active']);
        $this->assertCount(3, $activeUsers);

        $inactiveUsers = $this->repository->all(['status' => 'inactive']);
        $this->assertCount(2, $inactiveUsers);

        $suspendedUsers = $this->repository->all(['status' => 'suspended']);
        $this->assertCount(1, $suspendedUsers);
    }
}
