<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Custom cast for double-encoded JSON data.
 *
 * This cast handles cases where JSON data has been encoded twice,
 * resulting in escaped quotes stored in the database.
 *
 * @implements CastsAttributes<array|null, array|null>
 */
class DoubleEncodedJson implements CastsAttributes
{
    /**
     * Cast the given value.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<mixed>|null
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if ($value === null) {
            return null;
        }

        // First decode (Laravel already does this for text columns)
        // But if stored as double-encoded, we get a string back
        if (is_string($value)) {
            $decoded = json_decode($value, true);

            // If result is still a string, decode again (double-encoded)
            if (is_string($decoded)) {
                $decoded = json_decode($decoded, true);
            }

            return is_array($decoded) ? $decoded : null;
        }

        // If it's already an array, return it
        return is_array($value) ? $value : null;
    }

    /**
     * Prepare the given value for storage.
     *
     * @param  array<string, mixed>  $attributes
     * @param  array<mixed>|null  $value
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        // Encode once (not double encode for new data)
        return json_encode($value);
    }
}
