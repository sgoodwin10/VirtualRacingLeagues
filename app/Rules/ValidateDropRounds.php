<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that total_drop_rounds is 0 when drop_round is disabled.
 *
 * Business Rule: If drop_round=false, then total_drop_rounds MUST be 0.
 */
class ValidateDropRounds implements DataAwareRule, ValidationRule
{
    /**
     * All of the data under validation.
     *
     * @var array<string, mixed>
     */
    protected array $data = [];

    /**
     * Set the data under validation.
     *
     * @param  array<string, mixed>  $data
     */
    public function setData(array $data): static
    {
        $this->data = $data;

        return $this;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Get drop_round value from the data
        $dropRound = $this->data['drop_round'] ?? null;

        // Skip validation if drop_round is null (for update scenarios where it's optional)
        if ($dropRound === null) {
            return;
        }

        // Convert to boolean (handles strings, integers, and booleans)
        $dropRoundBool = is_string($dropRound)
            ? filter_var($dropRound, FILTER_VALIDATE_BOOLEAN)
            : (bool) $dropRound;

        // Cast value to int for type-safe comparison
        $totalDropRounds = (int) $value;

        // If drop_round is false, total_drop_rounds must be 0
        if ($dropRoundBool === false && $totalDropRounds !== 0) {
            $fail('The total drop rounds must be 0 when drop round is disabled.');
        }
    }
}
