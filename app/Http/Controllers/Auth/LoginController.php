<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Application\User\DTOs\LoginCredentialsData;
use App\Application\User\Services\UserAuthService;
use App\Domain\User\Exceptions\InvalidCredentialsException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;

/**
 * Handles user login and logout.
 */
final class LoginController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {
    }

    /**
     * Authenticate user and create session.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $userData = $this->authService->login(
                LoginCredentialsData::from($request->validated())
            );

            return ApiResponse::success([
                'user' => $userData->toArray(),
                'message' => 'Logged in successfully',
            ]);
        } catch (InvalidCredentialsException $e) {
            return ApiResponse::error('Invalid credentials provided', null, 422);
        }
    }

    /**
     * Logout the current user.
     */
    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return ApiResponse::success(['message' => 'Logged out successfully']);
    }

    /**
     * Get the currently authenticated user.
     */
    public function me(): JsonResponse
    {
        $userData = $this->authService->getCurrentUserData();

        if (! $userData) {
            return ApiResponse::error('Unauthenticated', null, 401);
        }

        return ApiResponse::success([
            'user' => $userData->toArray(),
        ]);
    }
}
