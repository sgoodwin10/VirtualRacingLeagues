<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Export;

use App\Application\Export\Services\CsvExportService;
use Tests\TestCase;

/**
 * @covers \App\Application\Export\Services\CsvExportService
 *
 * Note: The CsvExportService depends on final classes that cannot be mocked.
 * This test uses Laravel's container to resolve the service.
 * More comprehensive testing is done via feature tests in ExportControllerTest.
 */
final class CsvExportServiceTest extends TestCase
{
    public function test_service_can_be_resolved_from_container(): void
    {
        $service = $this->app->make(CsvExportService::class);

        $this->assertInstanceOf(CsvExportService::class, $service);
    }

    public function test_service_has_required_methods(): void
    {
        $service = $this->app->make(CsvExportService::class);

        $this->assertTrue(method_exists($service, 'generateRaceResultsCsv'));
        $this->assertTrue(method_exists($service, 'generateRoundStandingsCsv'));
        $this->assertTrue(method_exists($service, 'generateCrossDivisionCsv'));
        $this->assertTrue(method_exists($service, 'generateSeasonStandingsCsv'));
    }
}
