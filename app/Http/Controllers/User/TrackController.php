<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlatformTrackLocationResource;
use App\Http\Resources\TrackResource;
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

        // Search by location name if provided
        if (!empty($validated['search'])) {
            $query->where('name', 'like', '%' . $validated['search'] . '%');
        }

        $locations = $query->get();

        // Filter out locations that have no tracks after applying the platform filter
        $locations = $locations->filter(function ($location) {
            return $location->tracks->isNotEmpty();
        });

        return ApiResponse::success(
            PlatformTrackLocationResource::collection($locations)->toArray($request)
        );
    }

    /**
     * Get a single track by ID.
     */
    public function show(int $id): JsonResponse
    {
        $track = PlatformTrack::with('location')->find($id);

        if (!$track) {
            return ApiResponse::error('Track not found', null, 404);
        }

        return ApiResponse::success(
            (new TrackResource($track))->toArray(request())
        );
    }
}
