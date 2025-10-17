<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Application\User\Services\UserAuthService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Handles email verification.
 */
final class EmailVerificationController extends Controller
{
    public function __construct(
        private readonly UserAuthService $authService
    ) {
    }

    /**
     * Verify user's email address.
     * Redirects to frontend with status query parameter.
     */
    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        try {
            $verified = $this->authService->verifyEmail($id, $hash);

            if (!$verified) {
                $errorReason = urlencode('Invalid or expired verification link');
                return redirect("/verify-email-result?status=error&reason={$errorReason}");
            }

            return redirect('/verify-email-result?status=success');
        } catch (\Exception $e) {
            $errorReason = urlencode('An error occurred during verification');
            return redirect("/verify-email-result?status=error&reason={$errorReason}");
        }
    }

    /**
     * Resend email verification notification.
     */
    public function resend(Request $request): JsonResponse
    {
        $user = $this->authService->getCurrentUser();

        if (!$user) {
            return ApiResponse::error('Unauthenticated', null, 401);
        }

        if ($user->isEmailVerified()) {
            return ApiResponse::error('Email already verified', null, 422);
        }

        $this->authService->resendVerificationEmail($user);

        return ApiResponse::success(['message' => 'Verification email sent']);
    }
}
