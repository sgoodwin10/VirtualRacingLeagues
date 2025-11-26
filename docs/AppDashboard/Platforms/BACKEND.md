# Backend Implementation Guide - Platform-Based Driver Management

## Overview

This guide details the backend implementation for dynamic platform-based driver management. The system determines which driver fields (PSN ID, GT7 ID, iRacing ID, etc.) should be displayed, validated, and collected based on a league's selected platforms.

## Architecture

Following Domain-Driven Design (DDD) principles:

```
┌─────────────────────────────────────────────────────────────┐
│  Interface Layer (Controllers)                              │
│  - DriverController: Thin endpoints (3-5 lines each)        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Application Layer (Application Services)                   │
│  - DriverApplicationService: Orchestrates use cases         │
│  - Fetches league, calls domain service, returns DTOs       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Domain Layer (Domain Service)                              │
│  - DriverPlatformColumnService: Business logic              │
│  - Maps platform IDs → driver fields                        │
│  - Pure PHP, no Laravel dependencies                        │
└─────────────────────────────────────────────────────────────┘
```

## Domain Service: `DriverPlatformColumnService`

**Location**: `app/Domain/Driver/Services/DriverPlatformColumnService.php`

**Responsibility**: Centralized business logic for platform-specific field configuration.

### Class Structure

```php
<?php

namespace App\Domain\Driver\Services;

final class DriverPlatformColumnService
{
    /**
     * Maps platform IDs to their associated driver field names.
     *
     * Platform IDs:
     * 1 = Gran Turismo 7
     * 2 = iRacing
     * 3 = Assetto Corsa Competizione
     * 4 = rFactor 2
     * 5 = Automobilista 2
     * 6 = F1 24
     */
    private const PLATFORM_FIELD_MAP = [
        1 => ['psn_id', 'gt7_id'],
        2 => ['iracing_id', 'iracing_customer_id'],
        3 => [], // No fields defined yet
        4 => [], // No fields defined yet
        5 => [], // No fields defined yet
        6 => [], // No fields defined yet
    ];

    /**
     * Complete field definitions with metadata.
     */
    private const FIELD_DEFINITIONS = [
        'psn_id' => [
            'field' => 'psn_id',
            'label' => 'PSN ID',
            'type' => 'text',
            'platform_ids' => [1],
            'validation_rules' => 'nullable|string|max:255',
            'csv_header' => 'PSN ID',
            'help_text' => 'PlayStation Network ID',
            'placeholder' => 'Enter PSN ID',
            'sortable' => true,
            'filterable' => true,
        ],
        'gt7_id' => [
            'field' => 'gt7_id',
            'label' => 'GT7 ID',
            'type' => 'text',
            'platform_ids' => [1],
            'validation_rules' => 'nullable|string|max:255',
            'csv_header' => 'GT7 ID',
            'help_text' => 'Gran Turismo 7 Player ID',
            'placeholder' => 'Enter GT7 ID',
            'sortable' => true,
            'filterable' => true,
        ],
        'iracing_id' => [
            'field' => 'iracing_id',
            'label' => 'iRacing ID',
            'type' => 'text',
            'platform_ids' => [2],
            'validation_rules' => 'nullable|string|max:255',
            'csv_header' => 'iRacing ID',
            'help_text' => 'iRacing Username',
            'placeholder' => 'Enter iRacing ID',
            'sortable' => true,
            'filterable' => true,
        ],
        'iracing_customer_id' => [
            'field' => 'iracing_customer_id',
            'label' => 'iRacing Customer ID',
            'type' => 'number',
            'platform_ids' => [2],
            'validation_rules' => 'nullable|integer',
            'csv_header' => 'iRacing Customer ID',
            'help_text' => 'Numeric iRacing Customer ID',
            'placeholder' => 'Enter Customer ID',
            'sortable' => true,
            'filterable' => true,
        ],
    ];

    /**
     * Get column configurations for DataTable based on league platforms.
     *
     * @param array<int> $platformIds
     * @return array<array>
     */
    public static function getColumnsForLeague(array $platformIds): array
    {
        return self::getFieldsForPlatforms($platformIds);
    }

    /**
     * Get form field configurations for Create/Edit forms.
     *
     * @param array<int> $platformIds
     * @return array<array>
     */
    public static function getFormFieldsForLeague(array $platformIds): array
    {
        return self::getFieldsForPlatforms($platformIds);
    }

    /**
     * Get CSV header names for CSV export/template.
     *
     * @param array<int> $platformIds
     * @return array<string>
     */
    public static function getCsvHeadersForLeague(array $platformIds): array
    {
        $fields = self::getFieldsForPlatforms($platformIds);
        return array_map(fn($field) => $field['csv_header'], $fields);
    }

    /**
     * Validate that driver data has at least one platform ID matching league platforms.
     *
     * @param array<int> $leaguePlatformIds
     * @param array $driverData
     * @return bool
     */
    public static function validatePlatformCompatibility(array $leaguePlatformIds, array $driverData): bool
    {
        $requiredFields = self::getRequiredFieldNames($leaguePlatformIds);

        foreach ($requiredFields as $fieldName) {
            if (!empty($driverData[$fieldName])) {
                return true; // At least one platform field is populated
            }
        }

        return false;
    }

    /**
     * Get all platform field names for given platform IDs.
     *
     * @param array<int> $platformIds
     * @return array<string>
     */
    private static function getRequiredFieldNames(array $platformIds): array
    {
        $fieldNames = [];

        foreach ($platformIds as $platformId) {
            if (isset(self::PLATFORM_FIELD_MAP[$platformId])) {
                $fieldNames = array_merge($fieldNames, self::PLATFORM_FIELD_MAP[$platformId]);
            }
        }

        return array_unique($fieldNames);
    }

    /**
     * Get field definitions for given platform IDs.
     *
     * @param array<int> $platformIds
     * @return array<array>
     */
    private static function getFieldsForPlatforms(array $platformIds): array
    {
        $fields = [];

        foreach (self::FIELD_DEFINITIONS as $fieldName => $definition) {
            if (self::isPlatformFieldRelevant($definition['platform_ids'], $platformIds)) {
                $fields[] = $definition;
            }
        }

        return $fields;
    }

    /**
     * Check if a platform field is relevant for the given league platforms.
     *
     * @param array<int> $fieldPlatformIds
     * @param array<int> $leaguePlatformIds
     * @return bool
     */
    private static function isPlatformFieldRelevant(array $fieldPlatformIds, array $leaguePlatformIds): bool
    {
        return !empty(array_intersect($fieldPlatformIds, $leaguePlatformIds));
    }
}
```

