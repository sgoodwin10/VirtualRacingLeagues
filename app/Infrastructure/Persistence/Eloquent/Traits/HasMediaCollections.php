<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Traits;

use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * HasMediaCollections Trait
 *
 * Provides standard media collection functionality for Eloquent models.
 * Includes standard image conversions and automatic cleanup on deletion.
 *
 * Usage:
 * - Add this trait to any Eloquent model that needs media management
 * - Implement HasMedia interface from Spatie
 * - Media will automatically be deleted when the model is deleted
 *
 * @phpstan-require-extends \Illuminate\Database\Eloquent\Model
 */
trait HasMediaCollections
{
    use InteractsWithMedia;

    /**
     * Boot the trait - handles cascade deletion of media
     */
    public static function bootHasMediaCollections(): void
    {
        static::deleting(function ($model) {
            // Clear all media when entity is deleted (prevents orphans)
            $model->clearMediaCollection();
        });
    }

    /**
     * Register media conversions
     *
     * Defines standard image conversions for all models using this trait:
     * - thumb: 150x150 (square, for thumbnails and avatars)
     * - small: 320px width (for mobile devices)
     * - medium: 640px width (for tablets and small screens)
     * - large: 1280px width (for desktop)
     * - og: 1200x630 (for Open Graph social sharing)
     *
     * All conversions output WebP format for optimal file size.
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(150)
            ->height(150)
            ->sharpen(10)
            ->format('webp');

        $this->addMediaConversion('small')
            ->width(320)
            ->format('webp');

        $this->addMediaConversion('medium')
            ->width(640)
            ->format('webp');

        $this->addMediaConversion('large')
            ->width(1280)
            ->format('webp');

        $this->addMediaConversion('og')
            ->width(1200)
            ->height(630)
            ->fit(Fit::Crop, 1200, 630)
            ->format('webp');
    }
}
