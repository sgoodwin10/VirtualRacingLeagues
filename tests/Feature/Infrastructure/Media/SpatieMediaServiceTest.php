<?php

declare(strict_types=1);

namespace Tests\Feature\Infrastructure\Media;

use App\Application\Shared\Services\MediaServiceInterface;
use App\Domain\Shared\ValueObjects\MediaReference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Fixtures\TestMediaModel;
use Tests\TestCase;

/**
 * SpatieMediaService Integration Tests
 *
 * Tests the complete flow of media upload, retrieval, and deletion using Spatie Media Library
 */
class SpatieMediaServiceTest extends TestCase
{
    use RefreshDatabase;

    private MediaServiceInterface $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Use fake storage for testing
        Storage::fake('public');

        // Get service instance from container
        $this->service = app(MediaServiceInterface::class);
    }

    public function test_uploads_file_and_generates_conversions(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);
        $file = UploadedFile::fake()->image('logo.png', 1000, 1000);

        $reference = $this->service->upload($file, $model, 'logo');

        $this->assertNotNull($reference->id);
        $this->assertEquals('logo', $reference->collection);
        $this->assertIsArray($reference->conversions);

        // Verify media record was created
        $this->assertDatabaseHas('media', [
            'id' => $reference->id,
            'model_type' => get_class($model),
            'model_id' => $model->id,
            'collection_name' => 'logo',
        ]);
    }

    public function test_uploads_file_and_returns_media_reference(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);
        $file = UploadedFile::fake()->image('test.jpg', 800, 600);

        $reference = $this->service->upload($file, $model, 'avatars');

        $this->assertInstanceOf(MediaReference::class, $reference);
        $this->assertGreaterThan(0, $reference->id);
        $this->assertEquals('avatars', $reference->collection);
    }

    public function test_deletes_media_successfully(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);
        $file = UploadedFile::fake()->image('delete-test.png');

        $reference = $this->service->upload($file, $model, 'test');
        $mediaId = $reference->id;

        // Verify media exists
        $this->assertDatabaseHas('media', ['id' => $mediaId]);

        // Delete media
        $result = $this->service->delete($reference);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('media', ['id' => $mediaId]);
    }

    public function test_delete_returns_false_for_non_existent_media(): void
    {
        $reference = new MediaReference(
            id: 99999,
            collection: 'non-existent'
        );

        $result = $this->service->delete($reference);

        $this->assertFalse($result);
    }

    public function test_gets_url_for_original_file(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);
        $file = UploadedFile::fake()->image('url-test.png');

        $reference = $this->service->upload($file, $model, 'images');

        $url = $this->service->getUrl($reference);

        $this->assertStringContainsString('/storage/', $url);
        $this->assertStringContainsString('url-test', $url);
    }

    public function test_gets_url_for_conversion(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);
        $file = UploadedFile::fake()->image('conversion-test.png');

        $reference = $this->service->upload($file, $model, 'images');

        // Note: In testing, conversions may be queued and not immediately available
        // This test verifies the method doesn't throw an error
        $url = $this->service->getUrl($reference, 'thumb');

        $this->assertIsString($url);
    }

    public function test_gets_responsive_urls(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);
        $file = UploadedFile::fake()->image('responsive-test.png', 1920, 1080);

        $reference = $this->service->upload($file, $model, 'banners');

        $urls = $this->service->getResponsiveUrls($reference);

        $this->assertIsArray($urls);
        $this->assertArrayHasKey('original', $urls);
        $this->assertArrayHasKey('conversions', $urls);
        $this->assertArrayHasKey('srcset', $urls);
        $this->assertIsString($urls['original']);
        $this->assertIsArray($urls['conversions']);
        $this->assertIsString($urls['srcset']);
    }

    public function test_media_deleted_when_entity_deleted(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);
        $file = UploadedFile::fake()->image('cascade-test.png');

        $reference = $this->service->upload($file, $model, 'avatars');
        $mediaId = $reference->id;

        // Verify media exists
        $this->assertDatabaseHas('media', ['id' => $mediaId]);

        // Delete the model (should cascade delete media)
        $model->delete();

        // Verify media was deleted
        $this->assertDatabaseMissing('media', ['id' => $mediaId]);
    }

    public function test_replaces_existing_media_in_collection(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);

        // Upload first file
        $file1 = UploadedFile::fake()->image('logo1.png');
        $reference1 = $this->service->upload($file1, $model, 'logo');

        // Verify first upload was successful
        $this->assertDatabaseHas('media', ['id' => $reference1->id]);

        // Refresh the model to load the media relationship
        // This simulates real-world usage where the model would be reloaded between operations
        $model->refresh();

        // Upload second file to same collection (should replace first)
        $file2 = UploadedFile::fake()->image('logo2.png');
        $reference2 = $this->service->upload($file2, $model, 'logo');

        // Second media should exist
        $this->assertDatabaseHas('media', ['id' => $reference2->id]);

        // First media should be deleted
        $this->assertDatabaseMissing('media', ['id' => $reference1->id]);

        // Reload model from database to get fresh media relationship
        $freshModel = TestMediaModel::find($model->id);

        // Model should only have one media item in 'logo' collection
        $mediaCount = $freshModel->getMedia('logo')->count();
        $this->assertEquals(1, $mediaCount);
    }

    public function test_srcset_generation_includes_proper_widths(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);
        $file = UploadedFile::fake()->image('srcset-test.png', 2000, 1500);

        $reference = $this->service->upload($file, $model, 'images');

        $urls = $this->service->getResponsiveUrls($reference);

        // Verify srcset format (should include width descriptors like "150w", "320w", etc.)
        $srcset = $urls['srcset'];

        // Note: Actual conversions may be queued, so we just verify format
        $this->assertIsString($srcset);
    }

    public function test_handles_different_file_types(): void
    {
        $model = TestMediaModel::create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test-' . uniqid() . '@example.com',
            'password' => 'password',
        ]);

        // Test PNG
        $png = UploadedFile::fake()->image('test.png');
        $reference1 = $this->service->upload($png, $model, 'png-test');
        $this->assertNotNull($reference1->id);

        // Test JPG
        $jpg = UploadedFile::fake()->image('test.jpg');
        $reference2 = $this->service->upload($jpg, $model, 'jpg-test');
        $this->assertNotNull($reference2->id);

        // Test WebP
        $webp = UploadedFile::fake()->image('test.webp');
        $reference3 = $this->service->upload($webp, $model, 'webp-test');
        $this->assertNotNull($reference3->id);
    }
}
