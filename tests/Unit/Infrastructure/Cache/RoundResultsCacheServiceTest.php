<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Cache;

use App\Application\Competition\DTOs\DivisionData;
use App\Application\Competition\DTOs\RaceEventResultData;
use App\Application\Competition\DTOs\RoundResultsData;
use App\Infrastructure\Cache\RoundResultsCacheService;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Spatie\LaravelData\DataCollection;
use Tests\TestCase;

final class RoundResultsCacheServiceTest extends TestCase
{
    private RoundResultsCacheService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new RoundResultsCacheService();

        // Clear any existing cache for tests
        Cache::store('redis')->flush();
    }

    protected function tearDown(): void
    {
        // Clean up after tests
        Cache::store('redis')->flush();
        parent::tearDown();
    }

    #[Test]
    public function it_returns_null_when_cache_is_empty(): void
    {
        $result = $this->service->get(999);

        $this->assertNull($result);
    }

    #[Test]
    public function it_can_store_and_retrieve_round_results(): void
    {
        $roundId = 123;
        $roundResults = $this->createSampleRoundResultsData();

        $this->service->put($roundId, $roundResults);
        $retrieved = $this->service->get($roundId);

        $this->assertNotNull($retrieved);
        $this->assertInstanceOf(RoundResultsData::class, $retrieved);
        $this->assertEquals($roundResults->round['id'], $retrieved->round['id']);
        $this->assertEquals($roundResults->round['round_number'], $retrieved->round['round_number']);
    }

    #[Test]
    public function it_can_forget_cached_round_results(): void
    {
        $roundId = 456;
        $roundResults = $this->createSampleRoundResultsData();

        $this->service->put($roundId, $roundResults);
        $this->assertTrue($this->service->has($roundId));

        $this->service->forget($roundId);

        $this->assertFalse($this->service->has($roundId));
        $this->assertNull($this->service->get($roundId));
    }

    #[Test]
    public function it_can_check_if_round_results_are_cached(): void
    {
        $roundId = 789;

        $this->assertFalse($this->service->has($roundId));

        $this->service->put($roundId, $this->createSampleRoundResultsData());

        $this->assertTrue($this->service->has($roundId));
    }

    #[Test]
    public function it_handles_different_round_ids_independently(): void
    {
        $roundId1 = 100;
        $roundId2 = 200;

        $results1 = $this->createSampleRoundResultsData(roundId: 100, roundNumber: 1);
        $results2 = $this->createSampleRoundResultsData(roundId: 200, roundNumber: 2);

        $this->service->put($roundId1, $results1);
        $this->service->put($roundId2, $results2);

        $retrieved1 = $this->service->get($roundId1);
        $retrieved2 = $this->service->get($roundId2);

        $this->assertNotNull($retrieved1);
        $this->assertNotNull($retrieved2);
        $this->assertEquals(100, $retrieved1->round['id']);
        $this->assertEquals(200, $retrieved2->round['id']);
        $this->assertEquals(1, $retrieved1->round['round_number']);
        $this->assertEquals(2, $retrieved2->round['round_number']);
    }

    #[Test]
    public function it_preserves_divisions_in_cache(): void
    {
        $roundId = 111;
        $divisions = [
            new DivisionData(id: 1, name: 'Division A', description: 'Top tier'),
            new DivisionData(id: 2, name: 'Division B', description: 'Second tier'),
        ];

        $roundResults = $this->createSampleRoundResultsData(divisions: $divisions);

        $this->service->put($roundId, $roundResults);
        $retrieved = $this->service->get($roundId);

        $this->assertNotNull($retrieved);
        $this->assertCount(2, $retrieved->divisions);
        $this->assertEquals('Division A', $retrieved->divisions[0]->name);
        $this->assertEquals('Division B', $retrieved->divisions[1]->name);
    }

    #[Test]
    public function it_preserves_race_events_in_cache(): void
    {
        $roundId = 222;
        $raceEvents = [
            new RaceEventResultData(
                id: 10,
                race_number: 1,
                name: 'Qualifying',
                is_qualifier: true,
                status: 'completed',
                race_points: false,
                results: [],
            ),
            new RaceEventResultData(
                id: 11,
                race_number: 2,
                name: 'Main Race',
                is_qualifier: false,
                status: 'completed',
                race_points: true,
                results: [],
            ),
        ];

        $roundResults = $this->createSampleRoundResultsData(raceEvents: $raceEvents);

        $this->service->put($roundId, $roundResults);
        $retrieved = $this->service->get($roundId);

        $this->assertNotNull($retrieved);
        $this->assertCount(2, $retrieved->race_events);
        $this->assertEquals('Qualifying', $retrieved->race_events[0]->name);
        $this->assertTrue($retrieved->race_events[0]->is_qualifier);
        $this->assertEquals('Main Race', $retrieved->race_events[1]->name);
        $this->assertFalse($retrieved->race_events[1]->is_qualifier);
    }

    /**
     * Create sample RoundResultsData for testing.
     *
     * @param array<DivisionData>|null $divisions
     * @param array<RaceEventResultData>|null $raceEvents
     */
    private function createSampleRoundResultsData(
        int $roundId = 1,
        int $roundNumber = 1,
        ?array $divisions = null,
        ?array $raceEvents = null,
    ): RoundResultsData {
        return new RoundResultsData(
            round: [
                'id' => $roundId,
                'round_number' => $roundNumber,
                'name' => 'Test Round',
                'status' => 'completed',
                'round_results' => ['standings' => []],
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
            ],
            divisions: new DataCollection(DivisionData::class, $divisions ?? []),
            race_events: new DataCollection(RaceEventResultData::class, $raceEvents ?? []),
        );
    }
}
