<?php

declare(strict_types=1);

namespace App\Models;

use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;

/**
 * Proxy model for User.
 *
 * This class exists solely for Laravel framework features that require
 * an Eloquent model in the App\Models namespace:
 * - Authorization (Gates and Policies)
 * - Activity Logging (spatie/laravel-activitylog)
 * - Form Requests
 *
 * DO NOT use this class for business logic or queries. Instead:
 * - Use UserApplicationService for use cases
 * - Use UserRepositoryInterface for data access
 * - Use User domain entity for business logic
 *
 * This is a lightweight proxy that extends the infrastructure layer's
 * UserEloquent model without adding any additional behavior.
 *
 * @extends UserEloquent
 */
class User extends UserEloquent
{
    // This class intentionally left empty - it's just a namespace proxy
    // All functionality is inherited from UserEloquent
}
