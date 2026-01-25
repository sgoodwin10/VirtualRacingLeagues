<?php

declare(strict_types=1);

namespace Tests\Fixtures;

use App\Infrastructure\Persistence\Eloquent\Traits\HasMediaCollections;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;

/**
 * Test Model for Media Library Integration Tests
 *
 * A simple test model that implements HasMedia interface
 */
class TestMediaModel extends Model implements HasMedia
{
    use HasMediaCollections;

    protected $table = 'users'; // Use existing table for testing

    protected $guarded = [];
}
