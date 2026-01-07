<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/**
 * Validates that a team ID exists in the teams table.
 * Allows 0 as a special value for "no team" (privateer) filter.
 */
class TeamExists implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Allow 0 as special value for "no team" (privateer) filter
        $intValue = (int) $value;
        if ($intValue === 0 || $value === null) {
            return;
        }

        $exists = DB::table('teams')->where('id', $intValue)->exists();
        if (!$exists) {
            $fail('The selected team id is invalid.');
        }
    }
}
