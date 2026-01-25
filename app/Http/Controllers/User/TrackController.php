<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrack;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrackLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackController extends Controller
{
    /**
     * Get track locations with their tracks, grouped by location.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform_id' => 'required|integer|exists:platforms,id',
            'search' => 'nullable|string|max:255',
            'is_active' => 'nullable|in:true,false,1,0',
        ]);

        /** @var int $platformId */
        $platformId = $validated['platform_id'];

        // Query locations instead of individual tracks
        /** @var \Illuminate\Database\Eloquent\Builder<PlatformTrackLocation> $query */
        $query = PlatformTrackLocation::query();

        $query->with([
            'tracks' => function ($trackQuery) use ($platformId, $validated) {
                $trackQuery->where('platform_id', $platformId)
                    ->orderBy('sort_order');

                // Apply is_active filter to tracks if provided
                if (isset($validated['is_active'])) {
                    $isActive = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
                    $trackQuery->where('is_active', $isActive);
                }
            },
        ])
            ->where('is_active', true)
            ->orderBy('sort_order');

        // Search by location name or track name if provided
        if (! empty($validated['search'])) {
            $searchTerm = $validated['search'];
            $query->where(function ($q) use ($searchTerm, $platformId, $validated) {
                // Search in location name
                $q->where('name', 'like', '%' . $searchTerm . '%')
                    // OR search in track names (with platform and is_active filters)
                    ->orWhereHas('tracks', function ($trackQuery) use ($searchTerm, $platformId, $validated) {
                        $trackQuery->where('name', 'like', '%' . $searchTerm . '%')
                            ->where('platform_id', $platformId);

                        // Apply is_active filter if provided
                        if (isset($validated['is_active'])) {
                            $isActive = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
                            $trackQuery->where('is_active', $isActive);
                        }
                    });
            });
        }

        $locations = $query->get();

        // Filter out locations that have no tracks after applying the platform filter
        $locations = $locations->filter(function ($location) {
            return $location->tracks->isNotEmpty();
        });

        // Transform the collection to array format without the extra 'data' wrapper
        $transformedLocations = $locations->map(function ($location) {
            return [
                'id' => $location->id,
                'name' => $location->name,
                'slug' => $location->slug,
                'country' => $location->country,
                'is_active' => $location->is_active,
                'sort_order' => $location->sort_order,
                'tracks' => $location->tracks->map(function ($track) {
                    return [
                        'id' => $track->id,
                        'platform_id' => $track->platform_id,
                        'platform_track_location_id' => $track->platform_track_location_id,
                        'name' => $track->name,
                        'slug' => $track->slug,
                        'is_reverse' => $track->is_reverse,
                        'image_path' => $track->image_path,
                        'length_meters' => $track->length_meters,
                        'is_active' => $track->is_active,
                        'sort_order' => $track->sort_order,
                        'created_at' => $track->created_at?->toIso8601String(),
                        'updated_at' => $track->updated_at?->toIso8601String(),
                    ];
                })->toArray(),
            ];
        })->values()->toArray();

        return ApiResponse::success($transformedLocations);
    }

    /**
     * Get a single track by ID.
     */
    public function show(int $id): JsonResponse
    {
        $track = PlatformTrack::with('location')->find($id);

        if (! $track) {
            return ApiResponse::error('Track not found', null, 404);
        }

        $transformedTrack = [
            'id' => $track->id,
            'platform_id' => $track->platform_id,
            'platform_track_location_id' => $track->platform_track_location_id,
            'name' => $track->name,
            'slug' => $track->slug,
            'is_reverse' => $track->is_reverse,
            'image_path' => $track->image_path,
            'length_meters' => $track->length_meters,
            'is_active' => $track->is_active,
            'sort_order' => $track->sort_order,
            'created_at' => $track->created_at?->toIso8601String(),
            'updated_at' => $track->updated_at?->toIso8601String(),
            'location' => [
                'id' => $track->location->id,
                'name' => $track->location->name,
                'slug' => $track->location->slug,
                'country' => $track->location->country,
                'is_active' => $track->location->is_active,
                'sort_order' => $track->location->sort_order,
            ],
        ];

        return ApiResponse::success($transformedTrack);
    }
}
