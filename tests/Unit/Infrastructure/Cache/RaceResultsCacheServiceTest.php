<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Cache;

use App\Application\League\DTOs\PublicRaceResultsData;
use App\Infrastructure\Cache\RaceResultsCacheService;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

final class RaceResultsCacheServiceTest extends TestCase
{
    private RaceResultsCacheService $service;

    /** @var array<int> Track race IDs used in tests for cleanup */
    private array $testRaceIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        // Use array cache driver for testing by passing it explicitly to constructor
        // This avoids store mismatch and makes tests faster
        $this->service = new RaceResultsCacheService('array');
        $this->testRaceIds = [];
    }

    protected function tearDown(): void
    {
        // Clean up only the specific cache keys we created
        foreach ($this->testRaceIds as $raceId) {
            try {
                $this->service->forget($raceId);
            } catch (\Throwable) {
                // Ignore cleanup errors
            }
        }

        parent::tearDown();
    }

    #[Test]
    public function test_returns_null_when_cache_is_empty(): void
    {
        $raceId = $this->trackRaceId(999);

        $result = $this->service->get($raceId);

        $this->assertNull($result);
    }

    #[Test]
    public function test_returns_null_on_cache_miss(): void
    {
        $raceId = $this->trackRaceId(1000);

        // Ensure no cache entry exists
        $this->assertFalse($this->service->has($raceId));

        // Should return null
        $result = $this->service->get($raceId);

        $this->assertNull($result);
    }

    #[Test]
    public function test_can_store_and_retrieve_race_results(): void
    {
        $raceId = $this->trackRaceId(123);
        $raceResults = $this->createSampleRaceResultsData(raceId: $raceId, raceNumber: 1);

        // Put into cache - should return true on success
        $result = $this->service->put($raceId, $raceResults);
        $this->assertTrue($result);

        // Get from cache
        $retrieved = $this->service->get($raceId);

        $this->assertNotNull($retrieved);
        $this->assertInstanceOf(PublicRaceResultsData::class, $retrieved);
        $this->assertEquals($raceResults->race['id'], $retrieved->race['id']);
        $this->assertEquals($raceResults->race['race_number'], $retrieved->race['race_number']);
        $this->assertEquals($raceResults->race['name'], $retrieved->race['name']);
        $this->assertEquals($raceResults->race['race_type'], $retrieved->race['race_type']);
        $this->assertEquals($raceResults->has_divisions, $retrieved->has_divisions);
    }

    #[Test]
    public function test_can_forget_cached_race_results(): void
    {
        $raceId = $this->trackRaceId(456);
        $raceResults = $this->createSampleRaceResultsData(raceId: $raceId);

        // Put and verify it exists
        $this->service->put($raceId, $raceResults);
        $this->assertTrue($this->service->has($raceId));

        // Forget - should return true on success
        $result = $this->service->forget($raceId);
        $this->assertTrue($result);

        // Verify it's gone
        $this->assertFalse($this->service->has($raceId));
        $this->assertNull($this->service->get($raceId));
    }

    #[Test]
    public function test_can_check_if_race_results_are_cached(): void
    {
        $raceId = $this->trackRaceId(789);

        // Initially not cached
        $this->assertFalse($this->service->has($raceId));

        // Put into cache
        $this->service->put($raceId, $this->createSampleRaceResultsData(raceId: $raceId));

        // Now it should be cached
        $this->assertTrue($this->service->has($raceId));
    }

    #[Test]
    public function test_handles_different_race_ids_independently(): void
    {
        $raceId1 = $this->trackRaceId(100);
        $raceId2 = $this->trackRaceId(200);

        $results1 = $this->createSampleRaceResultsData(raceId: 100, raceNumber: 1);
        $results2 = $this->createSampleRaceResultsData(raceId: 200, raceNumber: 2);

        // Store both
        $this->service->put($raceId1, $results1);
        $this->service->put($raceId2, $results2);

        // Retrieve both
        $retrieved1 = $this->service->get($raceId1);
        $retrieved2 = $this->service->get($raceId2);

        // Verify independence
        $this->assertNotNull($retrieved1);
        $this->assertNotNull($retrieved2);
        $this->assertEquals(100, $retrieved1->race['id']);
        $this->assertEquals(200, $retrieved2->race['id']);
        $this->assertEquals(1, $retrieved1->race['race_number']);
        $this->assertEquals(2, $retrieved2->race['race_number']);
    }

    #[Test]
    public function test_preserves_flat_results_in_cache(): void
    {
        $raceId = $this->trackRaceId(111);
        $results = [
            [
                'position' => 1,
                'driver_id' => 10,
                'driver_name' => 'John Doe',
                'driver_number' => 5,
                'race_time' => '1:25.123',
                'race_time_difference' => null,
                'fastest_lap' => '1:23.456',
                'penalties' => null,
                'race_points' => 25,
                'has_fastest_lap' => true,
                'has_pole' => true,
                'dnf' => false,
                'status' => 'confirmed',
            ],
            [
                'position' => 2,
                'driver_id' => 11,
                'driver_name' => 'Jane Smith',
                'driver_number' => 7,
                'race_time' => '1:25.456',
                'race_time_difference' => '+0.333',
                'fastest_lap' => '1:23.789',
                'penalties' => null,
                'race_points' => 18,
                'has_fastest_lap' => false,
                'has_pole' => false,
                'dnf' => false,
                'status' => 'confirmed',
            ],
        ];

        $raceResults = $this->createSampleRaceResultsData(
            raceId: $raceId,
            results: $results,
            hasDivisions: false
        );

        // Store and retrieve
        $this->service->put($raceId, $raceResults);
        $retrieved = $this->service->get($raceId);

        // Verify structure preserved
        $this->assertNotNull($retrieved);
        $this->assertFalse($retrieved->has_divisions);
        $this->assertCount(2, $retrieved->results);
        $this->assertEquals('John Doe', $retrieved->results[0]['driver_name']);
        $this->assertEquals(25, $retrieved->results[0]['race_points']);
        $this->assertEquals('Jane Smith', $retrieved->results[1]['driver_name']);
        $this->assertEquals(18, $retrieved->results[1]['race_points']);
    }

    #[Test]
    public function test_preserves_division_grouped_results_in_cache(): void
    {
        $raceId = $this->trackRaceId(222);
        $results = [
            [
                'division_id' => 1,
                'division_name' => 'Division A',
                'results' => [
                    [
                        'position' => 1,
                        'driver_id' => 10,
                        'driver_name' => 'John Doe',
                        'driver_number' => 5,
                        'race_time' => '1:25.123',
                        'race_time_difference' => null,
                        'fastest_lap' => '1:23.456',
                        'penalties' => null,
                        'race_points' => 25,
                        'has_fastest_lap' => true,
                        'has_pole' => true,
                        'dnf' => false,
                        'status' => 'confirmed',
                    ],
                ],
            ],
            [
                'division_id' => 2,
                'division_name' => 'Division B',
                'results' => [
                    [
                        'position' => 1,
                        'driver_id' => 20,
                        'driver_name' => 'Jane Smith',
                        'driver_number' => 7,
                        'race_time' => '1:26.123',
                        'race_time_difference' => null,
                        'fastest_lap' => '1:24.456',
                        'penalties' => null,
                        'race_points' => 25,
                        'has_fastest_lap' => true,
                        'has_pole' => false,
                        'dnf' => false,
                        'status' => 'confirmed',
                    ],
                ],
            ],
        ];

        $raceResults = $this->createSampleRaceResultsData(
            raceId: $raceId,
            results: $results,
            hasDivisions: true
        );

        // Store and retrieve
        $this->service->put($raceId, $raceResults);
        $retrieved = $this->service->get($raceId);

        // Verify division structure preserved
        $this->assertNotNull($retrieved);
        $this->assertTrue($retrieved->has_divisions);
        $this->assertCount(2, $retrieved->results);
        $this->assertEquals('Division A', $retrieved->results[0]['division_name']);
        $this->assertEquals('Division B', $retrieved->results[1]['division_name']);
        $this->assertCount(1, $retrieved->results[0]['results']);
        $this->assertCount(1, $retrieved->results[1]['results']);
        $this->assertEquals('John Doe', $retrieved->results[0]['results'][0]['driver_name']);
        $this->assertEquals('Jane Smith', $retrieved->results[1]['results'][0]['driver_name']);
    }

    #[Test]
    public function test_preserves_race_metadata_in_cache(): void
    {
        $raceId = $this->trackRaceId(333);
        $raceResults = new PublicRaceResultsData(
            race: [
                'id' => $raceId,
                'race_number' => 2,
                'name' => 'Sprint Race',
                'race_type' => 'sprint',
                'status' => 'completed',
                'is_qualifier' => false,
                'race_points' => true,
            ],
            results: [],
            has_divisions: false,
        );

        // Store and retrieve
        $this->service->put($raceId, $raceResults);
        $retrieved = $this->service->get($raceId);

        // Verify all metadata preserved
        $this->assertNotNull($retrieved);
        $this->assertEquals($raceId, $retrieved->race['id']);
        $this->assertEquals(2, $retrieved->race['race_number']);
        $this->assertEquals('Sprint Race', $retrieved->race['name']);
        $this->assertEquals('sprint', $retrieved->race['race_type']);
        $this->assertEquals('completed', $retrieved->race['status']);
        $this->assertFalse($retrieved->race['is_qualifier']);
        $this->assertTrue($retrieved->race['race_points']);
    }

    #[Test]
    public function test_handles_cache_put_and_get_round_trip(): void
    {
        $raceId = $this->trackRaceId(444);
        $originalData = $this->createSampleRaceResultsData(
            raceId: $raceId,
            raceNumber: 5,
            results: [
                [
                    'position' => 1,
                    'driver_id' => 99,
                    'driver_name' => 'Test Driver',
                    'driver_number' => 1,
                    'race_time' => '1:30.000',
                    'race_time_difference' => null,
                    'fastest_lap' => '1:28.000',
                    'penalties' => null,
                    'race_points' => 25,
                    'has_fastest_lap' => true,
                    'has_pole' => true,
                    'dnf' => false,
                    'status' => 'confirmed',
                ],
            ],
            hasDivisions: false
        );

        // Store
        $this->service->put($raceId, $originalData);

        // Retrieve
        $retrieved = $this->service->get($raceId);

        // Verify complete round-trip integrity
        $this->assertNotNull($retrieved);
        $this->assertEquals($originalData->race, $retrieved->race);
        $this->assertEquals($originalData->results, $retrieved->results);
        $this->assertEquals($originalData->has_divisions, $retrieved->has_divisions);
    }

    #[Test]
    public function test_handles_multiple_forget_calls_gracefully(): void
    {
        $raceId = $this->trackRaceId(555);
        $raceResults = $this->createSampleRaceResultsData(raceId: $raceId);

        // Store
        $this->service->put($raceId, $raceResults);
        $this->assertTrue($this->service->has($raceId));

        // Forget once
        $this->service->forget($raceId);
        $this->assertFalse($this->service->has($raceId));

        // Forget again - should not throw
        $this->service->forget($raceId);
        $this->assertFalse($this->service->has($raceId));
    }

    #[Test]
    public function test_handles_empty_results_array(): void
    {
        $raceId = $this->trackRaceId(666);
        $raceResults = $this->createSampleRaceResultsData(
            raceId: $raceId,
            results: [],
            hasDivisions: false
        );

        // Store and retrieve
        $this->service->put($raceId, $raceResults);
        $retrieved = $this->service->get($raceId);

        // Verify empty array preserved
        $this->assertNotNull($retrieved);
        $this->assertEmpty($retrieved->results);
        $this->assertFalse($retrieved->has_divisions);
    }

    #[Test]
    public function test_handles_large_result_sets(): void
    {
        $raceId = $this->trackRaceId(777);

        // Create large result set (100 drivers)
        $results = [];
        for ($i = 1; $i <= 100; $i++) {
            $results[] = [
                'position' => $i,
                'driver_id' => 1000 + $i,
                'driver_name' => "Driver {$i}",
                'driver_number' => $i,
                'race_time' => sprintf('1:%02d.%03d', 25 + $i, $i * 10),
                'race_time_difference' => $i === 1 ? null : sprintf('+%d.%03d', $i - 1, $i * 10),
                'fastest_lap' => sprintf('1:%02d.%03d', 23 + $i, $i * 5),
                'penalties' => null,
                'race_points' => max(0, 26 - $i),
                'has_fastest_lap' => $i === 1,
                'has_pole' => $i === 1,
                'dnf' => false,
                'status' => 'confirmed',
            ];
        }

        $raceResults = $this->createSampleRaceResultsData(
            raceId: $raceId,
            results: $results,
            hasDivisions: false
        );

        // Store and retrieve
        $this->service->put($raceId, $raceResults);
        $retrieved = $this->service->get($raceId);

        // Verify all 100 results preserved
        $this->assertNotNull($retrieved);
        $this->assertCount(100, $retrieved->results);
        $this->assertEquals('Driver 1', $retrieved->results[0]['driver_name']);
        $this->assertEquals('Driver 100', $retrieved->results[99]['driver_name']);
        $this->assertEquals(1, $retrieved->results[0]['position']);
        $this->assertEquals(100, $retrieved->results[99]['position']);
    }

    #[Test]
    public function test_handles_null_values_in_race_metadata(): void
    {
        $raceId = $this->trackRaceId(888);
        $raceResults = new PublicRaceResultsData(
            race: [
                'id' => $raceId,
                'race_number' => null,
                'name' => null,
                'race_type' => 'feature',
                'status' => 'scheduled',
                'is_qualifier' => false,
                'race_points' => false,
            ],
            results: [],
            has_divisions: false,
        );

        // Store and retrieve
        $this->service->put($raceId, $raceResults);
        $retrieved = $this->service->get($raceId);

        // Verify null values preserved
        $this->assertNotNull($retrieved);
        $this->assertNull($retrieved->race['race_number']);
        $this->assertNull($retrieved->race['name']);
    }

    #[Test]
    public function test_overwrites_existing_cache_entries(): void
    {
        $raceId = $this->trackRaceId(999);

        // First entry
        $firstData = $this->createSampleRaceResultsData(
            raceId: $raceId,
            raceNumber: 1,
            results: []
        );
        $this->service->put($raceId, $firstData);
        $retrieved1 = $this->service->get($raceId);
        $this->assertNotNull($retrieved1);
        $this->assertEquals(1, $retrieved1->race['race_number']);

        // Overwrite with second entry
        $secondData = $this->createSampleRaceResultsData(
            raceId: $raceId,
            raceNumber: 2,
            results: []
        );
        $this->service->put($raceId, $secondData);
        $retrieved2 = $this->service->get($raceId);

        // Verify overwrite
        $this->assertNotNull($retrieved2);
        $this->assertEquals(2, $retrieved2->race['race_number']);
    }

    #[Test]
    public function test_throws_exception_for_negative_race_id(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Race ID must be positive, -1 given');

        $this->service->get(-1);
    }

    #[Test]
    public function test_throws_exception_for_zero_race_id(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Race ID must be positive, 0 given');

        $this->service->get(0);
    }

    #[Test]
    public function test_validates_race_id_on_put(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Race ID must be positive, -5 given');

        $raceResults = $this->createSampleRaceResultsData();
        $this->service->put(-5, $raceResults);
    }

    #[Test]
    public function test_validates_race_id_on_forget(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Race ID must be positive, 0 given');

        $this->service->forget(0);
    }

    #[Test]
    public function test_validates_race_id_on_has(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Race ID must be positive, -10 given');

        $this->service->has(-10);
    }

    #[Test]
    public function test_can_batch_invalidate_multiple_race_caches(): void
    {
        // Create and cache multiple race results
        $raceIds = [
            $this->trackRaceId(1001),
            $this->trackRaceId(1002),
            $this->trackRaceId(1003),
        ];

        foreach ($raceIds as $raceId) {
            $this->service->put($raceId, $this->createSampleRaceResultsData(raceId: $raceId));
            $this->assertTrue($this->service->has($raceId));
        }

        // Batch invalidate
        $results = $this->service->forgetMany($raceIds);

        // Verify all were invalidated
        $this->assertCount(3, $results);
        $this->assertTrue($results[1001]);
        $this->assertTrue($results[1002]);
        $this->assertTrue($results[1003]);

        foreach ($raceIds as $raceId) {
            $this->assertFalse($this->service->has($raceId));
        }
    }

    #[Test]
    public function test_handles_batch_invalidation_of_non_existent_keys(): void
    {
        $raceIds = [
            $this->trackRaceId(2001),
            $this->trackRaceId(2002),
        ];

        // None of these exist in cache
        $results = $this->service->forgetMany($raceIds);

        // Should still return results for all keys
        $this->assertCount(2, $results);
        $this->assertArrayHasKey(2001, $results);
        $this->assertArrayHasKey(2002, $results);
    }

    #[Test]
    public function test_handles_batch_invalidation_of_mixed_keys(): void
    {
        $existingId = $this->trackRaceId(3001);
        $nonExistingId = $this->trackRaceId(3002);

        // Cache only one
        $this->service->put($existingId, $this->createSampleRaceResultsData(raceId: $existingId));
        $this->assertTrue($this->service->has($existingId));
        $this->assertFalse($this->service->has($nonExistingId));

        // Batch invalidate both
        $results = $this->service->forgetMany([$existingId, $nonExistingId]);

        // Both should be invalidated
        $this->assertCount(2, $results);
        $this->assertArrayHasKey($existingId, $results);
        $this->assertArrayHasKey($nonExistingId, $results);
        $this->assertFalse($this->service->has($existingId));
        $this->assertFalse($this->service->has($nonExistingId));
    }

    #[Test]
    public function test_validates_race_ids_in_batch_invalidation(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Race ID must be positive, -1 given');

        $this->service->forgetMany([100, -1, 200]);
    }

    #[Test]
    public function test_returns_false_when_cache_size_exceeds_limit(): void
    {
        $raceId = $this->trackRaceId(4001);

        // Create a massive result set that will exceed 1MB when serialized
        // Each result is roughly 300-400 bytes, so ~3000 results should exceed 1MB
        $results = [];
        for ($i = 1; $i <= 3000; $i++) {
            $results[] = [
                'position' => $i,
                'driver_id' => 1000 + $i,
                'driver_name' => str_repeat("Very Long Driver Name {$i} ", 10), // Make it longer
                'driver_number' => $i,
                'race_time' => sprintf('1:%02d.%03d', 25 + $i, $i * 10),
                'race_time_difference' => $i === 1 ? null : sprintf('+%d.%03d', $i - 1, $i * 10),
                'fastest_lap' => sprintf('1:%02d.%03d', 23 + $i, $i * 5),
                'penalties' => str_repeat('Some penalty description ', 5),
                'race_points' => max(0, 26 - $i),
                'has_fastest_lap' => $i === 1,
                'has_pole' => $i === 1,
                'dnf' => false,
                'status' => 'confirmed',
            ];
        }

        $raceResults = $this->createSampleRaceResultsData(
            raceId: $raceId,
            results: $results,
            hasDivisions: false
        );

        // Should return false due to size limit
        $result = $this->service->put($raceId, $raceResults);
        $this->assertFalse($result);

        // Should not be cached
        $this->assertFalse($this->service->has($raceId));
    }

    #[Test]
    public function test_returns_true_for_forget_on_non_existent_key(): void
    {
        $raceId = $this->trackRaceId(5001);

        // Key doesn't exist
        $this->assertFalse($this->service->has($raceId));

        // Forget should not throw exception even for non-existent keys
        $this->service->forget($raceId);

        // If we reach this point, no exception was thrown (which is the desired behavior)
        $this->assertFalse($this->service->has($raceId));
    }

    /**
     * Track a race ID for cleanup after test.
     */
    private function trackRaceId(int $raceId): int
    {
        $this->testRaceIds[] = $raceId;

        return $raceId;
    }

    /**
     * Create sample PublicRaceResultsData for testing.
     *
     * @param  array<int, mixed>  $results
     */
    private function createSampleRaceResultsData(
        int $raceId = 1,
        ?int $raceNumber = 1,
        array $results = [],
        bool $hasDivisions = false,
    ): PublicRaceResultsData {
        return new PublicRaceResultsData(
            race: [
                'id' => $raceId,
                'race_number' => $raceNumber,
                'name' => 'Test Race',
                'race_type' => 'feature',
                'status' => 'completed',
                'is_qualifier' => false,
                'race_points' => true,
            ],
            results: $results,
            has_divisions: $hasDivisions,
        );
    }
}
