<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Driver\Services;

use App\Application\Driver\DTOs\UpdateDriverData;
use App\Application\Driver\Services\DriverApplicationService;
use App\Domain\Driver\Entities\Driver as DriverEntity;
use App\Domain\Driver\Entities\LeagueDriver as LeagueDriverEntity;
use App\Domain\Driver\Repositories\DriverRepositoryInterface;
use App\Domain\Driver\ValueObjects\DriverName;
use App\Domain\Driver\ValueObjects\DriverStatus;
use App\Domain\Driver\ValueObjects\PlatformIdentifiers;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\League\Entities\League as LeagueEntity;
use App\Domain\Shared\ValueObjects\Slug;
use App\Application\Activity\Services\LeagueActivityLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;
use Mockery;

final class DriverDiscordIdClearingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_clear_discord_id_when_empty_string_is_sent(): void
    {
        // Create mock request with discord_id as empty string
        $mockRequest = Mockery::mock(Request::class);
        $mockRequest->shouldReceive('has')
            ->with('psn_id')
            ->andReturn(false);
        $mockRequest->shouldReceive('has')
            ->with('iracing_id')
            ->andReturn(false);
        $mockRequest->shouldReceive('has')
            ->with('iracing_customer_id')
            ->andReturn(false);
        $mockRequest->shouldReceive('has')
            ->with('discord_id')
            ->andReturn(true); // Request contains discord_id field
        $mockRequest->shouldReceive('has')
            ->with('email')
            ->andReturn(false);
        $mockRequest->shouldReceive('has')
            ->with('phone')
            ->andReturn(false);
        $mockRequest->shouldReceive('has')
            ->with('driver_number')
            ->andReturn(false);
        $mockRequest->shouldReceive('has')
            ->with('status')
            ->andReturn(false);
        $mockRequest->shouldReceive('has')
            ->with('league_notes')
            ->andReturn(false);

        // Bind the mock request to the container
        $this->app->instance('request', $mockRequest);

        // Create DTO with empty discord_id (this is what validation converts "" to)
        $updateData = new UpdateDriverData(
            first_name: null,
            last_name: null,
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: '', // Empty string
            driver_number: null,
            status: null,
            league_notes: null
        );

        // Create driver entity with existing discord_id
        $driver = DriverEntity::reconstitute(
            id: 1,
            name: DriverName::from('John', 'Doe', null),
            platformIds: PlatformIdentifiers::from(null, null, null, 'john#1234'), // Has discord ID
            email: null,
            phone: null,
            slug: new Slug('john-doe'),
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
            deletedAt: null
        );

        // Create league driver entity
        $leagueDriver = LeagueDriverEntity::reconstitute(
            id: 1,
            leagueId: 1,
            driverId: 1,
            driverNumber: 1,
            status: DriverStatus::from('active'),
            leagueNotes: null,
            addedToLeagueAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable()
        );

        // Create mock league entity
        $league = Mockery::mock(LeagueEntity::class);
        $league->shouldReceive('ownerUserId')->andReturn(1);
        $league->shouldReceive('platformIds')->andReturn([1]); // Discord platform

        // Create mock repositories
        $driverRepo = Mockery::mock(DriverRepositoryInterface::class);
        $driverRepo->shouldReceive('getLeagueDriver')
            ->with(1, 1)
            ->andReturn([
                'driver' => $driver,
                'league_driver' => $leagueDriver
            ]);

        // Expect the driver to be saved with null discord_id
        $driverRepo->shouldReceive('save')
            ->once()
            ->with(Mockery::on(function ($savedDriver) {
                // Verify discord_id was cleared
                return $savedDriver->platformIds()->discordId() === null;
            }));

        $driverRepo->shouldReceive('updateLeagueDriver')
            ->once()
            ->with($leagueDriver);

        $driverRepo->shouldReceive('findByPlatformId')
            ->andReturn(null); // No conflict

        $leagueRepo = Mockery::mock(LeagueRepositoryInterface::class);
        $leagueRepo->shouldReceive('findById')
            ->with(1)
            ->andReturn($league);

        $activityLogService = Mockery::mock(LeagueActivityLogService::class);

        // Create service
        $service = new DriverApplicationService($driverRepo, $leagueRepo, $activityLogService);

        // Execute update
        $result = $service->updateDriverAndLeagueSettings($updateData, 1, 1, 1);

        // Assert the result shows discord_id was cleared
        $this->assertNull($result->driver->discord_id, 'Discord ID should be null after clearing');
    }

    public function test_preserves_discord_id_when_not_in_request(): void
    {
        // Create mock request WITHOUT discord_id field
        $mockRequest = Mockery::mock(Request::class);
        $mockRequest->shouldReceive('has')->andReturn(false); // All fields return false

        // Bind the mock request to the container
        $this->app->instance('request', $mockRequest);

        // Create DTO with null discord_id (field not in request)
        $updateData = new UpdateDriverData(
            first_name: 'John',
            last_name: 'Doe',
            nickname: null,
            email: null,
            phone: null,
            psn_id: null,
            iracing_id: null,
            iracing_customer_id: null,
            discord_id: null, // Not in request
            driver_number: null,
            status: null,
            league_notes: null
        );

        // Create driver entity with existing discord_id
        $driver = DriverEntity::reconstitute(
            id: 1,
            name: DriverName::from('John', 'Doe', null),
            platformIds: PlatformIdentifiers::from(null, null, null, 'john#1234'), // Has discord ID
            email: null,
            phone: null,
            slug: new Slug('john-doe'),
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
            deletedAt: null
        );

        // Create league driver entity
        $leagueDriver = LeagueDriverEntity::reconstitute(
            id: 1,
            leagueId: 1,
            driverId: 1,
            driverNumber: 1,
            status: DriverStatus::from('active'),
            leagueNotes: null,
            addedToLeagueAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable()
        );

        // Create mock league entity
        $league = Mockery::mock(LeagueEntity::class);
        $league->shouldReceive('ownerUserId')->andReturn(1);

        // Create mock repositories
        $driverRepo = Mockery::mock(DriverRepositoryInterface::class);
        $driverRepo->shouldReceive('getLeagueDriver')
            ->with(1, 1)
            ->andReturn([
                'driver' => $driver,
                'league_driver' => $leagueDriver
            ]);

        // Expect the driver to be saved with preserved discord_id
        $driverRepo->shouldReceive('save')
            ->once()
            ->with(Mockery::on(function ($savedDriver) {
                // Verify discord_id was preserved
                return $savedDriver->platformIds()->discordId() === 'john#1234';
            }));

        $driverRepo->shouldReceive('updateLeagueDriver')
            ->once()
            ->with($leagueDriver);

        $leagueRepo = Mockery::mock(LeagueRepositoryInterface::class);
        $leagueRepo->shouldReceive('findById')
            ->with(1)
            ->andReturn($league);

        $activityLogService = Mockery::mock(LeagueActivityLogService::class);

        // Create service
        $service = new DriverApplicationService($driverRepo, $leagueRepo, $activityLogService);

        // Execute update
        $result = $service->updateDriverAndLeagueSettings($updateData, 1, 1, 1);

        // Assert the result shows discord_id was preserved
        $this->assertEquals('john#1234', $result->driver->discord_id, 'Discord ID should be preserved when not in request');
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
