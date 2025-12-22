# Car List Import - Backend Implementation Plan

## Overview

This document details the backend implementation for the GT7 car import feature, following the project's DDD architecture.

---

## Phase 1: Database Migrations

### Migration 1: `create_car_brands_table.php`

```php
Schema::create('car_brands', function (Blueprint $table) {
    $table->id();
    $table->string('name', 100)->unique();
    $table->string('slug', 120)->unique();
    $table->string('logo_url', 255)->nullable();
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();

    $table->index('is_active');
    $table->index('sort_order');
});
```

### Migration 2: `create_platform_cars_table.php`

```php
Schema::create('platform_cars', function (Blueprint $table) {
    $table->id();
    $table->foreignId('platform_id')->constrained('platforms')->onDelete('cascade');
    $table->foreignId('car_brand_id')->constrained('car_brands')->onDelete('cascade');
    $table->string('external_id', 50);
    $table->string('name', 255);
    $table->string('slug', 255);
    $table->string('car_group', 50)->nullable();  // Renamed from 'group' (reserved word)
    $table->integer('year')->nullable();           // Model year from source
    $table->string('image_url', 255)->nullable();  // Empty initially per requirements
    $table->boolean('is_active')->default(true);   // Set to false if removed from source
    $table->integer('sort_order')->default(0);
    $table->timestamps();

    // Indexes
    $table->index('platform_id');
    $table->index('car_brand_id');
    $table->index('is_active');
    $table->index('sort_order');
    $table->index('car_group');
    $table->index('year');

    // Unique constraints
    $table->unique(['platform_id', 'external_id'], 'platform_cars_external_id_unique');
    $table->unique(['platform_id', 'slug'], 'platform_cars_slug_unique');
});
```

---

## Phase 2: Domain Layer

### Location: `app/Domain/Platform/`

### 2.1 Value Objects

**`ValueObjects/CarName.php`**
```php
final readonly class CarName
{
    private function __construct(
        private string $value
    ) {
        if (empty(trim($value))) {
            throw new InvalidArgumentException('Car name cannot be empty');
        }
        if (strlen($value) > 255) {
            throw new InvalidArgumentException('Car name cannot exceed 255 characters');
        }
    }

    public static function from(string $value): self
    {
        return new self(trim($value));
    }

    public function value(): string
    {
        return $this->value;
    }
}
```

**`ValueObjects/CarGroup.php`**
```php
final readonly class CarGroup
{
    private function __construct(
        private ?string $value
    ) {
        if ($value !== null && strlen($value) > 50) {
            throw new InvalidArgumentException('Car group cannot exceed 50 characters');
        }
    }

    public static function from(?string $value): self
    {
        return new self($value ? trim($value) : null);
    }

    public function value(): ?string
    {
        return $this->value;
    }
}
```

**`ValueObjects/CarYear.php`**
```php
final readonly class CarYear
{
    private function __construct(
        private ?int $value
    ) {
        if ($value !== null && ($value < 1900 || $value > 2100)) {
            throw new InvalidArgumentException('Car year must be between 1900 and 2100');
        }
    }

    public static function from(mixed $value): self
    {
        if ($value === null || $value === '') {
            return new self(null);
        }
        return new self((int) $value);
    }

    public function value(): ?int
    {
        return $this->value;
    }
}
```

**`ValueObjects/ExternalId.php`**
```php
final readonly class ExternalId
{
    private function __construct(
        private string $value
    ) {
        if (empty(trim($value))) {
            throw new InvalidArgumentException('External ID cannot be empty');
        }
    }

    public static function from(string $value): self
    {
        return new self(trim($value));
    }

    public function value(): string
    {
        return $this->value;
    }
}
```

### 2.2 Entities

