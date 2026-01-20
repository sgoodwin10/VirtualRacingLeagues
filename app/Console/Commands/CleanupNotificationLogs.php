<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Application\Notification\Services\NotificationApplicationService;
use Illuminate\Console\Command;

final class CleanupNotificationLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:cleanup {--days= : Days to keep notification logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete old notification logs based on retention policy';

    public function __construct(
        private readonly NotificationApplicationService $notificationService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = $this->option('days')
            ? (int) $this->option('days')
            : config('notifications.retention.days', 90);

        $this->info("Cleaning up notification logs older than {$days} days...");

        $deleted = $this->notificationService->cleanupOldNotifications($days);

        $this->info("Deleted {$deleted} notification log(s) older than {$days} days.");

        return self::SUCCESS;
    }
}
