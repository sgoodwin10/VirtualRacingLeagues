<?php

declare(strict_types=1);

namespace Tests\Integration\Persistence\Eloquent\Repositories;

use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Admin\ValueObjects\AdminRole;
use App\Domain\Admin\ValueObjects\AdminStatus;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentAdminRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class EloquentAdminRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentAdminRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new EloquentAdminRepository();
    }

    #[Test]
    public function it_saves_new_admin(): void
    {
        $admin = Admin::create(
            name: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            hashedPassword: Hash::make('password'),
            role: AdminRole::from('admin'),
        );

        $this->assertNull($admin->id());

        $this->repository->save($admin);

        $this->assertNotNull($admin->id());
        $this->assertDatabaseHas('admins', [
            'id' => $admin->id(),
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'role' => 'admin',
            'status' => 'active',
        ]);
    }

    #[Test]
    public function it_updates_existing_admin(): void
    {
        $admin = Admin::create(
            name: FullName::from('Jane', 'Smith'),
            email: EmailAddress::from('jane@example.com'),
            hashedPassword: Hash::make('password'),
            role: AdminRole::from('moderator'),
        );

        $this->repository->save($admin);
        $adminId = $admin->id();

        // Update the admin
        $admin->updateProfile(
            FullName::from('Jane', 'Doe'),
            EmailAddress::from('jane.doe@example.com')
        );

        $this->repository->save($admin);

        $this->assertEquals($adminId, $admin->id());
        $this->assertDatabaseHas('admins', [
            'id' => $adminId,
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane.doe@example.com',
            'role' => 'moderator',
        ]);
    }

    #[Test]
    public function it_finds_admin_by_id(): void
    {
        $eloquentAdmin = AdminEloquent::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'Admin',
            'email' => 'test@example.com',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $admin = $this->repository->findById($eloquentAdmin->id);

        $this->assertInstanceOf(Admin::class, $admin);
        $this->assertEquals($eloquentAdmin->id, $admin->id());
        $this->assertEquals('Test', $admin->name()->firstName());
        $this->assertEquals('Admin', $admin->name()->lastName());
        $this->assertEquals('test@example.com', $admin->email()->value());
    }

    #[Test]
    public function it_throws_exception_when_admin_not_found_by_id(): void
    {
        $this->expectException(AdminNotFoundException::class);
        $this->expectExceptionMessage('Admin with ID 999 not found');

        $this->repository->findById(999);
    }

    #[Test]
    public function it_returns_null_when_admin_not_found_by_id_or_null(): void
    {
        $admin = $this->repository->findByIdOrNull(999);

        $this->assertNull($admin);
    }

    #[Test]
    public function it_finds_admin_by_email(): void
    {
        $eloquentAdmin = AdminEloquent::factory()->create([
            'email' => 'unique@example.com',
        ]);

        $admin = $this->repository->findByEmail(EmailAddress::from('unique@example.com'));

        $this->assertNotNull($admin);
        $this->assertInstanceOf(Admin::class, $admin);
        $this->assertEquals($eloquentAdmin->id, $admin->id());
        $this->assertEquals('unique@example.com', $admin->email()->value());
    }

    #[Test]
    public function it_returns_null_when_admin_not_found_by_email(): void
    {
        $admin = $this->repository->findByEmail(EmailAddress::from('nonexistent@example.com'));

        $this->assertNull($admin);
    }

    #[Test]
    public function it_checks_if_email_exists(): void
    {
        $this->assertFalse($this->repository->emailExists(EmailAddress::from('new@example.com')));

        AdminEloquent::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $this->assertTrue($this->repository->emailExists(EmailAddress::from('existing@example.com')));
    }

    #[Test]
    public function it_checks_email_existence_excluding_specific_id(): void
    {
        $admin = AdminEloquent::factory()->create([
            'email' => 'admin@example.com',
        ]);

        // Email exists, but should return false when excluding this admin's ID
        $this->assertFalse(
            $this->repository->emailExists(
                EmailAddress::from('admin@example.com'),
                $admin->id
            )
        );

        // Email should still be detected if checking without exclusion
        $this->assertTrue($this->repository->emailExists(EmailAddress::from('admin@example.com')));
    }

    #[Test]
    public function it_soft_deletes_admin(): void
    {
        $admin = Admin::create(
            name: FullName::from('Delete', 'Me'),
            email: EmailAddress::from('delete@example.com'),
            hashedPassword: Hash::make('password'),
            role: AdminRole::from('admin'),
        );

        $this->repository->save($admin);
        $adminId = $admin->id();

        // Mark as deleted
        $admin->delete();
        $this->repository->save($admin);

        $this->assertSoftDeleted('admins', ['id' => $adminId]);

        // Can still find with withTrashed
        $foundAdmin = $this->repository->findById($adminId);
        $this->assertInstanceOf(Admin::class, $foundAdmin);
        $this->assertTrue($foundAdmin->isDeleted());
    }

    #[Test]
    public function it_restores_soft_deleted_admin(): void
    {
        $admin = Admin::create(
            name: FullName::from('Restore', 'Me'),
            email: EmailAddress::from('restore@example.com'),
            hashedPassword: Hash::make('password'),
            role: AdminRole::from('admin'),
        );

        $this->repository->save($admin);
        $adminId = $admin->id();

        // Soft delete
        $admin->delete();
        $this->repository->save($admin);
        $this->assertSoftDeleted('admins', ['id' => $adminId]);

        // Restore
        $admin->restore();
        $this->repository->save($admin);
        $this->assertDatabaseHas('admins', ['id' => $adminId, 'deleted_at' => null]);
    }

    #[Test]
    public function it_maps_entity_to_eloquent_model_correctly(): void
    {
        $admin = Admin::create(
            name: FullName::from('Complete', 'Admin'),
            email: EmailAddress::from('complete@example.com'),
            hashedPassword: Hash::make('SecurePassword123'),
            role: AdminRole::from('super_admin'),
        );

        // Deactivate to test status mapping
        $admin->deactivate();

        $this->repository->save($admin);

        $eloquentAdmin = AdminEloquent::find($admin->id());

        $this->assertEquals('Complete', $eloquentAdmin->first_name);
        $this->assertEquals('Admin', $eloquentAdmin->last_name);
        $this->assertEquals('complete@example.com', $eloquentAdmin->email);
        $this->assertTrue(Hash::check('SecurePassword123', $eloquentAdmin->password));
        $this->assertEquals('super_admin', $eloquentAdmin->role);
        $this->assertEquals('inactive', $eloquentAdmin->status);
        $this->assertNotNull($eloquentAdmin->created_at);
        $this->assertNotNull($eloquentAdmin->updated_at);
        $this->assertNull($eloquentAdmin->deleted_at);
    }

    #[Test]
    public function it_maps_eloquent_model_to_entity_correctly(): void
    {
        $hashedPassword = Hash::make('TestPassword456');
        $eloquentAdmin = AdminEloquent::create([
            'first_name' => 'Mapped',
            'last_name' => 'User',
            'email' => 'mapped@example.com',
            'password' => $hashedPassword,
            'role' => 'moderator',
            'status' => 'inactive',
        ]);

        $admin = $this->repository->findById($eloquentAdmin->id);

        $this->assertEquals($eloquentAdmin->id, $admin->id());
        $this->assertEquals('Mapped', $admin->name()->firstName());
        $this->assertEquals('User', $admin->name()->lastName());
        $this->assertEquals('mapped@example.com', $admin->email()->value());
        $this->assertEquals($hashedPassword, $admin->hashedPassword());
        $this->assertEquals(AdminRole::MODERATOR, $admin->role());
        $this->assertEquals(AdminStatus::INACTIVE, $admin->status());
        $this->assertFalse($admin->isActive());
        $this->assertFalse($admin->isDeleted());
        $this->assertInstanceOf(\DateTimeImmutable::class, $admin->createdAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $admin->updatedAt());
        $this->assertNull($admin->deletedAt());
    }

    #[Test]
    public function it_maps_soft_deleted_eloquent_model_to_entity_correctly(): void
    {
        $eloquentAdmin = AdminEloquent::create([
            'first_name' => 'Deleted',
            'last_name' => 'Admin',
            'email' => 'deleted@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $eloquentAdmin->delete();

        $admin = $this->repository->findById($eloquentAdmin->id);

        $this->assertTrue($admin->isDeleted());
        $this->assertInstanceOf(\DateTimeImmutable::class, $admin->deletedAt());
    }

    #[Test]
    public function it_gets_paginated_admins(): void
    {
        // Create test data
        AdminEloquent::factory()->count(25)->create();

        $result = $this->repository->getPaginated(1, 10);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('total', $result);
        $this->assertArrayHasKey('per_page', $result);
        $this->assertArrayHasKey('current_page', $result);
        $this->assertCount(10, $result['data']);
        $this->assertEquals(25, $result['total']);
        $this->assertEquals(10, $result['per_page']);
        $this->assertEquals(1, $result['current_page']);
        $this->assertContainsOnlyInstancesOf(Admin::class, $result['data']);
    }

    #[Test]
    public function it_filters_admins_by_role(): void
    {
        AdminEloquent::factory()->count(5)->create(['role' => 'admin']);
        AdminEloquent::factory()->count(3)->create(['role' => 'moderator']);
        AdminEloquent::factory()->count(2)->create(['role' => 'super_admin']);

        $result = $this->repository->getPaginated(1, 100, ['role' => 'moderator']);

        $this->assertCount(3, $result['data']);
        foreach ($result['data'] as $admin) {
            $this->assertEquals(AdminRole::MODERATOR, $admin->role());
        }
    }

    #[Test]
    public function it_filters_admins_by_status(): void
    {
        AdminEloquent::factory()->count(5)->create(['status' => 'active']);
        AdminEloquent::factory()->count(3)->create(['status' => 'inactive']);

        $result = $this->repository->getPaginated(1, 100, ['status' => 'active']);

        $this->assertCount(5, $result['data']);
        foreach ($result['data'] as $admin) {
            $this->assertTrue($admin->isActive());
        }
    }

    #[Test]
    public function it_searches_admins_by_name_and_email(): void
    {
        AdminEloquent::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
        ]);
        AdminEloquent::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@example.com',
        ]);
        AdminEloquent::factory()->create([
            'first_name' => 'Bob',
            'last_name' => 'Johnson',
            'email' => 'bob@example.com',
        ]);

        $result = $this->repository->getPaginated(1, 100, ['search' => 'john']);

        $this->assertCount(2, $result['data']); // Matches 'John' (first_name) and 'Johnson' (last_name)
    }
}