### Key Methods

#### `getColumnsForLeague(array $platformIds): array`
Returns column configuration for DataTable rendering.

**Input**: `[1, 2]` (Gran Turismo 7, iRacing)
**Output**:
```php
[
    [
        'field' => 'psn_id',
        'label' => 'PSN ID',
        'type' => 'text',
        'sortable' => true,
        'filterable' => true,
        // ... more metadata
    ],
    [
        'field' => 'gt7_id',
        'label' => 'GT7 ID',
        // ...
    ],
    [
        'field' => 'iracing_id',
        'label' => 'iRacing ID',
        // ...
    ],
    [
        'field' => 'iracing_customer_id',
        'label' => 'iRacing Customer ID',
        // ...
    ],
]
```

#### `getFormFieldsForLeague(array $platformIds): array`
Returns form field configuration with validation rules.

**Input**: `[1]` (Gran Turismo 7 only)
**Output**:
```php
[
    [
        'field' => 'psn_id',
        'label' => 'PSN ID',
        'type' => 'text',
        'validation_rules' => 'nullable|string|max:255',
        'placeholder' => 'Enter PSN ID',
        'help_text' => 'PlayStation Network ID',
    ],
    [
        'field' => 'gt7_id',
        'label' => 'GT7 ID',
        // ...
    ],
]
```

#### `getCsvHeadersForLeague(array $platformIds): array`
Returns CSV header strings for export/template.

**Input**: `[2]` (iRacing only)
**Output**: `['iRacing ID', 'iRacing Customer ID']`

#### `validatePlatformCompatibility(array $leaguePlatformIds, array $driverData): bool`
Validates driver has at least one platform ID matching league's platforms.

**Input**:
- League platform IDs: `[1]` (Gran Turismo 7)
- Driver data: `['first_name' => 'John', 'psn_id' => 'john_racer', 'iracing_id' => null]`

