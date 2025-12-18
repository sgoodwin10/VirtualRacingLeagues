<?php

declare(strict_types=1);

namespace Tests\Feature\Console\Commands;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigFileModel;
use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel;
use App\Infrastructure\Persistence\Eloquent\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CleanupLegacyMediaCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_it_cleans_league_legacy_paths_after_migration(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');
        $fullPath = Storage::disk('public')->path($path);

        $league = League::factory()->create([
            'logo_path' => $path,
            'header_image_path' => $path,
            'banner_path' => $path,
        ]);

        // Add media to simulate successful migration
        $league->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');
        $league->addMedia($fullPath)->preservingOriginal()->toMediaCollection('header_image');
        $league->addMedia($fullPath)->preservingOriginal()->toMediaCollection('banner');

        $this->artisan('media:cleanup-legacy', ['--force' => true, '--model' => 'league'])
            ->assertSuccessful();

        $league = $league->fresh();
        $this->assertNull($league->logo_path);
        $this->assertNull($league->header_image_path);
        $this->assertNull($league->banner_path);
    }

    public function test_it_skips_cleanup_if_media_not_migrated(): void
    {
        $league = League::factory()->create([
            'logo_path' => 'some-path.jpg',
        ]);

        $this->artisan('media:cleanup-legacy', ['--force' => true, '--model' => 'league'])
            ->assertSuccessful();

        // Should not clean because media doesn't exist
        $this->assertNotNull($league->fresh()->logo_path);
    }

    public function test_it_cleans_competition_legacy_paths(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('competitions', 'public');
        $fullPath = Storage::disk('public')->path($path);

        $competition = Competition::factory()->create([
            'logo_path' => $path,
        ]);

        $competition->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');

        $this->artisan('media:cleanup-legacy', ['--force' => true, '--model' => 'competition'])
            ->assertSuccessful();

        $this->assertNull($competition->fresh()->logo_path);
    }

    public function test_it_cleans_season_legacy_paths(): void
    {
        $logoFile = UploadedFile::fake()->image('logo.jpg');
        $bannerFile = UploadedFile::fake()->image('banner.jpg');

        $logoPath = $logoFile->store('seasons', 'public');
        $bannerPath = $bannerFile->store('seasons', 'public');

        $logoFullPath = Storage::disk('public')->path($logoPath);
        $bannerFullPath = Storage::disk('public')->path($bannerPath);

        $season = SeasonEloquent::factory()->create([
            'logo_path' => $logoPath,
            'banner_path' => $bannerPath,
        ]);

        $season->addMedia($logoFullPath)->preservingOriginal()->toMediaCollection('logo');
        $season->addMedia($bannerFullPath)->preservingOriginal()->toMediaCollection('banner');

        $this->artisan('media:cleanup-legacy', ['--force' => true, '--model' => 'season'])
            ->assertSuccessful();

        $season = $season->fresh();
        $this->assertNull($season->logo_path);
        $this->assertNull($season->banner_path);
    }

    public function test_it_cleans_team_legacy_paths(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('teams', 'public');
        $fullPath = Storage::disk('public')->path($path);

        $team = Team::factory()->create([
            'logo_url' => $path,
        ]);

        $team->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');

        $this->artisan('media:cleanup-legacy', ['--force' => true, '--model' => 'team'])
            ->assertSuccessful();

        $this->assertNull($team->fresh()->logo_url);
    }

    public function test_it_cleans_division_legacy_paths(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('divisions', 'public');
        $fullPath = Storage::disk('public')->path($path);

        $division = Division::factory()->create([
            'logo_url' => $path,
        ]);

        $division->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');

        $this->artisan('media:cleanup-legacy', ['--force' => true, '--model' => 'division'])
            ->assertSuccessful();

        $this->assertNull($division->fresh()->logo_url);
    }

    public function test_it_deletes_site_config_file_records(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('site-config', 'public');
        $fullPath = Storage::disk('public')->path($path);

        $siteConfig = SiteConfigModel::factory()->create();

        $configFile = SiteConfigFileModel::create([
            'site_config_id' => $siteConfig->id,
            'file_type' => 'logo',
            'file_name' => 'logo.jpg',
            'file_path' => $path,
            'storage_disk' => 'public',
            'mime_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);

        $siteConfig->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');

        $this->artisan('media:cleanup-legacy', ['--force' => true, '--model' => 'siteconfig'])
            ->assertSuccessful();

        $this->assertDatabaseMissing('site_config_files', ['id' => $configFile->id]);
    }

    public function test_it_deletes_physical_files_when_flag_is_set(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');
        $fullPath = Storage::disk('public')->path($path);

        $league = League::factory()->create([
            'logo_path' => $path,
        ]);

        $league->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');

        // Verify file exists before cleanup
        $this->assertTrue(Storage::disk('public')->exists($path));

        $this->artisan('media:cleanup-legacy', [
            '--force' => true,
            '--model' => 'league',
            '--delete-files' => true,
        ])->assertSuccessful();

        // File should be deleted
        $this->assertFalse(Storage::disk('public')->exists($path));
    }

    public function test_it_preserves_physical_files_without_delete_flag(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');
        $fullPath = Storage::disk('public')->path($path);

        $league = League::factory()->create([
            'logo_path' => $path,
        ]);

        $league->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');

        $this->artisan('media:cleanup-legacy', ['--force' => true, '--model' => 'league'])
            ->assertSuccessful();

        // File should still exist
        $this->assertTrue(Storage::disk('public')->exists($path));
    }

    public function test_it_supports_dry_run_mode(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');
        $fullPath = Storage::disk('public')->path($path);

        $league = League::factory()->create([
            'logo_path' => $path,
        ]);

        $league->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');

        $this->artisan('media:cleanup-legacy', ['--dry-run' => true, '--model' => 'league'])
            ->expectsOutput('DRY RUN MODE - No changes will be made')
            ->assertSuccessful();

        // Legacy path should still exist
        $this->assertNotNull($league->fresh()->logo_path);
    }

    public function test_it_requires_confirmation_without_force_flag(): void
    {
        $this->artisan('media:cleanup-legacy')
            ->expectsConfirmation('Have you verified all media was migrated successfully?', 'no')
            ->assertExitCode(1);
    }

    public function test_it_displays_cleanup_summary(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');
        $fullPath = Storage::disk('public')->path($path);

        $league = League::factory()->create(['logo_path' => $path]);
        $league->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');

        $this->artisan('media:cleanup-legacy', ['--force' => true, '--model' => 'league'])
            ->expectsOutput('Cleanup Summary:')
            ->assertSuccessful();
    }

    public function test_it_cleans_all_models_by_default(): void
    {
        $leagueFile = UploadedFile::fake()->image('league.jpg');
        $leaguePath = $leagueFile->store('leagues', 'public');
        $leagueFullPath = Storage::disk('public')->path($leaguePath);
        $league = League::factory()->create(['logo_path' => $leaguePath]);
        $league->addMedia($leagueFullPath)->preservingOriginal()->toMediaCollection('logo');

        $competitionFile = UploadedFile::fake()->image('competition.jpg');
        $competitionPath = $competitionFile->store('competitions', 'public');
        $competitionFullPath = Storage::disk('public')->path($competitionPath);
        $competition = Competition::factory()->create(['logo_path' => $competitionPath]);
        $competition->addMedia($competitionFullPath)->preservingOriginal()->toMediaCollection('logo');

        $this->artisan('media:cleanup-legacy', ['--force' => true])
            ->assertSuccessful();

        $this->assertNull($league->fresh()->logo_path);
        $this->assertNull($competition->fresh()->logo_path);
    }

    public function test_it_handles_missing_files_gracefully(): void
    {
        $league = League::factory()->create([
            'logo_path' => 'non-existent.jpg',
        ]);

        // Add media (simulating migration happened)
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');
        $fullPath = Storage::disk('public')->path($path);
        $league->addMedia($fullPath)->preservingOriginal()->toMediaCollection('logo');

        $this->artisan('media:cleanup-legacy', [
            '--force' => true,
            '--model' => 'league',
            '--delete-files' => true,
        ])->assertSuccessful();

        // Should still clean the path even if file doesn't exist
        $this->assertNull($league->fresh()->logo_path);
    }
}
