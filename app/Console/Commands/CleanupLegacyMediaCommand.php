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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CleanupLegacyMediaCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:cleanup-legacy
                            {--model= : Specific model to cleanup (league, competition, season, team, division, siteconfig)}
                            {--dry-run : Show what would be cleaned without actually cleaning}
                            {--force : Skip confirmation prompts}
                            {--delete-files : Also delete physical files from storage}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cleanup legacy file paths from database after successful migration to Media Library';

    /**
     * Cleanup statistics.
     */
    private int $totalCleaned = 0;
    private int $totalSkipped = 0;
    private int $totalFilesDeleted = 0;

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $model = $this->option('model');
        $dryRun = (bool) $this->option('dry-run');
        $deleteFiles = (bool) $this->option('delete-files');

        if ($dryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        if (!$this->option('force') && !$dryRun) {
            $this->warn('WARNING: This command will remove legacy file path data from the database.');

            if ($deleteFiles) {
                $this->warn('--delete-files is enabled: Physical files will also be DELETED!');
            }

            $this->newLine();

            if (!$this->confirm('Have you verified all media was migrated successfully?')) {
                $this->info('Cleanup cancelled.');
                return Command::FAILURE;
            }

            if (!$this->confirm('Are you absolutely sure you want to continue?')) {
                $this->info('Cleanup cancelled.');
                return Command::FAILURE;
            }
        }

        $modelsList = $model ? [$model] : ['league', 'competition', 'season', 'team', 'division', 'siteconfig'];

        foreach ($modelsList as $modelType) {
            $this->cleanupModel($modelType, $dryRun, $deleteFiles);
        }

        $this->newLine();
        $this->info('Cleanup Summary:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Records Cleaned', $this->totalCleaned],
                ['Records Skipped', $this->totalSkipped],
                ['Files Deleted', $this->totalFilesDeleted],
            ]
        );

        $this->info('Cleanup complete!');
        return Command::SUCCESS;
    }

    /**
     * Cleanup a specific model type.
     */
    private function cleanupModel(string $modelType, bool $dryRun, bool $deleteFiles): void
    {
        $this->info("\nCleaning {$modelType}...");

        switch ($modelType) {
            case 'league':
                $this->cleanupLeagues($dryRun, $deleteFiles);
                break;
            case 'competition':
                $this->cleanupCompetitions($dryRun, $deleteFiles);
                break;
            case 'season':
                $this->cleanupSeasons($dryRun, $deleteFiles);
                break;
            case 'team':
                $this->cleanupTeams($dryRun, $deleteFiles);
                break;
            case 'division':
                $this->cleanupDivisions($dryRun, $deleteFiles);
                break;
            case 'siteconfig':
                $this->cleanupSiteConfigs($dryRun, $deleteFiles);
                break;
            default:
                $this->error("Unknown model type: {$modelType}");
        }
    }

    /**
     * Cleanup League legacy paths.
     */
    private function cleanupLeagues(bool $dryRun, bool $deleteFiles): void
    {
        $leagues = League::query()
            ->where(function ($query) {
                $query->whereNotNull('logo_path')
                    ->orWhereNotNull('header_image_path')
                    ->orWhereNotNull('banner_path');
            })
            ->get();

        if ($leagues->isEmpty()) {
            $this->info('  No leagues with legacy paths found.');
            return;
        }

        $bar = $this->output->createProgressBar($leagues->count());
        $bar->start();

        /** @var League $league */
        foreach ($leagues as $league) {
            $shouldClean = true;

            // Only clean if media exists in new system
            if ($league->logo_path && !$league->hasMedia('logo')) {
                $shouldClean = false;
            }
            if ($league->header_image_path && !$league->hasMedia('header_image')) {
                $shouldClean = false;
            }
            if ($league->banner_path && !$league->hasMedia('banner')) {
                $shouldClean = false;
            }

            if (!$shouldClean) {
                $this->totalSkipped++;
                $bar->advance();
                continue;
            }

            if ($dryRun) {
                $this->line("\n  Would clean league #{$league->id}: {$league->name}");
                $this->totalCleaned++;
            } else {
                // Delete files if requested
                if ($deleteFiles) {
                    $this->deleteFileIfExists($league->logo_path);
                    $this->deleteFileIfExists($league->header_image_path);
                    $this->deleteFileIfExists($league->banner_path);
                }

                // Clear legacy paths
                $league->update([
                    'logo_path' => null,
                    'header_image_path' => null,
                    'banner_path' => null,
                ]);

                $this->totalCleaned++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Cleanup Competition legacy paths.
     */
    private function cleanupCompetitions(bool $dryRun, bool $deleteFiles): void
    {
        $competitions = Competition::query()
            ->whereNotNull('logo_path')
            ->get();

        if ($competitions->isEmpty()) {
            $this->info('  No competitions with legacy paths found.');
            return;
        }

        $bar = $this->output->createProgressBar($competitions->count());
        $bar->start();

        /** @var Competition $competition */
        foreach ($competitions as $competition) {
            if (!$competition->hasMedia('logo')) {
                $this->totalSkipped++;
                $bar->advance();
                continue;
            }

            if ($dryRun) {
                $this->line("\n  Would clean competition #{$competition->id}: {$competition->name}");
                $this->totalCleaned++;
            } else {
                if ($deleteFiles) {
                    $this->deleteFileIfExists($competition->logo_path);
                }

                $competition->update(['logo_path' => null]);
                $this->totalCleaned++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Cleanup Season legacy paths.
     */
    private function cleanupSeasons(bool $dryRun, bool $deleteFiles): void
    {
        $seasons = SeasonEloquent::query()
            ->where(function ($query) {
                $query->whereNotNull('logo_path')
                    ->orWhereNotNull('banner_path');
            })
            ->get();

        if ($seasons->isEmpty()) {
            $this->info('  No seasons with legacy paths found.');
            return;
        }

        $bar = $this->output->createProgressBar($seasons->count());
        $bar->start();

        /** @var SeasonEloquent $season */
        foreach ($seasons as $season) {
            $shouldClean = true;

            if ($season->logo_path && !$season->hasMedia('logo')) {
                $shouldClean = false;
            }
            if ($season->banner_path && !$season->hasMedia('banner')) {
                $shouldClean = false;
            }

            if (!$shouldClean) {
                $this->totalSkipped++;
                $bar->advance();
                continue;
            }

            if ($dryRun) {
                $this->line("\n  Would clean season #{$season->id}: {$season->name}");
                $this->totalCleaned++;
            } else {
                if ($deleteFiles) {
                    $this->deleteFileIfExists($season->logo_path);
                    $this->deleteFileIfExists($season->banner_path);
                }

                $season->update([
                    'logo_path' => null,
                    'banner_path' => null,
                ]);

                $this->totalCleaned++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Cleanup Team legacy paths.
     */
    private function cleanupTeams(bool $dryRun, bool $deleteFiles): void
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Team> $teams */
        $teams = Team::whereNotNull('logo_url')->get();

        if ($teams->isEmpty()) {
            $this->info('  No teams with legacy paths found.');
            return;
        }

        $bar = $this->output->createProgressBar($teams->count());
        $bar->start();

        /** @var Team $team */
        foreach ($teams as $team) {
            if (!$team->hasMedia('logo')) {
                $this->totalSkipped++;
                $bar->advance();
                continue;
            }

            if ($dryRun) {
                $this->line("\n  Would clean team #{$team->id}: {$team->name}");
                $this->totalCleaned++;
            } else {
                if ($deleteFiles) {
                    $this->deleteFileIfExists($team->logo_url);
                }

                $team->update(['logo_url' => null]);
                $this->totalCleaned++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Cleanup Division legacy paths.
     */
    private function cleanupDivisions(bool $dryRun, bool $deleteFiles): void
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Division> $divisions */
        $divisions = Division::whereNotNull('logo_url')->get();

        if ($divisions->isEmpty()) {
            $this->info('  No divisions with legacy paths found.');
            return;
        }

        $bar = $this->output->createProgressBar($divisions->count());
        $bar->start();

        /** @var Division $division */
        foreach ($divisions as $division) {
            if (!$division->hasMedia('logo')) {
                $this->totalSkipped++;
                $bar->advance();
                continue;
            }

            if ($dryRun) {
                $this->line("\n  Would clean division #{$division->id}: {$division->name}");
                $this->totalCleaned++;
            } else {
                if ($deleteFiles) {
                    $this->deleteFileIfExists($division->logo_url);
                }

                $division->update(['logo_url' => null]);
                $this->totalCleaned++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Cleanup SiteConfig files.
     */
    private function cleanupSiteConfigs(bool $dryRun, bool $deleteFiles): void
    {
        $files = SiteConfigFileModel::with('siteConfig')->get();

        if ($files->isEmpty()) {
            $this->info('  No site configuration files found.');
            return;
        }

        $bar = $this->output->createProgressBar($files->count());
        $bar->start();

        foreach ($files as $file) {
            $collection = $this->mapFileTypeToCollection($file->file_type);

            if (!$collection || !$file->siteConfig->hasMedia($collection)) {
                $this->totalSkipped++;
                $bar->advance();
                continue;
            }

            if ($dryRun) {
                $this->line("\n  Would delete file #{$file->id}: {$file->file_path}");
                $this->totalCleaned++;
            } else {
                if ($deleteFiles) {
                    $disk = Storage::disk($file->storage_disk ?? 'public');
                    if ($disk->exists($file->file_path)) {
                        $disk->delete($file->file_path);
                        $this->totalFilesDeleted++;
                    }
                }

                $file->delete();
                $this->totalCleaned++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Map file type to collection name.
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
     * Delete a file from storage if it exists.
     */
    private function deleteFileIfExists(?string $path): void
    {
        if (!$path) {
            return;
        }

        $disk = Storage::disk('public');
        if ($disk->exists($path)) {
            $disk->delete($path);
            $this->totalFilesDeleted++;
        }
    }
}
