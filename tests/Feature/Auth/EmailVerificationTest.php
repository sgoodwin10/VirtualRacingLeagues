<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * Feature tests for email verification.
 */
class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_verify_email(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->get($verificationUrl);

        $response->assertRedirect('/verify-email-result?status=success');

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_email_verification_fails_with_invalid_hash(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => 'invalid-hash']
        );

        $response = $this->get($verificationUrl);

        $response->assertRedirect();
        $response->assertRedirectContains('/verify-email-result?status=error');
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_already_verified_email_returns_success(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->get($verificationUrl);

        $response->assertRedirect('/verify-email-result?status=success');
    }

    public function test_authenticated_user_can_resend_verification_email(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/email/resend');

        $response->assertStatus(200);
        $response->assertJson([
            'data' => ['message' => 'Verification email sent'],
        ]);
    }

    public function test_verified_user_cannot_resend_verification_email(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/email/resend');

        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Email already verified',
        ]);
    }

    public function test_guest_cannot_resend_verification_email(): void
    {
        $response = $this->postJson('/api/email/resend');

        $response->assertStatus(401);
    }

    public function test_email_verification_fails_with_invalid_signature(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        // Create URL without signed middleware (invalid signature)
        $invalidUrl = route('verification.verify', [
            'id' => $user->id,
            'hash' => sha1($user->email),
        ]);

        $response = $this->get($invalidUrl);

        // Laravel's signed middleware will return 403 for invalid signatures
        $response->assertStatus(403);
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_email_verification_fails_with_expired_link(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        // Create an expired signed URL (expired 1 hour ago)
        $expiredUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->subHour(),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->get($expiredUrl);

        // Laravel's signed middleware will return 403 for expired signatures
        $response->assertStatus(403);
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_email_verification_fails_with_nonexistent_user(): void
    {
        $nonexistentId = 99999;

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $nonexistentId, 'hash' => 'some-hash']
        );

        $response = $this->get($verificationUrl);

        $response->assertRedirect();
        $response->assertRedirectContains('/verify-email-result?status=error');
    }
}