**`Entities/CarBrand.php`**
```php
final class CarBrand
{
    private function __construct(
        private ?int $id,
        private string $name,
        private string $slug,
        private ?string $logoUrl,
        private bool $isActive,
        private int $sortOrder,
    ) {}

    public static function create(string $name, ?string $logoUrl = null): self
    {
        return new self(
            id: null,
            name: $name,
            slug: Str::slug($name),
            logoUrl: $logoUrl,
            isActive: true,
            sortOrder: 0,
        );
    }

    public static function reconstitute(
        int $id,
        string $name,
        string $slug,
        ?string $logoUrl,
        bool $isActive,
        int $sortOrder,
    ): self {
        return new self($id, $name, $slug, $logoUrl, $isActive, $sortOrder);
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function name(): string { return $this->name; }
    public function slug(): string { return $this->slug; }
    public function logoUrl(): ?string { return $this->logoUrl; }
    public function isActive(): bool { return $this->isActive; }
    public function sortOrder(): int { return $this->sortOrder; }

    public function setId(int $id): void { $this->id = $id; }
}
```

**`Entities/Car.php`**
```php
final class Car
{
    private function __construct(
        private ?int $id,
        private int $platformId,
        private int $carBrandId,
        private ExternalId $externalId,
        private CarName $name,
        private string $slug,
        private CarGroup $group,
        private CarYear $year,
        private ?string $imageUrl,
        private bool $isActive,
        private int $sortOrder,
    ) {}

    public static function create(
        int $platformId,
        int $carBrandId,
        ExternalId $externalId,
        CarName $name,
        CarGroup $group,
        CarYear $year,
        ?string $imageUrl = null,
    ): self {
        return new self(
            id: null,
            platformId: $platformId,
            carBrandId: $carBrandId,
            externalId: $externalId,
            name: $name,
            slug: Str::slug($name->value()),
            group: $group,
            year: $year,
            imageUrl: $imageUrl,
            isActive: true,
            sortOrder: 0,
        );
    }

    public static function reconstitute(
        int $id,
        int $platformId,
        int $carBrandId,
        ExternalId $externalId,
        CarName $name,
        string $slug,
        CarGroup $group,
        CarYear $year,
        ?string $imageUrl,
        bool $isActive,
        int $sortOrder,
    ): self {
        return new self(
            $id, $platformId, $carBrandId, $externalId,
            $name, $slug, $group, $year, $imageUrl, $isActive, $sortOrder
        );
    }

    public function update(
        int $carBrandId,
        CarName $name,
        CarGroup $group,
        CarYear $year,
    ): void {
        $this->carBrandId = $carBrandId;
        $this->name = $name;
        $this->slug = Str::slug($name->value());
        $this->group = $group;
        $this->year = $year;
    }

    public function deactivate(): void
    {
        $this->isActive = false;
    }

    public function activate(): void
    {
        $this->isActive = true;
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function platformId(): int { return $this->platformId; }
    public function carBrandId(): int { return $this->carBrandId; }
    public function externalId(): ExternalId { return $this->externalId; }
    public function name(): CarName { return $this->name; }
    public function slug(): string { return $this->slug; }
    public function group(): CarGroup { return $this->group; }
    public function year(): CarYear { return $this->year; }
    public function imageUrl(): ?string { return $this->imageUrl; }
    public function isActive(): bool { return $this->isActive; }
    public function sortOrder(): int { return $this->sortOrder; }

    public function setId(int $id): void { $this->id = $id; }
}
```

### 2.3 Repository Interfaces

**`Repositories/CarBrandRepositoryInterface.php`**
```php
interface CarBrandRepositoryInterface
{
    public function findById(int $id): CarBrand;
    public function findByName(string $name): ?CarBrand;
    public function findOrCreateByName(string $name): CarBrand;
    public function save(CarBrand $brand): void;
    public function getAllActive(): array;
}
```

**`Repositories/CarRepositoryInterface.php`**
```php
interface CarRepositoryInterface
{
    public function findById(int $id): Car;
    public function findByExternalId(int $platformId, string $externalId): ?Car;
    public function save(Car $car): void;
    public function getAllByPlatform(int $platformId): array;
    public function getPaginated(int $platformId, int $page, int $perPage): array;

    /**
     * Deactivate all cars for a platform that are NOT in the provided list of external IDs.
     * Returns the count of deactivated cars.
     */
    public function deactivateCarsNotInList(int $platformId, array $externalIds): int;
}
```

