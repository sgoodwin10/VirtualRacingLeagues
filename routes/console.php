<?php

declare(strict_types=1);

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule GT7 car import to run monthly on the 1st at 3:00 AM
Schedule::command('app:import-gt7-cars')
    ->monthlyOn(1, '03:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->emailOutputOnFailure(config('app.admin_email', 'admin@example.com'));

// Schedule notification logs cleanup to run daily at 2:00 AM
Schedule::command('notifications:cleanup')
    ->daily()
    ->at('02:00')
    ->withoutOverlapping()
    ->runInBackground();
