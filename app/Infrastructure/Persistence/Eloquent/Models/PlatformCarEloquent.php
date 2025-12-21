<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;

/**
 * PlatformCar Eloquent Model.
 * Anemic model - contains only ORM configuration, no business logic.
 *
 * @property int $id
 * @property int $platform_id
 * @property int $car_brand_id
 * @property string $external_id
 * @property string $name
 * @property string $slug
 * @property string|null $car_group
 * @property int|null $year
 * @property string|null $image_url
 * @property bool $is_active
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
final class PlatformCarEloquent extends Model
{
    use HasFactory;

    protected $table = 'platform_cars';

    /**
     * @var array<string>
     */
    protected $fillable = [
        'platform_id',
        'car_brand_id',
        'external_id',
        'name',
        'slug',
        'car_group',
        'year',
        'image_url',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'platform_id' => 'integer',
            'car_brand_id' => 'integer',
            'year' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Platform, $this>
     */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class, 'platform_id');
    }

    /**
     * @return BelongsTo<CarBrandEloquent, $this>
     */
    public function carBrand(): BelongsTo
    {
        return $this->belongsTo(CarBrandEloquent::class, 'car_brand_id');
    }
}