### 2.4 Exceptions

**`Exceptions/CarNotFoundException.php`**
```php
final class CarNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self("Car with ID {$id} not found");
    }

    public static function withExternalId(string $externalId): self
    {
        return new self("Car with external ID {$externalId} not found");
    }
}
```

**`Exceptions/CarBrandNotFoundException.php`**
```php
final class CarBrandNotFoundException extends DomainNotFoundException
{
    public static function withId(int $id): self
    {
        return new self("Car brand with ID {$id} not found");
    }
}
```

---

## Phase 3: Application Layer

### Location: `app/Application/Platform/`

### 3.1 DTOs

**`DTOs/CarData.php`**
```php
final class CarData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $platform_id,
        public readonly int $car_brand_id,
        public readonly string $brand_name,
        public readonly string $external_id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $car_group,
        public readonly ?int $year,
        public readonly ?string $image_url,
        public readonly bool $is_active,
    ) {}

    public static function fromEntity(Car $car, CarBrand $brand): self
    {
        return new self(
            id: $car->id(),
            platform_id: $car->platformId(),
            car_brand_id: $car->carBrandId(),
            brand_name: $brand->name(),
            external_id: $car->externalId()->value(),
            name: $car->name()->value(),
            slug: $car->slug(),
            car_group: $car->group()->value(),
            year: $car->year()->value(),
            image_url: $car->imageUrl(),
            is_active: $car->isActive(),
        );
    }
}
```

**`DTOs/CarBrandData.php`**
```php
final class CarBrandData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $logo_url,
        public readonly bool $is_active,
    ) {}

    public static function fromEntity(CarBrand $brand): self
    {
        return new self(
            id: $brand->id(),
            name: $brand->name(),
            slug: $brand->slug(),
            logo_url: $brand->logoUrl(),
            is_active: $brand->isActive(),
        );
    }
}
```

**`DTOs/CarImportResultData.php`**
```php
final class CarImportResultData extends Data
{
    public function __construct(
        public readonly int $total_processed,
        public readonly int $created_count,
        public readonly int $updated_count,
        public readonly int $deactivated_count,
        public readonly int $error_count,
        public readonly array $errors,
        public readonly int $brands_created,
    ) {}
}
```

### 3.2 Application Service

