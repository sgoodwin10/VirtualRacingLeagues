<?php

declare(strict_types=1);

namespace App\Providers;

use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent as AdminModel;
use App\Models\Admin;
use App\Policies\AdminPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        AdminModel::class => AdminPolicy::class,
        Admin::class => AdminPolicy::class, // Proxy class also uses same policy
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
