<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Admin\DTOs\SiteConfigData;
use App\Application\Admin\Services\SiteConfigApplicationService;
use App\Domain\SiteConfig\Exceptions\FileUploadException;
use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSiteConfigRequest;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class SiteConfigController extends Controller
{
    public function __construct(
        private readonly SiteConfigApplicationService $service
    ) {
    }

    /**
     * Display the active site configuration.
     */
    public function show(): JsonResponse
    {
        try {
            $config = $this->service->getConfiguration();

            return ApiResponse::success(SiteConfigData::fromEntity($config));
        } catch (\Exception $e) {
            Log::error('Failed to retrieve site configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Failed to retrieve site configuration',
                config('app.debug') ? ['error' => $e->getMessage()] : null,
                500
            );
        }
    }

    /**
     * Update the site configuration.
     */
    public function update(UpdateSiteConfigRequest $request): JsonResponse
    {
        try {
            $validatedData = $request->validated();
            $config = $this->service->updateConfiguration($validatedData);

            // Log the activity
            /** @var Admin|null $admin */
            $admin = auth('admin')->user();

            // Prepare changes data for logging (exclude file uploads)
            /** @var array<string, mixed> $validatedData */
            $logData = collect($validatedData)
                ->except(['logo', 'favicon'])
                ->toArray();

            if ($admin instanceof Admin) {
                activity('admin')
                    ->causedBy($admin)
                    ->withProperties([
                        'changes' => $logData,
                        'admin_name' => $admin->name,
                        'ip_address' => $request->ip(),
                    ])
                    ->log('Admin updated site configuration');
            }

            return ApiResponse::success(
                SiteConfigData::fromEntity($config),
                'Site configuration updated successfully'
            );
        } catch (InvalidConfigurationException $e) {
            return ApiResponse::validationError(
                ['error' => $e->getMessage()],
                'Invalid configuration data'
            );
        } catch (FileUploadException $e) {
            return ApiResponse::validationError(
                ['error' => $e->getMessage()],
                'File upload failed'
            );
        } catch (\Exception $e) {
            Log::error('Failed to update site configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Failed to update site configuration',
                config('app.debug') ? ['error' => $e->getMessage()] : null,
                500
            );
        }
    }
}