**`Services/CarImportService.php`**
```php
final class CarImportService
{
    private const API_URL = 'https://www.kudosprime.com/gt7/MiloAPI.php?export=y';
    private const RATE_LIMIT_SECONDS = 3;

    public function __construct(
        private readonly CarRepositoryInterface $carRepository,
        private readonly CarBrandRepositoryInterface $brandRepository,
        private readonly PlatformRepositoryInterface $platformRepository,
    ) {}

    /**
     * Download Excel file from KudosPrime API.
     */
    public function downloadExcelFile(): string
    {
        // Rate limiting - wait before downloading
        sleep(self::RATE_LIMIT_SECONDS);

        $tempFile = tempnam(sys_get_temp_dir(), 'gt7_cars_');

        // POST request to get Excel file
        $ch = curl_init(self::API_URL);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, 'export_type=cars');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        $content = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || $content === false) {
            throw new RuntimeException('Failed to download car data from KudosPrime');
        }

        file_put_contents($tempFile, $content);
        return $tempFile;
    }

    public function importFromExcel(string $filePath, int $platformId): CarImportResultData
    {
        // Validate platform exists
        $this->platformRepository->findById($platformId);

        $spreadsheet = IOFactory::load($filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        // Remove header row
        $header = array_shift($rows);
        $columnMap = $this->mapColumns($header);

        $created = 0;
        $updated = 0;
        $errors = [];
        $brandsCreated = 0;
        $seenExternalIds = [];

        foreach ($rows as $index => $row) {
            try {
                $result = $this->processRow($row, $columnMap, $platformId);
                $seenExternalIds[] = $result['external_id'];

                if ($result['created']) {
                    $created++;
                } else {
                    $updated++;
                }
                if ($result['brand_created']) {
                    $brandsCreated++;
                }
            } catch (Exception $e) {
                $errors[] = [
                    'row' => $index + 2,
                    'message' => $e->getMessage(),
                ];
            }
        }

        // Deactivate cars not in the import (removed from source)
        $deactivatedCount = $this->carRepository->deactivateCarsNotInList(
            $platformId,
            $seenExternalIds
        );

        return new CarImportResultData(
            total_processed: count($rows),
            created_count: $created,
            updated_count: $updated,
            deactivated_count: $deactivatedCount,
            error_count: count($errors),
            errors: $errors,
            brands_created: $brandsCreated,
        );
    }

    /**
     * Map Excel column headers to indexes.
     * Handles the actual column names from KudosPrime:
     * - "K' iD" -> external ID
     * - "Group" -> car group/category
     * - "Maker" -> brand/manufacturer
     * - "Model" -> car model name
     * - "Year" -> model year
     */
    private function mapColumns(array $header): array
    {
        $map = [];
        foreach ($header as $index => $name) {
            $normalized = strtolower(trim($name ?? ''));
            // Handle special column name "K' iD"
            if (str_contains($normalized, 'id') || $normalized === "k' id") {
                $map['external_id'] = $index;
            } elseif ($normalized === 'group') {
                $map['group'] = $index;
            } elseif ($normalized === 'maker') {
                $map['maker'] = $index;
            } elseif ($normalized === 'model') {
                $map['model'] = $index;
            } elseif ($normalized === 'year') {
                $map['year'] = $index;
            }
        }
        return $map;
    }

    private function processRow(array $row, array $columnMap, int $platformId): array
    {
        $externalId = $row[$columnMap['external_id']] ?? null;
        $group = $row[$columnMap['group']] ?? null;
        $maker = $row[$columnMap['maker']] ?? null;
        $model = $row[$columnMap['model']] ?? null;
        $year = $row[$columnMap['year']] ?? null;

        if (empty($externalId) || empty($model)) {
            throw new InvalidArgumentException('Missing required fields: ID or Model');
        }

        // Find or create brand
        $brandCreated = false;
        $brand = null;
        if (!empty($maker)) {
            $brand = $this->brandRepository->findByName($maker);
            if ($brand === null) {
                $brand = CarBrand::create($maker);
                $this->brandRepository->save($brand);
                $brandCreated = true;
            }
        }

        // Find or create car
        $existingCar = $this->carRepository->findByExternalId($platformId, (string) $externalId);

        if ($existingCar !== null) {
            // Update existing car and ensure it's active
            $existingCar->update(
                carBrandId: $brand?->id() ?? 0,
                name: CarName::from($model),
                group: CarGroup::from($group),
                year: CarYear::from($year),
            );
            $existingCar->activate(); // Reactivate if previously deactivated
            $this->carRepository->save($existingCar);

            return [
                'created' => false,
                'brand_created' => $brandCreated,
                'external_id' => (string) $externalId,
            ];
        }

        // Create new car
        $car = Car::create(
            platformId: $platformId,
            carBrandId: $brand?->id() ?? 0,
            externalId: ExternalId::from((string) $externalId),
            name: CarName::from($model),
            group: CarGroup::from($group),
            year: CarYear::from($year),
        );
        $this->carRepository->save($car);

        return [
            'created' => true,
            'brand_created' => $brandCreated,
            'external_id' => (string) $externalId,
        ];
    }
}
```

---

## Phase 4: Infrastructure Layer

### Location: `app/Infrastructure/Persistence/Eloquent/`

### 4.1 Eloquent Models

**`Models/CarBrand.php`**
```php
final class CarBrand extends Model
{
    protected $table = 'car_brands';

    protected $fillable = [
        'name',
        'slug',
        'logo_url',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function cars(): HasMany
    {
        return $this->hasMany(PlatformCar::class, 'car_brand_id');
    }
}
```

