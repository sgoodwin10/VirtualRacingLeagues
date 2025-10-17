<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Application\User\DTOs\UpdateProfileData;
use App\Application\User\Services\UserAuthService;
use App\Domain\User\Exceptions\InvalidCredentialsException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;

/**
 * Handles user profile management.
 */
final class ProfileController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {
    }

    /**
     * Update user profile.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->authService->getCurrentUser();

        if (!$user) {
            return ApiResponse::error('Unauthenticated', null, 401);
        }

        try {
            $userData = $this->authService->updateProfile(
                $user->id() ?? 0,
                UpdateProfileData::from($request->validated())
            );

            return ApiResponse::success([
                'user' => $userData->toArray(),
                'message' => 'Profile updated successfully',
            ]);
        } catch (InvalidCredentialsException $e) {
            return ApiResponse::error('Invalid current password', null, 422);
        }
    }
}
