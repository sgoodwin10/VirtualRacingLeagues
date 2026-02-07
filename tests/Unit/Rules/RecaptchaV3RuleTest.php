<?php

declare(strict_types=1);

namespace Tests\Unit\Rules;

use App\Rules\RecaptchaV3Rule;
use Illuminate\Support\Facades\Config;
use Lunaweb\RecaptchaV3\Facades\RecaptchaV3;
use Tests\TestCase;

class RecaptchaV3RuleTest extends TestCase
{
    public function test_passes_when_recaptcha_disabled(): void
    {
        Config::set('recaptchav3.enabled', false);

        $rule = new RecaptchaV3Rule('login');
        $failed = false;

        $rule->validate('recaptcha_token', 'any-token', function () use (&$failed) {
            $failed = true;
        });

        $this->assertFalse($failed);
    }

    public function test_fails_when_token_empty(): void
    {
        Config::set('recaptchav3.enabled', true);

        $rule = new RecaptchaV3Rule('login');
        $failed = false;

        $rule->validate('recaptcha_token', '', function () use (&$failed) {
            $failed = true;
        });

        $this->assertTrue($failed);
    }

    public function test_fails_when_token_null(): void
    {
        Config::set('recaptchav3.enabled', true);

        $rule = new RecaptchaV3Rule('login');
        $failed = false;

        $rule->validate('recaptcha_token', null, function () use (&$failed) {
            $failed = true;
        });

        $this->assertTrue($failed);
    }

    public function test_passes_when_score_above_threshold(): void
    {
        Config::set('recaptchav3.enabled', true);
        Config::set('recaptchav3.min_score', 0.5);

        RecaptchaV3::shouldReceive('verify')
            ->once()
            ->with('valid-token', 'login')
            ->andReturn(0.9);

        $rule = new RecaptchaV3Rule('login');
        $failed = false;

        $rule->validate('recaptcha_token', 'valid-token', function () use (&$failed) {
            $failed = true;
        });

        $this->assertFalse($failed);
    }

    public function test_passes_when_score_equals_threshold(): void
    {
        Config::set('recaptchav3.enabled', true);
        Config::set('recaptchav3.min_score', 0.5);

        RecaptchaV3::shouldReceive('verify')
            ->once()
            ->with('valid-token', 'login')
            ->andReturn(0.5);

        $rule = new RecaptchaV3Rule('login');
        $failed = false;

        $rule->validate('recaptcha_token', 'valid-token', function () use (&$failed) {
            $failed = true;
        });

        $this->assertFalse($failed);
    }

    public function test_fails_when_score_below_threshold(): void
    {
        Config::set('recaptchav3.enabled', true);
        Config::set('recaptchav3.min_score', 0.5);

        RecaptchaV3::shouldReceive('verify')
            ->once()
            ->with('bot-token', 'login')
            ->andReturn(0.1);

        $rule = new RecaptchaV3Rule('login');
        $failed = false;

        $rule->validate('recaptcha_token', 'bot-token', function () use (&$failed) {
            $failed = true;
        });

        $this->assertTrue($failed);
    }

    public function test_fails_when_verification_returns_false(): void
    {
        Config::set('recaptchav3.enabled', true);
        Config::set('recaptchav3.min_score', 0.5);

        RecaptchaV3::shouldReceive('verify')
            ->once()
            ->with('invalid-token', 'register')
            ->andReturn(false);

        $rule = new RecaptchaV3Rule('register');
        $failed = false;

        $rule->validate('recaptcha_token', 'invalid-token', function () use (&$failed) {
            $failed = true;
        });

        $this->assertTrue($failed);
    }

    public function test_fails_when_exception_thrown(): void
    {
        Config::set('recaptchav3.enabled', true);

        RecaptchaV3::shouldReceive('verify')
            ->once()
            ->with('error-token', 'admin_login')
            ->andThrow(new \Exception('Network error'));

        $rule = new RecaptchaV3Rule('admin_login');
        $failed = false;

        $rule->validate('recaptcha_token', 'error-token', function () use (&$failed) {
            $failed = true;
        });

        $this->assertTrue($failed);
    }

    public function test_uses_custom_min_score_when_provided(): void
    {
        Config::set('recaptchav3.enabled', true);
        Config::set('recaptchav3.min_score', 0.5);

        RecaptchaV3::shouldReceive('verify')
            ->once()
            ->with('valid-token', 'login')
            ->andReturn(0.7);

        // Custom min score of 0.8 (higher than default 0.5)
        $rule = new RecaptchaV3Rule('login', 0.8);
        $failed = false;

        $rule->validate('recaptcha_token', 'valid-token', function () use (&$failed) {
            $failed = true;
        });

        // Should fail because 0.7 < 0.8 (custom threshold)
        $this->assertTrue($failed);
    }

    public function test_different_actions_are_verified_correctly(): void
    {
        Config::set('recaptchav3.enabled', true);
        Config::set('recaptchav3.min_score', 0.5);

        RecaptchaV3::shouldReceive('verify')
            ->once()
            ->with('token', 'admin_login')
            ->andReturn(0.9);

        $rule = new RecaptchaV3Rule('admin_login');
        $failed = false;

        $rule->validate('recaptcha_token', 'token', function () use (&$failed) {
            $failed = true;
        });

        $this->assertFalse($failed);
    }
}
