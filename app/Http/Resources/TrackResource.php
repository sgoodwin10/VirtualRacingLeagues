<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrack;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property PlatformTrack $resource
 */
class TrackResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'platform_id' => $this->resource->platform_id,
            'name' => $this->resource->name,
            'slug' => $this->resource->slug,
            'is_reverse' => $this->resource->is_reverse,
            'image_path' => $this->resource->image_path,
            'length_meters' => $this->resource->length_meters,
            'is_active' => $this->resource->is_active,
            'sort_order' => $this->resource->sort_order,
            'location' => [
                'id' => $this->resource->location->id,
                'name' => $this->resource->location->name,
                'country' => $this->resource->location->country,
            ],
        ];
    }
}
