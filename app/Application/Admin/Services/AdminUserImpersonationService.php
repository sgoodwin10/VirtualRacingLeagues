<?php

declare(strict_types=1);

namespace App\Application\Admin\Services;

use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\Events\UserImpersonationStarted;
use App\Domain\Admin\Repositories\AdminRepositoryInterface;
use App\Domain\Admin\ValueObjects\AdminRole;
use App\Domain\User\Entities\User;
use App\Domain\User\Events\UserImpersonated;
use App\Domain\User\Exceptions\UserNotFoundException;
use App\Domain\User\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

/**
 * Admin User Impersonation Service.
 * Handles secure impersonation of users by admins.
 */
final class AdminUserImpersonationService
{
    private const TOKEN_EXPIRY_SECONDS = 300; // 5 minutes
    private const REDIS_KEY_PREFIX = 'user_impersonation:';

    public function __construct(
        private readonly AdminRepositoryInterface $adminRepository,
        private readonly UserRepositoryInterface $userRepository,
    ) {
    }

    /**
     * Generate an impersonation token for a user.
     *
     * @param int $userId The user to impersonate
     * @param int $adminId The admin performing the impersonation
     * @return string The generated token
     * @throws UserNotFoundException If user not found
     * @throws \DomainException If user is an admin or authorization fails
     */
    public function generateImpersonationToken(int $userId, int $adminId): string
    {
        // Get the admin performing the impersonation
        $admin = $this->adminRepository->findById($adminId);

        // Check admin authorization (only super_admin and admin can impersonate)
        if (!$this->canImpersonate($admin)) {
            throw new \DomainException('Only super admins and admins can impersonate users');
        }

        // Get the user to impersonate
        $user = $this->userRepository->findById($userId);

        // Business Rule: Cannot impersonate deleted users
        if ($user->isDeleted()) {
            throw new \DomainException('Cannot impersonate deleted users');
        }

        // Generate secure token (UUID v4)
        $token = Str::uuid()->toString();

        // Store token in Redis with expiry
        $data = [
            'user_id' => $userId,
            'admin_id' => $adminId,
            'admin_email' => $admin->email()->value(),
            'user_email' => $user->email()->value(),
            'created_at' => now()->toIso8601String(),
            'expires_at' => now()->addSeconds(self::TOKEN_EXPIRY_SECONDS)->toIso8601String(),
        ];

        $redisKey = self::REDIS_KEY_PREFIX . $token;
        /** @phpstan-ignore-next-line */
        Redis::setex($redisKey, self::TOKEN_EXPIRY_SECONDS, json_encode($data, JSON_THROW_ON_ERROR));

        // Dispatch domain event
        Event::dispatch(new UserImpersonationStarted(
            adminId: $adminId,
            adminEmail: $admin->email()->value(),
            userId: $userId,
            userEmail: $user->email()->value(),
            token: $token,
        ));

        return $token;
    }

    /**
     * Consume an impersonation token and return the user to impersonate.
     *
     * @param string $token The impersonation token
     * @return array{user: User, admin_id: int, admin_email: string} User and admin info
     * @throws \DomainException If token is invalid or expired
     * @throws UserNotFoundException If user not found
     */
    public function consumeImpersonationToken(string $token): array
    {
        $redisKey = self::REDIS_KEY_PREFIX . $token;

        // Get token data from Redis
        /** @phpstan-ignore-next-line */
        $data = Redis::get($redisKey);

        if ($data === null) {
            throw new \DomainException('Invalid or expired impersonation token');
        }

        // Delete the token (single-use)
        /** @phpstan-ignore-next-line */
        Redis::del($redisKey);

        // Parse token data
        $tokenData = json_decode($data, true, 512, JSON_THROW_ON_ERROR);

        // Get the user
        $user = $this->userRepository->findById($tokenData['user_id']);

        // Business Rule: Cannot impersonate deleted users
        if ($user->isDeleted()) {
            throw new \DomainException('Cannot impersonate deleted users');
        }

        // Dispatch domain event
        Event::dispatch(new UserImpersonated(
            userId: $user->id() ?? 0,
            userEmail: $user->email()->value(),
            adminId: $tokenData['admin_id'],
            adminEmail: $tokenData['admin_email'],
        ));

        return [
            'user' => $user,
            'admin_id' => $tokenData['admin_id'],
            'admin_email' => $tokenData['admin_email'],
        ];
    }

    /**
     * Check if an admin can impersonate users.
     */
    private function canImpersonate(Admin $admin): bool
    {
        // Only super_admin and admin roles can impersonate
        return $admin->role()->isSuperAdmin() || $admin->role()->isAdmin();
    }
}
