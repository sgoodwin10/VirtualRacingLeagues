<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CarBrand Eloquent Model.
 * Anemic model - contains only ORM configuration, no business logic.
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $logo_url
 * @property bool $is_active
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
final class CarBrandEloquent extends Model
{
    use HasFactory;

    protected $table = 'car_brands';

    /**
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'logo_url',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return HasMany<PlatformCarEloquent, $this>
     */
    public function platformCars(): HasMany
    {
        return $this->hasMany(PlatformCarEloquent::class, 'car_brand_id');
    }
}
