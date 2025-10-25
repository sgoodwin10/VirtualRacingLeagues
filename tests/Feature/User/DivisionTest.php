<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Feature tests for Division API endpoints.
 */
class DivisionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private SeasonEloquent $season;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->user = User::factory()->create();
        $this->season = SeasonEloquent::factory()->create([
            'race_divisions_enabled' => true,
        ]);
    }

    public function test_authenticated_user_can_list_divisions_for_season(): void
    {
        Division::factory()->count(3)->create([
            'season_id' => $this->season->id,
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->getJson("/api/seasons/{$this->season->id}/divisions");

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'season_id',
                    'name',
                    'description',
                    'logo_url',
                    'created_at',
                    'updated_at',
                ],
            ],
        ]);
    }

    public function test_authenticated_user_can_create_division_with_required_fields(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/seasons/{$this->season->id}/divisions", [
            'name' => 'Pro Division',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'season_id',
                'name',
                'description',
                'logo_url',
                'created_at',
                'updated_at',
            ],
            'message',
        ]);

        $this->assertDatabaseHas('divisions', [
            'season_id' => $this->season->id,
            'name' => 'Pro Division',
            'description' => null,
        ]);
    }

    public function test_authenticated_user_can_create_division_with_all_fields(): void
    {
        $this->actingAs($this->user, 'web');

        $logo = UploadedFile::fake()->image('division-logo.png');

        $response = $this->postJson("/api/seasons/{$this->season->id}/divisions", [
            'name' => 'Pro Division',
            'description' => 'This is a description for the pro division',
            'logo' => $logo,
        ]);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            'name' => 'Pro Division',
            'description' => 'This is a description for the pro division',
        ]);

        $this->assertDatabaseHas('divisions', [
            'season_id' => $this->season->id,
            'name' => 'Pro Division',
            'description' => 'This is a description for the pro division',
        ]);

        $division = Division::where('season_id', $this->season->id)->first();
        $this->assertNotNull($division->logo_url);
        Storage::disk('public')->assertExists($division->logo_url);
    }

    public function test_division_name_is_required(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/seasons/{$this->season->id}/divisions", [
            'description' => 'Description without name',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_division_name_must_be_at_least_2_characters(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/seasons/{$this->season->id}/divisions", [
            'name' => 'A',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_division_name_must_not_exceed_60_characters(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/seasons/{$this->season->id}/divisions", [
            'name' => str_repeat('a', 61),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_division_description_is_optional(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/seasons/{$this->season->id}/divisions", [
            'name' => 'Pro Division',
            'description' => null,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('divisions', [
            'name' => 'Pro Division',
            'description' => null,
        ]);
    }

    public function test_division_description_must_be_at_least_10_characters_when_provided(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/seasons/{$this->season->id}/divisions", [
            'name' => 'Pro Division',
            'description' => '123456789',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['description']);
    }

    public function test_division_description_must_not_exceed_500_characters(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/seasons/{$this->season->id}/divisions", [
            'name' => 'Pro Division',
            'description' => str_repeat('a', 501),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['description']);
    }

    public function test_authenticated_user_can_update_division(): void
    {
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
            'name' => 'Old Name',
            'description' => 'Old description',
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->putJson("/api/seasons/{$this->season->id}/divisions/{$division->id}", [
            'name' => 'New Name',
            'description' => 'New description for the division',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'name' => 'New Name',
            'description' => 'New description for the division',
        ]);

        $this->assertDatabaseHas('divisions', [
            'id' => $division->id,
            'name' => 'New Name',
            'description' => 'New description for the division',
        ]);
    }

    public function test_authenticated_user_can_update_division_logo(): void
    {
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        $this->actingAs($this->user, 'web');

        $newLogo = UploadedFile::fake()->image('new-logo.png');

        $response = $this->putJson("/api/seasons/{$this->season->id}/divisions/{$division->id}", [
            'logo' => $newLogo,
        ]);

        $response->assertStatus(200);

        $division->refresh();
        $this->assertNotNull($division->logo_url);
        Storage::disk('public')->assertExists($division->logo_url);
    }

    public function test_authenticated_user_can_delete_division(): void
    {
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->deleteJson("/api/seasons/{$this->season->id}/divisions/{$division->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'message' => 'Division deleted successfully',
        ]);

        $this->assertDatabaseMissing('divisions', [
            'id' => $division->id,
        ]);
    }

    public function test_deleting_division_sets_drivers_division_id_to_null(): void
    {
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'division_id' => $division->id,
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->deleteJson("/api/seasons/{$this->season->id}/divisions/{$division->id}");

        $response->assertStatus(200);

        $this->assertDatabaseHas('season_drivers', [
            'id' => $seasonDriver->id,
            'division_id' => null,
        ]);
    }

    public function test_authenticated_user_can_get_driver_count_for_division(): void
    {
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        SeasonDriverEloquent::factory()->count(5)->create([
            'season_id' => $this->season->id,
            'division_id' => $division->id,
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->getJson("/api/seasons/{$this->season->id}/divisions/{$division->id}/driver-count");

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'count' => 5,
        ]);
    }

    public function test_authenticated_user_can_assign_driver_to_division(): void
    {
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'division_id' => null,
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->putJson("/api/seasons/{$this->season->id}/drivers/{$seasonDriver->id}/division", [
            'division_id' => $division->id,
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'message' => 'Driver assigned to division successfully',
        ]);

        $this->assertDatabaseHas('season_drivers', [
            'id' => $seasonDriver->id,
            'division_id' => $division->id,
        ]);
    }

    public function test_authenticated_user_can_remove_driver_from_division(): void
    {
        $division = Division::factory()->create([
            'season_id' => $this->season->id,
        ]);

        $seasonDriver = SeasonDriverEloquent::factory()->create([
            'season_id' => $this->season->id,
            'division_id' => $division->id,
        ]);

        $this->actingAs($this->user, 'web');

        $response = $this->putJson("/api/seasons/{$this->season->id}/drivers/{$seasonDriver->id}/division", [
            'division_id' => null,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('season_drivers', [
            'id' => $seasonDriver->id,
            'division_id' => null,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_division_endpoints(): void
    {
        $response = $this->getJson("/api/seasons/{$this->season->id}/divisions");
        $response->assertStatus(401);

        $response = $this->postJson("/api/seasons/{$this->season->id}/divisions", [
            'name' => 'Pro Division',
        ]);
        $response->assertStatus(401);
    }
}
