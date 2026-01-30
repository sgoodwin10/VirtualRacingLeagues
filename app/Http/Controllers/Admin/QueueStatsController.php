<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Laravel\Horizon\Contracts\MasterSupervisorRepository;
use Laravel\Horizon\Contracts\MetricsRepository;

/**
 * Queue Stats Controller
 *
 * Provides queue monitoring statistics for the admin dashboard.
 * Proxies data from Laravel Horizon.
 */
class QueueStatsController extends Controller
{
    /**
     * Get current queue statistics
     */
    public function index(
        MetricsRepository $metrics,
        MasterSupervisorRepository $supervisors
    ): JsonResponse {
        try {
            $activeSupervisors = collect($supervisors->all());

            // Calculate status based on active supervisors
            $status = $activeSupervisors->isNotEmpty() ? 'running' : 'inactive';

            // Get metrics from Horizon
            $jobsPerMinute = $metrics->jobsProcessedPerMinute();

            // Get failed and recent jobs counts from Redis directly
            /** @var \Illuminate\Redis\Connections\Connection $redis */
            $redis = app('redis')->connection('horizon');
            $failedJobsCount = $redis->zcard('failed_jobs');
            $recentJobsCount = $redis->zcard('recent_jobs');

            // Count total processes
            $processes = $activeSupervisors->sum(function ($supervisor) {
                return count($supervisor->processes ?? []);
            });

            return ApiResponse::success([
                'status' => $status,
                'jobsPerMinute' => round($jobsPerMinute, 2),
                'failedJobs' => is_int($failedJobsCount) ? $failedJobsCount : 0,
                'processes' => $processes,
                'recentJobs' => is_int($recentJobsCount) ? $recentJobsCount : 0,
            ]);
        } catch (\Exception $e) {
            // Horizon might not be available (not running, not installed, etc.)
            return ApiResponse::error(
                'Queue monitoring unavailable',
                null,
                503
            );
        }
    }
}
