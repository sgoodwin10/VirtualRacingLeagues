<?php

declare(strict_types=1);

namespace App\Providers;

use App\Application\Admin\DTOs\AdminData;
use App\Application\Admin\DTOs\CreateAdminData;
use App\Application\Admin\DTOs\DetailedAdminData;
use App\Application\Admin\DTOs\SiteConfigData;
use App\Application\Admin\DTOs\SiteConfigFileData;
use App\Application\Admin\DTOs\UpdateAdminData;
use App\Application\User\DTOs\CreateUserData;
use App\Application\User\DTOs\DetailedUserData;
use App\Application\User\DTOs\UpdateUserData;
use App\Application\User\DTOs\UserData;
use App\Data\AdminData as LegacyAdminData;
use App\Data\CreateAdminData as LegacyCreateAdminData;
use App\Data\CreateUserData as LegacyCreateUserData;
use App\Data\DetailedAdminData as LegacyDetailedAdminData;
use App\Data\DetailedUserData as LegacyDetailedUserData;
use App\Data\SiteConfigData as LegacySiteConfigData;
use App\Data\SiteConfigFileData as LegacySiteConfigFileData;
use App\Data\UpdateAdminData as LegacyUpdateAdminData;
use App\Data\UpdateUserData as LegacyUpdateUserData;
use App\Data\UserData as LegacyUserData;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force URL generation to always use APP_URL with port
        // This ensures email verification URLs and other generated URLs include the correct port
        URL::forceRootUrl(config('app.url'));

        // DTO aliases for backward compatibility
        // These maintain compatibility with existing test files and external references
        // Future development should use the full namespaced DTOs directly
        // Suppress errors if alias already exists (happens during parallel tests)
        @class_alias(AdminData::class, LegacyAdminData::class);
        @class_alias(CreateAdminData::class, LegacyCreateAdminData::class);
        @class_alias(UpdateAdminData::class, LegacyUpdateAdminData::class);
        @class_alias(DetailedAdminData::class, LegacyDetailedAdminData::class);
        @class_alias(UserData::class, LegacyUserData::class);
        @class_alias(CreateUserData::class, LegacyCreateUserData::class);
        @class_alias(UpdateUserData::class, LegacyUpdateUserData::class);
        @class_alias(DetailedUserData::class, LegacyDetailedUserData::class);
        @class_alias(SiteConfigData::class, LegacySiteConfigData::class);
        @class_alias(SiteConfigFileData::class, LegacySiteConfigFileData::class);

        // No morph map needed - we'll override getMorphClass() in the models
    }
}
