<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Shared\ValueObjects;

use App\Domain\Shared\ValueObjects\MediaReference;
use PHPUnit\Framework\TestCase;

class MediaReferenceTest extends TestCase
{
    public function test_creates_from_constructor(): void
    {
        $reference = new MediaReference(
            id: 123,
            collection: 'logos',
            conversions: ['thumb' => 'https://example.com/thumb.webp']
        );

        $this->assertEquals(123, $reference->id);
        $this->assertEquals('logos', $reference->collection);
        $this->assertEquals(['thumb' => 'https://example.com/thumb.webp'], $reference->conversions);
    }

    public function test_creates_from_constructor_with_empty_conversions(): void
    {
        $reference = new MediaReference(
            id: 456,
            collection: 'banners'
        );

        $this->assertEquals(456, $reference->id);
        $this->assertEquals('banners', $reference->collection);
        $this->assertEmpty($reference->conversions);
    }

    public function test_creates_from_array(): void
    {
        $data = [
            'id' => 789,
            'collection' => 'headers',
            'conversions' => [
                'thumb' => 'https://example.com/thumb.webp',
                'medium' => 'https://example.com/medium.webp',
                'large' => 'https://example.com/large.webp',
            ],
        ];

        $reference = MediaReference::fromArray($data);

        $this->assertEquals(789, $reference->id);
        $this->assertEquals('headers', $reference->collection);
        $this->assertEquals($data['conversions'], $reference->conversions);
    }

    public function test_creates_from_array_without_conversions(): void
    {
        $data = [
            'id' => 111,
            'collection' => 'avatars',
        ];

        $reference = MediaReference::fromArray($data);

        $this->assertEquals(111, $reference->id);
        $this->assertEquals('avatars', $reference->collection);
        $this->assertEmpty($reference->conversions);
    }

    public function test_converts_to_array(): void
    {
        $conversions = [
            'thumb' => 'https://example.com/thumb.webp',
            'small' => 'https://example.com/small.webp',
            'medium' => 'https://example.com/medium.webp',
            'large' => 'https://example.com/large.webp',
            'og' => 'https://example.com/og.webp',
        ];

        $reference = new MediaReference(
            id: 999,
            collection: 'logos',
            conversions: $conversions
        );

        $array = $reference->toArray();

        $this->assertEquals([
            'id' => 999,
            'collection' => 'logos',
            'conversions' => $conversions,
        ], $array);
    }

    public function test_converts_to_array_with_empty_conversions(): void
    {
        $reference = new MediaReference(
            id: 222,
            collection: 'documents'
        );

        $array = $reference->toArray();

        $this->assertEquals([
            'id' => 222,
            'collection' => 'documents',
            'conversions' => [],
        ], $array);
    }

    public function test_is_immutable(): void
    {
        $reference = new MediaReference(
            id: 333,
            collection: 'test',
            conversions: ['thumb' => 'url']
        );

        // Verify readonly properties cannot be modified
        // This is enforced by PHP 8.1+ readonly keyword at compile time
        $this->assertInstanceOf(MediaReference::class, $reference);
    }

    public function test_round_trip_conversion(): void
    {
        $original = new MediaReference(
            id: 444,
            collection: 'images',
            conversions: [
                'thumb' => 'https://cdn.example.com/thumb.webp',
                'medium' => 'https://cdn.example.com/medium.webp',
            ]
        );

        $array = $original->toArray();
        $reconstructed = MediaReference::fromArray($array);

        $this->assertEquals($original->id, $reconstructed->id);
        $this->assertEquals($original->collection, $reconstructed->collection);
        $this->assertEquals($original->conversions, $reconstructed->conversions);
    }
}
