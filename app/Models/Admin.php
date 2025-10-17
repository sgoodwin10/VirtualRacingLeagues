<?php

declare(strict_types=1);

namespace App\Models;

use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;

/**
 * Proxy model for Admin.
 *
 * This class exists solely for Laravel framework features that require
 * an Eloquent model in the App\Models namespace:
 * - Authorization (Gates and Policies)
 * - Activity Logging (spatie/laravel-activitylog)
 * - Form Requests
 *
 * DO NOT use this class for business logic or queries. Instead:
 * - Use AdminApplicationService for use cases
 * - Use AdminRepositoryInterface for data access
 * - Use Admin domain entity for business logic
 *
 * This is a lightweight proxy that extends the infrastructure layer's
 * AdminEloquent model without adding any additional behavior.
 *
 * @extends AdminEloquent
 */
class Admin extends AdminEloquent
{
    // This class intentionally left empty - it's just a namespace proxy
    // All functionality is inherited from AdminEloquent
}