**Output**: `true` (driver has `psn_id` which matches platform 1)

**Invalid Example**:
- League platform IDs: `[1]` (Gran Turismo 7)
- Driver data: `['first_name' => 'John', 'iracing_id' => 'john123']`
- Output: `false` (driver only has iRacing ID, but league requires GT7/PSN)

---

## Application Service: `DriverApplicationService`

**Location**: `app/Application/Driver/Services/DriverApplicationService.php`

### New Methods

```php
/**
 * Get driver column configuration for a league's DataTable.
 */
public function getDriverColumnsForLeague(int $leagueId): array
{
    $league = $this->leagueRepository->findById($leagueId);

    if (!$league) {
        throw new LeagueNotFoundException("League with ID {$leagueId} not found");
    }

    return DriverPlatformColumnService::getColumnsForLeague($league->platformIds());
}

/**
 * Get driver form field configuration for Create/Edit forms.
 */
public function getDriverFormFieldsForLeague(int $leagueId): array
{
    $league = $this->leagueRepository->findById($leagueId);

    if (!$league) {
        throw new LeagueNotFoundException("League with ID {$leagueId} not found");
    }

    return DriverPlatformColumnService::getFormFieldsForLeague($league->platformIds());
}

/**
 * Get CSV headers for CSV template download.
 */
public function getCsvHeadersForLeague(int $leagueId): array
{
    $league = $this->leagueRepository->findById($leagueId);

    if (!$league) {
        throw new LeagueNotFoundException("League with ID {$leagueId} not found");
    }

    return DriverPlatformColumnService::getCsvHeadersForLeague($league->platformIds());
}

/**
 * Validate driver data has compatible platform IDs for league.
 */
public function validateDriverPlatformCompatibility(int $leagueId, array $driverData): bool
{
    $league = $this->leagueRepository->findById($leagueId);

    if (!$league) {
        throw new LeagueNotFoundException("League with ID {$leagueId} not found");
    }

    return DriverPlatformColumnService::validatePlatformCompatibility(
        $league->platformIds(),
        $driverData
    );
}
```

---

## Controller: `DriverController`

**Location**: `app/Http/Controllers/User/DriverController.php`

### New Endpoints

```php
/**
 * Get driver column configuration for DataTable.
 *
 * GET /api/leagues/{league}/driver-columns
 */
public function getDriverColumns(League $league): JsonResponse
{
    try {
        $columns = $this->driverService->getDriverColumnsForLeague($league->id);
        return ApiResponse::success($columns);
    } catch (\Exception $e) {
        return ApiResponse::error($e->getMessage(), null, 500);
    }
}

/**
 * Get driver form field configuration for Create/Edit forms.
 *
 * GET /api/leagues/{league}/driver-form-fields
 */
public function getDriverFormFields(League $league): JsonResponse
{
    try {
        $fields = $this->driverService->getDriverFormFieldsForLeague($league->id);
        return ApiResponse::success($fields);
    } catch (\Exception $e) {
        return ApiResponse::error($e->getMessage(), null, 500);
    }
}

/**
 * Download CSV template with dynamic headers.
 *
 * GET /api/leagues/{league}/drivers/csv-template
 */
public function downloadCsvTemplate(League $league): Response
{
    try {
        $headers = $this->driverService->getCsvHeadersForLeague($league->id);

        // Add base headers
        $allHeaders = array_merge(
            ['First Name', 'Last Name', 'Email', 'Phone', 'Driver Number'],
            $headers
        );

        $csv = Writer::createFromString('');
        $csv->insertOne($allHeaders);

        return response($csv->toString(), 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="driver-template.csv"');
    } catch (\Exception $e) {
        return ApiResponse::error($e->getMessage(), null, 500);
    }
}
```

### Enhanced CSV Import

