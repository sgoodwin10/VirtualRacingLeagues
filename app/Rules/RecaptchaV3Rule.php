<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Log;
use Lunaweb\RecaptchaV3\Facades\RecaptchaV3;

/**
 * Validates Google reCAPTCHA v3 token.
 *
 * Can be disabled via RECAPTCHAV3_ENABLED=false for development.
 */
class RecaptchaV3Rule implements ValidationRule
{
    public function __construct(
        private readonly string $action,
        private readonly ?float $minScore = null
    ) {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Skip validation if reCAPTCHA is disabled
        if (!config('recaptchav3.enabled', true)) {
            return;
        }

        // Skip if no token provided (will be caught by 'required' rule if needed)
        if (empty($value)) {
            $fail('The reCAPTCHA verification is required.');
            return;
        }

        $minScore = $this->minScore ?? config('recaptchav3.min_score', 0.5);

        try {
            $score = RecaptchaV3::verify($value, $this->action);

            if ($score === false || $score < $minScore) {
                $fail('The reCAPTCHA verification failed. Please try again.');
            }
        } catch (\Exception $e) {
            // Log the error but don't expose details to user
            Log::warning('reCAPTCHA verification failed', [
                'action' => $this->action,
                'error' => $e->getMessage(),
            ]);
            $fail('The reCAPTCHA verification failed. Please try again.');
        }
    }
}
