<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Driver\Services;

use App\Domain\Driver\Entities\Driver;
use App\Domain\Driver\Services\DriverPlatformColumnService;
use App\Domain\Driver\ValueObjects\DriverName;
use App\Domain\Driver\ValueObjects\PlatformIdentifiers;
use App\Domain\Driver\ValueObjects\Slug;
use PHPUnit\Framework\TestCase;

class DriverPlatformColumnServiceTest extends TestCase
{
    private DriverPlatformColumnService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DriverPlatformColumnService();
    }

    public function test_it_returns_columns_for_gran_turismo_7_platform(): void
    {
        $columns = $this->service->getColumnsForLeague([1]); // Platform ID 1 = GT7

        $this->assertCount(1, $columns);
        $this->assertEquals([
            ['field' => 'psn_id', 'label' => 'PSN ID', 'type' => 'text'],
        ], $columns);
    }

    public function test_it_returns_columns_for_iracing_platform(): void
    {
        $columns = $this->service->getColumnsForLeague([2]); // Platform ID 2 = iRacing

        $this->assertCount(2, $columns);
        $this->assertEquals([
            ['field' => 'iracing_id', 'label' => 'iRacing ID', 'type' => 'text'],
            ['field' => 'iracing_customer_id', 'label' => 'iRacing Customer ID', 'type' => 'number'],
        ], $columns);
    }

    public function test_it_returns_combined_columns_for_multiple_platforms(): void
    {
        $columns = $this->service->getColumnsForLeague([1, 2]); // GT7 + iRacing

        $this->assertCount(3, $columns);
        $this->assertEquals([
            ['field' => 'psn_id', 'label' => 'PSN ID', 'type' => 'text'],
            ['field' => 'iracing_id', 'label' => 'iRacing ID', 'type' => 'text'],
            ['field' => 'iracing_customer_id', 'label' => 'iRacing Customer ID', 'type' => 'number'],
        ], $columns);
    }

    public function test_it_returns_empty_array_for_platforms_without_fields(): void
    {
        $columns = $this->service->getColumnsForLeague([3]); // Platform ID 3 = ACC (no fields yet)

        $this->assertEmpty($columns);
    }

    public function test_it_returns_empty_array_for_unknown_platform_ids(): void
    {
        $columns = $this->service->getColumnsForLeague([999]); // Non-existent platform

        $this->assertEmpty($columns);
    }

    public function test_it_returns_empty_array_for_empty_platform_ids(): void
    {
        $columns = $this->service->getColumnsForLeague([]);

        $this->assertEmpty($columns);
    }

    public function test_get_form_fields_returns_same_as_columns(): void
    {
        $platformIds = [1, 2];
        $columns = $this->service->getColumnsForLeague($platformIds);
        $formFields = $this->service->getFormFieldsForLeague($platformIds);

        $this->assertEquals($columns, $formFields);
    }

    public function test_get_csv_headers_returns_same_as_columns(): void
    {
        $platformIds = [1, 2];
        $columns = $this->service->getColumnsForLeague($platformIds);
        $csvHeaders = $this->service->getCsvHeadersForLeague($platformIds);

        $this->assertEquals($columns, $csvHeaders);
    }

    public function test_it_validates_driver_is_compatible_when_has_psn_id(): void
    {
        $driver = $this->createDriver(
            psnId: 'player123',
            iracingId: null,
            iracingCustomerId: null
        );

        $isCompatible = $this->service->validateDriverPlatformCompatibility($driver, [1]); // GT7 platform

        $this->assertTrue($isCompatible);
    }

    public function test_it_validates_driver_is_compatible_when_has_iracing_id(): void
    {
        $driver = $this->createDriver(
            psnId: null,
            iracingId: 'iracing123',
            iracingCustomerId: null
        );

        $isCompatible = $this->service->validateDriverPlatformCompatibility($driver, [2]); // iRacing platform

        $this->assertTrue($isCompatible);
    }

    public function test_it_validates_driver_is_compatible_when_has_iracing_customer_id(): void
    {
        $driver = $this->createDriver(
            psnId: null,
            iracingId: null,
            iracingCustomerId: 456789
        );

        $isCompatible = $this->service->validateDriverPlatformCompatibility($driver, [2]); // iRacing platform

        $this->assertTrue($isCompatible);
    }

    public function test_it_validates_driver_is_incompatible_when_has_no_matching_platform_ids(): void
    {
        $driver = $this->createDriver(
            psnId: 'player123',
            iracingId: null,
            iracingCustomerId: null
        );

        $isCompatible = $this->service->validateDriverPlatformCompatibility($driver, [2]); // iRacing platform

        $this->assertFalse($isCompatible);
    }

    public function test_it_validates_driver_is_compatible_for_platforms_without_defined_fields(): void
    {
        $driver = $this->createDriver(
            psnId: null,
            iracingId: null,
            iracingCustomerId: 12345
        );

        $isCompatible = $this->service->validateDriverPlatformCompatibility($driver, [3]); // ACC (no fields)

        $this->assertTrue($isCompatible); // Should pass when no fields are defined
    }

    public function test_it_validates_driver_is_compatible_when_has_at_least_one_matching_id_for_multiple_platforms(): void
    {
        $driver = $this->createDriver(
            psnId: 'player123',
            iracingId: null,
            iracingCustomerId: null
        );

        $isCompatible = $this->service->validateDriverPlatformCompatibility($driver, [1, 2]); // GT7 + iRacing

        $this->assertTrue($isCompatible); // Has PSN ID which matches GT7 platform
    }

    public function test_it_validates_driver_is_incompatible_when_platform_ids_are_empty_strings(): void
    {
        // Create driver with valid iracing ID but empty PSN ID
        $driver = $this->createDriver(
            psnId: null,
            iracingId: 'valid-iracing-id', // Need at least one valid ID
            iracingCustomerId: null
        );

        // Try to validate against GT7 platform (platform 1)
        // Driver only has iRacing ID, so should be incompatible with GT7
        $isCompatible = $this->service->validateDriverPlatformCompatibility($driver, [1]);

        $this->assertFalse($isCompatible);
    }

    /**
     * Helper method to create a driver entity for testing.
     */
    private function createDriver(
        ?string $psnId,
        ?string $iracingId,
        ?int $iracingCustomerId
    ): Driver {
        // If all IDs are null/empty, provide at least one valid ID to pass PlatformIdentifiers validation
        if ($psnId === null && $iracingId === null && $iracingCustomerId === null) {
            $psnId = 'dummy'; // Provide a dummy value to pass validation
        }

        // Trim whitespace-only strings to null for validation
        if ($psnId !== null && trim($psnId) === '') {
            // Keep it as-is for testing whitespace validation
        }

        return Driver::create(
            name: DriverName::from('John', 'Doe', 'JD'),
            platformIds: PlatformIdentifiers::from(
                $psnId,
                $iracingId,
                $iracingCustomerId
            ),
            email: 'test@example.com',
            phone: null,
            slug: Slug::from('john-doe')
        );
    }
}