**`Models/PlatformCar.php`**
```php
final class PlatformCar extends Model
{
    protected $table = 'platform_cars';

    protected $fillable = [
        'platform_id',
        'car_brand_id',
        'external_id',
        'name',
        'slug',
        'car_group',
        'year',
        'image_url',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'platform_id' => 'integer',
        'car_brand_id' => 'integer',
        'year' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(CarBrand::class, 'car_brand_id');
    }
}
```

### 4.2 Repository Implementations

**`Repositories/EloquentCarBrandRepository.php`**
```php
final class EloquentCarBrandRepository implements CarBrandRepositoryInterface
{
    public function findById(int $id): CarBrandEntity
    {
        $eloquent = CarBrandModel::find($id);
        if ($eloquent === null) {
            throw CarBrandNotFoundException::withId($id);
        }
        return $this->mapToEntity($eloquent);
    }

    public function findByName(string $name): ?CarBrandEntity
    {
        $eloquent = CarBrandModel::where('name', $name)->first();
        return $eloquent ? $this->mapToEntity($eloquent) : null;
    }

    public function findOrCreateByName(string $name): CarBrandEntity
    {
        $existing = $this->findByName($name);
        if ($existing !== null) {
            return $existing;
        }

        $brand = CarBrandEntity::create($name);
        $this->save($brand);
        return $brand;
    }

    public function save(CarBrandEntity $brand): void
    {
        $eloquent = $brand->id() !== null
            ? CarBrandModel::findOrNew($brand->id())
            : new CarBrandModel();

        $eloquent->name = $brand->name();
        $eloquent->slug = $brand->slug();
        $eloquent->logo_url = $brand->logoUrl();
        $eloquent->is_active = $brand->isActive();
        $eloquent->sort_order = $brand->sortOrder();
        $eloquent->save();

        if ($brand->id() === null) {
            $brand->setId($eloquent->id);
        }
    }

    public function getAllActive(): array
    {
        return CarBrandModel::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($e) => $this->mapToEntity($e))
            ->all();
    }

    private function mapToEntity(CarBrandModel $eloquent): CarBrandEntity
    {
        return CarBrandEntity::reconstitute(
            id: $eloquent->id,
            name: $eloquent->name,
            slug: $eloquent->slug,
            logoUrl: $eloquent->logo_url,
            isActive: $eloquent->is_active,
            sortOrder: $eloquent->sort_order,
        );
    }
}
```

**`Repositories/EloquentCarRepository.php`**
```php
final class EloquentCarRepository implements CarRepositoryInterface
{
    public function findById(int $id): CarEntity
    {
        $eloquent = PlatformCarModel::find($id);
        if ($eloquent === null) {
            throw CarNotFoundException::withId($id);
        }
        return $this->mapToEntity($eloquent);
    }

    public function findByExternalId(int $platformId, string $externalId): ?CarEntity
    {
        $eloquent = PlatformCarModel::where('platform_id', $platformId)
            ->where('external_id', $externalId)
            ->first();
        return $eloquent ? $this->mapToEntity($eloquent) : null;
    }

    public function save(CarEntity $car): void
    {
        $eloquent = $car->id() !== null
            ? PlatformCarModel::findOrNew($car->id())
            : new PlatformCarModel();

        $eloquent->platform_id = $car->platformId();
        $eloquent->car_brand_id = $car->carBrandId();
        $eloquent->external_id = $car->externalId()->value();
        $eloquent->name = $car->name()->value();
        $eloquent->slug = $car->slug();
        $eloquent->car_group = $car->group()->value();
        $eloquent->year = $car->year()->value();
        $eloquent->image_url = $car->imageUrl();
        $eloquent->is_active = $car->isActive();
        $eloquent->sort_order = $car->sortOrder();
        $eloquent->save();

        if ($car->id() === null) {
            $car->setId($eloquent->id);
        }
    }

    public function getAllByPlatform(int $platformId): array
    {
        return PlatformCarModel::with('brand')
            ->where('platform_id', $platformId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($e) => $this->mapToEntity($e))
            ->all();
    }

    public function getPaginated(int $platformId, int $page, int $perPage): array
    {
        $query = PlatformCarModel::with('brand')
            ->where('platform_id', $platformId)
            ->orderBy('name');

        $total = $query->count();
        $results = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return [
            'data' => $results->map(fn ($e) => $this->mapToEntity($e))->all(),
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => (int) ceil($total / $perPage),
        ];
    }

    /**
     * Deactivate all cars for a platform that are NOT in the provided list of external IDs.
     */
    public function deactivateCarsNotInList(int $platformId, array $externalIds): int
    {
        return PlatformCarModel::where('platform_id', $platformId)
            ->where('is_active', true)
            ->whereNotIn('external_id', $externalIds)
            ->update(['is_active' => false]);
    }

    private function mapToEntity(PlatformCarModel $eloquent): CarEntity
    {
        return CarEntity::reconstitute(
            id: $eloquent->id,
            platformId: $eloquent->platform_id,
            carBrandId: $eloquent->car_brand_id,
            externalId: ExternalId::from($eloquent->external_id),
            name: CarName::from($eloquent->name),
            slug: $eloquent->slug,
            group: CarGroup::from($eloquent->car_group),
            year: CarYear::from($eloquent->year),
            imageUrl: $eloquent->image_url,
            isActive: $eloquent->is_active,
            sortOrder: $eloquent->sort_order,
        );
    }
}
```

