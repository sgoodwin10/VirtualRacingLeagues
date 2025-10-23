<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CompetitionControllerTest extends UserControllerTestCase
{
    use RefreshDatabase;

    private User $user;
    private User $otherUser;
    private League $league;
    private Platform $platform;

    protected function setUp(): void
    {
        parent::setUp();

        // Create platforms directly
        $this->platform = Platform::create([
            'name' => 'iRacing',
            'slug' => 'iracing',
        ]);

        $secondPlatform = Platform::create([
            'name' => 'Gran Turismo 7',
            'slug' => 'gran-turismo-7',
        ]);

        // Create users
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();

        // Create league owned by user with platforms
        $this->league = League::factory()->create([
            'owner_user_id' => $this->user->id,
            'platform_ids' => [$this->platform->id, $secondPlatform->id],
        ]);

        Storage::fake('public');
    }

    // ==================== Authentication Tests ====================

    public function test_guest_cannot_list_competitions(): void
    {
        $response = $this->getJson("/api/leagues/{$this->league->id}/competitions");

        $response->assertStatus(401);
    }

    public function test_guest_cannot_create_competition(): void
    {
        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Championship',
            'platform_id' => $this->platform->id,
        ]);

        $response->assertStatus(401);
    }

    public function test_guest_cannot_view_competition(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
        ]);

        $response = $this->getJson("/api/competitions/{$competition->id}");

        $response->assertStatus(401);
    }

    public function test_guest_cannot_update_competition(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
        ]);

        $response = $this->putJson("/api/competitions/{$competition->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(401);
    }

    public function test_guest_cannot_delete_competition(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
        ]);

        $response = $this->deleteJson("/api/competitions/{$competition->id}");

        $response->assertStatus(401);
    }

    public function test_guest_cannot_archive_competition(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
        ]);

        $response = $this->postJson("/api/competitions/{$competition->id}/archive");

        $response->assertStatus(401);
    }

    // ==================== Authorization Tests ====================

    public function test_non_owner_cannot_create_competition(): void
    {
        $this->actingAs($this->otherUser, 'web');

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Championship',
            'platform_id' => $this->platform->id,
            'description' => 'Test competition',
        ]);

        $response->assertStatus(403);
    }

    public function test_non_owner_cannot_update_competition(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
        ]);

        $this->actingAs($this->otherUser, 'web');

        $response = $this->putJson("/api/competitions/{$competition->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(403);
    }

    public function test_non_owner_cannot_delete_competition(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
        ]);

        $this->actingAs($this->otherUser, 'web');

        $response = $this->deleteJson("/api/competitions/{$competition->id}");

        $response->assertStatus(403);
    }

    public function test_non_owner_cannot_archive_competition(): void
    {
        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
        ]);

        $this->actingAs($this->otherUser, 'web');

        $response = $this->postJson("/api/competitions/{$competition->id}/archive");

        $response->assertStatus(403);
    }

    // ==================== CRUD Tests ====================

    public function test_user_can_list_league_competitions(): void
    {
        $this->actingAs($this->user, 'web');

        $competition1 = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'name' => 'GT3 Championship',
        ]);

        $competition2 = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'name' => 'GT4 Championship',
        ]);

        $response = $this->getJson("/api/leagues/{$this->league->id}/competitions");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['name' => 'GT3 Championship'])
            ->assertJsonFragment(['name' => 'GT4 Championship']);
    }

    public function test_user_can_create_competition(): void
    {
        $this->actingAs($this->user, 'web');

        $data = [
            'name' => 'GT3 Championship',
            'platform_id' => $this->platform->id,
            'description' => 'A competitive GT3 series',
        ];

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", $data);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'GT3 Championship'])
            ->assertJsonFragment([
                'league' => [
                    'id' => $this->league->id,
                    'name' => $this->league->name,
                    'slug' => $this->league->slug,
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'league_id',
                    'name',
                    'slug',
                    'description',
                    'platform_id',
                    'platform_name',
                    'platform_slug',
                    'league' => [
                        'id',
                        'name',
                        'slug',
                    ],
                    'logo_url',
                    'status',
                    'is_active',
                    'is_archived',
                    'created_at',
                    'updated_at',
                    'stats' => [
                        'total_seasons',
                        'active_seasons',
                        'total_drivers',
                        'total_races',
                        'next_race_date',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('competitions', [
            'name' => 'GT3 Championship',
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'slug' => 'gt3-championship',
        ]);
    }

    public function test_user_can_create_competition_with_logo(): void
    {
        $this->actingAs($this->user, 'web');

        $logo = UploadedFile::fake()->image('logo.png', 500, 500);

        $data = [
            'name' => 'GT3 Championship',
            'platform_id' => $this->platform->id,
            'description' => 'A competitive GT3 series',
            'logo' => $logo,
        ];

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", $data);

        $response->assertStatus(201);

        $competition = Competition::where('name', 'GT3 Championship')->first();
        $this->assertNotNull($competition->logo_path);
        Storage::disk('public')->assertExists($competition->logo_path);
    }

    public function test_user_can_view_competition(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'name' => 'GT3 Championship',
        ]);

        $response = $this->getJson("/api/competitions/{$competition->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'GT3 Championship'])
            ->assertJsonFragment(['id' => $competition->id]);
    }

    public function test_user_can_update_competition_name(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'name' => 'GT3 Championship',
            'slug' => 'gt3-championship',
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->putJson("/api/competitions/{$competition->id}", [
            'name' => 'GT3 Pro Championship',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'GT3 Pro Championship']);

        $this->assertDatabaseHas('competitions', [
            'id' => $competition->id,
            'name' => 'GT3 Pro Championship',
            'slug' => 'gt3-pro-championship', // Slug should update too
        ]);
    }

    public function test_user_can_update_competition_description(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->putJson("/api/competitions/{$competition->id}", [
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['description' => 'Updated description']);

        $this->assertDatabaseHas('competitions', [
            'id' => $competition->id,
            'description' => 'Updated description',
        ]);
    }

    public function test_user_can_update_competition_logo(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
        ]);

        $newLogo = UploadedFile::fake()->image('new-logo.png', 500, 500);

        $response = $this->putJson("/api/competitions/{$competition->id}", [
            'logo' => $newLogo,
        ]);

        $response->assertStatus(200);

        $competition->refresh();
        $this->assertNotNull($competition->logo_path);
        Storage::disk('public')->assertExists($competition->logo_path);
    }

    public function test_user_can_delete_competition(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->deleteJson("/api/competitions/{$competition->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Competition deleted successfully',
            ]);

        $this->assertSoftDeleted('competitions', [
            'id' => $competition->id,
        ]);
    }

    public function test_user_can_archive_competition(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
            'status' => 'active',
        ]);

        $response = $this->postJson("/api/competitions/{$competition->id}/archive");

        $response->assertStatus(200);

        $this->assertDatabaseHas('competitions', [
            'id' => $competition->id,
            'status' => 'archived',
        ]);

        $competition->refresh();
        $this->assertNotNull($competition->archived_at);
    }

    // ==================== Validation Tests ====================

    public function test_create_competition_requires_name(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'platform_id' => $this->platform->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_competition_requires_platform_id(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Championship',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['platform_id']);
    }

    public function test_create_competition_validates_name_min_length(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT',
            'platform_id' => $this->platform->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_competition_validates_name_max_length(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => str_repeat('a', 101),
            'platform_id' => $this->platform->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_create_competition_validates_platform_exists(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Championship',
            'platform_id' => 99999,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['platform_id']);
    }

    public function test_create_competition_validates_description_max_length(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Championship',
            'platform_id' => $this->platform->id,
            'description' => str_repeat('a', 1001),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['description']);
    }

    public function test_create_competition_validates_logo_is_image(): void
    {
        $this->actingAs($this->user, 'web');

        $file = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Championship',
            'platform_id' => $this->platform->id,
            'logo' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['logo']);
    }

    public function test_create_competition_validates_logo_file_size(): void
    {
        $this->actingAs($this->user, 'web');

        $file = UploadedFile::fake()->create('logo.png', 3000); // 3MB

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Championship',
            'platform_id' => $this->platform->id,
            'logo' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['logo']);
    }

    // ==================== Business Logic Tests ====================

    public function test_cannot_update_archived_competition(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->archived()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->putJson("/api/competitions/{$competition->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(422); // Or 400 depending on error handling
    }

    public function test_cannot_archive_already_archived_competition(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->archived()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'created_by_user_id' => $this->user->id,
        ]);

        $response = $this->postJson("/api/competitions/{$competition->id}/archive");

        $response->assertStatus(422); // Or 400 depending on error handling
    }

    public function test_competition_slug_is_generated_from_name(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Pro Championship 2024',
            'platform_id' => $this->platform->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['slug' => 'gt3-pro-championship-2024']);
    }

    public function test_competition_slug_is_unique_per_league(): void
    {
        $this->actingAs($this->user, 'web');

        // Create first competition
        Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'name' => 'GT3 Championship',
            'slug' => 'gt3-championship',
        ]);

        // Try to create second with same name
        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Championship',
            'platform_id' => $this->platform->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['slug' => 'gt3-championship-1']);
    }

    public function test_logo_falls_back_to_league_logo(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'logo_path' => null, // No competition logo
        ]);

        $response = $this->getJson("/api/competitions/{$competition->id}");

        $response->assertStatus(200);

        // Should have a logo_url that points to league logo
        $data = $response->json('data');
        $this->assertNotNull($data['logo_url']);
        $this->assertStringContainsString($this->league->logo_path, $data['logo_url']);
    }

    public function test_check_slug_availability(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions/check-slug", [
            'name' => 'GT3 Championship',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'available' => true,
                    'slug' => 'gt3-championship',
                    'suggestion' => null,
                ],
            ]);
    }

    public function test_check_slug_availability_with_existing_slug(): void
    {
        $this->actingAs($this->user, 'web');

        // Create existing competition
        Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
            'slug' => 'gt3-championship',
        ]);

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions/check-slug", [
            'name' => 'GT3 Championship',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'available' => false,
                    'slug' => 'gt3-championship',
                    'suggestion' => 'gt3-championship-1',
                ],
            ]);
    }

    // ==================== Error Handling Tests ====================

    public function test_returns_404_for_non_existent_competition(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->getJson('/api/competitions/99999');

        $response->assertStatus(404);
    }

    public function test_returns_404_for_non_existent_league(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->getJson('/api/leagues/99999/competitions');

        $response->assertStatus(404);
    }

    public function test_platform_must_belong_to_league(): void
    {
        $this->actingAs($this->user, 'web');

        // Create a platform that's not in the league
        $otherPlatform = Platform::create([
            'name' => 'Assetto Corsa',
            'slug' => 'assetto-corsa',
        ]);

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", [
            'name' => 'GT3 Championship',
            'platform_id' => $otherPlatform->id,
        ]);

        $response->assertStatus(422);
    }
}
