<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigFileModel;
use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel;
use App\Infrastructure\Persistence\Eloquent\Models\Team;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateLegacyMediaCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:migrate-legacy
                            {--model= : Specific model to migrate (league, competition, season, team, division, siteconfig)}
                            {--dry-run : Show what would be migrated without actually migrating}
                            {--force : Skip confirmation prompts}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate legacy file path images to Spatie Media Library';

    /**
     * Migration statistics.
     */
    private int $totalMigrated = 0;

    private int $totalSkipped = 0;

    private int $totalFailed = 0;

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $model = $this->option('model');
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        if (! $this->option('force') && ! $dryRun) {
            if (! $this->confirm('This will migrate legacy images to Media Library. Continue?')) {
                $this->info('Migration cancelled.');

                return Command::SUCCESS;
            }
        }

        $modelsList = $model ? [$model] : ['league', 'competition', 'season', 'team', 'division', 'siteconfig'];

        foreach ($modelsList as $modelType) {
            $this->migrateModel($modelType, $dryRun);
        }

        $this->newLine();
        $this->info('Migration Summary:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Migrated', $this->totalMigrated],
                ['Skipped', $this->totalSkipped],
                ['Failed', $this->totalFailed],
            ]
        );

        $this->info('Migration complete!');

        return Command::SUCCESS;
    }

    /**
     * Migrate a specific model type.
     */
    private function migrateModel(string $modelType, bool $dryRun): void
    {
        $this->info("\nMigrating {$modelType}...");

        switch ($modelType) {
            case 'league':
                $this->migrateLeagues($dryRun);
                break;
            case 'competition':
                $this->migrateCompetitions($dryRun);
                break;
            case 'season':
                $this->migrateSeasons($dryRun);
                break;
            case 'team':
                $this->migrateTeams($dryRun);
                break;
            case 'division':
                $this->migrateDivisions($dryRun);
                break;
            case 'siteconfig':
                $this->migrateSiteConfigs($dryRun);
                break;
            default:
                $this->error("Unknown model type: {$modelType}");
        }
    }

    /**
     * Migrate League images.
     */
    private function migrateLeagues(bool $dryRun): void
    {
        $leagues = League::query()
            ->where(function ($query) {
                $query->whereNotNull('logo_path')
                    ->orWhereNotNull('header_image_path')
                    ->orWhereNotNull('banner_path');
            })
            ->get();

        if ($leagues->isEmpty()) {
            $this->warn('  No leagues with legacy media found.');

            return;
        }

        $bar = $this->output->createProgressBar($leagues->count());
        $bar->start();

        foreach ($leagues as $league) {
            // Migrate logo
            if ($league->logo_path && ! $league->hasMedia('logo')) {
                $this->migrateFile($league, 'logo', $league->logo_path, $dryRun);
            } else {
                $this->totalSkipped++;
            }

            // Migrate header_image
            if ($league->header_image_path && ! $league->hasMedia('header_image')) {
                $this->migrateFile($league, 'header_image', $league->header_image_path, $dryRun);
            }

            // Migrate banner
            if ($league->banner_path && ! $league->hasMedia('banner')) {
                $this->migrateFile($league, 'banner', $league->banner_path, $dryRun);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Migrate Competition images.
     */
    private function migrateCompetitions(bool $dryRun): void
    {
        $competitions = Competition::query()
            ->whereNotNull('logo_path')
            ->get();

        if ($competitions->isEmpty()) {
            $this->warn('  No competitions with legacy media found.');

            return;
        }

        $bar = $this->output->createProgressBar($competitions->count());
        $bar->start();

        /** @var Competition $competition */
        foreach ($competitions as $competition) {
            if ($competition->logo_path && ! $competition->hasMedia('logo')) {
                $this->migrateFile($competition, 'logo', $competition->logo_path, $dryRun);
            } else {
                $this->totalSkipped++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Migrate Season images.
     */
    private function migrateSeasons(bool $dryRun): void
    {
        $seasons = SeasonEloquent::query()
            ->where(function ($query) {
                $query->whereNotNull('logo_path')
                    ->orWhereNotNull('banner_path');
            })
            ->get();

        if ($seasons->isEmpty()) {
            $this->warn('  No seasons with legacy media found.');

            return;
        }

        $bar = $this->output->createProgressBar($seasons->count());
        $bar->start();

        foreach ($seasons as $season) {
            // Migrate logo
            if ($season->logo_path && ! $season->hasMedia('logo')) {
                $this->migrateFile($season, 'logo', $season->logo_path, $dryRun);
            } else {
                $this->totalSkipped++;
            }

            // Migrate banner
            if ($season->banner_path && ! $season->hasMedia('banner')) {
                $this->migrateFile($season, 'banner', $season->banner_path, $dryRun);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Migrate Team images.
     */
    private function migrateTeams(bool $dryRun): void
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Team> $teams */
        $teams = Team::whereNotNull('logo_url')->get();

        if ($teams->isEmpty()) {
            $this->warn('  No teams with legacy media found.');

            return;
        }

        $bar = $this->output->createProgressBar($teams->count());
        $bar->start();

        foreach ($teams as $team) {
            if ($team->logo_url && ! $team->hasMedia('logo')) {
                $this->migrateFile($team, 'logo', $team->logo_url, $dryRun);
            } else {
                $this->totalSkipped++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Migrate Division images.
     */
    private function migrateDivisions(bool $dryRun): void
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Division> $divisions */
        $divisions = Division::whereNotNull('logo_url')->get();

        if ($divisions->isEmpty()) {
            $this->warn('  No divisions with legacy media found.');

            return;
        }

        $bar = $this->output->createProgressBar($divisions->count());
        $bar->start();

        foreach ($divisions as $division) {
            if ($division->logo_url && ! $division->hasMedia('logo')) {
                $this->migrateFile($division, 'logo', $division->logo_url, $dryRun);
            } else {
                $this->totalSkipped++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Migrate SiteConfig images from site_config_files table.
     */
    private function migrateSiteConfigs(bool $dryRun): void
    {
        $siteConfigs = SiteConfigModel::with('files')->get();

        if ($siteConfigs->isEmpty()) {
            $this->warn('  No site configurations found.');

            return;
        }

        $totalFiles = $siteConfigs->sum(function ($config) {
            return $config->files->count();
        });

        if ($totalFiles === 0) {
            $this->warn('  No site configuration files found.');

            return;
        }

        $bar = $this->output->createProgressBar($totalFiles);
        $bar->start();

        /** @var SiteConfigModel $siteConfig */
        foreach ($siteConfigs as $siteConfig) {
            /** @var SiteConfigFileModel $file */
            foreach ($siteConfig->files as $file) {
                $collection = $this->mapFileTypeToCollection($file->file_type);

                if (! $collection) {
                    $this->warn("\n  Unknown file type: {$file->file_type}, skipping.");
                    $this->totalSkipped++;
                    $bar->advance();

                    continue;
                }

                if (! $siteConfig->hasMedia($collection)) {
                    $this->migrateFileFromConfigFile($siteConfig, $collection, $file, $dryRun);
                } else {
                    $this->totalSkipped++;
                }

                $bar->advance();
            }
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Map SiteConfigFileModel file_type to media collection name.
     */
    private function mapFileTypeToCollection(string $fileType): ?string
    {
        return match ($fileType) {
            'logo' => 'logo',
            'favicon' => 'favicon',
            'og_image' => 'og_image',
            default => null,
        };
    }

    /**
     * Migrate a file from SiteConfigFileModel to Media Library.
     */
    private function migrateFileFromConfigFile(
        SiteConfigModel $model,
        string $collection,
        SiteConfigFileModel $file,
        bool $dryRun
    ): void {
        $disk = Storage::disk($file->storage_disk ?? 'public');

        if (! $disk->exists($file->file_path)) {
            $this->warn("\n  File not found: {$file->file_path}");
            $this->totalFailed++;

            return;
        }

        if ($dryRun) {
            $this->line("\n  Would migrate: {$file->file_path} -> {$collection}");
            $this->totalMigrated++;

            return;
        }

        try {
            $fullPath = $disk->path($file->file_path);
            $model->addMedia($fullPath)
                ->preservingOriginal()
                ->toMediaCollection($collection);
            $this->totalMigrated++;
        } catch (\Exception $e) {
            $this->error("\n  Failed to migrate {$file->file_path}: " . $e->getMessage());
            $this->totalFailed++;
        }
    }

    /**
     * Migrate a file to Media Library.
     *
     * @param  \Spatie\MediaLibrary\HasMedia  $model
     */
    private function migrateFile($model, string $collection, string $path, bool $dryRun): void
    {
        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            $this->warn("\n  File not found: {$path}");
            $this->totalFailed++;

            return;
        }

        if ($dryRun) {
            $this->line("\n  Would migrate: {$path} -> {$collection}");
            $this->totalMigrated++;

            return;
        }

        try {
            $fullPath = $disk->path($path);
            $model->addMedia($fullPath)
                ->preservingOriginal()
                ->toMediaCollection($collection);
            $this->totalMigrated++;
        } catch (\Exception $e) {
            $this->error("\n  Failed to migrate {$path}: " . $e->getMessage());
            $this->totalFailed++;
        }
    }
}
