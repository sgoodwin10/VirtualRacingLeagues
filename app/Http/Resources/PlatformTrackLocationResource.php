<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrackLocation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property PlatformTrackLocation $resource
 */
class PlatformTrackLocationResource extends JsonResource
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
            'name' => $this->resource->name,
            'country' => $this->resource->country,
            'tracks' => $this->resource->tracks->map(function ($track) {
                return [
                    'id' => $track->id,
                    'name' => $track->name,
                    'is_reverse' => $track->is_reverse,
                    'length_meters' => $track->length_meters,
                    'is_active' => $track->is_active,
                    'sort_order' => $track->sort_order,
                    'slug' => $track->slug,
                    'image_path' => $track->image_path,
                ];
            })->toArray(),
        ];
    }
}