```php
/**
 * Import drivers from CSV.
 *
 * POST /api/leagues/{league}/drivers/import-csv
 */
public function importCsv(Request $request, League $league): JsonResponse
{
    // ... existing validation ...

    $errors = [];
    $validDrivers = [];

    foreach ($csvData as $index => $row) {
        $rowNumber = $index + 2; // +2 for header row and 0-index

        // Validate platform compatibility
        $isCompatible = $this->driverService->validateDriverPlatformCompatibility(
            $league->id,
            $row
        );

        if (!$isCompatible) {
            $platformNames = implode(', ', $league->platforms->pluck('name')->toArray());
            $errors[] = [
                'row' => $rowNumber,
                'error' => "Driver must have at least one platform ID for: {$platformNames}",
            ];
            continue;
        }

        $validDrivers[] = $row;
    }

    if (!empty($errors)) {
        return ApiResponse::error('CSV validation failed', ['errors' => $errors], 422);
    }

    // Proceed with import...
}
```

---

## Routes

**Location**: `routes/subdomain.php`

```php
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::prefix('api')->middleware(['auth:web', 'user.authenticate'])->group(function () {
        // Platform configuration endpoints
        Route::get('/leagues/{league}/driver-columns', [DriverController::class, 'getDriverColumns']);
        Route::get('/leagues/{league}/driver-form-fields', [DriverController::class, 'getDriverFormFields']);
        Route::get('/leagues/{league}/drivers/csv-template', [DriverController::class, 'downloadCsvTemplate']);

        // Existing driver endpoints...
    });
});
```

---

## Testing

### Unit Tests: `DriverPlatformColumnService`

**Location**: `tests/Unit/Domain/Driver/Services/DriverPlatformColumnServiceTest.php`

```php
<?php

namespace Tests\Unit\Domain\Driver\Services;

use App\Domain\Driver\Services\DriverPlatformColumnService;
use PHPUnit\Framework\TestCase;

class DriverPlatformColumnServiceTest extends TestCase
{
    public function test_get_columns_for_single_platform(): void
    {
        $columns = DriverPlatformColumnService::getColumnsForLeague([1]); // GT7

        $this->assertCount(2, $columns);
        $this->assertEquals('psn_id', $columns[0]['field']);
        $this->assertEquals('gt7_id', $columns[1]['field']);
    }

    public function test_get_columns_for_multiple_platforms(): void
    {
        $columns = DriverPlatformColumnService::getColumnsForLeague([1, 2]); // GT7 + iRacing

        $this->assertCount(4, $columns);
        $fieldNames = array_column($columns, 'field');
        $this->assertContains('psn_id', $fieldNames);
        $this->assertContains('gt7_id', $fieldNames);
        $this->assertContains('iracing_id', $fieldNames);
        $this->assertContains('iracing_customer_id', $fieldNames);
    }

    public function test_get_columns_for_empty_platforms(): void
    {
        $columns = DriverPlatformColumnService::getColumnsForLeague([]);

        $this->assertEmpty($columns);
    }

    public function test_get_form_fields_includes_validation_rules(): void
    {
        $fields = DriverPlatformColumnService::getFormFieldsForLeague([1]);

        $this->assertArrayHasKey('validation_rules', $fields[0]);
        $this->assertEquals('nullable|string|max:255', $fields[0]['validation_rules']);
    }

    public function test_get_csv_headers_returns_string_array(): void
    {
        $headers = DriverPlatformColumnService::getCsvHeadersForLeague([2]); // iRacing

        $this->assertEquals(['iRacing ID', 'iRacing Customer ID'], $headers);
    }

    public function test_validate_platform_compatibility_passes_with_matching_field(): void
    {
        $driverData = [
            'first_name' => 'John',
            'psn_id' => 'john_racer',
            'gt7_id' => null,
        ];

        $isValid = DriverPlatformColumnService::validatePlatformCompatibility([1], $driverData);

        $this->assertTrue($isValid);
    }

    public function test_validate_platform_compatibility_fails_without_matching_field(): void
    {
        $driverData = [
            'first_name' => 'John',
            'iracing_id' => 'john123', // Has iRacing, but league requires GT7
        ];

        $isValid = DriverPlatformColumnService::validatePlatformCompatibility([1], $driverData);

        $this->assertFalse($isValid);
    }
}
```

### Feature Tests: `DriverController`

**Location**: `tests/Feature/Http/Controllers/User/DriverControllerTest.php`

