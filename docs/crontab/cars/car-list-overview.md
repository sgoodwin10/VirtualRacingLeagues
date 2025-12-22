# Car List Import Feature - Overview

## Feature Summary

This feature creates an automated system to download and import the Gran Turismo 7 (GT7) car database from [KudosPrime](https://www.kudosprime.com/gt7/listmaker.php) into the application. The system will:

1. **Download** an Excel spreadsheet containing all GT7 cars from the external source
2. **Parse** the Excel file to extract car data
3. **Upsert** (update or insert) cars and manufacturers into the database
4. **Schedule** this process to run monthly OR allow manual triggering

## Data Source

**API Endpoint**:
```
POST https://www.kudosprime.com/gt7/MiloAPI.php?export=y
Body: export_type=cars
Response: Excel file (xlsx)
```

**Excel File Contains (5 columns)**:
| Column | Description | Example |
|--------|-------------|---------|
| K' iD | KudosPrime internal car ID | 123 |
| Group | Car category/class | Gr.1, Gr.2, Gr.3, Gr.4, Gr.B, No Gr, Roadster |
| Maker | Brand/manufacturer name | Ferrari, Porsche, Toyota, Mercedes-AMG |
| Model | Car model name | 488 GT3 '13, 911 RSR (991) '17, GR Supra RZ '19 |
| Year | Model year | 2019, 1971, etc. |

## Database Schema (New Tables)

### 1. `car_brands` Table
Stores manufacturer/brand information.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | varchar(100) | Brand name (e.g., "Ferrari") |
| slug | varchar(120) | URL-friendly name |
| logo_url | varchar(255) | Optional brand logo |
| is_active | boolean | Active status |
| sort_order | integer | Display order |
| created_at | timestamp | |
| updated_at | timestamp | |

### 2. `platform_cars` Table
Stores individual cars linked to a platform (GT7).

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| platform_id | bigint FK | Reference to platforms table (GT7) |
| car_brand_id | bigint FK | Reference to car_brands table |
| external_id | varchar(50) | KudosPrime car ID (K' iD) |
| name | varchar(255) | Full car name (Model) |
| slug | varchar(255) | URL-friendly name |
| car_group | varchar(50) | Car category (Gr.3, Gr.4, etc.) |
| year | integer | Model year (nullable) |
| image_url | varchar(255) | Optional car image (empty initially) |
| is_active | boolean | Active status (false if removed from source) |
| sort_order | integer | Display order |
| created_at | timestamp | |
| updated_at | timestamp | |

**Key Indexes**:
- `platform_cars_external_id_unique` on (platform_id, external_id)
- `platform_cars_slug_unique` on (platform_id, slug)
- `car_brands_name_unique` on (name)

## Execution Methods

### 1. Scheduled (Cron)
- Runs automatically on the **1st of each month at 3:00 AM**
- Configured in Laravel's scheduler (routes/console.php or dedicated schedule file)
- Uses `withoutOverlapping()` to prevent duplicate runs

### 2. Manual Trigger
- Artisan command: `php artisan app:import-gt7-cars`
- Admin API endpoint: `POST /admin/api/platform-cars/import`
- Provides real-time progress output

## Import Logic

```
1. Wait 2-3 seconds (rate limiting - be respectful to source server)
2. POST to KudosPrime API to download Excel file
3. Parse Excel using PhpSpreadsheet library
4. Track all external IDs seen during import
5. For each row:
   a. Find or create CarBrand by Maker name
   b. Find existing PlatformCar by external_id (K' iD)
   c. If exists: Update name, group, year, brand
   d. If not exists: Create new PlatformCar
6. Mark cars NOT seen in import as inactive (is_active = false)
7. Log results (created, updated, deactivated, errors)
8. Send email notification to admin with summary
```

## Architecture Integration

Following the project's **DDD Architecture**:

```
app/
├── Domain/
│   └── Platform/
│       ├── Entities/
│       │   ├── Car.php              # Car entity
│       │   └── CarBrand.php         # Brand entity
│       ├── ValueObjects/
│       │   ├── CarName.php
│       │   ├── CarGroup.php
│       │   ├── CarYear.php
│       │   └── ExternalId.php
│       ├── Repositories/
│       │   ├── CarRepositoryInterface.php
│       │   └── CarBrandRepositoryInterface.php
│       └── Exceptions/
│           ├── CarNotFoundException.php
│           └── CarBrandNotFoundException.php
├── Application/
│   └── Platform/
│       ├── Services/
│       │   └── CarImportService.php  # Orchestrates import
│       └── DTOs/
│           ├── CarData.php
│           ├── CarBrandData.php
│           └── ImportResultData.php
├── Infrastructure/
│   └── Persistence/Eloquent/
│       ├── Models/
│       │   ├── PlatformCar.php
│       │   └── CarBrand.php
│       └── Repositories/
│           ├── EloquentCarRepository.php
│           └── EloquentCarBrandRepository.php
└── Console/
    └── Commands/
        └── ImportGT7CarsCommand.php  # Artisan command
```

## Dependencies

**New Composer Package Required**:
- `phpoffice/phpspreadsheet` - For Excel file parsing

## Success Criteria

1. Command runs without errors
2. All cars from the Excel file are imported/updated
3. Duplicate manufacturers are properly deduplicated
4. Import logs are generated
5. Admin can trigger manual import via API
6. Monthly schedule runs automatically

## Agents for Implementation

| Component | Agent | Purpose |
|-----------|-------|---------|
| Database migrations | `dev-be` | Create car_brands and platform_cars tables |
| Domain layer | `dev-be` | Entities, Value Objects, Repository interfaces |
| Application layer | `dev-be` | CarImportService, DTOs |
| Infrastructure layer | `dev-be` | Eloquent models, Repository implementations |
| Console command | `dev-be` | ImportGT7CarsCommand |
| Admin API endpoint | `dev-be` | Controller for manual trigger |
| Admin UI | `dev-fe-admin` | Import trigger button, car list display |

## Decisions Made

| Question | Decision |
|----------|----------|
| **Platform ID** | GT7 platform must already exist in database. Import will fail with clear error if not found. |
| **Image URLs** | Leave `image_url` empty. Can be added manually later if needed. |
| **Removed Cars** | Mark as inactive (`is_active = false`). Preserves data but removes from active lists. |
| **Notifications** | Email summary after every import (created, updated, deactivated, errors). |
| **Rate Limiting** | Add 2-3 second delay before downloading to be respectful of source server. |