---

## Phase 5: Console Command

### Location: `app/Console/Commands/ImportGT7CarsCommand.php`

```php
final class ImportGT7CarsCommand extends Command
{
    protected $signature = 'app:import-gt7-cars
                            {--platform= : Platform ID (defaults to GT7)}';

    protected $description = 'Import GT7 cars from KudosPrime Excel file';

    private const GT7_PLATFORM_SLUG = 'gran-turismo-7';

    public function handle(
        CarImportService $importService,
        PlatformRepositoryInterface $platformRepository,
    ): int {
        $this->info('Starting GT7 car import...');

        try {
            // Determine platform
            $platformId = $this->option('platform');
            if ($platformId === null) {
                // Find GT7 platform by slug
                $platforms = $platformRepository->getAllActive();
                $gt7 = collect($platforms)->firstWhere('slug', self::GT7_PLATFORM_SLUG);
                if ($gt7 === null) {
                    $this->error('GT7 platform not found. Please create it first or specify --platform=ID');
                    return Command::FAILURE;
                }
                $platformId = $gt7['id'];
            }

            // Download Excel file (includes rate limiting)
            $this->info('Downloading car data from KudosPrime...');
            $tempFile = $importService->downloadExcelFile();
            $this->info('Download complete. Processing...');

            // Run import
            $result = $importService->importFromExcel($tempFile, (int) $platformId);

            // Cleanup
            unlink($tempFile);

            // Report results
            $this->info("Import complete!");
            $this->info("Total processed: {$result->total_processed}");
            $this->info("Created: {$result->created_count}");
            $this->info("Updated: {$result->updated_count}");
            $this->info("Deactivated: {$result->deactivated_count}");
            $this->info("Brands created: {$result->brands_created}");

            if ($result->error_count > 0) {
                $this->warn("Errors: {$result->error_count}");
                foreach ($result->errors as $error) {
                    $this->error("Row {$error['row']}: {$error['message']}");
                }
            }

            return Command::SUCCESS;
        } catch (Exception $e) {
            $this->error('Import failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
```

---

## Phase 6: Scheduling