```php
public function test_get_driver_columns_returns_correct_config(): void
{
    $user = User::factory()->create();
    $league = League::factory()->create([
        'user_id' => $user->id,
        'platform_ids' => [1, 2], // GT7 + iRacing
    ]);

    $response = $this->actingAs($user)
        ->getJson("/api/leagues/{$league->id}/driver-columns");

    $response->assertOk()
        ->assertJsonCount(4, 'data')
        ->assertJsonPath('data.0.field', 'psn_id')
        ->assertJsonPath('data.1.field', 'gt7_id')
        ->assertJsonPath('data.2.field', 'iracing_id');
}

public function test_csv_template_download_has_correct_headers(): void
{
    $user = User::factory()->create();
    $league = League::factory()->create([
        'user_id' => $user->id,
        'platform_ids' => [1], // GT7 only
    ]);

    $response = $this->actingAs($user)
        ->get("/api/leagues/{$league->id}/drivers/csv-template");

    $response->assertOk()
        ->assertHeader('Content-Type', 'text/csv');

    $content = $response->getContent();
    $this->assertStringContainsString('PSN ID', $content);
    $this->assertStringContainsString('GT7 ID', $content);
    $this->assertStringNotContainsString('iRacing ID', $content);
}

public function test_csv_import_rejects_incompatible_driver(): void
{
    $user = User::factory()->create();
    $league = League::factory()->create([
        'user_id' => $user->id,
        'platform_ids' => [1], // GT7 only
    ]);

    $csvContent = "First Name,Last Name,Email,iRacing ID\nJohn,Doe,john@example.com,john123";
    $file = UploadedFile::fake()->createWithContent('drivers.csv', $csvContent);

    $response = $this->actingAs($user)
        ->postJson("/api/leagues/{$league->id}/drivers/import-csv", [
            'file' => $file,
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('errors.0.error', 'Driver must have at least one platform ID for: Gran Turismo 7');
}
```

---

## Adding New Platforms

To add support for a new platform (e.g., Assetto Corsa Competizione):

1. **Add database column** (if needed):
   ```php
   Schema::table('drivers', function (Blueprint $table) {
       $table->string('acc_id', 255)->nullable();
   });
   ```

2. **Update `PLATFORM_FIELD_MAP`**:
   ```php
   3 => ['acc_id'], // Assetto Corsa Competizione
   ```

3. **Update `FIELD_DEFINITIONS`**:
   ```php
   'acc_id' => [
       'field' => 'acc_id',
       'label' => 'ACC ID',
       'type' => 'text',
       'platform_ids' => [3],
       'validation_rules' => 'nullable|string|max:255',
       'csv_header' => 'ACC ID',
       'help_text' => 'Assetto Corsa Competizione Player ID',
       'placeholder' => 'Enter ACC ID',
       'sortable' => true,
       'filterable' => true,
   ],
   ```

4. **Update Driver entity** (if using value objects):
   ```php
   // In PlatformIdentifiers value object
   public function __construct(
       // ... existing
       public readonly ?string $accId = null,
   ) {
       // ...
   }
   ```

5. **Run tests** to ensure everything works

No changes needed in controllers, routes, or application services!

---

## API Response Examples

### GET `/api/leagues/1/driver-columns`

```json
{
  "data": [
    {
      "field": "psn_id",
      "label": "PSN ID",
      "type": "text",
      "sortable": true,
      "filterable": true
    },
    {
      "field": "gt7_id",
      "label": "GT7 ID",
      "type": "text",
      "sortable": true,
      "filterable": true
    }
  ]
}
```

### GET `/api/leagues/1/driver-form-fields`

```json
{
  "data": [
    {
      "field": "psn_id",
      "label": "PSN ID",
      "type": "text",
      "validation_rules": "nullable|string|max:255",
      "placeholder": "Enter PSN ID",
      "help_text": "PlayStation Network ID"
    },
    {
      "field": "gt7_id",
      "label": "GT7 ID",
      "type": "text",
      "validation_rules": "nullable|string|max:255",
      "placeholder": "Enter GT7 ID",
      "help_text": "Gran Turismo 7 Player ID"
    }
  ]
}
```

### POST `/api/leagues/1/drivers/import-csv` (with errors)

```json
{
  "error": "CSV validation failed",
  "data": {
    "errors": [
      {
        "row": 5,
        "error": "Driver must have at least one platform ID for: Gran Turismo 7"
      },
      {
        "row": 12,
        "error": "Driver must have at least one platform ID for: Gran Turismo 7"
      }
    ]
  }
}
```
