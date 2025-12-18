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

class MigrateLegacyMediaCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_it_migrates_league_logo(): void
    {
        // Create a fake file
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');

        // Create league with legacy path
        $league = League::factory()->create([
            'logo_path' => $path,
        ]);

        // Run migration
        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'league'])
            ->assertSuccessful();

        // Assert media was added
        $this->assertTrue($league->fresh()->hasMedia('logo'));
        $this->assertCount(1, $league->fresh()->getMedia('logo'));
    }

    public function test_it_migrates_league_header_image_and_banner(): void
    {
        $headerFile = UploadedFile::fake()->image('header.jpg');
        $bannerFile = UploadedFile::fake()->image('banner.jpg');

        $headerPath = $headerFile->store('leagues', 'public');
        $bannerPath = $bannerFile->store('leagues', 'public');

        $league = League::factory()->create([
            'header_image_path' => $headerPath,
            'banner_path' => $bannerPath,
        ]);

        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'league'])
            ->assertSuccessful();

        $league = $league->fresh();
        $this->assertTrue($league->hasMedia('header_image'));
        $this->assertTrue($league->hasMedia('banner'));
    }

    public function test_it_migrates_competition_logo(): void
    {
        $file = UploadedFile::fake()->image('competition.jpg');
        $path = $file->store('competitions', 'public');

        $competition = Competition::factory()->create([
            'logo_path' => $path,
        ]);

        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'competition'])
            ->assertSuccessful();

        $this->assertTrue($competition->fresh()->hasMedia('logo'));
    }

    public function test_it_migrates_season_logo_and_banner(): void
    {
        $logoFile = UploadedFile::fake()->image('season-logo.jpg');
        $bannerFile = UploadedFile::fake()->image('season-banner.jpg');

        $logoPath = $logoFile->store('seasons', 'public');
        $bannerPath = $bannerFile->store('seasons', 'public');

        $season = SeasonEloquent::factory()->create([
            'logo_path' => $logoPath,
            'banner_path' => $bannerPath,
        ]);

        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'season'])
            ->assertSuccessful();

        $season = $season->fresh();
        $this->assertTrue($season->hasMedia('logo'));
        $this->assertTrue($season->hasMedia('banner'));
    }

    public function test_it_migrates_team_logo(): void
    {
        $file = UploadedFile::fake()->image('team.jpg');
        $path = $file->store('teams', 'public');

        $team = Team::factory()->create([
            'logo_url' => $path,
        ]);

        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'team'])
            ->assertSuccessful();

        $this->assertTrue($team->fresh()->hasMedia('logo'));
    }

    public function test_it_migrates_division_logo(): void
    {
        $file = UploadedFile::fake()->image('division.jpg');
        $path = $file->store('divisions', 'public');

        $division = Division::factory()->create([
            'logo_url' => $path,
        ]);

        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'division'])
            ->assertSuccessful();

        $this->assertTrue($division->fresh()->hasMedia('logo'));
    }

    public function test_it_migrates_site_config_files(): void
    {
        $logoFile = UploadedFile::fake()->image('site-logo.jpg');
        $faviconFile = UploadedFile::fake()->image('favicon.png');

        $logoPath = $logoFile->store('site-config', 'public');
        $faviconPath = $faviconFile->store('site-config', 'public');

        $siteConfig = SiteConfigModel::factory()->create();

        SiteConfigFileModel::create([
            'site_config_id' => $siteConfig->id,
            'file_type' => 'logo',
            'file_name' => 'site-logo.jpg',
            'file_path' => $logoPath,
            'storage_disk' => 'public',
            'mime_type' => 'image/jpeg',
            'file_size' => 1024,
        ]);

        SiteConfigFileModel::create([
            'site_config_id' => $siteConfig->id,
            'file_type' => 'favicon',
            'file_name' => 'favicon.png',
            'file_path' => $faviconPath,
            'storage_disk' => 'public',
            'mime_type' => 'image/png',
            'file_size' => 512,
        ]);

        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'siteconfig'])
            ->assertSuccessful();

        $siteConfig = $siteConfig->fresh();
        $this->assertTrue($siteConfig->hasMedia('logo'));
        $this->assertTrue($siteConfig->hasMedia('favicon'));
    }

    public function test_it_skips_already_migrated_files(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');

        $league = League::factory()->create([
            'logo_path' => $path,
        ]);

        // Manually add media
        $league->addMediaFromDisk($path, 'public')->toMediaCollection('logo');

        // Run migration - should skip
        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'league'])
            ->assertSuccessful();

        // Should still have only 1 media item
        $this->assertCount(1, $league->fresh()->getMedia('logo'));
    }

    public function test_it_handles_missing_files_gracefully(): void
    {
        $league = League::factory()->create([
            'logo_path' => 'non-existent-file.jpg',
        ]);

        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'league'])
            ->assertSuccessful();

        // Should not have media
        $this->assertFalse($league->fresh()->hasMedia('logo'));
    }

    public function test_it_supports_dry_run_mode(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');

        $league = League::factory()->create([
            'logo_path' => $path,
        ]);

        $this->artisan('media:migrate-legacy', ['--dry-run' => true, '--model' => 'league'])
            ->expectsOutput('DRY RUN MODE - No changes will be made')
            ->assertSuccessful();

        // Should NOT have media
        $this->assertFalse($league->fresh()->hasMedia('logo'));
    }

    public function test_it_migrates_all_models_by_default(): void
    {
        // Create entities with legacy paths
        $leagueFile = UploadedFile::fake()->image('league.jpg');
        $leaguePath = $leagueFile->store('leagues', 'public');
        $league = League::factory()->create(['logo_path' => $leaguePath]);

        $competitionFile = UploadedFile::fake()->image('competition.jpg');
        $competitionPath = $competitionFile->store('competitions', 'public');
        $competition = Competition::factory()->create(['logo_path' => $competitionPath]);

        $this->artisan('media:migrate-legacy', ['--force' => true])
            ->assertSuccessful();

        $this->assertTrue($league->fresh()->hasMedia('logo'));
        $this->assertTrue($competition->fresh()->hasMedia('logo'));
    }

    public function test_it_requires_confirmation_without_force_flag(): void
    {
        $this->artisan('media:migrate-legacy')
            ->expectsConfirmation('This will migrate legacy images to Media Library. Continue?', 'no')
            ->assertSuccessful();
    }

    public function test_it_displays_migration_summary(): void
    {
        $file = UploadedFile::fake()->image('logo.jpg');
        $path = $file->store('leagues', 'public');

        League::factory()->create(['logo_path' => $path]);

        $this->artisan('media:migrate-legacy', ['--force' => true, '--model' => 'league'])
            ->expectsOutput('Migration Summary:')
            ->assertSuccessful();
    }
}
