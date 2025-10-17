<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Application\User\DTOs\RegisterUserData;
use App\Application\User\Services\UserAuthService;
use App\Domain\User\Exceptions\UserAlreadyExistsException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Http\JsonResponse;

/**
 * Handles user registration.
 */
final class RegisterController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {
    }

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $userData = $this->authService->register(
                RegisterUserData::from($request->validated())
            );

            return ApiResponse::created([
                'message' => 'Registration successful. Please check your email to verify your account.',
                'user' => [
                    'id' => $userData->id,
                    'email' => $userData->email,
                ],
            ]);
        } catch (UserAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }
}
