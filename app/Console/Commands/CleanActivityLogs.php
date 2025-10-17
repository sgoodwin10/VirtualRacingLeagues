<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\ActivityLogService;
use Illuminate\Console\Command;

/**
 * Command to clean old activity logs.
 */
class CleanActivityLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'activitylog:clean {--days=365 : Number of days to keep}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean activity logs older than the specified number of days';

    /**
     * Execute the console command.
     */
    public function handle(ActivityLogService $activityLogService): int
    {
        $days = (int) $this->option('days');

        $this->info("Cleaning activity logs older than {$days} days...");

        $deletedCount = $activityLogService->deleteOldActivities($days);

        if ($deletedCount > 0) {
            $this->info("Successfully deleted {$deletedCount} old activity log(s).");
        } else {
            $this->info('No old activity logs to delete.');
        }

        return self::SUCCESS;
    }
}
