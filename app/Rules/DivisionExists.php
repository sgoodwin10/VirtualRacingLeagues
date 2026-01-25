<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/**
 * Validates that a division ID exists in the divisions table.
 * Allows 0 as a special value for "no division" filter.
 */
class DivisionExists implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Allow 0 as special value for "no division" filter
        $intValue = (int) $value;
        if ($intValue === 0 || $value === null) {
            return;
        }

        $exists = DB::table('divisions')->where('id', $intValue)->exists();
        if (! $exists) {
            $fail('The selected division id is invalid.');
        }
    }
}