### Add to `routes/console.php`

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('app:import-gt7-cars')
    ->monthlyOn(1, '03:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->emailOutputTo(config('mail.admin_email'));  // Always send email summary
```

**Note**: The `emailOutputTo()` method sends an email with the command output after every run, providing a summary of created, updated, deactivated counts, and any errors.

---

## Phase 7: Admin API Endpoints

### Controller: `app/Http/Controllers/Admin/CarController.php`

```php
final class CarController extends Controller
{
    public function __construct(
        private readonly CarImportService $importService,
        private readonly CarRepositoryInterface $carRepository,
        private readonly CarBrandRepositoryInterface $brandRepository,
    ) {}

    public function index(Request $request, int $platformId): JsonResponse
    {
        $page = (int) $request->get('page', 1);
        $perPage = (int) $request->get('per_page', 50);

        $result = $this->carRepository->getPaginated($platformId, $page, $perPage);

        return ApiResponse::paginated($result['data'], [
            'total' => $result['total'],
            'per_page' => $result['per_page'],
            'current_page' => $result['current_page'],
            'last_page' => $result['last_page'],
        ]);
    }

    public function triggerImport(int $platformId): JsonResponse
    {
        try {
            Artisan::call('app:import-gt7-cars', [
                '--platform' => $platformId,
            ]);

            return ApiResponse::success(['message' => 'Import started successfully']);
        } catch (Exception $e) {
            return ApiResponse::error('Import failed: ' . $e->getMessage());
        }
    }

    public function brands(): JsonResponse
    {
        $brands = $this->brandRepository->getAllActive();
        return ApiResponse::success($brands);
    }
}
```

### Routes: `routes/subdomain.php` (admin section)

```php
Route::prefix('admin/api/platforms/{platformId}/cars')->group(function () {
    Route::get('/', [CarController::class, 'index']);
    Route::post('/import', [CarController::class, 'triggerImport']);
});

Route::get('admin/api/car-brands', [CarController::class, 'brands']);
```

---

## Phase 8: Service Provider Bindings

### Add to `app/Providers/AppServiceProvider.php`

```php
$this->app->bind(
    CarRepositoryInterface::class,
    EloquentCarRepository::class
);

$this->app->bind(
    CarBrandRepositoryInterface::class,
    EloquentCarBrandRepository::class
);
```

---

## Dependencies

### Install PhpSpreadsheet

```bash
composer require phpoffice/phpspreadsheet
```

---

## Testing Plan

### Unit Tests (Domain Layer)
- `CarNameTest` - Validation of car names
- `CarGroupTest` - Validation of car groups
- `ExternalIdTest` - Validation of external IDs
- `CarEntityTest` - Entity creation and updates
- `CarBrandEntityTest` - Brand entity creation

### Feature Tests (Application Layer)
- `CarImportServiceTest` - Import with mock spreadsheet
- `CarControllerTest` - API endpoint tests

### Integration Tests
- `ImportGT7CarsCommandTest` - Full command execution with test file

---

## File Checklist

```
[ ] database/migrations/XXXX_create_car_brands_table.php
[ ] database/migrations/XXXX_create_platform_cars_table.php
[ ] app/Domain/Platform/ValueObjects/CarName.php
[ ] app/Domain/Platform/ValueObjects/CarGroup.php
[ ] app/Domain/Platform/ValueObjects/CarYear.php
[ ] app/Domain/Platform/ValueObjects/ExternalId.php
[ ] app/Domain/Platform/Entities/Car.php
[ ] app/Domain/Platform/Entities/CarBrand.php
[ ] app/Domain/Platform/Repositories/CarRepositoryInterface.php
[ ] app/Domain/Platform/Repositories/CarBrandRepositoryInterface.php
[ ] app/Domain/Platform/Exceptions/CarNotFoundException.php
[ ] app/Domain/Platform/Exceptions/CarBrandNotFoundException.php
[ ] app/Application/Platform/DTOs/CarData.php
[ ] app/Application/Platform/DTOs/CarBrandData.php
[ ] app/Application/Platform/DTOs/CarImportResultData.php
[ ] app/Application/Platform/Services/CarImportService.php
[ ] app/Infrastructure/Persistence/Eloquent/Models/CarBrand.php
[ ] app/Infrastructure/Persistence/Eloquent/Models/PlatformCar.php
[ ] app/Infrastructure/Persistence/Eloquent/Repositories/EloquentCarBrandRepository.php
[ ] app/Infrastructure/Persistence/Eloquent/Repositories/EloquentCarRepository.php
[ ] app/Console/Commands/ImportGT7CarsCommand.php
[ ] app/Http/Controllers/Admin/CarController.php
[ ] Update routes/subdomain.php
[ ] Update routes/console.php (scheduling)
[ ] Update app/Providers/AppServiceProvider.php (bindings)
```
