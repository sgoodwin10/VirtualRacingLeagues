<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Application\User\DTOs\RequestPasswordResetData;
use App\Application\User\DTOs\ResetPasswordData;
use App\Application\User\Services\UserAuthService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

/**
 * Handles password reset functionality.
 */
final class PasswordResetController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {
    }

    /**
     * Send password reset link to user.
     */
    public function requestReset(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = $this->authService->requestPasswordReset(
            RequestPasswordResetData::from($request->only('email'))
        );

        return $status === Password::RESET_LINK_SENT
            ? ApiResponse::success(['message' => 'Password reset link sent to your email'])
            : ApiResponse::error('Unable to send reset link. Please try again.', null, 422);
    }

    /**
     * Reset user's password.
     */
    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = $this->authService->resetPassword(
            ResetPasswordData::from($request->validated())
        );

        return $status === Password::PASSWORD_RESET
            ? ApiResponse::success(['message' => 'Password reset successfully'])
            : ApiResponse::error('Unable to reset password. The link may be invalid or expired.', null, 422);
    }
}
