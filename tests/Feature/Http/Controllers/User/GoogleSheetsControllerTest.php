<?php

namespace Tests\Feature\Http\Controllers\User;

use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use App\Services\GoogleSheetsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class GoogleSheetsControllerTest extends TestCase
{
    use RefreshDatabase;

    private UserEloquent $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = UserEloquent::factory()->create();
    }

    public function test_fetch_csv_requires_authentication(): void
    {
        $response = $this->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 'https://docs.google.com/spreadsheets/d/123/edit']
        );

        $response->assertStatus(401);
    }

    public function test_fetch_csv_validates_url_is_required(): void
    {
        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            []
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    public function test_fetch_csv_validates_url_is_string(): void
    {
        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 12345]
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    public function test_fetch_csv_validates_url_is_valid_url_format(): void
    {
        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 'not-a-url']
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url']);
    }

    public function test_fetch_csv_validates_url_is_google_sheets_url(): void
    {
        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 'https://example.com']
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url'])
            ->assertJson([
                'errors' => [
                    'url' => ['Please enter a valid Google Sheets URL'],
                ],
            ]);
    }

    public function test_fetch_csv_returns_csv_data_on_success(): void
    {
        $csvData = "Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com";

        $mockService = Mockery::mock(GoogleSheetsService::class);
        $mockService->shouldReceive('fetchSheetAsCsv')
            ->once()
            ->with('https://docs.google.com/spreadsheets/d/123/edit')
            ->andReturn($csvData);

        $this->app->instance(GoogleSheetsService::class, $mockService);

        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 'https://docs.google.com/spreadsheets/d/123/edit']
        );

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'csv' => $csvData,
                ],
            ]);
    }

    public function test_fetch_csv_returns_422_for_invalid_argument_exception(): void
    {
        $mockService = Mockery::mock(GoogleSheetsService::class);
        $mockService->shouldReceive('fetchSheetAsCsv')
            ->once()
            ->andThrow(new \InvalidArgumentException('Invalid Google Sheets URL format'));

        $this->app->instance(GoogleSheetsService::class, $mockService);

        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 'https://docs.google.com/spreadsheets/d/123/edit']
        );

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid Google Sheets URL format',
            ]);
    }

    public function test_fetch_csv_returns_400_for_generic_exception(): void
    {
        $mockService = Mockery::mock(GoogleSheetsService::class);
        $mockService->shouldReceive('fetchSheetAsCsv')
            ->once()
            ->andThrow(new \Exception('Failed to connect to Google Sheets. Please try again.'));

        $this->app->instance(GoogleSheetsService::class, $mockService);

        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 'https://docs.google.com/spreadsheets/d/123/edit']
        );

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Failed to connect to Google Sheets. Please try again.',
            ]);
    }

    public function test_fetch_csv_returns_400_for_not_found_exception(): void
    {
        $mockService = Mockery::mock(GoogleSheetsService::class);
        $mockService->shouldReceive('fetchSheetAsCsv')
            ->once()
            ->andThrow(
                new \Exception('Google Sheet not found. Make sure the sheet exists and is publicly accessible.')
            );

        $this->app->instance(GoogleSheetsService::class, $mockService);

        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 'https://docs.google.com/spreadsheets/d/123/edit']
        );

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Google Sheet not found. Make sure the sheet exists and is publicly accessible.',
            ]);
    }

    public function test_fetch_csv_returns_400_for_empty_sheet_exception(): void
    {
        $mockService = Mockery::mock(GoogleSheetsService::class);
        $mockService->shouldReceive('fetchSheetAsCsv')
            ->once()
            ->andThrow(new \Exception('Google Sheet is empty'));

        $this->app->instance(GoogleSheetsService::class, $mockService);

        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 'https://docs.google.com/spreadsheets/d/123/edit']
        );

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Google Sheet is empty',
            ]);
    }

    public function test_fetch_csv_returns_400_for_not_public_exception(): void
    {
        $mockService = Mockery::mock(GoogleSheetsService::class);
        $mockService->shouldReceive('fetchSheetAsCsv')
            ->once()
            ->andThrow(
                new \Exception(
                    'Cannot access Google Sheet. Please make sure the sheet is shared publicly ' .
                    '(Anyone with the link can view).'
                )
            );

        $this->app->instance(GoogleSheetsService::class, $mockService);

        $response = $this->actingAs($this->user)->postJson(
            'http://app.virtualracingleagues.localhost/api/google-sheets/fetch-csv',
            ['url' => 'https://docs.google.com/spreadsheets/d/123/edit']
        );

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Cannot access Google Sheet. Please make sure the sheet is shared publicly ' .
                    '(Anyone with the link can view).',
            ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
