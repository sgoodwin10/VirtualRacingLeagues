<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Eloquent\Models;

use App\Domain\Driver\ValueObjects\DriverStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test LeagueDriverEloquent model.
 */
final class LeagueDriverEloquentTest extends TestCase
{
    use RefreshDatabase;

    public function testItCanBeInstantiated(): void
    {
        $model = new LeagueDriverEloquent();

        $this->assertInstanceOf(LeagueDriverEloquent::class, $model);
        $this->assertEquals('league_drivers', $model->getTable());
    }

    public function testItHasCorrectFillableAttributes(): void
    {
        $model = new LeagueDriverEloquent();
        $expected = [
            'league_id',
            'driver_id',
            'driver_number',
            'status',
            'league_notes',
            'added_to_league_at',
            'updated_at',
        ];

        $this->assertEquals($expected, $model->getFillable());
    }

    public function testItCastsStatusToDriverStatusEnum(): void
    {
        $model = new LeagueDriverEloquent([
            'status' => 'active',
        ]);

        $this->assertInstanceOf(DriverStatus::class, $model->status);
        $this->assertEquals(DriverStatus::ACTIVE, $model->status);
    }

    public function testItCastsDriverNumberToInteger(): void
    {
        $model = new LeagueDriverEloquent([
            'driver_number' => '42',
        ]);

        $this->assertIsInt($model->driver_number);
        $this->assertEquals(42, $model->driver_number);
    }

    public function testItHasDriverRelationship(): void
    {
        $model = new LeagueDriverEloquent();
        $relation = $model->driver();

        $this->assertEquals(Driver::class, $relation->getRelated()::class);
        $this->assertEquals('driver_id', $relation->getForeignKeyName());
    }

    public function testItHasLeagueRelationship(): void
    {
        $model = new LeagueDriverEloquent();
        $relation = $model->league();

        $this->assertEquals(League::class, $relation->getRelated()::class);
        $this->assertEquals('league_id', $relation->getForeignKeyName());
    }
}
