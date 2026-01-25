<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that teams_total_drop_rounds is 0 or null when teams_drop_rounds is disabled.
 *
 * Business Rule: If teams_drop_rounds=false, then teams_total_drop_rounds MUST be 0 or null.
 */
class ValidateTeamsDropRounds implements DataAwareRule, ValidationRule
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
        // Get teams_drop_rounds value from the data
        $teamsDropRounds = $this->data['teams_drop_rounds'] ?? null;

        // Skip validation if teams_drop_rounds is null (for update scenarios where it's optional)
        if ($teamsDropRounds === null) {
            return;
        }

        // Convert to boolean (handles strings, integers, and booleans)
        $teamsDropRoundsBool = is_string($teamsDropRounds)
            ? filter_var($teamsDropRounds, FILTER_VALIDATE_BOOLEAN)
            : (bool) $teamsDropRounds;

        // Skip if value is null (allowed when disabled)
        if ($value === null) {
            return;
        }

        // Cast value to int for type-safe comparison
        $teamsTotalDropRounds = (int) $value;

        // If teams_drop_rounds is false, teams_total_drop_rounds must be 0
        if ($teamsDropRoundsBool === false && $teamsTotalDropRounds !== 0) {
            $fail('The teams total drop rounds must be 0 or null when teams drop rounds is disabled.');
        }
    }
}
